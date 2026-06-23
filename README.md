# Maverick Bank

Maverick Bank is a comprehensive Banking and Financial System application designed to manage financial transactions and customer accounts. The project is split into a robust C# .NET Web API backend and an Angular 17+ frontend.

---

## Features

### Backend
- **ASP.NET Core Web API** with ORM (Entity Framework Core & SQL Server).
- **Security**: JWT Authentication and Role-based Authorization.
- **SignalR Integration**: Real-time notifications for balance updates and transaction events.
- **Core Services**:
  - `Accounts`: Account creation, Deposit, Withdraw, Transfer (automatic internal beneficiary saving).
  - `Auth`: User login, JWT generation, secure password hashing (BCrypt).
  - `Beneficiary`: Add, view, delete beneficiaries. Dynamic branch selection and IFSC loading.
  - `Loans`: Loan application, repayment, disbursement on approval.
  - `Users`: Profile management (view, update).
  - `Cards`: Apply for card, get my cards, freeze/unblock card, update daily ATM & Online transaction limits, secure PIN hash modification via BCrypt.
  - `Admin User Deletion`: Exposes user deletion endpoint with cascade deletion of related database records (accounts, cards, loans, beneficiaries, transactions).
- **Validation**: FluentValidation (including DOB age checks).
- **Unit Tests**: Full unit test project with Moq and NUnit (59 passing tests).

### Frontend
- **Angular 17+** standalone application using modern components and services.
- **Setup & Authentication**: Login and Register pages with client-side real-time validation (Aadhar, PAN format, strong passwords), and `AuthService` / `AuthGuard` for route protection.
- **Dashboard & Shell Layouts**: Profile update page, dynamic user-centric navigation, and custom role-based shell layouts.
- **Accounts & Transactions**: Savings, checking, and business account summaries, new account opening (with age verification), deposits, withdrawals, and internal/external transfers.
- **Statements**: Generate statements showing the last 10 transactions, current month transactions, or custom date ranges.
- **Card Management & Admin Controls**:
  - Glassmorphic credit/debit card rendering (Classic, Platinum, Gold variations) with custom themes.
  - Block/Unblock toggle overlays for frozen cards.
  - Dynamic daily ATM & Online transaction limits slider modals.
  - Secure PIN change forms.
  - Admin Dashboard User Deletion controls with confirmation prompts and instant UI list reloads.

---

## How to Run

### Prerequisites
- .NET 8.0 SDK
- Node.js (v20+)
- MS SQL Server or Docker

### Running via Docker Compose (Recommended)
From the root directory, run:
```bash
docker-compose up --build
```
This starts:
1. SQL Server container on port 1433
2. ASP.NET Core API on port 5000 (HTTP)
3. Angular Frontend on port 80 (HTTP)

### Running Locally (Development)

#### 1. Database & Backend API
1. Configure connection string in `Backend/MaverickBank.API/appsettings.json`.
2. Run database migrations and seed data:
   ```bash
   dotnet ef database update
   ```
3. Run the API:
   ```bash
   dotnet run --project Backend/MaverickBank.API
   ```

#### 2. Frontend UI
1. Navigate to the `Frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm start
   ```
   Open `http://localhost:4200` in your browser.
