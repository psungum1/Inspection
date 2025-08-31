import React, { useState } from 'react';
import { Plus, Save, Upload, Camera } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateBatchId, validateTestResult } from '../../utils/validation';
import { BatchData, TestResult } from '../../types';
import BatchForm from './BatchForm';
import TestResultForm from './TestResultForm';

const DataEntry: React.FC = () => {
  const { state, dispatch } = useApp();
  const { parameters, user } = state;
  const [currentBatch, setCurrentBatch] = useState<BatchData | null>(null);
  const [activeTab, setActiveTab] = useState<'batch' | 'results'>('batch');

  const handleCreateBatch = (batchData: Omit<BatchData, 'id' | 'createdAt' | 'updatedAt' | 'testResults' | 'status'>) => {
    const newBatch: BatchData = {
      ...batchData,
      id: generateBatchId(),
      status: 'in_progress',
      testResults: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setCurrentBatch(newBatch);
    setActiveTab('results');
    dispatch({ type: 'ADD_BATCH', payload: newBatch });
  };

  const handleAddTestResult = (result: Omit<TestResult, 'timestamp' | 'operatorId' | 'status'>) => {
    if (!currentBatch || !user) return;

    const parameter = parameters.find(p => p.id === result.parameterId);
    if (!parameter) return;

    const status = validateTestResult(result.value, parameter);
    
    const newResult: TestResult = {
      ...result,
      status,
      timestamp: new Date().toISOString(),
      operatorId: user.id
    };

    const updatedBatch: BatchData = {
      ...currentBatch,
      testResults: [...currentBatch.testResults, newResult],
      updatedAt: new Date().toISOString()
    };

    setCurrentBatch(updatedBatch);
    dispatch({ type: 'UPDATE_BATCH', payload: updatedBatch });
  };

  const handleCompleteBatch = () => {
    if (!currentBatch) return;

    const updatedBatch: BatchData = {
      ...currentBatch,
      status: 'completed',
      updatedAt: new Date().toISOString()
    };

    dispatch({ type: 'UPDATE_BATCH', payload: updatedBatch });
    setCurrentBatch(null);
    setActiveTab('batch');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Data Entry & Inspection
        </h2>
        <p className="text-gray-600">
          Record batch information and quality control test results
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('batch')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'batch'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Batch Information
            </button>
            <button
              onClick={() => setActiveTab('results')}
              disabled={!currentBatch}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'results' && currentBatch
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-400 cursor-not-allowed'
              }`}
            >
              Test Results
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'batch' && (
            <BatchForm 
              onSubmit={handleCreateBatch}
              disabled={!!currentBatch}
              currentBatch={currentBatch}
            />
          )}

          {activeTab === 'results' && currentBatch && (
            <TestResultForm
              batch={currentBatch}
              parameters={parameters}
              onAddResult={handleAddTestResult}
              onComplete={handleCompleteBatch}
            />
          )}
        </div>
      </div>

      {/* Current Batch Status */}
      {currentBatch && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                Current Batch: {currentBatch.id}
              </h3>
              <p className="text-blue-700">
                Line {currentBatch.productionLine} • {currentBatch.rawMaterialSource}
              </p>
              <p className="text-sm text-blue-600">
                {currentBatch.testResults.length} of {parameters.length} tests completed
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                currentBatch.status === 'in_progress'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {currentBatch.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Camera className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Quick Scan</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Use barcode scanner to quickly identify batch or equipment
          </p>
          <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            Open Scanner
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Import Data</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Import test results from laboratory equipment
          </p>
          <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Import CSV
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Save className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Templates</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Use pre-configured test templates for faster data entry
          </p>
          <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
            Load Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataEntry;