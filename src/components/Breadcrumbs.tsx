import React from 'react';
import { Home, ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  siteUrl?: string;
}

export default function Breadcrumbs({ items, siteUrl = 'https://parenting.my.id' }: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="my-3 overflow-x-auto whitespace-nowrap scrollbar-none py-1"
    >
      <ol
        itemScope
        itemType="https://schema.org/BreadcrumbList"
        className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium"
      >
        <li
          itemProp="itemListElement"
          itemScope
          itemType="https://schema.org/ListItem"
          className="flex items-center gap-1.5"
        >
          <button
            onClick={items[0]?.onClick}
            className="flex items-center gap-1 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            itemProp="item"
          >
            <Home className="w-3.5 h-3.5" />
            <span itemProp="name">Beranda</span>
          </button>
          <meta itemProp="position" content="1" />
        </li>

        {items.map((item, idx) => {
          const position = idx + 2;
          return (
            <li
              key={idx}
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
              className="flex items-center gap-1.5"
            >
              <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-600 shrink-0" />
              {item.active ? (
                <span
                  itemProp="name"
                  className="font-bold text-slate-900 dark:text-slate-200 truncate max-w-[200px] sm:max-w-[320px]"
                  title={item.label}
                >
                  {item.label}
                </span>
              ) : (
                <button
                  onClick={item.onClick}
                  itemProp="item"
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors truncate max-w-[150px]"
                >
                  <span itemProp="name">{item.label}</span>
                </button>
              )}
              <meta itemProp="position" content={String(position)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
