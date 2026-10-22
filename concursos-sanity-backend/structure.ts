import type { StructureResolver } from 'sanity/structure';

const postList = (S: Parameters<StructureResolver>[0], title: string, filter?: string) => {
  const list = S.documentTypeList('post').title(title);
  return filter ? list.filter(filter) : list;
};

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Concursos Agora')
    .items([
      S.listItem()
        .title('📰 Matérias e concursos')
        .child(postList(S, 'Todas as matérias')),
      S.listItem()
        .title('🟢 Concursos abertos')
        .child(postList(S, 'Concursos abertos', '_type == "post" && status == "aberto"')),
      S.listItem()
        .title('🟡 Previstos / aguardando edital')
        .child(postList(S, 'Previstos', '_type == "post" && status == "previsto"')),
      S.listItem()
        .title('🔵 Em andamento')
        .child(postList(S, 'Em andamento', '_type == "post" && status == "em_andamento"')),
      S.listItem()
        .title('⚫ Encerrados')
        .child(postList(S, 'Encerrados', '_type == "post" && status == "encerrado"')),

      S.divider(),

      S.listItem()
        .title('🗂️ Categorias')
        .child(S.documentTypeList('category').title('Categorias')),
      S.listItem()
        .title('✍️ Autores')
        .child(S.documentTypeList('author').title('Autores')),
      S.listItem()
        .title('🖼️ Biblioteca de imagens')
        .child(S.documentTypeList('imageLibrary').title('Biblioteca de imagens')),

      S.divider(),

      S.listItem()
        .title('✉️ Assinantes da newsletter')
        .child(S.documentTypeList('subscriber').title('Assinantes')),
      S.listItem()
        .title('⚙️ Configurações do site')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Configurações do site')
        ),
    ]);
