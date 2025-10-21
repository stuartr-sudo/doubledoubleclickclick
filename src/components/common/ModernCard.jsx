import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Modern card component with consistent styling
 * Replaces basic Card usage with enhanced visuals
 */
export default function ModernCard({
  title,
  description,
  children,
  footer,
  icon,
  variant = 'default', // 'default' | 'gradient' | 'glass'
  hover = true,
  className = '',
  headerAction,
}) {
  const variants = {
    default: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800',
    gradient: 'bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-800',
    glass: 'backdrop-blur-md bg-white/50 dark:bg-gray-900/50 border-purple-500/20',
  };

  const hoverClass = hover
    ? 'hover:border-purple-500/50 hover:shadow-lg transition-all duration-200'
    : '';

  return (
    <Card
      className={`
        ${variants[variant]}
        ${hoverClass}
        border
        shadow-sm
        ${className}
      `}
    >
      {(title || description || icon) && (
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              {icon && (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30">
                  {icon}
                </div>
              )}
              <div className="flex-1">
                {title && (
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                    {title}
                  </CardTitle>
                )}
                {description && (
                  <CardDescription className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {description}
                  </CardDescription>
                )}
              </div>
            </div>
            {headerAction && (
              <div className="ml-2">
                {headerAction}
              </div>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent>
        {children}
      </CardContent>

      {footer && (
        <CardFooter className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}

/**
 * Stat card for metrics and KPIs
 */
export function StatCard({ title, value, change, icon, trend = 'neutral' }) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  };

  return (
    <ModernCard
      variant="gradient"
      hover={false}
      className="relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 opacity-10 blur-2xl" />
      
      <div className="relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
            {change && (
              <p className={`mt-1 text-sm font-medium ${trendColors[trend]}`}>
                {change}
              </p>
            )}
          </div>
          {icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-gray-800 text-purple-600 shadow-lg">
              {icon}
            </div>
          )}
        </div>
      </div>
    </ModernCard>
  );
}

/**
 * Feature card for showcasing features
 */
export function FeatureCard({ title, description, icon, action }) {
  return (
    <ModernCard
      title={title}
      description={description}
      icon={icon}
      variant="default"
      hover={true}
      footer={action}
      className="h-full"
    />
  );
}

