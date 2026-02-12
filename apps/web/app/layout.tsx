import './globals.css';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Providers } from './providers';
import { Sidebar } from './ui/sidebar';

const navItems = [
  { href: '/', label: 'Overview' },
  { href: '/conversations', label: 'Conversations' },
  { href: '/agent-runs', label: 'Agent Runs' },
  { href: '/evals', label: 'Evals' },
  { href: '/metrics', label: 'Metrics' },
  { href: '/simulations', label: 'Simulations' },
  { href: '/incidents', label: 'Incidents' },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <Providers>
          <div className="flex min-h-screen">
            <aside className="hidden md:block w-64 border-r border-slate-900 bg-slate-950/70">
              <div className="px-4 py-5">
                <Link href="/" className="text-xl font-semibold text-white">
                  Geekatplay Studio
                </Link>
              </div>
              <Sidebar items={navItems} />
            </aside>

            <div className="flex-1 flex flex-col">
              <div className="md:hidden sticky top-0 z-20 border-b border-slate-900 bg-slate-950/95 backdrop-blur px-4 py-3">
                <div className="flex items-center justify-between">
                  <Link href="/" className="text-lg font-semibold text-white">
                    Geekatplay Studio
                  </Link>
                </div>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="whitespace-nowrap rounded-md border border-slate-800 px-3 py-1 text-sm text-slate-200 hover:bg-slate-900"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8 bg-slate-950">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
