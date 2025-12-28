import { roundToHalf, getTrellisSidePosition } from './helpers.js';
import { TRELLIS_TYPES } from '../data/constants.js';

// Trellis connector spacing constant (feet between beds for walkway under trellis arch)
const TRELLIS_CONNECTOR_SPACING = 3;

// Check if two beds overlap
// padding = minimum gap required between beds
export function bedsOverlap(bed1, bed2, padding = 0) {
  const a = { 
    x1: bed1.x - padding, 
    y1: bed1.y - padding, 
    x2: bed1.x + bed1.width + padding, 
    y2: bed1.y + bed1.length + padding 
  };
  const b = { 
    x1: bed2.x - padding, 
    y1: bed2.y - padding, 
    x2: bed2.x + bed2.width + padding, 
    y2: bed2.y + bed2.length + padding 
  };
  return !(a.x2 <= b.x1 || b.x2 <= a.x1 || a.y2 <= b.y1 || b.y2 <= a.y1);
}

// Check if bed is within garden bounds
export function bedInBounds(bed, gardenWidth, gardenLength) {
  return bed.x >= 0 && 
         bed.y >= 0 && 
         bed.x + bed.width <= gardenWidth && 
         bed.y + bed.length <= gardenLength;
}

// Check if a trellis type is a connector type
function isConnectorTrellis(trellisKey) {
  return TRELLIS_TYPES[trellisKey]?.type === 'connector';
}

// Check if two beds have connector trellises on facing sides
// Returns true if they should use the special 3ft connector spacing
export function bedsHaveConnectorTrellises(bed1, bed2) {
  // Both beds need to have trellises
  if (!bed1.trellis || !bed2.trellis) return false;

  // Both trellises must be connector type
  if (!isConnectorTrellis(bed1.trellis) || !isConnectorTrellis(bed2.trellis)) return false;

  // Both beds need trellis sides defined
  if (!bed1.trellisSide || !bed2.trellisSide) return false;

  // Convert relative trellis sides to actual canvas positions (top/bottom/left/right)
  const bed1TrellisPos = getTrellisSidePosition(bed1, bed1.trellisSide);
  const bed2TrellisPos = getTrellisSidePosition(bed2, bed2.trellisSide);
  const bed1ActualSide = bed1TrellisPos.side;
  const bed2ActualSide = bed2TrellisPos.side;

  // Bed1 is to the north of bed2, and bed1's trellis is on bottom, bed2's on top
  const bed1NorthOfBed2 = bed1.y + bed1.length <= bed2.y + 0.1;
  const bed1SouthOfBed2 = bed2.y + bed2.length <= bed1.y + 0.1;
  const bed1WestOfBed2 = bed1.x + bed1.width <= bed2.x + 0.1;
  const bed1EastOfBed2 = bed2.x + bed2.width <= bed1.x + 0.1;

  // Check horizontal overlap for north/south facing
  const hasHorizontalOverlap = !(bed1.x + bed1.width <= bed2.x || bed2.x + bed2.width <= bed1.x);
  // Check vertical overlap for east/west facing
  const hasVerticalOverlap = !(bed1.y + bed1.length <= bed2.y || bed2.y + bed2.length <= bed1.y);

  // North-South facing: bed1 is north of bed2 (bed1 above bed2)
  // bed1's trellis must be on 'bottom', bed2's trellis on 'top'
  if (bed1NorthOfBed2 && hasHorizontalOverlap && bed1ActualSide === 'bottom' && bed2ActualSide === 'top') {
    return true;
  }

  // South-North facing: bed1 is south of bed2 (bed1 below bed2)
  // bed1's trellis must be on 'top', bed2's trellis on 'bottom'
  if (bed1SouthOfBed2 && hasHorizontalOverlap && bed1ActualSide === 'top' && bed2ActualSide === 'bottom') {
    return true;
  }

  // West-East facing: bed1 is west of bed2 (bed1 left of bed2)
  // bed1's trellis must be on 'right', bed2's trellis on 'left'
  if (bed1WestOfBed2 && hasVerticalOverlap && bed1ActualSide === 'right' && bed2ActualSide === 'left') {
    return true;
  }

  // East-West facing: bed1 is east of bed2 (bed1 right of bed2)
  // bed1's trellis must be on 'left', bed2's trellis on 'right'
  if (bed1EastOfBed2 && hasVerticalOverlap && bed1ActualSide === 'left' && bed2ActualSide === 'right') {
    return true;
  }

  return false;
}

// Calculate the required spacing between two beds
// Returns the trellis connector spacing if beds have facing connector trellises, otherwise normal walkway
export function getRequiredSpacing(bed1, bed2, walkwayWidth) {
  if (bedsHaveConnectorTrellises(bed1, bed2)) {
    return TRELLIS_CONNECTOR_SPACING;
  }
  return walkwayWidth;
}

// Check if two beds are aligned end-to-end (narrow sides touching)
// This means they form a row and don't need walkway between them
export function bedsAreEndToEnd(bed1, bed2) {
  // Check if they have the same width and are vertically aligned
  const sameWidthVertical = 
    Math.abs(bed1.width - bed2.width) < 0.1 && 
    Math.abs(bed1.x - bed2.x) < 0.1 &&
    (Math.abs((bed1.y + bed1.length) - bed2.y) < 0.1 || Math.abs((bed2.y + bed2.length) - bed1.y) < 0.1);
  
  // Check if they have the same length and are horizontally aligned
  const sameLengthHorizontal = 
    Math.abs(bed1.length - bed2.length) < 0.1 && 
    Math.abs(bed1.y - bed2.y) < 0.1 &&
    (Math.abs((bed1.x + bed1.width) - bed2.x) < 0.1 || Math.abs((bed2.x + bed2.width) - bed1.x) < 0.1);
  
  return sameWidthVertical || sameLengthHorizontal;
}

