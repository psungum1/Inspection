import React from 'react';
import { FileText, Loader } from 'lucide-react';

interface ImportProgressProps {
  fileName: string;
  progress: number;
}

const ImportProgress: React.FC<ImportProgressProps> = ({ fileName, progress }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <FileText className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Processing Import
          </h3>
          <p className="text-sm text-gray-600">{fileName}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-900">{progress}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Loader className="h-4 w-4 animate-spin" />
          <span>Validating data and checking for duplicates...</span>
        </div>
      </div>
    </div>
  );
};

export default ImportProgress;