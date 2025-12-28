import React from 'react';
import { Calendar, Sprout, Sun, Snowflake, Home } from 'lucide-react';
import { ALL_PLANTS } from '../data/plants.js';
import { GARDEN_OBJECT_TYPES } from '../data/gardenObjects.js';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function CalendarView({ gardenPlan, zone, gardenObjects = [], offGardenObjects = [] }) {
  if (!zone) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
        Select a zone to view planting calendar
      </div>
    );
  }

  const lastFrostMonth = zone.lastFrost.month - 1; // 0-indexed
  const firstFrostMonth = zone.firstFrost.month - 1;

  // Calculate planting windows for each plant
  const plantSchedules = gardenPlan.map((key) => {
    const plant = ALL_PLANTS[key];
    if (!plant) return null;

    const schedule = {
      key,
      name: plant.name,
      emoji: plant.emoji,
      activities: [],
    };

    // Indoor start
    if (plant.startIndoors) {
      const startMonth = (lastFrostMonth + Math.floor(plant.startIndoors / 4) + 12) % 12;
      schedule.activities.push({
        type: 'indoor',
        month: startMonth,
        label: 'Start indoors',
      });
    }

    // Direct sow or transplant
    if (plant.directSow !== undefined) {
      const sowMonth = (lastFrostMonth + Math.floor(plant.directSow / 4) + 12) % 12;
      schedule.activities.push({
        type: 'sow',
        month: sowMonth,
        label: 'Direct sow',
      });
    } else if (plant.transplant !== undefined) {
      const transplantMonth = (lastFrostMonth + Math.floor(plant.transplant / 4) + 12) % 12;
      schedule.activities.push({
        type: 'transplant',
        month: transplantMonth,
        label: 'Transplant',
      });
    }

    // Harvest (approximate)
    if (plant.harvest) {
      const harvestStart = plant.transplant || plant.directSow || 0;
      const harvestMonth = (lastFrostMonth + Math.floor((harvestStart + plant.harvest) / 4) + 12) % 12;
      schedule.activities.push({
        type: 'harvest',
        month: harvestMonth,
        label: 'Harvest',
      });
    }

    return schedule;
  }).filter(Boolean);

  // Check for greenhouses to generate greenhouse-specific reminders
  const allObjects = [...gardenObjects, ...offGardenObjects];
  const greenhouses = allObjects.filter(obj => obj.type === 'greenhouse');
  const hasGreenhouse = greenhouses.length > 0;

  // Calculate greenhouse-related months based on frost dates
  // Move tender plants to greenhouse: 2 weeks before first frost
  const moveInMonth = (firstFrostMonth - 1 + 12) % 12; // About 2-4 weeks before first frost
  // Start hardening off: 2 weeks before last frost
  const hardenOffMonth = (lastFrostMonth - 1 + 12) % 12;
  // Move plants outside: after last frost
  const moveOutMonth = lastFrostMonth;

  // Build greenhouse reminders
  const greenhouseReminders = hasGreenhouse ? [
    {
      type: 'greenhouse_move_in',
      month: moveInMonth,
      label: 'Move tender plants to greenhouse',
      description: '2-4 weeks before first frost',
    },
    {
      type: 'greenhouse_harden',
      month: hardenOffMonth,
      label: 'Start hardening off greenhouse plants',
      description: '2 weeks before last frost',
    },
    {
      type: 'greenhouse_move_out',
      month: moveOutMonth,
      label: 'Move plants outside (after last frost)',
      description: 'After last frost date',
    },
  ] : [];

  // Count overwintering plants in greenhouses
  const overwinteringPlants = greenhouses.reduce((acc, gh) => {
    return acc + (gh.plants?.filter(p => p.isOverwintering)?.length || 0);
  }, 0);

  const getActivityColor = (type) => {
    switch (type) {
      case 'indoor': return 'bg-purple-200 text-purple-800';
      case 'sow': return 'bg-green-200 text-green-800';
      case 'transplant': return 'bg-blue-200 text-blue-800';
      case 'harvest': return 'bg-amber-200 text-amber-800';
      case 'greenhouse_move_in': return 'bg-emerald-200 text-emerald-800';
      case 'greenhouse_harden': return 'bg-teal-200 text-teal-800';
      case 'greenhouse_move_out': return 'bg-cyan-200 text-cyan-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5" /> Planting Calendar
      </h2>

      {/* Frost dates indicator */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1 text-blue-600">
          <Snowflake className="w-4 h-4" />
          <span>Last Frost: {MONTHS[lastFrostMonth]} {zone.lastFrost.day}</span>
        </div>
        <div className="flex items-center gap-1 text-orange-600">
          <Sun className="w-4 h-4" />
          <span>First Frost: {MONTHS[firstFrostMonth]} {zone.firstFrost.day}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        <span className="px-2 py-1 rounded bg-purple-200 text-purple-800">Start Indoors</span>
        <span className="px-2 py-1 rounded bg-green-200 text-green-800">Direct Sow</span>
        <span className="px-2 py-1 rounded bg-blue-200 text-blue-800">Transplant</span>
        <span className="px-2 py-1 rounded bg-amber-200 text-amber-800">Harvest</span>
        {hasGreenhouse && (
          <>
            <span className="px-2 py-1 rounded bg-emerald-200 text-emerald-800">Move In</span>
            <span className="px-2 py-1 rounded bg-teal-200 text-teal-800">Harden Off</span>
            <span className="px-2 py-1 rounded bg-cyan-200 text-cyan-800">Move Out</span>
          </>
        )}
      </div>

      {/* Greenhouse Reminders Section */}
      {hasGreenhouse && (
        <div className="mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <h3 className="font-medium text-emerald-800 mb-2 flex items-center gap-2">
            <Home className="w-4 h-4" /> Greenhouse Activities
            {overwinteringPlants > 0 && (
              <span className="text-xs bg-emerald-200 px-2 py-0.5 rounded-full">
                {overwinteringPlants} overwintering
              </span>
            )}
          </h3>
          <div className="space-y-1 text-sm">
            {greenhouseReminders.map((reminder, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className={`inline-block w-3 h-3 rounded-full ${getActivityColor(reminder.type)}`} />
                <span className="font-medium">{MONTHS[reminder.month]}:</span>
                <span className="text-gray-700">{reminder.label}</span>
              </div>
            ))}
          </div>
          {greenhouses.length > 0 && (
            <div className="mt-2 text-xs text-emerald-600">
              You have {greenhouses.length} greenhouse{greenhouses.length > 1 ? 's' : ''} in your garden
            </div>
          )}
        </div>
      )}

      {gardenPlan.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <Sprout className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Add plants to your garden plan to see the planting calendar</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-1 font-medium text-gray-600">Plant</th>
                {MONTHS.map((month, i) => (
                  <th
                    key={month}
                    className={`text-center py-2 px-1 font-medium text-gray-600 ${
                      i === lastFrostMonth ? 'bg-blue-50' : ''
                    } ${i === firstFrostMonth ? 'bg-orange-50' : ''}`}
                  >
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plantSchedules.map((schedule) => (
                <tr key={schedule.key} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-1 whitespace-nowrap">
                    <span className="mr-1">{schedule.emoji}</span>
                    {schedule.name}
                  </td>
                  {MONTHS.map((_, monthIndex) => {
                    const activity = schedule.activities.find((a) => a.month === monthIndex);
                    return (
                      <td
                        key={monthIndex}
                        className={`text-center py-2 px-1 ${
                          monthIndex === lastFrostMonth ? 'bg-blue-50' : ''
                        } ${monthIndex === firstFrostMonth ? 'bg-orange-50' : ''}`}
                      >
                        {activity && (
                          <span
                            className={`inline-block w-4 h-4 rounded-full ${getActivityColor(activity.type)}`}
                            title={activity.label}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
