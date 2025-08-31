import React, { useState } from 'react';
import { Save, Mic, Paperclip, AlertTriangle } from 'lucide-react';
import { ProductParameterMapping, TestResult } from '../../types';
import { validateTestValue, determineTestStatus } from '../../utils/validation';

interface TestFormProps {
  orderNumber: string;
  parameters: ProductParameterMapping[];
  existingResults: TestResult[];
  selectedRound: number;
  selectedStage?: string;
  onAddResult: (result: Omit<TestResult, 'id' | 'timestamp' | 'operatorId' | 'status'>) => void;
  onSaveDraft: (result: Partial<TestResult>) => void;
  disabled: boolean;
}

const TestForm: React.FC<TestFormProps> = ({ 
  orderNumber, 
  parameters, 
  existingResults, 
  selectedRound, 
  selectedStage, 
  onAddResult, 
  onSaveDraft,
  disabled 
}) => {
  const [selectedParameter, setSelectedParameter] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [comments, setComments] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const selectedParam = parameters.find(p => p.id.toString() === selectedParameter);

  // Get already tested parameters for this order, stage and round
  const testedParameterIds = existingResults.map(result => result.parameterId);
  const availableParameters = parameters.filter(param => !testedParameterIds.includes(param.parameter_name));

  // Check for duplicate tests in the same stage and round
  const duplicateTests = existingResults.reduce((acc, result) => {
    if (!acc[result.parameterId]) {
      acc[result.parameterId] = [];
    }
    acc[result.parameterId].push(result);
    return acc;
  }, {} as Record<string, TestResult[]>);

  const hasDuplicates = Object.values(duplicateTests).some(tests => tests.length > 1);

  const handleParameterChange = (parameterId: string) => {
    const param = parameters.find(p => p.id.toString() === parameterId);
    setSelectedParameter(parameterId);
    setUnit(param?.unit || ''); // Set unit from the selected parameter
    setValue('');
    setComments('');
    setValidationErrors([]);
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!selectedParameter) {
      errors.push('Please select a test parameter');
    }

    // Check for duplicate parameter in the same stage and round
    if (selectedParameter && testedParameterIds.includes(selectedParam?.parameter_name || '')) {
      errors.push('This parameter has already been tested in this stage and round. Please select a different parameter or start a new round.');
    }

    if (!value) {
      errors.push('Please enter a test value');
    } else if (selectedParam) {
      const numValue = parseFloat(value);
      const validationResult = validateTestValue(numValue);
      errors.push(...validationResult.map(error => error.message));
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || availableParameters.length === 0 || !validateForm()) return;

    const numValue = parseFloat(value);
    
    onAddResult({
      orderNumber,
      parameterId: selectedParam?.parameter_name || '',
      round: selectedRound,
      stage: selectedStage,
      value: numValue,
      unit,
      comments: comments || undefined
    });

    // Reset form
    setSelectedParameter('');
    setValue('');
    setUnit('');
    setComments('');
    setValidationErrors([]);
  };

  const handleSaveDraft = () => {
    if (disabled || availableParameters.length === 0) return;

    onSaveDraft({
      orderNumber,
      parameterId: selectedParam?.parameter_name || '',
      round: selectedRound,
      stage: selectedStage,
      value: value ? parseFloat(value) : undefined,
      unit,
      comments: comments || undefined
    });
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Voice recording implementation would go here
  };

  const getStatusPreview = () => {
    if (!selectedParam || !value) return null;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;

    const status = determineTestStatus(
      numValue,
      selectedParam.acceptable_min || 0,
      selectedParam.acceptable_max || 0,
      selectedParam.warning_min || 0,
      selectedParam.warning_max || 0
    );

    const statusColors = {
      pass: 'text-green-700 bg-green-50 border-green-200',
      warning: 'text-amber-700 bg-amber-50 border-amber-200',
      fail: 'text-red-700 bg-red-50 border-red-200'
    };

    return (
      <div className={`mt-2 p-2 rounded border ${statusColors[status]}`}>
        <div className="text-sm font-medium">
          Status Preview: {status.toUpperCase()}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {disabled && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">
              Please select a production order to enter test results
            </span>
          </div>
        </div>
      )}

      {orderNumber && availableParameters.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 text-green-600">✓</div>
            <span className="text-sm font-medium text-green-800">
              All test parameters have been completed for {selectedStage} Round {selectedRound}!
            </span>
          </div>
        </div>
      )}

      {/* Duplicate Tests Warning */}
      {hasDuplicates && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <div className="h-5 w-5 text-red-600 mt-0.5">⚠</div>
            <div>
              <h4 className="text-sm font-medium text-red-800 mb-2">
                Duplicate Tests Detected in {selectedStage} Round {selectedRound}
              </h4>
              <div className="text-sm text-red-700 space-y-1">
                {Object.entries(duplicateTests)
                  .filter(([, tests]) => tests.length > 1)
                  .map(([parameterId, tests]) => {
                    const parameter = parameters.find(p => p.id.toString() === parameterId);
                    return (
                      <div key={parameterId} className="flex items-center justify-between">
                        <span>{parameter?.parameter_name || parameterId}: {tests.length} tests</span>
                        <div className="flex space-x-1">
                          {tests.map((test) => (
                            <span 
                              key={test.id}
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                test.status === 'pass' 
                                  ? 'bg-green-100 text-green-800'
                                  : test.status === 'warning'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {test.value} {test.unit}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
              <p className="text-xs text-red-600 mt-2">
                Multiple tests for the same parameter in the same stage and round may indicate measurement errors or process issues.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={disabled ? 'opacity-50 pointer-events-none' : ''}>
        {/* Current Round Indicator */}
        {orderNumber && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-900">
                Currently testing: {selectedStage} - Round {selectedRound}
              </span>
            </div>
          </div>
        )}

        {/* Parameter Completion Status */}
        {orderNumber && (
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">
              Parameter Completion Status - {selectedStage} Round {selectedRound}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {parameters.map(param => {
                const isTested = testedParameterIds.includes(param.parameter_name);
                const testResult = existingResults.find(result => result.parameterId === param.parameter_name);
                return (
                  <div 
                    key={param.id} 
                    className={`p-2 rounded text-sm flex items-center justify-between ${
                      isTested 
                        ? testResult?.status === 'pass'
                          ? 'bg-green-50 border border-green-200'
                          : testResult?.status === 'warning'
                          ? 'bg-amber-50 border border-amber-200'
                          : 'bg-red-50 border border-red-200'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <span className="font-medium">{param.parameter_name}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isTested
                        ? testResult?.status === 'pass'
                          ? 'bg-green-100 text-green-800'
                          : testResult?.status === 'warning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {isTested ? testResult?.status.toUpperCase() : 'PENDING'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="parameter" className="block text-sm font-medium text-gray-700 mb-2">
              Test Parameter *
            </label>
            <select
              id="parameter"
              value={selectedParameter}
              onChange={(e) => handleParameterChange(e.target.value)}
              required
              disabled={availableParameters.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {availableParameters.length === 0 
                  ? 'All parameters have been tested for this round' 
                  : 'Select Parameter'
                }
              </option>
                              {parameters.map(param => {
                  const isTested = testedParameterIds.includes(param.parameter_name);
                  return (
                    <option 
                      key={param.id} 
                      value={param.id.toString()}
                      disabled={isTested}
                      className={isTested ? 'text-gray-400' : ''}
                    >
                      {param.parameter_name} ({param.unit || 'N/A'}) {isTested ? '- Already Tested' : ''}
                    </option>
                  );
                })}
            </select>
          </div>

          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
              Test Value *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                id="value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                placeholder="Enter measured value"
                className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {unit && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-sm text-gray-500">{unit}</span>
                </div>
              )}
            </div>
            {getStatusPreview()}
          </div>
        </div>

        {/* Parameter Specifications */}
        {selectedParam && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">{selectedParam.parameter_name} Specifications</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <span className="font-medium text-green-800">Acceptable Range:</span>
                <br />
                {selectedParam.acceptable_min} - {selectedParam.acceptable_max} {selectedParam.unit}
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                <span className="font-medium text-amber-800">Warning Range:</span>
                <br />
                {selectedParam.warning_min} - {selectedParam.warning_max} {selectedParam.unit}
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <span className="font-medium text-red-800">Critical:</span>
                <br />
                {selectedParam.critical_min} - {selectedParam.critical_max} {selectedParam.unit}
              </div>
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div>
          <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
            Comments (Optional)
          </label>
          <div className="relative">
            <textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Add any observations or comments..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <div className="absolute bottom-2 right-2 flex items-center space-x-2">
              <span className="text-xs text-gray-400">
                {comments.length}/500
              </span>
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-1 rounded ${
                  isRecording 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Mic className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="p-1 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded"
              >
                <Paperclip className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Please fix the following errors:</h4>
                <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={disabled || availableParameters.length === 0}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            Save as Draft
          </button>
          <button
            type="submit"
            disabled={disabled || availableParameters.length === 0 || validationErrors.length > 0}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              disabled || availableParameters.length === 0 || validationErrors.length > 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Save className="h-4 w-4 inline mr-2" />
            {availableParameters.length === 0 ? 'All Tests Complete' : `Save Test Result - ${selectedStage} Round ${selectedRound}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TestForm;