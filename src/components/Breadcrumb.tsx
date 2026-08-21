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
    <nav className="flex items-center space-x-2 text-xs md:text-sm text-slate-500 mb-6 overflow-x-auto py-1" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 w-full">
        <li className="shrink-0">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Início
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <React.Fragment key={index}>
              <li className="shrink-0">
                <span className="text-slate-400" aria-hidden="true">/</span>
              </li>
              <li className="shrink-0 truncate max-w-[200px] md:max-w-md">
                {item.href ? (
                  <Link href={item.href} className="hover:text-blue-600 transition-colors capitalize">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-slate-800 font-medium" aria-current={isLast ? "page" : undefined}>
                    {item.label}
                  </span>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
