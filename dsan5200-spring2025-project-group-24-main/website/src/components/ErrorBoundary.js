import React, { Component } from 'react';

// Fallback UI to show in case of an error
const FallbackUI = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h2>Something went wrong. Please try again later.</h2>
  </div>
);

// ErrorBoundary class component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  // Static lifecycle method that catches errors
  static getDerivedStateFromError(error) {
    return { hasError: true }; // Update state to show fallback UI
  }

  // You can also log the error to an error reporting service
  componentDidCatch(error, info) {
    console.log("Error caught in ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI when an error is caught
      return <FallbackUI />;
    }

    return this.props.children; // Render child components if no error
  }
}

export default ErrorBoundary;
