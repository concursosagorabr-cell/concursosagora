/**
 * Preenche campos ausentes nas matérias já existentes, sem sobrescrever
 * conteúdo editorial. Útil após importações antigas do pipeline.
 *
 * Uso:
 *   npm run normalize:posts
 *   DRY_RUN=1 npm run normalize:posts   (simulação)
 */
import crypto from 'node:crypto';
import { client, isDryRun, normalizeText, requireToken, toSlug } from './lib.mjs';

requireToken();

const STATE_NAMES = {
  acre: 'AC', alagoas: 'AL', amapa: 'AP', amazonas: 'AM', bahia: 'BA', ceara: 'CE',
  'distrito federal': 'DF', 'espirito santo': 'ES', goias: 'GO', maranhao: 'MA',
  'mato grosso': 'MT', 'mato grosso do sul': 'MS', 'minas gerais': 'MG', para: 'PA',
  paraiba: 'PB', parana: 'PR', pernambuco: 'PE', piaui: 'PI', 'rio de janeiro': 'RJ',
  'rio grande do norte': 'RN', 'rio grande do sul': 'RS', rondonia: 'RO', roraima: 'RR',
  'santa catarina': 'SC', 'sao paulo': 'SP', sergipe: 'SE', tocantins: 'TO',
};

const STATE_REGIONS = {
  AC: 'norte', AL: 'nordeste', AP: 'norte', AM: 'norte', BA: 'nordeste', CE: 'nordeste',
  DF: 'centro-oeste', ES: 'sudeste', GO: 'centro-oeste', MA: 'nordeste', MT: 'centro-oeste',
  MS: 'centro-oeste', MG: 'sudeste', PA: 'norte', PB: 'nordeste', PR: 'sul', PE: 'nordeste',
  PI: 'nordeste', RJ: 'sudeste', RN: 'nordeste', RS: 'sul', RO: 'norte', RR: 'norte',
  SC: 'sul', SP: 'sudeste', SE: 'nordeste', TO: 'norte',
};

const KNOWN_CITIES = [
  'Campina Grande', 'João Pessoa', 'São Paulo', 'Rio de Janeiro', 'Belo Horizonte',
  'Curitiba', 'Porto Alegre', 'Salvador', 'Recife', 'Fortaleza', 'Manaus', 'Belém',
  'Goiânia', 'Cuiabá', 'Campo Grande', 'Brasília', 'Vitória', 'Florianópolis',
  'Maceió', 'Natal', 'Teresina', 'São Luís', 'Aracaju', 'Palmas', 'Porto Velho',
  'Rio Branco', 'Macapá', 'Boa Vista',
];

const AREA_KEYWORDS = [
  { slug: 'seguranca', re: /\bpolicia\b|\bpolicial\b|\bguarda\b|\bseguranca\b|\bpenal\b|\bmilitar\b|\bcivil\b|\bbombeiro\b|\bprf\b|\bdelegado\b|\bagentes?\b/ },
  { slug: 'tribunais', re: /\btribunal\b|\bjudiciario\b|\btj\b|\btrt\b|\btrf\b|\bjustica\b/ },
  { slug: 'educacao', re: /\bprofessor\b|\beducacao\b|\bseduc\b|\bdocente\b|\bpedagog/ },
  { slug: 'saude', re: /\bsaude\b|\bsus\b|\benfermeir|\bmedic|\bodontolog|\bfarmaceutic/ },
  { slug: 'financas', re: /\bbanco\b|\bbancari|\bcaixa economica\b|\bfinanc/ },
  { slug: 'fiscal', re: /\bfiscal\b|\btributari|\breceita\b|\bauditor/ },
  { slug: 'prefeituras', re: /\bprefeitura\b|\bmunicipal\b|\bcamara municipal\b/ },
  { slug: 'tecnologia', re: /\btecnologia\b|\binformatica\b|\banalista de sistemas\b|\bdesenvolvedor/ },
  { slug: 'administracao', re: /\badministracao\b|\badministrativ|\bgestao publica\b/ },
  { slug: 'juridico', re: /\bjuridic|\bdireito\b|\bprocurador|\bdefensoria\b|\bministerio publico\b|\badvogado/ },
  { slug: 'engenharia', re: /\bengenharia\b|\bengenheir/ },
  { slug: 'assistencia-social', re: /\bassistencia social\b|\bassistente social\b/ },
];

function bodyText(body) {
  if (!Array.isArray(body)) return '';
  return body
    .filter((block) => block?._type === 'block')
    .map((block) => (block.children || []).map((child) => child.text || '').join(''))
    .join('\n');
}

