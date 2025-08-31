import React, { useState, useEffect } from 'react';
import { Package, Calendar, User, Loader, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import apiService from '../../utils/api';

interface MaterialInput {
  Batch_Log_ID: string;
  Batch_ID: string;
  Product_Name: string;
  UnitOrConnection: string;
  Material_ID: string;
  Material_Name: string;
  Lot_ID : string,
  Actual_Qty: number;
  UnitOfMeasure: string;
  DateTimeUTC: string;
}

interface MaterialInputViewProps {
  batchId: string;
  productName?: string;
}

const MaterialInputView: React.FC<MaterialInputViewProps> = ({ batchId, productName }) => {
  const [materialInputs, setMaterialInputs] = useState<MaterialInput[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalQuantity, setTotalQuantity] = useState<number>(0);
  const [uniqueMaterials, setUniqueMaterials] = useState<number>(0);

  useEffect(() => {
    if (batchId) {
      loadMaterialInputs();
    }
  }, [batchId]);

  const loadMaterialInputs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.getMaterialInputsByBatchId(batchId);
      
      if (response.error) {
        setError(response.error);
        setMaterialInputs([]);
        return;
      }

      if (response.data) {
        console.log('MaterialInput data received:', response.data);
        setMaterialInputs(response.data);
        
        // Calculate totals
        const total = response.data.reduce((sum: number, item: MaterialInput) => sum + (item.Actual_Qty || 0), 0);
        setTotalQuantity(total);
        
        const unique = new Set(response.data.map((item: MaterialInput) => item.Material_ID)).size;
        setUniqueMaterials(unique);
      }
    } catch (error) {
      console.error('Error loading material inputs:', error);
      setError('Failed to load material input data');
      setMaterialInputs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (date: string) => {
    try {
      const dateObj = new Date(`${date}`);
      return dateObj.toLocaleString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return `${date}`;
    }
  };



  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-2">
          <Loader className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading material input data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>Error: {error}</span>
        </div>
        <button
          onClick={loadMaterialInputs}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Material Input Data
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Batch ID: {batchId} {productName && `• Product: ${productName}`}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">Total Materials</div>
              <div className="text-lg font-semibold text-gray-900">{uniqueMaterials}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Total Quantity</div>
              <div className="text-lg font-semibold text-blue-600">{totalQuantity.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {materialInputs.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Material Input Data</h4>
            <p className="text-gray-600">
              No material input records found for batch ID: {batchId}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-sm text-blue-600">Total Records</div>
                    <div className="text-lg font-semibold text-blue-900">{materialInputs.length}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-sm text-green-600">Recent Inputs</div>
                    <div className="text-lg font-semibold text-green-900">
                      {materialInputs.filter(m => {
                        const inputDate = new Date(`${m.DateTimeUTC}`);
                        const now = new Date();
                        const diffHours = (now.getTime() - inputDate.getTime()) / (1000 * 60 * 60);
                        return diffHours < 24;
                      }).length}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-amber-600" />
                  <div>
                    <div className="text-sm text-amber-600">Unique Materials</div>
                    <div className="text-lg font-semibold text-amber-900">
                      {uniqueMaterials}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Material Input Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Material
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Input Date/Time
                    </th>
                    
                    
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {materialInputs.map((material, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {material.Material_Name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Code: {material.Material_ID}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {material.Actual_Qty?.toLocaleString()} {material.UnitOfMeasure}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDateTime(material.DateTimeUTC)}
                        </div>
                      </td>
                      
                      
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Additional Info */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Batch Information</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Batch ID: {materialInputs[0]?.Lot_ID || 'N/A'}</div>
                  <div>Batch Log ID: {materialInputs[0]?.Batch_ID || 'N/A'}</div>
                  <div>Product: {materialInputs[0]?.Product_Name || 'N/A'}</div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Material Summary</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  {(() => {
                    const materialSummary = materialInputs.reduce((acc: any, material) => {
                      const key = material.Material_ID;
                      if (!acc[key]) {
                        acc[key] = {
                          name: material.Material_Name,
                          total: 0,
                          unit: material.UnitOfMeasure
                        };
                      }
                      acc[key].total += material.Actual_Qty || 0;
                      return acc;
                    }, {});

                    return Object.entries(materialSummary).map(([code, data]: [string, any]) => (
                      <div key={code}>
                        {data.name}: {data.total.toLocaleString()} {data.unit}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialInputView; 