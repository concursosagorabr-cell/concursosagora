import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '../..');
const rootDir = path.resolve(frontendDir, '..');

test('security.txt deve existir em public/.well-known e seguir RFC 9116', () => {
  const securityTxtPath = path.join(frontendDir, 'public', '.well-known', 'security.txt');
  assert.equal(fs.existsSync(securityTxtPath), true, 'security.txt deve existir');

  const content = fs.readFileSync(securityTxtPath, 'utf8');
  assert.equal(content.includes('Contact: mailto:concursosagorabr@gmail.com'), true, 'Deve conter contato oficial');
  assert.equal(content.includes('Expires:'), true, 'Deve conter diretiva Expires');
  assert.equal(content.includes('Canonical: https://www.concursosagora.com.br/.well-known/security.txt'), true, 'Deve conter Canonical URL');
  assert.equal(content.includes('Preferred-Languages: pt-br'), true, 'Deve conter Preferred-Languages');
});

test('Headers de segurança em next.config.ts e vercel.json devem conter COOP e Permissions-Policy ampliado', () => {
  const nextConfigContent = fs.readFileSync(path.join(frontendDir, 'next.config.ts'), 'utf8');
  const vercelJsonContent = fs.readFileSync(path.join(frontendDir, 'vercel.json'), 'utf8');

  for (const content of [nextConfigContent, vercelJsonContent]) {
    assert.equal(content.includes('Cross-Origin-Opener-Policy'), true, 'Deve conter Cross-Origin-Opener-Policy');
    assert.equal(content.includes('Strict-Transport-Security'), true, 'Deve conter Strict-Transport-Security');
    assert.equal(content.includes('payment=()'), true, 'Permissions-Policy deve bloquear payment');
    assert.equal(content.includes('usb=()'), true, 'Permissions-Policy deve bloquear usb');
  }
});

test('Página de busca (search/page.tsx) deve sanitizar input em generateMetadata', () => {
  const searchPageContent = fs.readFileSync(path.join(frontendDir, 'src', 'app', 'search', 'page.tsx'), 'utf8');
  assert.equal(
    searchPageContent.includes('sanitizedQ'),
    true,
    'generateMetadata deve sanitizar q antes de atribuir ao title'
  );
  assert.equal(
    searchPageContent.includes('.slice(0, 100)'),
    true,
    'generateMetadata deve limitar tamanho da query a 100 caracteres'
  );
});

test('patch-authors.mjs não deve conter token Sanity hardcoded', () => {
  const patchAuthorsPath = path.join(rootDir, 'concursos-sanity-backend', 'scripts', 'patch-authors.mjs');
  const content = fs.readFileSync(patchAuthorsPath, 'utf8');
  assert.equal(
    content.includes('sk9DkEDlRkzVODQi6QJZTEpn1TYuxZMvnQkINxoyrM2UvUOPfyJkmSHMpiLkpawMnvGYZck0DOqUpl3LyQ5jRuHLUbhS753ouzOC9DZKX54fXUUlaszoQLbtE77E2o2oPSNM8c0ERwtCuhktHPygm4oi91LnlIdlPT4iAPMaj3IN2QXHu8MD'),
    false,
    'Token sk9Dk... não deve estar hardcoded em patch-authors.mjs'
  );
});

test('Configurações de Dependabot e backup de dataset devem existir', () => {
  const dependabotFrontend = path.join(frontendDir, '.github', 'dependabot.yml');
  const dependabotRoot = path.join(rootDir, '.github', 'dependabot.yml');
  const exportScript = path.join(rootDir, 'concursos-sanity-backend', 'scripts', 'export-dataset.mjs');

  assert.equal(fs.existsSync(dependabotFrontend), true, 'dependabot.yml no frontend deve existir');
  assert.equal(fs.existsSync(dependabotRoot), true, 'dependabot.yml na raiz deve existir');
  assert.equal(fs.existsSync(exportScript), true, 'export-dataset.mjs deve existir');
});
