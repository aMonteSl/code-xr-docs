import React from 'react';

const MetricPanel = ({ icon: Icon, value, label, detail, align = 'left', className = '', style }) => {
  const centered = align === 'center';
  const wrapperClassName = [
    'metric-panel group flex h-full flex-col p-6',
    centered ? 'items-center text-center' : 'items-start text-left',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClassName} style={style}>
      {Icon ? (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-neon-blue/20 bg-neon-blue/10 text-neon-blue transition-transform duration-300 group-hover:scale-105">
          <Icon size={20} />
        </div>
      ) : null}

      <div className={`mb-2 text-3xl font-bold leading-none ${value === '-' ? 'text-gray-500' : 'text-white'}`}>
        {value}
      </div>
      <div
        className={`min-h-[3.75rem] text-lg font-medium leading-snug text-neon-blue ${
          centered ? 'flex items-center justify-center' : ''
        }`}
      >
        {label}
      </div>
      <div
        className={`mt-3 min-h-[2.75rem] text-sm leading-relaxed text-gray-400 ${
          centered ? 'flex items-start justify-center' : ''
        }`}
      >
        {detail}
      </div>
    </div>
  );
};

export default MetricPanel;
