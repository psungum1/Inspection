import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import FileUploader from './FileUploader';
import ImportProgress from './ImportProgress';
import ValidationResults from './ValidationResults';
import { ImportResult, ValidationError } from '../../types';
import { parseCSV, validateOrders, ParsedOrder } from '../../utils/csvParser';
import apiService from '../../utils/api';

const DataImport: React.FC = () => {
  const { state, dispatch } = useApp();
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setIsImporting(true);
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Read the file content
      const fileContent = await file.text();
      
      // Parse CSV
      const parseResult = parseCSV(fileContent);
      
      if (!parseResult.success) {
        setImportResult({
          success: false,
          totalRows: parseResult.totalRows,
          successfulRows: 0,
          errors: parseResult.errors,
          duplicates: []
        });
        return;
      }

      // Validate orders
      const validationErrors = validateOrders(parseResult.orders);
      
      if (validationErrors.length > 0) {
        setImportResult({
          success: false,
          totalRows: parseResult.totalRows,
          successfulRows: 0,
          errors: validationErrors,
          duplicates: []
        });
        return;
      }

      // Import to database
      const apiResult = await apiService.bulkImportOrders(parseResult.orders);
      
      if (apiResult.error) {
        dispatch({ type: 'SET_ERROR', payload: apiResult.error });
        setImportResult({
          success: false,
          totalRows: parseResult.totalRows,
          successfulRows: 0,
          errors: [{ field: 'api', message: apiResult.error, code: 'API_ERROR' }],
          duplicates: []
        });
        return;
      }

      if (!apiResult.data) {
        dispatch({ type: 'SET_ERROR', payload: 'No response from server' });
        return;
      }

      const result = apiResult.data;
      
      setImportResult({
        success: result.success,
        totalRows: result.totalRows,
        successfulRows: result.successfulRows,
        errors: result.errors,
        duplicates: result.duplicates
      });

      // Add imported orders to state
      if (result.importedOrders && result.importedOrders.length > 0) {
        result.importedOrders.forEach(order => {
          dispatch({ type: 'ADD_ORDER', payload: order });
        });
      }

      // Show success message
      if (result.successfulRows > 0) {
        dispatch({ 
          type: 'SET_SUCCESS', 
          payload: `Successfully imported ${result.successfulRows} orders` 
        });
      }

    } catch (error) {
      console.error('Import error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to import data' });
      setImportResult({
        success: false,
        totalRows: 0,
        successfulRows: 0,
        errors: [{ field: 'general', message: 'Failed to process file', code: 'PROCESSING_ERROR' }],
        duplicates: []
      });
    } finally {
      setIsImporting(false);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleReset = () => {
    setImportResult(null);
    setUploadedFile(null);
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const downloadTemplate = () => {
    const csvContent = `Order_Number,Line_Number,Production_DateTime,Operator_ID
ORD20250102001,1,2025-01-02T10:30:00Z,OP001
ORD20250102002,2,2025-01-02T11:00:00Z,OP002
ORD20250102003,1,2025-01-02T11:30:00Z,OP003
ORD20250102004,3,2025-01-02T12:00:00Z,OP001
ORD20250102005,2,2025-01-02T12:30:00Z,OP004`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'production_data_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Data Import & Management
        </h2>
        <p className="text-gray-600">
          Import production data from CSV and Excel files with automatic validation
        </p>
      </div>

      {/* Template Download */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex items-start space-x-3">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900">
              Download Template
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Use our template to ensure your data is formatted correctly for import.
            </p>
            <button
              onClick={downloadTemplate}
              className="mt-2 inline-flex items-center space-x-2 text-sm text-blue-700 hover:text-blue-900 font-medium"
            >
              <Download className="h-4 w-4" />
              <span>Download CSV Template</span>
            </button>
          </div>
        </div>
      </div>

      {/* Import Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* File Upload */}
        <div className="lg:col-span-2">
          {!importResult ? (
            <div className="space-y-6">
              <FileUploader 
                onFileUpload={handleFileUpload}
                isUploading={isImporting}
              />
              
              {isImporting && (
                <ImportProgress 
                  fileName={uploadedFile?.name || ''}
                  progress={75}
                />
              )}
            </div>
          ) : (
            <ValidationResults 
              result={importResult}
              onReset={handleReset}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* File Requirements */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              File Requirements
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>CSV or Excel (.xlsx, .xls) format</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Maximum file size: 10MB</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Required columns: Order_Number, Line_Number, Production_DateTime, Operator_ID</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Date format: ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)</span>
              </div>
            </div>
          </div>

          {/* Recent Imports */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Imports
            </h3>
            <div className="space-y-3">
              {[
                { name: 'production_data_2025_01_02.csv', date: '2 hours ago', status: 'success', records: 150 },
                { name: 'quality_tests_batch_001.xlsx', date: '1 day ago', status: 'warning', records: 89 },
                { name: 'line_data_morning_shift.csv', date: '2 days ago', status: 'success', records: 203 }
              ].map((import_, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {import_.name}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      import_.status === 'success' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {import_.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {import_.records} records • {import_.date}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Import Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Import Statistics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Imports Today</span>
                <span className="text-sm font-medium text-gray-900">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Records Processed</span>
                <span className="text-sm font-medium text-gray-900">442</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span className="text-sm font-medium text-green-600">94.7%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Processing Time</span>
                <span className="text-sm font-medium text-gray-900">2.3s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataImport;