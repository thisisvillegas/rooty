import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Maximize2, Leaf, RotateCw } from 'lucide-react';
import { BED_TYPES, TRELLIS_TYPES, GATE_CORNER_EXCLUSION } from '../data/constants.js';
import { GARDEN_OBJECT_TYPES } from '../data/gardenObjects.js';
import { bedHasCollision, bedInBounds, validateBedPosition, snapToValidPosition } from '../utils/validation.js';
import { clamp, perimeterToXY, getPerimeterPosition, isValidGatePosition, getTrellisSidePosition } from '../utils/helpers.js';

export function GardenCanvas({
  gardenWidth,
  gardenLength,
  beds,
  setBeds,
  trellises,
  setTrellises,
  orientation,
  onEditBed,
  isFenced,
  setIsFenced,
  gatePosition, // 0-1, position along perimeter
  setGatePosition,
  gateWidth,
  setGateWidth,
  walkwayWidth,
  gardenObjects = [],
  setGardenObjects,
  offGardenObjects = [],
  setOffGardenObjects,
  onEditGardenObject,
}) {
  const canvasRef = useRef(null);
  const offGardenRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [dragPreview, setDragPreview] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [draggingGate, setDraggingGate] = useState(false);
  const [draggingObject, setDraggingObject] = useState(null);
  const [resizingObject, setResizingObject] = useState(null);
  
  const scale = Math.min(500 / gardenWidth, 350 / gardenLength, 40);
  const canvasW = gardenWidth * scale;
  const canvasH = gardenLength * scale;
  
  // Get gate visual position
  const gateInfo = perimeterToXY(gatePosition, gardenWidth, gardenLength);
  const gatePixelWidth = gateWidth * scale;
  
  // Calculate gate position in pixels
  const getGateStyle = () => {
    if (!isFenced) return null;
    
    const thickness = 8;
    let style = { 
      position: 'absolute', 
      backgroundColor: '#92400e',
      borderRadius: '2px',
      cursor: 'grab',
      zIndex: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
    
    if (gateInfo.side === 'north' || gateInfo.side === 'south') {
      style.width = gatePixelWidth;
      style.height = thickness;
      style.left = gateInfo.x * scale - gatePixelWidth / 2;
      style.top = gateInfo.side === 'north' ? -thickness / 2 : canvasH - thickness / 2;
    } else {
      style.width = thickness;
      style.height = gatePixelWidth;
      style.top = gateInfo.y * scale - gatePixelWidth / 2;
      style.left = gateInfo.side === 'west' ? -thickness / 2 : canvasW - thickness / 2;
    }
    
    return style;
  };
  
  // Handle fence click to toggle
  const handleFenceClick = (e) => {
    if (!isFenced) {
      setIsFenced(true);
      // Set default gate position to clicked location
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
      const t = getPerimeterPosition(x, y, gardenWidth, gardenLength);
      if (isValidGatePosition(t, gardenWidth, gardenLength, gateWidth, GATE_CORNER_EXCLUSION)) {
        setGatePosition(t);
      }
    }
  };
  
  // Handle gate drag
  const handleGateMouseDown = (e) => {
    e.stopPropagation();
    setDraggingGate(true);
  };
  
  // Handle gate drag move
  const handleGateDrag = useCallback((e) => {
    if (!draggingGate || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / scale, 0, gardenWidth);
    const y = clamp((e.clientY - rect.top) / scale, 0, gardenLength);
    
    // Find closest point on perimeter
    let newT;
    const distTop = y;
    const distBottom = gardenLength - y;
    const distLeft = x;
    const distRight = gardenWidth - x;
    const minDist = Math.min(distTop, distBottom, distLeft, distRight);
    
    if (minDist === distTop) newT = x / (2 * (gardenWidth + gardenLength));
    else if (minDist === distRight) newT = (gardenWidth + y) / (2 * (gardenWidth + gardenLength));
    else if (minDist === distBottom) newT = (gardenWidth + gardenLength + (gardenWidth - x)) / (2 * (gardenWidth + gardenLength));
    else newT = (2 * gardenWidth + gardenLength + (gardenLength - y)) / (2 * (gardenWidth + gardenLength));
    
    // Validate position (not in corners)
    if (isValidGatePosition(newT, gardenWidth, gardenLength, gateWidth, GATE_CORNER_EXCLUSION)) {
      setGatePosition(newT);
    }
  }, [draggingGate, gardenWidth, gardenLength, gateWidth, scale, setGatePosition]);
  
  // Handle bed drag start
  const handleBedMouseDown = (e, bedId, action) => {
    e.stopPropagation();
    const bed = beds.find(b => b.id === bedId);
    if (action === 'move') {
      setDragging({ bedId, startX: e.clientX, startY: e.clientY, originalX: bed.x, originalY: bed.y });
    } else if (action === 'resize') {
      setResizing({ bedId, startX: e.clientX, startY: e.clientY, originalW: bed.width, originalL: bed.length });
    }
  };

  // Handle garden object drag start
  const handleObjectMouseDown = (e, objectId, action, isOffGarden = false) => {
    e.stopPropagation();
    const objectList = isOffGarden ? offGardenObjects : gardenObjects;
    const obj = objectList.find(o => o.id === objectId);
    if (!obj) return;

    if (action === 'move') {
      setDraggingObject({
        objectId,
        isOffGarden,
        startX: e.clientX,
        startY: e.clientY,
        originalX: obj.x,
        originalY: obj.y,
      });
    } else if (action === 'resize') {
      setResizingObject({
        objectId,
        isOffGarden,
        startX: e.clientX,
        startY: e.clientY,
        originalW: obj.width,
        originalL: obj.length,
      });
    }
  };
  
  // Handle bed drag move
  const handleMouseMove = useCallback((e) => {
    if (draggingGate) {
      handleGateDrag(e);
      return;
    }

    if (dragging) {
      const dx = (e.clientX - dragging.startX) / scale;
      const dy = (e.clientY - dragging.startY) / scale;
      const bed = beds.find(b => b.id === dragging.bedId);
      let newX = Math.round((dragging.originalX + dx) * 2) / 2;
      let newY = Math.round((dragging.originalY + dy) * 2) / 2;
      newX = Math.max(0, Math.min(gardenWidth - bed.width, newX));
      newY = Math.max(0, Math.min(gardenLength - bed.length, newY));
      setDragPreview({ valid: !bedHasCollision({ ...bed, x: newX, y: newY }, beds, bed.id, walkwayWidth) });
      setBeds(beds.map(b => b.id === dragging.bedId ? { ...b, x: newX, y: newY } : b));
    }

    if (resizing) {
      const dx = (e.clientX - resizing.startX) / scale;
      const dy = (e.clientY - resizing.startY) / scale;
      const bed = beds.find(b => b.id === resizing.bedId);
      let newW = Math.round(Math.max(1, resizing.originalW + dx) * 2) / 2;
      let newL = Math.round(Math.max(1, resizing.originalL + dy) * 2) / 2;
      newW = Math.min(newW, gardenWidth - bed.x);
      newL = Math.min(newL, gardenLength - bed.y);
      setDragPreview({ valid: !bedHasCollision({ ...bed, width: newW, length: newL }, beds, bed.id, walkwayWidth) });
      setBeds(beds.map(b => b.id === resizing.bedId ? { ...b, width: newW, length: newL } : b));
    }

    // Handle garden object dragging
    if (draggingObject) {
      const dx = (e.clientX - draggingObject.startX) / scale;
      const dy = (e.clientY - draggingObject.startY) / scale;
      const objectList = draggingObject.isOffGarden ? offGardenObjects : gardenObjects;
      const setObjectList = draggingObject.isOffGarden ? setOffGardenObjects : setGardenObjects;
      const obj = objectList.find(o => o.id === draggingObject.objectId);
      if (obj) {
        let newX = Math.round((draggingObject.originalX + dx) * 2) / 2;
        let newY = Math.round((draggingObject.originalY + dy) * 2) / 2;
        // Constrain to bounds (garden or off-garden area)
        if (!draggingObject.isOffGarden) {
          newX = Math.max(0, Math.min(gardenWidth - obj.width, newX));
          newY = Math.max(0, Math.min(gardenLength - obj.length, newY));
        } else {
          newX = Math.max(0, newX);
          newY = Math.max(0, newY);
        }
        setObjectList(objectList.map(o => o.id === draggingObject.objectId ? { ...o, x: newX, y: newY } : o));
      }
    }

    // Handle garden object resizing
    if (resizingObject) {
      const dx = (e.clientX - resizingObject.startX) / scale;
      const dy = (e.clientY - resizingObject.startY) / scale;
      const objectList = resizingObject.isOffGarden ? offGardenObjects : gardenObjects;
      const setObjectList = resizingObject.isOffGarden ? setOffGardenObjects : setGardenObjects;
      const obj = objectList.find(o => o.id === resizingObject.objectId);
      if (obj) {
        const objType = GARDEN_OBJECT_TYPES[obj.type];
        let newW = Math.round(Math.max(objType?.minWidth || 1, resizingObject.originalW + dx) * 2) / 2;
        let newL = Math.round(Math.max(objType?.minLength || 1, resizingObject.originalL + dy) * 2) / 2;
        if (!resizingObject.isOffGarden) {
          newW = Math.min(newW, gardenWidth - obj.x);
          newL = Math.min(newL, gardenLength - obj.y);
        }
        setObjectList(objectList.map(o => o.id === resizingObject.objectId ? { ...o, width: newW, length: newL } : o));
      }
    }
  }, [dragging, resizing, draggingGate, draggingObject, resizingObject, beds, gardenObjects, offGardenObjects, scale, gardenWidth, gardenLength, walkwayWidth, setBeds, setGardenObjects, setOffGardenObjects, handleGateDrag]);
  
  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (draggingGate) {
      setDraggingGate(false);
      return;
    }

    if (dragging) {
      const bed = beds.find(b => b.id === dragging.bedId);
      const snapped = snapToValidPosition(bed, beds, gardenWidth, gardenLength, walkwayWidth);
      if (!snapped.valid) {
        setBeds(beds.map(b => b.id === dragging.bedId ? { ...b, x: dragging.originalX, y: dragging.originalY } : b));
      } else {
        setBeds(beds.map(b => b.id === dragging.bedId ? { ...b, x: snapped.x, y: snapped.y } : b));
      }
    }

    if (resizing) {
      const bed = beds.find(b => b.id === resizing.bedId);
      if (bedHasCollision(bed, beds, bed.id, walkwayWidth)) {
        setBeds(beds.map(b => b.id === resizing.bedId ? { ...b, width: resizing.originalW, length: resizing.originalL } : b));
      }
    }

    // Garden object drag/resize complete - no collision detection needed for objects
    if (draggingObject) {
      setDraggingObject(null);
    }

    if (resizingObject) {
      setResizingObject(null);
    }

    setDragging(null);
    setResizing(null);
    setDragPreview(null);
  }, [dragging, resizing, draggingGate, draggingObject, resizingObject, beds, gardenWidth, gardenLength, walkwayWidth, setBeds]);
  
  // Global mouse event listeners
  useEffect(() => {
    if (dragging || resizing || draggingGate || draggingObject || resizingObject) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, resizing, draggingGate, draggingObject, resizingObject, handleMouseMove, handleMouseUp]);
  
  const deleteBed = (id) => setBeds(beds.filter(b => b.id !== id));

  // Rotate a bed by swapping width and length
  const rotateBed = (bedId) => {
    setBeds(beds.map(b => {
      if (b.id !== bedId) return b;
      const rotated = { ...b, width: b.length, length: b.width };
      // Check if rotated bed fits within bounds
      if (rotated.x + rotated.width > gardenWidth) {
        rotated.x = Math.max(0, gardenWidth - rotated.width);
      }
      if (rotated.y + rotated.length > gardenLength) {
        rotated.y = Math.max(0, gardenLength - rotated.length);
      }
      return rotated;
    }));
  };

  const deleteGardenObject = (id, isOffGarden = false) => {
    if (isOffGarden) {
      setOffGardenObjects(offGardenObjects.filter(o => o.id !== id));
    } else {
      setGardenObjects(gardenObjects.filter(o => o.id !== id));
    }
  };

  const gateStyle = getGateStyle();

  // Helper function to render a garden object
  const renderGardenObject = (obj, isOffGarden = false) => {
    const objType = GARDEN_OBJECT_TYPES[obj.type];
    if (!objType) return null;

    const isActive = draggingObject?.objectId === obj.id || resizingObject?.objectId === obj.id;
    const plantCount = objType.canHoldPlants ? (obj.plants?.length || 0) : 0;

    return (
      <div
        key={obj.id}
        className={`absolute border-2 border-dashed rounded cursor-move group shadow-md transition-shadow ${objType.color} ${
          isActive ? 'ring-2 ring-blue-400' : ''
        }`}
        style={{
          left: obj.x * scale,
          top: obj.y * scale,
          width: obj.width * scale,
          height: obj.length * scale,
        }}
        onMouseDown={(e) => handleObjectMouseDown(e, obj.id, 'move', isOffGarden)}
      >
        {/* Object content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-xs font-medium text-gray-700 pointer-events-none p-1">
          <span className="text-lg">{objType.icon}</span>
          <span className="truncate max-w-full">{obj.name}</span>
          <span className="text-gray-500">{obj.width}x{obj.length}</span>
          {plantCount > 0 && (
            <span className="text-green-700 flex items-center gap-0.5">
              <Leaf className="w-3 h-3" /> {plantCount}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEditGardenObject?.(obj); }}
            className="w-5 h-5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
          >
            E
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); deleteGardenObject(obj.id, isOffGarden); }}
            className="w-5 h-5 bg-red-500 text-white rounded text-xs hover:bg-red-600"
          >
            x
          </button>
        </div>

        {/* Resize handle */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 flex items-center justify-center"
          onMouseDown={(e) => handleObjectMouseDown(e, obj.id, 'resize', isOffGarden)}
        >
          <Maximize2 className="w-3 h-3 text-gray-600" />
        </div>
      </div>
    );
  };

  // Calculate off-garden area dimensions
  const offGardenWidth = canvasW;
  const offGardenHeight = 120; // Fixed height for off-garden area
  
  return (
    <div className="relative">
      {/* Compass labels */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-500">
        {orientation === 'N' ? '↑ North' : orientation === 'S' ? '☀️ South' : orientation === 'E' ? '← West' : '→ East'}
      </div>
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-500">
        {orientation === 'S' ? '↓ North' : orientation === 'N' ? '☀️ South' : orientation === 'W' ? '← West' : '→ East'}
      </div>
      <div className="absolute top-1/2 -left-6 -translate-y-1/2 text-xs font-medium text-gray-500 -rotate-90">
        {orientation === 'W' ? '↑ North' : orientation === 'E' ? '↓ South' : orientation === 'N' ? '← West' : '→ East'}
      </div>
      <div className="absolute top-1/2 -right-6 -translate-y-1/2 text-xs font-medium text-gray-500 rotate-90">
        {orientation === 'E' ? '↑ North' : orientation === 'W' ? '↓ South' : orientation === 'N' ? '→ East' : '← West'}
      </div>
      
      {/* Garden canvas */}
      <div
        ref={canvasRef}
        className={`relative overflow-hidden rounded-lg bg-green-100 transition-all ${
          isFenced ? 'border-4 border-amber-800 cursor-default' : 'border-2 border-green-600 border-dashed cursor-pointer hover:border-amber-600'
        }`}
        style={{ 
          width: canvasW, 
          height: canvasH, 
          backgroundImage: 'linear-gradient(rgba(34,197,94,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.2) 1px, transparent 1px)', 
          backgroundSize: `${scale}px ${scale}px` 
        }}
        onClick={handleFenceClick}
        title={!isFenced ? 'Click to add fence' : undefined}
      >
        {/* Gate (draggable) */}
        {isFenced && gateStyle && (
          <div 
            style={gateStyle}
            onMouseDown={handleGateMouseDown}
            className={`${draggingGate ? 'cursor-grabbing ring-2 ring-yellow-400' : 'hover:ring-2 hover:ring-yellow-300'}`}
            title="Drag to move gate"
          >
            <span className="text-amber-100 text-xs">⊞</span>
          </div>
        )}
        
        {/* Fence toggle hint */}
        {!isFenced && beds.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm pointer-events-none">
            Click border to add fence
          </div>
        )}
        
        {/* Beds */}
        {beds.map(bed => {
          const bedType = BED_TYPES[bed.type];
          const validation = validateBedPosition(bed, beds, gardenWidth, gardenLength, bed.id);
          const hasError = !validation.valid;
          const isActive = dragging?.bedId === bed.id || resizing?.bedId === bed.id;
          const hasTrellis = bed.trellis;
          
          return (
            <div 
              key={bed.id} 
              className={`absolute border-2 rounded cursor-move group shadow-md transition-shadow ${
                hasError ? 'border-red-500 bg-red-100' : bedType.color
              } ${isActive && dragPreview && !dragPreview.valid ? 'ring-2 ring-red-500' : ''}`}
              style={{ 
                left: bed.x * scale, 
                top: bed.y * scale, 
                width: bed.width * scale, 
                height: bed.length * scale 
              }}
              onMouseDown={(e) => handleBedMouseDown(e, bed.id, 'move')}
            >
              {/* Trellis indicator - positioned based on relative side */}
              {hasTrellis && (() => {
                const trellisPos = getTrellisSidePosition(bed, bed.trellisSide);
                const positionClass =
                  trellisPos.side === 'top' ? '-top-3 left-1/2 -translate-x-1/2' :
                  trellisPos.side === 'bottom' ? '-bottom-3 left-1/2 -translate-x-1/2' :
                  trellisPos.side === 'right' ? 'top-1/2 -right-3 -translate-y-1/2' :
                  trellisPos.side === 'left' ? 'top-1/2 -left-3 -translate-y-1/2' :
                  '-top-3 left-1/2 -translate-x-1/2';
                const isVertical = trellisPos.side === 'left' || trellisPos.side === 'right';
                const sideLabel = trellisPos.side.charAt(0).toUpperCase() + trellisPos.side.slice(1);

                return (
                  <div
                    className={`absolute bg-green-700 text-white text-xs px-1 rounded flex items-center justify-center ${positionClass}`}
                    style={{
                      minWidth: isVertical ? 'auto' : Math.min(bed.width * scale * 0.8, 40),
                      minHeight: isVertical ? Math.min(bed.length * scale * 0.8, 40) : 'auto',
                    }}
                    title={`${TRELLIS_TYPES[bed.trellis]?.name} (${sideLabel} side - ${bed.trellisSide})`}
                  >
                    {TRELLIS_TYPES[bed.trellis]?.icon || '📐'}
                  </div>
                );
              })()}
              
              {/* Bed content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-xs font-medium text-gray-700 pointer-events-none p-1">
                <span className="truncate max-w-full">{bed.name}</span>
                <span className="text-gray-500">{bed.width}×{bed.length}</span>
                {bed.plants?.length > 0 && <span className="text-green-700">{bed.plants.length} 🌱</span>}
              </div>
              
              {/* Action buttons */}
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); rotateBed(bed.id); }}
                  className="w-5 h-5 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 flex items-center justify-center"
                  title="Rotate bed"
                >
                  <RotateCw className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onEditBed(bed); }}
                  className="w-5 h-5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                  title="Edit bed"
                >✎</button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteBed(bed.id); }}
                  className="w-5 h-5 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                  title="Delete bed"
                >×</button>
              </div>
              
              {/* Resize handle */}
              <div 
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 flex items-center justify-center" 
                onMouseDown={(e) => handleBedMouseDown(e, bed.id, 'resize')}
              >
                <Maximize2 className="w-3 h-3 text-gray-600" />
              </div>
            </div>
          );
        })}
        
        {/* Standalone trellises */}
        {trellises?.map(trellis => {
          const trellisType = TRELLIS_TYPES[trellis.type];
          if (trellisType?.type !== 'connector') return null;

          return (
            <div
              key={trellis.id}
              className="absolute bg-green-700 rounded opacity-75"
              style={{
                left: trellis.x * scale,
                top: trellis.y * scale,
                width: trellis.width * scale,
                height: trellis.length * scale,
              }}
              title={trellisType.name}
            >
              <span className="text-white text-xs">{trellisType.icon}</span>
            </div>
          );
        })}

        {/* Garden Objects (inside the garden) */}
        {gardenObjects?.map(obj => renderGardenObject(obj, false))}

        {/* Empty state */}
        {beds.length === 0 && gardenObjects.length === 0 && isFenced && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm pointer-events-none">
            Add beds or objects
          </div>
        )}
      </div>
      
      {/* Dimensions */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        {gardenWidth}ft x {gardenLength}ft
        {isFenced && <span className="ml-2 text-amber-700">Fenced ({gateWidth}ft gate)</span>}
      </div>

      {/* Off-Garden Area */}
      {(offGardenObjects.length > 0 || gardenObjects.length > 0) && (
        <div className="mt-4">
          <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <span className="font-medium">Off-Garden Area</span>
            <span className="text-gray-400">(greenhouses, storage outside main plot)</span>
          </div>
          <div
            ref={offGardenRef}
            className="relative rounded-lg bg-gray-100 border-2 border-dashed border-gray-300"
            style={{
              width: offGardenWidth,
              minHeight: offGardenHeight,
              backgroundImage: 'linear-gradient(rgba(156,163,175,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(156,163,175,0.2) 1px, transparent 1px)',
              backgroundSize: `${scale}px ${scale}px`,
            }}
          >
            {/* Off-garden objects */}
            {offGardenObjects?.map(obj => renderGardenObject(obj, true))}

            {/* Empty state */}
            {offGardenObjects.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm pointer-events-none">
                Drag objects here or add new ones
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
