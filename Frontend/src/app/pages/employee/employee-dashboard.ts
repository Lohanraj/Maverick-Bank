import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './employee-dashboard.html',
  styleUrl: './employee-dashboard.css'
})
export class EmployeeDashboard implements OnInit {

  private readonly API = 'https://localhost:7174/api';

  userName: string = '';
  initials: string = '';
  activeTab: string = 'overview';

  pendingAccounts: any[] = [];
  closureRequests: any[] = [];
  pendingLoans: any[] = [];
  allTransactions: any[] = [];

  selectedLoan: any = null;
  creditworthinessScore: string = '';
  creditworthinessDetails: string = '';

  constructor(private http: HttpClient, private router: Router, private auth: AuthService) {}

  ngOnInit() {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/login']); return; }
    if (this.auth.isCustomer()) { this.router.navigate(['/dashboard']); return; }
    this.userName = this.auth.getUserName();
    this.initials = this.auth.getInitials();
    this.loadData();
  }

  getHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  loadData() {
    const headers = this.getHeaders();

    this.http.get(`${this.API}/Accounts`, { headers }).subscribe({
      next: (res: any) => { this.pendingAccounts = res.filter((a: any) => a.status === 'Pending'); },
      error: (err) => console.error(err)
    });

    this.http.get(`${this.API}/Accounts/closurerequests`, { headers }).subscribe({
      next: (res: any) => { this.closureRequests = res; },
      error: (err) => console.error(err)
    });

    this.http.get(`${this.API}/Loans`, { headers }).subscribe({
      next: (res: any) => { this.pendingLoans = res.filter((l: any) => l.loanStatus === 'Pending'); },
      error: (err) => console.error(err)
    });

    this.http.get(`${this.API}/Accounts/alltransactions`, { headers }).subscribe({
      next: (res: any) => { this.allTransactions = res; },
      error: (err) => console.error(err)
    });
  }

  approveAccount(id: number) {
    this.http.put(`${this.API}/Accounts/approve/${id}/Active`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => { alert('Account Approved Successfully!'); this.loadData(); },
      error: (err) => alert(err.error || 'Failed to approve account.')
    });
  }

  rejectAccount(id: number) {
    this.http.put(`${this.API}/Accounts/approve/${id}/Rejected`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => { alert('Account Rejected.'); this.loadData(); },
      error: (err) => alert(err.error || 'Failed to reject account.')
    });
  }

  approveClosure(id: number) {
    if (!confirm('Are you sure you want to close this account?')) return;
    this.http.put(`${this.API}/Accounts/approveclose/${id}`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => { alert('Account Closed Successfully!'); this.loadData(); },
      error: (err) => alert(err.error || 'Failed to close account.')
    });
  }

  checkCreditworthiness(loan: any) {
    this.selectedLoan = loan;
    this.creditworthinessScore = 'Calculating...';
    this.creditworthinessDetails = '';

    const headers = this.getHeaders();
    this.http.get(`${this.API}/Accounts`, { headers }).subscribe({
      next: (accounts: any) => {
        const matchedAcc = accounts.find((a: any) => a.accountNumber === loan.accountNumber);
        if (!matchedAcc) {
          this.creditworthinessScore = 'Error';
          this.creditworthinessDetails = 'Could not find matching account for calculations.';
          return;
        }

        this.http.get(`${this.API}/Accounts/transactions/${matchedAcc.id}`, { headers }).subscribe({
          next: (txs: any) => {
            let inbound = 0;
            let outbound = 0;
            txs.forEach((t: any) => {
              if (t.transactionType === 'Deposit' || t.transactionType === 'Transfer Received' || t.transactionType === 'Loan Disbursement') inbound += t.amount;
              else if (t.transactionType === 'Withdraw' || t.transactionType === 'Transfer Sent' || t.transactionType === 'Loan Repayment') outbound += t.amount;
            });
            const netFlow = inbound - outbound;
            if (netFlow >= loan.loanAmount * 0.1) {
              this.creditworthinessScore = 'HIGH (Good)';
              this.creditworthinessDetails = `Inbound: ₹${inbound.toFixed(2)}, Outbound: ₹${outbound.toFixed(2)}, Net Flow: ₹${netFlow.toFixed(2)}. Net flow is sufficient to service the loan.`;
            } else {
              this.creditworthinessScore = 'LOW (Risk)';
              this.creditworthinessDetails = `Inbound: ₹${inbound.toFixed(2)}, Outbound: ₹${outbound.toFixed(2)}, Net Flow: ₹${netFlow.toFixed(2)}. Net flow is too low relative to loan amount.`;
            }
          },
          error: () => {
            this.creditworthinessScore = 'Error';
            this.creditworthinessDetails = 'Error fetching transactions for analysis.';
          }
        });
      },
      error: () => {
        this.creditworthinessScore = 'Error';
        this.creditworthinessDetails = 'Error fetching accounts.';
      }
    });
  }

  approveLoan(id: number) {
    this.http.put(`${this.API}/Loans/approve/${id}`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => {
        alert('Loan Approved & Disbursed Successfully!');
        this.selectedLoan = null;
        this.loadData();
      },
      error: (err) => alert(err.error || 'Failed to approve loan.')
    });
  }

  rejectLoan(id: number) {
    this.http.put(`${this.API}/Loans/reject/${id}`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => {
        alert('Loan Rejected.');
        this.selectedLoan = null;
        this.loadData();
      },
      error: (err) => alert(err.error || 'Failed to reject loan.')
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
