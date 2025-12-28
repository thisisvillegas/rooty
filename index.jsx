import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Leaf, MapPin, Plus, Grid3X3, Compass, Sparkles, Loader2, Trash2, Save, Fence, Home } from 'lucide-react';

// Data
import { ZONES } from './data/zones.js';
import { ALL_PLANTS, VEGETABLES, COMPANIONS } from './data/plants.js';
import { BED_TYPES, TRELLIS_TYPES, GATE_WIDTHS, WALKWAY_WIDTHS } from './data/constants.js';
import { GARDEN_OBJECT_TYPES, createGardenObject, validateObjectDimensions } from './data/gardenObjects.js';

// Utils
import { generateId, formatLastSaved, getPlantingYear, getTrellisSidesForBed } from './utils/helpers.js';
import { loadFromStorage, clearStorage } from './utils/storage.js';
import { findValidPosition, canBedFit, calculateSpaceUsage } from './utils/validation.js';

// Hooks
import { useDebounce } from './hooks/useDebounce.js';
import { useAutoSave } from './hooks/useAutoSave.js';

// Components
import { GardenCanvas } from './components/GardenCanvas.jsx';
import { BedEditor } from './components/BedEditor.jsx';
import { MagicLayoutModal } from './components/MagicLayoutModal.jsx';
import { ValidationSummary } from './components/ValidationSummary.jsx';
import { CalendarView } from './components/CalendarView.jsx';
import { GardenObjectEditor } from './components/GardenObjectEditor.jsx';

