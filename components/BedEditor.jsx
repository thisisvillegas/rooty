import React, { useState } from 'react';
import { X, Plus, Trash2, RotateCw } from 'lucide-react';
import { ALL_PLANTS } from '../data/plants.js';
import { BED_TYPES, TRELLIS_TYPES } from '../data/constants.js';
import { generateId, getTrellisSidesForBed } from '../utils/helpers.js';

export function BedEditor({ bed, onSave, onCancel, gardenPlan }) {
  const [editedBed, setEditedBed] = useState({ ...bed });
  const [selectedPlant, setSelectedPlant] = useState('');

  const addPlantToBed = () => {
    if (!selectedPlant) return;
    const plant = ALL_PLANTS[selectedPlant];
    if (!plant) return;

    const newPlant = {
      id: generateId(),
      type: selectedPlant,
      x: 0,
      y: 0,
    };

    setEditedBed({
      ...editedBed,
      plants: [...(editedBed.plants || []), newPlant],
    });
    setSelectedPlant('');
  };

  const removePlant = (plantId) => {
    setEditedBed({
      ...editedBed,
      plants: editedBed.plants.filter((p) => p.id !== plantId),
    });
  };

  const attachmentTrellises = Object.entries(TRELLIS_TYPES).filter(
    ([_, t]) => t.type === 'attachment'
  );

  // Rotate bed by swapping width and length
  const rotateBed = () => {
    setEditedBed({
      ...editedBed,
      width: editedBed.length,
      length: editedBed.width,
    });
  };

  // Get appropriate trellis sides based on bed dimensions
  const trellisSides = getTrellisSidesForBed(editedBed.width, editedBed.length);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            {BED_TYPES[editedBed.type]?.icon} Edit {editedBed.name}
          </h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Bed name */}
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={editedBed.name}
              onChange={(e) => setEditedBed({ ...editedBed, name: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            />
          </div>

          {/* Bed type */}
          <div>
            <label className="text-sm font-medium text-gray-700">Type</label>
            <select
              value={editedBed.type}
              onChange={(e) => setEditedBed({ ...editedBed, type: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            >
              {Object.entries(BED_TYPES).map(([k, t]) => (
                <option key={k} value={k}>
                  {t.icon} {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Trellis */}
          <div>
            <label className="text-sm font-medium text-gray-700">Trellis</label>
            <select
              value={editedBed.trellis || ''}
              onChange={(e) =>
                setEditedBed({
                  ...editedBed,
                  trellis: e.target.value || null,
                  trellisSide: e.target.value ? (editedBed.trellisSide || 'long1') : null
                })
              }
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            >
              <option value="">No trellis</option>
              {attachmentTrellises.map(([k, t]) => (
                <option key={k} value={k}>
                  {t.icon} {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Trellis Side - only shown when trellis is selected */}
          {editedBed.trellis && (
            <div>
              <label className="text-sm font-medium text-gray-700">Trellis Side</label>
              <select
                value={editedBed.trellisSide || 'long1'}
                onChange={(e) =>
                  setEditedBed({ ...editedBed, trellisSide: e.target.value })
                }
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              >
                {trellisSides.map((side) => (
                  <option key={side.value} value={side.value}>
                    {side.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Which side of the bed the trellis is attached to (relative to bed shape)
              </p>
            </div>
          )}

          {/* Dimensions */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Dimensions</label>
              <button
                type="button"
                onClick={rotateBed}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600"
                title="Rotate bed (swap width and length)"
              >
                <RotateCw className="w-3 h-3" />
                Rotate
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Width (ft)</label>
                <input
                  type="number"
                  value={editedBed.width}
                  onChange={(e) =>
                    setEditedBed({ ...editedBed, width: parseFloat(e.target.value) || 1 })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                  min="1"
                  max="20"
                  step="0.5"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Length (ft)</label>
                <input
                  type="number"
                  value={editedBed.length}
                  onChange={(e) =>
                    setEditedBed({ ...editedBed, length: parseFloat(e.target.value) || 1 })
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                  min="1"
                  max="20"
                  step="0.5"
                />
              </div>
            </div>
          </div>

          {/* Plants */}
          <div>
            <label className="text-sm font-medium text-gray-700">Plants in Bed</label>
            <div className="flex gap-2 mt-1">
              <select
                value={selectedPlant}
                onChange={(e) => setSelectedPlant(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg"
              >
                <option value="">Add plant...</option>
                {gardenPlan.map((key) => (
                  <option key={key} value={key}>
                    {ALL_PLANTS[key]?.emoji} {ALL_PLANTS[key]?.name}
                  </option>
                ))}
              </select>
              <button
                onClick={addPlantToBed}
                disabled={!selectedPlant}
                className="px-3 py-2 bg-green-600 text-white rounded-lg disabled:bg-gray-300"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
              {editedBed.plants?.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-2">No plants yet</p>
              )}
              {editedBed.plants?.map((plant) => (
                <div
                  key={plant.id}
                  className="flex items-center justify-between bg-gray-50 rounded px-2 py-1"
                >
                  <span className="text-sm">
                    {ALL_PLANTS[plant.type]?.emoji} {ALL_PLANTS[plant.type]?.name}
                  </span>
                  <button
                    onClick={() => removePlant(plant.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(editedBed)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
