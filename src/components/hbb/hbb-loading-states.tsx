// HBB Loading States - Consistent loading components
import React from 'react';
import { hbb } from './hbb-design-system';

export const LoadingSpinner = ({ size = 'md', color = 'primary' }: { size?: 'sm' | 'md' | 'lg', color?: string }) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  return (
    <div 
      className={`${sizeMap[size]} border-2 border-t-transparent rounded-full animate-spin`}
      style={{ 
        borderColor: hbb.color(color, 200),
        borderTopColor: hbb.color(color, 600)
      }}
    />
  );
};

export const SkeletonCard = ({ height = 'auto' }: { height?: string }) => (
  <div 
    className="bg-gray-200 rounded-xl animate-pulse"
    style={{ 
      height: height || 'auto',
      borderRadius: hbb.radius('xl')
    }}
  />
);

export const SkeletonText = ({ width = '100%', height = '1rem' }: { width?: string, height?: string }) => (
  <div 
    className="bg-gray-200 rounded animate-pulse"
    style={{ 
      width, 
      height,
      borderRadius: hbb.radius('sm')
    }}
  />
);

export const LoadingCard = ({ children }: { children: React.ReactNode }) => (
  <div 
    className="bg-white border shadow-sm"
    style={{ 
      borderRadius: hbb.radius('2xl'),
      borderColor: hbb.color('gray', 200),
      boxShadow: hbb.shadow('sm'),
      transition: hbb.transition('normal')
    }}
  >
    {children}
  </div>
);
