import React from 'react';

const accents = {
  primary: 'text-primary-600 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-400',
  green:   'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400',
  red:     'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400',
  amber:   'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400',
};

const StatCard = ({ label, value, icon: Icon, accent = 'primary' }) => (
  <div className="card flex items-center gap-3">
    {Icon && (
      <div className={`p-2.5 rounded-xl flex-shrink-0 ${accents[accent]}`}>
        <Icon size={20} />
      </div>
    )}
    <div className="min-w-0">
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
      <p className="text-lg sm:text-xl font-bold truncate">{value}</p>
    </div>
  </div>
);

export default StatCard;