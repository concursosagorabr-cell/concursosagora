export interface StateInfo {
  name: string;
  region: string;
  capital: string;
}

export const BRAZIL_STATES: Record<string, StateInfo> = {
  ac: { name: 'Acre', region: 'Norte', capital: 'Rio Branco' },
  al: { name: 'Alagoas', region: 'Nordeste', capital: 'Maceió' },
  ap: { name: 'Amapá', region: 'Norte', capital: 'Macapá' },
  am: { name: 'Amazonas', region: 'Norte', capital: 'Manaus' },
  ba: { name: 'Bahia', region: 'Nordeste', capital: 'Salvador' },
  ce: { name: 'Ceará', region: 'Nordeste', capital: 'Fortaleza' },
  df: { name: 'Distrito Federal', region: 'Centro-Oeste', capital: 'Brasília' },
  es: { name: 'Espírito Santo', region: 'Sudeste', capital: 'Vitória' },
  go: { name: 'Goiás', region: 'Centro-Oeste', capital: 'Goiânia' },
  ma: { name: 'Maranhão', region: 'Nordeste', capital: 'São Luís' },
  mt: { name: 'Mato Grosso', region: 'Centro-Oeste', capital: 'Cuiabá' },
  ms: { name: 'Mato Grosso do Sul', region: 'Centro-Oeste', capital: 'Campo Grande' },
  mg: { name: 'Minas Gerais', region: 'Sudeste', capital: 'Belo Horizonte' },
  pa: { name: 'Pará', region: 'Norte', capital: 'Belém' },
  pb: { name: 'Paraíba', region: 'Nordeste', capital: 'João Pessoa' },
  pr: { name: 'Paraná', region: 'Sul', capital: 'Curitiba' },
  pe: { name: 'Pernambuco', region: 'Nordeste', capital: 'Recife' },
  pi: { name: 'Piauí', region: 'Nordeste', capital: 'Teresina' },
  rj: { name: 'Rio de Janeiro', region: 'Sudeste', capital: 'Rio de Janeiro' },
  rn: { name: 'Rio Grande do Norte', region: 'Nordeste', capital: 'Natal' },
  rs: { name: 'Rio Grande do Sul', region: 'Sul', capital: 'Porto Alegre' },
  ro: { name: 'Rondônia', region: 'Norte', capital: 'Porto Velho' },
  rr: { name: 'Roraima', region: 'Norte', capital: 'Boa Vista' },
  sc: { name: 'Santa Catarina', region: 'Sul', capital: 'Florianópolis' },
  sp: { name: 'São Paulo', region: 'Sudeste', capital: 'São Paulo' },
  se: { name: 'Sergipe', region: 'Nordeste', capital: 'Aracaju' },
  to: { name: 'Tocantins', region: 'Norte', capital: 'Palmas' },
};