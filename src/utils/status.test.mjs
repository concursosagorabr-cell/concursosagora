import test from 'node:test';
import assert from 'node:assert/strict';
import { getContestStatusInfo, isContestExpired } from './status.ts';

test('getContestStatusInfo identifica Edital Previsto para banca confirmada sem data', () => {
  const post = {
    title: 'Concurso TRT-8: FCC organiza, salários até R$ 16 mil; veja vagas',
    status: 'previsto',
  };
  const info = getContestStatusInfo(post);
  assert.equal(info.label, 'Edital Previsto');
  assert.equal(info.isExpired, false);
  assert.ok(info.badgeBg.includes('amber'));
});

test('getContestStatusInfo infere Edital Previsto por heurística do título se não houver prazo de inscrição', () => {
  const post = {
    title: 'TRT-8: Banca FCC confirmada, salários até R$ 16 mil; veja detalhes do certame',
    // status não informado ou default
  };
  const info = getContestStatusInfo(post);
  assert.equal(info.label, 'Edital Previsto');
  assert.equal(info.isExpired, false);
  assert.ok(info.badgeBg.includes('amber'));
});

test('getContestStatusInfo retorna Concurso Aberto quando há prazo de inscrição válido', () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 15);

  const post = {
    title: 'Concurso Prefeitura de Niterói: 50 vagas',
    status: 'aberto',
    enrollmentEndDate: futureDate.toISOString(),
  };
  const info = getContestStatusInfo(post);
  assert.equal(info.label, 'Concurso Aberto');
  assert.equal(info.isExpired, false);
  assert.ok(info.badgeBg.includes('emerald'));
});

test('getContestStatusInfo retorna Concurso Encerrado quando data expirou', () => {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 5);

  const post = {
    title: 'Concurso Antigo Já Encerrado',
    enrollmentEndDate: pastDate.toISOString(),
  };
  const info = getContestStatusInfo(post);
  assert.equal(info.label, 'Concurso Encerrado');
  assert.equal(info.isExpired, true);
  assert.ok(info.badgeBg.includes('slate'));
});
