import React, { useState } from 'react';

export const SprinklerControl: React.FC = () => {
    const [mode, setMode] = useState('0');

    return (
        <div className="esys-zone" id="arrosagecontainer">
            <span>Changement de paramètre à valider</span>
            <div className="esys-validinfo">
                <h3>Arrosage</h3>
                <div className="clear">
                    <label htmlFor="arrosage_255">Automatique (planning)</label>
                    <input
                        type="radio"
                        id="arrosage_255"
                        name="arrosage"
                        value="255"
                        checked={mode === '255'}
                        onChange={(e) => setMode(e.target.value)}
                    />
                </div>
                <div className="clear">
                    <label htmlFor="arrosage_15">Forçage arrosage 15 minutes</label>
                    <input
                        type="radio"
                        id="arrosage_15"
                        name="arrosage"
                        value="15"
                        checked={mode === '15'}
                        onChange={(e) => setMode(e.target.value)}
                    />
                </div>
                <div className="clear">
                    <label htmlFor="arrosage_30">Forçage arrosage 30 minutes</label>
                    <input
                        type="radio"
                        id="arrosage_30"
                        name="arrosage"
                        value="30"
                        checked={mode === '30'}
                        onChange={(e) => setMode(e.target.value)}
                    />
                </div>
                <div className="clear">
                    <label htmlFor="arrosage_60">Forçage arrosage 1 heure</label>
                    <input
                        type="radio"
                        id="arrosage_60"
                        name="arrosage"
                        value="60"
                        checked={mode === '60'}
                        onChange={(e) => setMode(e.target.value)}
                    />
                </div>
                <div className="clear">
                    <label htmlFor="arrosage_0">OFF</label>
                    <input
                        type="radio"
                        id="arrosage_0"
                        name="arrosage"
                        value="0"
                        checked={mode === '0'}
                        onChange={(e) => setMode(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};
