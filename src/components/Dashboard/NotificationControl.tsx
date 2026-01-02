import React, { useState } from 'react';

export const NotificationControl: React.FC = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [sendMail, setSendMail] = useState(false);

    return (
        <div className="esys-zone phonelist" style={{ width: '500px', position: 'relative' }}>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(128, 128, 128, 0.5)',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '10px 20px',
                    border: '2px solid #666',
                    borderRadius: '5px',
                    fontWeight: 'bold',
                    color: '#666'
                }}>
                    non dispo notification
                </div>
            </div>
            <h3>Notifications</h3>
            <ol style={{ opacity: 0.5, pointerEvents: 'none' }}>
                <li>
                    <label
                        htmlFor="phone"
                        style={{
                            fontSize: '14px',
                            textAlign: 'left',
                            marginBottom: '0px',
                            width: '100%',
                        }}
                    >
                        Numéro où sont envoyés les SMS de notification
                    </label>
                    <input
                        type="text"
                        id="phone"
                        name="phone"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled
                    />
                </li>
                <li>
                    <label
                        htmlFor="sendmail"
                        style={{
                            fontSize: '14px',
                            textAlign: 'left',
                            marginBottom: '10px',
                            display: 'inline-block',
                            width: 'auto',
                            marginRight: '10px',
                        }}
                    >
                        Envoyer email de notification
                    </label>
                    <input
                        type="checkbox"
                        id="sendmail"
                        name="sendmail"
                        checked={sendMail}
                        onChange={(e) => setSendMail(e.target.checked)}
                        disabled
                    />
                </li>
                <li>Mock: 10 notification(s) restant pour le mois en cours</li>
            </ol>
        </div>
    );
};
