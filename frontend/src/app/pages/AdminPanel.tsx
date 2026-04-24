import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Switch } from '../components/ui/switch';
import { Button } from '../components/ui/button';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface User {
  _id: string;
  username: string;
  role: string;
  permissions: string[];
}

const ALL_COMPONENTS = ['Overview', 'Soil Moisture', 'Temperature', 'Air Quality', 'Light Monitor', 'System Health', 'Alerts', 'Settings', 'Admin Panel'];

const COMPONENT_ICONS: Record<string, string> = {
  'Overview': '📊',
  'Soil Moisture': '💧',
  'Temperature': '🌡️',
  'Air Quality': '🌬️',
  'Light Monitor': '☀️',
  'System Health': '⚙️',
  'Alerts': '🔔',
  'Settings': '⚙️',
  'Admin Panel': '👨‍💼'
};

export default function AdminPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Auto-clear messages after 4 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/auth/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users', err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      setError('Please enter both username and password');
      return;
    }
    
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      await axios.post('/api/auth/users', {
        username: newUsername,
        password: newPassword,
        permissions: []
      });
      setSuccess('User created successfully');
      setNewUsername('');
      setNewPassword('');
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creating user');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (userId: string, component: string, hasPermission: boolean) => {
    const targetUser = users.find(u => u._id === userId);
    if (!targetUser) return;
    
    let updatedPermissions = [...targetUser.permissions];
    if (hasPermission) {
      updatedPermissions = updatedPermissions.filter(p => p !== component);
    } else {
      updatedPermissions.push(component);
    }

    try {
      await axios.put(`/api/auth/users/${userId}/permissions`, {
        permissions: updatedPermissions
      });
      
      // Optimistically update UI
      setUsers(users.map(u => 
        u._id === userId ? { ...u, permissions: updatedPermissions } : u
      ));
    } catch (err) {
      console.error('Error updating permissions', err);
      setError('Failed to update permissions');
      // Refetch on error
      fetchUsers();
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-8 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 text-lg font-semibold">Access Denied</p>
          <p className="text-gray-600 mt-2">You do not have permission to access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Panel</h1>
        <p className="text-gray-600">Manage users and control access permissions</p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Create User Form */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 bg-white p-6 rounded-xl border border-gray-200 shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input 
                  type="text" 
                  value={newUsername} 
                  onChange={e => setNewUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32]/30 transition-all" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32]/30 transition-all" 
                  required 
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#2E7D32] hover:bg-[#27632a] disabled:bg-gray-400 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Users List */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Manage Users & Permissions</h2>
          <div className="space-y-4">
            {users.length === 0 ? (
              <div className="text-center py-12 bg-gray-100 border border-gray-200 rounded-xl">
                <p className="text-gray-600">No users found</p>
              </div>
            ) : (
              users.map(u => (
                <div 
                  key={u._id} 
                  className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {/* User Header */}
                  <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{u.username}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          u.role === 'admin' 
                            ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Permissions */}
                  {u.role !== 'admin' && (
                    <div>
                      <p className="text-sm text-gray-700 font-medium mb-4">Component Access</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {ALL_COMPONENTS.map(comp => {
                          const hasPermission = u.permissions.includes(comp);
                          return (
                            <div 
                              key={comp} 
                              className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
                            >
                              <label className="flex items-center gap-3 cursor-pointer flex-1">
                                <span className="text-lg">{COMPONENT_ICONS[comp]}</span>
                                <span className="text-sm text-gray-700">{comp}</span>
                              </label>
                              <Switch 
                                checked={hasPermission}
                                onCheckedChange={() => togglePermission(u._id, comp, hasPermission)}
                                className="ml-2"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {u.role === 'admin' && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 italic">Admin users have full access to all components</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
