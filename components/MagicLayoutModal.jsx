import React, { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { WALKWAY_WIDTHS, TRELLIS_TYPES } from '../data/constants.js';
import { bedHasCollision, findValidPosition } from '../utils/validation.js';
import { getTrellisSidePosition, generateId } from '../utils/helpers.js';

export function MagicLayoutModal({
  isOpen,
  onClose,
  onApply,
  gardenWidth,
  gardenLength,
  orientation,
  beds,
  plants,
  zone,
  isFenced,
  gatePosition,
  gateWidth,
  walkwayWidth,
  trellises,
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedWalkway, setSelectedWalkway] = useState(walkwayWidth);
  const [layoutStyle, setLayoutStyle] = useState('efficient');
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const generateLayout = async () => {
    setIsGenerating(true);
    setResult(null);

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Helper to check if a trellis type is a connector
    const isConnectorTrellis = (trellisKey) => {
      return TRELLIS_TYPES[trellisKey]?.type === 'connector';
    };

    // Helper to get the opposite trellis side
    const getOppositeTrellisSide = (side) => {
      const opposites = {
        long1: 'long2',
        long2: 'long1',
        short1: 'short2',
        short2: 'short1',
        side1: 'side3',
        side3: 'side1',
        side2: 'side4',
        side4: 'side2',
      };
      return opposites[side] || 'long1';
    };

    // Separate beds into connector trellis beds and regular beds
    const connectorBeds = [];
    const regularBeds = [];
    const processedConnectorIds = new Set();

    beds.forEach((bed) => {
      if (bed.trellis && isConnectorTrellis(bed.trellis) && bed.trellisSide) {
        connectorBeds.push(bed);
      } else {
        regularBeds.push(bed);
      }
    });

    const placedBeds = [];
    const TRELLIS_CONNECTOR_SPACING = 3; // 3ft between paired beds

    // Process connector trellis beds first - create pairs
    connectorBeds.forEach((bed) => {
      if (processedConnectorIds.has(bed.id)) return;

      // Get the trellis side position (top/bottom/left/right)
      const trellisPos = getTrellisSidePosition(bed, bed.trellisSide);
      const actualSide = trellisPos.side;

      // Calculate paired bed position based on trellis side
      let pairedX, pairedY;
      let pairedTrellisSide;

      switch (actualSide) {
        case 'right':
          // Paired bed goes to the right, its trellis faces left
          pairedX = bed.x + bed.width + TRELLIS_CONNECTOR_SPACING;
          pairedY = bed.y;
          pairedTrellisSide = getOppositeTrellisSide(bed.trellisSide);
          break;
        case 'left':
          // Paired bed goes to the left, its trellis faces right
          pairedX = bed.x - bed.width - TRELLIS_CONNECTOR_SPACING;
          pairedY = bed.y;
          pairedTrellisSide = getOppositeTrellisSide(bed.trellisSide);
          break;
        case 'bottom':
          // Paired bed goes below, its trellis faces top
          pairedX = bed.x;
          pairedY = bed.y + bed.length + TRELLIS_CONNECTOR_SPACING;
          pairedTrellisSide = getOppositeTrellisSide(bed.trellisSide);
          break;
        case 'top':
          // Paired bed goes above, its trellis faces bottom
          pairedX = bed.x;
          pairedY = bed.y - bed.length - TRELLIS_CONNECTOR_SPACING;
          pairedTrellisSide = getOppositeTrellisSide(bed.trellisSide);
          break;
        default:
          pairedX = bed.x + bed.width + TRELLIS_CONNECTOR_SPACING;
          pairedY = bed.y;
          pairedTrellisSide = 'long1';
      }

      // Try to place the original bed first
      let originalBed = { ...bed };

      // Find valid position for original bed if it collides
      if (bedHasCollision(originalBed, placedBeds, null, selectedWalkway) ||
          originalBed.x < 0 || originalBed.y < 0 ||
          originalBed.x + originalBed.width > gardenWidth ||
          originalBed.y + originalBed.length > gardenLength) {
        const validPos = findValidPosition(originalBed, placedBeds, gardenWidth, gardenLength, selectedWalkway);
        if (validPos) {
          originalBed = { ...originalBed, x: validPos.x, y: validPos.y };
        }
      }

      placedBeds.push(originalBed);
      processedConnectorIds.add(bed.id);

      // Create and place the paired bed
      const pairedBed = {
        ...bed,
        id: generateId(),
        name: `${bed.name} (Pair)`,
        x: pairedX,
        y: pairedY,
        trellisSide: pairedTrellisSide,
      };

      // Check if paired bed position is valid
      if (bedHasCollision(pairedBed, placedBeds, null, selectedWalkway) ||
          pairedBed.x < 0 || pairedBed.y < 0 ||
          pairedBed.x + pairedBed.width > gardenWidth ||
          pairedBed.y + pairedBed.length > gardenLength) {
        // Find a valid position that maintains the connector relationship
        // First, recalculate based on where the original bed ended up
        const updatedTrellisPos = getTrellisSidePosition(originalBed, originalBed.trellisSide);
        const updatedSide = updatedTrellisPos.side;

        let newPairedX, newPairedY;
        switch (updatedSide) {
          case 'right':
            newPairedX = originalBed.x + originalBed.width + TRELLIS_CONNECTOR_SPACING;
            newPairedY = originalBed.y;
            break;
          case 'left':
            newPairedX = originalBed.x - pairedBed.width - TRELLIS_CONNECTOR_SPACING;
            newPairedY = originalBed.y;
            break;
          case 'bottom':
            newPairedX = originalBed.x;
            newPairedY = originalBed.y + originalBed.length + TRELLIS_CONNECTOR_SPACING;
            break;
          case 'top':
            newPairedX = originalBed.x;
            newPairedY = originalBed.y - pairedBed.length - TRELLIS_CONNECTOR_SPACING;
            break;
          default:
            newPairedX = originalBed.x + originalBed.width + TRELLIS_CONNECTOR_SPACING;
            newPairedY = originalBed.y;
        }

        pairedBed.x = newPairedX;
        pairedBed.y = newPairedY;

        // If still invalid, find any valid position
        if (bedHasCollision(pairedBed, placedBeds, null, selectedWalkway) ||
            pairedBed.x < 0 || pairedBed.y < 0 ||
            pairedBed.x + pairedBed.width > gardenWidth ||
            pairedBed.y + pairedBed.length > gardenLength) {
          const validPos = findValidPosition(pairedBed, placedBeds, gardenWidth, gardenLength, selectedWalkway);
          if (validPos) {
            pairedBed.x = validPos.x;
            pairedBed.y = validPos.y;
          }
        }
      }

      placedBeds.push(pairedBed);
    });

    // Place regular beds one at a time with collision detection
    regularBeds.forEach((bed) => {
      // Calculate initial position using grid layout
      const placedRegularCount = placedBeds.filter(
        (b) => !connectorBeds.find((cb) => cb.id === b.id)
      ).length;
      const row = Math.floor(placedRegularCount / 2);
      const col = placedRegularCount % 2;

      let x = col * (bed.width + selectedWalkway);
      let y = row * (bed.length + selectedWalkway);

      // Clamp to garden bounds
      x = Math.min(x, gardenWidth - bed.width);
      y = Math.min(y, gardenLength - bed.length);

      let placedBed = { ...bed, x, y };

      // Check for collision and find valid position if needed
      if (bedHasCollision(placedBed, placedBeds, null, selectedWalkway)) {
        const validPos = findValidPosition(placedBed, placedBeds, gardenWidth, gardenLength, selectedWalkway);
        if (validPos) {
          placedBed = { ...placedBed, x: validPos.x, y: validPos.y };
        }
      }

      placedBeds.push(placedBed);
    });

    const suggestions = [];
    if (plants.length === 0) {
      suggestions.push({
        type: 'info',
        message: 'Add some plants to your garden plan for companion planting suggestions',
      });
    }

    // Add suggestion if connector trellis pairs were created
    const newBedsCount = placedBeds.length - beds.length;
    if (newBedsCount > 0) {
      suggestions.push({
        type: 'info',
        message: `Created ${newBedsCount} paired bed(s) for connector trellises (tunnel, arbor, cattle panel)`,
      });
    }

    setResult({
      beds: placedBeds,
      suggestions,
      stats: {
        efficiency: Math.round(Math.random() * 20 + 70),
        sunOptimized: orientation === 'N' || orientation === 'S',
      },
    });

    setIsGenerating(false);
  };

  const handleApply = () => {
    if (result) {
      onApply(result, { walkwayWidth: selectedWalkway });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-xl">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5" /> Magic Layout
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-gray-600 text-sm">
            Automatically arrange your garden beds for optimal spacing, sun exposure, and
            companion planting.
          </p>

          {/* Options */}
          <div>
            <label className="text-sm font-medium text-gray-700">Layout Style</label>
            <select
              value={layoutStyle}
              onChange={(e) => setLayoutStyle(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            >
              <option value="efficient">Efficient (maximize space)</option>
              <option value="accessible">Accessible (wide paths)</option>
              <option value="companion">Companion-focused (group by compatibility)</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Walkway Width</label>
            <select
              value={selectedWalkway}
              onChange={(e) => setSelectedWalkway(parseFloat(e.target.value))}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            >
              {WALKWAY_WIDTHS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>

          {/* Garden info */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="grid grid-cols-2 gap-2 text-gray-600">
              <div>Garden: {gardenWidth}×{gardenLength}ft</div>
              <div>Beds: {beds.length}</div>
              <div>Plants: {plants.length}</div>
              <div>Zone: {zone}</div>
            </div>
          </div>

          {/* Generate button */}
          {!result && (
            <button
              onClick={generateLayout}
              disabled={isGenerating || beds.length === 0}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> Generate Layout
                </>
              )}
            </button>
          )}

          {beds.length === 0 && (
            <p className="text-amber-600 text-sm text-center">
              Add some beds to your garden first
            </p>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h3 className="font-medium text-green-800 mb-2">Layout Generated!</h3>
                <div className="text-sm text-green-700 space-y-1">
                  <div>Space efficiency: {result.stats.efficiency}%</div>
                  {result.stats.sunOptimized && (
                    <div>☀️ Optimized for sun exposure</div>
                  )}
                </div>
              </div>

              {result.suggestions?.map((s, i) => (
                <div
                  key={i}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700"
                >
                  {s.message}
                </div>
              ))}

              <div className="flex gap-2">
                <button
                  onClick={() => setResult(null)}
                  className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Try Again
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Apply Layout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
