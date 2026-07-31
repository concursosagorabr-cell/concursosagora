import React from 'react';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-6 overflow-x-auto py-1" aria-label="Breadcrumb">
      <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors shrink-0">
        Início
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <span className="text-slate-400 shrink-0">/</span>
          {item.href ? (
            <Link href={item.href} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors capitalize shrink-0">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[200px] md:max-w-md">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
