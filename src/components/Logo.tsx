import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <div className="w-10 h-10 rounded-full gradient-acai flex items-center justify-center shadow-button">
          <span className="text-2xl">🍇</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-tropical rounded-full flex items-center justify-center">
          <span className="text-[10px]">✨</span>
        </div>
      </div>
      <div className="flex flex-col">
        <span className={cn('font-display font-bold text-gradient-acai leading-tight', sizeClasses[size])}>
          Point do Açaí
        </span>
        {size === 'lg' && (
          <span className="text-sm text-muted-foreground font-medium">
            O melhor açaí da cidade
          </span>
        )}
      </div>
    </div>
  );
}
