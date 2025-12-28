// Generate unique ID
export function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

// Format last saved timestamp
export function formatLastSaved(date) {
  if (!date) return '';
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

// Get planting year based on zone frost dates
export function getPlantingYear(zone) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const lastFrostDate = new Date(currentYear, zone.lastFrost.month - 1, zone.lastFrost.day);

  // If we're past the last frost date, use current year, otherwise previous
  return now > lastFrostDate ? currentYear : currentYear;
}

// Clamp value between min and max
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Round to nearest 0.5
export function roundToHalf(value) {
  return Math.round(value * 2) / 2;
}

// Convert perimeter position (0-1) to x,y coordinates and side
export function perimeterToXY(t, width, height) {
  const perimeter = 2 * (width + height);
  const pos = t * perimeter;

  if (pos < width) {
    // Top edge (north), going left to right
    return { x: pos, y: 0, side: 'north' };
  } else if (pos < width + height) {
    // Right edge (east), going top to bottom
    return { x: width, y: pos - width, side: 'east' };
  } else if (pos < 2 * width + height) {
    // Bottom edge (south), going right to left
    return { x: width - (pos - width - height), y: height, side: 'south' };
  } else {
    // Left edge (west), going bottom to top
    return { x: 0, y: height - (pos - 2 * width - height), side: 'west' };
  }
}

// Get perimeter position (0-1) from x,y coordinates
export function getPerimeterPosition(x, y, width, height) {
  const perimeter = 2 * (width + height);

  // Determine closest edge
  const distTop = y;
  const distBottom = height - y;
  const distLeft = x;
  const distRight = width - x;
  const minDist = Math.min(distTop, distBottom, distLeft, distRight);

  if (minDist === distTop) {
    // North edge
    return x / perimeter;
  } else if (minDist === distRight) {
    // East edge
    return (width + y) / perimeter;
  } else if (minDist === distBottom) {
    // South edge
    return (width + height + (width - x)) / perimeter;
  } else {
    // West edge
    return (2 * width + height + (height - y)) / perimeter;
  }
}

// Get trellis side position for canvas rendering
// Converts relative side (long1, long2, short1, short2, or side1-4 for square) to actual position
export function getTrellisSidePosition(bed, trellisSide) {
  const isSquare = Math.abs(bed.width - bed.length) < 0.1;
  const isWider = bed.width > bed.length;

  if (isSquare) {
    // For square beds, sides are numbered clockwise starting from top
    // side1 = top, side2 = right, side3 = bottom, side4 = left
    switch (trellisSide) {
      case 'side1':
      case 'long1': // Fallback for migrated data
        return { side: 'top', isLongSide: true };
      case 'side2':
      case 'short1': // Fallback for migrated data
        return { side: 'right', isLongSide: true };
      case 'side3':
      case 'long2': // Fallback for migrated data
        return { side: 'bottom', isLongSide: true };
      case 'side4':
      case 'short2': // Fallback for migrated data
        return { side: 'left', isLongSide: true };
      default:
        return { side: 'top', isLongSide: true };
    }
  }

  // For rectangular beds:
  // If wider (width > length): long sides are top/bottom, short sides are left/right
  // If taller (length > width): long sides are left/right, short sides are top/bottom
  switch (trellisSide) {
    case 'long1':
      return isWider
        ? { side: 'top', isLongSide: true }
        : { side: 'left', isLongSide: true };
    case 'long2':
      return isWider
        ? { side: 'bottom', isLongSide: true }
        : { side: 'right', isLongSide: true };
    case 'short1':
      return isWider
        ? { side: 'left', isLongSide: false }
        : { side: 'top', isLongSide: false };
    case 'short2':
      return isWider
        ? { side: 'right', isLongSide: false }
        : { side: 'bottom', isLongSide: false };
    // Handle legacy cardinal directions for backward compatibility
    case 'N':
      return { side: 'top', isLongSide: bed.width >= bed.length };
    case 'S':
      return { side: 'bottom', isLongSide: bed.width >= bed.length };
    case 'E':
      return { side: 'right', isLongSide: bed.length >= bed.width };
    case 'W':
      return { side: 'left', isLongSide: bed.length >= bed.width };
    default:
      return { side: 'top', isLongSide: true };
  }
}

// Get the appropriate trellis sides options based on bed dimensions
export function getTrellisSidesForBed(width, length) {
  const isSquare = Math.abs(width - length) < 0.1;
  if (isSquare) {
    return [
      { value: 'side1', label: 'Side 1 (Top)' },
      { value: 'side2', label: 'Side 2 (Right)' },
      { value: 'side3', label: 'Side 3 (Bottom)' },
      { value: 'side4', label: 'Side 4 (Left)' },
    ];
  }
  return [
    { value: 'long1', label: 'Long Side 1' },
    { value: 'long2', label: 'Long Side 2' },
    { value: 'short1', label: 'Short Side 1' },
    { value: 'short2', label: 'Short Side 2' },
  ];
}

// Check if gate position is valid (not in corners)
export function isValidGatePosition(t, width, height, gateWidth, cornerExclusion) {
  const perimeter = 2 * (width + height);
  const gateHalfWidth = (gateWidth / perimeter) / 2;

  // Corner positions as fractions of perimeter
  const corners = [
    0,                                    // top-left
    width / perimeter,                    // top-right
    (width + height) / perimeter,         // bottom-right
    (2 * width + height) / perimeter,     // bottom-left
    1                                     // top-left (wrap)
  ];

  const exclusionFraction = cornerExclusion / perimeter;

  // Check if gate (including its width) would overlap any corner exclusion zone
  for (const corner of corners) {
    const gateStart = t - gateHalfWidth;
    const gateEnd = t + gateHalfWidth;
    const cornerStart = corner - exclusionFraction;
    const cornerEnd = corner + exclusionFraction;

    if (gateEnd > cornerStart && gateStart < cornerEnd) {
      return false;
    }
  }

  return true;
}
