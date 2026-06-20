import React from 'react';
import { BoltIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { ActionButton } from '../UI';
import type { ScenarioSlotSummary } from '../../services/scenarioApi';

interface ScenarioButtonGridProps {
  slots: ScenarioSlotSummary[];
  launchingSlot: number | null;
  disabled?: boolean;
  onLaunch: (slot: number) => void;
  onEdit: (slot: number) => void;
}

export const ScenarioButtonGrid: React.FC<ScenarioButtonGridProps> = ({
  slots,
  launchingSlot,
  disabled = false,
  onLaunch,
  onEdit,
}) => {
  const launchable = slots.filter((s) => s.slot_number >= 2);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {launchable.map((slot) => (
        <div
          key={slot.slot_number}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900">{slot.label}</h3>
              <p className="text-xs text-gray-500">Slot {slot.slot_number}</p>
            </div>
            {slot.last_launched === slot.slot_number && (
              <span className="text-xs font-medium text-essensys-primary bg-essensys-primary/10 px-2 py-0.5 rounded-full">
                Dernier
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-auto">
            <ActionButton
              label="Lancer"
              icon={BoltIcon}
              onClick={() => onLaunch(slot.slot_number)}
              loading={launchingSlot === slot.slot_number}
              disabled={disabled}
              className="flex-1 min-w-[120px]"
            />
            {slot.editable && (
              <ActionButton
                label="Éditer"
                variant="secondary"
                icon={PencilSquareIcon}
                onClick={() => onEdit(slot.slot_number)}
                disabled={disabled}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
