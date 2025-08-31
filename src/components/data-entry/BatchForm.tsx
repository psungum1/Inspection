import React, { useState } from 'react';
import { BatchData } from '../../types';

interface BatchFormProps {
  onSubmit: (batch: Omit<BatchData, 'id' | 'createdAt' | 'updatedAt' | 'testResults' | 'status'>) => void;
  disabled: boolean;
  currentBatch: BatchData | null;
}

const BatchForm: React.FC<BatchFormProps> = ({ onSubmit, disabled, currentBatch }) => {
  const [formData, setFormData] = useState({
    productionLine: 1,
    rawMaterialSource: '',
    productionDate: new Date().toISOString().slice(0, 16),
    operatorId: 'OP001'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'productionLine' ? parseInt(value) : value
    }));
  };

  if (currentBatch) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Batch Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Batch ID
            </label>
            <p className="text-sm text-gray-900 font-mono bg-white px-3 py-2 rounded-md border">
              {currentBatch.id}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Production Line
            </label>
            <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border">
              Line {currentBatch.productionLine}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Raw Material Source
            </label>
            <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border">
              {currentBatch.rawMaterialSource}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Production Date
            </label>
            <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded-md border">
              {new Date(currentBatch.productionDate).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="productionLine" className="block text-sm font-medium text-gray-700 mb-2">
            Production Line *
          </label>
          <select
            id="productionLine"
            name="productionLine"
            value={formData.productionLine}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={1}>Line 1</option>
            <option value={2}>Line 2</option>
            <option value={3}>Line 3</option>
          </select>
        </div>

        <div>
          <label htmlFor="rawMaterialSource" className="block text-sm font-medium text-gray-700 mb-2">
            Raw Material Source *
          </label>
          <select
            id="rawMaterialSource"
            name="rawMaterialSource"
            value={formData.rawMaterialSource}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Source</option>
            <option value="Supplier A">Supplier A - Farm Cooperative</option>
            <option value="Supplier B">Supplier B - Regional Processing</option>
            <option value="Supplier C">Supplier C - Local Farms</option>
            <option value="Internal">Internal Production</option>
          </select>
        </div>

        <div>
          <label htmlFor="productionDate" className="block text-sm font-medium text-gray-700 mb-2">
            Production Date & Time *
          </label>
          <input
            type="datetime-local"
            id="productionDate"
            name="productionDate"
            value={formData.productionDate}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="operatorId" className="block text-sm font-medium text-gray-700 mb-2">
            Operator ID *
          </label>
          <select
            id="operatorId"
            name="operatorId"
            value={formData.operatorId}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="OP001">OP001 - Maria Rodriguez</option>
            <option value="OP002">OP002 - Chen Wei</option>
            <option value="OP003">OP003 - James Wilson</option>
            <option value="OP004">OP004 - Ana Silva</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={disabled}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            disabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Create Batch & Continue
        </button>
      </div>
    </form>
  );
};

export default BatchForm;