import React from 'react';
import { cn } from '@/lib/utils';
import logoAcai from '@/assets/logo-acai.png';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-10',
    md: 'h-14',
    lg: 'h-20',
  };

  return (
    <div className={cn('flex items-center', className)}>
      <img 
        src={logoAcai} 
        alt="Point do Açaí" 
        className={cn('object-contain', sizeClasses[size])}
      />
    </div>
  );
}
