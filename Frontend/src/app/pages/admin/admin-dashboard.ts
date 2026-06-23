import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit {

  private readonly API = 'https://localhost:7174/api';

  userName: string = '';
  initials: string = '';
  activeTab: string = 'overview';

  users: any[] = [];
  get customerCount() { return this.users.filter(u => u.role === 'Customer').length; }
  get employeeCount() { return this.users.filter(u => u.role === 'Employee').length; }
  get adminCount() { return this.users.filter(u => u.role === 'Admin').length; }

  // Forms
  showAddUserForm: boolean = false;
  showEditUserForm: boolean = false;

  // Fields
  fullName: string = '';
  email: string = '';
  passwordHash: string = '';
  phoneNumber: string = '';
  address: string = '';
  role: string = 'Customer';
  gender: string = '';
  dateOfBirth: string = '';
  aadharNumber: string = '';
  panNumber: string = '';

  selectedUser: any = null;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private http: HttpClient, private router: Router, private auth: AuthService) {}

  ngOnInit() {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/login']); return; }
    if (!this.auth.isAdmin()) { this.router.navigate([this.auth.isEmployee() ? '/employee' : '/dashboard']); return; }
    this.userName = this.auth.getUserName();
    this.initials = this.auth.getInitials();
    this.loadUsers();
  }

  getHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  loadUsers() {
    this.http.get(`${this.API}/Users`, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => { this.users = res; },
      error: (err) => console.error(err)
    });
  }

  resetForm() {
    this.fullName = ''; this.email = ''; this.passwordHash = '';
    this.phoneNumber = ''; this.address = ''; this.role = 'Customer';
    this.gender = ''; this.dateOfBirth = ''; this.aadharNumber = ''; this.panNumber = '';
    this.errorMessage = ''; this.successMessage = '';
  }

  createUser() {
    this.errorMessage = ''; this.successMessage = '';
    if (!this.fullName || !this.email || !this.passwordHash || !this.role) {
      this.errorMessage = 'Name, Email, Password and Role are required.';
      return;
    }
    const body = {
      fullName: this.fullName, email: this.email, password: this.passwordHash,
      phoneNumber: this.phoneNumber || null, address: this.address || null,
      role: this.role, gender: this.gender || null,
      dateOfBirth: this.dateOfBirth || null,
      aadharNumber: this.aadharNumber || null, panNumber: this.panNumber || null
    };
    this.http.post(`${this.API}/Users`, body, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.successMessage = 'User Created Successfully!';
        this.showAddUserForm = false;
        this.resetForm();
        this.loadUsers();
      },
      error: (err) => { this.errorMessage = this.extractErrorMessage(err) || 'Failed to create user.'; }
    });
  }

  openEditForm(user: any) {
    this.selectedUser = user;
    this.fullName = user.fullName; this.email = user.email;
    this.phoneNumber = user.phoneNumber; this.address = user.address;
    this.role = user.role; this.gender = user.gender;
    this.dateOfBirth = user.dateOfBirth ? user.dateOfBirth.substring(0, 10) : '';
    this.aadharNumber = user.aadharNumber; this.panNumber = user.panNumber;
    this.errorMessage = ''; this.successMessage = '';
    this.showEditUserForm = true;
    this.showAddUserForm = false;
  }

  updateUser() {
    this.errorMessage = ''; this.successMessage = '';
    const body = {
      fullName: this.fullName, email: this.email, phoneNumber: this.phoneNumber || null,
      address: this.address || null, role: this.role, gender: this.gender || null,
      dateOfBirth: (this.dateOfBirth && this.dateOfBirth.toString().trim()) ? this.dateOfBirth : null,
      aadharNumber: this.aadharNumber || null, panNumber: this.panNumber || null
    };
    this.http.put(`${this.API}/Users/${this.selectedUser.id}`, body, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.successMessage = 'User Updated Successfully!';
        this.showEditUserForm = false;
        this.loadUsers();
      },
      error: (err) => { this.errorMessage = this.extractErrorMessage(err) || 'Failed to update user.'; }
    });
  }

  extractErrorMessage(err: any): string {
    if (err && err.error) {
      if (typeof err.error === 'object') {
        if (err.error.errors) {
          const messages = [];
          for (const key in err.error.errors) {
            if (err.error.errors.hasOwnProperty(key)) {
              messages.push(...err.error.errors[key]);
            }
          }
          return messages.join(' ');
        }
        if (err.error.message) {
          return err.error.message;
        }
        return JSON.stringify(err.error);
      }
      return err.error;
    }
    return '';
  }

  toggleStatus(id: number) {
    this.http.put(`${this.API}/Users/toggle/${id}`, {}, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => { alert(res.message); this.loadUsers(); },
      error: (err) => console.error(err)
    });
  }

  deleteUser(id: number) {
    if (!confirm('Are you sure you want to permanently delete this user and all associated bank accounts, loans, cards, and transactions? This action is irreversible.')) {
      return;
    }
    this.http.delete(`${this.API}/Users/${id}`, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => { alert(res.message || 'User deleted successfully.'); this.loadUsers(); },
      error: (err) => alert(this.extractErrorMessage(err) || 'Failed to delete user.')
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
