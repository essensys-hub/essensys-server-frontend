import React from 'react';
import { useDashboard } from '../../context/DashboardContext';

export const AlarmControl: React.FC = () => {
    const { state, setValue } = useDashboard();

    const alarmState = (state['alarme'] as string) || '';
    const codeAlarme = (state['codealarme'] as string) || '';
    const alarmQuestion = (state['alresp'] as string) || '';

    const isModified = state['alarme'] !== undefined;

    // Logic for disabling/enabling alarm:
    // Legacy had complex logic involving checking code length (4 digits) or question answer.
    // For now, we allow interaction but maybe highlight if code is missing?
    // In legacy: "alcodecont" is shown if alarm is changing.

    const isCodeValid = codeAlarme.length === 4;
    const isResponseValid = alarmQuestion.length > 0;
    const canToggle = isCodeValid || isResponseValid;

    return (
        <div className="esys-zone" id="alarmecontainer" style={{ width: '400px' }}>
            <span style={{ display: isModified ? 'inline' : 'none', color: 'red', fontSize: '10px' }}>
                Changement de paramètre à valider
            </span>
            <div className={`esys-validinfo ${isModified ? 'tovalidate' : ''}`}>
                <h3>Alarme</h3>

                <div className="float-left alarmeor" style={{ width: '20px', display: 'none' }}>
                    ou
                </div>

                <div id="alcodecont" style={{ width: '400px' }}>
                    {/* 
                       Legacy had codealarme and question inputs. 
                       If codealarme is filled (4 chars), enable options.
                       If question is filled (verified via server), enable options.
                     */}
                    <div className="clear" style={{ width: '400px', marginTop: '20px' }}>
                        <div style={{ marginBottom: '10px' }}>
                            <label htmlFor="codealarme" style={{ display: 'block', float: 'none', width: '200px', textAlign: 'left' }}>
                                Code de l'alarme
                            </label>
                            <input
                                type="text" // using text to simplify, legacy uses TextBox with maxlength 4
                                id="codealarme"
                                name="codealarme"
                                maxLength={4}
                                style={{ width: 'auto', float: 'left' }}
                                value={codeAlarme}
                                onChange={(e) => setValue('codealarme', e.target.value)}
                            />
                        </div>

                        <div style={{ clear: 'both', paddingTop: '10px' }}>
                            <label htmlFor="question" style={{ display: 'block', float: 'none', width: '200px', textAlign: 'left' }}>
                                Question secrète (Mock)
                            </label>
                            <input
                                type="text"
                                id="question"
                                name="question"
                                maxLength={255}
                                style={{ width: 'auto', float: 'left', marginTop: '10px' }}
                                value={alarmQuestion}
                                onChange={(e) => setValue('alresp', e.target.value)}
                            />
                            <input type="button" value="Vérifier" onClick={() => alert("Verification Mock: OK")} />
                        </div>
                    </div>
                </div>

                <div className={`clear alarmeoption ${canToggle ? '' : 'disabled'}`}>
                    <label htmlFor="alarme_on" style={{ color: canToggle ? undefined : '#D2D2D2' }}>ON</label>
                    <input
                        type="radio"
                        id="alarme_on"
                        name="alarme"
                        value="on"
                        disabled={!canToggle}
                        checked={alarmState === 'on'}
                        onChange={() => setValue('alarme', 'on')}
                    />
                </div>
                <div className={`clear alarmeoption ${canToggle ? '' : 'disabled'}`}>
                    <label htmlFor="alarme_off" style={{ color: canToggle ? undefined : '#D2D2D2' }}>OFF</label>
                    <input
                        type="radio"
                        id="alarme_off"
                        name="alarme"
                        value="off"
                        disabled={!canToggle}
                        checked={alarmState === 'off'}
                        onChange={() => setValue('alarme', 'off')}
                    />
                </div>
            </div>
        </div>
    );
};
