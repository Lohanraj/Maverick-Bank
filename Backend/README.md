# Maverick Bank - Backend API Portal

This is the robust REST API service for **Maverick Bank**, built with ASP.NET Core 8.0 and SQL Server. It handles JWT security, Entity Framework Core ORM mappings, real-time SignalR notifications, and transaction safety constraints.

---

## Technical Stack
- **Framework**: .NET 8.0 / ASP.NET Core Web API
- **Database ORM**: Entity Framework Core 8.0 with MS SQL Server LocalDB
- **Security**: JWT Bearer Tokens, BCrypt password hashing, Role-based authorization
- **Real-Time communications**: SignalR Hubs
- **Validation**: FluentValidation
- **Unit Testing**: NUnit, Moq, EF Core InMemory Database

---

## Architecture & Features

### Core Database Models
- `User`: Handles details for Admin, Employee, and Customer profiles.
- `Account`: Stores account status, balances, and branch routing details.
- `Card`: Houses credit/debit card numbers, daily spending limits, frozen states, and hashed PINs.
- `Loan`: Tracks loan application progress, interest rates, and remaining balances.
- `Transaction`: Records deposits, withdrawals, and sender-receiver transfer histories.
- `Beneficiary`: Stores beneficiary account info and routing codes for money transfers.

### Core Services
- **Auth Service**: Manages secure password hashing verification and token generation.
- **Account Service**: Enforces transactional safety for deposits, withdrawals, and internal/external bank transfers.
- **Card Service**: Enforces limit configurations, card blocking, card requests, and secure card PIN updates.
- **Loan Service**: Manages application processing, interest rate calculations, and disbursement.
- **User Service**: Controls profile updates, active status toggles, and cascade user deletion (clears associated bank accounts, loans, cards, beneficiaries, and transaction histories).

---

## Testing & Verification
- Unit test suite located inside the `MaverickBank.Tests` project.
- Mocked dependencies using **Moq**.
- Database validation using EF Core **InMemoryDatabase**.
- Contains **59 unit tests** verifying all business rules, all passing successfully.

---

## Setup & Execution

### Prerequisites
- .NET 8.0 SDK
- Microsoft SQL Server LocalDB (or docker-hosted SQL Server)

### Instructions
1. Configure connection settings in `appsettings.json`.
2. Apply database migrations:
   ```bash
   dotnet ef database update
   ```
3. Launch the API server:
   ```bash
   dotnet run
   ```
