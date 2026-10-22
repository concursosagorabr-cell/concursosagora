import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'wobukj4j',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  // Nome escolhido para o Studio hospedado: https://concursos-agora.sanity.studio
  studioHost: 'concursos-agora',
  deployment: {
    autoUpdates: true,
    appId: 'cq0be3f2nj0xtai3m7ixz4ji',
  },
});
