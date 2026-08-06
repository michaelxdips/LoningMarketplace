import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';

export class PageErrorBoundary extends Component<{
  children: ReactNode;
  resetKey?: string;
  homeTo?: string;
}, { error: Error | null }> {
  declare readonly props: Readonly<{ children: ReactNode; resetKey?: string; homeTo?: string }>;
  declare setState: Component<{ children: ReactNode; resetKey?: string; homeTo?: string }, { error: Error | null }>['setState'];
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Avoid logging props, request data, cookies, or headers.
    console.error('Route render failed', { name: error.name, componentStack: info.componentStack?.slice(0, 1000) });
  }

  componentDidUpdate(previous: Readonly<{ children: ReactNode; resetKey?: string; homeTo?: string }>) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <section role="alert" className="mx-auto my-10 max-w-xl rounded-2xl border border-red-200 bg-white p-7 text-center shadow-sm">
        <h1 className="text-2xl font-extrabold text-charcoal">Halaman tidak dapat ditampilkan</h1>
        <p className="mt-3 text-sm leading-6 text-warm-gray">Terjadi gangguan saat memuat halaman ini. Coba lagi atau kembali ke halaman sebelumnya.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" className="focus-ring rounded-xl bg-forest px-4 py-2.5 text-sm font-bold text-white" onClick={() => this.setState({ error: null })}>Coba lagi</button>
          <Link to={this.props.homeTo ?? '/'} className="focus-ring rounded-xl border border-sage-border bg-white px-4 py-2.5 text-sm font-bold text-forest">Kembali</Link>
        </div>
      </section>
    );
  }
}

export function RouteErrorBoundary({ children, homeTo }: { children: ReactNode; homeTo?: string }) {
  const location = useLocation();
  return <PageErrorBoundary resetKey={`${location.pathname}${location.search}`} homeTo={homeTo}>{children}</PageErrorBoundary>;
}
