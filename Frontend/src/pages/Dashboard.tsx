import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import { useAuth } from '../context/AuthContext';
import { CardService } from '../services/CardService';
import './Dashboard.css';

interface Account {
  id: number;
  accountNumber: string;
  accountType: string;
  balance: number;
  status: string;
  branchName: string;
  ifscCode: string;
  branchAddress?: string;
  fullName?: string;
}

interface NotificationItem {
  title: string;
  message: string;
  time: Date;
  read: boolean;
}

interface Transaction {
  createdAt: string;
  transactionType: string;
  description: string;
  amount: number;
}

interface Loan {
  id: number;
  purpose: string;
  loanStatus: string;
  loanAmount: number;
  interestRate: number;
  tenureMonths: number;
  accountNumber: string;
  remainingBalance: number;
}

interface Beneficiary {
  id: number;
  beneficiaryName: string;
  accountNumber: string;
  bankName: string;
  branchName: string;
  ifscCode: string;
}

export const Dashboard: React.FC = () => {
  const {
    token,
    isLoggedIn,
    getUserName,
    getInitials,
    isCustomer,
    isAdmin,
    logout,
  } = useAuth();
  
  const navigate = useNavigate();
  const API = 'https://localhost:7174/api';

  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  // Notifications (SignalR)
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  // Accounts
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  // Profile
  const [profileData, setProfileData] = useState<any>({});
  const [profileEdit, setProfileEdit] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    gender: '',
    dateOfBirth: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txFilter, setTxFilter] = useState('last10');
  const [txAccountId, setTxAccountId] = useState('');
  const [txFromDate, setTxFromDate] = useState('');
  const [txToDate, setTxToDate] = useState('');
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState('');
  const [txSuccess, setTxSuccess] = useState('');

  // Deposit
  const [depositAccountId, setDepositAccountId] = useState('');
  const [depositAmount, setDepositAmount] = useState<number>(0);

  // Withdraw
  const [withdrawAccountId, setWithdrawAccountId] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);

  // Transfer
  const [transferFromId, setTransferFromId] = useState('');
  const [transferDestAccount, setTransferDestAccount] = useState('');
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [selectedBeneficiaryAcc, setSelectedBeneficiaryAcc] = useState('');

  // Open Account
  const [openAccError, setOpenAccError] = useState('');
  const [openAccSuccess, setOpenAccSuccess] = useState('');
  const [openAccLoading, setOpenAccLoading] = useState(false);
  const [newAcc, setNewAcc] = useState({
    accountType: '',
    fullName: '',
    address: '',
    dateOfBirth: '',
    aadharNumber: '',
    panNumber: '',
    age: null as number | null,
  });

  // Loans
  const [loanSubTab, setLoanSubTab] = useState('apply');
  const [myLoans, setMyLoans] = useState<Loan[]>([]);
  const [loanLoading, setLoanLoading] = useState(false);
  const [loanError, setLoanError] = useState('');
  const [loanSuccess, setLoanSuccess] = useState('');
  const [selectedLoanProduct, setSelectedLoanProduct] = useState<any>(null);
  const [loanApplication, setLoanApplication] = useState({
    accountNumber: '',
    loanAmount: 0,
    tenureMonths: 0,
    purpose: '',
  });

  // Repay Loan
  const [repayLoanId, setRepayLoanId] = useState<number | null>(null);
  const [repayAccountNumber, setRepayAccountNumber] = useState('');
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [repayError, setRepayError] = useState('');
  const [repaySuccess, setRepaySuccess] = useState('');
  const [repayLoading, setRepayLoading] = useState(false);

  const loanProducts = useMemo(() => [
    { name: 'Home Loan', description: 'Purchase or renovate your dream home', interestRate: 7.5, maxTenure: 360, minAmount: 100000, maxAmount: 10000000, icon: 'bi bi-house-door', iconClass: 'stat-icon-blue' },
    { name: 'Car Loan', description: 'Finance your new or used vehicle', interestRate: 9.0, maxTenure: 84, minAmount: 50000, maxAmount: 2000000, icon: 'bi bi-car-front', iconClass: 'stat-icon-green' },
    { name: 'Personal Loan', description: 'For any personal financial needs', interestRate: 11.5, maxTenure: 60, minAmount: 10000, maxAmount: 500000, icon: 'bi bi-person-vcard', iconClass: 'stat-icon-purple' },
    { name: 'Education Loan', description: 'Invest in your future with education financing', interestRate: 8.5, maxTenure: 120, minAmount: 50000, maxAmount: 2000000, icon: 'bi bi-mortarboard', iconClass: 'stat-icon-cyan' },
    { name: 'Business Loan', description: 'Grow your business with capital financing', interestRate: 10.0, maxTenure: 120, minAmount: 200000, maxAmount: 50000000, icon: 'bi bi-briefcase', iconClass: 'stat-icon-orange' }
  ], []);

  // Beneficiaries
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [showAddBeneficiary, setShowAddBeneficiary] = useState(false);
  const [benLoading, setBenLoading] = useState(false);
  const [benError, setBenError] = useState('');
  const [newBen, setNewBen] = useState({
    beneficiaryName: '',
    accountNumber: '',
    bankName: '',
    branchName: '',
    ifscCode: '',
  });
  const [selectedBankBranches, setSelectedBankBranches] = useState<any[]>([]);

  const bankList = useMemo(() => [
    { name: 'State Bank of India', branches: [
      { name: 'Mumbai Main', ifsc: 'SBIN0000001' },
      { name: 'Delhi Connaught Place', ifsc: 'SBIN0001234' },
      { name: 'Chennai Anna Salai', ifsc: 'SBIN0002345' },
      { name: 'Kolkata BBD Bagh', ifsc: 'SBIN0003456' }
    ]},
    { name: 'HDFC Bank', branches: [
      { name: 'Bangalore MG Road', ifsc: 'HDFC0000123' },
      { name: 'Hyderabad Banjara Hills', ifsc: 'HDFC0000234' },
      { name: 'Mumbai Andheri', ifsc: 'HDFC0000345' },
      { name: 'Pune Camp', ifsc: 'HDFC0000456' }
    ]},
    { name: 'ICICI Bank', branches: [
      { name: 'Delhi CP Branch', ifsc: 'ICIC0001001' },
      { name: 'Mumbai Fort', ifsc: 'ICIC0001002' },
      { name: 'Bangalore Koramangala', ifsc: 'ICIC0001003' }
    ]},
    { name: 'Axis Bank', branches: [
      { name: 'Chennai Nungambakkam', ifsc: 'UTIB0000001' },
      { name: 'Mumbai Bandra', ifsc: 'UTIB0000002' },
      { name: 'Hyderabad Jubilee Hills', ifsc: 'UTIB0000003' }
    ]},
    { name: 'Maverick Bank', branches: [
      { name: 'Maverick Main Branch', ifsc: 'MAVB0000001' },
      { name: 'Maverick Downtown Branch', ifsc: 'MAVB0000002' },
      { name: 'Maverick East Branch', ifsc: 'MAVB0000003' }
    ]}
  ], []);

  // Cards
  const [cards, setCards] = useState<any[]>([]);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState('');
  const [cardSuccess, setCardSuccess] = useState('');
  const [showApplyCard, setShowApplyCard] = useState(false);
  const [newCard, setNewCard] = useState({
    accountId: '',
    cardType: 'Visa Debit',
    pin: '',
  });
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [cardLimits, setCardLimits] = useState({ dailyAtmLimit: 0, dailyOnlineLimit: 0 });
  const [cardPinChange, setCardPinChange] = useState({ oldPin: '', newPin: '' });
  const [showLimitsModal, setShowLimitsModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  // Format Helper
  const formatCurrency = (val: number, decimals: number = 2) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Base Headers
  const getHeaders = useMemo(() => {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  // Loaders
  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/Accounts/myaccounts`, { headers: getHeaders });
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBeneficiaries = async () => {
    setBenLoading(true);
    try {
      const res = await fetch(`${API}/Beneficiaries/mybeneficiaries`, { headers: getHeaders });
      if (res.ok) {
        const data = await res.json();
        setBeneficiaries(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBenLoading(false);
    }
  };

  const loadLoans = async () => {
    setLoanLoading(true);
    try {
      const res = await fetch(`${API}/Loans/myloans`, { headers: getHeaders });
      if (res.ok) {
        const data = await res.json();
        setMyLoans(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoanLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const res = await fetch(`${API}/Users/me`, { headers: getHeaders });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
        setProfileEdit({
          fullName: data.fullName || '',
          phoneNumber: data.phoneNumber || '',
          address: data.address || '',
          gender: data.gender || '',
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.substring(0, 10) : '',
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadCards = async () => {
    setCardLoading(true);
    try {
      const data = await CardService.getMyCards();
      setCards(data);
    } catch (e) {
      console.error(e);
    } finally {
      setCardLoading(false);
    }
  };

  // SignalR & Init
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (!isCustomer()) {
      navigate(isAdmin() ? '/admin' : '/employee');
      return;
    }

    loadAccounts();
    loadBeneficiaries();
    loadLoans();
    loadProfile();
    loadCards();

    // SignalR Notification Hub
    if (!token) return;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7174/notificationHub', { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on('ReceiveNotification', (title: string, message: string) => {
      setNotifications((prev) => [
        { title, message, time: new Date(), read: false },
        ...prev,
      ]);
    });

    connection.on('BalanceUpdated', () => {
      loadAccounts();
    });

    connection
      .start()
      .catch((err) => console.warn('SignalR connection failed:', err));

    return () => {
      connection.stop();
    };
  }, [isLoggedIn, navigate, token]);

  // Derived Properties
  const activeAccounts = useMemo(() => accounts.filter((a) => a.status === 'Active'), [accounts]);
  const totalBalance = useMemo(() => accounts.reduce((s, a) => s + (a.balance || 0), 0), [accounts]);
  const activeLoansCount = useMemo(() => myLoans.filter((l) => l.loanStatus === 'Approved').length, [myLoans]);
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  // Handlers
  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    setShowNotificationPanel(false);
  };

  const handleRequestCloseAccount = async (id: number) => {
    if (!window.confirm('Are you sure you want to request account closure?')) return;
    try {
      const res = await fetch(`${API}/Accounts/requestclose/${id}`, {
        method: 'PUT',
        headers: getHeaders,
      });
      if (res.ok) {
        window.alert('Closure request submitted. Awaiting employee approval.');
        loadAccounts();
      } else {
        const errText = await res.text();
        window.alert(errText || 'Failed to submit closure request.');
      }
    } catch (e: any) {
      window.alert(e?.message || 'Failed to submit closure request.');
    }
  };

  // Open New Account
  const handleCalcNewAccAge = (dobString: string) => {
    if (!dobString) {
      setNewAcc((prev) => ({ ...prev, dateOfBirth: '', age: null }));
      return;
    }
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    if (
      today.getMonth() < dob.getMonth() ||
      (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
    ) {
      age--;
    }
    setNewAcc((prev) => ({ ...prev, dateOfBirth: dobString, age }));
  };

  const handleOpenAccount = async () => {
    setOpenAccError('');
    setOpenAccSuccess('');
    const a = newAcc;
    if (
      !a.accountType ||
      !a.fullName ||
      !a.address ||
      !a.dateOfBirth ||
      !a.aadharNumber ||
      !a.panNumber
    ) {
      setOpenAccError('All fields are required.');
      return;
    }
    if (a.aadharNumber.length !== 12) {
      setOpenAccError('Aadhar must be 12 digits.');
      return;
    }
    if (a.panNumber.length !== 10) {
      setOpenAccError('PAN must be 10 characters.');
      return;
    }

    setOpenAccLoading(true);
    const body = {
      accountType: a.accountType,
      fullName: a.fullName,
      address: a.address,
      dateOfBirth: a.dateOfBirth,
      aadharNumber: a.aadharNumber,
      pANNumber: a.panNumber.toUpperCase(),
    };

    try {
      const res = await fetch(`${API}/Accounts`, {
        method: 'POST',
        headers: getHeaders,
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setOpenAccSuccess('Account application submitted! Awaiting employee approval.');
        setNewAcc({
          accountType: '',
          fullName: '',
          address: '',
          dateOfBirth: '',
          aadharNumber: '',
          panNumber: '',
          age: null,
        });
        loadAccounts();
      } else {
        const errText = await res.text();
        setOpenAccError(errText || 'Failed to submit account application.');
      }
    } catch (e: any) {
      setOpenAccError(e?.message || 'Failed to submit account application.');
    } finally {
      setOpenAccLoading(false);
    }
  };

  // Deposit
  const handleDoDeposit = async () => {
    setTxError('');
    setTxSuccess('');
    if (!depositAccountId || !depositAmount || depositAmount <= 0) {
      setTxError('Please select an account and enter a valid amount.');
      return;
    }
    setTxLoading(true);
    try {
      const res = await fetch(`${API}/Accounts/deposit`, {
        method: 'POST',
        headers: getHeaders,
        body: JSON.stringify({ accountId: Number(depositAccountId), amount: depositAmount }),
      });

      if (res.ok) {
        const data = await res.json();
        setTxSuccess(`Deposit successful! New balance: ₹${formatCurrency(data.newBalance)}`);
        setDepositAmount(0);
        loadAccounts();
      } else {
        const errText = await res.text();
        setTxError(errText || 'Deposit failed.');
      }
    } catch (e: any) {
      setTxError(e?.message || 'Deposit failed.');
    } finally {
      setTxLoading(false);
    }
  };

  // Withdraw
  const handleDoWithdraw = async () => {
    setTxError('');
    setTxSuccess('');
    if (!withdrawAccountId || !withdrawAmount || withdrawAmount <= 0) {
      setTxError('Please select an account and enter a valid amount.');
      return;
    }
    setTxLoading(true);
    try {
      const res = await fetch(`${API}/Accounts/withdraw`, {
        method: 'POST',
        headers: getHeaders,
        body: JSON.stringify({ accountId: Number(withdrawAccountId), amount: withdrawAmount }),
      });

      if (res.ok) {
        const data = await res.json();
        setTxSuccess(`Withdrawal successful! New balance: ₹${formatCurrency(data.newBalance)}`);
        setWithdrawAmount(0);
        loadAccounts();
      } else {
        const errText = await res.text();
        setTxError(errText || 'Withdrawal failed. Check your balance.');
      }
    } catch (e: any) {
      setTxError(e?.message || 'Withdrawal failed.');
    } finally {
      setTxLoading(false);
    }
  };

  // Transfer
  const handleBeneficiarySelect = (accNo: string) => {
    setSelectedBeneficiaryAcc(accNo);
    if (accNo) {
      setTransferDestAccount(accNo);
    }
  };

  const handleDoTransfer = async () => {
    setTxError('');
    setTxSuccess('');
    if (!transferFromId || !transferDestAccount || !transferAmount || transferAmount <= 0) {
      setTxError('Please fill all transfer details.');
      return;
    }
    setTxLoading(true);
    try {
      const res = await fetch(`${API}/Accounts/transfer`, {
        method: 'POST',
        headers: getHeaders,
        body: JSON.stringify({
          fromAccountId: Number(transferFromId),
          destinationAccountNumber: transferDestAccount,
          amount: transferAmount,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTxSuccess(`Transfer successful! ${data.message || ''}`);
        setTransferAmount(0);
        setTransferDestAccount('');
        setSelectedBeneficiaryAcc('');
        loadAccounts();
      } else {
        const errText = await res.text();
        setTxError(errText || 'Transfer failed.');
      }
    } catch (e: any) {
      setTxError(e?.message || 'Transfer failed.');
    } finally {
      setTxLoading(false);
    }
  };

  // Transactions History load
  const handleLoadTransactions = async (
    filter: string = txFilter,
    accId: string = txAccountId,
    fDate: string = txFromDate,
    tDate: string = txToDate
  ) => {
    if (!accId) {
      setTransactions([]);
      return;
    }
    setTxLoading(true);
    let url = '';
    if (filter === 'last10') {
      url = `${API}/Accounts/last10/${accId}`;
    } else if (filter === 'month') {
      const month = new Date().getMonth() + 1;
      url = `${API}/Accounts/month/${accId}/${month}`;
    } else if (filter === 'range' && fDate && tDate) {
      url = `${API}/Accounts/betweendates?accountId=${accId}&fromDate=${fDate}&toDate=${tDate}`;
    } else {
      setTxLoading(false);
      return;
    }

    try {
      const res = await fetch(url, { headers: getHeaders });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      } else {
        setTransactions([]);
      }
    } catch {
      setTransactions([]);
    } finally {
      setTxLoading(false);
    }
  };

  // Loans Apply
  const handleSelectLoanProduct = (product: any) => {
    setSelectedLoanProduct(product);
    setLoanApplication({
      accountNumber: activeAccounts[0]?.accountNumber || '',
      loanAmount: product.minAmount,
      tenureMonths: 12,
      purpose: product.name,
    });
  };

  const handleApplyLoan = async () => {
    setLoanError('');
    setLoanSuccess('');
    const la = loanApplication;
    if (!la.accountNumber || !la.loanAmount || !la.tenureMonths || !la.purpose) {
      setLoanError('All fields are required.');
      return;
    }
    setLoanLoading(true);
    const body = {
      accountNumber: la.accountNumber,
      loanAmount: la.loanAmount,
      tenureMonths: la.tenureMonths,
      purpose: la.purpose,
    };

    try {
      const res = await fetch(`${API}/Loans/apply`, {
        method: 'POST',
        headers: getHeaders,
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setLoanSuccess('Loan application submitted! Awaiting approval.');
        setLoanApplication({ accountNumber: '', loanAmount: 0, tenureMonths: 0, purpose: '' });
        setSelectedLoanProduct(null);
        loadLoans();
      } else {
        const errText = await res.text();
        setLoanError(errText || 'Loan application failed.');
      }
    } catch (e: any) {
      setLoanError(e?.message || 'Loan application failed.');
    } finally {
      setLoanLoading(false);
    }
  };

  // Loan Repayments
  const handleOpenRepayPanel = (loan: Loan) => {
    setRepayLoanId(loan.id);
    setRepayAccountNumber(loan.accountNumber);
    setRepayAmount(0);
    setRepayError('');
    setRepaySuccess('');
  };

  const handleCloseRepayPanel = () => {
    setRepayLoanId(null);
    setRepayAmount(0);
    setRepayError('');
    setRepaySuccess('');
  };

  const handleRepayLoan = async () => {
    setRepayError('');
    setRepaySuccess('');
    if (!repayAccountNumber || !repayAmount || repayAmount <= 0) {
      setRepayError('Please select a source account and enter a valid amount.');
      return;
    }
    setRepayLoading(true);
    const body = { sourceAccountNumber: repayAccountNumber, amount: repayAmount };
    try {
      const res = await fetch(`${API}/Loans/repay/${repayLoanId}`, {
        method: 'POST',
        headers: getHeaders,
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setRepaySuccess(
          `Repayment of ₹${formatCurrency(repayAmount)} successful! Remaining: ₹${formatCurrency(
            data.newRemainingBalance
          )}. Status: ${data.loanStatus}`
        );
        setRepayAmount(0);
        loadLoans();
        loadAccounts();
      } else {
        const errText = await res.text();
        setRepayError(errText || 'Repayment failed. Check account balance.');
      }
    } catch (e: any) {
      setRepayError(e?.message || 'Repayment failed.');
    } finally {
      setRepayLoading(false);
    }
  };

  // Beneficiaries
  const handleBankChange = (bankName: string) => {
    setNewBen((prev) => ({ ...prev, bankName, branchName: '', ifscCode: '' }));
    const bank = bankList.find((b) => b.name === bankName);
    setSelectedBankBranches(bank ? bank.branches : []);
  };

  const handleBranchChange = (branchName: string) => {
    const branch = selectedBankBranches.find((b) => b.name === branchName);
    setNewBen((prev) => ({ ...prev, branchName, ifscCode: branch ? branch.ifsc : '' }));
  };

  const handleAddBeneficiary = async () => {
    setBenError('');
    const b = newBen;
    if (!b.beneficiaryName || !b.accountNumber || !b.bankName || !b.branchName || !b.ifscCode) {
      setBenError('All fields are required.');
      return;
    }
    setBenLoading(true);
    try {
      const res = await fetch(`${API}/Beneficiaries/add`, {
        method: 'POST',
        headers: getHeaders,
        body: JSON.stringify(b),
      });

      if (res.ok) {
        setShowAddBeneficiary(false);
        setNewBen({ beneficiaryName: '', accountNumber: '', bankName: '', branchName: '', ifscCode: '' });
        loadBeneficiaries();
      } else {
        const errText = await res.text();
        setBenError(errText || 'Failed to add beneficiary.');
      }
    } catch (e: any) {
      setBenError(e?.message || 'Failed to add beneficiary.');
    } finally {
      setBenLoading(false);
    }
  };

  const handleTransferToBeneficiary = (b: Beneficiary) => {
    setActiveTab('transfer');
    setTransferDestAccount(b.accountNumber);
    setSelectedBeneficiaryAcc(b.accountNumber);
  };

  const handleDeleteBeneficiary = async (id: number) => {
    if (!window.confirm('Remove this beneficiary?')) return;
    try {
      const res = await fetch(`${API}/Beneficiaries/delete/${id}`, {
        method: 'DELETE',
        headers: getHeaders,
      });
      if (res.ok) {
        loadBeneficiaries();
      } else {
        const errText = await res.text();
        window.alert(errText || 'Failed to remove beneficiary.');
      }
    } catch (e: any) {
      window.alert(e?.message || 'Failed to remove beneficiary.');
    }
  };

  // Profile Edit
  const handleSaveProfile = async () => {
    setProfileError('');
    setProfileSuccess('');
    if (!profileEdit.fullName) {
      setProfileError('Full Name is required.');
      return;
    }
    setProfileLoading(true);
    const body = {
      fullName: profileEdit.fullName,
      phoneNumber: profileEdit.phoneNumber || null,
      address: profileEdit.address || null,
      gender: profileEdit.gender || null,
      dateOfBirth: profileEdit.dateOfBirth ? new Date(profileEdit.dateOfBirth).toISOString() : null,
    };

    try {
      const res = await fetch(`${API}/Users/profile`, {
        method: 'PUT',
        headers: getHeaders,
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setProfileSuccess('Profile updated successfully!');
        setProfileData(data);
        // Refresh local name storage
        const localUserData = localStorage.getItem('user');
        if (localUserData) {
          const parsed = JSON.parse(localUserData);
          parsed.fullName = data.fullName;
          localStorage.setItem('user', JSON.stringify(parsed));
        }
      } else {
        const errText = await res.text();
        setProfileError(errText || 'Failed to update profile.');
      }
    } catch (e: any) {
      setProfileError(e?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Cards Operations
  const handleApplyNewCard = async () => {
    setCardError('');
    setCardSuccess('');
    const c = newCard;
    if (!c.accountId || !c.cardType || !c.pin) {
      setCardError('All fields are required.');
      return;
    }
    if (c.pin.length !== 4 || isNaN(Number(c.pin))) {
      setCardError('PIN must be exactly 4 digits.');
      return;
    }
    setCardLoading(true);
    try {
      await CardService.applyCard(Number(c.accountId), c.cardType, c.pin);
      setCardSuccess('Card applied and issued successfully!');
      setNewCard({ accountId: '', cardType: 'Visa Debit', pin: '' });
      setShowApplyCard(false);
      loadCards();
    } catch (e: any) {
      setCardError(e?.message || 'Failed to apply for card.');
    } finally {
      setCardLoading(false);
    }
  };

  const handleToggleCardBlock = async (card: any) => {
    try {
      const res = await CardService.toggleBlock(card.id);
      window.alert(res.message);
      loadCards();
    } catch (e: any) {
      window.alert(e?.message || 'Failed to toggle card freeze state.');
    }
  };

  const handleOpenLimitsModal = (card: any) => {
    setSelectedCard(card);
    setCardLimits({ dailyAtmLimit: card.dailyAtmLimit, dailyOnlineLimit: card.dailyOnlineLimit });
    setCardError('');
    setCardSuccess('');
    setShowLimitsModal(true);
  };

  const handleSaveCardLimits = async () => {
    setCardError('');
    setCardSuccess('');
    if (!selectedCard) return;
    setCardLoading(true);
    try {
      await CardService.updateLimits(selectedCard.id, cardLimits.dailyAtmLimit, cardLimits.dailyOnlineLimit);
      setCardSuccess('Limits updated successfully!');
      loadCards();
      setTimeout(() => setShowLimitsModal(false), 1500);
    } catch (e: any) {
      setCardError(e?.message || 'Failed to update daily limits.');
    } finally {
      setCardLoading(false);
    }
  };

  const handleOpenPinModal = (card: any) => {
    setSelectedCard(card);
    setCardPinChange({ oldPin: '', newPin: '' });
    setCardError('');
    setCardSuccess('');
    setShowPinModal(true);
  };

  const handleChangeCardPin = async () => {
    setCardError('');
    setCardSuccess('');
    const pin = cardPinChange;
    if (!pin.oldPin || !pin.newPin) {
      setCardError('Both current and new PIN are required.');
      return;
    }
    if (pin.newPin.length !== 4 || isNaN(Number(pin.newPin))) {
      setCardError('New PIN must be exactly 4 digits.');
      return;
    }
    setCardLoading(true);
    try {
      await CardService.updatePin(selectedCard.id, pin.oldPin, pin.newPin);
      setCardSuccess('PIN changed successfully!');
      setTimeout(() => setShowPinModal(false), 1500);
    } catch (e: any) {
      setCardError(e?.message || 'Failed to update PIN. Please verify your current PIN.');
    } finally {
      setCardLoading(false);
    }
  };

  const getCardThemeClass = (type: string): string => {
    if (type === 'Mastercard Platinum') return 'platinum-card';
    if (type === 'Visa Gold') return 'gold-card';
    return 'classic-card';
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
              <span className="sidebar-brand-tag">Secure Banking Portal</span>
            </div>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{getInitials()}</div>
          <div style={{ flex: 1 }}>
            <div className="sidebar-user-name">{getUserName()}</div>
            <div className="sidebar-user-role">Customer</div>
          </div>
          {/* Notification Bell */}
          <div
            style={{ position: 'relative', cursor: 'pointer' }}
            onClick={() => {
              setShowNotificationPanel(!showNotificationPanel);
              handleMarkAllRead();
            }}
          >
            <i
              className="bi bi-bell-fill"
              style={{ fontSize: '20px', color: unreadCount > 0 ? '#f59e0b' : 'var(--dark-text-dim)' }}
            ></i>
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-6px',
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '50%',
                  fontSize: '10px',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
        </div>

        {/* Notification Panel */}
        {showNotificationPanel && (
          <div
            className="card"
            style={{ margin: '0 16px 12px', maxHeight: '280px', overflowY: 'auto', border: '1px solid rgba(245,158,11,0.3)' }}
          >
            <div className="card-body" style={{ padding: '12px' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span style={{ fontWeight: 700, fontSize: '13px' }}>
                  <i className="bi bi-bell me-1"></i> Notifications
                </span>
                <button
                  className="btn btn-sm"
                  style={{ fontSize: '11px', color: '#ef4444', padding: '2px 8px' }}
                  onClick={handleClearNotifications}
                >
                  Clear All
                </button>
              </div>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--dark-text-dim)', fontSize: '12px', padding: '12px 0' }}>
                  No notifications
                </div>
              ) : (
                notifications.map((n, idx) => (
                  <div
                    key={idx}
                    style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '12px' }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--dark-text)' }}>{n.title}</div>
                    <div style={{ color: 'var(--dark-text-dim)', marginTop: '2px' }}>{n.message}</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginTop: '2px' }}>
                      {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Overview</div>
          <a
            className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="bi bi-grid-1x2"></i> Dashboard
          </a>
          <a
            className={`sidebar-link ${activeTab === 'accounts' ? 'active' : ''}`}
            onClick={() => setActiveTab('accounts')}
          >
            <i className="bi bi-credit-card-2-front"></i> My Accounts
          </a>

          <div className="sidebar-section-label">Transactions</div>
          <a
            className={`sidebar-link ${activeTab === 'deposit' ? 'active' : ''}`}
            onClick={() => setActiveTab('deposit')}
          >
            <i className="bi bi-arrow-down-circle"></i> Deposit
          </a>
          <a
            className={`sidebar-link ${activeTab === 'withdraw' ? 'active' : ''}`}
            onClick={() => setActiveTab('withdraw')}
          >
            <i className="bi bi-arrow-up-circle"></i> Withdraw
          </a>
          <a
            className={`sidebar-link ${activeTab === 'transfer' ? 'active' : ''}`}
            onClick={() => setActiveTab('transfer')}
          >
            <i className="bi bi-arrow-left-right"></i> Transfer Funds
          </a>
          <a
            className={`sidebar-link ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('history');
              handleLoadTransactions(txFilter, txAccountId);
            }}
          >
            <i className="bi bi-clock-history"></i> Transaction History
          </a>

          <div className="sidebar-section-label">Banking</div>
          <a
            className={`sidebar-link ${activeTab === 'openaccount' ? 'active' : ''}`}
            onClick={() => setActiveTab('openaccount')}
          >
            <i className="bi bi-plus-circle"></i> Open Account
          </a>
          <a
            className={`sidebar-link ${activeTab === 'cards' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('cards');
              loadCards();
            }}
          >
            <i className="bi bi-credit-card"></i> Cards
          </a>
          <a
            className={`sidebar-link ${activeTab === 'loans' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('loans');
              loadLoans();
            }}
          >
            <i className="bi bi-cash-coin"></i> Loans
          </a>
          <a
            className={`sidebar-link ${activeTab === 'beneficiaries' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('beneficiaries');
              loadBeneficiaries();
            }}
          >
            <i className="bi bi-people"></i> Beneficiaries
          </a>

          <div className="sidebar-section-label">Account</div>
          <a
            className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('profile');
              loadProfile();
            }}
          >
            <i className="bi bi-person-circle"></i> My Profile
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
        {/* ============== OVERVIEW TAB ============== */}
        {activeTab === 'overview' && (
          <div className="animate-in">
            <div className="page-header">
              <h1 className="page-title">Welcome back, {getUserName().split(' ')[0]}! 👋</h1>
              <p className="page-subtitle">Here's your financial overview for today</p>
            </div>

            {/* Stats Row */}
            <div className="row g-3 mb-4">
              <div className="col-md-3 col-6">
                <div className="stat-card">
                  <div className="stat-icon stat-icon-blue">
                    <i className="bi bi-credit-card-2-front"></i>
                  </div>
                  <div>
                    <div className="stat-label">Total Accounts</div>
                    <div className="stat-value">{accounts.length}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="stat-card">
                  <div className="stat-icon stat-icon-green">
                    <i className="bi bi-wallet2"></i>
                  </div>
                  <div>
                    <div className="stat-label">Total Balance</div>
                    <div className="stat-value">₹{formatCurrency(totalBalance, 0)}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="stat-card">
                  <div className="stat-icon stat-icon-purple">
                    <i className="bi bi-people"></i>
                  </div>
                  <div>
                    <div className="stat-label">Beneficiaries</div>
                    <div className="stat-value">{beneficiaries.length}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="stat-card">
                  <div className="stat-icon stat-icon-orange">
                    <i className="bi bi-cash-coin"></i>
                  </div>
                  <div>
                    <div className="stat-label">Active Loans</div>
                    <div className="stat-value">{activeLoansCount}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Cards */}
            <h5
              style={{
                fontWeight: 700,
                marginBottom: '16px',
                color: 'var(--dark-text-dim)',
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              <i className="bi bi-credit-card-2-front me-2"></i>Your Accounts
            </h5>
            {accounts.length > 0 ? (
              <div className="row g-3 mb-4">
                {accounts.map((account) => (
                  <div className="col-md-4" key={account.id}>
                    <div className="account-card">
                      <span
                        className={`account-type-badge ${
                          account.accountType === 'Savings'
                            ? 'badge-savings'
                            : account.accountType === 'Checking'
                            ? 'badge-checking'
                            : 'badge-business'
                        }`}
                      >
                        {account.accountType}
                      </span>
                      <span
                        className={`ms-2 account-type-badge ${
                          account.status === 'Active'
                            ? 'badge-active'
                            : account.status === 'Pending'
                            ? 'badge-pending'
                            : 'badge-closed'
                        }`}
                      >
                        {account.status}
                      </span>
                      <div className="account-balance">₹{formatCurrency(account.balance)}</div>
                      <div className="account-number">{account.accountNumber}</div>
                      <div className="divider" style={{ margin: '14px 0 10px' }}></div>
                      <div style={{ fontSize: '12px', color: 'var(--dark-text-dim)' }}>
                        <i className="bi bi-building me-1"></i> {account.branchName}
                        <span className="ms-3">
                          <i className="bi bi-hash"></i> {account.ifscCode}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !isLoading && (
                <div className="empty-state">
                  <i className="bi bi-credit-card-2-front"></i>
                  <h6>No Accounts Found</h6>
                  <p style={{ fontSize: '13px' }}>Open your first bank account to get started.</p>
                  <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('openaccount')}>
                    <i className="bi bi-plus-circle"></i> Open Account
                  </button>
                </div>
              )
            )}

            {/* Quick Actions */}
            <h5
              style={{
                fontWeight: 700,
                marginBottom: '16px',
                marginTop: '24px',
                color: 'var(--dark-text-dim)',
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              <i className="bi bi-lightning me-2"></i>Quick Actions
            </h5>
            <div className="row g-3">
              <div className="col-md-3 col-6">
                <button className="btn btn-success btn-full py-3" onClick={() => setActiveTab('deposit')}>
                  <div>
                    <i className="bi bi-arrow-down-circle" style={{ fontSize: '20px', display: 'block', marginBottom: '4px' }}></i>{' '}
                    Deposit
                  </div>
                </button>
              </div>
              <div className="col-md-3 col-6">
                <button className="btn btn-danger btn-full py-3" onClick={() => setActiveTab('withdraw')}>
                  <div>
                    <i className="bi bi-arrow-up-circle" style={{ fontSize: '20px', display: 'block', marginBottom: '4px' }}></i>{' '}
                    Withdraw
                  </div>
                </button>
              </div>
              <div className="col-md-3 col-6">
                <button className="btn btn-primary btn-full py-3" onClick={() => setActiveTab('transfer')}>
                  <div>
                    <i className="bi bi-arrow-left-right" style={{ fontSize: '20px', display: 'block', marginBottom: '4px' }}></i>{' '}
                    Transfer
                  </div>
                </button>
              </div>
              <div className="col-md-3 col-6">
                <button
                  className="btn btn-warning btn-full py-3"
                  onClick={() => {
                    setActiveTab('loans');
                    loadLoans();
                  }}
                >
                  <div>
                    <i className="bi bi-cash-coin" style={{ fontSize: '20px', display: 'block', marginBottom: '4px' }}></i> Apply
                    Loan
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============== ACCOUNTS TAB ============== */}
        {activeTab === 'accounts' && (
          <div className="animate-in">
            <div className="page-header">
              <h1 className="page-title">My Accounts</h1>
              <p className="page-subtitle">Manage all your bank accounts</p>
            </div>

            {accounts.length > 0 ? (
              <div className="row g-3">
                {accounts.map((account) => (
                  <div className="col-12" key={account.id}>
                    <div className="card">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                          <div>
                            <div className="mb-2">
                              <span
                                className={`account-type-badge me-2 ${
                                  account.accountType === 'Savings'
                                    ? 'badge-savings'
                                    : account.accountType === 'Checking'
                                    ? 'badge-checking'
                                    : 'badge-business'
                                }`}
                              >
                                {account.accountType}
                              </span>
                              <span
                                className={`account-type-badge ${
                                  account.status === 'Active'
                                    ? 'badge-active'
                                    : account.status === 'Pending'
                                    ? 'badge-pending'
                                    : 'badge-closed'
                                }`}
                              >
                                {account.status}
                              </span>
                            </div>
                            <div className="account-balance" style={{ fontSize: '24px' }}>
                              ₹{formatCurrency(account.balance)}
                            </div>
                            <div className="account-number">{account.accountNumber}</div>
                          </div>
                          {account.status === 'Active' && (
                            <div>
                              <button className="btn btn-danger btn-sm" onClick={() => handleRequestCloseAccount(account.id)}>
                                <i className="bi bi-x-circle"></i> Request Closure
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="divider"></div>
                        <div className="row g-2" style={{ fontSize: '13px' }}>
                          <div className="col-md-3">
                            <span style={{ color: 'var(--dark-text-dim)' }}>Account Holder</span>
                            <br />
                            <strong>{account.fullName || getUserName()}</strong>
                          </div>
                          <div className="col-md-3">
                            <span style={{ color: 'var(--dark-text-dim)' }}>Branch</span>
                            <br />
                            <strong>{account.branchName}</strong>
                          </div>
                          <div className="col-md-3">
                            <span style={{ color: 'var(--dark-text-dim)' }}>IFSC Code</span>
                            <br />
                            <strong>{account.ifscCode}</strong>
                          </div>
                          <div className="col-md-3">
                            <span style={{ color: 'var(--dark-text-dim)' }}>Branch Address</span>
                            <br />
                            <strong>{account.branchAddress || 'Main Street Hub'}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <i className="bi bi-credit-card-2-front"></i>
                <h6>No Accounts Found</h6>
                <button className="btn btn-primary btn-sm mt-2" onClick={() => setActiveTab('openaccount')}>
                  Open Account
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============== DEPOSIT TAB ============== */}
        {activeTab === 'deposit' && (
          <div className="animate-in">
            <div className="page-header">
              <h1 className="page-title">Deposit Funds</h1>
              <p className="page-subtitle">Add money to your bank account</p>
            </div>
            <div className="row justify-content-center">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <i className="bi bi-arrow-down-circle text-success me-2"></i>Make a Deposit
                  </div>
                  <div className="card-body">
                    {txError && (
                      <div className="alert alert-danger">
                        <i className="bi bi-exclamation-circle-fill"></i> {txError}
                      </div>
                    )}
                    {txSuccess && (
                      <div className="alert alert-success">
                        <i className="bi bi-check-circle-fill"></i> {txSuccess}
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label">Select Account</label>
                      <select
                        className="form-select"
                        value={depositAccountId}
                        onChange={(e) => setDepositAccountId(e.target.value)}
                      >
                        <option value="">-- Select Account --</option>
                        {activeAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.accountNumber} – {acc.accountType} (₹{formatCurrency(acc.balance)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Amount (₹)</label>
                      <div className="input-group-icon">
                        <i className="bi bi-currency-rupee icon"></i>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Enter amount"
                          value={depositAmount || ''}
                          onChange={(e) => setDepositAmount(Number(e.target.value))}
                          min="1"
                        />
                      </div>
                    </div>
                    <button className="btn btn-success btn-full" onClick={handleDoDeposit} disabled={txLoading}>
                      {txLoading && <span className="spinner"></span>}
                      {!txLoading && <i className="bi bi-arrow-down-circle"></i>}
                      {txLoading ? 'Processing...' : 'Deposit Funds'}
                    </button>
                  </div>
                </div>

                <div className="card mt-4" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px dashed rgba(16, 185, 129, 0.25)' }}>
                  <div className="card-body" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      <div
                        style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          flexShrink: 0,
                        }}
                      >
                        <i className="bi bi-shield-lock-fill"></i>
                      </div>
                      <div>
                        <h6 style={{ color: '#fff', fontWeight: 600, marginBottom: '4px', fontSize: '14px' }}>
                          Secure Transaction Guarantee
                        </h6>
                        <p style={{ color: 'var(--dark-text-dim)', fontSize: '12.5px', lineHeight: 1.5, marginBottom: 0 }}>
                          All deposits are processed using end-to-end 256-bit encryption. Never share your bank account
                          credentials or PIN with anyone. Maverick Bank will never ask for your password via email or SMS.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============== WITHDRAW TAB ============== */}
        {activeTab === 'withdraw' && (
          <div className="animate-in">
            <div className="page-header">
              <h1 className="page-title">Withdraw Funds</h1>
              <p className="page-subtitle">Withdraw money from your account</p>
            </div>
            <div className="row justify-content-center">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <i className="bi bi-arrow-up-circle text-danger me-2"></i>Make a Withdrawal
                  </div>
                  <div className="card-body">
                    {txError && (
                      <div className="alert alert-danger">
                        <i className="bi bi-exclamation-circle-fill"></i> {txError}
                      </div>
                    )}
                    {txSuccess && (
                      <div className="alert alert-success">
                        <i className="bi bi-check-circle-fill"></i> {txSuccess}
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label">Select Account</label>
                      <select
                        className="form-select"
                        value={withdrawAccountId}
                        onChange={(e) => setWithdrawAccountId(e.target.value)}
                      >
                        <option value="">-- Select Account --</option>
                        {activeAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.accountNumber} – {acc.accountType} (₹{formatCurrency(acc.balance)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Amount (₹)</label>
                      <div className="input-group-icon">
                        <i className="bi bi-currency-rupee icon"></i>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Enter amount"
                          value={withdrawAmount || ''}
                          onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                          min="1"
                        />
                      </div>
                    </div>
                    <button className="btn btn-danger btn-full" onClick={handleDoWithdraw} disabled={txLoading}>
                      {txLoading && <span className="spinner"></span>}
                      {!txLoading && <i className="bi bi-arrow-up-circle"></i>}
                      {txLoading ? 'Processing...' : 'Withdraw Funds'}
                    </button>
                  </div>
                </div>

                <div className="card mt-4" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px dashed rgba(239, 68, 68, 0.25)' }}>
                  <div className="card-body" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      <div
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#ef4444',
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          flexShrink: 0,
                        }}
                      >
                        <i className="bi bi-shield-fill-exclamation"></i>
                      </div>
                      <div>
                        <h6 style={{ color: '#fff', fontWeight: 600, marginBottom: '4px', fontSize: '14px' }}>
                          Secure Withdrawal Note
                        </h6>
                        <p style={{ color: 'var(--dark-text-dim)', fontSize: '12.5px', lineHeight: 1.5, marginBottom: 0 }}>
                          Please verify your available balance and withdrawal details before confirming. For security purposes,
                          large withdrawals may trigger additional verification steps to protect your funds.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============== TRANSFER TAB ============== */}
        {activeTab === 'transfer' && (
          <div className="animate-in">
            <div className="page-header">
              <h1 className="page-title">Transfer Funds</h1>
              <p className="page-subtitle">Send money to another account</p>
            </div>
            <div className="row justify-content-center">
              <div className="col-md-7">
                <div className="card">
                  <div className="card-header">
                    <i className="bi bi-arrow-left-right text-primary me-2"></i>Fund Transfer
                  </div>
                  <div className="card-body">
                    {txError && (
                      <div className="alert alert-danger">
                        <i className="bi bi-exclamation-circle-fill"></i> {txError}
                      </div>
                    )}
                    {txSuccess && (
                      <div className="alert alert-success">
                        <i className="bi bi-check-circle-fill"></i> {txSuccess}
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label">From Account</label>
                      <select
                        className="form-select"
                        value={transferFromId}
                        onChange={(e) => setTransferFromId(e.target.value)}
                      >
                        <option value="">-- Select Account --</option>
                        {activeAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.accountNumber} – {acc.accountType} (₹{formatCurrency(acc.balance)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Destination Account Number</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter account number"
                        value={transferDestAccount}
                        onChange={(e) => setTransferDestAccount(e.target.value)}
                      />
                    </div>

                    {beneficiaries.length > 0 && (
                      <div className="form-group">
                        <label className="form-label">Or Select Beneficiary</label>
                        <select
                          className="form-select"
                          value={selectedBeneficiaryAcc}
                          onChange={(e) => handleBeneficiarySelect(e.target.value)}
                        >
                          <option value="">-- Select Beneficiary --</option>
                          {beneficiaries.map((b) => (
                            <option key={b.id} value={b.accountNumber}>
                              {b.beneficiaryName} ({b.accountNumber}) – {b.bankName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label">Amount (₹)</label>
                      <div className="input-group-icon">
                        <i className="bi bi-currency-rupee icon"></i>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Enter amount"
                          value={transferAmount || ''}
                          onChange={(e) => setTransferAmount(Number(e.target.value))}
                          min="1"
                        />
                      </div>
                    </div>

                    <button className="btn btn-primary btn-full" onClick={handleDoTransfer} disabled={txLoading}>
                      {txLoading && <span className="spinner"></span>}
                      {!txLoading && <i className="bi bi-arrow-left-right"></i>}
                      {txLoading ? 'Processing...' : 'Transfer Now'}
                    </button>
                  </div>
                </div>

                <div className="card mt-4" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px dashed rgba(99, 102, 241, 0.25)' }}>
                  <div className="card-body" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      <div
                        style={{
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: '#818cf8',
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          flexShrink: 0,
                        }}
                      >
                        <i className="bi bi-shield-shaded"></i>
                      </div>
                      <div>
                        <h6 style={{ color: '#fff', fontWeight: 600, marginBottom: '4px', fontSize: '14px' }}>
                          Safe Transfer Guidelines
                        </h6>
                        <p style={{ color: 'var(--dark-text-dim)', fontSize: '12.5px', lineHeight: 1.5, marginBottom: 0 }}>
                          Ensure the destination account number or beneficiary details are correct before sending. Completed
                          transfers are instantaneous and cannot be reversed. Keep your transactions secure.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============== TRANSACTION HISTORY TAB ============== */}
        {activeTab === 'history' && (
          <div className="animate-in">
            <div className="page-header">
              <h1 className="page-title">Transaction History</h1>
              <p className="page-subtitle">View your complete transaction records</p>
            </div>

            {/* Filter Bar */}
            <div className="card mb-4">
              <div className="card-body">
                <div className="row g-3 align-items-end">
                  <div className="col-md-3">
                    <label className="form-label">Account</label>
                    <select
                      className="form-select"
                      value={txAccountId}
                      onChange={(e) => {
                        setTxAccountId(e.target.value);
                        handleLoadTransactions(txFilter, e.target.value);
                      }}
                    >
                      <option value="">-- All Accounts --</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountNumber} ({acc.accountType})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Filter</label>
                    <div className="tab-bar" style={{ marginBottom: 0 }}>
                      <button
                        className={`tab-btn ${txFilter === 'last10' ? 'active' : ''}`}
                        onClick={() => {
                          setTxFilter('last10');
                          handleLoadTransactions('last10', txAccountId);
                        }}
                      >
                        Last 10
                      </button>
                      <button
                        className={`tab-btn ${txFilter === 'month' ? 'active' : ''}`}
                        onClick={() => {
                          setTxFilter('month');
                          handleLoadTransactions('month', txAccountId);
                        }}
                      >
                        Month
                      </button>
                      <button
                        className={`tab-btn ${txFilter === 'range' ? 'active' : ''}`}
                        onClick={() => setTxFilter('range')}
                      >
                        Range
                      </button>
                    </div>
                  </div>
                  {txFilter === 'range' && (
                    <>
                      <div className="col-md-2">
                        <label className="form-label">From Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={txFromDate}
                          onChange={(e) => setTxFromDate(e.target.value)}
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">To Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={txToDate}
                          onChange={(e) => setTxToDate(e.target.value)}
                        />
                      </div>
                      <div className="col-md-2">
                        <button
                          className="btn btn-primary btn-full"
                          onClick={() => handleLoadTransactions(txFilter, txAccountId, txFromDate, txToDate)}
                        >
                          <i className="bi bi-search"></i> Search
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="card">
              <div className="card-body p-0">
                {txLoading && (
                  <div className="loading-overlay">
                    <span className="spinner"></span> Loading transactions...
                  </div>
                )}
                {!txLoading && transactions.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Description</th>
                          <th className="text-end">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx, idx) => (
                          <tr key={idx}>
                            <td style={{ color: 'var(--dark-text-dim)' }}>
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
                            <td>
                              <span
                                className={`badge ${
                                  tx.transactionType === 'Deposit' ||
                                  tx.transactionType === 'Transfer Received' ||
                                  tx.transactionType === 'Loan Disbursement'
                                    ? 'badge-tx-deposit'
                                    : tx.transactionType === 'Withdraw' ||
                                      tx.transactionType === 'Transfer Sent' ||
                                      tx.transactionType === 'Loan Repayment'
                                    ? 'badge-tx-withdraw'
                                    : 'badge-tx-transfer'
                                }`}
                              >
                                {tx.transactionType}
                              </span>
                            </td>
                            <td style={{ color: 'var(--dark-text-dim)' }}>{tx.description || '—'}</td>
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
                  !txLoading && (
                    <div className="empty-state">
                      <i className="bi bi-clock-history"></i>
                      <h6>No Transactions Found</h6>
                      <p style={{ fontSize: '13px' }}>Select an account and filter to see transactions.</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============== OPEN ACCOUNT TAB ============== */}
        {activeTab === 'openaccount' && (
          <div className="animate-in">
            <div className="page-header">
              <h1 className="page-title">Open New Account</h1>
              <p className="page-subtitle">Apply for a new bank account – pending employee approval</p>
            </div>
            <div className="row justify-content-center">
              <div className="col-md-7">
                <div className="card">
                  <div className="card-header">
                    <i className="bi bi-plus-circle text-primary me-2"></i>Account Application
                  </div>
                  <div className="card-body">
                    {openAccError && (
                      <div className="alert alert-danger">
                        <i className="bi bi-exclamation-circle-fill"></i> {openAccError}
                      </div>
                    )}
                    {openAccSuccess && (
                      <div className="alert alert-success">
                        <i className="bi bi-check-circle-fill"></i> {openAccSuccess}
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label">Account Type</label>
                      <select
                        className="form-select"
                        value={newAcc.accountType}
                        onChange={(e) => setNewAcc((prev) => ({ ...prev, accountType: e.target.value }))}
                      >
                        <option value="">-- Select Type --</option>
                        <option value="Savings">Savings Account</option>
                        <option value="Checking">Checking Account</option>
                        <option value="Business">Business Account</option>
                      </select>
                    </div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-label">Full Name</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Full name on account"
                            value={newAcc.fullName}
                            onChange={(e) => setNewAcc((prev) => ({ ...prev, fullName: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-label">Date of Birth</label>
                          <input
                            type="date"
                            className="form-control"
                            value={newAcc.dateOfBirth}
                            onChange={(e) => handleCalcNewAccAge(e.target.value)}
                          />
                          {newAcc.age !== null && (
                            <small style={{ fontSize: '12px', color: 'var(--success)' }}>
                              Age: {newAcc.age} years
                            </small>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Address</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Residential address"
                        value={newAcc.address}
                        onChange={(e) => setNewAcc((prev) => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-label">Aadhar Number</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="12-digit Aadhar"
                            value={newAcc.aadharNumber}
                            onChange={(e) => setNewAcc((prev) => ({ ...prev, aadharNumber: e.target.value }))}
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
                            placeholder="e.g. ABCDE1234F"
                            value={newAcc.panNumber}
                            onChange={(e) => setNewAcc((prev) => ({ ...prev, panNumber: e.target.value }))}
                            maxLength={10}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle-fill"></i> Your application will be reviewed by a bank employee.
                      Once approved, your account will be activated.
                    </div>
                    <button className="btn btn-primary btn-full" onClick={handleOpenAccount} disabled={openAccLoading}>
                      {openAccLoading && <span className="spinner"></span>}
                      {!openAccLoading && <i className="bi bi-plus-circle"></i>}
                      {openAccLoading ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============== LOANS TAB ============== */}
        {activeTab === 'loans' && (
          <div className="animate-in">
            <div className="page-header">
              <h1 className="page-title">Loans</h1>
              <p className="page-subtitle">Apply for loans and manage existing ones</p>
            </div>

            {/* Tab bar */}
            <div className="tab-bar">
              <button
                className={`tab-btn ${loanSubTab === 'apply' ? 'active' : ''}`}
                onClick={() => setLoanSubTab('apply')}
              >
                Apply for Loan
              </button>
              <button
                className={`tab-btn ${loanSubTab === 'myloans' ? 'active' : ''}`}
                onClick={() => {
                  setLoanSubTab('myloans');
                  loadLoans();
                }}
              >
                My Loans
              </button>
            </div>

            {/* Apply */}
            {loanSubTab === 'apply' && (
              <div>
                <div className="row g-4">
                  {/* Loan Products */}
                  {loanProducts.map((product, idx) => (
                    <div className="col-md-4" key={idx}>
                      <div
                        className="card"
                        style={{
                          cursor: 'pointer',
                          transition: 'var(--transition)',
                          borderColor: selectedLoanProduct?.name === product.name ? 'var(--primary)' : '',
                        }}
                        onClick={() => handleSelectLoanProduct(product)}
                      >
                        <div className="card-body">
                          <div
                            className={`stat-icon mb-3 ${product.iconClass}`}
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <i className={`${product.icon}`} style={{ fontSize: '20px' }}></i>
                          </div>
                          <h6 style={{ fontWeight: 700, marginBottom: '4px' }}>{product.name}</h6>
                          <div style={{ fontSize: '13px', color: 'var(--dark-text-dim)', marginBottom: '12px' }}>
                            {product.description}
                          </div>
                          <div className="info-row">
                            <span className="label">Rate of Interest</span>
                            <span className="value text-success">{product.interestRate}% p.a.</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Max Tenure</span>
                            <span className="value">{product.maxTenure} months</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Amount Range</span>
                            <span className="value">
                              ₹{formatCurrency(product.minAmount, 0)} – ₹{formatCurrency(product.maxAmount, 0)}
                            </span>
                          </div>
                          <button className="btn btn-primary btn-full btn-sm mt-3">
                            {selectedLoanProduct?.name === product.name && (
                              <i className="bi bi-check-circle me-1"></i>
                            )}
                            {selectedLoanProduct?.name === product.name ? 'Selected' : 'Select'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Apply Form */}
                {selectedLoanProduct && (
                  <div className="row justify-content-center mt-4">
                    <div className="col-md-6">
                      <div className="card">
                        <div className="card-header">
                          <i className="bi bi-cash-coin text-warning me-2"></i>Loan Application – {selectedLoanProduct.name}
                        </div>
                        <div className="card-body">
                          {loanError && (
                            <div className="alert alert-danger">
                              <i className="bi bi-exclamation-circle-fill"></i> {loanError}
                            </div>
                          )}
                          {loanSuccess && (
                            <div className="alert alert-success">
                              <i className="bi bi-check-circle-fill"></i> {loanSuccess}
                            </div>
                          )}
                          <div className="form-group">
                            <label className="form-label">Select Account (for disbursement)</label>
                            <select
                              className="form-select"
                              value={loanApplication.accountNumber}
                              onChange={(e) =>
                                setLoanApplication((prev) => ({ ...prev, accountNumber: e.target.value }))
                              }
                            >
                              <option value="">-- Select Account --</option>
                              {activeAccounts.map((acc) => (
                                <option key={acc.id} value={acc.accountNumber}>
                                  {acc.accountNumber} – {acc.accountType}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Loan Amount (₹)</label>
                            <div className="input-group-icon">
                              <i className="bi bi-currency-rupee icon"></i>
                              <input
                                type="number"
                                className="form-control"
                                placeholder={`₹${selectedLoanProduct.minAmount} – ₹${selectedLoanProduct.maxAmount}`}
                                value={loanApplication.loanAmount || ''}
                                onChange={(e) =>
                                  setLoanApplication((prev) => ({ ...prev, loanAmount: Number(e.target.value) }))
                                }
                                min={selectedLoanProduct.minAmount}
                                max={selectedLoanProduct.maxAmount}
                              />
                            </div>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Tenure (Months)</label>
                            <input
                              type="number"
                              className="form-control"
                              placeholder={`Max ${selectedLoanProduct.maxTenure} months`}
                              value={loanApplication.tenureMonths || ''}
                              onChange={(e) =>
                                setLoanApplication((prev) => ({ ...prev, tenureMonths: Number(e.target.value) }))
                              }
                              max={selectedLoanProduct.maxTenure}
                              min="1"
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Purpose</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. Home purchase, Car, Education"
                              value={loanApplication.purpose}
                              onChange={(e) => setLoanApplication((prev) => ({ ...prev, purpose: e.target.value }))}
                            />
                          </div>
                          <button className="btn btn-warning btn-full" onClick={handleApplyLoan} disabled={loanLoading}>
                            {loanLoading && <span className="spinner"></span>}
                            {!loanLoading && <i className="bi bi-send"></i>}
                            {loanLoading ? 'Submitting...' : 'Submit Loan Application'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* My Loans */}
            {loanSubTab === 'myloans' && (
              <div>
                {loanLoading && (
                  <div className="loading-overlay">
                    <span className="spinner"></span> Loading...
                  </div>
                )}
                {myLoans.length > 0 ? (
                  <div className="row g-3">
                    {myLoans.map((loan) => (
                      <div className="col-md-6" key={loan.id}>
                        <div className="card">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h6 style={{ fontWeight: 700, margin: 0 }}>{loan.purpose}</h6>
                              <span
                                className={`badge ${
                                  loan.loanStatus === 'Approved'
                                    ? 'badge-status-approved'
                                    : loan.loanStatus === 'Pending'
                                    ? 'badge-status-pending'
                                    : loan.loanStatus === 'Paid'
                                    ? 'badge-status-active'
                                    : 'badge-status-rejected'
                                }`}
                              >
                                {loan.loanStatus}
                              </span>
                            </div>
                            <div className="info-row">
                              <span className="label">Loan Amount</span>
                              <span className="value">₹{formatCurrency(loan.loanAmount)}</span>
                            </div>
                            <div className="info-row">
                              <span className="label">Interest Rate</span>
                              <span className="value text-warning">{loan.interestRate}% p.a.</span>
                            </div>
                            <div className="info-row">
                              <span className="label">Tenure</span>
                              <span className="value">{loan.tenureMonths} months</span>
                            </div>
                            <div className="info-row">
                              <span className="label">Account</span>
                              <span className="value">{loan.accountNumber}</span>
                            </div>
                            {loan.loanStatus === 'Approved' && (
                              <div className="info-row">
                                <span className="label">Remaining Balance</span>
                                <span className="value text-danger">₹{formatCurrency(loan.remainingBalance)}</span>
                              </div>
                            )}
                            {loan.loanStatus === 'Approved' && (
                              <button
                                className="btn btn-warning btn-sm btn-full mt-3"
                                onClick={() => handleOpenRepayPanel(loan)}
                              >
                                <i className="bi bi-cash-coin"></i> Repay Loan
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  !loanLoading && (
                    <div className="empty-state">
                      <i className="bi bi-cash-coin"></i>
                      <h6>No Loans Found</h6>
                      <p style={{ fontSize: '13px' }}>You have not applied for any loans yet.</p>
                      <button className="btn btn-primary btn-sm" onClick={() => setLoanSubTab('apply')}>
                        Apply for Loan
                      </button>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Repay Loan Modal */}
            {repayLoanId !== null && (
              <div className="modal-overlay">
                <div className="modal-box" style={{ maxWidth: '480px' }}>
                  <div className="modal-title">
                    <i className="bi bi-cash-coin"></i> Repay Loan
                  </div>
                  {repayError && (
                    <div className="alert alert-danger">
                      <i className="bi bi-exclamation-circle-fill"></i> {repayError}
                    </div>
                  )}
                  {repaySuccess && (
                    <div className="alert alert-success">
                      <i className="bi bi-check-circle-fill"></i> {repaySuccess}
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Source Account</label>
                    <select
                      className="form-select"
                      value={repayAccountNumber}
                      onChange={(e) => setRepayAccountNumber(e.target.value)}
                    >
                      <option value="">-- Select Account --</option>
                      {activeAccounts.map((acc) => (
                        <option key={acc.id} value={acc.accountNumber}>
                          {acc.accountNumber} – {acc.accountType} (₹{formatCurrency(acc.balance)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Repayment Amount (₹)</label>
                    <div className="input-group-icon">
                      <i className="bi bi-currency-rupee icon"></i>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Enter amount"
                        value={repayAmount || ''}
                        onChange={(e) => setRepayAmount(Number(e.target.value))}
                        min="1"
                      />
                    </div>
                  </div>
                  <div className="d-flex gap-3 mt-3">
                    <button
                      className="btn btn-warning"
                      onClick={handleRepayLoan}
                      disabled={repayLoading}
                      style={{ flex: 1 }}
                    >
                      {repayLoading && <span className="spinner"></span>}
                      {!repayLoading && <i className="bi bi-cash-coin"></i>}
                      {repayLoading ? 'Processing...' : 'Submit Repayment'}
                    </button>
                    <button className="btn btn-outline" onClick={handleCloseRepayPanel}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============== BENEFICIARIES TAB ============== */}
        {activeTab === 'beneficiaries' && (
          <div className="animate-in">
            <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <h1 className="page-title">Beneficiaries</h1>
                <p className="page-subtitle">Manage your saved recipients for quick transfers</p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowAddBeneficiary(true)}>
                <i className="bi bi-plus-circle"></i> Add Beneficiary
              </button>
            </div>

            {/* Add Beneficiary Form Modal */}
            {showAddBeneficiary && (
              <div className="modal-overlay">
                <div className="modal-box">
                  <div className="modal-title">
                    <i className="bi bi-person-plus"></i> Add New Beneficiary
                  </div>
                  {benError && (
                    <div className="alert alert-danger">
                      <i className="bi bi-exclamation-circle-fill"></i> {benError}
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Beneficiary Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Full name"
                      value={newBen.beneficiaryName}
                      onChange={(e) => setNewBen((prev) => ({ ...prev, beneficiaryName: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Account Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Account number"
                      value={newBen.accountNumber}
                      onChange={(e) => setNewBen((prev) => ({ ...prev, accountNumber: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bank Name</label>
                    <select
                      className="form-select"
                      value={newBen.bankName}
                      onChange={(e) => handleBankChange(e.target.value)}
                    >
                      <option value="">-- Select Bank --</option>
                      {bankList.map((bank, idx) => (
                        <option key={idx} value={bank.name}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {newBen.bankName && (
                    <div className="form-group">
                      <label className="form-label">Branch</label>
                      <select
                        className="form-select"
                        value={newBen.branchName}
                        onChange={(e) => handleBranchChange(e.target.value)}
                      >
                        <option value="">-- Select Branch --</option>
                        {selectedBankBranches.map((branch, idx) => (
                          <option key={idx} value={branch.name}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {newBen.branchName && (
                    <div className="form-group">
                      <label className="form-label">IFSC Code</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newBen.ifscCode}
                        readOnly
                        style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.3)' }}
                      />
                    </div>
                  )}
                  <div className="d-flex gap-3 mt-2">
                    <button
                      className="btn btn-primary"
                      onClick={handleAddBeneficiary}
                      disabled={benLoading}
                      style={{ flex: 1 }}
                    >
                      {benLoading && <span className="spinner"></span>}
                      {!benLoading && <i className="bi bi-person-check"></i>}
                      {benLoading ? 'Adding...' : 'Add Beneficiary'}
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        setShowAddBeneficiary(false);
                        setBenError('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Beneficiary List */}
            {benLoading && !showAddBeneficiary && (
              <div className="loading-overlay">
                <span className="spinner"></span> Loading...
              </div>
            )}
            {beneficiaries.length > 0 ? (
              <div className="row g-3">
                {beneficiaries.map((b) => (
                  <div className="col-md-6 col-lg-4" key={b.id}>
                    <div className="card">
                      <div className="card-body">
                        <div className="d-flex align-items-center gap-3 mb-3">
                          <div className="sidebar-avatar" style={{ width: '44px', height: '44px', fontSize: '18px' }}>
                            {b.beneficiaryName?.[0] || 'B'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '14px' }}>{b.beneficiaryName}</div>
                            <div style={{ fontSize: '12px', color: 'var(--dark-text-dim)' }}>{b.bankName}</div>
                          </div>
                        </div>
                        <div className="info-row">
                          <span className="label">Account No.</span>
                          <span className="value" style={{ fontFamily: 'monospace' }}>
                            {b.accountNumber}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="label">Branch</span>
                          <span className="value">{b.branchName}</span>
                        </div>
                        <div className="info-row">
                          <span className="label">IFSC</span>
                          <span className="value">{b.ifscCode}</span>
                        </div>
                        <div className="d-flex gap-2 mt-3">
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ flex: 1 }}
                            onClick={() => handleTransferToBeneficiary(b)}
                          >
                            <i className="bi bi-arrow-left-right"></i> Send Money
                          </button>
                          <button
                            className="btn btn-sm"
                            style={{
                              background: 'rgba(239,68,68,0.12)',
                              color: '#ef4444',
                              border: '1px solid rgba(239,68,68,0.25)',
                              borderRadius: '10px',
                            }}
                            onClick={() => handleDeleteBeneficiary(b.id)}
                            title="Remove Beneficiary"
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !benLoading && (
                <div className="empty-state">
                  <i className="bi bi-people"></i>
                  <h6>No Beneficiaries Added</h6>
                  <p style={{ fontSize: '13px' }}>Add beneficiaries for quick and easy money transfers.</p>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowAddBeneficiary(true)}>
                    Add Beneficiary
                  </button>
                </div>
              )
            )}
          </div>
        )}

        {/* ============== PROFILE TAB ============== */}
        {activeTab === 'profile' && (
          <div className="animate-in">
            <div className="page-header">
              <div>
                <h1 className="page-title">My Profile</h1>
                <p className="page-subtitle">View and update your personal information</p>
              </div>
            </div>

            <div className="row g-4">
              {/* Left: Profile Card */}
              <div className="col-md-4">
                <div className="card text-center" style={{ padding: '32px 16px' }}>
                  <div className="sidebar-avatar" style={{ width: '80px', height: '80px', fontSize: '32px', margin: '0 auto 16px' }}>
                    {getInitials()}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--dark-text)' }}>
                    {profileData.fullName}
                  </div>
                  <div style={{ color: 'var(--dark-text-dim)', fontSize: '13px', margin: '4px 0 12px' }}>
                    {profileData.email}
                  </div>
                  <span className="badge badge-status-approved" style={{ margin: '0 auto' }}>
                    {profileData.role}
                  </span>
                  <div className="divider" style={{ margin: '20px 0' }}></div>
                  <div className="info-row">
                    <span className="label">Phone</span>
                    <span className="value">{profileData.phoneNumber || '—'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Gender</span>
                    <span className="value">{profileData.gender || '—'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Date of Birth</span>
                    <span className="value">
                      {profileData.dateOfBirth
                        ? new Date(profileData.dateOfBirth).toLocaleDateString([], {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Aadhar</span>
                    <span className="value">
                      {profileData.aadharNumber ? `**** **** ${profileData.aadharNumber.slice(-4)}` : '—'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">PAN</span>
                    <span className="value">{profileData.panNumber || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Right: Edit Form */}
              <div className="col-md-8">
                <div className="card">
                  <div className="card-body">
                    <div className="modal-title mb-4" style={{ fontSize: '16px' }}>
                      <i className="bi bi-pencil-square"></i> Edit Personal Details
                    </div>
                    {profileError && (
                      <div className="alert alert-danger">
                        <i className="bi bi-exclamation-circle-fill"></i> {profileError}
                      </div>
                    )}
                    {profileSuccess && (
                      <div className="alert alert-success">
                        <i className="bi bi-check-circle-fill"></i> {profileSuccess}
                      </div>
                    )}

                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-label">Full Name *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={profileEdit.fullName}
                            onChange={(e) => setProfileEdit((prev) => ({ ...prev, fullName: e.target.value }))}
                            placeholder="Your full name"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-label">Phone Number</label>
                          <input
                            type="tel"
                            className="form-control"
                            value={profileEdit.phoneNumber}
                            onChange={(e) => setProfileEdit((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                            placeholder="10-digit mobile number"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-label">Gender</label>
                          <select
                            className="form-select"
                            value={profileEdit.gender}
                            onChange={(e) => setProfileEdit((prev) => ({ ...prev, gender: e.target.value }))}
                          >
                            <option value="">-- Select --</option>
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
                            value={profileEdit.dateOfBirth}
                            onChange={(e) => setProfileEdit((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="form-group">
                          <label className="form-label">Address</label>
                          <textarea
                            className="form-control"
                            rows={3}
                            value={profileEdit.address}
                            onChange={(e) => setProfileEdit((prev) => ({ ...prev, address: e.target.value }))}
                            placeholder="Your residential address"
                            style={{ resize: 'none' }}
                          ></textarea>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-3 mt-3">
                      <button
                        className="btn btn-primary"
                        onClick={handleSaveProfile}
                        disabled={profileLoading}
                        style={{ flex: 1 }}
                      >
                        {profileLoading && <span className="spinner"></span>}
                        {!profileLoading && <i className="bi bi-check-circle"></i>}
                        {profileLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button className="btn btn-outline" onClick={loadProfile}>
                        Reset
                      </button>
                    </div>

                    <div className="divider" style={{ margin: '24px 0' }}></div>
                    <div style={{ fontSize: '12px', color: 'var(--dark-text-dim)' }}>
                      <i className="bi bi-info-circle me-1"></i> Email, Aadhar, and PAN details are locked and can only be
                      changed by the bank administrator.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============== CARDS TAB ============== */}
        {activeTab === 'cards' && (
          <div className="animate-in">
            <div className="page-header d-flex justify-content-between align-items-center">
              <div>
                <h1 className="page-title">Manage Cards</h1>
                <p className="page-subtitle">Freeze cards, manage daily limits, or change card PINs</p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowApplyCard(!showApplyCard)}>
                <i className="bi bi-plus-lg"></i> {showApplyCard ? 'View My Cards' : 'Apply for New Card'}
              </button>
            </div>

            {/* Apply For New Card View */}
            {showApplyCard && (
              <div className="card p-4 mb-4">
                <h4 style={{ fontWeight: 700, marginBottom: '16px' }}>Apply for a New Card</h4>

                {cardError && (
                  <div className="alert alert-danger">
                    <i className="bi bi-exclamation-circle-fill me-2"></i> {cardError}
                  </div>
                )}

                {cardSuccess && (
                  <div className="alert alert-success">
                    <i className="bi bi-check-circle-fill me-2"></i> {cardSuccess}
                  </div>
                )}

                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="form-label">Link to Account</label>
                      <select
                        className="form-select"
                        value={newCard.accountId}
                        onChange={(e) => setNewCard((prev) => ({ ...prev, accountId: e.target.value }))}
                      >
                        <option value="">-- Select Active Account --</option>
                        {activeAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.accountNumber} - {acc.accountType} (₹{formatCurrency(acc.balance)})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="form-label">Card Type</label>
                      <select
                        className="form-select"
                        value={newCard.cardType}
                        onChange={(e) => setNewCard((prev) => ({ ...prev, cardType: e.target.value }))}
                      >
                        <option value="Visa Debit">Visa Debit (Limit: ₹50k ATM / ₹100k Online)</option>
                        <option value="Visa Gold">Visa Gold (Limit: ₹50k ATM / ₹100k Online)</option>
                        <option value="Mastercard Platinum">Mastercard Platinum (Limit: ₹100k ATM / ₹200k Online)</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="form-label">Set 4-Digit PIN</label>
                      <input
                        type="password"
                        className="form-control"
                        value={newCard.pin}
                        onChange={(e) => setNewCard((prev) => ({ ...prev, pin: e.target.value }))}
                        placeholder="Enter 4-digit PIN"
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-3 mt-4">
                  <button className="btn btn-outline" onClick={() => setShowApplyCard(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleApplyNewCard} disabled={cardLoading}>
                    {cardLoading && <span className="spinner"></span>}
                    Apply & Issue Card
                  </button>
                </div>
              </div>
            )}

            {/* Active Cards Grid */}
            {!showApplyCard && (
              <div>
                {cards.length === 0 ? (
                  <div className="card p-5 text-center">
                    <i className="bi bi-credit-card" style={{ fontSize: '48px', color: 'var(--dark-text-dim)' }}></i>
                    <h4 className="mt-3">No active cards found</h4>
                    <p className="text-muted">Apply for a new credit/debit card to link to your account.</p>
                    <button
                      className="btn btn-primary mt-2"
                      onClick={() => setShowApplyCard(true)}
                      style={{ maxWidth: '200px', margin: '0 auto' }}
                    >
                      Apply For Card
                    </button>
                  </div>
                ) : (
                  <div className="cards-grid">
                    {cards.map((card) => (
                      <div style={{ display: 'flex', flexDirection: 'column' }} key={card.id}>
                        <div className={`bank-card ${getCardThemeClass(card.cardType)}`}>
                          {/* Frozen Badge overlay */}
                          {card.isBlocked && (
                            <div className="frozen-overlay">
                              <i className="bi bi-shield-lock-fill"></i>
                              Card Frozen
                            </div>
                          )}

                          <div className="card-header-row">
                            <span className="card-brand">MAVERICK BANK</span>
                            <span className="card-type-label">{card.cardType}</span>
                          </div>

                          <div className="card-chip"></div>

                          <div className="card-number">{card.cardNumber}</div>

                          <div className="card-footer-row">
                            <div>
                              <span className="card-expiry-label">Card Holder</span>
                              <div className="card-holder-name">{card.cardHolderName}</div>
                            </div>
                            <div className="card-expiry-box">
                              <span className="card-expiry-label">Expires</span>
                              <span className="card-expiry-value">{card.expiryDate}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Controls */}
                        {!card.isBlocked ? (
                          <div className="card-controls">
                            <button className="btn btn-outline btn-sm" onClick={() => handleToggleCardBlock(card)}>
                              <i className="bi bi-lock"></i> Freeze
                            </button>
                            <button className="btn btn-outline btn-sm" onClick={() => handleOpenLimitsModal(card)}>
                              <i className="bi bi-sliders"></i> Limits
                            </button>
                            <button className="btn btn-outline btn-sm" onClick={() => handleOpenPinModal(card)}>
                              <i className="bi bi-shield-key"></i> PIN
                            </button>
                          </div>
                        ) : (
                          <div className="card-controls">
                            <button className="btn btn-primary btn-sm btn-full" onClick={() => handleToggleCardBlock(card)}>
                              <i className="bi bi-unlock"></i> Unfreeze Card
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Limits Management Modal */}
        {showLimitsModal && (
          <div className="custom-modal-backdrop">
            <div className="custom-modal animate-in">
              <h4 style={{ fontWeight: 700, marginBottom: '16px' }}>Daily Limits Configuration</h4>
              {selectedCard && (
                <p className="text-muted" style={{ fontSize: '12px' }}>
                  Card: {selectedCard.cardType} ({selectedCard.cardNumber})
                </p>
              )}

              {cardError && (
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-circle-fill me-2"></i> {cardError}
                </div>
              )}

              {cardSuccess && (
                <div className="alert alert-success">
                  <i className="bi bi-check-circle-fill me-2"></i> {cardSuccess}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Daily ATM Withdrawal Limit (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={cardLimits.dailyAtmLimit || ''}
                  onChange={(e) => setCardLimits((prev) => ({ ...prev, dailyAtmLimit: Number(e.target.value) }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Daily Online Transaction Limit (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={cardLimits.dailyOnlineLimit || ''}
                  onChange={(e) => setCardLimits((prev) => ({ ...prev, dailyOnlineLimit: Number(e.target.value) }))}
                />
              </div>

              <div className="d-flex gap-3 mt-4">
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowLimitsModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveCardLimits} disabled={cardLoading}>
                  {cardLoading && <span className="spinner"></span>}
                  Update Limits
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PIN Change Modal */}
        {showPinModal && (
          <div className="custom-modal-backdrop">
            <div className="custom-modal animate-in">
              <h4 style={{ fontWeight: 700, marginBottom: '16px' }}>Change Card PIN</h4>
              {selectedCard && (
                <p className="text-muted" style={{ fontSize: '12px' }}>
                  Card: {selectedCard.cardType} ({selectedCard.cardNumber})
                </p>
              )}

              {cardError && (
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-circle-fill me-2"></i> {cardError}
                </div>
              )}

              {cardSuccess && (
                <div className="alert alert-success">
                  <i className="bi bi-check-circle-fill me-2"></i> {cardSuccess}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Current 4-Digit PIN</label>
                <input
                  type="password"
                  className="form-control"
                  value={cardPinChange.oldPin}
                  onChange={(e) => setCardPinChange((prev) => ({ ...prev, oldPin: e.target.value }))}
                  placeholder="Enter current PIN"
                  maxLength={4}
                />
              </div>

              <div className="form-group">
                <label className="form-label">New 4-Digit PIN</label>
                <input
                  type="password"
                  className="form-control"
                  value={cardPinChange.newPin}
                  onChange={(e) => setCardPinChange((prev) => ({ ...prev, newPin: e.target.value }))}
                  placeholder="Enter new PIN"
                  maxLength={4}
                />
              </div>

              <div className="d-flex gap-3 mt-4">
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowPinModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleChangeCardPin} disabled={cardLoading}>
                  {cardLoading && <span className="spinner"></span>}
                  Change PIN
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
