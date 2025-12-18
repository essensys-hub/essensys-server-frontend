import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import type { LegacyMapping } from '../../services/legacyApi';

interface LightItem extends LegacyMapping {
    label: string;
}

export const mainLights: LightItem[] = [
    { label: 'Terrasse', name: 'terrasse', dindex: '', dvalue: '4', onIndex: '616', offIndex: '610' },
    { label: 'Entrée', name: 'entree', dindex: '', dvalue: '1', onIndex: '611', offIndex: '605' },
    { label: 'Escalier', name: 'escalier', dindex: '', dvalue: '1', onIndex: '613', offIndex: '607' },
    { label: 'Dégagement 1', name: 'deg1', dindex: '', dvalue: '1', onIndex: '616', offIndex: '610' },
    { label: 'Dégagement 2', name: 'deg2', dindex: '', dvalue: '2', onIndex: '616', offIndex: '610' },
    { label: 'Pièce de service', name: 'pieceserv', dindex: '', dvalue: '128', onIndex: '615', offIndex: '609' },
    { label: 'Annexe 1', name: 'ann1', dindex: '', dvalue: '8', onIndex: '616', offIndex: '610' },
    { label: 'Annexe 2', name: 'ann2', dindex: '', dvalue: '16', onIndex: '616', offIndex: '610' },
    { label: 'Salon', name: 'salon', dindex: '', dvalue: '128', onIndex: '612', offIndex: '606' },
    { label: 'Salle à Manger', name: 'sam', dindex: '', dvalue: '64', onIndex: '612', offIndex: '606' },
    { label: 'Cuisine', name: 'cuisine', dindex: '', dvalue: '1', onIndex: '615', offIndex: '609' },
    { label: 'Salle de Bain 1', name: 'sdb1', dindex: '', dvalue: '128', onIndex: '616', offIndex: '610' },
    { label: 'Salle de Bain 2', name: 'sdb2', dindex: '', dvalue: '8', onIndex: '615', offIndex: '609' },
    { label: 'WC 1', name: 'wc1', dindex: '', dvalue: '32', onIndex: '615', offIndex: '609' },
    { label: 'WC 2', name: 'wc2', dindex: '', dvalue: '64', onIndex: '615', offIndex: '609' },
    { label: 'Bureau', name: 'bureau', dindex: '', dvalue: '32', onIndex: '612', offIndex: '606' },
    { label: 'Grande Chambre', name: 'gdchamb', dindex: '', dvalue: '128', onIndex: '614', offIndex: '608' },
    { label: 'Petite Chambre 1', name: 'ptchamb1', dindex: '', dvalue: '64', onIndex: '614', offIndex: '608' },
    { label: 'Petite Chambre 2', name: 'ptchamb2', dindex: '', dvalue: '32', onIndex: '614', offIndex: '608' },
    { label: 'Petite Chambre 3', name: 'ptchamb3', dindex: '', dvalue: '16', onIndex: '614', offIndex: '608' },
    { label: 'Dressing', name: 'dressing', dindex: '', dvalue: '8', onIndex: '611', offIndex: '605' },
];

export const indirectLights: LightItem[] = [
    { label: 'Salon (indirect 1)', name: 'isalonind', dindex: '', dvalue: '2', onIndex: '611', offIndex: '605' },
    { label: 'Salon (indirect 2)', name: 'isalonind2', dindex: '', dvalue: '4', onIndex: '611', offIndex: '605' },
    { label: 'Cuisine (plans de travail)', name: 'icuisine', dindex: '', dvalue: '2', onIndex: '615', offIndex: '609' },
    { label: 'Salle de Bain 1 (miroir)', name: 'isdb1', dindex: '', dvalue: '4', onIndex: '615', offIndex: '609' },
    { label: 'Salle de Bain 2 (miroir)', name: 'isdb2', dindex: '', dvalue: '16', onIndex: '615', offIndex: '609' },
    { label: 'Grande Chambre (chevet 1)', name: 'igdchamb1', dindex: '', dvalue: '2', onIndex: '613', offIndex: '607' },
    { label: 'Grande Chambre (chevet 2)', name: 'igdchamb2', dindex: '', dvalue: '4', onIndex: '613', offIndex: '607' },
    { label: 'Petite Chambre 1 (chevet 1)', name: 'iptchamb1', dindex: '', dvalue: '8', onIndex: '613', offIndex: '607' },
    { label: 'Petite Chambre 1 (chevet 2)', name: 'iptchamb2', dindex: '', dvalue: '16', onIndex: '613', offIndex: '607' }, // Note: legacy duplicated iptchamb2 key or label? Checked legacy view: label is "Petite Chambre 1 (chevet 2)" but name iptchamb2. Mapped correctly.
    { label: 'Petite Chambre 2 (chevet)', name: 'iptchamb22', dindex: '', dvalue: '32', onIndex: '613', offIndex: '607' },
    { label: 'Petite Chambre 3 (chevet)', name: 'iptchamb3', dindex: '', dvalue: '64', onIndex: '613', offIndex: '607' },
    { label: 'Dressing (placards)', name: 'idressing', dindex: '', dvalue: '16', onIndex: '611', offIndex: '605' },
];

