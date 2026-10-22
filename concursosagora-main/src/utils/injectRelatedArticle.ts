import { PortableTextBlock, RelatedPostData, DynamicRelatedPostBlock } from '@/types';

/**
 * Utilitário para injetar dinamicamente um bloco de "Leia Também" (Artigo Relacionado)
 * dentro do array de blocos do Portable Text vindo do Sanity CMS.
 *
 * @param blocks - Array original de blocos do Portable Text
 * @param relatedPost - Dados do artigo relacionado a ser recomendado
 * @param targetParagraphIndex - O número do parágrafo normal após o qual o bloco será injetado (padrão: 2 = após o 2º parágrafo)
 * @returns Um novo array de blocos contendo o bloco customizado 'dynamicRelatedPost'
 */
export function injectRelatedArticle(
  blocks: PortableTextBlock[] | null | undefined,
  relatedPost: RelatedPostData | null | undefined,
  targetParagraphIndex: number = 2
): PortableTextBlock[] {
  // 1. Validação de segurança: se não houver blocos ou post relacionado, retorna os blocos originais ou array vazio
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return [];
  }
  if (!relatedPost) {
    return blocks;
  }

  // Clona o array original para evitar mutações diretas de estado/prop
  const result: PortableTextBlock[] = [...blocks];

  // Contador de parágrafos normais encontrados no Portable Text
  let normalParagraphCount = 0;
  let insertionIndex = -1;
  let lastNormalParagraphIndex = -1;

  // 2. Iteração sobre o array de blocos para identificar parágrafos normais
  for (let i = 0; i < result.length; i++) {
    const block = result[i];

    // Consideramos um parágrafo normal quando _type === 'block' e (style === 'normal' ou style sem valor)
    const isNormalParagraph =
      block._type === 'block' && (!block.style || block.style === 'normal');

    if (isNormalParagraph) {
      normalParagraphCount++;
      lastNormalParagraphIndex = i;

      // Quando atingimos o parágrafo alvo (ex: 2º ou 3º parágrafo)
      if (normalParagraphCount === targetParagraphIndex) {
        insertionIndex = i + 1; // Inserir logo APÓS o parágrafo atual
        break;
      }
    }
  }

  // 3. Trata casos onde o artigo é curto (menos parágrafos do que o targetParagraphIndex)
  if (insertionIndex === -1) {
    if (lastNormalParagraphIndex !== -1) {
      // Se havia pelo menos 1 parágrafo normal, insere logo após ele
      insertionIndex = lastNormalParagraphIndex + 1;
    } else {
      // Se não havia nenhum parágrafo normal (ex: apenas imagens ou títulos), insere no final do artigo
      insertionIndex = result.length;
    }
  }

  // 4. Criação do bloco customizado no formato do Portable Text
  const dynamicBlock: DynamicRelatedPostBlock = {
    _key: `dynamic-related-${relatedPost._id || Date.now()}`,
    _type: 'dynamicRelatedPost',
    data: relatedPost,
  };

  // 5. Inserção do bloco no array usando splice
  result.splice(insertionIndex, 0, dynamicBlock as unknown as PortableTextBlock);

  return result;
}
