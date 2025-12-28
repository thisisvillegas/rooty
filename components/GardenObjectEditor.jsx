import React, { useState } from 'react';
import { X, Plus, Trash2, Thermometer } from 'lucide-react';
import { ALL_PLANTS } from '../data/plants.js';
import { GARDEN_OBJECT_TYPES, validateObjectDimensions } from '../data/gardenObjects.js';
import { generateId } from '../utils/helpers.js';

export function GardenObjectEditor({ object, onSave, onCancel, onDelete, gardenPlan }) {
  const [editedObject, setEditedObject] = useState({ ...object });
  const [selectedPlant, setSelectedPlant] = useState('');
  const [dimensionError, setDimensionError] = useState('');

  const objectType = GARDEN_OBJECT_TYPES[editedObject.type];
  const canHoldPlants = objectType?.canHoldPlants;

  // Add plant to greenhouse/object
  const addPlantToObject = () => {
    if (!selectedPlant || !canHoldPlants) return;
    const plant = ALL_PLANTS[selectedPlant];
    if (!plant) return;

    const newPlant = {
      id: generateId(),
      plantKey: selectedPlant,
      isOverwintering: false,
      movedInDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    };

    setEditedObject({
      ...editedObject,
      plants: [...(editedObject.plants || []), newPlant],
    });
    setSelectedPlant('');
  };

  // Remove plant from object
  const removePlant = (plantId) => {
    setEditedObject({
      ...editedObject,
      plants: editedObject.plants.filter((p) => p.id !== plantId),
    });
  };

  // Toggle overwintering status
  const toggleOverwintering = (plantId) => {
    setEditedObject({
      ...editedObject,
      plants: editedObject.plants.map((p) =>
        p.id === plantId ? { ...p, isOverwintering: !p.isOverwintering } : p
      ),
    });
  };

  // Validate and update dimensions
  const updateDimension = (field, value) => {
    const numValue = parseFloat(value) || 1;
    const newDimensions = {
      width: field === 'width' ? numValue : editedObject.width,
      length: field === 'length' ? numValue : editedObject.length,
    };

    const validation = validateObjectDimensions(
      editedObject.type,
      newDimensions.width,
      newDimensions.length
    );

    if (!validation.valid) {
      setDimensionError(validation.error);
    } else {
      setDimensionError('');
    }

    setEditedObject({ ...editedObject, [field]: numValue });
  };

  // Handle save
  const handleSave = () => {
    const validation = validateObjectDimensions(
      editedObject.type,
      editedObject.width,
      editedObject.length
    );

    if (!validation.valid) {
      setDimensionError(validation.error);
      return;
    }

    onSave(editedObject);
  };

  // Count overwintering plants
  const overwinteringCount = (editedObject.plants || []).filter(p => p.isOverwintering).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            {objectType?.icon} Edit {editedObject.name}
          </h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Object name */}
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={editedObject.name}
              onChange={(e) => setEditedObject({ ...editedObject, name: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            />
          </div>

          {/* Object type (read-only display) */}
          <div>
            <label className="text-sm font-medium text-gray-700">Type</label>
            <div className="w-full mt-1 px-3 py-2 border rounded-lg bg-gray-50 text-gray-600">
              {objectType?.icon} {objectType?.name}
            </div>
            <p className="text-xs text-gray-500 mt-1">{objectType?.description}</p>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Width (ft) <span className="text-xs text-gray-400">min: {objectType?.minWidth}</span>
              </label>
              <input
                type="number"
                value={editedObject.width}
                onChange={(e) => updateDimension('width', e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                min={objectType?.minWidth || 1}
                max="50"
                step="0.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Length (ft) <span className="text-xs text-gray-400">min: {objectType?.minLength}</span>
              </label>
              <input
                type="number"
                value={editedObject.length}
                onChange={(e) => updateDimension('length', e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                min={objectType?.minLength || 1}
                max="50"
                step="0.5"
              />
            </div>
          </div>

          {dimensionError && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              {dimensionError}
            </div>
          )}

          {/* Plants section - only for objects that can hold plants */}
          {canHoldPlants && (
            <div className="border-t pt-4">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                Plants Inside
                {overwinteringCount > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Thermometer className="w-3 h-3" /> {overwinteringCount} overwintering
                  </span>
                )}
              </label>

              <div className="flex gap-2 mt-2">
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
                  <option disabled>---</option>
                  {/* Also allow adding plants not in garden plan for seedlings */}
                  {Object.entries(ALL_PLANTS)
                    .filter(([key]) => !gardenPlan.includes(key))
                    .map(([key, plant]) => (
                      <option key={key} value={key}>
                        {plant.emoji} {plant.name} (not in plan)
                      </option>
                    ))}
                </select>
                <button
                  onClick={addPlantToObject}
                  disabled={!selectedPlant}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg disabled:bg-gray-300"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {(!editedObject.plants || editedObject.plants.length === 0) && (
                  <p className="text-gray-400 text-sm text-center py-2">No plants yet</p>
                )}
                {editedObject.plants?.map((plant) => (
                  <div
                    key={plant.id}
                    className={`flex items-center justify-between rounded px-2 py-1 ${
                      plant.isOverwintering ? 'bg-blue-50' : 'bg-gray-50'
                    }`}
                  >
                    <span className="text-sm flex items-center gap-2">
                      {ALL_PLANTS[plant.plantKey]?.emoji} {ALL_PLANTS[plant.plantKey]?.name}
                      {plant.isOverwintering && (
                        <span className="text-xs text-blue-600">overwintering</span>
                      )}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleOverwintering(plant.id)}
                        className={`p-1 rounded text-xs ${
                          plant.isOverwintering
                            ? 'bg-blue-200 text-blue-700'
                            : 'bg-gray-200 text-gray-600 hover:bg-blue-100'
                        }`}
                        title={plant.isOverwintering ? 'Remove from overwintering' : 'Mark as overwintering'}
                      >
                        <Thermometer className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removePlant(plant.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Mark plants as "overwintering" to track them through winter months
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-between">
          <button
            onClick={() => onDelete(editedObject.id)}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
