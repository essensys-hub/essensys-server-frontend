import React from 'react';
import { useDashboard } from '../../context/DashboardContext';

export interface HeatingOption {
    value: string;
    label: string;
}

interface HeatingControlProps {
    id: string;
    title: string;
    name: string;
    options: HeatingOption[];
}

export const HeatingControl: React.FC<HeatingControlProps> = ({ id, title, name, options }) => {
    const { state, setValue } = useDashboard();
    const selectedValue = (state[name] as string) || options[0]?.value || '';

    // Helper: Legacy app shows "Changement de paramètre à valider" (red text) if value != initial
    // In React, we check if state[name] is present.
    // Ideally we should track "initial" values too. For now, simple modification check:
    const isModified = state[name] !== undefined;

    return (
        <div className="esys-zone" id={id}>
            <span style={{ display: isModified ? 'inline' : 'none', color: 'red', fontSize: '10px' }}>
                Changement de paramètre à valider
            </span>
            <div className={`esys-validinfo ${isModified ? 'tovalidate' : ''}`}>
                <h3>{title}</h3>
                {options.map((option) => (
                    <div className="clear" key={option.value}>
                        <label htmlFor={`${name}_${option.value}`}>{option.label}</label>
                        <input
                            type="radio"
                            id={`${name}_${option.value}`}
                            name={name}
                            value={option.value}
                            checked={selectedValue === option.value}
                            onChange={(e) => setValue(name, e.target.value)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
