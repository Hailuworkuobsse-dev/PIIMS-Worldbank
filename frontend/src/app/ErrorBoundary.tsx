import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertOctagon, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // In production: forward to Sentry / logging service
    if (import.meta.env.PROD) {
      // eslint-disable-next-line no-console
      console.error("[PIIMS] Unhandled error", { error, errorInfo });
    }
  }

  reset = () => {
    this.setState({ error: null, errorInfo: null });
  };

  override render() {
    if (!this.state.error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback(this.state.error, this.reset);
    }

    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-lg border border-neutral-300 shadow-lg p-6 text-center">
          <AlertOctagon className="h-14 w-14 text-danger mx-auto" aria-hidden />
          <h1 className="text-h2 text-primary-900 mt-4">
            Something went wrong
          </h1>
          <p className="text-body-sm text-neutral-600 mt-2">
            An unexpected error occurred. Your data is safe. Try reloading the
            page. If the problem persists, contact{" "}
            <a
              className="text-primary-700 underline"
              href="mailto:support@piims.gov.et"
            >
              support@piims.gov.et
            </a>
            .
          </p>
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-caption font-semibold text-neutral-600">
                Error details (development only)
              </summary>
              <pre className="mt-2 p-3 bg-neutral-100 rounded-md text-caption overflow-auto max-h-64 text-danger">
                {this.state.error.message}
                {"\n\n"}
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <div className="flex gap-2 mt-6 justify-center">
            <button
              type="button"
              onClick={this.reset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary-700 text-white font-semibold hover:bg-primary-900"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Try again
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/dashboard";
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white text-primary-700 border border-primary-300 font-semibold hover:bg-primary-100"
            >
              <Home className="h-4 w-4" aria-hidden />
              Go home
            </button>
          </div>
        </div>
      </div>
    );
  }
}