# Rooty - Interactive Garden Planner

A React-based visual garden planning application that helps you design garden layouts, manage beds and plants, and plan your growing season based on your USDA hardiness zone.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173` (or the next available port).

## Key Features

- **Visual Garden Canvas**: Drag-and-drop interface for placing and resizing garden beds
- **Multiple Bed Types**: Support for raised beds, in-ground beds, planters, and containers
- **USDA Zone Integration**: Select your hardiness zone (3a-10b) for accurate frost date calculations
- **Planting Calendar**: Automatically generates planting schedules based on your zone and selected plants
- **Trellis Support**: Attach trellises to beds for climbing plants
- **Fence and Gate Planning**: Add perimeter fencing with draggable gate positioning
- **Collision Detection**: Validates bed placement with configurable walkway widths
- **Magic Layout**: AI-assisted layout optimization for spacing and sun exposure
- **Auto-Save**: All changes automatically persist to localStorage

## Usage

1. **Set Your Zone**: Select your USDA hardiness zone from the dropdown to get accurate frost dates
2. **Configure Garden Size**: Set your garden dimensions (width and length in feet)
3. **Add Beds**: Create garden beds with custom dimensions and optional trellis attachments
4. **Add Plants**: Build your plant list from 20+ vegetables and 10+ companion plants
5. **Arrange Layout**: Drag beds on the canvas to position them; use the Magic Layout for suggestions
6. **View Calendar**: Switch to the Calendar tab to see your zone-specific planting schedule

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Lucide React (icons)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## Project Structure

```
rooty/
  index.jsx           # Main GardenPlanner component
  components/         # React UI components
  data/               # Constants, plant database, zone data
  hooks/              # Custom React hooks
  utils/              # Helper functions and utilities
```

For detailed technical documentation, see [summary.md](./summary.md).

## License

MIT
