import React from 'react';
import { Clock, User, MessageSquare } from 'lucide-react';
import { TestResult, ProductParameterMapping } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface TestHistoryProps {
  orderNumber: string;
  testResults: TestResult[];
  parameters: ProductParameterMapping[];
}

const TestHistory: React.FC<TestHistoryProps> = ({ orderNumber, testResults, parameters }) => {
  const getParameterName = (parameterId: string) => {
    return parameters.find(p => p.parameter_name === parameterId)?.parameter_name || parameterId;
  };

  const getParameterUnit = (parameterId: string) => {
    return parameters.find(p => p.parameter_name === parameterId)?.unit || '';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'fail':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const sortedResults = [...testResults].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Group results by stage and round
  const resultsByStageAndRound = sortedResults.reduce((acc, result) => {
    const stage = result.stage || 'Unknown Stage';
    if (!acc[stage]) {
      acc[stage] = {};
    }
    if (!acc[stage][result.round]) {
      acc[stage][result.round] = [];
    }
    acc[stage][result.round].push(result);
    return acc;
  }, {} as Record<string, Record<number, TestResult[]>>);

  const stages = Object.keys(resultsByStageAndRound).sort();

  if (testResults.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Test Results</h3>
        <p className="text-gray-600">
          No test results have been recorded for this order yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Test History for {orderNumber}
        </h3>
        <span className="text-sm text-gray-600">
          {testResults.length} test{testResults.length !== 1 ? 's' : ''} recorded
        </span>
      </div>

      {stages.map((stage) => {
        const stageResults = resultsByStageAndRound[stage];
        const stageRounds = Object.keys(stageResults).map(Number).sort((a, b) => b - a);
        
        return (
          <div key={stage} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">
                {stage}
              </h4>
              <span className="text-sm text-gray-600">
                {stageRounds.reduce((total, round) => total + stageResults[round].length, 0)} test{stageRounds.reduce((total, round) => total + stageResults[round].length, 0) !== 1 ? 's' : ''} across {stageRounds.length} round{stageRounds.length !== 1 ? 's' : ''}
              </span>
            </div>

            {stageRounds.map((round) => (
              <div key={round} className="mb-6 last:mb-0">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-md font-medium text-gray-700">
                    Round {round}
                  </h5>
                  <span className="text-sm text-gray-600">
                    {stageResults[round].length} test{stageResults[round].length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-3">
                  {stageResults[round].map((result) => (
                    <div key={result.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h6 className="text-base font-medium text-gray-900">
                              {getParameterName(result.parameterId)}
                            </h6>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(result.status)}`}>
                              {result.status.toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div>
                              <span className="text-sm text-gray-500">Test Value</span>
                              <div className="text-lg font-semibold text-gray-900">
                                {result.value} {getParameterUnit(result.parameterId)}
                              </div>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Operator</span>
                              <div className="text-sm font-medium text-gray-900 flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>{result.operatorId}</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Timestamp</span>
                              <div className="text-sm font-medium text-gray-900 flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatDistanceToNow(new Date(result.timestamp), { addSuffix: true })}</span>
                              </div>
                            </div>
                          </div>

                          {result.comments && (
                            <div className="bg-white rounded-lg p-3">
                              <div className="flex items-start space-x-2">
                                <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                                <div>
                                  <span className="text-xs text-gray-500 font-medium">Comments:</span>
                                  <p className="text-sm text-gray-700 mt-1">{result.comments}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Round Summary */}
                <div className="mt-4 bg-blue-50 rounded-lg p-3">
                  <h6 className="text-sm font-medium text-blue-900 mb-2">{stage} Round {round} Summary</h6>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {stageResults[round].filter(r => r.status === 'pass').length}
                      </div>
                      <div className="text-xs text-gray-500">Passed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-amber-600">
                        {stageResults[round].filter(r => r.status === 'warning').length}
                      </div>
                      <div className="text-xs text-gray-500">Warning</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">
                        {stageResults[round].filter(r => r.status === 'fail').length}
                      </div>
                      <div className="text-xs text-gray-500">Failed</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Stage Summary */}
            <div className="mt-4 bg-green-50 rounded-lg p-3">
              <h5 className="text-sm font-medium text-green-900 mb-2">{stage} Overall Summary</h5>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {stageRounds.reduce((total, round) => total + stageResults[round].filter(r => r.status === 'pass').length, 0)}
                  </div>
                  <div className="text-xs text-gray-500">Total Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-600">
                    {stageRounds.reduce((total, round) => total + stageResults[round].filter(r => r.status === 'warning').length, 0)}
                  </div>
                  <div className="text-xs text-gray-500">Total Warnings</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">
                    {stageRounds.reduce((total, round) => total + stageResults[round].filter(r => r.status === 'fail').length, 0)}
                  </div>
                  <div className="text-xs text-gray-500">Total Failed</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TestHistory;