# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rooty is a React-based interactive garden planner application. Users can design garden layouts with beds, plants, trellises, and fences, with automatic persistence to localStorage.

## Architecture

```
index.jsx                 - Main GardenPlanner component, state management
/components
  GardenCanvas.jsx        - Interactive canvas for drag-and-drop bed/object placement
  BedEditor.jsx           - Modal for editing bed details and plants
  GardenObjectEditor.jsx  - Modal for editing garden objects (greenhouses, etc.)
  MagicLayoutModal.jsx    - AI-powered layout suggestions
  ValidationSummary.jsx   - Display validation warnings
  CalendarView.jsx        - Planting calendar by zone with greenhouse reminders
/data
  constants.js            - Bed types, trellis types, walkway/gate widths
  gardenObjects.js        - Garden object types (greenhouse, fertilizer pile, etc.)
  plants.js               - Plant database (VEGETABLES, COMPANIONS, ALL_PLANTS)
  zones.js                - USDA hardiness zones with frost dates
/hooks
  useDebounce.js          - Debounce hook for dimension inputs
  useAutoSave.js          - Auto-save with timestamp tracking
/utils
  helpers.js              - ID generation, date formatting, perimeter math
  storage.js              - localStorage load/save with versioning and migration
  validation.js           - Bed collision and boundary validation
```

## Key Concepts

- **Beds**: Garden beds with type (raised/inground/planter/container), dimensions, position, and attached plants
- **Garden Objects**: Structures like greenhouses and fertilizer piles, placed in garden or off-garden area
- **Walkways**: Configurable spacing between beds (2-4ft), validated during placement
- **Trellises**: Attachment type (on beds) or connector type (between beds)
- **Fences/Gates**: Perimeter fencing with draggable gate, position stored as 0-1 value along perimeter
- **Zones**: USDA hardiness zones determining frost dates and planting schedules
- **Off-Garden Area**: Secondary canvas area for structures placed outside the main garden plot

## State Persistence

Data auto-saves to localStorage under key `garden-planner-data` with version tracking (`STORAGE_VERSION = 4`). Includes garden dimensions, orientation, beds array, plant list, fence/gate settings, garden objects, and off-garden objects. Migration logic in storage.js handles upgrading from v3 to v4.

## Canvas Interactions

- Click border to add fence
- Drag beds to reposition (snaps to 0.5ft grid)
- Drag bed corners to resize
- Drag gate along fence perimeter
- Collision detection prevents overlapping beds
