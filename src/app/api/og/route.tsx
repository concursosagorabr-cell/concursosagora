import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * Card de compartilhamento 1200x630 gerado sob demanda.
 * Usado quando a imagem editorial tem menos de 1200 px de largura ou é GIF,
 * evitando upscale borrado no Discover/WhatsApp.
 */
export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get('title') || 'Concursos Agora').slice(0, 120);
  const eyebrow = (searchParams.get('eyebrow') || 'Concursos públicos 2026').slice(0, 60);

  const titleSize = title.length > 80 ? 50 : title.length > 55 ? 58 : 66;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0f172a 0%, #172554 55%, #1d4ed8 100%)',
          color: '#ffffff',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 16,
              background: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: -1,
            }}
          >
            CA
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1 }}>Concursos Agora</div>
            <div style={{ fontSize: 17, color: '#bfdbfe', marginTop: 4 }}>
              Notícias e editais de concursos públicos
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              background: 'rgba(59, 130, 246, 0.22)',
              border: '1px solid rgba(147, 197, 253, 0.5)',
              borderRadius: 999,
              padding: '10px 22px',
              fontSize: 20,
              fontWeight: 700,
              color: '#dbeafe',
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: titleSize,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: -1.5,
              maxWidth: 1040,
            }}
          >
            {title}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 21,
            color: '#cbd5e1',
          }}
        >
          <span>concursosagora.com.br</span>
          <span>Atualizado diariamente</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
