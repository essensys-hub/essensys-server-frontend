import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// Common interface for any dashboard item value
export interface DashboardState {
    [key: string]: string | boolean; // Can store primitive values like '1', '0', true, false
}

export interface DashboardContextProps {
    // Current state of all items
    state: DashboardState;
    // Update a single item
    setValue: (key: string, value: string | boolean) => void;
    // Update multiple items at once (e.g. "Opening all shutters")
    setValues: (values: DashboardState) => void;
    // Get value safely
    getValue: (key: string) => string | boolean | undefined;
}

const DashboardContext = createContext<DashboardContextProps | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<DashboardState>({});

    const setValue = useCallback((key: string, value: string | boolean) => {
        setState((prev) => ({ ...prev, [key]: value }));
    }, []);

    const setValues = useCallback((values: DashboardState) => {
        setState((prev) => ({ ...prev, ...values }));
    }, []);

    const getValue = useCallback((key: string) => state[key], [state]);

    return (
        <DashboardContext.Provider value={{ state, setValue, setValues, getValue }}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = (): DashboardContextProps => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
};
