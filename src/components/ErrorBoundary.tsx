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
      const activeLang = (localStorage.getItem('ws_lang') || 'it') as 'it' | 'en' | 'es' | 'pl' | 'tr' | 'da';
      const messages = {
        it: {
          title: "Oops! Qualcosa è andato storto",
          desc: "Si è verificato un errore inaspettato nell'applicazione.",
          button: "Ricarica l'App"
        },
        en: {
          title: "Oops! Something went wrong",
          desc: "An unexpected error occurred in the application.",
          button: "Reload App"
        },
        es: {
          title: "¡Oops! Algo salió mal",
          desc: "Ocurrió un error inesperado en la aplicación.",
          button: "Recargar Aplicación"
        },
        pl: {
          title: "Oops! Coś poszło nie tak",
          desc: "Wystąpił nieoczekiwany błąd w aplikacji.",
          button: "Przeładuj aplikację"
        },
        tr: {
          title: "Tüh! Bir şeyler yanlış gitti",
          desc: "Uygulamada beklenmedik bir hata oluştu.",
          button: "Uygulamayı Yeniden Yükle"
        },
        da: {
          title: "Ups! Noget gik galt",
          desc: "Der opstod en uventet fejl i applikationen.",
          button: "Genindlæs appen"
        }
      };
      const currentMsg = messages[activeLang] || messages.it;

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
            {currentMsg.title}
          </h1>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            {currentMsg.desc}
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
            {currentMsg.button}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
