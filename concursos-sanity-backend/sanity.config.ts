import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemas';
import { structure } from './structure';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'wobukj4j';
const dataset = process.env.SANITY_STUDIO_DATASET || 'production';

interface ProductionUrlDocument {
  _id?: string;
  _type?: string;
  slug?: { current?: string };
}

export default defineConfig({
  name: 'concursos-agora',
  title: 'Concursos Agora — CMS',
  projectId,
  dataset,
  basePath: '/studio',
  plugins: [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: '2026-07-25' }),
  ],
  schema: {
    types: schemaTypes,
  },
  document: {
    productionUrl: async (prev, context) => {
      const document = context.document as ProductionUrlDocument;
      const client = context.getClient({ apiVersion: '2026-07-25' });
      const id = String(document._id || '').replace(/^drafts\./, '');

      if (document._type === 'post') {
        const slug = document.slug?.current;
        if (slug) return `https://www.concursosagora.com.br/post/${slug}`;
        try {
          const found = await client.fetch<string | null>(
            `*[_type == "post" && _id == $id][0].slug.current`,
            { id }
          );
          if (found) return `https://www.concursosagora.com.br/post/${found}`;
        } catch {
          // Sem conexão: mantém o comportamento padrão do Studio.
        }
      }

      if (document._type === 'category' && document.slug?.current) {
        return `https://www.concursosagora.com.br/categoria/${document.slug.current}`;
      }

      return prev;
    },
  },
});
