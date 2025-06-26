import React, { useState, useEffect, useCallback } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { adminService } from '../services/adminService';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ThemeToggle } from './ui/theme-toggle';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { UserPlus, FileUp } from 'lucide-react';


const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const getFileExtension = (mimeType) => {
    const mimeMap = {
        'application/vnd.ms-excel': 'XLS',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    };
    return mimeMap[mimeType] || mimeType;
}

function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalFiles: 0, averageFileSize: 0, fileTypes: {}, totalCharts: 0 });
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'user' });
  const navigate = useNavigate();

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, usersData, activityData] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(debouncedSearchQuery),
        adminService.getActivity(),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setActivities(activityData);
      setError('');
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const addedUser = await adminService.addUser(newUser);
      setUsers([...users, addedUser]);
      setShowAddUserDialog(false);
      setNewUser({ username: '', email: '', password: '', role: 'user' });
      toast.success('User added successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to add user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminService.deleteUser(userId);
        setUsers(users.filter(user => user._id !== userId));
        toast.success('User deleted successfully');
      } catch (err) {
        toast.error(err.message || 'Failed to delete user');
      }
    }
  };

  const handleNewUserChange = (e) => {
    setNewUser({ ...newUser, [e.target.id]: e.target.value });
  };

  const handleLogout = () => {
    authService.logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">Loading Admin Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <nav className="bg-card shadow-md dark:bg-black dark:border-b dark:border-green-800">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <h1 className="text-xl font-bold text-green-700 dark:text-green-400">Admin Panel</h1>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
                </div>
            </div>
        </nav>

        <div className="container mx-auto p-4">
            {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}

            {/* Stats Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Files Uploaded</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalFiles}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Charts Created</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCharts}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average File Size</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatBytes(stats.averageFileSize)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">File Types Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.fileTypes && Object.keys(stats.fileTypes).length > 0 ? (
                            Object.entries(stats.fileTypes).map(([type, count]) => (
                                <div key={type} className="text-sm flex justify-between">
                                    <span>{getFileExtension(type)}:</span>
                                    <span className="font-semibold">{count}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-gray-500">No files uploaded yet.</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 mt-6">
                {/* Users Table Section */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>User Management</CardTitle>
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="max-w-sm"
                            />
                            <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
                                <DialogTrigger asChild>
                                    <Button>Add New User</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add a New User</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleAddUser} className="space-y-4">
                                        <div>
                                            <Label htmlFor="username">Username</Label>
                                            <Input id="username" value={newUser.username} onChange={handleNewUserChange} required />
                                        </div>
                                        <div>
                                            <Label htmlFor="email">Email</Label>
                                            <Input id="email" type="email" value={newUser.email} onChange={handleNewUserChange} required />
                                        </div>
                                        <div>
                                            <Label htmlFor="password">Password</Label>
                                            <Input id="password" type="password" value={newUser.password} onChange={handleNewUserChange} required />
                                        </div>
                                        <div>
                                            <Label htmlFor="role">Role</Label>
                                            <select id="role" value={newUser.role} onChange={handleNewUserChange} className="w-full p-2 border rounded">
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit">Add User</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                    {users.length > 0 ? (
                                        users.map((user) => (
                                            <tr key={user._id}>
                                                <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user._id)}>Delete</Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                                No users found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activities.length > 0 ? (
                            <ul className="space-y-4">
                                {activities.map((activity) => (
                                    <li key={activity._id} className="flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            {activity.type === 'user-registration' ? (
                                                <UserPlus className="h-6 w-6 text-green-500" />
                                            ) : (
                                                <FileUp className="h-6 w-6 text-blue-500" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{activity.message}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(activity.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500">No recent activity.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}

export default AdminDashboard;
