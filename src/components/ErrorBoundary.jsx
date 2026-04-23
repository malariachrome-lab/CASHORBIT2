import React from 'react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Cash Orbit caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-error flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Oops! Something went wrong.</h1>
          <p className="text-lg text-text-secondary mb-8">
            We're sorry for the inconvenience. Please try again later.
          </p>
          <Link to="/login" className="btn-primary px-6 py-3">
            Back to Login
          </Link>
          {this.props.showDetails && this.state.error && (
            <details className="mt-8 text-sm text-text-muted">
              <summary className="cursor-pointer">Error Details</summary>
              <pre className="text-left mt-4 p-4 bg-surface-light rounded-lg overflow-x-auto">
                <code>{this.state.error.toString()}</code>
                <br />
                <code>{this.state.errorInfo?.componentStack}</code>
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;