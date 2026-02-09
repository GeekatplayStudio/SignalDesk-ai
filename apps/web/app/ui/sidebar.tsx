'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

export interface NavItem {
  href: string;
  label: string;
}

export function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 px-3 pb-4">
      {items.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-slate-900/70',
              active ? 'bg-slate-900 text-white' : 'text-slate-300',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
