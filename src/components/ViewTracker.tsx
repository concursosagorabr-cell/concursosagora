'use client';

import { useEffect } from 'react';

interface ViewTrackerProps {
  slug: string;
}

/**
 * Componente silencioso de cliente que registra a leitura do post.
 * Utiliza sessionStorage para evitar computação duplicada (F5 na mesma sessão).
 */
export default function ViewTracker({ slug }: ViewTrackerProps) {
  useEffect(() => {
    if (!slug) return;

    const storageKey = `ca_viewed_${slug}`;

    try {
      if (sessionStorage.getItem(storageKey)) {
        return;
      }
      sessionStorage.setItem(storageKey, '1');
    } catch {
      // Falha silenciosa caso cookies/storage estejam restritos
    }

    // Registra a visualização na API em segundo plano
    fetch(`/api/views/${encodeURIComponent(slug)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      keepalive: true,
    }).catch(() => {
      // Falha silenciosa para não impactar a experiência do leitor
    });
  }, [slug]);

  return null;
}
