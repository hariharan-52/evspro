import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Check,
  X,
  Eye,
  Trash2,
  Power,
  Clock,
  ShieldCheck,
  ShieldAlert,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react';
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

  // Status Tab selection: 'all' | 'pending' | 'active' | 'rejected'
  const [activeTab, setActiveTab] = useState('all');

  // Modals state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState(''); // 'approve' | 'reject' | 'toggle_status' | 'delete'
  const [rejectReason, setRejectReason] = useState('');
  const [viewUserModal, setViewUserModal] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter, activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const effectiveStatus = activeTab === 'all' ? statusFilter : activeTab;
      const query = `?search=${search}&role=${roleFilter}&status=${effectiveStatus}&page=${currentPage}&limit=20`;
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

  const openActionModal = (user, type) => {
    setSelectedUser(user);
    setActionType(type);
    setRejectReason('');
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedUser) return;
    try {
      if (actionType === 'delete') {
        await api.delete(`/users/${selectedUser.id}`);
        toast.success(`User ${selectedUser.name} deleted successfully`);
      } else if (actionType === 'approve') {
        await api.patch(`/users/${selectedUser.id}/status`, { status: 'active' });
        toast.success(`Account for ${selectedUser.name} approved successfully! User can now log in.`);
      } else if (actionType === 'reject') {
        await api.patch(`/users/${selectedUser.id}/status`, { status: 'rejected', reason: rejectReason });
        toast.success(`Account for ${selectedUser.name} rejected.`);
      } else if (actionType === 'toggle_status') {
        const newStatus = selectedUser.status === 'active' ? 'inactive' : 'active';
        await api.patch(`/users/${selectedUser.id}/status`, { status: newStatus });
        toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      }
      setShowConfirmModal(false);
      setSelectedUser(null);
      if (viewUserModal && viewUserModal.id === selectedUser.id) {
        setViewUserModal(null);
      }
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'user':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'ngo':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'scrapdealer':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'admin':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingCount = users.filter((u) => u.status === 'pending').length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Users & Account Approvals</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Review registration requests, approve pending accounts, and manage platform users.
          </p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-2 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'all'
              ? 'border-green-600 text-green-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All Accounts
        </button>

        <button
          onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock size={16} />
          <span>Pending Approval</span>
          {pendingCount > 0 && (
            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveTab('active'); setCurrentPage(1); }}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'active'
              ? 'border-green-600 text-green-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShieldCheck size={16} />
          <span>Approved / Active</span>
        </button>

        <button
          onClick={() => { setActiveTab('rejected'); setCurrentPage(1); }}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'rejected'
              ? 'border-red-600 text-red-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShieldAlert size={16} />
          <span>Rejected Accounts</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Search & Filters */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleSearch} className="flex w-full md:w-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-green-500 focus:border-green-500 w-full md:w-72 text-sm bg-white"
            />
            <button
              type="submit"
              className="ml-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-all"
            >
              Search
            </button>
          </form>

          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500 bg-white"
            >
              <option value="all">All Roles</option>
              <option value="user">User / Donor</option>
              <option value="ngo">NGO</option>
              <option value="scrapdealer">Scrap Dealer</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16"><LoadingSpinner size="large" /></div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">User / Account</th>
                  <th className="px-6 py-4 font-semibold">Contact Info</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Location</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Registered</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => {
                  const isPending = u.status === 'pending';
                  return (
                    <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${isPending ? 'bg-amber-50/20' : ''}`}>
                      {/* Name & ID */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                            u.role === 'admin' ? 'bg-red-100 text-red-700' :
                            u.role === 'ngo' ? 'bg-blue-100 text-blue-700' :
                            u.role === 'scrapdealer' ? 'bg-purple-100 text-purple-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{u.name}</p>
                            <p className="text-gray-400 text-xs">ID: #{u.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <p className="text-gray-900 font-medium">{u.email}</p>
                        <p className="text-gray-500 text-xs">{u.phone || '-'}</p>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getRoleBadgeColor(u.role)}`}>
                          {u.role === 'scrapdealer' ? 'Scrap Dealer' : u.role}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4 text-gray-700">
                        {u.city ? `${u.city}${u.state ? ', ' + u.state : ''}` : '-'}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusBadge status={u.status} />
                      </td>

                      {/* Registered Date */}
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {formatDate(u.created_at || u.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          {/* View Details */}
                          <button
                            onClick={() => setViewUserModal(u)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
                            title="View Full Registration Details"
                          >
                            <Eye size={17} />
                          </button>

                          {/* Approval Actions for Pending Users */}
                          {isPending && (
                            <>
                              <button
                                onClick={() => openActionModal(u, 'approve')}
                                className="px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-bold text-xs border border-green-200 transition-all flex items-center gap-1"
                                title="Approve Account"
                              >
                                <Check size={14} className="stroke-[3]" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => openActionModal(u, 'reject')}
                                className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs border border-red-200 transition-all flex items-center gap-1"
                                title="Reject Account"
                              >
                                <X size={14} className="stroke-[3]" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {/* Toggle Active/Inactive for Approved Users */}
                          {!isPending && u.role !== 'admin' && (
                            <button
                              onClick={() => openActionModal(u, 'toggle_status')}
                              className={`p-1.5 rounded-lg transition-all ${
                                u.status === 'active'
                                  ? 'text-amber-600 hover:bg-amber-50'
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                              title={u.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                            >
                              <Power size={17} />
                            </button>
                          )}

                          {/* Delete */}
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => openActionModal(u, 'delete')}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-all"
                              title="Delete Account"
                            >
                              <Trash2 size={17} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {users.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No accounts found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <p>Page {currentPage} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3.5 py-1.5 border border-gray-300 rounded-xl text-xs font-semibold disabled:opacity-50 hover:bg-gray-50 transition-all"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3.5 py-1.5 border border-gray-300 rounded-xl text-xs font-semibold disabled:opacity-50 hover:bg-gray-50 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================================= */}
      {/* VIEW USER DETAILS MODAL */}
      {/* ======================================================================= */}
      {viewUserModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-100 text-green-700 rounded-2xl">
                  <User size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{viewUserModal.name}</h3>
                  <p className="text-xs text-gray-500">Registration Details & Credentials</p>
                </div>
              </div>
              <button
                onClick={() => setViewUserModal(null)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200/80">
                <div>
                  <p className="text-gray-400 font-semibold uppercase tracking-wider">Role</p>
                  <p className="font-bold text-gray-900 text-sm mt-0.5 uppercase">{viewUserModal.role}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-semibold uppercase tracking-wider">Account Status</p>
                  <div className="mt-0.5">
                    <StatusBadge status={viewUserModal.status} />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2.5 text-gray-700">
                  <Mail size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-gray-900 block">Email Address</span>
                    <span>{viewUserModal.email}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-gray-700">
                  <Phone size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-gray-900 block">Phone Number</span>
                    <span>{viewUserModal.phone || 'Not provided'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-gray-700">
                  <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-gray-900 block">Address</span>
                    <span>
                      {viewUserModal.address ? `${viewUserModal.address}, ` : ''}
                      {viewUserModal.city ? `${viewUserModal.city}, ` : ''}
                      {viewUserModal.state ? `${viewUserModal.state} ` : ''}
                      {viewUserModal.pincode || ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-gray-700">
                  <Calendar size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-gray-900 block">Registered On</span>
                    <span>{formatDate(viewUserModal.created_at || viewUserModal.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons inside modal */}
              {viewUserModal.status === 'pending' && (
                <div className="pt-4 border-t border-gray-100 flex gap-3">
                  <button
                    onClick={() => {
                      const u = viewUserModal;
                      setViewUserModal(null);
                      openActionModal(u, 'approve');
                    }}
                    className="flex-1 py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Check size={16} />
                    <span>Approve Account</span>
                  </button>
                  <button
                    onClick={() => {
                      const u = viewUserModal;
                      setViewUserModal(null);
                      openActionModal(u, 'reject');
                    }}
                    className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
                  >
                    <X size={16} />
                    <span>Reject Account</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* CONFIRM ACTION MODAL */}
      {/* ======================================================================= */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmAction}
        title={
          actionType === 'delete'
            ? 'Delete User Account'
            : actionType === 'approve'
            ? 'Approve Account Registration'
            : actionType === 'reject'
            ? 'Reject Account Registration'
            : `${selectedUser?.status === 'active' ? 'Deactivate' : 'Activate'} User`
        }
        message={
          actionType === 'delete'
            ? `Are you sure you want to permanently delete ${selectedUser?.name}? All associated records will be removed.`
            : actionType === 'approve'
            ? `Are you sure you want to approve ${selectedUser?.name}'s account (${selectedUser?.role})? The user will immediately be granted platform login access.`
            : actionType === 'reject'
            ? `Are you sure you want to reject ${selectedUser?.name}'s account registration? Access to protected features will be denied.`
            : `Are you sure you want to ${selectedUser?.status === 'active' ? 'deactivate' : 'activate'} ${selectedUser?.name}?`
        }
        confirmText={
          actionType === 'delete'
            ? 'Delete'
            : actionType === 'approve'
            ? 'Approve & Activate'
            : actionType === 'reject'
            ? 'Reject Account'
            : 'Confirm'
        }
        variant={actionType === 'delete' || actionType === 'reject' || selectedUser?.status === 'active' ? 'danger' : 'success'}
      />
    </div>
  );
};

export default AdminUsersPage;