export const LightingControl: React.FC = () => {
    const { state, setValue, setValues } = useDashboard();

    // Check if any light in the group is modified
    const isMainModified = mainLights.some(item => state[item.name] !== undefined);
    const isIndirectModified = indirectLights.some(item => state[item.name] !== undefined);
    const isGroupModified = isMainModified || isIndirectModified;

    const handleGroup = (items: LightItem[], value: string) => {
        const updates: Record<string, string> = {};
        items.forEach((item) => {
            updates[item.name] = value;
        });
        setValues(updates);
    };

    const renderRows = (items: LightItem[]) => {
        return items.map((item) => {
            const val = (state[item.name] as string) || '';
            return (
                <div className="clear large" key={item.name}>
                    <label htmlFor={`${item.name}_1`}>{item.label}</label>
                    <input
                        type="radio"
                        className="radiocol1 escpl"
                        id={`${item.name}_1`}
                        name={item.name}
                        value="1"
                        checked={val === '1'}
                        onChange={() => setValue(item.name, '1')}
                    />
                    <input
                        type="radio"
                        className="radiocol2 escpl"
                        id={`${item.name}_0`}
                        name={item.name}
                        value="0"
                        checked={val === '0'}
                        onChange={() => setValue(item.name, '0')}
                    />
                </div>
            );
        });
    };

    return (
        <div className="esys-zone" id="eclairage">
            <span style={{ display: isGroupModified ? 'inline' : 'none', color: 'red', fontSize: '10px' }}>
                Changement de paramètre à valider
            </span>
            <div className={`esys-validinfo ${isGroupModified ? 'tovalidate' : ''}`}>
                <h3>Eclairages</h3>

                <div className="clear large" style={{ marginTop: '15px', marginBottom: '0px' }}>
                    <div className="radiocoltitle">Principaux</div>
                </div>
                <div className="large" style={{ marginTop: '0px' }}>
                    <div className="clear large">
                        <a
                            href="#"
                            id="openecldir"
                            className="radiocol1g on"
                            onClick={(e) => {
                                e.preventDefault();
                                handleGroup(mainLights, '1');
                            }}
                        >
                            On
                        </a>
                        <a
                            href="#"
                            id="closeecldir"
                            className="radiocol2g off"
                            onClick={(e) => {
                                e.preventDefault();
                                handleGroup(mainLights, '0');
                            }}
                        >
                            Off
                        </a>
                    </div>
                    {renderRows(mainLights)}
                </div>

                <div className="clear large" style={{ marginTop: '15px', marginBottom: '0px' }}>
                    <div className="radiocoltitle">Indirects</div>
                </div>
                <div className="large" style={{ marginTop: '0px' }}>
                    <div className="clear large">
                        <a
                            href="#"
                            id="openeclind"
                            className="radiocol1g on"
                            onClick={(e) => {
                                e.preventDefault();
                                handleGroup(indirectLights, '1');
                            }}
                        >
                            On
                        </a>
                        <a
                            href="#"
                            id="closeeclind"
                            className="radiocol2g off"
                            onClick={(e) => {
                                e.preventDefault();
                                handleGroup(indirectLights, '0');
                            }}
                        >
                            Off
                        </a>
                    </div>
                    {renderRows(indirectLights)}
                </div>
            </div>
        </div>
    );
};
