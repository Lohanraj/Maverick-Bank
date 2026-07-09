import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';

export const AdminDashboard: React.FC = () => {
  const { token, isLoggedIn, getUserName, getInitials, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const API = 'https://localhost:7174/api';

  // Navigation
  const [activeTab, setActiveTab] = useState('overview');

  // Users List
  const [users, setUsers] = useState<any[]>([]);

  // Forms Toggle
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [showEditUserForm, setShowEditUserForm] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [passwordHash, setPasswordHash] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('Customer');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Headers
  const getHeaders = useMemo(() => {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  // Load Users
  const loadUsers = async () => {
    try {
      const res = await fetch(`${API}/Users`, { headers: getHeaders });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Auth Guard & Initial Load
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (!isAdmin()) {
      navigate('/login'); // Redirect unauthorized
      return;
    }
    loadUsers();
  }, [isLoggedIn, navigate]);

  // Derived Properties
  const customerCount = useMemo(() => users.filter((u) => u.role === 'Customer').length, [users]);
  const employeeCount = useMemo(() => users.filter((u) => u.role === 'Employee').length, [users]);
  const adminCount = useMemo(() => users.filter((u) => u.role === 'Admin').length, [users]);

  // Form Handlers
  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPasswordHash('');
    setPhoneNumber('');
    setAddress('');
    setRole('Customer');
    setGender('');
    setDateOfBirth('');
    setAadharNumber('');
    setPanNumber('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const extractErrorMessage = (errData: any): string => {
    if (errData) {
      if (typeof errData === 'object') {
        if (errData.errors) {
          const messages = [];
          for (const key in errData.errors) {
            if (Object.prototype.hasOwnProperty.call(errData.errors, key)) {
              messages.push(...errData.errors[key]);
            }
          }
          return messages.join(' ');
        }
        if (errData.message) {
          return errData.message;
        }
        return JSON.stringify(errData);
      }
      return errData;
    }
    return '';
  };

  const handleCreateUser = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    if (!fullName || !email || !passwordHash || !role) {
      setErrorMessage('Name, Email, Password and Role are required.');
      return;
    }
    const body = {
      fullName,
      email,
      password: passwordHash,
      phoneNumber: phoneNumber || null,
      address: address || null,
      role,
      gender: gender || null,
      dateOfBirth: dateOfBirth || null,
      aadharNumber: aadharNumber || null,
      panNumber: panNumber || null,
    };

    try {
      const res = await fetch(`${API}/Users`, {
        method: 'POST',
        headers: getHeaders,
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSuccessMessage('User Created Successfully!');
        setShowAddUserForm(false);
        resetForm();
        loadUsers();
      } else {
        let errContent;
        try {
          errContent = await res.json();
        } catch {
          errContent = await res.text();
        }
        setErrorMessage(extractErrorMessage(errContent) || 'Failed to create user.');
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Failed to create user.');
    }
  };

  const handleOpenEditForm = (user: any) => {
    setSelectedUser(user);
    setFullName(user.fullName || '');
    setEmail(user.email || '');
    setPhoneNumber(user.phoneNumber || '');
    setAddress(user.address || '');
    setRole(user.role || 'Customer');
    setGender(user.gender || '');
    setDateOfBirth(user.dateOfBirth ? user.dateOfBirth.substring(0, 10) : '');
    setAadharNumber(user.aadharNumber || '');
    setPanNumber(user.panNumber || '');
    setErrorMessage('');
    setSuccessMessage('');
    setShowEditUserForm(true);
    setShowAddUserForm(false);
  };

  const handleUpdateUser = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    const body = {
      fullName,
      email,
      phoneNumber: phoneNumber || null,
      address: address || null,
      role,
      gender: gender || null,
      dateOfBirth: dateOfBirth && dateOfBirth.toString().trim() ? dateOfBirth : null,
      aadharNumber: aadharNumber || null,
      panNumber: panNumber || null,
    };

    try {
      const res = await fetch(`${API}/Users/${selectedUser.id}`, {
        method: 'PUT',
        headers: getHeaders,
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSuccessMessage('User Updated Successfully!');
        setShowEditUserForm(false);
        loadUsers();
      } else {
        let errContent;
        try {
          errContent = await res.json();
        } catch {
          errContent = await res.text();
        }
        setErrorMessage(extractErrorMessage(errContent) || 'Failed to update user.');
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Failed to update user.');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const res = await fetch(`${API}/Users/toggle/${id}`, {
        method: 'PUT',
        headers: getHeaders,
      });
      if (res.ok) {
        const data = await res.json();
        window.alert(data.message);
        loadUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (
      !window.confirm(
        'Are you sure you want to permanently delete this user and all associated bank accounts, loans, cards, and transactions? This action is irreversible.'
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`${API}/Users/${id}`, {
        method: 'DELETE',
        headers: getHeaders,
      });

      if (res.ok) {
        const data = await res.json();
        window.alert(data.message || 'User deleted successfully.');
        loadUsers();
      } else {
        let errContent;
        try {
          errContent = await res.json();
        } catch {
          errContent = await res.text();
        }
        window.alert(extractErrorMessage(errContent) || 'Failed to delete user.');
      }
    } catch (e: any) {
      window.alert(e?.message || 'Failed to delete user.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo">
            <div
              className="sidebar-brand-icon"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' }}
            >
              <i className="bi bi-bank2"></i>
            </div>
            <div>
              <div className="sidebar-brand-name">Maverick Bank</div>
              <span className="sidebar-brand-tag">Admin Portal</span>
            </div>
          </div>
        </div>

        <div className="sidebar-user">
          <div
            className="sidebar-avatar"
            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' }}
          >
            {getInitials()}
          </div>
          <div>
            <div className="sidebar-user-name">{getUserName()}</div>
            <div className="sidebar-user-role">System Administrator</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Administration</div>
          <a
            className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="bi bi-grid-1x2"></i> Overview
          </a>
          <a
            className={`sidebar-link ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="bi bi-people"></i> User Management
          </a>
        </nav>

        <div className="sidebar-logout">
          <button className="btn btn-outline btn-full btn-sm" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="animate-in">
            <div className="page-header">
              <h1 className="page-title">Admin Dashboard</h1>
              <p className="page-subtitle">System administration and user management</p>
            </div>
            <div className="row g-3 mb-4">
              <div className="col-md-3 col-6">
                <div className="stat-card">
                  <div className="stat-icon stat-icon-blue">
                    <i className="bi bi-people"></i>
                  </div>
                  <div>
                    <div className="stat-label">Total Users</div>
                    <div className="stat-value">{users.length}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="stat-card">
                  <div className="stat-icon stat-icon-green">
                    <i className="bi bi-person-check"></i>
                  </div>
                  <div>
                    <div className="stat-label">Customers</div>
                    <div className="stat-value">{customerCount}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="stat-card">
                  <div className="stat-icon stat-icon-purple">
                    <i className="bi bi-person-badge"></i>
                  </div>
                  <div>
                    <div className="stat-label">Employees</div>
                    <div className="stat-value">{employeeCount}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="stat-card">
                  <div className="stat-icon stat-icon-orange">
                    <i className="bi bi-shield-check"></i>
                  </div>
                  <div>
                    <div className="stat-label">Admins</div>
                    <div className="stat-value">{adminCount}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('users')}>
              <div className="card-body d-flex align-items-center gap-3">
                <div className="stat-icon stat-icon-blue">
                  <i className="bi bi-people"></i>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px' }}>Manage Users</div>
                  <div style={{ fontSize: '13px', color: 'var(--dark-text-dim)' }}>
                    Create, edit, and deactivate user accounts and bank employees
                  </div>
                </div>
                <i className="bi bi-chevron-right ms-auto" style={{ color: 'var(--dark-text-dim)' }}></i>
              </div>
            </div>
          </div>
        )}

        {/* USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="animate-in">
            <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <h1 className="page-title">User Management</h1>
                <p className="page-subtitle">Create, modify, or deactivate user accounts</p>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowAddUserForm(true);
                  setShowEditUserForm(false);
                  resetForm();
                }}
              >
                <i className="bi bi-plus-circle"></i> Add User
              </button>
            </div>

            {/* Add User Modal */}
            {showAddUserForm && (
              <div className="modal-overlay">
                <div className="modal-box" style={{ maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
                  <div className="modal-title">
                    <i className="bi bi-person-plus"></i> Create New User
                  </div>
                  {errorMessage && (
                    <div className="alert alert-danger">
                      <i className="bi bi-exclamation-circle-fill"></i> {errorMessage}
                    </div>
                  )}
                  {successMessage && (
                    <div className="alert alert-success">
                      <i className="bi bi-check-circle-fill"></i> {successMessage}
                    </div>
                  )}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Full Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Role *</label>
                        <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                          <option value="Customer">Customer</option>
                          <option value="Employee">Employee</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Email *</label>
                        <input
                          type="email"
                          className="form-control"
                          placeholder="Email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Password *</label>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="Password"
                          value={passwordHash}
                          onChange={(e) => setPasswordHash(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Phone"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Gender</label>
                        <select className="form-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-group">
                        <label className="form-label">Address</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Date of Birth</label>
                        <input
                          type="date"
                          className="form-control"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Aadhar Number</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="12 digits"
                          value={aadharNumber}
                          onChange={(e) => setAadharNumber(e.target.value)}
                          maxLength={12}
                        />
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-group">
                        <label className="form-label">PAN Number</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="10 chars"
                          value={panNumber}
                          onChange={(e) => setPanNumber(e.target.value)}
                          maxLength={10}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex gap-3 mt-3">
                    <button className="btn btn-primary" onClick={handleCreateUser} style={{ flex: 1 }}>
                      <i className="bi bi-person-plus"></i> Create User
                    </button>
                    <button className="btn btn-outline" onClick={() => setShowAddUserForm(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit User Modal */}
            {showEditUserForm && (
              <div className="modal-overlay">
                <div className="modal-box" style={{ maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
                  <div className="modal-title">
                    <i className="bi bi-pencil"></i> Edit User
                  </div>
                  {errorMessage && (
                    <div className="alert alert-danger">
                      <i className="bi bi-exclamation-circle-fill"></i> {errorMessage}
                    </div>
                  )}
                  {successMessage && (
                    <div className="alert alert-success">
                      <i className="bi bi-check-circle-fill"></i> {successMessage}
                    </div>
                  )}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Role</label>
                        <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                          <option value="Customer">Customer</option>
                          <option value="Employee">Employee</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input
                          type="text"
                          className="form-control"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Gender</label>
                        <select className="form-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Date of Birth</label>
                        <input
                          type="date"
                          className="form-control"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-group">
                        <label className="form-label">Address</label>
                        <input
                          type="text"
                          className="form-control"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Aadhar Number</label>
                        <input
                          type="text"
                          className="form-control"
                          value={aadharNumber}
                          onChange={(e) => setAadharNumber(e.target.value)}
                          maxLength={12}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">PAN Number</label>
                        <input
                          type="text"
                          className="form-control"
                          value={panNumber}
                          onChange={(e) => setPanNumber(e.target.value)}
                          maxLength={10}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex gap-3 mt-3">
                    <button className="btn btn-success" onClick={handleUpdateUser} style={{ flex: 1 }}>
                      <i className="bi bi-check-circle"></i> Save Changes
                    </button>
                    <button className="btn btn-outline" onClick={() => setShowEditUserForm(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="card" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="user-mgmt-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Phone</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="d-flex align-items-center gap-3">
                              <div
                                className={`user-avatar-wrapper ${
                                  user.role === 'Admin'
                                    ? 'user-avatar-admin'
                                    : user.role === 'Employee'
                                    ? 'user-avatar-employee'
                                    : 'user-avatar-customer'
                                }`}
                              >
                                {user.fullName?.[0] || 'U'}
                              </div>
                              <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--dark-text)' }}>
                                {user.fullName}
                              </span>
                            </div>
                          </td>
                          <td style={{ fontSize: '13px', color: 'var(--dark-text-dim)' }}>{user.email}</td>
                          <td>
                            <span
                              className={`role-badge ${
                                user.role === 'Admin'
                                  ? 'role-admin'
                                  : user.role === 'Employee'
                                  ? 'role-employee'
                                  : 'role-customer'
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td style={{ fontSize: '13px', color: 'var(--dark-text-dim)' }}>{user.phoneNumber || '—'}</td>
                          <td>
                            <span
                              className={`status-badge ${
                                user.isActive !== false ? 'status-active' : 'status-inactive'
                              }`}
                            >
                              {user.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                className="action-btn-edit"
                                onClick={() => handleOpenEditForm(user)}
                                title="Edit User"
                              >
                                <i className="bi bi-pencil-fill" style={{ fontSize: '12px' }}></i>
                              </button>
                              {user.isActive !== false ? (
                                <button
                                  className="action-btn-deactivate"
                                  onClick={() => handleToggleStatus(user.id)}
                                  title="Deactivate User"
                                >
                                  <i className="bi bi-person-dash-fill" style={{ fontSize: '13px' }}></i>
                                </button>
                              ) : (
                                <button
                                  className="action-btn-activate"
                                  onClick={() => handleToggleStatus(user.id)}
                                  title="Activate User"
                                >
                                  <i className="bi bi-person-check-fill" style={{ fontSize: '13px' }}></i>
                                </button>
                              )}
                              <button
                                className="action-btn-delete"
                                onClick={() => handleDeleteUser(user.id)}
                                title="Delete User"
                              >
                                <i className="bi bi-trash-fill" style={{ fontSize: '12px' }}></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {users.length === 0 && (
                  <div className="empty-state">
                    <i className="bi bi-people"></i>
                    <h6>No Users Found</h6>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
