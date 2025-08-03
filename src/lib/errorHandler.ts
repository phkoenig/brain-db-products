/**
 * Global Error Handler für JavaScript-Fehler
 * Fängt unhandled errors ab und loggt sie
 */

interface ErrorLog {
  type: 'javascript_error' | 'react_error' | 'api_error';
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  additionalData?: any;
}

class ErrorHandler {
  private isInitialized = false;

  init() {
    if (this.isInitialized) return;
    
    // Global error handler
    window.addEventListener('error', this.handleError.bind(this));
    
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    
    // Console error interceptor
    this.interceptConsoleErrors();
    
    this.isInitialized = true;
    console.log('🔧 Error Handler initialized');
  }

  private handleError(event: ErrorEvent) {
    const errorLog: ErrorLog = {
      type: 'javascript_error',
      message: event.message,
      stack: event.error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      additionalData: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    };

    this.logError(errorLog);
  }

  private handlePromiseRejection(event: PromiseRejectionEvent) {
    const errorLog: ErrorLog = {
      type: 'javascript_error',
      message: event.reason?.message || 'Unhandled Promise Rejection',
      stack: event.reason?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      additionalData: {
        reason: event.reason
      }
    };

    this.logError(errorLog);
  }

  private interceptConsoleErrors() {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      // Log to console as usual
      originalError.apply(console, args);
      
      // Also log to our error handler if it's an error object
      const errorArg = args.find(arg => arg instanceof Error);
      if (errorArg) {
        this.logError({
          type: 'javascript_error',
          message: errorArg.message,
          stack: errorArg.stack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          additionalData: { consoleArgs: args }
        });
      }
    };

    console.warn = (...args) => {
      // Log to console as usual
      originalWarn.apply(console, args);
      
      // Log warnings in development
      if (process.env.NODE_ENV === 'development') {
        this.logError({
          type: 'javascript_error',
          message: `Warning: ${args.join(' ')}`,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          additionalData: { consoleArgs: args, severity: 'warning' }
        });
      }
    };
  }

  private async logError(errorLog: ErrorLog) {
    // Always log to console
    console.group('🚨 Error Handler');
    console.error('Type:', errorLog.type);
    console.error('Message:', errorLog.message);
    console.error('URL:', errorLog.url);
    console.error('Timestamp:', errorLog.timestamp);
    if (errorLog.stack) {
      console.error('Stack:', errorLog.stack);
    }
    if (errorLog.additionalData) {
      console.error('Additional Data:', errorLog.additionalData);
    }
    console.groupEnd();

    // Send to API for logging
    try {
      await fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorLog)
      });
    } catch (apiError) {
      console.error('Failed to log error to API:', apiError);
    }
  }

  // Public method to manually log errors
  logManualError(error: Error, additionalData?: any) {
    this.logError({
      type: 'javascript_error',
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      additionalData
    });
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler();

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  errorHandler.init();
} 