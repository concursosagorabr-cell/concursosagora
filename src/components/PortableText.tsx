import React from 'react';
import { PortableText as PortableTextReact, PortableTextComponents } from '@portabletext/react';
import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/image';
import { PortableTextBlock } from '@/types';
import DynamicRelatedPost from './DynamicRelatedPost';

interface PortableTextProps {
  value: PortableTextBlock[];
}

const components: PortableTextComponents = {
  block: {
    h1: ({ children }) => (
      <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mt-10 mb-5 border-b pb-3 border-slate-200">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mt-10 mb-4 flex items-center gap-3 border-l-4 border-blue-600 pl-4 py-2 bg-slate-100/80 rounded-r-xl shadow-2xs">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl md:text-2xl font-bold tracking-tight text-blue-900 mt-8 mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-lg md:text-xl font-semibold text-slate-900 mt-6 mb-2">
        {children}
      </h4>
    ),
    normal: ({ children }) => (
      <p className="text-slate-800 leading-relaxed text-base md:text-lg mb-6 font-normal">
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-indigo-600 bg-gradient-to-r from-indigo-50/80 to-blue-50/40 p-6 rounded-r-2xl my-8 text-slate-800 italic font-medium shadow-xs">
        <div className="flex gap-3">
          <span className="text-3xl text-indigo-500 font-serif select-none">“</span>
          <div className="flex-1">{children}</div>
        </div>
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="space-y-3 mb-8 text-slate-800 text-base md:text-lg pl-2">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal list-inside space-y-3 mb-8 text-slate-800 text-base md:text-lg pl-4 font-medium">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="flex items-start gap-3 leading-relaxed">
        <span className="mt-2.5 w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
        <span className="flex-1">{children}</span>
      </li>
    ),
    number: ({ children }) => (
      <li className="leading-relaxed pl-1">{children}</li>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-bold text-slate-900 bg-blue-50/80 px-1 py-0.5 rounded border border-blue-100">
        {children}
      </strong>
    ),
    em: ({ children }) => (
      <em className="italic text-slate-800">{children}</em>
    ),
    underline: ({ children }) => (
      <u className="underline underline-offset-4 decoration-blue-500">{children}</u>
    ),
    link: ({ value, children }) => {
      const rawHref = String(value?.href || '').trim();
      // Sanitização de protocolo contra XSS (bloqueia javascript:, data:, vbscript:, etc.)
      const isSafeProtocol =
        rawHref.startsWith('/') ||
        rawHref.startsWith('#') ||
        /^https?:\/\//i.test(rawHref) ||
        /^mailto:/i.test(rawHref) ||
        /^tel:/i.test(rawHref);

      const safeHref = isSafeProtocol ? rawHref : '#';
      const target = safeHref.startsWith('http') ? '_blank' : undefined;

      return (
        <Link
          href={safeHref}
          target={target}
          rel={target === '_blank' ? 'noopener noreferrer' : undefined}
          className="text-blue-600 font-semibold underline underline-offset-4 hover:text-blue-800 transition-colors"
        >
          {children}
        </Link>
      );
    },
    code: ({ children }) => (
      <code className="bg-slate-100 text-pink-600 font-mono text-sm px-2 py-1 rounded border border-slate-200">
        {children}
      </code>
    ),
  },
  types: {
    image: ({ value }) => {
      if (!value?.asset) return null;
      const imageUrl = getImageUrl(value, 1200, 700);
      return (
        <figure className="my-10 rounded-2xl overflow-hidden shadow-xl border border-slate-200">
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
            <figcaption className="text-center text-xs md:text-sm text-slate-600 py-3 bg-slate-50 border-t border-slate-200 italic">
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
    dynamicRelatedPost: DynamicRelatedPost,
  },
};

export default function PortableText({ value }: PortableTextProps) {
  if (!value || !Array.isArray(value)) return null;
  return <PortableTextReact value={value} components={components} />;
}
