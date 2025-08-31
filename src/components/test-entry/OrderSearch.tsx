import React, { useState, useEffect } from 'react';
import { Search, Package, Calendar, User, Loader } from 'lucide-react';
import { ProductionOrder } from '../../types';
import apiService from '../../utils/api';

interface OrderSearchProps {
  onOrderSelect: (orderNumber: string, productName: string) => void; // เพิ่ม productName
  selectedOrder: string;
}

const OrderSearch: React.FC<OrderSearchProps> = ({ onOrderSelect, selectedOrder }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState<ProductionOrder[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Recent PLC orders (latest 4 from plc_orders)
  const [recentPlcOrders, setRecentPlcOrders] = useState<ProductionOrder[]>([]);

  useEffect(() => {
    const loadRecentPlcOrders = async () => {
      try {
        const response = await apiService.searchPlcOrders({ limit: 4 });
        if (response.data) {
          const transformed = response.data.map((order: any) => ({
            orderNumber: order.batch_id,
            lineNumber: order.Train_ID || 'N/A',
            productionDateTime: order.log_open_dt_utc || order.log_open_dt,
            operatorId: order.Batch_Server_Name || 'System',
            status: order.log_close_dt_utc == null ? 'active' as const : 'completed' as const,
            testResults: [],
            testResultsCount: order.test_results_count || 0,
            createdAt: order.log_open_dt_utc || order.log_open_dt,
            updatedAt: order.log_close_dt_utc || order.log_close_dt,
            productName: order.product_name,
            // keep a copy for compatibility where we read product_name
            product_name: order.product_name,
            recipeName: order.recipe_name,
            campaignId: order.campaign_id,
            lotId: order.lot_id,
            batchSize: order.batch_size,
            batchLogId: order.batch_log_id,
          }));
          setRecentPlcOrders(transformed);
        }
      } catch (e) {
        // silently ignore for recent list
        setRecentPlcOrders([]);
      }
    };
    loadRecentPlcOrders();
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.length >= 2) {
        searchOrdersFromDatabase(searchTerm);
      } else if (searchTerm.length === 0) {
        setFilteredOrders([]);
        setShowSuggestions(false);
        setSearchError(null);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const searchOrdersFromDatabase = async (query: string) => {
    try {
      setIsSearching(true);
      setSearchError(null);
      
      const response = await apiService.searchPlcOrders({
        query,
        limit: 10
      });

      if (response.error) {
        setSearchError(response.error);
        setFilteredOrders([]);
        return;
      }

      if (response.data) {
        // Transform the PLC orders data to match the expected format
        const transformedOrders = response.data.map((order: any) => ({
          orderNumber: order.batch_id, // Use Batch_ID as order number
          lineNumber: order.Train_ID || 'N/A', // Use Train_ID as line number
          productionDateTime: order.log_open_dt_utc || order.log_open_dt,
          operatorId: order.Batch_Server_Name || 'System', // Use Batch_Server_Name as operator
          
          status: order.log_close_dt_utc == null ? 'active' as const : 'completed' as const, // This is calculated in the backend
          testResults: [], // We'll load test results separately if needed
          testResultsCount: order.test_results_count || 0, // Add test results count
          createdAt: order.log_open_dt_utc || order.log_open_dt,
          updatedAt: order.log_close_dt_utc || order.log_close_dt,
          // Additional PLC-specific fields
          productName: order.product_name, // ensure this is always mapped from order.product_name
          product_name: order.product_name, // เพิ่ม field นี้เพื่อให้หาได้จาก localStorage
          recipeName: order.recipe_name,
          campaignId: order.campaign_id,
          lotId: order.lot_id,
          batchSize: order.batch_size,
          batchLogId: order.batch_log_id
        }));

        // Cache PLC orders for TestEntry to use
        localStorage.setItem('plcOrdersCache', JSON.stringify(transformedOrders));

        setFilteredOrders(transformedOrders);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Failed to search PLC orders');
      setFilteredOrders([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleOrderSelect = (orderNumber: string, productName: string) => {
    setSearchTerm(orderNumber);
    setShowSuggestions(false);
    setSearchError(null);
    onOrderSelect(orderNumber, productName); // ส่ง productName กลับไปด้วย
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value === '') {
      onOrderSelect('', ''); // ส่งค่าว่างเมื่อคลายค้นหา
      setSearchError(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Search PLC Orders
      </h3>
      
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            placeholder="Enter batch ID, product name, recipe name, or search term..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {isSearching && (
            <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
          )}
        </div>

        {/* Search Error */}
        {searchError && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
            {searchError}
          </div>
        )}

        {/* Autocomplete Suggestions */}
        {showSuggestions && filteredOrders.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredOrders.map((order) => (
              <button
                key={order.orderNumber}
                onClick={() => handleOrderSelect(order.orderNumber, (order as any).product_name || order.productName)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.productName} • {order.recipeName}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(order.productionDateTime).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Tests: {order.testResultsCount || 0}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No Results */}
        {showSuggestions && searchTerm.length >= 2 && !isSearching && filteredOrders.length === 0 && !searchError && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
            <div className="text-center text-gray-500">
              <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No PLC orders found for "{searchTerm}"</p>
              <p className="text-xs mt-1">Try searching by batch ID, product name, recipe name, or partial matches</p>
            </div>
          </div>
        )}
      </div>

      {/* Recent PLC Orders */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Recent PLC Orders</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recentPlcOrders.map((order) => (
            <button
              key={order.orderNumber}
              onClick={() => handleOrderSelect(order.orderNumber, (order as any).product_name || order.productName)}
              className={`text-left p-3 border rounded-lg transition-colors ${
                selectedOrder === order.orderNumber
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">
                  {order.orderNumber}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  order.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Package className="h-3 w-3" />
                  <span>{order.productName || `Train ${order.lineNumber}`}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>{order.recipeName || order.operatorId}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(order.productionDateTime).toLocaleDateString()}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
        {recentPlcOrders.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No recent PLC orders found</p>
            <p className="text-xs mt-1">Use the search above to find PLC orders</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSearch;