import type { AnaliseBlock } from '@/types';
import RichText from './RichText';

interface AnaliseBodyProps {
  blocks: AnaliseBlock[];
}

export default function AnaliseBody({ blocks }: AnaliseBodyProps) {
  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <h2
              key={index}
              className="mt-10 mb-3 border-l-4 border-amber-400 pl-4 text-xl sm:text-2xl font-black leading-tight text-slate-900 scroll-mt-24"
            >
              {block.text}
            </h2>
          );
        }

        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul';

          return (
            <ListTag
              key={index}
              className="my-6 list-none space-y-3.5"
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex gap-3 text-[15px] sm:text-base leading-relaxed text-slate-700">
                  <span
                    aria-hidden="true"
                    className={
                      block.ordered
                        ? 'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-black text-amber-400'
                        : 'mt-[0.55rem] h-2 w-2 shrink-0 rotate-45 bg-amber-500'
                    }
                  >
                    {block.ordered ? itemIndex + 1 : null}
                  </span>
                  <span className="flex-1">
                    <RichText text={item} />
                  </span>
                </li>
              ))}
            </ListTag>
          );
        }

        if (block.type === 'quote') {
          return (
            <blockquote
              key={index}
              className="my-8 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 sm:p-6"
            >
              <p className="text-lg sm:text-xl font-black leading-snug text-slate-900">
                “{block.text}”
              </p>
              {block.cite && (
                <cite className="mt-2 block text-xs font-semibold uppercase tracking-wider text-amber-700 not-italic">
                  {block.cite}
                </cite>
              )}
            </blockquote>
          );
        }

        const isFirst = index === 0;

        return (
          <p
            key={index}
            className={
              isFirst
                ? 'text-lg sm:text-xl leading-relaxed text-slate-700 first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-6xl first-letter:font-black first-letter:leading-[0.75] first-letter:text-slate-900'
                : 'text-[15px] sm:text-base leading-relaxed text-slate-700'
            }
          >
            <RichText text={block.text} />
          </p>
        );
      })}
    </div>
  );
}
