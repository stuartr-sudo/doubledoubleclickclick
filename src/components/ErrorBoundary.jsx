import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo || { componentStack: 'No stack trace available' }
    });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          margin: '20px', 
          border: '1px solid #ff0000', 
          borderRadius: '8px',
          backgroundColor: '#ffe6e6',
          fontFamily: 'monospace'
        }}>
          <h2 style={{ color: '#ff0000', marginTop: 0 }}>Something went wrong</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Error Details (Click to expand)
            </summary>
            <div style={{ marginTop: '10px' }}>
              <strong>Error:</strong>
              <pre>{this.state.error && this.state.error.toString()}</pre>
              <strong>Stack Trace:</strong>
              <pre>{this.state.errorInfo?.componentStack || 'No stack trace available'}</pre>
            </div>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
