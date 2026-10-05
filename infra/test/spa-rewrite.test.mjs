// Tests for the SpaRewriteFunction CloudFront Function, evaluated straight from template.yaml. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const template = readFileSync(new URL('../template.yaml', import.meta.url), 'utf8');
const [, block] = template.match(/FunctionCode: \|\n((?: {8}.*\n|\n)+)/);
const handler = new Function(`${block.replace(/^ {8}/gm, '')}\nreturn handler;`)();

const rewrite = (uri, accept) =>
  handler({ request: { uri, headers: accept ? { accept: { value: accept } } : {} } }).uri;

test('client-side routes get index.html', () => {
  assert.equal(rewrite('/machinery', 'text/html,application/xhtml+xml'), '/index.html');
  assert.equal(rewrite('/admin/products'), '/index.html');
  assert.equal(rewrite('/'), '/index.html');
});

test('files are served as-is, whatever the Accept header', () => {
  assert.equal(rewrite('/assets/index-abc.js', 'text/markdown'), '/assets/index-abc.js');
  assert.equal(rewrite('/llms.txt'), '/llms.txt');
  assert.equal(rewrite('/md/index.md', 'text/markdown'), '/md/index.md');
});

test('Accept: text/markdown gets the Markdown twin', () => {
  assert.equal(rewrite('/', 'text/markdown'), '/md/index.md');
  assert.equal(rewrite('/machinery/', 'text/markdown, text/html;q=0.8'), '/md/machinery.md');
  assert.equal(rewrite('/materials', 'text/markdown'), '/md/materials.md');
});

test('pages without a Markdown twin fall back to the SPA', () => {
  assert.equal(rewrite('/products', 'text/markdown'), '/index.html');
});
