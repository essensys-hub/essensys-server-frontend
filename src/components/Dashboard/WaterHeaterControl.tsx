import React, { useState } from 'react';

export const WaterHeaterControl: React.FC = () => {
    const [mode, setMode] = useState('0'); // Default to ON? checking legacy, not specified, usually standard is auto/hphc

    return (
        <div className="esys-zone" id="cumuluscontainer">
            <span>Changement de paramètre à valider</span>
            <div className="esys-validinfo">
                <h3>Cumulus</h3>
                <div className="clear">
                    <label htmlFor="cumulus_0">ON (autonome)</label>
                    <input
                        type="radio"
                        id="cumulus_0"
                        name="cumulus"
                        value="0"
                        checked={mode === '0'}
                        onChange={(e) => setMode(e.target.value)}
                    />
                </div>
                <div className="clear">
                    <label htmlFor="cumulus_1">Suivi HP/HC</label>
                    <input
                        type="radio"
                        id="cumulus_1"
                        name="cumulus"
                        value="1"
                        checked={mode === '1'}
                        onChange={(e) => setMode(e.target.value)}
                    />
                </div>
                <div className="clear">
                    <label htmlFor="cumulus_2">OFF</label>
                    <input
                        type="radio"
                        id="cumulus_2"
                        name="cumulus"
                        value="2"
                        checked={mode === '2'}
                        onChange={(e) => setMode(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};
