'use client';

import { useEffect } from 'react';

export default function ErrorSuppressor() {
  useEffect(() => {
    // Suppress Chrome extension errors
    const originalError = console.error;
    console.error = (...args) => {
      // Filter out known browser extension errors
      const errorString = args.join(' ');
      if (
        errorString.includes('chrome-extension://') ||
        errorString.includes('all-frames.js') ||
        errorString.includes('Could not establish connection') ||
        errorString.includes('Receiving end does not exist') ||
        errorString.includes('chrome://') ||
        errorString.includes('postMessage')
      ) {
        // Silently ignore these errors
        return;
      }
      originalError.apply(console, args);
    };

    // Suppress unhandled promise rejections from extensions
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || String(event.reason);
      if (
        reason.includes('Could not establish connection') ||
        reason.includes('chrome-extension://') ||
        reason.includes('all-frames.js')
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      console.error = originalError;
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}
