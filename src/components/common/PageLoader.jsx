import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Consistent full-page loading component
 * Use this for initial page loads
 */
export default function PageLoader({ message = "Loading..." }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30">
      <div className="relative flex items-center justify-center w-32 h-32">
        {/* Animated gradient orb - perfectly centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 blur-3xl opacity-40 animate-pulse"></div>
        </div>
        
        {/* Spinner - perfectly centered on top of glow */}
        <div className="relative z-10">
          <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
        </div>
      </div>
      
      {/* Message */}
      <p className="mt-6 text-sm font-medium text-gray-600 animate-pulse">
        {message}
      </p>
    </div>
  );
}

/**
 * Inline loading component for sections
 */
export function SectionLoader({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
      <p className="mt-3 text-sm text-gray-600">{message}</p>
    </div>
  );
}

/**
 * Button loading spinner
 */
export function ButtonLoader() {
  return <Loader2 className="h-4 w-4 animate-spin" />;
}

/**
 * Compact inline loader
 */
export function InlineLoader({ size = 16 }) {
  return (
    <Loader2 
      className="text-purple-600 animate-spin inline-block" 
      style={{ width: size, height: size }}
    />
  );
}

