import { createClient, type Client } from '@libsql/client'

/**
 * Conexão com o Turso (libSQL).
 *
 * O Turso é um banco independente do Sanity. Nada é sincronizado entre os
 * dois: o gerente escolhe, por artigo, qual banco recebe o rascunho e o site
 * lê a fonte definida em `CMS_SOURCE` (`sanity` por padrão, `turso` para usar
 * o banco próprio).
 *
 * As credenciais vêm SEMPRE de variáveis de ambiente. Nunca versione tokens.
 */
const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

export const tursoConfigured = Boolean(url && authToken)

const globalForTurso = globalThis as unknown as { __tursoClient?: Client }

export const turso: Client =
  globalForTurso.__tursoClient ??
  createClient({
    url: url || 'file::memory:',
    authToken: authToken || undefined,
  })

if (!globalForTurso.__tursoClient) {
  globalForTurso.__tursoClient = turso
}
