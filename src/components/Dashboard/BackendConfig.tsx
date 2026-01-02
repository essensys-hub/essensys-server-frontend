import React, { useState, useEffect } from 'react';

const DEFAULT_DNS = 'mon.essensys.fr';
const DEFAULT_PORT = '80';

export const BackendConfig: React.FC = () => {
    const [dns, setDns] = useState(DEFAULT_DNS);
    const [port, setPort] = useState(DEFAULT_PORT);
    const [isEditing, setIsEditing] = useState(false);

    // Charger la configuration depuis localStorage au démarrage
    useEffect(() => {
        const savedDns = localStorage.getItem('essensys_backend_dns');
        const savedPort = localStorage.getItem('essensys_backend_port');
        
        if (savedDns) {
            setDns(savedDns);
        }
        if (savedPort) {
            setPort(savedPort);
        }
    }, []);

    // Sauvegarder la configuration dans localStorage
    const saveConfig = () => {
        localStorage.setItem('essensys_backend_dns', dns);
        localStorage.setItem('essensys_backend_port', port);
        setIsEditing(false);
        // Recharger la page pour appliquer les changements
        window.location.reload();
    };

    const resetToDefault = () => {
        setDns(DEFAULT_DNS);
        setPort(DEFAULT_PORT);
        localStorage.removeItem('essensys_backend_dns');
        localStorage.removeItem('essensys_backend_port');
        setIsEditing(false);
        window.location.reload();
    };

    const getBackendUrl = () => {
        const portStr = port === '80' ? '' : `:${port}`;
        return `http://${dns}${portStr}`;
    };

    return (
        <div className="esys-zone" style={{ width: '500px', marginBottom: '20px' }}>
            <h3>Configuration Backend</h3>
            <div style={{ padding: '10px' }}>
                {!isEditing ? (
                    <div>
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                URL du backend :
                            </label>
                            <div style={{ 
                                padding: '8px', 
                                backgroundColor: '#f5f5f5', 
                                borderRadius: '4px',
                                fontFamily: 'monospace'
                            }}>
                                {getBackendUrl()}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                marginRight: '10px'
                            }}
                        >
                            Modifier
                        </button>
                        <button
                            type="button"
                            onClick={resetToDefault}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Réinitialiser
                        </button>
                    </div>
                ) : (
                    <div>
                        <div style={{ marginBottom: '10px' }}>
                            <label htmlFor="backend-dns" style={{ display: 'block', marginBottom: '5px' }}>
                                DNS / Hostname :
                            </label>
                            <input
                                type="text"
                                id="backend-dns"
                                value={dns}
                                onChange={(e) => setDns(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    boxSizing: 'border-box'
                                }}
                                placeholder={DEFAULT_DNS}
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label htmlFor="backend-port" style={{ display: 'block', marginBottom: '5px' }}>
                                Port :
                            </label>
                            <input
                                type="text"
                                id="backend-port"
                                value={port}
                                onChange={(e) => setPort(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    boxSizing: 'border-box'
                                }}
                                placeholder={DEFAULT_PORT}
                            />
                        </div>
                        <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
                            <strong>URL complète :</strong> {getBackendUrl()}
                        </div>
                        <button
                            type="button"
                            onClick={saveConfig}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                marginRight: '10px'
                            }}
                        >
                            Enregistrer
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditing(false);
                                // Restaurer les valeurs sauvegardées
                                const savedDns = localStorage.getItem('essensys_backend_dns') || DEFAULT_DNS;
                                const savedPort = localStorage.getItem('essensys_backend_port') || DEFAULT_PORT;
                                setDns(savedDns);
                                setPort(savedPort);
                            }}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#757575',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Annuler
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Fonction utilitaire pour obtenir l'URL du backend
export const getBackendUrl = (): string => {
    // Si on est sur le même serveur (même hostname), utiliser une URL relative pour les API
    // Cela évite les problèmes CORS et utilise automatiquement le bon port
    const currentHost = window.location.hostname;
    const savedDns = localStorage.getItem('essensys_backend_dns') || DEFAULT_DNS;
    
    // Si le DNS configuré correspond au hostname actuel, utiliser une URL relative
    if (currentHost === savedDns || currentHost === 'localhost' || currentHost === '127.0.0.1') {
        // Utiliser une URL relative qui utilisera automatiquement le port 80 via nginx
        // ou le port du frontend si on est en développement
        if (window.location.port === '9090' || window.location.port === '') {
            // En production (port 9090 ou pas de port), les API sont sur le port 80
            return `http://${currentHost}:80`;
        } else {
            // En développement, utiliser le même hostname/port
            return `http://${currentHost}:${window.location.port}`;
        }
    }
    
    // Sinon, utiliser la configuration sauvegardée
    const dns = savedDns;
    const port = localStorage.getItem('essensys_backend_port') || DEFAULT_PORT;
    const portStr = port === '80' ? '' : `:${port}`;
    return `http://${dns}${portStr}`;
};

