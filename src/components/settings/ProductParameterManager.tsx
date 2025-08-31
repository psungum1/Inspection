import React, { useState, useEffect } from 'react';
import { ProductParameterMapping } from '../../types';
import apiService from '../../utils/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ProductParameterManager: React.FC = () => {
  const [mappings, setMappings] = useState<ProductParameterMapping[]>([]);
  const [form, setForm] = useState({
    product_name: '',
    parameter_name: '',
    parameter_order: 1,
    unit: '',
    acceptable_min: '',
    acceptable_max: '',
    warning_min: '',
    warning_max: '',
    critical_min: '',
    critical_max: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMappings = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/product-parameters`)
      .then(res => res.json())
      .then(data => {
        setMappings(data);
        setLoading(false);
      })
      .catch(() => {
        setMappings([]);
        setLoading(false);
      });
  };

  useEffect(() => { fetchMappings(); }, []);

  const handleAdd = () => {
    if (!form.product_name || !form.parameter_name) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/product-parameters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
      .then(() => {
        fetchMappings();
        setForm({
          product_name: '',
          parameter_name: '',
          parameter_order: 1,
          unit: '',
          acceptable_min: '',
          acceptable_max: '',
          warning_min: '',
          warning_max: '',
          critical_min: '',
          critical_max: ''
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleDelete = (id: number) => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/product-parameters/${id}`, { method: 'DELETE' })
      .then(() => fetchMappings())
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Product-Parameter Mapping</h3>
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <input
          className="border px-2 py-1 rounded"
          placeholder="Product Name"
          value={form.product_name}
          onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))}
        />
        <input
          className="border px-2 py-1 rounded"
          placeholder="Parameter Name"
          value={form.parameter_name}
          onChange={e => setForm(f => ({ ...f, parameter_name: e.target.value }))}
        />
        <input
          className="border px-2 py-1 rounded w-20"
          placeholder="Unit"
          value={form.unit}
          onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
        />
        <input
          className="border px-2 py-1 rounded w-24"
          type="number"
          min={1}
          placeholder="Order"
          value={form.parameter_order}
          onChange={e => setForm(f => ({ ...f, parameter_order: Number(e.target.value) }))}
        />
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input className="border px-2 py-1 rounded w-28" type="number" step="any" placeholder="Acceptable Min" value={form.acceptable_min} onChange={e => setForm(f => ({ ...f, acceptable_min: e.target.value }))} />
        <input className="border px-2 py-1 rounded w-28" type="number" step="any" placeholder="Acceptable Max" value={form.acceptable_max} onChange={e => setForm(f => ({ ...f, acceptable_max: e.target.value }))} />
        <input className="border px-2 py-1 rounded w-28" type="number" step="any" placeholder="Warning Min" value={form.warning_min} onChange={e => setForm(f => ({ ...f, warning_min: e.target.value }))} />
        <input className="border px-2 py-1 rounded w-28" type="number" step="any" placeholder="Warning Max" value={form.warning_max} onChange={e => setForm(f => ({ ...f, warning_max: e.target.value }))} />
        <input className="border px-2 py-1 rounded w-28" type="number" step="any" placeholder="Critical Min" value={form.critical_min} onChange={e => setForm(f => ({ ...f, critical_min: e.target.value }))} />
        <input className="border px-2 py-1 rounded w-28" type="number" step="any" placeholder="Critical Max" value={form.critical_max} onChange={e => setForm(f => ({ ...f, critical_max: e.target.value }))} />
        <button
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
          onClick={handleAdd}
          disabled={loading}
        >
          Add
        </button>
      </div>
      {loading && <div className="text-blue-600">Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <table className="min-w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Product Name</th>
            <th className="border px-2 py-1">Parameter Name</th>
            <th className="border px-2 py-1">Unit</th>
            <th className="border px-2 py-1">Order</th>
            <th className="border px-2 py-1">Acceptable</th>
            <th className="border px-2 py-1">Warning</th>
            <th className="border px-2 py-1">Critical</th>
            <th className="border px-2 py-1">Action</th>
          </tr>
        </thead>
        <tbody>
          {mappings.map(m => (
            <tr key={m.id}>
              <td className="border px-2 py-1">{m.product_name}</td>
              <td className="border px-2 py-1">{m.parameter_name}</td>
              <td className="border px-2 py-1">{m.unit || '-'}</td>
              <td className="border px-2 py-1">{m.parameter_order}</td>
              <td className="border px-2 py-1">{m.acceptable_min} - {m.acceptable_max}</td>
              <td className="border px-2 py-1">{m.warning_min} - {m.warning_max}</td>
              <td className="border px-2 py-1">{m.critical_min} - {m.critical_max}</td>
              <td className="border px-2 py-1">
                <button
                  className="text-red-600 hover:underline"
                  onClick={() => handleDelete(m.id)}
                  disabled={loading}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {mappings.length === 0 && (
            <tr><td colSpan={7} className="text-center py-2">No mapping found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProductParameterManager; 