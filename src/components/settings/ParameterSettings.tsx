import React, { useState } from 'react';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { QualityParameter } from '../../types';

interface ParameterSettingsProps {
  parameters: QualityParameter[];
  onChange: () => void;
}

const ParameterSettings: React.FC<ParameterSettingsProps> = ({ parameters, onChange }) => {
  const [editingParameter, setEditingParameter] = useState<QualityParameter | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleEdit = (parameter: QualityParameter) => {
    setEditingParameter(parameter);
  };

  const handleSave = () => {
    setEditingParameter(null);
    onChange();
  };

  const handleCancel = () => {
    setEditingParameter(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quality Parameters Configuration
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure acceptable ranges, warning thresholds, and critical limits for each quality parameter.
        </p>
      </div>

      <div className="space-y-4">
        {parameters.map((parameter) => (
          <div key={parameter.id} className="border border-gray-200 rounded-lg p-4">
            {editingParameter?.id === parameter.id ? (
              <ParameterEditForm
                parameter={editingParameter}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-base font-medium text-gray-900 mb-2">
                    {parameter.name} ({parameter.unit})
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="p-2 bg-green-50 rounded border border-green-200">
                      <span className="text-green-700 font-medium">Acceptable:</span>
                      <br />
                      {parameter.acceptable.min} - {parameter.acceptable.max} {parameter.unit}
                    </div>
                    <div className="p-2 bg-amber-50 rounded border border-amber-200">
                      <span className="text-amber-700 font-medium">Warning:</span>
                      <br />
                      {parameter.warning.min} - {parameter.warning.max} {parameter.unit}
                    </div>
                    <div className="p-2 bg-red-50 rounded border border-red-200">
                      <span className="text-red-700 font-medium">Critical:</span>
                      <br />
                      {parameter.critical.min} - {parameter.critical.max} {parameter.unit}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(parameter)}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowAddForm(true)}
        className="flex items-center space-x-2 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
      >
        <Plus className="h-4 w-4" />
        <span>Add New Parameter</span>
      </button>
    </div>
  );
};

interface ParameterEditFormProps {
  parameter: QualityParameter;
  onSave: () => void;
  onCancel: () => void;
}

const ParameterEditForm: React.FC<ParameterEditFormProps> = ({ parameter, onSave, onCancel }) => {
  const [formData, setFormData] = useState(parameter);

  const handleChange = (field: string, subfield: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field as keyof typeof prev],
        [subfield]: parseFloat(value) || 0
      }
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-base font-medium text-gray-900 mb-4">
          Edit {parameter.name}
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-3">
          <h5 className="text-sm font-medium text-green-700">Acceptable Range</h5>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-600">Minimum</label>
              <input
                type="number"
                step="0.01"
                value={formData.acceptable.min}
                onChange={(e) => handleChange('acceptable', 'min', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600">Maximum</label>
              <input
                type="number"
                step="0.01"
                value={formData.acceptable.max}
                onChange={(e) => handleChange('acceptable', 'max', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h5 className="text-sm font-medium text-amber-700">Warning Range</h5>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-600">Minimum</label>
              <input
                type="number"
                step="0.01"
                value={formData.warning.min}
                onChange={(e) => handleChange('warning', 'min', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600">Maximum</label>
              <input
                type="number"
                step="0.01"
                value={formData.warning.max}
                onChange={(e) => handleChange('warning', 'max', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h5 className="text-sm font-medium text-red-700">Critical Range</h5>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-600">Minimum</label>
              <input
                type="number"
                step="0.01"
                value={formData.critical.min}
                onChange={(e) => handleChange('critical', 'min', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600">Maximum</label>
              <input
                type="number"
                step="0.01"
                value={formData.critical.max}
                onChange={(e) => handleChange('critical', 'max', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default ParameterSettings;