// Check if bed collides with any other bed
// walkwayWidth is only applied if beds are NOT end-to-end
export function bedHasCollision(bed, allBeds, excludeId = null, walkwayWidth = 0) {
  return allBeds.some(other => {
    if (other.id === excludeId || other.id === bed.id) return false;

    // If beds are end-to-end (forming a row), no walkway needed between them
    if (bedsAreEndToEnd(bed, other)) {
      return bedsOverlap(bed, other, 0); // Just check for actual overlap, no padding
    }

    // Check if beds have connector trellises on facing sides - use special spacing
    if (bedsHaveConnectorTrellises(bed, other)) {
      // For connector trellises, use the fixed 3ft spacing
      return bedsOverlap(bed, other, TRELLIS_CONNECTOR_SPACING / 2);
    }

    // Otherwise, require walkway padding
    return bedsOverlap(bed, other, walkwayWidth / 2);
  });
}

// Validate bed position
export function validateBedPosition(bed, allBeds, gardenWidth, gardenLength, excludeId = null, walkwayWidth = 0) {
  const errors = [];
  
  if (!bedInBounds(bed, gardenWidth, gardenLength)) {
    errors.push('Bed extends outside garden boundaries');
  }
  
  if (bedHasCollision(bed, allBeds, excludeId, walkwayWidth)) {
    errors.push('Bed overlaps or is too close to another bed');
  }
  
  return { valid: errors.length === 0, errors };
}

// Find a valid position for a new bed
export function findValidPosition(newBed, existingBeds, gardenWidth, gardenLength, walkwayWidth = 3) {
  // Try positions starting from edges
  for (let y = 0; y <= gardenLength - newBed.length; y += 0.5) {
    for (let x = 0; x <= gardenWidth - newBed.width; x += 0.5) {
      const testBed = { ...newBed, x, y };
      
      // Check if position is valid with walkway requirements
      if (bedInBounds(testBed, gardenWidth, gardenLength) && 
          !bedHasCollision(testBed, existingBeds, null, walkwayWidth)) {
        return { x, y };
      }
    }
  }
  
  // Fallback: try without walkway padding (beds can touch if end-to-end)
  for (let y = 0; y <= gardenLength - newBed.length; y += 0.5) {
    for (let x = 0; x <= gardenWidth - newBed.width; x += 0.5) {
      const testBed = { ...newBed, x, y };
      const validation = validateBedPosition(testBed, existingBeds, gardenWidth, gardenLength);
      if (validation.valid) return { x, y };
    }
  }
  
  return null;
}

// Snap a bed to the nearest valid position
export function snapToValidPosition(bed, allBeds, gardenWidth, gardenLength, walkwayWidth = 0) {
  // First clamp to bounds
  let x = Math.max(0, Math.min(gardenWidth - bed.width, bed.x));
  let y = Math.max(0, Math.min(gardenLength - bed.length, bed.y));
  x = roundToHalf(x);
  y = roundToHalf(y);
  
  const testBed = { ...bed, x, y };
  
  // If no collision, return this position
  if (!bedHasCollision(testBed, allBeds, bed.id, walkwayWidth)) {
    return { x, y, valid: true };
  }
  
  // Search nearby for valid position
  const searchRadius = 3;
  for (let r = 0.5; r <= searchRadius; r += 0.5) {
    for (let angle = 0; angle < 360; angle += 45) {
      const testX = roundToHalf(x + r * Math.cos(angle * Math.PI / 180));
      const testY = roundToHalf(y + r * Math.sin(angle * Math.PI / 180));
      const candidate = { ...bed, x: testX, y: testY };
      
      const validation = validateBedPosition(candidate, allBeds, gardenWidth, gardenLength, bed.id, walkwayWidth);
      if (validation.valid) {
        return { x: testX, y: testY, valid: true };
      }
    }
  }
  
  return { x: bed.x, y: bed.y, valid: false };
}

// Calculate space usage
export function calculateSpaceUsage(beds, gardenWidth, gardenLength) {
  const gardenArea = gardenWidth * gardenLength;
  const bedArea = beds.reduce((sum, bed) => sum + (bed.width * bed.length), 0);
  return { 
    gardenArea, 
    bedArea, 
    percentage: Math.round((bedArea / gardenArea) * 100), 
    remaining: gardenArea - bedArea 
  };
}

// Check if a bed can fit in the garden at all
export function canBedFit(width, length, gardenWidth, gardenLength) {
  return width <= gardenWidth && length <= gardenLength;
}

// Validate trellis connector between two beds
export function validateTrellisConnector(trellis, bed1, bed2, gardenWidth, gardenLength) {
  const errors = [];
  
  // Check if beds are adjacent (close enough for trellis)
  const gap = calculateBedGap(bed1, bed2);
  if (gap > 6) { // Max 6ft span for trellis
    errors.push('Beds are too far apart for trellis');
  }
  
  // Check if trellis would extend outside garden
  // (implementation depends on trellis type and bed positions)
  
  return { valid: errors.length === 0, errors };
}

// Calculate gap between two beds (shortest distance)
export function calculateBedGap(bed1, bed2) {
  const dx = Math.max(0, Math.max(bed1.x, bed2.x) - Math.min(bed1.x + bed1.width, bed2.x + bed2.width));
  const dy = Math.max(0, Math.max(bed1.y, bed2.y) - Math.min(bed1.y + bed1.length, bed2.y + bed2.length));
  return Math.sqrt(dx * dx + dy * dy);
}
