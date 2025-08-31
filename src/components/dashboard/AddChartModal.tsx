import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { TestParameter, TestResult } from '../../types';

interface ChartConfig {
  id: string;
  lineNumber: number;
  parameter: TestParameter;
  testResults: TestResult[];
}

interface AddChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChart: (lineNumber: number, parameter: TestParameter) => void;
  testParameters: TestParameter[];
  activeLines: number[];
  trendResults: TestResult[];
  charts: ChartConfig[];
}

const AddChartModal: React.FC<AddChartModalProps> = ({
  isOpen,
  onClose,
  onAddChart,
  testParameters,
  activeLines,
  trendResults,
  charts
}) => {
  const [selectedLine, setSelectedLine] = useState<number>(activeLines[0] || 1);
  const [selectedParameter, setSelectedParameter] = useState<string>(testParameters[0]?.id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parameter = testParameters.find(p => p.id === selectedParameter);
    if (parameter) {
      onAddChart(selectedLine, parameter);
      onClose();
      // Reset form
      setSelectedLine(activeLines[0] || 1);
      setSelectedParameter(testParameters[0]?.id || '');
    }
  };

  const getAvailableParameters = (lineNumber: number) => {
    // Get parameters that are already being monitored for this line
    const usedParameterIds = new Set(
      charts
        .filter(chart => chart.lineNumber === lineNumber)
        .map(chart => chart.parameter.id)
    );
    
    // Return all parameters that are not already being monitored for this line
    const availableParameters = testParameters.filter(param => !usedParameterIds.has(param.id));
    
    // Debug logging
    console.log('Available parameters for line', lineNumber, ':', availableParameters.map(p => p.name));
    console.log('Used parameters for line', lineNumber, ':', Array.from(usedParameterIds));
    console.log('All test parameters:', testParameters.map(p => p.name));
    
    return availableParameters;
  };

  // Auto-select first available parameter when line changes
  useEffect(() => {
    const availableParameters = getAvailableParameters(selectedLine);
    if (availableParameters.length > 0) {
      setSelectedParameter(availableParameters[0].id);
    } else {
      setSelectedParameter('');
    }
  }, [selectedLine, charts, testParameters]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Add New Chart
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Line Selection */}
          <div>
            <label htmlFor="line-select" className="block text-sm font-medium text-gray-700 mb-2">
              Production Line
            </label>
            <select
              id="line-select"
              value={selectedLine}
              onChange={(e) => {
                setSelectedLine(parseInt(e.target.value));
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {activeLines.map(lineNumber => {
                const usedParameters = charts
                  .filter(chart => chart.lineNumber === lineNumber)
                  .map(chart => chart.parameter.name);
                const availableCount = getAvailableParameters(lineNumber).length;
                
                return (
                  <option key={lineNumber} value={lineNumber}>
                    Line {lineNumber} 
                    {usedParameters.length > 0 && ` (${usedParameters.length} monitored, ${availableCount} available)`}
                    {usedParameters.length === 0 && ` (${availableCount} available)`}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Parameter Selection */}
          <div>
            <label htmlFor="parameter-select" className="block text-sm font-medium text-gray-700 mb-2">
              Test Parameter
            </label>
            <select
              id="parameter-select"
              value={selectedParameter}
              onChange={(e) => setSelectedParameter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a parameter</option>
              {getAvailableParameters(selectedLine).map(parameter => (
                <option key={parameter.id} value={parameter.id}>
                  {parameter.name} ({parameter.unit})
                </option>
              ))}
            </select>
            {getAvailableParameters(selectedLine).length > 0 && (
              <p className="text-sm text-green-600 mt-1">
                {getAvailableParameters(selectedLine).length} parameter(s) available for Line {selectedLine}
              </p>
            )}
            {getAvailableParameters(selectedLine).length === 0 && (
              <p className="text-sm text-amber-600 mt-1">
                All parameters for Line {selectedLine} are already being monitored. 
                Try selecting a different line or remove an existing chart first.
              </p>
            )}
          </div>

          {/* Preview */}
          {selectedParameter && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Chart Preview</h4>
              <div className="text-sm text-gray-600">
                <p><strong>Line:</strong> {selectedLine}</p>
                <p><strong>Parameter:</strong> {testParameters.find(p => p.id === selectedParameter)?.name}</p>
                <p><strong>Unit:</strong> {testParameters.find(p => p.id === selectedParameter)?.unit}</p>
                <p><strong>Data Points:</strong> {
                  trendResults.filter(tr => 
                    (tr as any).lineNumber === selectedLine && 
                    tr.parameterId === selectedParameter
                  ).length
                }</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedParameter || getAvailableParameters(selectedLine).length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Chart
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddChartModal; 