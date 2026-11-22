import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let friendly = 'Ocurrió un error inesperado al cargar Primordial.';
    try {
      const parsed = JSON.parse(error.message) as { error?: string; operationType?: string };
      if (parsed?.error) {
        friendly = parsed.error.includes('Missing or insufficient permissions')
          ? 'No tienes permisos para realizar esta acción en este servidor o recurso.'
          : parsed.error;
      }
    } catch {
      if (error?.message) {
        friendly = error.message;
      }
    }
    return { hasError: true, message: friendly };
  }

  override componentDidCatch(error: Error) {
    console.error('Primordial ErrorBoundary:', error.message);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#090a0f] text-white flex items-center justify-center p-5">
          <div className="w-full max-w-md rounded-3xl bg-[#111218] border border-white/15 p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/15 border border-rose-400/30 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>
            <h1 className="font-display font-bold text-lg text-white">
              Algo salió mal
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full dc-btn-primary text-sm font-bold cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Recargar aplicación</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
