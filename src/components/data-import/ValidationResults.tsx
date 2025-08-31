import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Download } from 'lucide-react';
import { ImportResult } from '../../types';

interface ValidationResultsProps {
  result: ImportResult;
  onReset: () => void;
}

const ValidationResults: React.FC<ValidationResultsProps> = ({ result, onReset }) => {
  const successRate = (result.successfulRows / result.totalRows) * 100;

  const downloadErrorReport = () => {
    const errorReport = [
      'Field,Message,Code',
      ...result.errors.map(error => `${error.field},"${error.message}",${error.code}`)
    ].join('\n');

    const blob = new Blob([errorReport], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import_errors.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Import Results
        </h3>
        <button
          onClick={onReset}
          className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Import Another File</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">Successful</span>
          </div>
          <div className="text-2xl font-bold text-green-900 mt-1">
            {result.successfulRows}
          </div>
          <div className="text-xs text-green-600">
            {successRate.toFixed(1)}% success rate
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">Errors</span>
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-1">
            {result.errors.length}
          </div>
          <div className="text-xs text-amber-600">
            Validation errors found
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Duplicates</span>
          </div>
          <div className="text-2xl font-bold text-blue-900 mt-1">
            {result.duplicates.length}
          </div>
          <div className="text-xs text-blue-600">
            Duplicate records skipped
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
          <span>Import Progress</span>
          <span>{result.totalRows} total rows</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full"
            style={{ width: `${successRate}%` }}
          ></div>
        </div>
      </div>

      {/* Error Details */}
      {result.errors.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-semibold text-gray-900">
              Validation Errors
            </h4>
            <button
              onClick={downloadErrorReport}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <Download className="h-4 w-4" />
              <span>Download Error Report</span>
            </button>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {result.errors.map((error, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <span className="font-medium text-red-800">{error.field}:</span>
                    <span className="text-red-700 ml-1">{error.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Details */}
      {result.duplicates.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-900 mb-3">
            Duplicate Records
          </h4>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-800">
              The following order numbers were already in the system and were skipped:
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {result.duplicates.map((duplicate, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {duplicate}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {result.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Import completed successfully! {result.successfulRows} records have been added to the system.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationResults;