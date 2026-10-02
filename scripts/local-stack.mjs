#!/usr/bin/env node
// Local stack for testing the site and /admin without touching AWS.
//
//   npm run local            start (state kept in .local-stack/)
//   npm run local -- --reset start from a fresh copy of seed/
//
// Runs the real Lambda handler (infra/src/handler.mjs) behind a local HTTP API,
// with S3 backed by .local-stack/, a fake Cognito, and a fake Amazon Translate
// that prefixes "[EN] " so machine translations are easy to spot. Vite serves the
// site and reads /data and /media from the same .local-stack/ folder.
import http from 'node:http';
import { spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { S3Client } from '@aws-sdk/client-s3';
import { CloudFrontClient } from '@aws-sdk/client-cloudfront';
import { TranslateClient } from '@aws-sdk/client-translate';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Optional, gitignored overrides: LOCAL_ADMIN_EMAIL, LOCAL_ADMIN_PASSWORD, LOCAL_API_PORT.
const LOCAL_ENV = join(ROOT, '.env.localstack.local');
if (existsSync(LOCAL_ENV)) process.loadEnvFile(LOCAL_ENV);
const STATE_DIR = join(ROOT, '.local-stack');
const AUTH_FILE = join(STATE_DIR, 'auth.json');
const API_PORT = Number(process.env.LOCAL_API_PORT || 8787);

// Local-only test account. The first login asks for a new password, like production.
const ADMIN_EMAIL = process.env.LOCAL_ADMIN_EMAIL || 'admin@composytex.local';
const ADMIN_TEMP_PASSWORD = process.env.LOCAL_ADMIN_PASSWORD || 'Temporal-Local-2026';
const RESET_CODE = '123456';

// ── State ───────────────────────────────────────────────────────────────────

if (process.argv.includes('--reset')) rmSync(STATE_DIR, { recursive: true, force: true });
if (!existsSync(STATE_DIR)) {
  cpSync(join(ROOT, 'seed'), STATE_DIR, { recursive: true });
  console.log('Created .local-stack/ from seed/');
}

const loadAuth = () => (existsSync(AUTH_FILE)
  ? JSON.parse(readFileSync(AUTH_FILE, 'utf8'))
  : { password: ADMIN_TEMP_PASSWORD, mustChange: true });
let auth = loadAuth();
const saveAuth = () => writeFileSync(AUTH_FILE, JSON.stringify(auth, null, 2));

const md5 = data => `"${createHash('md5').update(data).digest('hex')}"`;
const objectPath = key => {
  const path = join(STATE_DIR, key);
  if (!path.startsWith(STATE_DIR + '/')) throw new Error('Invalid key');
  return path;
};

// ── AWS SDK mocks (the handler's clients are patched in place) ─────────────

S3Client.prototype.send = async function send(command) {
  const { Key, Body, IfMatch, IfNoneMatch } = command.input;
  const path = objectPath(Key);
  switch (command.constructor.name) {
    case 'GetObjectCommand': {
      if (!existsSync(path)) throw Object.assign(new Error('NoSuchKey'), { name: 'NoSuchKey' });
      const data = readFileSync(path);
      return { Body: { transformToString: async () => data.toString('utf8') }, ETag: md5(data) };
    }
    case 'PutObjectCommand': {
      const exists = existsSync(path);
      if ((IfMatch && (!exists || md5(readFileSync(path)) !== IfMatch)) || (IfNoneMatch === '*' && exists)) {
        throw Object.assign(new Error('PreconditionFailed'), { $metadata: { httpStatusCode: 412 } });
      }
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, Body);
      console.log(`  s3   put    ${Key}`);
      return {};
    }
    case 'DeleteObjectCommand':
      if (existsSync(path)) unlinkSync(path);
      console.log(`  s3   delete ${Key}`);
      return {};
    default:
      throw new Error(`Unsupported S3 command ${command.constructor.name}`);
  }
};

CloudFrontClient.prototype.send = async command => {
  console.log(`  cdn  invalidate ${command.input.InvalidationBatch.Paths.Items.join(', ')}`);
  return {};
};

TranslateClient.prototype.send = async command => {
  console.log(`  translate "${command.input.Text.slice(0, 60)}"`);
  return { TranslatedText: `[EN] ${command.input.Text}` };
};

process.env.BUCKET = 'local';
process.env.BUCKET_REGION = 'us-east-1';
process.env.DISTRIBUTION_ID = 'LOCAL';
const { handler } = await import('../infra/src/handler.mjs');

// ── Fake Cognito (only what the admin app uses) ────────────────────────────

const sessions = new Map(); // token → { email, expiresAt }
const refreshTokens = new Map(); // refresh token → email