function parseSalary(text) {
  const normalized = String(text || '');
  const matches = [...normalized.matchAll(/R\$\s*([\d.]+)(?:,(\d{2}))?\s*(mil|milh[oõ]es?)?/gi)];
  let max = null;
  for (const match of matches) {
    const integer = Number(String(match[1] || '').replace(/\./g, ''));
    const cents = Number(match[2] || '0');
    if (!Number.isFinite(integer)) continue;
    let value = integer + cents / 100;
    const unit = normalizeText(match[3] || '');
    if (unit.startsWith('mil')) value *= 1000;
    if (unit.startsWith('milho')) value *= 1_000_000;
    if (value < 1000) continue;
    if (max === null || value > max) max = value;
  }
  return max;
}

function inferUf(text, current) {
  if (current) return current;
  if (/inss|instituto nacional do seguro social|governo federal|nacional/i.test(text)) return 'Nacional';
  for (const [name, uf] of Object.entries(STATE_NAMES)) {
    if (new RegExp(`\\b${name}\\b`, 'i').test(text)) return uf;
  }
  const ufMatch = text.match(/\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/);
  return ufMatch ? ufMatch[1] : null;
}

function inferSphere(text, uf, current) {
  if (current) return current;
  if (/guarda municipal|prefeitura|camara municipal|municipal/i.test(text)) return 'MUNICIPAL';
  if (/policia penal|secretaria|governo do estado|estadual/i.test(text)) return 'ESTADUAL';
  if (/inss|federal|instituto nacional|universidade federal|tribunal regional federal|trf/i.test(text)) return 'FEDERAL';
  if (uf === 'Nacional') return 'NACIONAL';
  return null;
}

function inferEducation(text, current) {
  if (Array.isArray(current) && current.length > 0) return null;
  const levels = new Set();
  if (/fundamental/i.test(text)) levels.add('fundamental');
  if (/medio|ensino medio/i.test(text)) levels.add('medio');
  if (/tecnico|tecnologia/i.test(text)) levels.add('tecnico');
  if (/superior|analista|advogado|medico|engenheiro|professor|auditor|delegado|juiz/i.test(text)) levels.add('superior');
  if (levels.size === 0) levels.add('superior');
  return [...levels];
}

function inferOrgan(text, current) {
  if (current) return current;
  if (/inss/i.test(text)) return 'Instituto Nacional do Seguro Social (INSS)';
  if (/policia penal.*sp|policia penal de sao paulo/i.test(text)) {
    return 'Secretaria da Administração Penitenciária de São Paulo (SAP-SP)';
  }
  if (/guarda.*campina grande/i.test(text)) return 'Prefeitura Municipal de Campina Grande (PB)';
  return null;
}

const categories = await client.fetch(
  `*[_type == "category"]{ _id, title, "slug": slug.current }`
);
const categoryIdBySlug = new Map();
const categoryIdByTitle = new Map();
for (const category of categories) {
  if (category.slug) categoryIdBySlug.set(category.slug, category._id);
  categoryIdByTitle.set(normalizeText(category.title), category._id);
}

const images = await client.fetch(
  `*[_type == "imageLibrary" && active != false && defined(image.asset)] | order(_createdAt asc) {
    _id, title, category, source, image
  }[0...400]`
);

const authors = await client.fetch(`*[_type == "author"] | order(_createdAt asc) { _id }`);
const fallbackAuthor = authors[0]?._id;

function catId(slugOrTitle) {
  const key = String(slugOrTitle || '').trim();
  return categoryIdBySlug.get(key) || categoryIdByTitle.get(normalizeText(key)) || null;
}

function inferCategories(post, text, uf, sphere) {
  const ids = new Set();
  const add = (key) => {
    const id = catId(key);
    if (id) ids.add(id);
  };

  if (uf) add(uf.toLowerCase());
  if (uf && STATE_REGIONS[uf]) add(STATE_REGIONS[uf]);
  if (uf === 'Nacional') add('nacional');
  if (sphere) {
    if (sphere === 'FEDERAL') add('federal');
    if (sphere === 'MUNICIPAL') add('prefeituras');
  }
  if (post.status === 'aberto') add('concursos-abertos');

  const normalized = normalizeText(text);
  for (const area of AREA_KEYWORDS) {
    if (area.re.test(normalized)) add(area.slug);
  }

  if (/policia penal|guarda municipal|policia civil|policia militar|prf|delegado/i.test(text)) {
    add('seguranca');
  }

  return [...ids].map((id) => ({
    _key: crypto.randomUUID().slice(0, 12),
    _type: 'reference',
    _ref: id,
  }));
}

