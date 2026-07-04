import React from 'react';

export const CardSkeleton = () => (
  <div className="card space-y-3">
    <div className="skeleton h-4 w-1/3" />
    <div className="skeleton h-7 w-1/2" />
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 5 }) => (
  <div className="card space-y-3">
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-3">
        {Array.from({ length: cols }).map((_, c) => (
          <div key={c} className="skeleton h-5 flex-1" />
        ))}
      </div>
    ))}
  </div>
);