const cognitoError = (type, message) => ({ status: 400, body: { __type: type, message } });
// Explains a mismatch without printing the password.
function passwordHint(sent) {
  const expected = auth.password;
  const notes = [`got ${sent.length} chars, expected ${expected.length}`];
  if (sent.trim() === expected) notes.push('extra spaces around it');
  else if (sent.replace(/^['"`]|['"`]$/g, '') === expected) notes.push('it includes quotes');
  else if (sent.toLowerCase() === expected.toLowerCase()) notes.push('upper/lower case differs');
  if (auth.mustChange === false) notes.push('password was already changed; use your new one or --reset');
  return `(${notes.join('; ')})`;
}

const passwordOk = p => p.length >= 10 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p);

function issueTokens(email, withRefresh = true) {
  const idToken = randomBytes(24).toString('hex');
  sessions.set(idToken, { email, expiresAt: Date.now() + 3600_000 });
  const result = { IdToken: idToken, AccessToken: idToken, ExpiresIn: 3600, TokenType: 'Bearer' };
  if (withRefresh) {
    result.RefreshToken = randomBytes(24).toString('hex');
    refreshTokens.set(result.RefreshToken, email);
  }
  return { status: 200, body: { AuthenticationResult: result } };
}

function cognito(action, body) {
  const username = (body.Username || body.AuthParameters?.USERNAME || body.ChallengeResponses?.USERNAME || '').toLowerCase();
  const isAdmin = username === ADMIN_EMAIL;
  switch (action) {
    case 'InitiateAuth':
      if (body.AuthFlow === 'REFRESH_TOKEN_AUTH') {
        const email = refreshTokens.get(body.AuthParameters.REFRESH_TOKEN);
        return email ? issueTokens(email, false) : cognitoError('NotAuthorizedException', 'Invalid Refresh Token');
      }
      if (!isAdmin || body.AuthParameters.PASSWORD !== auth.password) {
        console.log(`  cognito login rejected for "${username}": ${isAdmin ? `wrong password ${passwordHint(body.AuthParameters.PASSWORD ?? '')}` : `unknown user (use ${ADMIN_EMAIL})`}`);
        return cognitoError('NotAuthorizedException', 'Incorrect username or password.');
      }
      if (auth.mustChange) {
        return { status: 200, body: { ChallengeName: 'NEW_PASSWORD_REQUIRED', Session: 'local-session', ChallengeParameters: {} } };
      }
      return issueTokens(ADMIN_EMAIL);
    case 'RespondToAuthChallenge':
      if (!isAdmin || body.Session !== 'local-session') return cognitoError('NotAuthorizedException', 'Invalid session');
      if (!passwordOk(body.ChallengeResponses.NEW_PASSWORD)) return cognitoError('InvalidPasswordException', 'Password does not conform to policy');
      auth = { password: body.ChallengeResponses.NEW_PASSWORD, mustChange: false };
      saveAuth();
      return issueTokens(ADMIN_EMAIL);
    case 'ForgotPassword':
      if (isAdmin) console.log(`  cognito password reset code for ${ADMIN_EMAIL}: ${RESET_CODE}`);
      return { status: 200, body: { CodeDeliveryDetails: { DeliveryMedium: 'EMAIL' } } };
    case 'ConfirmForgotPassword':
      if (!isAdmin || body.ConfirmationCode !== RESET_CODE) return cognitoError('CodeMismatchException', 'Invalid code');
      if (!passwordOk(body.Password)) return cognitoError('InvalidPasswordException', 'Password does not conform to policy');
      auth = { password: body.Password, mustChange: false };
      saveAuth();
      return { status: 200, body: {} };
    default:
      return cognitoError('InvalidParameterException', `Unsupported action ${action}`);
  }
}

// ── HTTP API ────────────────────────────────────────────────────────────────

const ROUTES = [
  ['GET', /^\/catalog$/, 'GET /catalog'],
  ['PUT', /^\/products\/([^/]+)$/, 'PUT /products/{id}'],
  ['DELETE', /^\/products\/([^/]+)$/, 'DELETE /products/{id}'],
  ['PUT', /^\/order$/, 'PUT /order'],
  ['POST', /^\/media$/, 'POST /media'],
];

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '';
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'authorization,content-type,x-amz-target');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.end();

  const send = (status, body) => {
    res.statusCode = status;
    res.setHeader('content-type', 'application/json');
    res.end(typeof body === 'string' ? body : JSON.stringify(body));
  };

  try {
    let body = '';
    for await (const chunk of req) body += chunk;
    const path = req.url.split('?')[0];

    if (path === '/cognito' && req.method === 'POST') {
      const action = String(req.headers['x-amz-target'] || '').split('.').pop();
      const result = cognito(action, JSON.parse(body || '{}'));
      console.log(`${req.method} cognito ${action} → ${result.status}`);
      return send(result.status, result.body);
    }

    const route = ROUTES.find(([method, re]) => method === req.method && re.test(path));
    if (!route) return send(404, { message: 'Not Found' });

    const token = (req.headers.authorization || '').replace(/^Bearer /, '');
    const session = sessions.get(token);
    if (!session || session.expiresAt < Date.now()) {
      console.log(`${req.method} ${path} → 401`);
      return send(401, { message: 'Unauthorized' });
    }

    const match = path.match(route[1]);
    const result = await handler({
      routeKey: route[2],
      pathParameters: match[1] ? { id: decodeURIComponent(match[1]) } : undefined,
      body: body || undefined,
    });
    console.log(`${req.method} ${path} → ${result.statusCode}`);
    return send(result.statusCode, result.body);
  } catch (err) {
    console.error(err);
    return send(500, { message: 'Local stack error' });
  }
});

server.listen(API_PORT, () => {
  console.log(`\nLocal API + fake Cognito on http://localhost:${API_PORT}`);
  console.log(`Admin login: ${ADMIN_EMAIL}${auth.mustChange ? ` / ${ADMIN_TEMP_PASSWORD} (temporary)` : ' (password already set; --reset to start over)'}\n`);
});

// ── Vite ────────────────────────────────────────────────────────────────────

const vite = spawn(process.execPath, [join(ROOT, 'node_modules/vite/bin/vite.js'), '--mode', 'localstack'], {
  cwd: ROOT,
  stdio: 'inherit',
  env: { ...process.env, LOCAL_STACK_DIR: STATE_DIR },
});
const stop = () => { vite.kill(); server.close(); process.exit(0); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
vite.on('exit', code => { server.close(); process.exit(code ?? 0); });
