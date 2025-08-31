import React, { useState } from 'react';
import { Mic, Paperclip, CheckCircle } from 'lucide-react';
import { BatchData, QualityParameter, TestResult } from '../../types';
import { getStatusColor, formatValue } from '../../utils/validation';

interface TestResultFormProps {
  batch: BatchData;
  parameters: QualityParameter[];
  onAddResult: (result: Omit<TestResult, 'timestamp' | 'operatorId' | 'status'>) => void;
  onComplete: () => void;
}

const TestResultForm: React.FC<TestResultFormProps> = ({ 
  batch, 
  parameters, 
  onAddResult, 
  onComplete 
}) => {
  const [selectedParameter, setSelectedParameter] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParameter || !value) return;

    onAddResult({
      parameterId: selectedParameter,
      value: parseFloat(value),
      notes: notes || undefined
    });

    // Reset form
    setSelectedParameter('');
    setValue('');
    setNotes('');
  };

  const getCompletedTest = (parameterId: string) => {
    return batch.testResults.find(result => result.parameterId === parameterId);
  };

  const isParameterCompleted = (parameterId: string) => {
    return batch.testResults.some(result => result.parameterId === parameterId);
  };

  const allTestsCompleted = parameters.every(param => isParameterCompleted(param.id));

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Start recording
      console.log('Starting voice recording...');
    } else {
      // Stop recording and process
      console.log('Stopping voice recording...');
    }
  };

  return (
    <div className="space-y-6">
      {/* Test Results Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parameters.map(param => {
            const completed = getCompletedTest(param.id);
            return (
              <div key={param.id} className={`p-3 rounded-lg border ${
                completed 
                  ? `${getStatusColor(completed.status)} border-current`
                  : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{param.name}</span>
                  {completed && <CheckCircle className="h-4 w-4" />}
                </div>
                {completed && (
                  <div className="text-xs mt-1">
                    {formatValue(completed.value, param.unit)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add New Test Result */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Test Result</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="parameter" className="block text-sm font-medium text-gray-700 mb-2">
              Quality Parameter *
            </label>
            <select
              id="parameter"
              value={selectedParameter}
              onChange={(e) => setSelectedParameter(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Parameter</option>
              {parameters.map(param => (
                <option 
                  key={param.id} 
                  value={param.id}
                  disabled={isParameterCompleted(param.id)}
                >
                  {param.name} ({param.unit}) {isParameterCompleted(param.id) && '✓ Completed'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
              Test Value *
            </label>
            <input
              type="number"
              step="0.01"
              id="value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              placeholder="Enter measured value"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Parameter Info */}
        {selectedParameter && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            {(() => {
              const param = parameters.find(p => p.id === selectedParameter);
              if (!param) return null;
              return (
                <div className="text-sm">
                  <h4 className="font-medium text-blue-900 mb-2">{param.name} Specifications</h4>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-green-700 font-medium">Acceptable:</span>
                      <br />
                      {param.acceptable.min} - {param.acceptable.max} {param.unit}
                    </div>
                    <div>
                      <span className="text-amber-700 font-medium">Warning:</span>
                      <br />
                      {param.warning.min} - {param.warning.max} {param.unit}
                    </div>
                    <div>
                      <span className="text-red-700 font-medium">Critical:</span>
                      <br />
                      Outside warning range
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Notes Section */}
        <div className="mt-6">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <div className="relative">
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any observations or comments..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <div className="absolute bottom-2 right-2 flex items-center space-x-2">
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

        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600">
            {batch.testResults.length} of {parameters.length} tests completed
          </div>
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={!selectedParameter || !value}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !selectedParameter || !value
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Add Result
            </button>
            {allTestsCompleted && (
              <button
                type="button"
                onClick={onComplete}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
              >
                Complete Batch
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default TestResultForm;