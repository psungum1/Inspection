import React from 'react';
import { X } from 'lucide-react';
import { ProductionOrder, TestParameter } from '../../types';

interface FilterPanelProps {
  filters: {
    lineNumbers: number[];
    operatorIds: string[];
    parameters: string[];
  };
  onFiltersChange: (filters: any) => void;
  orders: ProductionOrder[];
  parameters: TestParameter[];
}

const FilterPanel: React.FC<FilterPanelProps> = ({ 
  filters, 
  onFiltersChange, 
  orders, 
  parameters 
}) => {
  const availableLines = Array.from(new Set(orders.map(o => o.lineNumber))).sort();
  const availableOperators = Array.from(new Set(orders.map(o => o.operatorId))).sort();

  const handleLineToggle = (lineNumber: number) => {
    const newLines = filters.lineNumbers.includes(lineNumber)
      ? filters.lineNumbers.filter(l => l !== lineNumber)
      : [...filters.lineNumbers, lineNumber];
    
    onFiltersChange({ ...filters, lineNumbers: newLines });
  };

  const handleOperatorToggle = (operatorId: string) => {
    const newOperators = filters.operatorIds.includes(operatorId)
      ? filters.operatorIds.filter(o => o !== operatorId)
      : [...filters.operatorIds, operatorId];
    
    onFiltersChange({ ...filters, operatorIds: newOperators });
  };

  const handleParameterToggle = (parameterId: string) => {
    const newParameters = filters.parameters.includes(parameterId)
      ? filters.parameters.filter(p => p !== parameterId)
      : [...filters.parameters, parameterId];
    
    onFiltersChange({ ...filters, parameters: newParameters });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      lineNumbers: [],
      operatorIds: [],
      parameters: []
    });
  };

  const hasActiveFilters = filters.lineNumbers.length > 0 || 
                          filters.operatorIds.length > 0 || 
                          filters.parameters.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">Filters</h4>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Production Lines */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Production Lines
          </label>
          <div className="space-y-2">
            {availableLines.map(line => (
              <label key={line} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.lineNumbers.includes(line)}
                  onChange={() => handleLineToggle(line)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Line {line}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Operators */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Operators
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {availableOperators.map(operator => (
              <label key={operator} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.operatorIds.includes(operator)}
                  onChange={() => handleOperatorToggle(operator)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{operator}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Parameters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Parameters
          </label>
          <div className="space-y-2">
            {parameters.map(param => (
              <label key={param.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.parameters.includes(param.id)}
                  onChange={() => handleParameterToggle(param.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{param.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filters.lineNumbers.map(line => (
              <span
                key={`line-${line}`}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                Line {line}
                <button
                  onClick={() => handleLineToggle(line)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {filters.operatorIds.map(operator => (
              <span
                key={`operator-${operator}`}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                {operator}
                <button
                  onClick={() => handleOperatorToggle(operator)}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {filters.parameters.map(paramId => {
              const param = parameters.find(p => p.id === paramId);
              return (
                <span
                  key={`param-${paramId}`}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                >
                  {param?.name}
                  <button
                    onClick={() => handleParameterToggle(paramId)}
                    className="ml-1 text-purple-600 hover:text-purple-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;