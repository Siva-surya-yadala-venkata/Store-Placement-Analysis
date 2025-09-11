import React from 'react';

const LoadingSpinner = ({ size = 'medium', color = 'orange' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const colorClasses = {
    orange: 'text-orange-500',
    blue: 'text-blue-500',
    green: 'text-green-500',
    gray: 'text-gray-500'
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin rounded-full border-2 border-gray-300 border-t-current`}
      />
    </div>
  );
};

export default LoadingSpinner;
