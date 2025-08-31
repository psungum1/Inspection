import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Clock, Play, Pause } from 'lucide-react';
import { InspectionSchedule, QualityParameter } from '../../types';

interface ScheduleSettingsProps {
  schedules: InspectionSchedule[];
  parameters: QualityParameter[];
  onChange: () => void;
}

const ScheduleSettings: React.FC<ScheduleSettingsProps> = ({ schedules, parameters, onChange }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<InspectionSchedule | null>(null);

  // Mock schedules for demonstration
  const mockSchedules: InspectionSchedule[] = [
    {
      id: '1',
      name: 'Hourly Quality Check',
      frequency: 'hourly',
      parameters: ['moisture', 'ph'],
      active: true
    },
    {
      id: '2',
      name: 'End of Batch Inspection',
      frequency: 'per_batch',
      parameters: ['moisture', 'ph', 'viscosity', 'whiteness', 'protein'],
      active: true
    },
    {
      id: '3',
      name: 'Daily Comprehensive Test',
      frequency: 'daily',
      parameters: ['viscosity', 'whiteness', 'protein'],
      active: false
    }
  ];

  const displaySchedules = schedules.length > 0 ? schedules : mockSchedules;

  const toggleSchedule = (id: string) => {
    console.log('Toggling schedule:', id);
    onChange();
  };

  const deleteSchedule = (id: string) => {
    console.log('Deleting schedule:', id);
    onChange();
  };

  const getFrequencyDisplay = (frequency: string) => {
    switch (frequency) {
      case 'hourly':
        return 'Every Hour';
      case 'per_batch':
        return 'Per Batch';
      case 'daily':
        return 'Daily';
      default:
        return frequency;
    }
  };

  const getParameterNames = (parameterIds: string[]) => {
    return parameterIds
      .map(id => parameters.find(p => p.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Inspection Schedules
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure automated inspection schedules for different quality parameters and frequencies.
        </p>
      </div>

      <div className="space-y-4">
        {displaySchedules.map((schedule) => (
          <div key={schedule.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="text-base font-medium text-gray-900">
                    {schedule.name}
                  </h4>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    schedule.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {schedule.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Frequency: {getFrequencyDisplay(schedule.frequency)}</span>
                  </div>
                  <div>
                    <span className="font-medium">Parameters: </span>
                    {getParameterNames(schedule.parameters)}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => toggleSchedule(schedule.id)}
                  className={`p-2 rounded transition-colors ${
                    schedule.active
                      ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
                      : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                  }`}
                  title={schedule.active ? 'Pause Schedule' : 'Activate Schedule'}
                >
                  {schedule.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setEditingSchedule(schedule)}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                  title="Edit Schedule"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteSchedule(schedule.id)}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                  title="Delete Schedule"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowAddForm(true)}
        className="flex items-center space-x-2 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
      >
        <Plus className="h-4 w-4" />
        <span>Add New Schedule</span>
      </button>

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingSchedule) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
            </h3>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Name
                </label>
                <input
                  type="text"
                  defaultValue={editingSchedule?.name || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter schedule name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  defaultValue={editingSchedule?.frequency || 'hourly'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="hourly">Hourly</option>
                  <option value="per_batch">Per Batch</option>
                  <option value="daily">Daily</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality Parameters
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {parameters.map((param) => (
                    <label key={param.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        defaultChecked={editingSchedule?.parameters.includes(param.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{param.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingSchedule(null);
                  }}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowAddForm(false);
                    setEditingSchedule(null);
                    onChange();
                  }}
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  {editingSchedule ? 'Update' : 'Create'} Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleSettings;