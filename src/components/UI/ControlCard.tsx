import React from 'react';

interface ControlCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  highlighted?: boolean;
}

export const ControlCard: React.FC<ControlCardProps> = ({
  title,
  description,
  children,
  className = '',
  highlighted = false,
}) => {
  return (
    <div
      className={`
        bg-white rounded-xl border shadow-sm overflow-hidden
        ${highlighted ? 'border-essensys-primary ring-1 ring-essensys-primary/20' : 'border-gray-200'}
        ${className}
      `}
    >
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="mt-0.5 text-sm text-gray-500">{description}</p>
        )}
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
};

export default ControlCard;
