# Maverick Bank - Frontend Portal

This is the interactive and responsive client-side portal for **Maverick Bank**, built with Angular 17+ standalone architecture. It features a premium Dark Mode interface utilizing custom glassmorphism components, detailed cards design, and robust client-side validation.

---

## Technical Stack
- **Framework**: Angular 17+ (Standalone Components, Services, and Route Guards)
- **Styling**: Custom Glassmorphism Theme, Vanilla CSS overlays, Bootstrap 5 utilities, Bootstrap Icons
- **HTTP Client**: RxJS-based API integration with JWT Interceptor support

---

## Features

### Authentication & Profiles
- **Secure Login & Registration**: Real-time client-side formatting and validation for Aadhar (12-digit spacing) and PAN (alphanumeric pattern). Strong password strength checks.
- **Route Protection**: `AuthGuard` handles automatic redirection if the user is unauthorized or does not have the correct role.
- **Profile Configuration**: View and update profile details (Full Name, Address, Phone, Date of Birth).

### Accounts & Transactions
- **Account Summary**: View current balances and statuses for Savings, Checking, and Business accounts.
- **Open New Account**: Real-time age validation based on the profile Date of Birth.
- **Money Transfers**: Perform deposits, withdrawals, and beneficiary transfers (automatically saves internal transfer history).
- **Branch Selector**: Dynamically updates branch locations and IFSC codes.
- **Statement Generator**: Retrieve transaction history filtered by range: last 10 transactions, current calendar month, or custom date ranges.

### Card Management
- **Glassmorphic Physical Cards**: Dynamically styled Visa/Mastercard designs (Classic, Gold, Platinum variations) with floating frozen overlay animations for blocked cards.
- **Limits Customization**: Slider modals to configure daily ATM withdrawal and Online shopping limits.
- **PIN Update**: Secure 4-digit PIN modification modal.

### Admin Controls
- **User Management Panel**: Full user roster list with toggles to activate/deactivate user profiles.
- **Permanently Delete User**: Hard-delete endpoint integration with cascading database deletion prompt alerts.

---

## Local Development Setup

### Prerequisites
- Node.js (v20 or higher)
- Angular CLI (`npm install -g @angular/cli`)

### Instructions
1. Navigate to the `Frontend` directory:
   ```bash
   cd Frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Angular local development server:
   ```bash
   npm start
   ```
4. Open your browser and navigate to `http://localhost:4200`.
