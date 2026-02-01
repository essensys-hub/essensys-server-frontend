import React, { useState, useRef, useEffect } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success';

interface ActionButtonProps {
  label: string;
  variant?: ButtonVariant;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disableDelay?: number; // Délai en millisecondes pour désactiver le bouton après clic (défaut: 3000ms)
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-essensys-primary hover:bg-essensys-primary-dark text-white',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300',
  danger: 'bg-essensys-danger hover:bg-essensys-danger-dark text-white',
  success: 'bg-essensys-success hover:bg-green-700 text-white',
};

const sizeStyles: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  variant = 'primary',
  onClick,
  disabled = false,
  loading = false,
  icon: Icon,
  className = '',
  size = 'md',
  disableDelay = 3000, // 3 secondes par défaut
}) => {
  const [isTemporarilyDisabled, setIsTemporarilyDisabled] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  // Nettoyer le timeout si le composant est démonté
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    // Exécuter l'action
    onClick();

    // Désactiver le bouton pendant le délai spécifié
    setIsTemporarilyDisabled(true);
    
    // Nettoyer le timeout précédent s'il existe
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    // Réactiver après le délai
    timeoutRef.current = window.setTimeout(() => {
      setIsTemporarilyDisabled(false);
      timeoutRef.current = null;
    }, disableDelay);
  };

  const isDisabled = disabled || loading || isTemporarilyDisabled;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center
        font-medium rounded-lg
        transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-essensys-primary
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : Icon ? (
        <Icon className="w-4 h-4 mr-2 -ml-1" />
      ) : null}
      {label}
    </button>
  );
};

export default ActionButton;
