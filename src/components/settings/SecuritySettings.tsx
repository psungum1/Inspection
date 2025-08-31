import React, { useState } from 'react';
import { Shield, Key, Users, AlertTriangle } from 'lucide-react';

interface SecuritySettingsProps {
  onChange: () => void;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({ onChange }) => {
  const [passwordPolicy, setPasswordPolicy] = useState({
    minLength: 12,
    requireSpecialChars: true,
    requireNumbers: true,
    requireUppercase: true,
    sessionTimeout: 30
  });

  const mockUsers = [
    { id: '1', name: 'John Smith', email: 'john@company.com', role: 'qc_manager', active: true },
    { id: '2', name: 'Maria Rodriguez', email: 'maria@company.com', role: 'operator', active: true },
    { id: '3', name: 'Chen Wei', email: 'chen@company.com', role: 'operator', active: true },
    { id: '4', name: 'Sarah Johnson', email: 'sarah@company.com', role: 'admin', active: false }
  ];

  const handlePolicyChange = (field: string, value: any) => {
    setPasswordPolicy(prev => ({
      ...prev,
      [field]: value
    }));
    onChange();
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      qc_manager: 'bg-blue-100 text-blue-800',
      operator: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800'
    };
    return colors[role as keyof typeof colors] || colors.viewer;
  };

  return (
    <div className="space-y-8">
      {/* Password Policy */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Key className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Password Policy</h3>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Password Length
              </label>
              <input
                type="number"
                min="8"
                max="32"
                value={passwordPolicy.minLength}
                onChange={(e) => handlePolicyChange('minLength', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={passwordPolicy.sessionTimeout}
                onChange={(e) => handlePolicyChange('sessionTimeout', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">
                  Require Special Characters
                </label>
                <p className="text-sm text-gray-500">
                  Password must contain at least one special character
                </p>
              </div>
              <input
                type="checkbox"
                checked={passwordPolicy.requireSpecialChars}
                onChange={(e) => handlePolicyChange('requireSpecialChars', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">
                  Require Numbers
                </label>
                <p className="text-sm text-gray-500">
                  Password must contain at least one number
                </p>
              </div>
              <input
                type="checkbox"
                checked={passwordPolicy.requireNumbers}
                onChange={(e) => handlePolicyChange('requireNumbers', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">
                  Require Uppercase Letters
                </label>
                <p className="text-sm text-gray-500">
                  Password must contain at least one uppercase letter
                </p>
              </div>
              <input
                type="checkbox"
                checked={passwordPolicy.requireUppercase}
                onChange={(e) => handlePolicyChange('requireUppercase', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>
      </div>

      {/* User Management */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
            Add User
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-4">
                      Edit
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      {user.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900">
                Enhanced Security Recommended
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                Enable two-factor authentication for all users with admin or QC manager roles to enhance system security.
              </p>
              <div className="mt-3 flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enforce-2fa"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="enforce-2fa" className="ml-2 text-sm text-blue-900">
                    Enforce 2FA for Admin/QC Manager roles
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;