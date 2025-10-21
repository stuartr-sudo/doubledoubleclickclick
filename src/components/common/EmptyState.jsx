import React from 'react';
import { Button } from '@/components/ui/button';
import { FileQuestion, AlertCircle } from 'lucide-react';

/**
 * Consistent empty state component
 * Use when lists, tables, or content areas have no data
 */
export default function EmptyState({
  icon: Icon = FileQuestion,
  title = "No items found",
  description = "Get started by creating your first item.",
  action,
  actionLabel = "Create",
  onAction,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {/* Icon with gradient background */}
      <div className="relative mb-4">
        {/* Glow effect */}
        <div className="absolute inset-0 blur-2xl opacity-20">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-blue-600" />
        </div>
        
        {/* Icon container */}
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-950/50 dark:to-blue-950/50">
          <Icon className="h-10 w-10 text-purple-600 dark:text-purple-400" />
        </div>
      </div>

      {/* Text content */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center max-w-sm">
        {description}
      </p>

      {/* Action button */}
      {(action || onAction) && (
        <div className="mt-6">
          {action || (
            <Button
              onClick={onAction}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/30"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Empty state for search results
 */
export function SearchEmptyState({ query, onClear }) {
  return (
    <EmptyState
      title="No results found"
      description={query ? `No matches found for "${query}". Try a different search.` : "Start typing to search."}
      actionLabel="Clear search"
      onAction={onClear}
    />
  );
}

/**
 * Empty state for errors
 */
export function ErrorEmptyState({ error, onRetry }) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="Something went wrong"
      description={error || "We couldn't load the data. Please try again."}
      actionLabel="Retry"
      onAction={onRetry}
    />
  );
}

