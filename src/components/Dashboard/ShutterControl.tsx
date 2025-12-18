import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import type { LegacyMapping } from '../../services/legacyApi';

// Extended item with mapping info
export interface ShutterItem extends LegacyMapping {
    label: string;
}

export const shutterItems: ShutterItem[] = [
    { label: 'Volet 1 Salon', name: 'volet1salon', dindex: '', dvalue: '1', openIndex: '617', closeIndex: '620' },
    { label: 'Volet 2 Salon', name: 'volet2salon', dindex: '', dvalue: '2', openIndex: '617', closeIndex: '620' },
    { label: 'Volet 3 Salon', name: 'volet3salon', dindex: '', dvalue: '4', openIndex: '617', closeIndex: '620' },
    { label: 'Volet 1 Salle à Manger', name: 'volet1salleamanger', dindex: '', dvalue: '8', openIndex: '617', closeIndex: '620' },
    { label: 'Volet 2 Salle à Manger', name: 'volet2salleamanger', dindex: '', dvalue: '16', openIndex: '617', closeIndex: '620' },
    { label: 'Volet 1 Cuisine', name: 'volet1cuisine', dindex: '', dvalue: '1', openIndex: '619', closeIndex: '622' },
    { label: 'Volet 2 Cuisine', name: 'volet2cuisine', dindex: '', dvalue: '2', openIndex: '619', closeIndex: '622' },
    { label: 'Volet Salle de Bain 1', name: 'voletsdb', dindex: '', dvalue: '4', openIndex: '619', closeIndex: '622' },
    { label: 'Volet 1 Grande Chambre', name: 'volet1gdchamb', dindex: '', dvalue: '1', openIndex: '618', closeIndex: '621' },
    { label: 'Volet 2 Grande Chambre', name: 'volet2gdchamb', dindex: '', dvalue: '2', openIndex: '618', closeIndex: '621' },
    { label: 'Volet Petite Chambre 1', name: 'volet1ptchamb', dindex: '', dvalue: '4', openIndex: '618', closeIndex: '621' },
    { label: 'Volet Petite Chambre 2', name: 'volet2ptchamb', dindex: '', dvalue: '8', openIndex: '618', closeIndex: '621' },
    { label: 'Volet Petite Chambre 3', name: 'volet3ptchamb', dindex: '', dvalue: '16', openIndex: '618', closeIndex: '621' },
    { label: 'Volet Bureau', name: 'voletbureau', dindex: '', dvalue: '32', openIndex: '617', closeIndex: '620' },
];

export const ShutterControl: React.FC = () => {
    const { state, setValue, setValues } = useDashboard();

    // Check if any shutter in the group is modified to show global warning/validation style
    const isGroupModified = shutterItems.some(item => state[item.name] !== undefined) ||
        state['store'] !== undefined ||
        state['voletstore'] !== undefined;

    const handleAll = (value: string) => {
        const updates: Record<string, string> = {};
        shutterItems.forEach((item) => {
            updates[item.name] = value;
        });
        setValues(updates);
    };

    return (
        <div className="esys-zone" id="voletroulantstore">
            <span style={{ display: isGroupModified ? 'inline' : 'none', color: 'red', fontSize: '10px' }}>
                Changement de paramètre à valider
            </span>
            <div className={`esys-validinfo ${isGroupModified ? 'tovalidate' : ''}`}>
                <h3>Volets roulants et store</h3>
                <div className="clear large">
                    <a
                        href="#"
                        id="openvol"
                        className="radiocol1g"
                        onClick={(e) => {
                            e.preventDefault();
                            handleAll('1');
                        }}
                    >
                        Ouvrir
                    </a>
                    <a
                        href="#"
                        id="closevol"
                        className="radiocol2g"
                        onClick={(e) => {
                            e.preventDefault();
                            handleAll('0');
                        }}
                    >
                        Fermer
                    </a>
                </div>

                {shutterItems.map((item) => {
                    const val = (state[item.name] as string) || '';
                    // Note: Default state is empty string (neither checked). 
                    // Legacy also seemingly checked existing values on load? 
                    // For now, no initial fetch -> empty.

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
                })}

                <div className="voletstorezone clear large">
                    <label htmlFor="voletstore_1">Volet "Store"</label>
                    <input
                        type="radio"
                        className="radiocol1 escpl"
                        id="voletstore_1"
                        name="voletstore"
                        value="1"
                        checked={state['voletstore'] === '1'}
                        onChange={() => setValue('voletstore', '1')}
                    />
                    <input
                        type="radio"
                        className="radiocol2 escpl"
                        id="voletstore_0"
                        name="voletstore"
                        value="0"
                        checked={state['voletstore'] === '0'}
                        onChange={() => setValue('voletstore', '0')}
                    />
                </div>

                <div className="clear large" style={{ marginTop: '15px' }}>
                    <div className="radiocol1g">Déplier</div>
                    <div className="radiocol2g">Replier</div>
                </div>
                <div className="storezone clear large">
                    <label htmlFor="store_1">Store</label>
                    <input
                        type="radio"
                        className="radiocol1 escpl"
                        id="store_1"
                        name="store"
                        value="1"
                        checked={state['store'] === '1'}
                        onChange={() => setValue('store', '1')}
                    />
                    <input
                        type="radio"
                        className="radiocol2 escpl"
                        id="store_0"
                        name="store"
                        value="0"
                        checked={state['store'] === '0'}
                        onChange={() => setValue('store', '0')}
                    />
                </div>
            </div>
        </div>
    );
};
