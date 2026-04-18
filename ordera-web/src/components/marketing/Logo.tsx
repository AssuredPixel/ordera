import React from 'react';

export function Logo({ className = '', light = false }: { className?: string; light?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Spark-O Icon */}
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-10 h-10"
      >
        <circle cx="20" cy="20" r="18" stroke={light ? "white" : "#1A1A2E"} strokeWidth="2" />
        <path
          d="M20 8V12M20 28V32M28 20H32M8 20H12M25.6569 14.3431L22.8284 17.1716M17.1716 22.8284L14.3431 25.6569M25.6569 25.6569L22.8284 22.8284M17.1716 17.1716L14.3431 14.3431"
          stroke="#C97B2A"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="20" cy="20" r="4" fill="#C97B2A" />
      </svg>
      {/* Wordmark */}
      <span className={`font-display text-2xl tracking-tight ${light ? 'text-white' : 'text-sidebar'}`}>
        Ordera
      </span>
    </div>
  );
}
