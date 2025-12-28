// Garden Objects - structures beyond beds that can be placed in or around the garden

export const GARDEN_OBJECT_TYPES = {
  greenhouse: {
    name: 'Greenhouse',
    icon: '🏠',
    color: 'bg-emerald-200 border-emerald-500',
    defaultWidth: 8,
    defaultLength: 10,
    minWidth: 4,
    minLength: 6,
    canHoldPlants: true,  // Can contain seedlings/potted plants
    climate: 'controlled', // For overwintering logic
    description: 'Protect seedlings and overwinter potted plants',
  },
  fertilizer: {
    name: 'Fertilizer Pile',
    icon: '🧱',
    color: 'bg-amber-700 border-amber-900',
    defaultWidth: 3,
    defaultLength: 3,
    minWidth: 2,
    minLength: 2,
    canHoldPlants: false,
    description: 'Compost and fertilizer storage',
  },
  // Placeholder for future objects:
  // coldFrame: { ... },     // Mini greenhouse for hardening off
  // shed: { ... },          // Tool storage
  // rainBarrel: { ... },    // Water collection
  // compostBin: { ... },    // Active composting
  // potting_bench: { ... }, // Work surface for potting
  // bee_house: { ... },     // Pollinator habitat
};

// Helper to get default dimensions for a garden object type
export function getDefaultDimensions(objectType) {
  const type = GARDEN_OBJECT_TYPES[objectType];
  if (!type) return { width: 4, length: 4 };
  return {
    width: type.defaultWidth,
    length: type.defaultLength,
  };
}

// Helper to validate dimensions against minimums
export function validateObjectDimensions(objectType, width, length) {
  const type = GARDEN_OBJECT_TYPES[objectType];
  if (!type) return { valid: false, error: 'Unknown object type' };

  if (width < type.minWidth) {
    return { valid: false, error: `Minimum width is ${type.minWidth}ft` };
  }
  if (length < type.minLength) {
    return { valid: false, error: `Minimum length is ${type.minLength}ft` };
  }

  return { valid: true };
}

// Create a new garden object with defaults
export function createGardenObject(objectType, overrides = {}) {
  const type = GARDEN_OBJECT_TYPES[objectType];
  if (!type) return null;

  const base = {
    id: overrides.id || null, // Should be set by caller using generateId()
    type: objectType,
    name: overrides.name || type.name,
    width: overrides.width || type.defaultWidth,
    length: overrides.length || type.defaultLength,
    x: overrides.x || 0,
    y: overrides.y || 0,
  };

  // Add plants array for objects that can hold plants
  if (type.canHoldPlants) {
    base.plants = overrides.plants || [];
  }

  return base;
}