function pickImage(post, uf, seed) {
  const candidates = images.filter((image) => {
    const category = normalizeText(image.category);
    return (uf && category === normalizeText(uf)) || category === normalizeText(post.stateUf);
  });
  const pool = candidates.length > 0
    ? candidates
    : images.filter((image) => normalizeText(image.category) === 'nacional');
  if (pool.length === 0) return null;
  const image = pool[seed % pool.length];
  const alt = String(post.title || image.title || 'Imagem ilustrativa do concurso').slice(0, 180);
  return {
    _type: 'image',
    asset: { _type: 'reference', _ref: image.image.asset._ref },
    alt,
    credit: image.source || 'Foto ilustrativa / Acervo Concursos Agora',
  };
}

const posts = await client.fetch(
  `*[_type == "post"] | order(_createdAt asc) {
    _id, _createdAt, title, slug, publishedAt, excerpt, body,
    status, contestStatus, organ, sphere, banca, examBoard,
    stateUf, cityName, educationLevel, salaryMax, salaryMin,
    vacancies, vacanciesTotal, mainImage, categories, author
  }`
);

console.log(`Analisando ${posts.length} matéria(s)...\n`);
let changed = 0;

for (const [index, post] of posts.entries()) {
  const text = [post.title, post.excerpt, bodyText(post.body)].filter(Boolean).join('\n');
  const patch = {};

  if (!post.slug?.current && post.title) {
    patch.slug = { _type: 'slug', current: toSlug(post.title) };
  }
  if (!post.publishedAt) patch.publishedAt = post._createdAt;
  if (!post.author && fallbackAuthor) {
    patch.author = { _type: 'reference', _ref: fallbackAuthor };
  }

  const uf = inferUf(text, post.stateUf);
  if (uf && !post.stateUf) patch.stateUf = uf;

  const sphere = inferSphere(text, uf || post.stateUf, post.sphere);
  if (sphere && !post.sphere) patch.sphere = sphere;

  if (!post.organ) {
    const organ = inferOrgan(text, post.organ);
    if (organ) patch.organ = organ;
  }

  if (!post.cityName) {
    // Só infere município quando o certame é claramente municipal; caso
    // contrário "São Paulo" no texto pode ser o estado, não a cidade.
    const isMunicipal =
      (sphere || post.sphere) === 'MUNICIPAL' ||
      /\b(prefeitura|guarda municipal|camara municipal)\b/i.test(text);
    if (isMunicipal) {
      const city = KNOWN_CITIES.find((name) => new RegExp(`\\b${name}\\b`, 'i').test(text));
      if (city) patch.cityName = city;
    }
  }

  if (!post.banca && post.examBoard) patch.banca = post.examBoard;
  if (!post.examBoard && post.banca) patch.examBoard = post.banca;

  if (typeof post.vacanciesTotal !== 'number' && typeof post.vacancies === 'number') {
    patch.vacanciesTotal = post.vacancies;
  }

  if (!post.educationLevel || post.educationLevel.length === 0) {
    const levels = inferEducation(text, post.educationLevel);
    if (levels) patch.educationLevel = levels;
  }

  if (typeof post.salaryMax !== 'number') {
    const salary = parseSalary(text);
    if (salary) patch.salaryMax = salary;
  }

  if (!post.excerpt) {
    const paragraph = bodyText(post.body)
      .split('\n')
      .map((line) => line.replace(/[*_>#-]/g, '').trim())
      .find((line) => line.length > 40);
    if (paragraph) {
      patch.excerpt = paragraph.length > 240 ? `${paragraph.slice(0, 237)}...` : paragraph;
    }
  }

  if (!Array.isArray(post.categories) || post.categories.length === 0) {
    // Usa apenas título/resumo para evitar falsos positivos de palavras
    // genéricas no corpo (ex.: "direito", "seguro", "médico").
    const summaryText = [post.title, post.excerpt].filter(Boolean).join(' ');
    const inferred = inferCategories(post, summaryText, uf || post.stateUf, sphere || post.sphere);
    if (inferred.length > 0) patch.categories = inferred;
  }

  if (!post.mainImage) {
    const image = pickImage(post, uf || post.stateUf, index);
    if (image) patch.mainImage = image;
  } else if (!post.mainImage.alt) {
    patch['mainImage.alt'] = String(post.title || 'Imagem ilustrativa do concurso').slice(0, 180);
  }

  if (Object.keys(patch).length === 0) continue;

  changed += 1;
  console.log(`Matéria: ${post.title}`);
  for (const [key, value] of Object.entries(patch)) {
    const printable = Array.isArray(value)
      ? `${value.length} item(ns)`
      : typeof value === 'object'
        ? JSON.stringify(value).slice(0, 120)
        : value;
    console.log(`  • ${key}: ${printable}`);
  }

  if (!isDryRun) {
    await client.patch(post._id).set(patch).commit({ visibility: 'async' });
  }
}

console.log(`\n${changed} matéria(s) atualizada(s)${isDryRun ? ' [DRY RUN]' : ''}.`);
