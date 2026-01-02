import React from 'react';
import { Layout } from './components/Layout/Layout';
import { AlarmControl } from './components/Dashboard/AlarmControl';
import { HeatingControl, type HeatingOption } from './components/Dashboard/HeatingControl';
import { WaterHeaterControl } from './components/Dashboard/WaterHeaterControl';
import { SprinklerControl } from './components/Dashboard/SprinklerControl';
import { ShutterControl, shutterItems } from './components/Dashboard/ShutterControl'; // Import items for mapping
import { LightingControl, mainLights, indirectLights } from './components/Dashboard/LightingControl';
import { NotificationControl } from './components/Dashboard/NotificationControl';
import { BackendConfig } from './components/Dashboard/BackendConfig';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import { buildLegacyPayload, sendBatchInjections } from './services/legacyApi';

const heatingOptionsStandard: HeatingOption[] = [
  { value: '1', label: 'Automatique (planning)' },
  { value: '32', label: 'Anticipé' },
  { value: '17', label: 'Forçage confort' },
  { value: '18', label: 'Forçage éco' },
  { value: '19', label: 'Forçage éco+' },
  { value: '20', label: 'Forçage éco++' },
  { value: '21', label: 'Forçage hors gel' },
  { value: '16', label: 'OFF' },
];

const heatingOptionsSDB: HeatingOption[] = [
  { value: '1', label: 'Automatique (planning)' },
  { value: '17', label: 'Forçage confort' },
  { value: '18', label: 'Forçage éco' },
  { value: '19', label: 'Forçage éco+' },
  { value: '20', label: 'Forçage éco++' },
  { value: '21', label: 'Forçage hors gel' },
  { value: '16', label: 'OFF' },
];

// Inner component to access context
const DashboardContent: React.FC = () => {
  const { state } = useDashboard();

  const handleValidation = async () => {
    // Collect all mappings. 
    const allMappings = [
      ...shutterItems,
      ...mainLights,
      ...indirectLights
    ];

    // 1. Build legacy payload (for debug/completeness)
    const payload = buildLegacyPayload(state, allMappings);
    
    // Afficher les valeurs demandées à l'utilisateur
    console.log('========================================');
    console.log('[VALIDATION] Valeurs demandées à l\'utilisateur:');
    console.log('========================================');
    console.log('État du dashboard:', state);
    console.log('Payload construit:', payload);
    console.log('Mappings utilisés:', allMappings);
    
    // 2. Send injections to backend (New Requirement)
    try {
      await sendBatchInjections(state, allMappings);
      console.log('========================================');
      console.log('[VALIDATION] Validation terminée avec succès');
      console.log('========================================');
      alert('Validation effectuée. Actions envoyées au serveur.');
    } catch (e) {
      console.error('========================================');
      console.error('[VALIDATION] Erreur lors de l\'envoi des actions:', e);
      console.error('========================================');
      alert("Erreur lors de l'envoi.");
    }
  };

  const handleUndo = () => {
    window.location.reload(); // Simple undo for now
  };

  return (
    <Layout>
      <BackendConfig />
      
      <div className="es-mainaction">
        <input
          type="button"
          id="esys-undo"
          style={{ float: 'left', marginLeft: '26px', opacity: 0.5, cursor: 'not-allowed' }}
          value="Annulation"
          className="float-left"
          onClick={handleUndo}
          disabled
        />
        <input
          type="button"
          id="esys-valid"
          style={{ float: 'left', opacity: 0.5, cursor: 'not-allowed' }}
          value="Validation"
          className="float-left"
          onClick={handleValidation}
          disabled
        />
        <div className="esys-undoinfotop">et déconnexion</div>
        <div
          className="esys-undoinfotop"
          style={{ left: '154px' }}
        >
          ou rafraîchir
        </div>
      </div>

      <AlarmControl />

      <HeatingControl
        id="chauffagezjcontainer"
        title="Chauffage Zone Jour"
        name="chauffagezj"
        options={heatingOptionsStandard}
      />

      <HeatingControl
        id="chauffagezncontainer"
        title="Chauffage Zone Nuit"
        name="chauffagezn"
        options={heatingOptionsStandard}
      />

      <HeatingControl
        id="chauffagesdb1container"
        title="Chauffage Salle de bain 1"
        name="chauffagesdb1"
        options={heatingOptionsSDB}
      />

      <HeatingControl
        id="chauffagesdb2container"
        title="Chauffage Salle de bain 2"
        name="chauffagesdb2"
        options={heatingOptionsSDB}
      />

      <WaterHeaterControl />

      <SprinklerControl />

      <ShutterControl />

      <LightingControl />

      <NotificationControl />

      <div className="es-mainaction">
        <input
          type="button"
          id="esys-undo2"
          style={{ float: 'left', marginLeft: '26px', opacity: 0.5, cursor: 'not-allowed' }}
          value="Annulation"
          className="float-left"
          onClick={handleUndo}
          disabled
        />
        <input
          type="button"
          id="esys-valid2"
          style={{ float: 'left' }}
          value="Validation"
          className="float-left"
          onClick={handleValidation}
        />
        <div className="esys-undoinfo">et déconnexion</div>
        <div className="esys-undoinfo" style={{ left: '154px' }}>
          ou rafraîchir
        </div>
      </div>
    </Layout>
  );
};

function App() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}

export default App;
