import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { validateBedPosition } from '../utils/validation.js';

export function ValidationSummary({ beds, gardenWidth, gardenLength, walkwayWidth }) {
  const issues = [];

  beds.forEach((bed) => {
    const validation = validateBedPosition(
      bed,
      beds,
      gardenWidth,
      gardenLength,
      bed.id,
      walkwayWidth
    );

    if (!validation.valid) {
      validation.errors.forEach((error) => {
        issues.push({
          bedName: bed.name,
          message: error,
        });
      });
    }
  });

  if (issues.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-3">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">All beds valid</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-3">
      <h2 className="font-semibold text-gray-800 mb-2 text-sm flex items-center gap-1">
        <AlertTriangle className="w-4 h-4 text-amber-500" /> Issues ({issues.length})
      </h2>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {issues.map((issue, i) => (
          <div
            key={i}
            className="text-xs bg-amber-50 text-amber-800 rounded px-2 py-1"
          >
            <span className="font-medium">{issue.bedName}:</span> {issue.message}
          </div>
        ))}
      </div>
    </div>
  );
}
