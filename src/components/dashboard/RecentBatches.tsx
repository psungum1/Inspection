import React from 'react';
import { BatchData } from '../../types';
import { getStatusColor } from '../../utils/validation';

interface RecentBatchesProps {
  batches: BatchData[];
}

const RecentBatches: React.FC<RecentBatchesProps> = ({ batches }) => {
  // Mock data for demonstration if no batches
  const mockBatches: BatchData[] = [
    {
      id: 'BATCH-20250102-ABC123',
      productionLine: 1,
      rawMaterialSource: 'Supplier A',
      productionDate: '2025-01-02T10:30:00Z',
      operatorId: 'OP001',
      status: 'completed',
      testResults: [],
      createdAt: '2025-01-02T10:00:00Z',
      updatedAt: '2025-01-02T12:00:00Z'
    },
    {
      id: 'BATCH-20250102-DEF456',
      productionLine: 2,
      rawMaterialSource: 'Supplier B',
      productionDate: '2025-01-02T11:00:00Z',
      operatorId: 'OP002',
      status: 'in_progress',
      testResults: [],
      createdAt: '2025-01-02T10:30:00Z',
      updatedAt: '2025-01-02T11:30:00Z'
    },
    {
      id: 'BATCH-20250102-GHI789',
      productionLine: 1,
      rawMaterialSource: 'Supplier A',
      productionDate: '2025-01-02T09:15:00Z',
      operatorId: 'OP001',
      status: 'failed',
      testResults: [],
      createdAt: '2025-01-02T09:00:00Z',
      updatedAt: '2025-01-02T11:00:00Z'
    }
  ];

  const displayBatches = batches.length > 0 ? batches : mockBatches;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Recent Batches
      </h3>
      <div className="space-y-3">
        {displayBatches.map((batch) => (
          <div key={batch.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900 truncate">
                {batch.id}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(batch.status)}`}>
                {batch.status.replace('_', ' ')}
              </span>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>Line {batch.productionLine} • {batch.rawMaterialSource}</div>
              <div>
                {new Date(batch.productionDate).toLocaleDateString()} {new Date(batch.productionDate).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
        View All Batches →
      </button>
    </div>
  );
};

export default RecentBatches;