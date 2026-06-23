import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  fullName: string = '';
  email: string = '';
  password: string = '';
  phoneNumber: string = '';
  address: string = '';
  gender: string = '';
  dateOfBirth: string = '';
  aadharNumber: string = '';
  panNumber: string = '';
  age: number | null = null;
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;
  pwStrength: 'weak' | 'medium' | 'strong' = 'weak';

  private readonly API = 'https://localhost:7174/api';

  constructor(private http: HttpClient, private router: Router) {}

  onDobChange() {
    if (!this.dateOfBirth) { this.age = null; return; }
    const dob = new Date(this.dateOfBirth);
    const today = new Date();
    let calculatedAge = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      calculatedAge--;
    }
    this.age = calculatedAge;
  }

  checkPasswordStrength() {
    const pw = this.password;
    if (!pw) { this.pwStrength = 'weak'; return; }
    const hasUpper = /[A-Z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pw);
    const isLong = pw.length >= 8;
    const score = [hasUpper, hasNumber, hasSpecial, isLong].filter(Boolean).length;
    this.pwStrength = score <= 2 ? 'weak' : score === 3 ? 'medium' : 'strong';
  }

  register() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.fullName || !this.email || !this.password || !this.phoneNumber ||
        !this.address || !this.gender || !this.dateOfBirth || !this.aadharNumber || !this.panNumber) {
      this.errorMessage = 'All fields are required.';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long.';
      return;
    }

    if (this.aadharNumber.length !== 12 || isNaN(Number(this.aadharNumber))) {
      this.errorMessage = 'Aadhar Number must be exactly 12 digits.';
      return;
    }

    if (this.panNumber.length !== 10) {
      this.errorMessage = 'PAN Number must be exactly 10 characters.';
      return;
    }

    if (this.age !== null && this.age < 18) {
      this.errorMessage = 'You must be at least 18 years old to register.';
      return;
    }

    this.isLoading = true;
    const body = {
      fullName: this.fullName,
      email: this.email,
      password: this.password,
      phoneNumber: this.phoneNumber,
      address: this.address,
      role: 'Customer',
      gender: this.gender,
      dateOfBirth: this.dateOfBirth,
      aadharNumber: this.aadharNumber,
      panNumber: this.panNumber.toUpperCase()
    };

    this.http.post(`${this.API}/Users`, body).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Registration successful! Redirecting to login...';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = this.extractErrorMessage(error) || 'An error occurred during registration.';
      }
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
}
