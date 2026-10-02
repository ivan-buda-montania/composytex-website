import { COGNITO_CLIENT_ID, COGNITO_ENDPOINT as ENDPOINT } from './config';
const STORAGE_KEY = 'composytex-admin-session';

const ERROR_MESSAGES = {
  NotAuthorizedException: 'Correo o contraseña incorrectos.',
  UserNotFoundException: 'Correo o contraseña incorrectos.',
  InvalidPasswordException: 'La contraseña debe tener al menos 10 caracteres, con mayúsculas, minúsculas y números.',
  CodeMismatchException: 'El código es incorrecto.',
  ExpiredCodeException: 'El código expiró. Solicita uno nuevo.',
  LimitExceededException: 'Demasiados intentos. Espera unos minutos.',
  TooManyRequestsException: 'Demasiados intentos. Espera unos minutos.',
  InvalidParameterException: 'Datos inválidos. Revisa el formulario.',
};

async function cognito(action, body) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${action}`,
    },
    body: JSON.stringify({ ClientId: COGNITO_CLIENT_ID, ...body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const type = (data.__type || '').split('#').pop();
    throw new Error(ERROR_MESSAGES[type] || data.message || 'No se pudo conectar con el servicio de acceso.');
  }
  return data;
}

function saveSession(email, result, refreshToken = result.RefreshToken) {
  const session = {
    email,
    idToken: result.IdToken,
    refreshToken,
    expiresAt: Date.now() + result.ExpiresIn * 1000,
  };
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session)); } catch { /* private mode */ }
  return session;
}

export function loadSession() {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch { return null; }
}

export function signOut() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

// Returns { session } on success, or { challenge } when a new password is required.
export async function signIn(email, password) {
  const data = await cognito('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    AuthParameters: { USERNAME: email, PASSWORD: password },
  });
  if (data.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
    return { challenge: { email, session: data.Session } };
  }
  if (!data.AuthenticationResult) throw new Error('Paso de acceso no soportado.');
  return { session: saveSession(email, data.AuthenticationResult) };
}

export async function completeNewPassword({ email, session }, newPassword) {
  const data = await cognito('RespondToAuthChallenge', {
    ChallengeName: 'NEW_PASSWORD_REQUIRED',
    Session: session,
    ChallengeResponses: { USERNAME: email, NEW_PASSWORD: newPassword },
  });
  return saveSession(email, data.AuthenticationResult);
}

export function requestPasswordReset(email) {
  return cognito('ForgotPassword', { Username: email });
}

export function confirmPasswordReset(email, code, newPassword) {
  return cognito('ConfirmForgotPassword', { Username: email, ConfirmationCode: code, Password: newPassword });
}

// Returns a valid ID token, refreshing it when it is about to expire.
export async function getIdToken() {
  const session = loadSession();
  if (!session) return null;
  if (session.expiresAt - Date.now() > 60_000) return session.idToken;
  try {
    const data = await cognito('InitiateAuth', {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: { REFRESH_TOKEN: session.refreshToken },
    });
    return saveSession(session.email, data.AuthenticationResult, session.refreshToken).idToken;
  } catch {
    signOut();
    return null;
  }
}
