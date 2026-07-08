import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;
  rememberMe: boolean = false;

  // Forgot Password feature
  showForgotModal: boolean = false;
  forgotEmail: string = '';
  forgotMessage: string = '';
  forgotError: string = '';
  forgotLoading: boolean = false;
  regeneratedPassword: string = '';

  private readonly API = 'https://localhost:7174/api';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      this.email = savedEmail;
      this.rememberMe = true;
    }
  }

  openForgotModal(event: Event) {
    event.preventDefault();
    this.showForgotModal = true;
    this.forgotEmail = '';
    this.forgotMessage = '';
    this.forgotError = '';
    this.forgotLoading = false;
    this.regeneratedPassword = '';
  }

  closeForgotModal() {
    this.showForgotModal = false;
  }

  regeneratePassword() {
    this.forgotError = '';
    this.forgotMessage = '';

    if (!this.forgotEmail) {
      this.forgotError = 'Please enter your email address.';
      return;
    }

    this.forgotLoading = true;
    this.http.post(`${this.API}/Auth/forgot-password`, { email: this.forgotEmail }).subscribe({
      next: (res: any) => {
        this.forgotLoading = false;
        this.forgotMessage = res.message || 'Password regenerated successfully.';
        this.regeneratedPassword = res.temporaryPassword;
      },
      error: (err: any) => {
        this.forgotLoading = false;
        this.forgotError = err?.error || 'Failed to regenerate password. Make sure the email exists.';
      }
    });
  }

  login() {
    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter both email and password.';
      return;
    }

    this.isLoading = true;
    const body = { email: this.email, password: this.password };

    this.http.post(`${this.API}/Auth/login`, body).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        localStorage.setItem('token', response.token);
        localStorage.setItem('role', response.role);
        localStorage.setItem('user', JSON.stringify(response));

        if (this.rememberMe) {
          localStorage.setItem('rememberedEmail', this.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        if (response.role === 'Admin') {
          this.router.navigate(['/admin']);
        } else if (response.role === 'Employee') {
          this.router.navigate(['/employee']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error || 'Invalid email or password. Please try again.';
      }
    });
  }
}