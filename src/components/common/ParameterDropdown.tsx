import React, { useState, useEffect } from 'react';
import { apiService } from '../../utils/api';

interface ParameterDropdownProps {
  value: string;
  onChange: (parameterId: string) => void;
  batchId?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

const ParameterDropdown: React.FC<ParameterDropdownProps> = ({
  value,
  onChange,
  batchId,
  placeholder = 'Select Parameter',
  disabled = false,
  className = '',
  required = false
}) => {
  const [parameters, setParameters] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchParameters = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiService.getParameterIds(batchId);
        
        if (response.error) {
          setError(response.error);
        } else if (response.data) {
          setParameters(response.data);
        }
      } catch (err) {
        setError('Failed to load parameters');
        console.error('Error fetching parameters:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchParameters();
  }, [batchId]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="w-full">
      <select
        value={value}
        onChange={handleChange}
        disabled={disabled || loading}
        required={required}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`}
      >
        <option value="">
          {loading 
            ? 'Loading parameters...' 
            : error 
              ? 'Error loading parameters' 
              : parameters.length === 0 
                ? 'No parameters available' 
                : placeholder
          }
        </option>
        {parameters.map((parameterId) => (
          <option key={parameterId} value={parameterId}>
            {parameterId}
          </option>
        ))}
      </select>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

export default ParameterDropdown; 