import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Modern button with gradient and glow effects
 * Use this for primary CTAs and important actions
 */
export function GradientButton({ 
  children, 
  loading = false, 
  disabled = false,
  className = '',
  icon: Icon,
  ...props 
}) {
  return (
    <Button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "relative bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700",
        "text-white font-medium shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50",
        "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
        className
      )}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!loading && Icon && <Icon className="mr-2 h-4 w-4" />}
      {children}
    </Button>
  );
}

/**
 * Outline button with purple accent
 */
export function OutlineButton({ 
  children, 
  loading = false,
  className = '',
  icon: Icon,
  ...props 
}) {
  return (
    <Button
      variant="outline"
      {...props}
      className={cn(
        "border-purple-500/50 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30",
        "hover:border-purple-500 transition-all duration-200",
        className
      )}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!loading && Icon && <Icon className="mr-2 h-4 w-4" />}
      {children}
    </Button>
  );
}

/**
 * Ghost button with purple hover
 */
export function GhostButton({ 
  children, 
  loading = false,
  className = '',
  icon: Icon,
  ...props 
}) {
  return (
    <Button
      variant="ghost"
      {...props}
      className={cn(
        "hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/30",
        "transition-all duration-200",
        className
      )}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!loading && Icon && <Icon className="mr-2 h-4 w-4" />}
      {children}
    </Button>
  );
}

/**
 * Icon button with purple accent
 */
export function IconButton({ 
  children, 
  tooltip,
  className = '',
  ...props 
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      {...props}
      title={tooltip}
      className={cn(
        "h-10 w-10 rounded-full hover:bg-purple-50 hover:text-purple-600",
        "dark:hover:bg-purple-950/30 transition-all duration-200",
        className
      )}
    >
      {children}
    </Button>
  );
}

/**
 * Destructive button with modern styling
 */
export function DestructiveButton({ 
  children, 
  loading = false,
  className = '',
  icon: Icon,
  ...props 
}) {
  return (
    <Button
      variant="destructive"
      {...props}
      className={cn(
        "shadow-lg shadow-red-500/20 hover:shadow-red-500/40",
        "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!loading && Icon && <Icon className="mr-2 h-4 w-4" />}
      {children}
    </Button>
  );
}

