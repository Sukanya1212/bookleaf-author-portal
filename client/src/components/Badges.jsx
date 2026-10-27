import React from 'react';

export function PriorityBadge({ priority }) {
  const configs = {
    Critical: {
      bg: 'bg-rose-50 border-rose-200 text-rose-700',
      dot: 'bg-rose-500 animate-pulse'
    },
    High: {
      bg: 'bg-amber-50 border-amber-200 text-amber-700',
      dot: 'bg-amber-500'
    },
    Medium: {
      bg: 'bg-sky-50 border-sky-200 text-sky-700',
      dot: 'bg-sky-500'
    },
    Low: {
      bg: 'bg-slate-100 border-slate-200 text-slate-600',
      dot: 'bg-slate-400'
    }
  };

  const config = configs[priority] || configs.Medium;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {priority}
    </span>
  );
}

export function StatusBadge({ status }) {
  const configs = {
    Open: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    'In Progress': 'bg-amber-50 border-amber-200 text-amber-700',
    Resolved: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    Closed: 'bg-slate-100 border-slate-200 text-slate-600'
  };

  const style = configs[status] || configs.Open;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {status}
    </span>
  );
}

export function CategoryBadge({ category }) {
  const configs = {
    'Royalty & Payments': 'bg-purple-50 text-purple-700 border-purple-200',
    'ISBN & Metadata Issues': 'bg-rose-50 text-rose-700 border-rose-200',
    'Printing & Quality': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'Distribution & Availability': 'bg-blue-50 text-blue-700 border-blue-200',
    'Book Status & Production Updates': 'bg-teal-50 text-teal-700 border-teal-200',
    'General Inquiry': 'bg-slate-100 text-slate-700 border-slate-200'
  };

  const style = configs[category] || configs['General Inquiry'];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      {category}
    </span>
  );
}
