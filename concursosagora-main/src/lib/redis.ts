import { Redis } from '@upstash/redis';

let redisInstance: Redis | null = null;
let isWarned = false;

/**
 * Retorna a instância do Upstash Redis configurada via variáveis de ambiente.
 * Se as variáveis não estiverem definidas, retorna null sem quebrar a aplicação.
 */
export function getRedis(): Redis | null {
  if (redisInstance) {
    return redisInstance;
  }

  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    process.env.STORAGE_REST_API_URL ||
    process.env.STORAGE_URL;

  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    process.env.STORAGE_REST_API_TOKEN ||
    process.env.STORAGE_TOKEN;

  if (!url || !token) {
    if (!isWarned && process.env.NODE_ENV === 'development') {
      console.warn(
        '[Redis] Nenhuma variável do Upstash Redis configurada (UPSTASH_REDIS_REST_URL ou KV_REST_API_URL). Modo fallback ativo.'
      );
      isWarned = true;
    }
    return null;
  }

  try {
    redisInstance = new Redis({
      url,
      token,
    });
    return redisInstance;
  } catch (error) {
    console.error('[Redis] Falha ao inicializar cliente Redis:', error);
    return null;
  }
}

/**
 * Chaves padrão utilizadas para contagem de visualizações
 */
export const REDIS_KEYS = {
  POSTS_VIEWS_ALL: 'posts:views:all',
  POST_VIEW_PREFIX: 'post:views:',
} as const;
