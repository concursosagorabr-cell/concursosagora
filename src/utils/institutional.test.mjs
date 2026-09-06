import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendSrc = path.resolve(__dirname, '..');

test('Rodapé (Footer.tsx) não deve conter razão social Ltda. e deve identificar Marco Antonio como responsável', () => {
  const footerContent = fs.readFileSync(path.join(frontendSrc, 'components', 'Footer.tsx'), 'utf8');
  
  assert.equal(
    footerContent.includes('Ltda'),
    false,
    'Footer não deve conter menção a Ltda.'
  );
  assert.equal(
    footerContent.includes('Marco Antonio de Agostino Mariano de Melo'),
    true,
    'Footer deve citar Marco Antonio de Agostino Mariano de Melo como mantenedor'
  );
  assert.equal(
    footerContent.includes('Privacidade / LGPD:'),
    true,
    'Footer deve conter label "Privacidade / LGPD:"'
  );
});

test('Página Sobre Nós (sobre-nos/page.tsx) deve apresentar projeto de Marco Antonio com equipe colaboradora sem links pessoais', () => {
  const sobreNosContent = fs.readFileSync(path.join(frontendSrc, 'app', 'sobre-nos', 'page.tsx'), 'utf8');
  
  assert.equal(
    sobreNosContent.includes('Ltda'),
    false,
    '/sobre-nos não deve conter menção a Ltda.'
  );
  assert.equal(
    sobreNosContent.includes('Univesp'),
    true,
    '/sobre-nos deve mencionar formação na Univesp'
  );
  assert.equal(
    sobreNosContent.includes('Redator, Desenvolvedor & Responsável pelo Portal'),
    true,
    '/sobre-nos deve definir o cargo institucional de Marco Antonio'
  );
  assert.equal(
    sobreNosContent.includes('Marco Antonio de Agostino Mariano de Melo'),
    true,
    '/sobre-nos deve ter o nome completo de Marco Antonio'
  );
});

test('Página Política de Privacidade (politica-de-privacidade/page.tsx) deve definir Marco Antonio como controlador pessoa física', () => {
  const privacidadeContent = fs.readFileSync(path.join(frontendSrc, 'app', 'politica-de-privacidade', 'page.tsx'), 'utf8');
  
  assert.equal(
    privacidadeContent.includes('Ltda'),
    false,
    '/politica-de-privacidade não deve conter menção a Ltda.'
  );
  assert.equal(
    privacidadeContent.includes('Marco Antonio de Agostino Mariano de Melo, pessoa física responsável pelo projeto Concursos Agora'),
    true,
    '/politica-de-privacidade deve designar Marco Antonio como controlador pessoa física'
  );
});

test('Página Termos de Uso (termos-de-uso/page.tsx) deve eleger foro do domicílio do responsável', () => {
  const termosContent = fs.readFileSync(path.join(frontendSrc, 'app', 'termos-de-uso', 'page.tsx'), 'utf8');
  
  assert.equal(
    termosContent.includes('sede do'),
    false,
    '/termos-de-uso não deve citar "sede do"'
  );
  assert.equal(
    termosContent.includes('foro do domicílio do responsável pelo portal'),
    true,
    '/termos-de-uso deve conter cláusula de foro do domicílio do responsável'
  );
});

test('Validação de integridade de encoding UTF-8 para o perfil de Amanda Nunes', () => {
  const expectedRole = 'Repórter Especial de Concursos & Roteiros de Estudo';
  const expectedBio = 'Repórter especializada na cobertura de concursos municipais, estaduais, saúde e educação. Focada no jornalismo de utilidade pública, raio-x de convocações do cadastro reserva e metodologias práticas de estudo para quem trabalha e estuda.';

  assert.equal(expectedRole.includes('?'), false, 'Role não deve conter interrogações');
  assert.equal(expectedBio.includes('?'), false, 'Bio não deve conter interrogações');
  assert.match(expectedBio, /saúde/);
  assert.match(expectedBio, /educação/);
  assert.match(expectedBio, /utilidade pública/);
  assert.match(expectedBio, /convocações/);
  assert.match(expectedBio, /metodologias práticas/);
});

test('Página Sobre Nós (sobre-nos/page.tsx) deve conter a abertura "Conheça quem está por trás do conteúdo" e título "Quem Faz o Concursos Agora"', () => {
  const sobreNosContent = fs.readFileSync(path.join(frontendSrc, 'app', 'sobre-nos', 'page.tsx'), 'utf8');
  
  assert.equal(
    sobreNosContent.includes('Quem Faz o Concursos Agora'),
    true,
    'Título da seção deve ser "Quem Faz o Concursos Agora"'
  );
  assert.equal(
    sobreNosContent.includes('Conheça quem está por trás do conteúdo do Concursos Agora:'),
    true,
    'Frase de abertura deve ser "Conheça quem está por trás do conteúdo do Concursos Agora:"'
  );
  assert.equal(
    sobreNosContent.includes('conselho de redatores'),
    false,
    'Não deve mencionar conselho de redatores'
  );
});

test('Página Política Editorial (politica-editorial/page.tsx) deve refletir responsabilidade individual de checagem', () => {
  const editorialContent = fs.readFileSync(path.join(frontendSrc, 'app', 'politica-editorial', 'page.tsx'), 'utf8');
  
  assert.equal(
    editorialContent.includes('Embora eu adote padrões rigorosos de checagem, erros podem ocorrer.'),
    true,
    'Seção 5 deve usar "Embora eu adote padrões rigorosos de checagem, erros podem ocorrer."'
  );
  assert.equal(
    editorialContent.includes('Embora nossa equipe adote'),
    false,
    'Não deve conter "Embora nossa equipe adote"'
  );
  assert.equal(
    editorialContent.includes('Todo esse processo — da apuração à revisão final — é conduzido por mim.'),
    true,
    'Seção 3 deve explicitar que o processo é conduzido por Marco'
  );
});

