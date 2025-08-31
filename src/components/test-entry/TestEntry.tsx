import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import OrderSearch from './OrderSearch';
import TestForm from './TestForm';
import TestHistory from './TestHistory';
import MaterialInputView from './MaterialInputView';
import { TestResult, ProductParameterMapping } from '../../types';
import { generateOrderId, determineTestStatus } from '../../utils/validation';
import apiService from '../../utils/api';

const TestEntry: React.FC = () => {
  const { state, dispatch } = useApp();
  const { orders, testParameters, user } = state;
  const [selectedOrder, setSelectedOrder] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'entry' | 'history' | 'material'>('entry');
  const [draftResults, setDraftResults] = useState<Partial<TestResult>[]>([]);
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [orderTestResults, setOrderTestResults] = useState<TestResult[]>([]);
  const [productParameters, setProductParameters] = useState<ProductParameterMapping[]>([]);
  const [productName, setProductName] = useState<string>('');
  const [testStages, setTestStages] = useState<any[]>([]);

  // Load orders with test results on component mount
  useEffect(() => {
    loadOrdersWithTestResults();
    loadTestParameters();
    loadTestStages();
  }, []);

  // เมื่อ selectedOrder เปลี่ยน ให้ดึง product_name และโหลด parameter mapping
  useEffect(() => {
    if (selectedOrder && productName) {
      apiService.getProductParametersByProductName(productName)
        .then(res => {
          if (res.data) setProductParameters(res.data);
          else setProductParameters([]);
        })
        .catch(() => setProductParameters([]));
      loadOrderTestResults(selectedOrder);
    } else {
      setOrderTestResults([]);
      setProductParameters([]);
      setProductName('');
    }
  }, [selectedOrder, productName]);

  // เมื่อ testStages โหลดเสร็จ ให้เลือก stage แรกเป็น default
  useEffect(() => {
    if (testStages.length > 0 && !selectedStage) {
      setSelectedStage(testStages[0].name);
    }
  }, [testStages, selectedStage]);

  const loadOrdersWithTestResults = async () => {
    try {
      setIsLoading(true);
      // Load all orders, not just active ones, so users can search through everything
      const response = await apiService.getOrdersWithTestResults();
      
      if (response.error) {
        dispatch({ type: 'SET_ERROR', payload: response.error });
        return;
      }

      if (response.data) {
        // Transform the data to match the expected format
        const transformedOrders = response.data.map((order: any) => ({
          orderNumber: order.order_number,
          lineNumber: order.line_number,
          productionDateTime: order.production_date_time,
          operatorId: order.operator_id,
          status: order.status,
          testResults: order.test_results || [],
          createdAt: order.created_at,
          updatedAt: order.updated_at,
          testResultsCount: order.test_results ? order.test_results.length : 0
        }));

        dispatch({ type: 'SET_ORDERS', payload: transformedOrders });
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load orders' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTestParameters = async () => {
    try {
      const response = await apiService.getTestParameters();
      
      if (response.error) {
        dispatch({ type: 'SET_ERROR', payload: response.error });
        return;
      }

      if (response.data) {
        // Transform the data to match the expected format
        const transformedParameters = response.data.map((param: any) => ({
          id: param.id,
          name: param.name,
          unit: param.unit,
          minValue: param.min_value,
          maxValue: param.max_value,
          warningMin: param.warning_min,
          warningMax: param.warning_max,
          category: param.category,
          description: param.description
        }));

        dispatch({ type: 'UPDATE_TEST_PARAMETERS', payload: transformedParameters });
      }
    } catch (error) {
      console.error('Error loading test parameters:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load test parameters' });
    }
  };

  const loadTestStages = async () => {
    try {
      console.log('🔄 Loading test stages...');
      const response = await apiService.getTestStages();
      console.log('📡 API Response:', response);
      
      if (response.error) {
        console.error('❌ API Error:', response.error);
        dispatch({ type: 'SET_ERROR', payload: response.error });
        return;
      }

      if (response.data) {
        console.log('📊 Raw response data:', response.data);
        console.log('📊 Response data type:', typeof response.data);
        console.log('📊 Response data structure:', Object.keys(response.data));
        
        // Extract stages array from response structure
        let stagesData: any[] = [];
        if (response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray(response.data.data)) {
          stagesData = response.data.data;
          console.log('✅ Found stages in response.data.data');
        } else if (response.data && Array.isArray(response.data)) {
          stagesData = response.data;
          console.log('✅ Found stages directly in response.data');
        } else {
          console.error('❌ Could not find valid stages array in response');
          return;
        }
        
        console.log('📊 Stages data:', stagesData);
        const activeStages = stagesData.filter((stage: any) => stage.is_active);
        console.log('✅ Active stages:', activeStages);
        setTestStages(activeStages);
        
        // Set default selected stage if available
        if (activeStages.length > 0 && !selectedStage) {
          console.log('🎯 Setting default stage:', activeStages[0].name);
          setSelectedStage(activeStages[0].name);
        }
      } else {
        console.warn('⚠️ No data in response');
      }
    } catch (error) {
      console.error('💥 Error loading test stages:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load test stages' });
    }
  };

  const loadOrderTestResults = async (orderNumber: string) => {
    try {
      // Check if this is a PLC order by looking for it in the cached PLC orders
      const plcOrdersCache = localStorage.getItem('plcOrdersCache');
      const isPlcOrder = plcOrdersCache ? JSON.parse(plcOrdersCache).some((order: any) => order.orderNumber === orderNumber) : false;
      
      let response;
      if (isPlcOrder) {
        // Use PLC-specific API for PLC orders
        response = await apiService.getPlcOrderWithResults(orderNumber);
        if (response.data && response.data.testResults) {
          // Transform PLC test results to match expected format
          const transformedResults = response.data.testResults.map((result: any) => ({
            id: result.id,
            orderNumber: result.order_number,
            parameterId: result.parameter_id,
            round: result.round,
            stage: result.stage,
            value: result.value,
            unit: result.unit,
            timestamp: result.timestamp,
            operatorId: result.operator_id,
            status: result.status,
            comments: result.comments,
            attachments: result.attachments || []
          }));
          setOrderTestResults(transformedResults);
          return;
        }
      } else {
        // Use regular API for production orders
        response = await apiService.getTestResults(orderNumber);
      }
      
      if (response.error) {
        dispatch({ type: 'SET_ERROR', payload: response.error });
        return;
      }

      if (response.data) {
        // Transform the data to match the expected format
        const transformedResults = response.data.map((result: any) => ({
          id: result.id,
          orderNumber: result.order_number,
          parameterId: result.parameter_id,
          round: result.round,
          stage: result.stage,
          value: result.value,
          unit: result.unit,
          timestamp: result.timestamp,
          operatorId: result.operator_id,
          status: result.status,
          comments: result.comments,
          attachments: result.attachments || []
        }));

        setOrderTestResults(transformedResults);
      }
    } catch (error) {
      console.error('Error loading test results:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load test results' });
    }
  };

  const handleOrderSelect = (orderNumber: string, productName: string) => {
    setSelectedOrder(orderNumber);
    setProductName(productName);
    setActiveTab('entry');
  };

  const handleAddTestResult = async (result: Omit<TestResult, 'id' | 'timestamp' | 'operatorId' | 'status'>) => {
    if (!user) return;

    const parameter = productParameters.find(p => p.parameter_name === result.parameterId);
    if (!parameter) return;

    const status = determineTestStatus(
      result.value,
      parameter.acceptable_min || 0,
      parameter.acceptable_max || 0,
      parameter.warning_min || 0,
      parameter.warning_max || 0
    );

    try {
      // Save to database
      const apiResponse = await apiService.createTestResult({
        orderNumber: result.orderNumber,
        parameterId: result.parameterId,
        round: result.round,
        stage: result.stage,
        value: result.value,
        unit: result.unit,
        operatorId: user.id,
        status,
        comments: result.comments
      });

      if (apiResponse.error) {
        dispatch({ type: 'SET_ERROR', payload: apiResponse.error });
        return;
      }

      if (apiResponse.data) {
        // Transform the response to match the expected format
        const newResult: TestResult = {
          id: apiResponse.data.id,
          orderNumber: apiResponse.data.order_number,
          parameterId: apiResponse.data.parameter_id,
          round: apiResponse.data.round,
          stage: apiResponse.data.stage,
          value: apiResponse.data.value,
          unit: apiResponse.data.unit,
          timestamp: apiResponse.data.timestamp,
          operatorId: apiResponse.data.operator_id,
          status: apiResponse.data.status,
          comments: apiResponse.data.comments,
          attachments: apiResponse.data.attachments || []
        };

        // Add to local state
        dispatch({ type: 'ADD_TEST_RESULT', payload: newResult });
        setOrderTestResults(prev => [...prev, newResult]);

        // Update the order with the new test result
        const order = orders.find(o => o.orderNumber === result.orderNumber);
        if (order) {
          const updatedOrder = {
            ...order,
            testResults: [...order.testResults, newResult],
            updatedAt: new Date().toISOString()
          };
          dispatch({ type: 'UPDATE_ORDER', payload: updatedOrder });
        }

        dispatch({ type: 'SET_SUCCESS', payload: 'Test result saved successfully' });
      }
    } catch (error) {
      console.error('Error saving test result:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save test result' });
    }
  };

  const handleCloseOrder = async () => {
    if (!selectedOrder || !user) return;

    const order = orders.find(o => o.orderNumber === selectedOrder);
    if (!order) return;

    // Check if all required tests are completed
    const allRoundsResults = orderTestResults;
    const testedParameters = [...new Set(allRoundsResults.map(result => result.parameterId))];
    
    if (testedParameters.length < productParameters.length) {
      alert('Cannot close order: Not all parameters have been tested. Please complete all required tests first.');
      return;
    }

    // Check for any failed tests
    const failedTests = allRoundsResults.filter(test => test.status === 'fail');
    if (failedTests.length > 0) {
      const shouldProceed = confirm(
        `Warning: ${failedTests.length} test(s) have failed. Are you sure you want to close this order?`
      );
      if (!shouldProceed) return;
    }

    try {
      // Update order status in database
      const apiResponse = await apiService.updateOrderStatus(selectedOrder, 'completed');

      if (apiResponse.error) {
        dispatch({ type: 'SET_ERROR', payload: apiResponse.error });
        return;
      }

      if (apiResponse.data) {
        const updatedOrder = {
          ...order,
          status: 'completed' as const,
          updatedAt: new Date().toISOString()
        };

        dispatch({ type: 'UPDATE_ORDER', payload: updatedOrder });
        
        // Reset selection
        setSelectedOrder('');
        setSelectedRound(1);
        setActiveTab('entry');
        
        dispatch({ type: 'SET_SUCCESS', payload: 'Order has been successfully closed and marked as completed' });
      }
    } catch (error) {
      console.error('Error closing order:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to close order' });
    }
  };

  const handleSaveDraft = (result: Partial<TestResult>) => {
    setDraftResults(prev => [...prev, result]);
  };

  const selectedOrderData = orders.find(order => order.orderNumber === selectedOrder);

  // Get available rounds for the selected order and stage
  const getAvailableRounds = (orderNumber: string, stage: string): number[] => {
    const orderResults = orderTestResults.filter(test => 
      test.orderNumber === orderNumber && test.stage === stage
    );
    const rounds = [...new Set(orderResults.map(result => result.round))];
    return rounds.length > 0 ? rounds.sort((a, b) => a - b) : [1];
  };

  // Get the next round number for the selected stage
  const getNextRound = (orderNumber: string, stage: string): number => {
    const availableRounds = getAvailableRounds(orderNumber, stage);
    return availableRounds.length > 0 ? Math.max(...availableRounds) + 1 : 1;
  };

  // Get test results for the selected order, stage and round
  const getRoundTestResults = (orderNumber: string, stage: string, round: number): TestResult[] => {
    return orderTestResults.filter(test => 
      test.orderNumber === orderNumber && 
      test.stage === stage && 
      test.round === round
    );
  };

  // Get all test results for a specific stage
  const getStageTestResults = (orderNumber: string, stage: string): TestResult[] => {
    return orderTestResults.filter(test => 
      test.orderNumber === orderNumber && test.stage === stage
    );
  };

  // Get stage completion status
  const getStageCompletionStatus = (orderNumber: string, stage: string) => {
    const stageResults = getStageTestResults(orderNumber, stage);
    const testedParameters = [...new Set(stageResults.map(result => result.parameterId))];
    const totalParameters = productParameters.length;
    const completedCount = testedParameters.length;
    const passCount = stageResults.filter(r => r.status === 'pass').length;
    const warningCount = stageResults.filter(r => r.status === 'warning').length;
    const failCount = stageResults.filter(r => r.status === 'fail').length;
    
    return {
      completedCount,
      totalParameters,
      passCount,
      warningCount,
      failCount,
      isComplete: completedCount >= totalParameters
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Test Data Entry
        </h2>
        <p className="text-gray-600">
          Enter and manage quality test results for production orders
        </p>
      </div>

      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-800">Loading orders and test results...</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Search */}
          <OrderSearch 
            onOrderSelect={handleOrderSelect}
            selectedOrder={selectedOrder}
          />

          {/* Selected Order Info 
          {selectedOrderData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">
                    Order: {selectedOrderData.orderNumber}
                  </h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>Line {selectedOrderData.lineNumber} • Operator: {selectedOrderData.operatorId}</div>
                    <div>Production: {new Date(selectedOrderData.productionDateTime).toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-600">
                    Tests Completed: {orderTestResults.length}/{productParameters.length}
                  </div>
                  <div className="w-32 bg-blue-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${productParameters.length > 0 ? (orderTestResults.length / productParameters.length) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  {selectedOrderData?.testResultsCount !== undefined && (
                    <div className="text-xs text-gray-500 mt-1">
                      Total Tests: {selectedOrderData.testResultsCount}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Round Selection */}
          {selectedOrder && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Round</h3>
                  <p className="text-sm text-gray-600">Select which round of testing you want to perform</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label htmlFor="stage-select" className="text-sm font-medium text-gray-700">
                      Stage:
                    </label>
                    <select
                      id="stage-select"
                      value={selectedStage}
                      onChange={(e) => setSelectedStage(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {testStages.map(stage => (
                        <option key={stage.id} value={stage.name}>
                          {stage.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label htmlFor="round-select" className="text-sm font-medium text-gray-700">
                      Round:
                    </label>
                    <select
                      id="round-select"
                      value={selectedRound}
                      onChange={(e) => setSelectedRound(parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {getAvailableRounds(selectedOrder, selectedStage).map(round => (
                        <option key={round} value={round}>
                          Round {round}
                        </option>
                      ))}
                      <option value={getNextRound(selectedOrder, selectedStage)}>
                        New Round ({getNextRound(selectedOrder, selectedStage)})
                      </option>
                    </select>
                  </div>
                  <button
                    onClick={() => setSelectedRound(getNextRound(selectedOrder, selectedStage))}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Start New Round
                  </button>
                  <button
                    onClick={handleCloseOrder}
                    disabled={orderTestResults.length === 0}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Close Order
                  </button>
                </div>
              </div>
              
              {/* Round Summary */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Current Stage: {selectedStage}</h4>
                
                {/* Stage Progress Overview */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{selectedStage} Progress</span>
                    <span className="text-xs text-gray-600">
                      {(() => {
                        const status = getStageCompletionStatus(selectedOrder, selectedStage);
                        return `${status.completedCount}/${status.totalParameters} parameters completed`;
                      })()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(() => {
                          const status = getStageCompletionStatus(selectedOrder, selectedStage);
                          return status.totalParameters > 0 ? (status.completedCount / status.totalParameters) * 100 : 0;
                        })()}%` 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Rounds for Current Stage */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {getAvailableRounds(selectedOrder, selectedStage).map(round => {
                    const roundResults = getRoundTestResults(selectedOrder, selectedStage, round);
                    const completedCount = roundResults.length;
                    const passCount = roundResults.filter(r => r.status === 'pass').length;
                    const warningCount = roundResults.filter(r => r.status === 'warning').length;
                    const failCount = roundResults.filter(r => r.status === 'fail').length;
                    
                    return (
                      <div 
                        key={round} 
                        className={`p-3 rounded-lg border ${
                          round === selectedRound 
                            ? 'border-blue-300 bg-blue-50' 
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{selectedStage} Round {round}</span>
                          {round === selectedRound && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Current</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>Completed: {completedCount}/{productParameters.length}</div>
                          <div className="flex space-x-2">
                            <span className="text-green-600">✓ {passCount}</span>
                            <span className="text-amber-600">⚠ {warningCount}</span>
                            <span className="text-red-600">✗ {failCount}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* All Stages Overview */}
                <div className="mt-6">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">All Stages Progress</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {testStages.map(stage => {
                      const status = getStageCompletionStatus(selectedOrder, stage.name);
                      const isCurrentStage = stage.name === selectedStage;
                      
                      return (
                        <div 
                          key={stage.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            isCurrentStage 
                              ? 'border-blue-300 bg-blue-50' 
                              : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={() => setSelectedStage(stage.name)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{stage.name}</span>
                            {isCurrentStage && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Current</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>Parameters: {status.completedCount}/{status.totalParameters}</div>
                            <div className="flex space-x-2">
                              <span className="text-green-600">✓ {status.passCount}</span>
                              <span className="text-amber-600">⚠ {status.warningCount}</span>
                              <span className="text-red-600">✗ {status.failCount}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Rounds: {getAvailableRounds(selectedOrder, stage.name).length}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Order Completion Status */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-medium text-gray-900">Order Completion Status</h5>
                    <div className="text-xs text-gray-600 mt-1">
                      {(() => {
                        const allRoundsResults = orderTestResults;
                        const testedParameters = [...new Set(allRoundsResults.map(result => result.parameterId))];
                        const failedTests = allRoundsResults.filter(test => test.status === 'fail');
                        const isComplete = testedParameters.length >= productParameters.length;
                        
                        // Calculate total rounds across all stages
                        const totalRounds = testStages.reduce((total, stage) => {
                          return total + getAvailableRounds(selectedOrder, stage.name).length;
                        }, 0);
                        
                        // Calculate overall progress across all stages
                        const overallProgress = testStages.reduce((progress, stage) => {
                          const status = getStageCompletionStatus(selectedOrder, stage.name);
                          return {
                            completed: progress.completed + status.completedCount,
                            total: progress.total + status.totalParameters
                          };
                        }, { completed: 0, total: 0 });
                        
                        return (
                          <div className="space-y-1">
                            <div>Parameters Tested: {overallProgress.completed}/{overallProgress.total}</div>
                            <div>Total Tests: {allRoundsResults.length}</div>
                            <div>Total Rounds: {totalRounds}</div>
                            <div>Failed Tests: {failedTests.length}</div>
                            <div className={`font-medium ${isComplete ? 'text-green-600' : 'text-amber-600'}`}>
                              Status: {isComplete ? 'Ready to Close' : 'In Progress'}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="text-right">
                    {(() => {
                      const allRoundsResults = orderTestResults;
                      const testedParameters = [...new Set(allRoundsResults.map(result => result.parameterId))];
                      const isComplete = testedParameters.length >= productParameters.length;
                      
                      return (
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                          isComplete ? 'bg-green-100' : 'bg-amber-100'
                        }`}>
                          <span className={`text-2xl ${isComplete ? 'text-green-600' : 'text-amber-600'}`}>
                            {isComplete ? '✓' : '⋯'}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setActiveTab('entry')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'entry'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Test Entry
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  disabled={!selectedOrder}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'history' && selectedOrder
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Test History
                </button>
                <button
                  onClick={() => setActiveTab('material')}
                  disabled={!selectedOrder}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'material' && selectedOrder
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Material Input
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'entry' && (
                <TestForm
                  orderNumber={selectedOrder}
                  parameters={productParameters}
                  existingResults={getRoundTestResults(selectedOrder, selectedStage, selectedRound)}
                  selectedRound={selectedRound}
                  selectedStage={selectedStage}
                  onAddResult={handleAddTestResult}
                  onSaveDraft={handleSaveDraft}
                  disabled={!selectedOrder}
                />
              )}

              {activeTab === 'history' && selectedOrder && (
                <TestHistory
                  orderNumber={selectedOrder}
                  testResults={orderTestResults}
                  parameters={productParameters}
                />
              )}

              {activeTab === 'material' && selectedOrder && (
                <MaterialInputView
                  batchId={selectedOrder}
                  productName={productName}
                />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Today's Progress
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tests Entered</span>
                <span className="text-sm font-medium text-gray-900">
                  {orderTestResults.filter(test => {
                    const today = new Date().toDateString();
                    return new Date(test.timestamp).toDateString() === today;
                  }).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Orders Processed</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Set(orderTestResults.map(test => test.orderNumber)).size}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pass Rate</span>
                <span className="text-sm font-medium text-green-600">
                  {orderTestResults.length > 0 
                    ? ((orderTestResults.filter(test => test.status === 'pass').length / orderTestResults.length) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Draft Results */}
          {draftResults.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Draft Results
              </h3>
              <div className="space-y-2">
                {draftResults.map((draft, index) => (
                  <div key={index} className="text-sm p-2 bg-amber-50 border border-amber-200 rounded">
                    <div className="font-medium">{draft.orderNumber}</div>
                    <div className="text-amber-700">Parameter: {draft.parameterId}</div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-3 px-3 py-2 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors">
                Save All Drafts
              </button>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Test Results
            </h3>
            <div className="space-y-3">
              {orderTestResults.slice(0, 5).map((test) => {
                const parameter = productParameters.find(p => p.parameter_name === test.parameterId);
                return (
                  <div key={test.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {test.orderNumber}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        test.status === 'pass' 
                          ? 'bg-green-100 text-green-800'
                          : test.status === 'warning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {test.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {parameter?.parameter_name}: {test.value} {parameter?.unit}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(test.timestamp).toLocaleString()}
                    </div>
                  </div>
                );
              })}
              {orderTestResults.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-4">
                  No test results yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestEntry;