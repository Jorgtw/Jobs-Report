import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log su console con prefisso richiesto
    console.error('[ErrorBoundary] Crash catturato:', error, info.componentStack);
  }

  handleReset = () => {
    // Ricarica l'intera applicazione alla home
    window.location.hash = '#/';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          fontFamily: 'system-ui, sans-serif',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>
            Oops! Qualcosa è andato storto
          </h1>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            Si è verificato un errore inaspettato nell'applicazione.
          </p>
          
          {this.state.error && (
            <code style={{
              display: 'block',
              marginBottom: '2rem',
              padding: '1rem',
              background: '#fef2f2',
              color: '#dc2626',
              borderRadius: '0.5rem',
              fontSize: '0.8rem',
              maxWidth: '600px',
              wordBreak: 'break-all',
              textAlign: 'left'
            }}>
              {this.state.error.message}
            </code>
          )}

          <button
            onClick={this.handleReset}
            style={{
              padding: '0.75rem 2rem',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Ricarica l'App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
