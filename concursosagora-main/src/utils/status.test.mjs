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

test('getContestStatusInfo retorna Em Andamento quando inscrições expiraram mas sem prova definida', () => {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 5);

  const post = {
    title: 'Concurso com Inscrições Encerradas',
    enrollmentEndDate: pastDate.toISOString(),
  };
  const info = getContestStatusInfo(post);
  assert.equal(info.label, 'Em Andamento');
  assert.equal(info.isExpired, false);
  assert.ok(info.badgeBg.includes('blue'));
  assert.equal(info.enrollmentLabel, 'Inscrições encerradas');
});

test('getContestStatusInfo retorna Concurso Encerrado quando inscrições E prova já passaram', () => {
  const pastEnrollment = new Date();
  pastEnrollment.setDate(pastEnrollment.getDate() - 30);
  const pastExam = new Date();
  pastExam.setDate(pastExam.getDate() - 10);

  const post = {
    title: 'Concurso Totalmente Encerrado',
    enrollmentEndDate: pastEnrollment.toISOString(),
    examDate: pastExam.toISOString(),
  };
  const info = getContestStatusInfo(post);
  assert.equal(info.label, 'Concurso Encerrado');
  assert.equal(info.isExpired, true);
});

test('getContestStatusInfo respeita status CMS encerrado mesmo com data futura', () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);

  const post = {
    title: 'Concurso Cancelado',
    status: 'encerrado',
    enrollmentEndDate: futureDate.toISOString(),
  };
  const info = getContestStatusInfo(post);
  assert.equal(info.label, 'Concurso Encerrado');
  assert.equal(info.isExpired, true);
});

test('getContestStatusInfo retorna Em Andamento quando status CMS é em_andamento e sem data de inscrição', () => {
  const post = {
    title: 'Concurso Em Fase de Provas',
    status: 'em_andamento',
  };
  const info = getContestStatusInfo(post);
  assert.equal(info.label, 'Em Andamento');
  assert.equal(info.isExpired, false);
  assert.ok(info.badgeBg.includes('blue'));
});

test('REGRA CRÍTICA: se registrationEnd for futura, label é Concurso Aberto e enrollmentLabel é Inscrições abertas mesmo se CMS for em_andamento (caso CRA-AM, SAAEB, CASAN)', () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 20);

  const post = {
    title: 'Concurso CRA-AM',
    status: 'em_andamento',
    enrollmentEndDate: futureDate.toISOString(),
  };
  const info = getContestStatusInfo(post);
  assert.equal(info.label, 'Concurso Aberto');
  assert.equal(info.enrollmentLabel, 'Inscrições abertas');
  assert.equal(info.isExpired, false);
  assert.ok(info.badgeBg.includes('emerald'));
});

test('se registrationStart for futura, enrollmentLabel é Inscrições ainda não iniciadas', () => {
  const futureStart = new Date();
  futureStart.setDate(futureStart.getDate() + 5);
  const futureEnd = new Date();
  futureEnd.setDate(futureEnd.getDate() + 25);

  const post = {
    title: 'Concurso CRA-AM',
    status: 'aberto',
    enrollmentStartDate: futureStart.toISOString(),
    enrollmentEndDate: futureEnd.toISOString(),
  };
  const info = getContestStatusInfo(post);
  assert.equal(info.enrollmentLabel, 'Inscrições ainda não iniciadas');
  assert.equal(info.label, 'Edital Previsto');
  assert.equal(info.isExpired, false);
});

test('se registrationEnd for passada, enrollmentLabel é Inscrições encerradas', () => {
  const pastEnd = new Date();
  pastEnd.setDate(pastEnd.getDate() - 5);

  const post = {
    title: 'Concurso Antigo',
    status: 'aberto',
    enrollmentEndDate: pastEnd.toISOString(),
  };
  const info = getContestStatusInfo(post);
  assert.equal(info.enrollmentLabel, 'Inscrições encerradas');
  assert.equal(info.label, 'Em Andamento');
});