// Clear confirmation modal
function ClearDataModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Clear All Data?</h2>
        <p className="text-gray-600 text-sm mb-4">
          This will delete your entire garden layout, beds, and plant list.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GardenPlanner() {
  // Loading state
  const [isLoaded, setIsLoaded] = useState(false);
  
  // UI state
  const [activeTab, setActiveTab] = useState('plot');
  const [editingBed, setEditingBed] = useState(null);
  const [editingGardenObject, setEditingGardenObject] = useState(null);
  const [showMagic, setShowMagic] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  // Garden data
  const [selectedZone, setSelectedZone] = useState('7a');
  const [gardenPlan, setGardenPlan] = useState([]); // Plant keys
  const [beds, setBeds] = useState([]);
  const [trellises, setTrellises] = useState([]); // Standalone trellises
  const [gardenObjects, setGardenObjects] = useState([]); // Objects inside garden
  const [offGardenObjects, setOffGardenObjects] = useState([]); // Objects outside garden
  
  // Garden dimensions (with debounce)
  const [gardenWidthInput, setGardenWidthInput] = useState('20');
  const [gardenLengthInput, setGardenLengthInput] = useState('25');
  const gardenWidth = useDebounce(Math.max(5, Math.min(100, parseInt(gardenWidthInput) || 20)), 500);
  const gardenLength = useDebounce(Math.max(5, Math.min(100, parseInt(gardenLengthInput) || 25)), 500);
  
  // Orientation and fence
  const [orientation, setOrientation] = useState('N');
  const [isFenced, setIsFenced] = useState(false);
  const [gatePosition, setGatePosition] = useState(0.5); // 0-1 position along perimeter (0.5 = center of south)
  const [gateWidth, setGateWidth] = useState(4);
  const [walkwayWidth, setWalkwayWidth] = useState(3);
  
  // Form state for adding beds
  const [newBedName, setNewBedName] = useState('');
  const [newBedType, setNewBedType] = useState('raised');
  const [newBedWidth, setNewBedWidth] = useState('4');
  const [newBedLength, setNewBedLength] = useState('8');
  const [newBedTrellis, setNewBedTrellis] = useState('');
  const [newBedTrellisSide, setNewBedTrellisSide] = useState('long1');
  const [selectedPlant, setSelectedPlant] = useState('');
  const [addBedError, setAddBedError] = useState('');

  // Form state for adding garden objects
  const [newObjectType, setNewObjectType] = useState('greenhouse');
  const [newObjectName, setNewObjectName] = useState('');
  const [newObjectWidth, setNewObjectWidth] = useState('');
  const [newObjectLength, setNewObjectLength] = useState('');
  const [newObjectLocation, setNewObjectLocation] = useState('garden'); // 'garden' or 'offGarden'
  const [addObjectError, setAddObjectError] = useState('');
  
  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadFromStorage();
    if (saved) {
      if (saved.gardenWidth) setGardenWidthInput(String(saved.gardenWidth));
      if (saved.gardenLength) setGardenLengthInput(String(saved.gardenLength));
      if (saved.orientation) setOrientation(saved.orientation);
      if (saved.selectedZone) setSelectedZone(saved.selectedZone);
      if (saved.beds) setBeds(saved.beds);
      if (saved.gardenPlan) setGardenPlan(saved.gardenPlan);
      if (saved.trellises) setTrellises(saved.trellises);
      if (saved.isFenced !== undefined) setIsFenced(saved.isFenced);
      if (saved.gatePosition !== undefined) setGatePosition(saved.gatePosition);
      if (saved.gateWidth) setGateWidth(saved.gateWidth);
      if (saved.walkwayWidth) setWalkwayWidth(saved.walkwayWidth);
      if (saved.gardenObjects) setGardenObjects(saved.gardenObjects);
      if (saved.offGardenObjects) setOffGardenObjects(saved.offGardenObjects);
    }
    setIsLoaded(true);
  }, []);
  
  // Auto-save data
  const saveData = useMemo(() => {
    if (!isLoaded) return null;
    return {
      gardenWidth,
      gardenLength,
      orientation,
      selectedZone,
      beds,
      gardenPlan,
      trellises,
      isFenced,
      gatePosition,
      gateWidth,
      walkwayWidth,
      gardenObjects,
      offGardenObjects,
    };
  }, [isLoaded, gardenWidth, gardenLength, orientation, selectedZone, beds, gardenPlan, trellises, isFenced, gatePosition, gateWidth, walkwayWidth, gardenObjects, offGardenObjects]);
  
  const lastSaved = useAutoSave(saveData, 1000);
  
  // Derived values
  const zone = ZONES[selectedZone];
  const year = getPlantingYear(zone);
  const spaceUsage = calculateSpaceUsage(beds, gardenWidth, gardenLength);
  
  // Add plant to plan
  const addPlant = () => {
    if (selectedPlant && !gardenPlan.includes(selectedPlant)) {
      setGardenPlan([...gardenPlan, selectedPlant]);
      setSelectedPlant('');
    }
  };
  
  // Add new bed
  const addBed = () => {
    setAddBedError('');
    
    const width = Math.max(1, Math.min(20, parseFloat(newBedWidth) || 4));
    const length = Math.max(1, Math.min(20, parseFloat(newBedLength) || 8));
    
    if (!canBedFit(width, length, gardenWidth, gardenLength)) {
      setAddBedError(`Bed ${width}×${length}ft is larger than garden`);
      return;
    }
    
    const newBed = {
      id: generateId(),
      name: newBedName || `Bed ${beds.length + 1}`,
      type: newBedType,
      width,
      length,
      x: 0,
      y: 0,
      plants: [],
      trellis: newBedTrellis || null,
      trellisSide: newBedTrellis ? newBedTrellisSide : null,
    };
    
    const position = findValidPosition(newBed, beds, gardenWidth, gardenLength, walkwayWidth);
    if (!position) {
      setAddBedError(`No space for ${width}×${length}ft bed`);
      return;
    }
    
    newBed.x = position.x;
    newBed.y = position.y;
    setBeds([...beds, newBed]);
    setNewBedName('');
    setNewBedTrellis('');
    setNewBedTrellisSide('long1');
  };
  
  // Save edited bed
  const saveBed = (updated) => {
    setBeds(beds.map(b => b.id === updated.id ? updated : b));
    setEditingBed(null);
  };

  // Add new garden object
  const addGardenObject = () => {
    setAddObjectError('');

    const objectType = GARDEN_OBJECT_TYPES[newObjectType];
    if (!objectType) {
      setAddObjectError('Invalid object type');
      return;
    }

    const width = parseFloat(newObjectWidth) || objectType.defaultWidth;
    const length = parseFloat(newObjectLength) || objectType.defaultLength;

    const validation = validateObjectDimensions(newObjectType, width, length);
    if (!validation.valid) {
      setAddObjectError(validation.error);
      return;
    }

    const newObject = createGardenObject(newObjectType, {
      id: generateId(),
      name: newObjectName || objectType.name,
      width,
      length,
      x: 0,
      y: 0,
    });

    if (newObjectLocation === 'offGarden') {
      setOffGardenObjects([...offGardenObjects, newObject]);
    } else {
      setGardenObjects([...gardenObjects, newObject]);
    }

    // Reset form
    setNewObjectName('');
    setNewObjectWidth('');
    setNewObjectLength('');
  };

  // Update garden object
  const updateGardenObject = (updated) => {
    // Check if object is in garden or off-garden
    const inGarden = gardenObjects.find(o => o.id === updated.id);
    if (inGarden) {
      setGardenObjects(gardenObjects.map(o => o.id === updated.id ? updated : o));
    } else {
      setOffGardenObjects(offGardenObjects.map(o => o.id === updated.id ? updated : o));
    }
    setEditingGardenObject(null);
  };

  // Delete garden object
  const deleteGardenObject = (id) => {
    setGardenObjects(gardenObjects.filter(o => o.id !== id));
    setOffGardenObjects(offGardenObjects.filter(o => o.id !== id));
    setEditingGardenObject(null);
  };
  
  // Apply magic layout result
  const applyMagicLayout = (result, settings) => {
    if (settings?.walkwayWidth) {
      setWalkwayWidth(settings.walkwayWidth);
    }
    
    const updatedBeds = beds.map(bed => {
      const layoutBed = result.beds?.find(b => b.id === bed.id);
      if (layoutBed) {
        return { 
          ...bed, 
          x: layoutBed.x ?? bed.x, 
          y: layoutBed.y ?? bed.y, 
          plants: (layoutBed.plants || []).map(p => ({ ...p, id: generateId() })),
          trellis: layoutBed.trellis || bed.trellis,
        };
      }
      return bed;
    });
    
    setBeds(updatedBeds);
    
    // Add suggested plants
    result.suggestions?.forEach(s => {
      if (s.addPlant && !gardenPlan.includes(s.addPlant)) {
        setGardenPlan(prev => [...prev, s.addPlant]);
      }
    });
  };
  
  // Clear all data
  const clearAllData = () => {
    clearStorage();
    setGardenWidthInput('20');
    setGardenLengthInput('25');
    setOrientation('N');
    setSelectedZone('7a');
    setBeds([]);
    setGardenPlan([]);
    setTrellises([]);
    setIsFenced(false);
    setGatePosition(0.5);
    setGateWidth(4);
    setWalkwayWidth(3);
    setGardenObjects([]);
    setOffGardenObjects([]);
  };
  
  // Loading screen
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    );
  }
  
  // Filter trellis types for bed attachment
  const attachmentTrellises = Object.entries(TRELLIS_TYPES).filter(([_, t]) => t.type === 'attachment');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-3">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-3">
          <h1 className="text-2xl font-bold text-green-800 flex items-center justify-center gap-2">
            <Leaf className="w-6 h-6" /> Garden Planner
          </h1>
          {lastSaved && (
            <p className="text-xs text-green-600 flex items-center justify-center gap-1 mt-1">
              <Save className="w-3 h-3" /> Saved {formatLastSaved(lastSaved)}
            </p>
          )}
        </header>
        
        {/* Zone selector bar */}
        <div className="bg-white rounded-xl shadow p-3 mb-3 flex flex-wrap items-center gap-3">
          <MapPin className="w-4 h-4 text-green-600" />
          <select 
            value={selectedZone} 
            onChange={(e) => setSelectedZone(e.target.value)} 
            className="px-2 py-1 border rounded text-sm"
          >
            {Object.entries(ZONES).map(([k, z]) => (
              <option key={k} value={k}>{z.name}</option>
            ))}
          </select>
          <span className="text-xs bg-green-50 px-2 py-1 rounded-full">
            Last Frost: {new Date(year, zone.lastFrost.month - 1, zone.lastFrost.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          <button 
            onClick={() => setShowClearModal(true)} 
            className="ml-auto text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        </div>
        
        {/* Tab navigation */}
        <div className="flex gap-2 mb-3">
          <button 
            onClick={() => setActiveTab('plot')} 
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${
              activeTab === 'plot' ? 'bg-green-600 text-white' : 'bg-white hover:bg-gray-50'
            }`}
          >
            <Grid3X3 className="w-4 h-4" /> Layout
          </button>
          <button 
            onClick={() => setActiveTab('calendar')} 
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${
              activeTab === 'calendar' ? 'bg-green-600 text-white' : 'bg-white hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-4 h-4" /> Calendar
          </button>
          <button 
            onClick={() => setShowMagic(true)} 
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white ml-auto"
          >
            <Sparkles className="w-4 h-4" /> Magic Layout
          </button>
        </div>
        
        {/* Main content */}
        {activeTab === 'plot' ? (
          <div className="grid lg:grid-cols-3 gap-3">
            {/* Left sidebar - Controls */}
            <div className="space-y-3">
              {/* Garden Size */}
              <div className="bg-white rounded-xl shadow p-3">
                <h2 className="font-semibold text-gray-800 mb-2 text-sm">📐 Garden Size</h2>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Width (ft)</label>
                    <input 
                      type="number" 
                      value={gardenWidthInput} 
                      onChange={(e) => setGardenWidthInput(e.target.value)} 
                      className="w-full px-2 py-1 border rounded text-sm" 
                      min="5" max="100"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Length (ft)</label>
                    <input 
                      type="number" 
                      value={gardenLengthInput} 
                      onChange={(e) => setGardenLengthInput(e.target.value)} 
                      className="w-full px-2 py-1 border rounded text-sm" 
                      min="5" max="100"
                    />
                  </div>
                </div>
              </div>
              
              {/* Orientation & Fence */}
              <div className="bg-white rounded-xl shadow p-3">
                <h2 className="font-semibold text-gray-800 mb-2 text-sm flex items-center gap-1">
                  <Compass className="w-4 h-4" /> Orientation
                </h2>
                <div className="grid grid-cols-4 gap-1 mb-3">
                  {['N', 'E', 'S', 'W'].map(d => (
                    <button 
                      key={d} 
                      onClick={() => setOrientation(d)} 
                      className={`p-1.5 rounded text-xs font-medium ${
                        orientation === d ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {d === 'N' ? '↑N' : d === 'S' ? '↓S' : d === 'E' ? '→E' : '←W'}
                    </button>
                  ))}
                </div>
                
                {/* Fence info (click on canvas border to add fence) */}
                {isFenced && (
                  <div className="bg-amber-50 rounded-lg p-2 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-amber-800">
                      <Fence className="w-4 h-4" />
                      <span className="font-medium">Garden is fenced</span>
                      <button 
                        onClick={() => setIsFenced(false)}
                        className="ml-auto text-amber-600 hover:text-amber-800"
                      >
                        Remove
                      </button>
                    </div>
                    <div>
                      <label className="text-amber-700">Gate Width</label>
                      <select 
                        value={gateWidth} 
                        onChange={(e) => setGateWidth(parseFloat(e.target.value))}
                        className="w-full mt-1 px-2 py-1 border border-amber-200 rounded text-sm bg-white"
                      >
                        {GATE_WIDTHS.map(g => (
                          <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                      </select>
                    </div>
                    <p className="text-amber-600">Drag the gate on the canvas to reposition</p>
                  </div>
                )}
                
                {!isFenced && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded p-2">
                    💡 Click the garden border to add a fence
                  </p>
                )}
              </div>
              
              {/* Add Bed */}
              <div className="bg-white rounded-xl shadow p-3">
                <h2 className="font-semibold text-gray-800 mb-2 text-sm flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add Bed
                </h2>
                <div className="space-y-2">
                  <input 
                    placeholder="Name (optional)" 
                    value={newBedName} 
                    onChange={(e) => setNewBedName(e.target.value)} 
                    className="w-full px-2 py-1 border rounded text-sm" 
                  />
                  <select 
                    value={newBedType} 
                    onChange={(e) => setNewBedType(e.target.value)} 
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    {Object.entries(BED_TYPES).map(([k, t]) => (
                      <option key={k} value={k}>{t.icon} {t.name}</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">Width (ft)</label>
                      <input 
                        type="number" 
                        value={newBedWidth} 
                        onChange={(e) => setNewBedWidth(e.target.value)} 
                        className="w-full px-2 py-1 border rounded text-sm" 
                        min="1" max="20" step="0.5"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Length (ft)</label>
                      <input 
                        type="number" 
                        value={newBedLength} 
                        onChange={(e) => setNewBedLength(e.target.value)} 
                        className="w-full px-2 py-1 border rounded text-sm" 
                        min="1" max="20" step="0.5"
                      />
                    </div>
                  </div>
                  
                  {/* Trellis option */}
                  <select
                    value={newBedTrellis}
                    onChange={(e) => setNewBedTrellis(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    <option value="">No trellis</option>
                    {attachmentTrellises.map(([k, t]) => (
                      <option key={k} value={k}>{t.icon} {t.name}</option>
                    ))}
                  </select>

                  {/* Trellis Side selector - shown when trellis is selected */}
                  {newBedTrellis && (
                    <div>
                      <label className="text-xs text-gray-500">Trellis Side</label>
                      <select
                        value={newBedTrellisSide}
                        onChange={(e) => setNewBedTrellisSide(e.target.value)}
                        className="w-full px-2 py-1 border rounded text-sm"
                      >
                        {getTrellisSidesForBed(parseFloat(newBedWidth) || 4, parseFloat(newBedLength) || 8).map((side) => (
                          <option key={side.value} value={side.value}>{side.label}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-400 mt-1">Relative to bed shape</p>
                    </div>
                  )}

                  {addBedError && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      {addBedError}
                    </div>
                  )}
                  <button
                    onClick={addBed}
                    className="w-full py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
                  >
                    Add Bed
                  </button>
                </div>
              </div>

              {/* Add Garden Object */}
              <div className="bg-white rounded-xl shadow p-3">
                <h2 className="font-semibold text-gray-800 mb-2 text-sm flex items-center gap-1">
                  <Home className="w-4 h-4" /> Add Structure
                </h2>
                <div className="space-y-2">
                  <select
                    value={newObjectType}
                    onChange={(e) => {
                      setNewObjectType(e.target.value);
                      setNewObjectWidth('');
                      setNewObjectLength('');
                    }}
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    {Object.entries(GARDEN_OBJECT_TYPES).map(([k, t]) => (
                      <option key={k} value={k}>{t.icon} {t.name}</option>
                    ))}
                  </select>
                  <input
                    placeholder="Name (optional)"
                    value={newObjectName}
                    onChange={(e) => setNewObjectName(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">
                        Width (ft)
                        <span className="text-gray-400 ml-1">
                          def: {GARDEN_OBJECT_TYPES[newObjectType]?.defaultWidth}
                        </span>
                      </label>
                      <input
                        type="number"
                        value={newObjectWidth}
                        onChange={(e) => setNewObjectWidth(e.target.value)}
                        placeholder={String(GARDEN_OBJECT_TYPES[newObjectType]?.defaultWidth || 4)}
                        className="w-full px-2 py-1 border rounded text-sm"
                        min={GARDEN_OBJECT_TYPES[newObjectType]?.minWidth || 1}
                        max="50"
                        step="0.5"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">
                        Length (ft)
                        <span className="text-gray-400 ml-1">
                          def: {GARDEN_OBJECT_TYPES[newObjectType]?.defaultLength}
                        </span>
                      </label>
                      <input
                        type="number"
                        value={newObjectLength}
                        onChange={(e) => setNewObjectLength(e.target.value)}
                        placeholder={String(GARDEN_OBJECT_TYPES[newObjectType]?.defaultLength || 4)}
                        className="w-full px-2 py-1 border rounded text-sm"
                        min={GARDEN_OBJECT_TYPES[newObjectType]?.minLength || 1}
                        max="50"
                        step="0.5"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Location</label>
                    <select
                      value={newObjectLocation}
                      onChange={(e) => setNewObjectLocation(e.target.value)}
                      className="w-full px-2 py-1 border rounded text-sm"
                    >
                      <option value="garden">Inside Garden</option>
                      <option value="offGarden">Off-Garden Area</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-400">
                    {GARDEN_OBJECT_TYPES[newObjectType]?.description}
                  </p>
                  {addObjectError && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      {addObjectError}
                    </div>
                  )}
                  <button
                    onClick={addGardenObject}
                    className="w-full py-1.5 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700"
                  >
                    Add {GARDEN_OBJECT_TYPES[newObjectType]?.name}
                  </button>
                </div>
              </div>

              {/* Plants */}
              <div className="bg-white rounded-xl shadow p-3">
                <h2 className="font-semibold text-gray-800 mb-2 text-sm flex items-center gap-1">
                  <Leaf className="w-4 h-4" /> Plants
                </h2>
                <div className="flex gap-1 mb-2">
                  <select 
                    value={selectedPlant} 
                    onChange={(e) => setSelectedPlant(e.target.value)} 
                    className="flex-1 px-2 py-1 border rounded text-sm"
                  >
                    <option value="">Add plant...</option>
                    <optgroup label="Vegetables">
                      {Object.entries(VEGETABLES).map(([k, v]) => (
                        <option key={k} value={k}>{v.emoji} {v.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Companions">
                      {Object.entries(COMPANIONS).map(([k, c]) => (
                        <option key={k} value={k}>{c.emoji} {c.name}</option>
                      ))}
                    </optgroup>
                  </select>
                  <button 
                    onClick={addPlant} 
                    disabled={!selectedPlant} 
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm disabled:bg-gray-300"
                  >
                    +
                  </button>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {gardenPlan.length === 0 ? (
                    <p className="text-gray-400 text-xs text-center py-2">No plants yet</p>
                  ) : (
                    gardenPlan.map(k => (
                      <div key={k} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1 text-sm">
                        <span>
                          {ALL_PLANTS[k]?.emoji} {ALL_PLANTS[k]?.name}
                          {ALL_PLANTS[k]?.trellis && <span className="text-xs text-green-600 ml-1">🪴</span>}
                        </span>
                        <button 
                          onClick={() => setGardenPlan(gardenPlan.filter(p => p !== k))} 
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Validation Summary */}
              <ValidationSummary 
                beds={beds} 
                gardenWidth={gardenWidth} 
                gardenLength={gardenLength}
                walkwayWidth={walkwayWidth}
              />
            </div>
            
            {/* Main canvas area */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow p-3">
              <h2 className="font-semibold text-gray-800 mb-3 text-center text-sm">Your Garden</h2>
              
              <div className="flex justify-center py-4">
                <GardenCanvas
                  gardenWidth={gardenWidth}
                  gardenLength={gardenLength}
                  beds={beds}
                  setBeds={setBeds}
                  trellises={trellises}
                  setTrellises={setTrellises}
                  orientation={orientation}
                  onEditBed={setEditingBed}
                  isFenced={isFenced}
                  setIsFenced={setIsFenced}
                  gatePosition={gatePosition}
                  setGatePosition={setGatePosition}
                  gateWidth={gateWidth}
                  setGateWidth={setGateWidth}
                  walkwayWidth={walkwayWidth}
                  gardenObjects={gardenObjects}
                  setGardenObjects={setGardenObjects}
                  offGardenObjects={offGardenObjects}
                  setOffGardenObjects={setOffGardenObjects}
                  onEditGardenObject={setEditingGardenObject}
                />
              </div>
              
              {/* Bed list */}
              {beds.length > 0 && (
                <div className="mt-3 border-t pt-3">
                  <h3 className="font-medium text-gray-700 text-xs mb-2">
                    Beds ({beds.length}) - {spaceUsage.percentage}% of garden used
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {beds.map(b => (
                      <div
                        key={b.id}
                        className={`${BED_TYPES[b.type].color} border rounded p-2 flex items-center justify-between`}
                      >
                        <div>
                          <div className="font-medium text-sm flex items-center gap-1">
                            {BED_TYPES[b.type].icon} {b.name}
                            {b.trellis && <span>{TRELLIS_TYPES[b.trellis]?.icon}</span>}
                          </div>
                          <div className="text-xs text-gray-600">
                            {b.width}x{b.length}ft - {b.plants?.length || 0} plants
                          </div>
                        </div>
                        <button
                          onClick={() => setEditingBed(b)}
                          className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Garden Objects list */}
              {(gardenObjects.length > 0 || offGardenObjects.length > 0) && (
                <div className="mt-3 border-t pt-3">
                  <h3 className="font-medium text-gray-700 text-xs mb-2">
                    Structures ({gardenObjects.length + offGardenObjects.length})
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {[...gardenObjects, ...offGardenObjects].map(obj => {
                      const objType = GARDEN_OBJECT_TYPES[obj.type];
                      const isOffGarden = offGardenObjects.find(o => o.id === obj.id);
                      const plantCount = objType?.canHoldPlants ? (obj.plants?.length || 0) : null;
                      return (
                        <div
                          key={obj.id}
                          className={`${objType?.color || 'bg-gray-200 border-gray-500'} border border-dashed rounded p-2 flex items-center justify-between`}
                        >
                          <div>
                            <div className="font-medium text-sm flex items-center gap-1">
                              {objType?.icon} {obj.name}
                              {isOffGarden && <span className="text-xs text-gray-500">(off-garden)</span>}
                            </div>
                            <div className="text-xs text-gray-600">
                              {obj.width}x{obj.length}ft
                              {plantCount !== null && ` - ${plantCount} plants`}
                            </div>
                          </div>
                          <button
                            onClick={() => setEditingGardenObject(obj)}
                            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                          >
                            Edit
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <CalendarView
            gardenPlan={gardenPlan}
            zone={zone}
            gardenObjects={gardenObjects}
            offGardenObjects={offGardenObjects}
          />
        )}
        
        {/* Modals */}
        {editingBed && (
          <BedEditor
            bed={editingBed}
            onSave={saveBed}
            onCancel={() => setEditingBed(null)}
            gardenPlan={gardenPlan}
          />
        )}

        {editingGardenObject && (
          <GardenObjectEditor
            object={editingGardenObject}
            onSave={updateGardenObject}
            onCancel={() => setEditingGardenObject(null)}
            onDelete={deleteGardenObject}
            gardenPlan={gardenPlan}
          />
        )}

        <MagicLayoutModal 
          isOpen={showMagic} 
          onClose={() => setShowMagic(false)} 
          onApply={applyMagicLayout}
          gardenWidth={gardenWidth} 
          gardenLength={gardenLength} 
          orientation={orientation} 
          beds={beds} 
          plants={gardenPlan} 
          zone={selectedZone}
          isFenced={isFenced}
          gatePosition={gatePosition}
          gateWidth={gateWidth}
          walkwayWidth={walkwayWidth}
          trellises={trellises}
        />
        
        <ClearDataModal 
          isOpen={showClearModal} 
          onClose={() => setShowClearModal(false)} 
          onConfirm={clearAllData} 
        />
      </div>
    </div>
  );
}
