// Bed types
export const BED_TYPES = {
  raised: { name: 'Raised Bed', color: 'bg-amber-200 border-amber-600', icon: '🪵' },
  inground: { name: 'In-Ground', color: 'bg-amber-100 border-amber-500', icon: '🌱' },
  planter: { name: 'Planter/Pot', color: 'bg-stone-200 border-stone-500', icon: '🪴' },
  container: { name: 'Container', color: 'bg-gray-200 border-gray-500', icon: '📦' },
};

// Trellis types
export const TRELLIS_TYPES = {
  // Bed attachment trellises
  aframe: { 
    name: 'A-Frame Trellis', 
    icon: '🔺', 
    type: 'attachment',
    height: 6, // feet
    description: 'Attaches to one side of a bed, good for beans and peas',
  },
  arch: { 
    name: 'Arch Trellis', 
    icon: '🌈', 
    type: 'attachment',
    height: 7,
    description: 'Curved trellis over bed, great for cucumbers and squash',
  },
  vertical: { 
    name: 'Vertical Panel', 
    icon: '📐', 
    type: 'attachment',
    height: 6,
    description: 'Flat panel attached to bed edge, for tomatoes and climbing plants',
  },
  cage: { 
    name: 'Tomato Cage', 
    icon: '🗼', 
    type: 'attachment',
    height: 4,
    description: 'Individual plant support, best for tomatoes and peppers',
  },
  // Standalone/connector trellises
  tunnel: { 
    name: 'Tunnel Trellis', 
    icon: '🚇', 
    type: 'connector',
    height: 7,
    width: 4, // feet wide
    description: 'Connects two beds, creates walkable tunnel with plants overhead',
  },
  arbor: { 
    name: 'Garden Arbor', 
    icon: '⛩️', 
    type: 'connector',
    height: 8,
    width: 4,
    description: 'Decorative arch connecting beds, for grapes or climbing roses',
  },
  cattle_panel: { 
    name: 'Cattle Panel Arch', 
    icon: '🌉', 
    type: 'connector',
    height: 6,
    width: 4,
    description: 'Strong curved panel between beds, supports heavy squash',
  },
};

// Default walkway width options
export const WALKWAY_WIDTHS = [
  { value: 2, label: '2ft (tight)' },
  { value: 2.5, label: '2.5ft (narrow)' },
  { value: 3, label: '3ft (wheelbarrow)' },
  { value: 3.5, label: '3.5ft (comfortable)' },
  { value: 4, label: '4ft (cart/wagon)' },
];

// Gate width options
export const GATE_WIDTHS = [
  { value: 3, label: '3ft (person)' },
  { value: 4, label: '4ft (wheelbarrow)' },
  { value: 5, label: '5ft (wide)' },
  { value: 6, label: '6ft (cart/mower)' },
  { value: 8, label: '8ft (vehicle)' },
];

// Fence sides for gate placement
export const FENCE_SIDES = ['north', 'south', 'east', 'west'];

// Trellis side options (relative to bed shape - long/short sides)
export const TRELLIS_SIDES = [
  { value: 'long1', label: 'Long Side 1' },
  { value: 'long2', label: 'Long Side 2' },
  { value: 'short1', label: 'Short Side 1' },
  { value: 'short2', label: 'Short Side 2' },
];

// For square beds (width === length), show all 4 sides as equal options
export const TRELLIS_SIDES_SQUARE = [
  { value: 'side1', label: 'Side 1' },
  { value: 'side2', label: 'Side 2' },
  { value: 'side3', label: 'Side 3' },
  { value: 'side4', label: 'Side 4' },
];

// Corner exclusion zone (feet from corner where gate can't be placed)
export const GATE_CORNER_EXCLUSION = 2;

// Local storage key
export const STORAGE_KEY = 'garden-planner-data';
export const STORAGE_VERSION = 4;
