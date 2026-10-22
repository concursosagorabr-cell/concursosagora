import test from 'node:test';
import assert from 'node:assert/strict';
import { getDescriptiveImageAlt } from './imageAlt.ts';

test('getDescriptiveImageAlt usa alt customizado se existir e for diferente do título', () => {
  const post = {
    title: 'Concurso CASAN SC',
    mainImage: {
      alt: 'Fachada do prédio da CASAN em Florianópolis',
    },
  };

  const alt = getDescriptiveImageAlt(post);
  assert.equal(alt, 'Fachada do prédio da CASAN em Florianópolis');
});

test('getDescriptiveImageAlt usa caption se alt for idêntico ao título', () => {
  const post = {
    title: 'Concurso CASAN SC',
    mainImage: {
      alt: 'Concurso CASAN SC',
      caption: 'Sede administrativa da CASAN',
    },
  };

  const alt = getDescriptiveImageAlt(post);
  assert.equal(alt, 'Sede administrativa da CASAN');
});

test('getDescriptiveImageAlt gera descrição contextual enriquecida quando alt é vazio ou igual ao título', () => {
  const post = {
    title: 'Concurso CASAN SC',
    stateUf: 'SC',
    cityName: 'Florianópolis',
    banca: 'FEPESE',
    mainImage: {
      alt: 'Concurso CASAN SC',
    },
  };

  const alt = getDescriptiveImageAlt(post);
  assert.equal(
    alt,
    'Foto ilustrativa para a notícia sobre o edital do Concurso CASAN SC no município de Florianópolis no estado de SC com organização da banca FEPESE'
  );
});

test('getDescriptiveImageAlt não duplica estado quando stateUf é Nacional', () => {
  const post = {
    title: 'Concurso Caixa 2026',
    stateUf: 'Nacional',
    banca: 'Cesgranrio',
  };

  const alt = getDescriptiveImageAlt(post);
  assert.equal(
    alt,
    'Foto ilustrativa para a notícia sobre o edital do Concurso Caixa 2026 com organização da banca Cesgranrio'
  );
});
