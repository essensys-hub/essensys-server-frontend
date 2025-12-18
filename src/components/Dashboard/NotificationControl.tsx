import React, { useState } from 'react';

export const NotificationControl: React.FC = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [sendMail, setSendMail] = useState(false);

    return (
        <div className="esys-zone phonelist" style={{ width: '500px' }}>
            <h3>Notifications</h3>
            <ol>
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
                    />
                </li>
                <li>Mock: 10 notification(s) restant pour le mois en cours</li>
            </ol>
        </div>
    );
};
