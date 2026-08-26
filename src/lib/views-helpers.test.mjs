import test from 'node:test';
import assert from 'node:assert/strict';
import { orderPostsBySlugs, mergeWithFallback } from './views-helpers.mjs';

test('orderPostsBySlugs deve ordenar os posts exatamente na ordem dos slugs do ranking', () => {
  const posts = [
    { _id: '1', slug: 'concurso-maringa-pr', title: 'Maringá' },
    { _id: '2', slug: 'transpetro-vagas-2026', title: 'Transpetro' },
    { _id: '3', slug: 'prf-administrativo-vagas', title: 'PRF' },
  ];

  const rankedSlugs = ['transpetro-vagas-2026', 'prf-administrativo-vagas', 'concurso-maringa-pr'];
  const ordered = orderPostsBySlugs(posts, rankedSlugs);

  assert.deepEqual(ordered.map((p) => p.slug), rankedSlugs);
});

test('orderPostsBySlugs ignora slugs que não estão no array de posts', () => {
  const posts = [
    { _id: '1', slug: 'transpetro-vagas-2026', title: 'Transpetro' },
  ];

  const rankedSlugs = ['transpetro-vagas-2026', 'slug-inexistente'];
  const ordered = orderPostsBySlugs(posts, rankedSlugs);

  assert.equal(ordered.length, 1);
  assert.equal(ordered[0].slug, 'transpetro-vagas-2026');
});

test('mergeWithFallback completa lista com posts recentes sem duplicar', () => {
  const topPosts = [
    { _id: '1', slug: 'transpetro-vagas-2026', title: 'Transpetro' },
    { _id: '2', slug: 'prf-administrativo-vagas', title: 'PRF' },
  ];

  const recentPosts = [
    { _id: '1', slug: 'transpetro-vagas-2026', title: 'Transpetro' }, // duplicado
    { _id: '3', slug: 'concurso-tce-go', title: 'TCE GO' },
    { _id: '4', slug: 'concurso-jose-boiteux', title: 'José Boiteux' },
    { _id: '5', slug: 'concurso-iss-manaus', title: 'ISS Manaus' },
  ];

  const merged = mergeWithFallback(topPosts, recentPosts, 4);

  assert.equal(merged.length, 4);
  assert.deepEqual(merged.map((p) => p.slug), [
    'transpetro-vagas-2026',
    'prf-administrativo-vagas',
    'concurso-tce-go',
    'concurso-jose-boiteux',
  ]);
});

test('mergeWithFallback funciona quando topPosts está vazio (fallback total)', () => {
  const recentPosts = [
    { _id: '1', slug: 'post-1' },
    { _id: '2', slug: 'post-2' },
    { _id: '3', slug: 'post-3' },
  ];

  const merged = mergeWithFallback([], recentPosts, 2);
  assert.equal(merged.length, 2);
  assert.deepEqual(merged.map((p) => p.slug), ['post-1', 'post-2']);
});
