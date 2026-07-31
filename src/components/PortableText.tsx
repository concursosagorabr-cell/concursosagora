import React from 'react';
import { PortableText as PortableTextReact, PortableTextComponents } from '@portabletext/react';
import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/image';
import { PortableTextBlock } from '@/types';

interface PortableTextProps {
  value: PortableTextBlock[];
}

const components: PortableTextComponents = {
  block: {
    h1: ({ children }) => (
      <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white mt-10 mb-5 border-b pb-3 border-slate-200 dark:border-slate-800">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-10 mb-4 flex items-center gap-3 border-l-4 border-blue-600 dark:border-blue-500 pl-4 py-1 bg-slate-100/60 dark:bg-slate-900/60 rounded-r-xl shadow-2xs">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl md:text-2xl font-bold tracking-tight text-blue-900 dark:text-blue-300 mt-8 mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"></span>
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-lg md:text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-2">
        {children}
      </h4>
    ),
    normal: ({ children }) => (
      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base md:text-lg mb-6">
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-indigo-600 bg-gradient-to-r from-indigo-50/80 to-blue-50/40 dark:from-slate-900/90 dark:to-slate-900/40 dark:border-indigo-500 p-6 rounded-r-2xl my-8 text-slate-800 dark:text-slate-200 italic font-medium shadow-xs">
        <div className="flex gap-3">
          <span className="text-3xl text-indigo-500 font-serif select-none">“</span>
          <div className="flex-1">{children}</div>
        </div>
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="space-y-3 mb-8 text-slate-700 dark:text-slate-300 text-base md:text-lg pl-2">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal list-inside space-y-3 mb-8 text-slate-700 dark:text-slate-300 text-base md:text-lg pl-4 font-medium">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="flex items-start gap-3 leading-relaxed">
        <span className="mt-2.5 w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0"></span>
        <span className="flex-1">{children}</span>
      </li>
    ),
    number: ({ children }) => (
      <li className="leading-relaxed pl-1">{children}</li>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-bold text-slate-900 dark:text-white bg-blue-50 dark:bg-blue-950/40 px-1 py-0.5 rounded border border-blue-100 dark:border-blue-900/50">
        {children}
      </strong>
    ),
    em: ({ children }) => (
      <em className="italic text-slate-800 dark:text-slate-200">{children}</em>
    ),
    underline: ({ children }) => (
      <u className="underline underline-offset-4 decoration-blue-500">{children}</u>
    ),
    link: ({ value, children }) => {
      const target = (value?.href || '').startsWith('http') ? '_blank' : undefined;
      return (
        <Link
          href={value?.href || '#'}
          target={target}
          rel={target === '_blank' ? 'noopener noreferrer' : undefined}
          className="text-blue-600 dark:text-blue-400 font-semibold underline underline-offset-4 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
        >
          {children}
        </Link>
      );
    },
    code: ({ children }) => (
      <code className="bg-slate-100 dark:bg-slate-800 text-pink-600 dark:text-pink-400 font-mono text-sm px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
        {children}
      </code>
    ),
  },
  types: {
    image: ({ value }) => {
      if (!value?.asset) return null;
      const imageUrl = getImageUrl(value, 1200, 700);
      return (
        <figure className="my-10 rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
          <div className="relative w-full h-[320px] sm:h-[420px] md:h-[500px]">
            <Image
              src={imageUrl}
              alt={value.alt || 'Imagem explicativa do artigo'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 900px"
            />
          </div>
          {value.caption && (
            <figcaption className="text-center text-xs md:text-sm text-slate-500 dark:text-slate-400 py-3 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 italic">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
    code: ({ value }) => (
      <pre className="bg-slate-950 text-slate-100 p-5 rounded-2xl overflow-x-auto my-8 font-mono text-sm border border-slate-800 shadow-xl">
        <code>{value?.code || value}</code>
      </pre>
    ),
  },
};

export default function PortableText({ value }: PortableTextProps) {
  if (!value || !Array.isArray(value)) return null;
  return <PortableTextReact value={value} components={components} />;
}
