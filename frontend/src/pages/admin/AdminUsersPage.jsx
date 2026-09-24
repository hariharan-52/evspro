import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Trash2, Power, Eye } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/helpers';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState(''); // 'toggle_status' or 'delete'

  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const query = `?search=${search}&role=${roleFilter}&status=${statusFilter}&page=${currentPage}`;
      const res = await api.get(`/users${query}`);
      setUsers(res.data.users || []);
      setTotalPages(res.data.totalPages || Math.ceil((res.data.total || 0) / (res.data.limit || 20)) || 1);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toast.error('Failed to load users from server');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const openModal = (user, type) => {
    setSelectedUser(user);
    setActionType(type);
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    try {
      if (actionType === 'delete') {
        await api.delete(`/users/${selectedUser.id}`);
        toast.success('User deleted successfully');
      } else if (actionType === 'toggle_status') {
        const newStatus = selectedUser.status === 'active' ? 'inactive' : 'active';
        await api.patch(`/users/${selectedUser.id}/status`, { status: newStatus });
        toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      }
      setShowConfirmModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'user': return 'bg-green-100 text-green-800';
      case 'ngo': return 'bg-blue-100 text-blue-800';
      case 'scrapdealer': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
        <p className="text-gray-500">Manage all registered users, NGOs, and scrap dealers.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleSearch} className="flex w-full md:w-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 w-full md:w-64 text-sm"
            />
            <button type="submit" className="ml-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">Search</button>
          </form>

          <div className="flex gap-4 w-full md:w-auto">
            <select 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500 flex-1 md:flex-none"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="ngo">NGO</option>
              <option value="scrapdealer">Scrap Dealer</option>
              <option value="admin">Admin</option>
            </select>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500 flex-1 md:flex-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12"><LoadingSpinner size="large" /></div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">City</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Joined</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{u.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{u.email}</p>
                      <p className="text-gray-500 text-xs">{u.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase ${getRoleBadgeColor(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{u.city || '-'}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openModal(u, 'toggle_status')} 
                          className={`p-1.5 rounded-md ${u.status === 'active' ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`}
                          title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          <Power size={18} />
                        </button>
                        <button 
                          onClick={() => openModal(u, 'delete')}
                          className="p-1.5 rounded-md text-red-600 hover:bg-red-50"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">No users found matching your criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {currentPage} of {totalPages}</p>
            <div className="flex gap-2">
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmAction}
        title={actionType === 'delete' ? 'Delete User' : `${selectedUser?.status === 'active' ? 'Deactivate' : 'Activate'} User`}
        message={
          actionType === 'delete' 
            ? `Are you sure you want to permanently delete ${selectedUser?.name}? This action cannot be undone.` 
            : `Are you sure you want to ${selectedUser?.status === 'active' ? 'deactivate' : 'activate'} ${selectedUser?.name}?`
        }
        confirmText={actionType === 'delete' ? 'Delete' : 'Confirm'}
        variant={actionType === 'delete' || selectedUser?.status === 'active' ? 'danger' : 'success'}
      />
    </div>
  );
};

export default AdminUsersPage;
