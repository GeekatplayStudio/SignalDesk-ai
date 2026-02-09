import './globals.css';
import type { ReactNode } from 'react';
import { Providers } from './providers';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <Providers>
          <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
