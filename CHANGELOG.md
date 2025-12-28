# Changelog

All notable changes to the Rooty Garden Planner will be documented in this file.

## [Unreleased]

### Fixed
- Fix Magic Layout feature generating overlapping beds by implementing collision detection
  - Beds are now placed one at a time with `bedHasCollision()` check before finalizing position
  - Uses `findValidPosition()` to find valid placement when collision detected
- Fix Magic Layout not pairing beds with connector trellises (tunnel, arbor, cattle_panel)
  - Beds with connector-type trellises are now processed first
  - Paired beds are automatically created and positioned 3ft away on the trellis side
  - Paired beds have their trellis set to face the original bed (opposite side)
  - User notification added when paired beds are created

### Added
- Bed rotation feature allowing users to quickly swap width and length dimensions
  - Rotate button in BedEditor modal with keyboard shortcut hint
  - Rotate button on canvas beds (visible on hover) for quick rotation
  - Automatic position adjustment when rotation would push bed outside garden bounds
- Relative trellis positioning system based on bed shape (long/short sides)
  - `TRELLIS_SIDES` constant updated to use relative positions: long1, long2, short1, short2
  - `TRELLIS_SIDES_SQUARE` constant for square beds with side1, side2, side3, side4 options
  - Dynamic trellis side selector that adapts to bed dimensions
- `getTrellisSidePosition()` helper function to convert relative sides to actual canvas positions
- `getTrellisSidesForBed()` helper function to get appropriate side options based on bed dimensions
- Backward compatibility for legacy cardinal direction trellis sides (N/S/E/W)

### Changed
- Trellis side options now use relative terminology (Long Side 1, Short Side 1, etc.) instead of cardinal directions (North, South, etc.)
- Trellis indicator on canvas now calculates position dynamically based on bed shape and relative side selection
- BedEditor component now includes rotate button and uses relative trellis side selector
- GardenCanvas component includes rotate button on bed hover actions
- Add Bed form in index.jsx uses relative trellis side options with helper text
- Connector trellis validation updated to use relative side system for determining facing trellises

### Previous Changes

#### Garden Objects System
- Garden Objects system for structures beyond beds (greenhouses, fertilizer piles, etc.)
- New data model in `/data/gardenObjects.js` with `GARDEN_OBJECT_TYPES` supporting:
  - Greenhouse: climate-controlled structure for seedlings and overwintering plants
  - Fertilizer Pile: compost and fertilizer storage
  - Extensible design for future objects (coldFrame, shed, rainBarrel, compostBin)
- Off-Garden Area on canvas for placing structures outside the main garden plot
- `GardenObjectEditor` component for editing garden objects with:
  - Plant management for objects that can hold plants (greenhouses)
  - Overwintering status toggle for plants in greenhouses
  - Dimension editing with minimum size validation
- Greenhouse-related calendar reminders in CalendarView:
  - "Move tender plants to greenhouse" reminder before first frost
  - "Start hardening off greenhouse plants" reminder before last frost
  - "Move plants outside" reminder after last frost
  - Overwintering plant count display
- "Add Structure" UI section in sidebar for creating garden objects
- Garden objects list in canvas area showing all structures with edit buttons
- Drag and resize support for garden objects on both main garden and off-garden areas
- Storage migration from v3 to v4 in storage.js to handle existing user data
- Helper functions in gardenObjects.js: `getDefaultDimensions`, `validateObjectDimensions`, `createGardenObject`

### Changed
- Bump `STORAGE_VERSION` from 3 to 4 to support garden objects data structure
- Update storage.js with migration logic for upgrading from v3 to v4
- GardenCanvas now accepts and renders garden objects and off-garden objects
- CalendarView now accepts garden objects props for greenhouse activity reminders
- Clear all data function now also clears garden objects

### Previous Changes

#### Trellis Side Selection
- Trellis side selection feature allowing users to specify which side of a bed (North, South, East, West) a trellis is attached to
- `TRELLIS_SIDES` constant in constants.js for trellis side options
- Trellis side dropdown selector in BedEditor.jsx (appears when trellis is selected)
- Trellis side dropdown selector in Add Bed form in index.jsx (appears when trellis is selected)
- Visual indicator on GardenCanvas showing trellis position on the correct edge of the bed
- `bedsHaveConnectorTrellises()` function in validation.js to detect beds with facing connector trellises
- `getRequiredSpacing()` function in validation.js to calculate appropriate spacing between beds
- Updated bed data model to include `trellisSide` property ('N', 'S', 'E', 'W') when a trellis is attached
- GardenCanvas trellis indicator now positions on the specified side of the bed instead of always on top
- Bed collision detection now accounts for connector trellis spacing - beds with facing connector trellises maintain exactly 3ft spacing for walkway under the trellis arch

### Fixed
- Fix plant beds visually spilling over the bottom border of the garden canvas by adding `overflow-hidden` to the canvas container in GardenCanvas.jsx
