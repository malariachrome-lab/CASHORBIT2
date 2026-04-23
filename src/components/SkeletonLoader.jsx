import React from 'react';

export default function SkeletonLoader({ count = 1, height = '40px', className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {[...Array(count)].map((_, index) => (
        <div
          key={index}
          className="animate-pulse bg-surface-light rounded-md"
          style={{ height: height }}
        ></div>
      ))}
    </div>
  );
}