import type { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function PublicPageShell({ children }: { children: ReactNode }) {
  return <div className="editorial-page flex min-h-dvh flex-col antialiased"><Navbar /><main className="flex-1">{children}</main><Footer /></div>;
}
