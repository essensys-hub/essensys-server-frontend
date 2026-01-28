import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface PageHeaderProps {
  title: string;
  description?: string;
  backLink?: string;
  backLabel?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  backLink,
  backLabel = 'Retour',
  icon: Icon,
  actions,
}) => {
  return (
    <div className="mb-6">
      {backLink && (
        <Link
          to={backLink}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          {backLabel}
        </Link>
      )}
      
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          {Icon && (
            <div className="p-2.5 bg-essensys-primary/10 rounded-lg mr-3">
              <Icon className="w-7 h-7 text-essensys-primary" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
