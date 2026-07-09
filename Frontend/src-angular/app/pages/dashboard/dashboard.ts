import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CardService } from '../../services/card.service';
import * as signalR from '@microsoft/signalr';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, OnDestroy {

  private readonly API = 'https://localhost:7174/api';

  // User Info
  userName: string = '';
  userFirstName: string = '';
  initials: string = '';

  // Navigation
  activeTab: string = 'overview';
  isLoading: boolean = false;

  // Notifications (SignalR)
  private hubConnection: signalR.HubConnection | null = null;
  notifications: { title: string; message: string; time: Date; read: boolean }[] = [];
  showNotificationPanel: boolean = false;
  get unreadCount(): number { return this.notifications.filter(n => !n.read).length; }

  // Profile
  profileData: any = {};
  profileEdit: any = {};
  profileLoading: boolean = false;
  profileError: string = '';
  profileSuccess: string = '';

  // Accounts
  accounts: any[] = [];
  get activeAccounts() { return this.accounts.filter(a => a.status === 'Active'); }
  get totalBalance() { return this.accounts.reduce((s, a) => s + (a.balance || 0), 0); }

  // Transactions
  transactions: any[] = [];
  txFilter: string = 'last10';
  txAccountId: string = '';
  txFromDate: string = '';
  txToDate: string = '';
  txLoading: boolean = false;
  txError: string = '';
  txSuccess: string = '';

  // Deposit
  depositAccountId: string = '';
  depositAmount: number = 0;

  // Withdraw
  withdrawAccountId: string = '';
  withdrawAmount: number = 0;

  // Transfer
  transferFromId: string = '';
  transferDestAccount: string = '';
  transferAmount: number = 0;
  selectedBeneficiaryAcc: string = '';

  // Open Account
  openAccError: string = '';
  openAccSuccess: string = '';
  openAccLoading: boolean = false;
  newAcc = { accountType: '', fullName: '', address: '', dateOfBirth: '', aadharNumber: '', panNumber: '', age: null as number | null };

  // Loans
  loanSubTab: string = 'apply';
  myLoans: any[] = [];
  get activeLoansCount() { return this.myLoans.filter(l => l.loanStatus === 'Approved').length; }
  loanLoading: boolean = false;
  loanError: string = '';
  loanSuccess: string = '';
  selectedLoanProduct: any = null;
  loanApplication = { accountNumber: '', loanAmount: 0, tenureMonths: 0, purpose: '' };

  // Repay Loan
  repayLoanId: number | null = null;
  repayAccountNumber: string = '';
  repayAmount: number = 0;
  repayError: string = '';
  repaySuccess: string = '';
  repayLoading: boolean = false;
  loanProducts = [
    { name: 'Home Loan', description: 'Purchase or renovate your dream home', interestRate: 7.5, maxTenure: 360, minAmount: 100000, maxAmount: 10000000, icon: 'bi bi-house-door', iconClass: 'stat-icon-blue' },
    { name: 'Car Loan', description: 'Finance your new or used vehicle', interestRate: 9.0, maxTenure: 84, minAmount: 50000, maxAmount: 2000000, icon: 'bi bi-car-front', iconClass: 'stat-icon-green' },
    { name: 'Personal Loan', description: 'For any personal financial needs', interestRate: 11.5, maxTenure: 60, minAmount: 10000, maxAmount: 500000, icon: 'bi bi-person-vcard', iconClass: 'stat-icon-purple' },
    { name: 'Education Loan', description: 'Invest in your future with education financing', interestRate: 8.5, maxTenure: 120, minAmount: 50000, maxAmount: 2000000, icon: 'bi bi-mortarboard', iconClass: 'stat-icon-cyan' },
    { name: 'Business Loan', description: 'Grow your business with capital financing', interestRate: 10.0, maxTenure: 120, minAmount: 200000, maxAmount: 50000000, icon: 'bi bi-briefcase', iconClass: 'stat-icon-orange' }
  ];

  // Beneficiaries
  beneficiaries: any[] = [];
  showAddBeneficiary: boolean = false;

  // Cards
  cards: any[] = [];
  cardLoading: boolean = false;
  cardError: string = '';
  cardSuccess: string = '';
  showApplyCard: boolean = false;
  newCard = { accountId: '', cardType: 'Visa Debit', pin: '' };
  selectedCard: any = null;
  cardLimits = { dailyAtmLimit: 0, dailyOnlineLimit: 0 };
  cardPinChange = { oldPin: '', newPin: '' };
  showLimitsModal: boolean = false;
  showPinModal: boolean = false;
  benLoading: boolean = false;
  benError: string = '';
  newBen = { beneficiaryName: '', accountNumber: '', bankName: '', branchName: '', ifscCode: '' };
  selectedBankBranches: any[] = [];
  bankList = [
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
  ];

  constructor(private http: HttpClient, private router: Router, private auth: AuthService, private cardService: CardService) {}

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    if (!this.auth.isCustomer()) {
      this.router.navigate([this.auth.isAdmin() ? '/admin' : '/employee']);
      return;
    }
    this.userName = this.auth.getUserName();
    this.userFirstName = this.userName.split(' ')[0];
    this.initials = this.auth.getInitials();
    this.loadAccounts();
    this.loadBeneficiaries();
    this.loadLoans();
    this.loadProfile();
    this.loadCards();
    this.connectSignalR();
  }

  ngOnDestroy() {
    this.hubConnection?.stop();
  }

  connectSignalR() {
    const token = this.auth.getToken();
    if (!token) return;
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7174/notificationHub', { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.hubConnection.on('ReceiveNotification', (title: string, message: string) => {
      this.notifications.unshift({ title, message, time: new Date(), read: false });
    });

    this.hubConnection.on('BalanceUpdated', () => {
      this.loadAccounts();
    });

    this.hubConnection.start().catch(err => console.warn('SignalR connection failed:', err));
  }

  markAllRead() {
    this.notifications.forEach(n => n.read = true);
  }

  clearNotifications() {
    this.notifications = [];
    this.showNotificationPanel = false;
  }

  getHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  clearTxMessages() {
    this.txError = '';
    this.txSuccess = '';
  }

  // ===== ACCOUNTS =====
  loadAccounts() {
    this.isLoading = true;
    this.http.get(`${this.API}/Accounts/myaccounts`, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => {
        this.accounts = res;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  requestCloseAccount(id: number) {
    if (!confirm('Are you sure you want to request account closure?')) return;
    this.http.put(`${this.API}/Accounts/requestclose/${id}`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => { alert('Closure request submitted. Awaiting employee approval.'); this.loadAccounts(); },
      error: (e) => alert(e?.error || 'Failed to submit closure request.')
    });
  }

  // ===== OPEN ACCOUNT =====
  calcNewAccAge() {
    if (!this.newAcc.dateOfBirth) { this.newAcc.age = null; return; }
    const dob = new Date(this.newAcc.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--;
    this.newAcc.age = age;
  }

  openAccount() {
    this.openAccError = '';
    this.openAccSuccess = '';
    const a = this.newAcc;
    if (!a.accountType || !a.fullName || !a.address || !a.dateOfBirth || !a.aadharNumber || !a.panNumber) {
      this.openAccError = 'All fields are required.';
      return;
    }
    if (a.aadharNumber.length !== 12) { this.openAccError = 'Aadhar must be 12 digits.'; return; }
    if (a.panNumber.length !== 10) { this.openAccError = 'PAN must be 10 characters.'; return; }
    this.openAccLoading = true;
    const body = {
      accountType: a.accountType,
      fullName: a.fullName,
      address: a.address,
      dateOfBirth: a.dateOfBirth,
      aadharNumber: a.aadharNumber,
      pANNumber: a.panNumber.toUpperCase()
    };
    this.http.post(`${this.API}/Accounts`, body, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.openAccLoading = false;
        this.openAccSuccess = 'Account application submitted! Awaiting employee approval.';
        this.newAcc = { accountType: '', fullName: '', address: '', dateOfBirth: '', aadharNumber: '', panNumber: '', age: null };
        this.loadAccounts();
      },
      error: (e) => {
        this.openAccLoading = false;
        this.openAccError = e?.error || 'Failed to submit account application.';
      }
    });
  }

  // ===== DEPOSIT =====
  doDeposit() {
    this.clearTxMessages();
    if (!this.depositAccountId || !this.depositAmount || this.depositAmount <= 0) {
      this.txError = 'Please select an account and enter a valid amount.';
      return;
    }
    this.txLoading = true;
    this.http.post(`${this.API}/Accounts/deposit`, { accountId: +this.depositAccountId, amount: this.depositAmount }, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => {
        this.txLoading = false;
        this.txSuccess = `Deposit successful! New balance: ₹${res.newBalance?.toFixed(2)}`;
        this.depositAmount = 0;
        this.loadAccounts();
      },
      error: (e) => { this.txLoading = false; this.txError = e?.error || 'Deposit failed.'; }
    });
  }

  // ===== WITHDRAW =====
  doWithdraw() {
    this.clearTxMessages();
    if (!this.withdrawAccountId || !this.withdrawAmount || this.withdrawAmount <= 0) {
      this.txError = 'Please select an account and enter a valid amount.';
      return;
    }
    this.txLoading = true;
    this.http.post(`${this.API}/Accounts/withdraw`, { accountId: +this.withdrawAccountId, amount: this.withdrawAmount }, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => {
        this.txLoading = false;
        this.txSuccess = `Withdrawal successful! New balance: ₹${res.newBalance?.toFixed(2)}`;
        this.withdrawAmount = 0;
        this.loadAccounts();
      },
      error: (e) => { this.txLoading = false; this.txError = e?.error || 'Withdrawal failed. Check your balance.'; }
    });
  }

  // ===== TRANSFER =====
  onBeneficiarySelect() {
    if (this.selectedBeneficiaryAcc) {
      this.transferDestAccount = this.selectedBeneficiaryAcc;
    }
  }

  doTransfer() {
    this.clearTxMessages();
    if (!this.transferFromId || !this.transferDestAccount || !this.transferAmount || this.transferAmount <= 0) {
      this.txError = 'Please fill all transfer details.';
      return;
    }
    this.txLoading = true;
    this.http.post(`${this.API}/Accounts/transfer`, {
      fromAccountId: +this.transferFromId,
      destinationAccountNumber: this.transferDestAccount,
      amount: this.transferAmount
    }, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => {
        this.txLoading = false;
        this.txSuccess = `Transfer successful! ${res.message}`;
        this.transferAmount = 0;
        this.transferDestAccount = '';
        this.selectedBeneficiaryAcc = '';
        this.loadAccounts();
      },
      error: (e) => { this.txLoading = false; this.txError = e?.error || 'Transfer failed.'; }
    });
  }

  // ===== TRANSACTIONS =====
  loadTransactions() {
    if (!this.txAccountId) { this.transactions = []; return; }
    this.txLoading = true;
    let url = '';
    if (this.txFilter === 'last10') {
      url = `${this.API}/Accounts/last10/${this.txAccountId}`;
    } else if (this.txFilter === 'month') {
      const month = new Date().getMonth() + 1;
      url = `${this.API}/Accounts/month/${this.txAccountId}/${month}`;
    } else if (this.txFilter === 'range' && this.txFromDate && this.txToDate) {
      url = `${this.API}/Accounts/betweendates?accountId=${this.txAccountId}&fromDate=${this.txFromDate}&toDate=${this.txToDate}`;
    } else {
      this.txLoading = false;
      return;
    }
    this.http.get(url, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => { this.transactions = res; this.txLoading = false; },
      error: () => { this.txLoading = false; this.transactions = []; }
    });
  }

  // ===== LOANS =====
  loadLoans() {
    this.loanLoading = true;
    this.http.get(`${this.API}/Loans/myloans`, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => { this.myLoans = res; this.loanLoading = false; },
      error: () => { this.loanLoading = false; }
    });
  }

  selectLoanProduct(product: any) {
    this.selectedLoanProduct = product;
    this.loanApplication.loanAmount = product.minAmount;
    this.loanApplication.tenureMonths = 12;
  }

  applyLoan() {
    this.loanError = '';
    this.loanSuccess = '';
    const la = this.loanApplication;
    if (!la.accountNumber || !la.loanAmount || !la.tenureMonths || !la.purpose) {
      this.loanError = 'All fields are required.';
      return;
    }
    this.loanLoading = true;
    const body = {
      accountNumber: la.accountNumber,
      loanAmount: la.loanAmount,
      tenureMonths: la.tenureMonths,
      purpose: la.purpose
    };
    this.http.post(`${this.API}/Loans/apply`, body, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.loanLoading = false;
        this.loanSuccess = 'Loan application submitted! Awaiting approval.';
        this.loanApplication = { accountNumber: '', loanAmount: 0, tenureMonths: 0, purpose: '' };
        this.selectedLoanProduct = null;
        this.loadLoans();
      },
      error: (e) => { this.loanLoading = false; this.loanError = e?.error || 'Loan application failed.'; }
    });
  }

  openRepayPanel(loan: any) {
    this.repayLoanId = loan.id;
    this.repayAccountNumber = loan.accountNumber;
    this.repayAmount = 0;
    this.repayError = '';
    this.repaySuccess = '';
  }

  closeRepayPanel() {
    this.repayLoanId = null;
    this.repayAmount = 0;
    this.repayError = '';
    this.repaySuccess = '';
  }

  repayLoan() {
    this.repayError = '';
    this.repaySuccess = '';
    if (!this.repayAccountNumber || !this.repayAmount || this.repayAmount <= 0) {
      this.repayError = 'Please select a source account and enter a valid amount.';
      return;
    }
    this.repayLoading = true;
    const body = { sourceAccountNumber: this.repayAccountNumber, amount: this.repayAmount };
    this.http.post(`${this.API}/Loans/repay/${this.repayLoanId}`, body, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => {
        this.repayLoading = false;
        this.repaySuccess = `Repayment of ₹${this.repayAmount.toFixed(2)} successful! Remaining: ₹${res.newRemainingBalance?.toFixed(2) ?? '0.00'}. Status: ${res.loanStatus}`;
        this.repayAmount = 0;
        this.loadLoans();
        this.loadAccounts();
      },
      error: (e) => { this.repayLoading = false; this.repayError = e?.error || 'Repayment failed. Check account balance.'; }
    });
  }

  // ===== BENEFICIARIES =====
  loadBeneficiaries() {
    this.benLoading = true;
    this.http.get(`${this.API}/Beneficiaries/mybeneficiaries`, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => { this.beneficiaries = res; this.benLoading = false; },
      error: () => { this.benLoading = false; }
    });
  }

  onBankChange() {
    this.newBen.branchName = '';
    this.newBen.ifscCode = '';
    const bank = this.bankList.find(b => b.name === this.newBen.bankName);
    this.selectedBankBranches = bank ? bank.branches : [];
  }

  onBranchChange() {
    const branch = this.selectedBankBranches.find(b => b.name === this.newBen.branchName);
    this.newBen.ifscCode = branch ? branch.ifsc : '';
  }

  addBeneficiary() {
    this.benError = '';
    const b = this.newBen;
    if (!b.beneficiaryName || !b.accountNumber || !b.bankName || !b.branchName || !b.ifscCode) {
      this.benError = 'All fields are required.';
      return;
    }
    this.benLoading = true;
    this.http.post(`${this.API}/Beneficiaries/add`, b, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.benLoading = false;
        this.showAddBeneficiary = false;
        this.newBen = { beneficiaryName: '', accountNumber: '', bankName: '', branchName: '', ifscCode: '' };
        this.loadBeneficiaries();
      },
      error: (e) => { this.benLoading = false; this.benError = e?.error || 'Failed to add beneficiary.'; }
    });
  }

  transferToBeneficiary(b: any) {
    this.activeTab = 'transfer';
    this.transferDestAccount = b.accountNumber;
    this.selectedBeneficiaryAcc = b.accountNumber;
  }

  deleteBeneficiary(id: number) {
    if (!confirm('Remove this beneficiary?')) return;
    this.http.delete(`${this.API}/Beneficiaries/delete/${id}`, { headers: this.getHeaders() }).subscribe({
      next: () => this.loadBeneficiaries(),
      error: (e) => alert(e?.error || 'Failed to remove beneficiary.')
    });
  }

  // ===== PROFILE =====
  loadProfile() {
    this.http.get(`${this.API}/Users/me`, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => {
        this.profileData = res;
        this.profileEdit = {
          fullName: res.fullName || '',
          phoneNumber: res.phoneNumber || '',
          address: res.address || '',
          gender: res.gender || '',
          dateOfBirth: res.dateOfBirth ? res.dateOfBirth.substring(0, 10) : ''
        };
      }
    });
  }

  saveProfile() {
    this.profileError = '';
    this.profileSuccess = '';
    if (!this.profileEdit.fullName) { this.profileError = 'Full Name is required.'; return; }
    this.profileLoading = true;
    const body = {
      fullName: this.profileEdit.fullName,
      phoneNumber: this.profileEdit.phoneNumber || null,
      address: this.profileEdit.address || null,
      gender: this.profileEdit.gender || null,
      dateOfBirth: this.profileEdit.dateOfBirth ? new Date(this.profileEdit.dateOfBirth).toISOString() : null
    };
    this.http.put(`${this.API}/Users/profile`, body, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => {
        this.profileLoading = false;
        this.profileSuccess = 'Profile updated successfully!';
        this.profileData = res;
        this.userName = res.fullName || this.userName;
        this.userFirstName = this.userName.split(' ')[0];
        this.initials = this.userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
      },
      error: (e) => { this.profileLoading = false; this.profileError = e?.error || 'Failed to update profile.'; }
    });
  }

  // ===== CARDS =====
  loadCards() {
    this.cardLoading = true;
    this.cardService.getMyCards().subscribe({
      next: (res) => { this.cards = res; this.cardLoading = false; },
      error: (e) => { this.cardLoading = false; console.error(e); }
    });
  }

  applyNewCard() {
    this.cardError = '';
    this.cardSuccess = '';
    const c = this.newCard;
    if (!c.accountId || !c.cardType || !c.pin) {
      this.cardError = 'All fields are required.';
      return;
    }
    if (c.pin.length !== 4 || isNaN(+c.pin)) {
      this.cardError = 'PIN must be exactly 4 digits.';
      return;
    }
    this.cardLoading = true;
    this.cardService.applyCard(+c.accountId, c.cardType, c.pin).subscribe({
      next: (res) => {
        this.cardLoading = false;
        this.cardSuccess = 'Card applied and issued successfully!';
        this.newCard = { accountId: '', cardType: 'Visa Debit', pin: '' };
        this.showApplyCard = false;
        this.loadCards();
      },
      error: (e) => {
        this.cardLoading = false;
        this.cardError = e?.error || 'Failed to apply for card.';
      }
    });
  }

  toggleCardBlock(card: any) {
    this.cardService.toggleBlock(card.id).subscribe({
      next: (res) => {
        alert(res.message);
        this.loadCards();
      },
      error: (e) => alert(e?.error || 'Failed to toggle card freeze state.')
    });
  }

  openLimitsModal(card: any) {
    this.selectedCard = card;
    this.cardLimits = { dailyAtmLimit: card.dailyAtmLimit, dailyOnlineLimit: card.dailyOnlineLimit };
    this.cardError = '';
    this.cardSuccess = '';
    this.showLimitsModal = true;
  }

  saveCardLimits() {
    this.cardError = '';
    this.cardSuccess = '';
    if (!this.selectedCard) return;
    this.cardLoading = true;
    this.cardService.updateLimits(this.selectedCard.id, this.cardLimits.dailyAtmLimit, this.cardLimits.dailyOnlineLimit).subscribe({
      next: (res) => {
        this.cardLoading = false;
        this.cardSuccess = 'Limits updated successfully!';
        this.loadCards();
        setTimeout(() => this.showLimitsModal = false, 1500);
      },
      error: (e) => {
        this.cardLoading = false;
        this.cardError = e?.error || 'Failed to update daily limits.';
      }
    });
  }

  openPinModal(card: any) {
    this.selectedCard = card;
    this.cardPinChange = { oldPin: '', newPin: '' };
    this.cardError = '';
    this.cardSuccess = '';
    this.showPinModal = true;
  }

  changeCardPin() {
    this.cardError = '';
    this.cardSuccess = '';
    const pin = this.cardPinChange;
    if (!pin.oldPin || !pin.newPin) {
      this.cardError = 'Both current and new PIN are required.';
      return;
    }
    if (pin.newPin.length !== 4 || isNaN(+pin.newPin)) {
      this.cardError = 'New PIN must be exactly 4 digits.';
      return;
    }
    this.cardLoading = true;
    this.cardService.updatePin(this.selectedCard.id, pin.oldPin, pin.newPin).subscribe({
      next: (res) => {
        this.cardLoading = false;
        this.cardSuccess = 'PIN changed successfully!';
        setTimeout(() => this.showPinModal = false, 1500);
      },
      error: (e) => {
        this.cardLoading = false;
        this.cardError = e?.error || 'Failed to update PIN. Please verify your current PIN.';
      }
    });
  }

  getCardThemeClass(type: string): string {
    if (type === 'Mastercard Platinum') return 'platinum-card';
    if (type === 'Visa Gold') return 'gold-card';
    return 'classic-card';
  }

  // ===== LOGOUT =====
  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}