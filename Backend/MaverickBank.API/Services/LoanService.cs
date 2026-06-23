using MaverickBank.API.Data;
using MaverickBank.API.Models;
using MaverickBank.API.DTOs;
using AutoMapper;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;

using MaverickBank.API.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace MaverickBank.API.Services
{
    public class LoanService : ILoanService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IMapper _mapper;
        private readonly ILogger<LoanService> _logger;

        public LoanService(ApplicationDbContext context, IHubContext<NotificationHub> hubContext, IMapper mapper, ILogger<LoanService> logger)
        {
            _context = context;
            _hubContext = hubContext;
            _mapper = mapper;
            _logger = logger;
        }

        public (bool Success, string Message, LoanDto? Loan) ApplyLoan(CreateLoanRequest request, int userId)
        {
            try
            {
                var loan = _mapper.Map<Loan>(request);
                loan.UserId = userId;
                loan.LoanStatus = "Pending";
                loan.RemainingBalance = 0;
                loan.CreatedAt = DateTime.Now;

                var account = _context.Accounts.FirstOrDefault(a => a.AccountNumber == loan.AccountNumber && a.UserId == userId && a.Status == "Active");
                if (account == null)
                {
                    return (false, "Invalid active disbursement account number", null);
                }

                _context.Loans.Add(loan);
                _context.SaveChanges();

                return (true, "Loan application submitted", _mapper.Map<LoanDto>(loan));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while applying for a loan for UserId: {UserId}", userId);
                throw new Exception("An error occurred while submitting the loan application.", ex);
            }
        }

        public IEnumerable<LoanDto> GetMyLoans(int userId)
        {
            try
            {
                var loans = _context.Loans.Where(l => l.UserId == userId).OrderByDescending(l => l.CreatedAt).ToList();
                return _mapper.Map<IEnumerable<LoanDto>>(loans);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching loans for UserId: {UserId}", userId);
                throw new Exception("An error occurred while retrieving your loans.", ex);
            }
        }

        public IEnumerable<LoanDto> GetLoans()
        {
            try
            {
                var loans = _context.Loans.ToList();
                return _mapper.Map<IEnumerable<LoanDto>>(loans);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching all loans.");
                throw new Exception("An error occurred while retrieving loans.", ex);
            }
        }

        public (bool Success, string Message, LoanDto? Loan) ApproveLoan(int id)
        {
            try
            {
                var loan = _context.Loans.Find(id);
                if (loan == null) return (false, "Loan not found", null);
                if (loan.LoanStatus != "Pending") return (false, "Loan has already been processed", null);

                var account = _context.Accounts.FirstOrDefault(a => a.AccountNumber == loan.AccountNumber && a.UserId == loan.UserId && a.Status == "Active");
                if (account == null) return (false, "Disbursement account is no longer active or valid", null);

                loan.LoanStatus = "Approved";
                loan.RemainingBalance = loan.LoanAmount;
                account.Balance += loan.LoanAmount;

                var transaction = new Transaction
                {
                    AccountId = account.Id,
                    TransactionType = "Loan Disbursement",
                    Amount = loan.LoanAmount,
                    Description = $"Loan Disbursement for {loan.Purpose} (ID: {loan.Id})",
                    CreatedAt = DateTime.Now
                };

                _context.Transactions.Add(transaction);
                _context.SaveChanges();

                _hubContext.Clients.Group(loan.UserId.ToString()).SendAsync("ReceiveNotification", "Loan Approved", $"Your loan of ₹{loan.LoanAmount} for '{loan.Purpose}' has been approved!");
                _hubContext.Clients.Group(loan.UserId.ToString()).SendAsync("BalanceUpdated");

                return (true, "Loan approved", _mapper.Map<LoanDto>(loan));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while approving loan with LoanId: {LoanId}", id);
                throw new Exception("An error occurred while approving the loan.", ex);
            }
        }

        public (bool Success, string Message, LoanDto? Loan) RejectLoan(int id)
        {
            try
            {
                var loan = _context.Loans.Find(id);
                if (loan == null) return (false, "Loan not found", null);
                if (loan.LoanStatus != "Pending") return (false, "Loan has already been processed", null);

                loan.LoanStatus = "Rejected";
                _context.SaveChanges();

                _hubContext.Clients.Group(loan.UserId.ToString()).SendAsync("ReceiveNotification", "Loan Rejected", $"Your loan application for ₹{loan.LoanAmount} was not approved at this time.");

                return (true, "Loan rejected", _mapper.Map<LoanDto>(loan));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while rejecting loan with LoanId: {LoanId}", id);
                throw new Exception("An error occurred while rejecting the loan.", ex);
            }
        }

        public (bool Success, string Message, decimal? NewRemainingBalance, string? LoanStatus, decimal? NewAccountBalance) RepayLoan(int id, RepayRequest request, int userId)
        {
            try
            {
                var loan = _context.Loans.Find(id);
                if (loan == null) return (false, "Loan not found", null, null, null);
                if (loan.UserId != userId) return (false, "You do not own this loan", null, null, null);
                if (loan.LoanStatus != "Approved") return (false, "Loan is not approved or active", null, null, null);
                if (loan.RemainingBalance <= 0) return (false, "Loan is already fully repaid", null, null, null);
                if (request.Amount <= 0) return (false, "Repayment amount must be greater than zero", null, null, null);
                if (request.Amount > loan.RemainingBalance) return (false, $"Repayment amount cannot exceed the remaining balance of ₹{loan.RemainingBalance}", null, null, null);

                var account = _context.Accounts.FirstOrDefault(a => a.AccountNumber == request.SourceAccountNumber && a.UserId == userId && a.Status == "Active" && !a.IsClosed);
                if (account == null) return (false, "Invalid or inactive source account", null, null, null);
                if (account.Balance < request.Amount) return (false, "Insufficient funds in the selected account", null, null, null);

                account.Balance -= request.Amount;
                loan.RemainingBalance -= request.Amount;
                if (loan.RemainingBalance == 0) loan.LoanStatus = "Paid";

                var transaction = new Transaction
                {
                    AccountId = account.Id,
                    TransactionType = "Loan Repayment",
                    Amount = request.Amount,
                    Description = $"Loan Repayment for Loan #{loan.Id}",
                    CreatedAt = DateTime.Now
                };

                _context.Transactions.Add(transaction);
                _context.SaveChanges();

                return (true, "Repayment processed successfully", loan.RemainingBalance, loan.LoanStatus, account.Balance);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during loan repayment for LoanId: {LoanId}, UserId: {UserId}", id, userId);
                throw new Exception("An error occurred while processing the loan repayment.", ex);
            }
        }
    }
}
