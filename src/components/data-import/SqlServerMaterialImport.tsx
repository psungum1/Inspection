import React, { useState } from 'react';

const allColumns = [
  { key: 'Batch_Log_ID', label: 'Batch Log ID' },
  { key: 'Campaign_ID', label: 'Campaign ID' },
  { key: 'Lot_ID', label: 'Lot ID' },
  { key: 'Batch_ID', label: 'Batch ID' },
  { key: 'Product_ID', label: 'Product ID' },
  { key: 'Product_Name', label: 'Product Name' },
  { key: 'Recipe_ID', label: 'Recipe ID' },
  { key: 'Recipe_Name', label: 'Recipe Name' },
  { key: 'Recipe_Version', label: 'Recipe Version' },
  { key: 'Recipe_State', label: 'Recipe State' },
  { key: 'Recipe_Type', label: 'Recipe Type' },
  { key: 'Recipe_Approval_CD', label: 'Recipe Approval CD' },
  { key: 'Train_ID', label: 'Train ID' },
  { key: 'Batch_Size', label: 'Batch Size' },
  { key: 'Archive_CD', label: 'Archive CD' },
  { key: 'Log_Open_DT', label: 'Log Open DT' },
  { key: 'Log_Close_DT', label: 'Log Close DT' },
  { key: 'Batch_Server_Name', label: 'Batch Server Name' },
  { key: 'Formula_Name', label: 'Formula Name' },
  { key: 'Batch_Auto_Start', label: 'Batch Auto Start' },
  { key: 'Log_Open_DT_UTC', label: 'Log Open DT UTC' },
  { key: 'Log_Close_DT_UTC', label: 'Log Close DT UTC' },
];

const PAGE_SIZE = 10;

const SqlServerMaterialImport: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [visibleCols, setVisibleCols] = useState(allColumns.map(col => col.key));
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Load data from SQL Server
  const handleLoad = async () => {
    setLoading(true);
    setMessage('');
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const url = `http://localhost:3001/api/sqlserver/material-inputs${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      const result = await res.json();
      setData(result);
      setPage(1);
    } catch (err) {
      setMessage('Failed to load data from SQL Server');
    }
    setLoading(false);
  };

  // Import data to PostgreSQL
  const handleImport = async () => {
    setImporting(true);
    setMessage('');
    try {
      const res = await fetch('http://localhost:3001/api/import/plc-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      const result = await res.json();
      setMessage(result.message || result.error);
    } catch (err) {
      setMessage('Failed to import data');
    }
    setImporting(false);
  };

  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const pagedData = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleColToggle = (key: string) => {
    setVisibleCols(cols =>
      cols.includes(key) ? cols.filter(c => c !== key) : [...cols, key]
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-4">Import Material Inputs from SQL Server</h2>
      
      {/* Date Filter Controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Date Filter</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleLoad}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load from SQL Server'}
            </button>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setData([]);
                  setMessage('');
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>
        {(startDate || endDate) && (
          <div className="mt-2 text-sm text-gray-600">
            Filtering by: {startDate && `From ${startDate}`} {startDate && endDate && 'to'} {endDate && `To ${endDate}`}
          </div>
        )}
      </div>
      
      <div className="mb-4 flex gap-4">
        {data.length > 0 && (
          <button
            onClick={handleImport}
            disabled={importing}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {importing ? 'Importing...' : 'Import to PostgreSQL'}
          </button>
        )}
      </div>
      {message && <div className="mb-4 text-blue-700">{message}</div>}
      {/* Column Selector */}
      {data.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {allColumns.map(col => (
            <label key={col.key} className="text-sm mr-2">
              <input
                type="checkbox"
                checked={visibleCols.includes(col.key)}
                onChange={() => handleColToggle(col.key)}
                className="mr-1"
              />
              {col.label}
            </label>
          ))}
        </div>
      )}
      {/* Table */}
      {data.length > 0 && (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-xs">
            <thead>
              <tr>
                {allColumns
                  .filter(col => visibleCols.includes(col.key))
                  .map(col => (
                    <th key={col.key} className="px-3 py-2 bg-gray-100 border-b font-semibold text-gray-700">
                      {col.label}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {pagedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-blue-50">
                  {allColumns
                    .filter(col => visibleCols.includes(col.key))
                    .map(col => (
                      <td key={col.key} className="px-3 py-2 border-b">
                        {row[col.key]}
                      </td>
                    ))}
                </tr>
              ))}
              {pagedData.length === 0 && (
                <tr>
                  <td colSpan={visibleCols.length} className="text-center py-4 text-gray-400">
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* Pagination */}
      {data.length > 0 && (
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <div>
            <button
              className="px-3 py-1 mr-2 bg-gray-200 rounded disabled:opacity-50"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Prev
            </button>
            <button
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SqlServerMaterialImport; 