import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon, ClockIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface CardSummaryProps {
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  lastAction?: string;
  lastActionDate?: Date;
  status?: 'idle' | 'pending' | 'error';
  linkTo?: string;
  externalLink?: string;
  description?: string;
}

const statusColors = {
  idle: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
};

const formatDate = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
};

const CardContent: React.FC<{
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  lastAction?: string;
  lastActionDate?: Date;
  status: 'idle' | 'pending' | 'error';
  description?: string;
  isExternal?: boolean;
}> = ({ title, icon: Icon, lastAction, lastActionDate, status, description, isExternal }) => (
  <div className="p-5">
    <div className="flex items-start justify-between">
      <div className="flex items-center">
        <div className={`p-2.5 rounded-lg ${statusColors[status]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="ml-3">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {isExternal ? (
        <ArrowTopRightOnSquareIcon className="w-5 h-5 text-gray-400 group-hover:text-essensys-primary transition-colors" />
      ) : (
        <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-essensys-primary transition-colors" />
      )}
    </div>

    {lastAction && (
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center text-sm">
          <ClockIcon className="w-4 h-4 text-gray-400 mr-1.5 flex-shrink-0" />
          <span className="text-gray-600 truncate">{lastAction}</span>
          {lastActionDate && (
            <span className="ml-auto text-xs text-gray-400 flex-shrink-0">
              {formatDate(lastActionDate)}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-xs text-gray-400 italic">
          État non garanti (boucle ouverte)
        </p>
      </div>
    )}

    {!lastAction && (
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-400">Aucune action récente</p>
      </div>
    )}
  </div>
);

export const CardSummary: React.FC<CardSummaryProps> = ({
  title,
  icon,
  lastAction,
  lastActionDate,
  status = 'idle',
  linkTo,
  externalLink,
  description,
}) => {
  const cardClass = "block bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 overflow-hidden group";

  if (externalLink) {
    return (
      <a
        href={externalLink}
        target="_blank"
        rel="noopener noreferrer"
        className={cardClass}
      >
        <CardContent
          title={title}
          icon={icon}
          lastAction={lastAction}
          lastActionDate={lastActionDate}
          status={status}
          description={description}
          isExternal
        />
      </a>
    );
  }

  return (
    <Link
      to={linkTo || '/'}
      className={cardClass}
    >
      <CardContent
        title={title}
        icon={icon}
        lastAction={lastAction}
        lastActionDate={lastActionDate}
        status={status}
        description={description}
      />
    </Link>
  );
};

export default CardSummary;
