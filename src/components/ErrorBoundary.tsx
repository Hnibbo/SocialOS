import React, { Component, ErrorInfo, ReactNode, ComponentType } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ComponentType<{ error?: Error; reset?: () => void }>;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.logErrorToService(error, errorInfo, this.state.errorId);
  }

  logErrorToService = async (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    try {
      const errorData = {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // Log to Supabase
      const { error: logError } = await fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      }).then(res => res.json());

      if (logError) {
        console.error('Failed to log error:', logError);
      }
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <this.props.fallback error={this.state.error} reset={this.handleReset} />;
      }

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-red-800 dark:text-red-200">
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                We're sorry, but something unexpected happened. Our team has been notified.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-left">
                  <p className="text-sm font-mono text-red-600 dark:text-red-400 mb-2">
                    Error: {this.state.error.message}
                  </p>
                  <details className="text-xs text-gray-500 dark:text-gray-400">
                    <summary>Stack Trace</summary>
                    <pre className="mt-2 whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  </details>
                  {this.state.errorId && (
                    <p className="text-xs text-gray-400 mt-2">
                      Error ID: {this.state.errorId}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Button onClick={this.handleReset} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()} 
                  className="w-full"
                >
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}