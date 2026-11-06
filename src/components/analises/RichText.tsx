import { Fragment } from 'react';

interface RichTextProps {
  text: string;
  strongClassName?: string;
}

/**
 * Renderiza o subconjunto de marcação usado nas análises: **negrito**.
 * Evita `dangerouslySetInnerHTML` e mantém o conteúdo 100% tipado.
 */
export default function RichText({
  text,
  strongClassName = 'font-extrabold text-slate-900',
}: RichTextProps) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return (
            <strong key={index} className={strongClassName}>
              {part.slice(2, -2)}
            </strong>
          );
        }

        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}
