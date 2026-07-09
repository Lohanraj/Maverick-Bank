import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './EmployeeDashboard.css';

export const EmployeeDashboard: React.FC = () => {
  const { token, isLoggedIn, getUserName, getInitials, isCustomer, logout } = useAuth();
  const navigate = useNavigate();
  const API = 'https://localhost:7174/api';

  // State Variables
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingAccounts, setPendingAccounts] = useState<any[]>([]);
  const [closureRequests, setClosureRequests] = useState<any[]>([]);
  const [pendingLoans, setPendingLoans] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [activePaybackLoans, setActivePaybackLoans] = useState<any[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [creditworthinessScore, setCreditworthinessScore] = useState('');
  const [creditworthinessDetails, setCreditworthinessDetails] = useState('');

  // Headers
  const getHeaders = useMemo(() => {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  // Load Data
  const loadData = useCallback(async () => {
    try {
      // 1. Fetch Users first (to resolve names)
      const usersRes = await fetch(`${API}/Users`, { headers: getHeaders });
      let usersList: any[] = [];
      const userMap = new Map<string, string>();
      if (usersRes.ok) {
        usersList = await usersRes.json();
        usersList.forEach((u: any) => {
          const uId = u.id !== undefined ? u.id : u.Id;
          const fullName = u.fullName || u.FullName || '';
          if (uId !== undefined) {
            userMap.set(String(uId), fullName);
          }
        });
      }

      // 2. Fetch Loans (dependent on UserMap)
      const loansRes = await fetch(`${API}/Loans`, { headers: getHeaders });
      if (loansRes.ok) {
        const loans = await loansRes.json();
        loans.forEach((l: any) => {
          const loanUserId = l.userId !== undefined ? l.userId : l.UserId;
          l.userName = userMap.get(String(loanUserId)) || 'Unknown Customer';
        });
        setPendingLoans(
          loans.filter((l: any) => {
            const status = l.loanStatus || l.LoanStatus;
            return status === 'Pending';
          })
        );
        setActivePaybackLoans(
          loans.filter((l: any) => {
            const status = l.loanStatus || l.LoanStatus;
            const balance = l.remainingBalance !== undefined ? l.remainingBalance : l.RemainingBalance;
            return status === 'Approved' && balance > 0;
          })
        );
      }

      // 3. Fetch Accounts
      const accountsRes = await fetch(`${API}/Accounts`, { headers: getHeaders });
      if (accountsRes.ok) {
        const accounts = await accountsRes.json();
        setPendingAccounts(accounts.filter((a: any) => a.status === 'Pending'));
      }

      // 4. Fetch Closure Requests
      const closureRes = await fetch(`${API}/Accounts/closurerequests`, { headers: getHeaders });
      if (closureRes.ok) {
        const closures = await closureRes.json();
        setClosureRequests(closures);
      }

      // 5. Fetch All Transactions
      const txsRes = await fetch(`${API}/Accounts/alltransactions`, { headers: getHeaders });
      if (txsRes.ok) {
        const txs = await txsRes.json();
        setAllTransactions(txs);
      }
    } catch (e) {
      console.error('Error loading employee data:', e);
    }
  }, [getHeaders]);

  // Auth check & initial load
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (isCustomer()) {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [isLoggedIn, navigate, loadData]);

  // Actions
  const handleApproveAccount = async (id: number) => {
    try {
      const res = await fetch(`${API}/Accounts/approve/${id}/Active`, {
        method: 'PUT',
        headers: getHeaders,
      });
      if (res.ok) {
        window.alert('Account Approved Successfully!');
        loadData();
      } else {
        const err = await res.text();
        window.alert(err || 'Failed to approve account.');
      }
    } catch (e: any) {
      window.alert(e?.message || 'Failed to approve account.');
    }
  };

  const handleRejectAccount = async (id: number) => {
    try {
      const res = await fetch(`${API}/Accounts/approve/${id}/Rejected`, {
        method: 'PUT',
        headers: getHeaders,
      });
      if (res.ok) {
        window.alert('Account Rejected.');
        loadData();
      } else {
        const err = await res.text();
        window.alert(err || 'Failed to reject account.');
      }
    } catch (e: any) {
      window.alert(e?.message || 'Failed to reject account.');
    }
  };

  const handleApproveClosure = async (id: number) => {
    if (!window.confirm('Are you sure you want to close this account?')) return;
    try {
      const res = await fetch(`${API}/Accounts/approveclose/${id}`, {
        method: 'PUT',
        headers: getHeaders,
      });
      if (res.ok) {
        window.alert('Account Closed Successfully!');
        loadData();
      } else {
        const err = await res.text();
        window.alert(err || 'Failed to close account.');
      }
    } catch (e: any) {
      window.alert(e?.message || 'Failed to close account.');
    }
  };

  const handleCheckCreditworthiness = async (loan: any) => {
    setSelectedLoan(loan);
    setCreditworthinessScore('Calculating...');
    setCreditworthinessDetails('');

    try {
      // Fetch all accounts
      const accsRes = await fetch(`${API}/Accounts`, { headers: getHeaders });
      if (!accsRes.ok) throw new Error('Error fetching accounts.');
      const accounts = await accsRes.json();
      const matchedAcc = accounts.find((a: any) => a.accountNumber === loan.accountNumber);

      if (!matchedAcc) {
        setCreditworthinessScore('Error');
        setCreditworthinessDetails('Could not find matching account for calculations.');
        return;
      }

      // Fetch matched account transactions
      const txsRes = await fetch(`${API}/Accounts/transactions/${matchedAcc.id}`, { headers: getHeaders });
      if (!txsRes.ok) throw new Error('Error fetching transactions.');
      const txs = await txsRes.json();

      let inbound = 0;
      let outbound = 0;
      txs.forEach((t: any) => {
        if (
          t.transactionType === 'Deposit' ||
          t.transactionType === 'Transfer Received' ||
          t.transactionType === 'Loan Disbursement'
        ) {
          inbound += t.amount;
        } else if (
          t.transactionType === 'Withdraw' ||
          t.transactionType === 'Transfer Sent' ||
          t.transactionType === 'Loan Repayment'
        ) {
          outbound += t.amount;
        }
      });

      const netFlow = inbound - outbound;
      if (netFlow >= loan.loanAmount * 0.1) {
        setCreditworthinessScore('HIGH (Good)');
        setCreditworthinessDetails(
          `Inbound: ₹${inbound.toFixed(2)}, Outbound: ₹${outbound.toFixed(2)}, Net Flow: ₹${netFlow.toFixed(
            2
          )}. Net flow is sufficient to service the loan.`
        );
      } else {
        setCreditworthinessScore('LOW (Risk)');
        setCreditworthinessDetails(
          `Inbound: ₹${inbound.toFixed(2)}, Outbound: ₹${outbound.toFixed(2)}, Net Flow: ₹${netFlow.toFixed(
            2
          )}. Net flow is too low relative to loan amount.`
        );
      }
    } catch (e: any) {
      setCreditworthinessScore('Error');
      setCreditworthinessDetails(e?.message || 'Error occurred during analysis.');
    }
  };

  const handleApproveLoan = async (id: number) => {
    try {
      const res = await fetch(`${API}/Loans/approve/${id}`, {
        method: 'PUT',
        headers: getHeaders,
      });
      if (res.ok) {
        window.alert('Loan Approved & Disbursed Successfully!');
        setSelectedLoan(null);
        loadData();
      } else {
        const err = await res.text();
        window.alert(err || 'Failed to approve loan.');
      }
    } catch (e: any) {
      window.alert(e?.message || 'Failed to approve loan.');
    }
  };

  const handleRejectLoan = async (id: number) => {
    try {
      const res = await fetch(`${API}/Loans/reject/${id}`, {
        method: 'PUT',
        headers: getHeaders,
      });
      if (res.ok) {
        window.alert('Loan Rejected.');
        setSelectedLoan(null);
        loadData();
      } else {
        const err = await res.text();
        window.alert(err || 'Failed to reject loan.');
      }
    } catch (e: any) {
      window.alert(e?.message || 'Failed to reject loan.');
    }
  };

  const formatCurrency = (val: number, decimals: number = 2) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
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
            <div className="sidebar-brand-icon">
              <i className="bi bi-bank2"></i>
            </div>
            <div>
              <div className="sidebar-brand-name">Maverick Bank</div>
              <span className="sidebar-brand-tag">Employee Portal</span>
            </div>
          </div>
        </div>

        <div className="sidebar-user">
          <div
            className="sidebar-avatar"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' }}
          >
            {getInitials()}
          </div>
          <div>
            <div className="sidebar-user-name">{getUserName()}</div>
            <div className="sidebar-user-role">Bank Employee</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Dashboard</div>
          <a
            className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="bi bi-grid-1x2"></i> Overview
          </a>

          <div className="sidebar-section-label">Account Management</div>
          <a
            className={`sidebar-link ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <i className="bi bi-hourglass-split"></i> Pending Approvals
            {pendingAccounts.length > 0 && (
              <span className="ms-auto badge badge-status-pending">{pendingAccounts.length}</span>
            )}
          </a>
          <a
            className={`sidebar-link ${activeTab === 'closure' ? 'active' : ''}`}
            onClick={() => setActiveTab('closure')}
          >
            <i className="bi bi-x-circle"></i> Closure Requests
            {closureRequests.length > 0 && (
              <span className="ms-auto badge badge-status-rejected">{closureRequests.length}</span>
            )}
          </a>
          <a
            className={`sidebar-link ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            <i className="bi bi-receipt"></i> All Transactions
          </a>

          <div className="sidebar-section-label">Loan Management</div>
          <a
            className={`sidebar-link ${activeTab === 'loans' ? 'active' : ''}`}
            onClick={() => setActiveTab('loans')}
          >
            <i className="bi bi-cash-coin"></i> Loan Applications
            {pendingLoans.length > 0 && (
              <span className="ms-auto badge badge-status-pending">{pendingLoans.length}</span>
            )}
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
        {/* ============== OVERVIEW ============== */}
        {activeTab === 'overview' && (
          <div className="animate-in">
            <div className="page-header">
              <h1 className="page-title">Employee Dashboard</h1>
              <p className="page-subtitle">Manage accounts, transactions, and loans</p>
            </div>
            <div className="row g-3 mb-4">
              <div className="col-md-3 col-6">
                <div className="stat-card">
                  <div className="stat-icon stat-icon-orange">
                    <i className="bi bi-hourglass-split"></i>
                  </div>
                  <div>
                    <div className="stat-label">Pending Accounts</div>
                    <div className="stat-value">{pendingAccounts.length}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="stat-card">
                  <div className="stat-icon stat-icon-red">
                    <i className="bi bi-x-circle"></i>
                  </div>
                  <div>
                    <div className="stat-label">Closure Requests</div>
                    <div className="stat-value">{closureRequests.length}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="stat-card">
                  <div className="stat-icon stat-icon-blue">
                    <i className="bi bi-cash-coin"></i>
                  </div>
                  <div>
                    <div className="stat-label">Pending Loans</div>
                    <div className="stat-value">{pendingLoans.length}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="stat-card">
                  <div className="stat-icon stat-icon-green">
                    <i className="bi bi-receipt"></i>
                  </div>
                  <div>
                    <div className="stat-label">Total Transactions</div>
                    <div className="stat-value">{allTransactions.length}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="row g-3">
              <div className="col-md-4">
                <div className="card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('pending')}>
                  <div className="card-body d-flex align-items-center gap-3">
                    <div className="stat-icon stat-icon-orange">
                      <i className="bi bi-hourglass-split"></i>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>Review Pending Accounts</div>
                      <div style={{ fontSize: '12px', color: 'var(--dark-text-dim)' }}>
                        {pendingAccounts.length} account(s) awaiting approval
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('loans')}>
                  <div className="card-body d-flex align-items-center gap-3">
                    <div className="stat-icon stat-icon-blue">
                      <i className="bi bi-cash-coin"></i>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>Review Loan Applications</div>
                      <div style={{ fontSize: '12px', color: 'var(--dark-text-dim)' }}>
                        {pendingLoans.length} loan(s) pending decision
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('transactions')}>
                  <div className="card-body d-flex align-items-center gap-3">
                    <div className="stat-icon stat-icon-green">
                      <i className="bi bi-receipt"></i>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>View All Transactions</div>
                      <div style={{ fontSize: '12px', color: 'var(--dark-text-dim)' }}>Monitor all account activity</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist & Outstanding Loans */}
            <div className="row g-4 mt-2">
              {/* Checklist panel */}
              <div className="col-md-4">
                <div className="card h-100">
                  <div className="card-header">
                    <i className="bi bi-list-task me-2 text-warning"></i>Pending Tasks Checklist
                  </div>
                  <div className="card-body">
                    {pendingAccounts.length === 0 && pendingLoans.length === 0 && closureRequests.length === 0 ? (
                      <div className="text-center py-4">
                        <div
                          style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            margin: '0 auto 12px',
                          }}
                        >
                          <i className="bi bi-check-all"></i>
                        </div>
                        <h6 style={{ fontWeight: 700, color: '#fff' }}>All Caught Up!</h6>
                        <p style={{ fontSize: '12px', color: 'var(--dark-text-dim)', marginBottom: 0 }}>
                          No pending account, loan, or closure requests needing attention.
                        </p>
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        {/* Task 1: Accounts */}
                        <div
                          className="d-flex align-items-center gap-3 p-2 rounded"
                          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                        >
                          <div
                            className={pendingAccounts.length > 0 ? 'text-warning' : 'text-success'}
                            style={{ fontSize: '20px' }}
                          >
                            <i
                              className={
                                pendingAccounts.length > 0 ? 'bi bi-dash-circle-fill' : 'bi bi-check-circle-fill'
                              }
                            ></i>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#fff' }}>
                              Account Registrations
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--dark-text-dim)' }}>
                              {pendingAccounts.length > 0
                                ? `${pendingAccounts.length} requests awaiting review`
                                : 'All registrations reviewed'}
                            </div>
                          </div>
                          {pendingAccounts.length > 0 && (
                            <button className="btn btn-outline btn-xs" onClick={() => setActiveTab('pending')}>
                              Process
                            </button>
                          )}
                        </div>

                        {/* Task 2: Loans */}
                        <div
                          className="d-flex align-items-center gap-3 p-2 rounded"
                          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                        >
                          <div
                            className={pendingLoans.length > 0 ? 'text-warning' : 'text-success'}
                            style={{ fontSize: '20px' }}
                          >
                            <i
                              className={pendingLoans.length > 0 ? 'bi bi-dash-circle-fill' : 'bi bi-check-circle-fill'}
                            ></i>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#fff' }}>Loan Applications</div>
                            <div style={{ fontSize: '11px', color: 'var(--dark-text-dim)' }}>
                              {pendingLoans.length > 0
                                ? `${pendingLoans.length} applications awaiting decision`
                                : 'All applications processed'}
                            </div>
                          </div>
                          {pendingLoans.length > 0 && (
                            <button className="btn btn-outline btn-xs" onClick={() => setActiveTab('loans')}>
                              Process
                            </button>
                          )}
                        </div>

                        {/* Task 3: Closures */}
                        <div
                          className="d-flex align-items-center gap-3 p-2 rounded"
                          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                        >
                          <div
                            className={closureRequests.length > 0 ? 'text-warning' : 'text-success'}
                            style={{ fontSize: '20px' }}
                          >
                            <i
                              className={
                                closureRequests.length > 0 ? 'bi bi-dash-circle-fill' : 'bi bi-check-circle-fill'
                              }
                            ></i>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#fff' }}>Closure Requests</div>
                            <div style={{ fontSize: '11px', color: 'var(--dark-text-dim)' }}>
                              {closureRequests.length > 0
                                ? `${closureRequests.length} closure requests active`
                                : 'All closure requests processed'}
                            </div>
                          </div>
                          {closureRequests.length > 0 && (
                            <button className="btn btn-outline btn-xs" onClick={() => setActiveTab('closure')}>
                              Process
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Active payback loans panel */}
              <div className="col-md-8">
                <div className="card h-100">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <span>
                      <i className="bi bi-cash-stack me-2 text-success"></i>Active Outstanding Loans (Pending Payback)
                    </span>
                    <span className="badge badge-status-active">{activePaybackLoans.length} Active</span>
                  </div>
                  <div className="card-body p-0">
                    {activePaybackLoans.length === 0 ? (
                      <div className="text-center py-5">
                        <i
                          className="bi bi-cash"
                          style={{ fontSize: '40px', color: 'var(--dark-text-dim)', display: 'block', marginBottom: '8px' }}
                        ></i>
                        <h6 style={{ color: '#fff', fontWeight: 600 }}>No Active Outstanding Loans</h6>
                        <p style={{ fontSize: '12px', color: 'var(--dark-text-dim)', marginBottom: 0 }}>
                          There are no approved loans with a remaining balance in the system.
                        </p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table mb-0" style={{ fontSize: '13px' }}>
                          <thead>
                            <tr>
                              <th>Customer Name</th>
                              <th>Account</th>
                              <th>Approved Loan</th>
                              <th>Remaining Balance</th>
                              <th>Payback Progress</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activePaybackLoans.map((loan, idx) => (
                              <tr key={idx}>
                                <td style={{ fontWeight: 600, color: '#818cf8' }}>{loan.userName}</td>
                                <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{loan.accountNumber}</td>
                                <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                                  ₹{formatCurrency(loan.loanAmount, 0)}
                                </td>
                                <td style={{ fontWeight: 600, color: 'var(--warning)' }}>
                                  ₹{formatCurrency(loan.remainingBalance, 0)}
                                </td>
                                <td>
                                  <div className="d-flex align-items-center gap-2" style={{ width: '140px' }}>
                                    {/* Progress Bar */}
                                    <div
                                      style={{
                                        flex: 1,
                                        height: '6px',
                                        background: 'rgba(255,255,255,0.08)',
                                        borderRadius: '4px',
                                        overflow: 'hidden',
                                        position: 'relative',
                                      }}
                                    >
                                      <div
                                        style={{
                                          height: '100%',
                                          background: 'linear-gradient(90deg, #10b981, #34d399)',
                                          borderRadius: '4px',
                                          width: `${
                                            loan.loanAmount
                                              ? ((loan.loanAmount - loan.remainingBalance) / loan.loanAmount) * 100
                                              : 0
                                          }%`,
                                        }}
                                      ></div>
                                    </div>
                                    <span
                                      style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: 'var(--dark-text-dim)',
                                        minWidth: '32px',
                                        textAlign: 'right',
                                      }}
                                    >
                                      {loan.loanAmount
                                        ? Math.round(((loan.loanAmount - loan.remainingBalance) / loan.loanAmount) * 100)
                                        : 0}
                                      %
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============== PENDING ACCOUNTS ============== */}
        {activeTab === 'pending' && (
          <div className="animate-in">
            <div className="page-header">
              <h1 className="page-title">Pending Account Approvals</h1>
              <p className="page-subtitle">Review and approve or reject new account applications</p>
            </div>
            <div className="card">
              <div className="card-body p-0">
                {pendingAccounts.length === 0 ? (
                  <div className="empty-state">
                    <i className="bi bi-check-circle"></i>
                    <h6>All Clear!</h6>
                    <p style={{ fontSize: '13px' }}>No pending account approvals at this time.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead>
                        <tr>
                          <th>Account Number</th>
                          <th>Holder Name</th>
                          <th>Type</th>
                          <th>IFSC</th>
                          <th>Branch</th>
                          <th>Applied On</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingAccounts.map((acc) => (
                          <tr key={acc.id}>
                            <td>
                              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{acc.accountNumber}</span>
                            </td>
                            <td>{acc.fullName}</td>
                            <td>
                              <span
                                className={`badge ${
                                  acc.accountType === 'Savings'
                                    ? 'badge-savings'
                                    : acc.accountType === 'Checking'
                                    ? 'badge-checking'
                                    : 'badge-business'
                                }`}
                              >
                                {acc.accountType}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--dark-text-dim)' }}>
                                {acc.ifscCode}
                              </span>
                            </td>
                            <td style={{ fontSize: '12px', color: 'var(--dark-text-dim)' }}>{acc.branchName}</td>
                            <td style={{ color: 'var(--dark-text-dim)', fontSize: '12px' }}>
                              {new Date(acc.createdAt).toLocaleDateString([], {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <button className="btn btn-success btn-sm" onClick={() => handleApproveAccount(acc.id)}>
                                  <i className="bi bi-check-lg"></i> Approve
                                </button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleRejectAccount(acc.id)}>
                                  <i className="bi bi-x-lg"></i> Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============== CLOSURE REQUESTS ============== */}
        {activeTab === 'closure' && (
          <div className="animate-in">
            <div className="page-header">
              <h1 className="page-title">Account Closure Requests</h1>
              <p className="page-subtitle">Approve customer-requested account closures</p>
            </div>
            <div className="card">
              <div className="card-body p-0">
                {closureRequests.length === 0 ? (
                  <div className="empty-state">
                    <i className="bi bi-check-circle"></i>
                    <h6>No Closure Requests</h6>
                    <p style={{ fontSize: '13px' }}>No accounts are pending closure at this time.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead>
                        <tr>
                          <th>Account Number</th>
                          <th>Holder Name</th>
                          <th>Type</th>
                          <th>Balance</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {closureRequests.map((acc) => (
                          <tr key={acc.id}>
                            <td>
                              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{acc.accountNumber}</span>
                            </td>
                            <td>{acc.fullName}</td>
                            <td>
                              <span className="badge badge-checking">{acc.accountType}</span>
                            </td>
                            <td>
                              <span style={{ color: 'var(--warning)' }}>₹{formatCurrency(acc.balance)}</span>
                            </td>
                            <td>
                              <span className="badge badge-status-pending">{acc.status}</span>
                            </td>
                            <td>
                              <button className="btn btn-danger btn-sm" onClick={() => handleApproveClosure(acc.id)}>
                                <i className="bi bi-x-circle"></i> Close Account
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============== ALL TRANSACTIONS ============== */}
        {activeTab === 'transactions' && (
          <div className="animate-in">
            <div className="page-header">
              <h1 className="page-title">All Transactions</h1>
              <p className="page-subtitle">Monitor all account transactions across the bank</p>
            </div>
            <div className="card">
              <div className="card-body p-0">
                {allTransactions.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Account ID</th>
                          <th>Type</th>
                          <th>Description</th>
                          <th className="text-end">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allTransactions.map((tx, idx) => (
                          <tr key={idx}>
                            <td style={{ color: 'var(--dark-text-dim)', fontSize: '12px' }}>
                              {new Date(tx.createdAt).toLocaleDateString([], {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}{' '}
                              {new Date(tx.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{tx.accountId}</td>
                            <td>
                              <span
                                className={`badge ${
                                  tx.transactionType === 'Deposit'
                                    ? 'badge-tx-deposit'
                                    : tx.transactionType === 'Withdraw'
                                    ? 'badge-tx-withdraw'
                                    : tx.transactionType === 'Transfer Sent'
                                    ? 'badge-tx-transfer-sent'
                                    : tx.transactionType === 'Transfer Received'
                                    ? 'badge-tx-transfer-received'
                                    : tx.transactionType === 'Loan Disbursement'
                                    ? 'badge-tx-disbursement'
                                    : tx.transactionType === 'Loan Repayment'
                                    ? 'badge-tx-repayment'
                                    : 'badge-tx-transfer'
                                }`}
                              >
                                {tx.transactionType}
                              </span>
                            </td>
                            <td style={{ color: 'var(--dark-text-dim)', fontSize: '12px' }}>{tx.description || '—'}</td>
                            <td className="text-end">
                              <span
                                className={
                                  tx.transactionType === 'Deposit' ||
                                  tx.transactionType === 'Transfer Received' ||
                                  tx.transactionType === 'Loan Disbursement'
                                    ? 'text-success'
                                    : 'text-danger'
                                }
                              >
                                {tx.transactionType === 'Deposit' ||
                                tx.transactionType === 'Transfer Received' ||
                                tx.transactionType === 'Loan Disbursement'
                                  ? '+'
                                  : '-'}
                                ₹{formatCurrency(tx.amount)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <i className="bi bi-receipt"></i>
                    <h6>No Transactions</h6>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============== LOANS ============== */}
        {activeTab === 'loans' && (
          <div className="animate-in">
            <div className="page-header">
              <h1 className="page-title">Loan Applications</h1>
              <p className="page-subtitle">Review and make decisions on loan applications</p>
            </div>

            {/* Creditworthiness Modal */}
            {selectedLoan && (
              <div className="modal-overlay">
                <div className="modal-box" style={{ maxWidth: '600px' }}>
                  <div className="modal-title">
                    <i className="bi bi-graph-up-arrow"></i> Creditworthiness Analysis
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <div className="info-row">
                        <span className="label">Applicant</span>
                        <span className="value">{selectedLoan.userName}</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="info-row">
                        <span className="label">Loan Amount</span>
                        <span className="value">₹{formatCurrency(selectedLoan.loanAmount)}</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="info-row">
                        <span className="label">Interest Rate</span>
                        <span className="value text-warning">{selectedLoan.interestRate}%</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="info-row">
                        <span className="label">Tenure</span>
                        <span className="value">{selectedLoan.tenureMonths} months</span>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="info-row">
                        <span className="label">Purpose</span>
                        <span className="value">{selectedLoan.purpose}</span>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="info-row">
                        <span className="label">Account</span>
                        <span className="value" style={{ fontFamily: 'monospace' }}>
                          {selectedLoan.accountNumber}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="divider"></div>

                  {/* Score Display */}
                  {creditworthinessScore && (
                    <div
                      className="p-3 mb-3"
                      style={{
                        borderRadius: '12px',
                        background: creditworthinessScore.includes('HIGH') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        border: creditworthinessScore.includes('HIGH')
                          ? '1px solid rgba(16,185,129,0.3)'
                          : '1px solid rgba(239,68,68,0.3)',
                      }}
                    >
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <i
                          className={`bi ${
                            creditworthinessScore.includes('HIGH')
                              ? 'bi-check-circle-fill text-success'
                              : 'bi-exclamation-triangle-fill text-danger'
                          }`}
                        ></i>
                        <strong>Credit Score: {creditworthinessScore}</strong>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--dark-text-dim)', margin: 0 }}>{creditworthinessDetails}</p>
                    </div>
                  )}

                  {creditworthinessScore === 'Calculating...' && (
                    <div className="loading-overlay" style={{ padding: '16px' }}>
                      <span className="spinner"></span> Analyzing transactions...
                    </div>
                  )}

                  <div className="d-flex gap-3">
                    <button
                      className="btn btn-success"
                      onClick={() => handleApproveLoan(selectedLoan.id)}
                      style={{ flex: 1 }}
                      disabled={creditworthinessScore === 'Calculating...'}
                    >
                      <i className="bi bi-check-circle"></i> Approve & Disburse
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleRejectLoan(selectedLoan.id)}
                      style={{ flex: 1 }}
                      disabled={creditworthinessScore === 'Calculating...'}
                    >
                      <i className="bi bi-x-circle"></i> Reject
                    </button>
                    <button className="btn btn-outline" onClick={() => setSelectedLoan(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-body p-0">
                {pendingLoans.length === 0 ? (
                  <div className="empty-state">
                    <i className="bi bi-cash-coin"></i>
                    <h6>No Pending Loans</h6>
                    <p style={{ fontSize: '13px' }}>All loan applications have been processed.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead>
                        <tr>
                          <th>Applicant</th>
                          <th>Amount</th>
                          <th>Purpose</th>
                          <th>Rate</th>
                          <th>Tenure</th>
                          <th>Account</th>
                          <th>Applied On</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingLoans.map((loan) => (
                          <tr key={loan.id}>
                            <td style={{ fontWeight: 600 }}>{loan.userName || '—'}</td>
                            <td style={{ color: 'var(--success)', fontWeight: 700 }}>
                              ₹{formatCurrency(loan.loanAmount, 0)}
                            </td>
                            <td style={{ fontSize: '12px', color: 'var(--dark-text-dim)' }}>{loan.purpose}</td>
                            <td>
                              <span className="badge badge-status-pending">{loan.interestRate}%</span>
                            </td>
                            <td style={{ fontSize: '12px' }}>{loan.tenureMonths}m</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{loan.accountNumber}</td>
                            <td style={{ color: 'var(--dark-text-dim)', fontSize: '12px' }}>
                              {new Date(loan.createdAt).toLocaleDateString([], {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td>
                              <button className="btn btn-primary btn-sm" onClick={() => handleCheckCreditworthiness(loan)}>
                                <i className="bi bi-graph-up-arrow"></i> Review
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
