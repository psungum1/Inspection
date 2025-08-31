import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import apiService from '../../utils/api';

interface TestStage {
  id: number;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const TestStageManager: React.FC = () => {
  const { state, dispatch } = useApp();
  const [stages, setStages] = useState<TestStage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingStage, setEditingStage] = useState<TestStage | null>(null);
  const [newStage, setNewStage] = useState({
    name: '',
    description: '',
    order: 0
  });

  useEffect(() => {
    loadTestStages();
  }, []);

  const loadTestStages = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getTestStages();
      
      if (response.error) {
        dispatch({ type: 'SET_ERROR', payload: response.error });
        return;
      }

      if (response.data) {
        setStages(response.data.sort((a: TestStage, b: TestStage) => a.order - b.order));
      }
    } catch (error) {
      console.error('Error loading test stages:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load test stages' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStage = async () => {
    if (!newStage.name.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Stage name is required' });
      return;
    }

    try {
      const response = await apiService.createTestStage({
        name: newStage.name.trim(),
        description: newStage.description.trim(),
        order: newStage.order || stages.length + 1
      });

      if (response.error) {
        dispatch({ type: 'SET_ERROR', payload: response.error });
        return;
      }

      if (response.data) {
        dispatch({ type: 'SET_SUCCESS', payload: 'Test stage created successfully' });
        setNewStage({ name: '', description: '', order: 0 });
        loadTestStages();
      }
    } catch (error) {
      console.error('Error creating test stage:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create test stage' });
    }
  };

  const handleUpdateStage = async () => {
    if (!editingStage || !editingStage.name.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Stage name is required' });
      return;
    }

    try {
      const response = await apiService.updateTestStage(editingStage.id, {
        name: editingStage.name.trim(),
        description: editingStage.description?.trim(),
        order: editingStage.order
      });

      if (response.error) {
        dispatch({ type: 'SET_ERROR', payload: response.error });
        return;
      }

      if (response.data) {
        dispatch({ type: 'SET_SUCCESS', payload: 'Test stage updated successfully' });
        setEditingStage(null);
        loadTestStages();
      }
    } catch (error) {
      console.error('Error updating test stage:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update test stage' });
    }
  };

  const handleDeleteStage = async (stageId: number) => {
    if (!confirm('Are you sure you want to delete this test stage? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiService.deleteTestStage(stageId);

      if (response.error) {
        dispatch({ type: 'SET_ERROR', payload: response.error });
        return;
      }

      dispatch({ type: 'SET_SUCCESS', payload: 'Test stage deleted successfully' });
      loadTestStages();
    } catch (error) {
      console.error('Error deleting test stage:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete test stage' });
    }
  };

  const handleToggleActive = async (stage: TestStage) => {
    try {
      const response = await apiService.updateTestStage(stage.id, {
        ...stage,
        isActive: !stage.isActive
      });

      if (response.error) {
        dispatch({ type: 'SET_ERROR', payload: response.error });
        return;
      }

      if (response.data) {
        dispatch({ type: 'SET_SUCCESS', payload: 'Test stage status updated successfully' });
        loadTestStages();
      }
    } catch (error) {
      console.error('Error updating test stage status:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update test stage status' });
    }
  };

  const handleReorder = async (stageId: number, newOrder: number) => {
    try {
      const response = await apiService.updateTestStage(stageId, { order: newOrder });

      if (response.error) {
        dispatch({ type: 'SET_ERROR', payload: response.error });
        return;
      }

      loadTestStages();
    } catch (error) {
      console.error('Error reordering test stage:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to reorder test stage' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Test Stage Management
        </h2>
        <p className="text-gray-600">
          Manage test stages for quality control rounds
        </p>
      </div>

      {/* Create New Stage */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Test Stage</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="stage-name" className="block text-sm font-medium text-gray-700 mb-2">
              Stage Name *
            </label>
            <input
              type="text"
              id="stage-name"
              value={newStage.name}
              onChange={(e) => setNewStage({ ...newStage, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Slurry, Reaction"
            />
          </div>
          <div>
            <label htmlFor="stage-description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              id="stage-description"
              value={newStage.description}
              onChange={(e) => setNewStage({ ...newStage, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional description"
            />
          </div>
          <div>
            <label htmlFor="stage-order" className="block text-sm font-medium text-gray-700 mb-2">
              Order
            </label>
            <input
              type="number"
              id="stage-order"
              value={newStage.order}
              onChange={(e) => setNewStage({ ...newStage, order: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Display order"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleCreateStage}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create Stage
          </button>
        </div>
      </div>

      {/* Stages List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Test Stages</h3>
        </div>
        
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading test stages...</p>
          </div>
        ) : stages.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No test stages found. Create your first stage above.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {stages.map((stage) => (
              <div key={stage.id} className="p-6">
                {editingStage?.id === stage.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <input
                        type="text"
                        value={editingStage.name}
                        onChange={(e) => setEditingStage({ ...editingStage, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={editingStage.description || ''}
                        onChange={(e) => setEditingStage({ ...editingStage, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={editingStage.order}
                        onChange={(e) => setEditingStage({ ...editingStage, order: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleUpdateStage}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingStage(null)}
                        className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div className="md:col-span-2">
                      <div className="font-medium text-gray-900">{stage.name}</div>
                      {stage.description && (
                        <div className="text-sm text-gray-500">{stage.description}</div>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">Order: {stage.order}</div>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        stage.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {stage.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(stage.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingStage(stage)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(stage)}
                        className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                          stage.isActive
                            ? 'bg-amber-600 text-white hover:bg-amber-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {stage.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteStage(stage.id)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestStageManager;
