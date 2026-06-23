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
    public class AccountService : IAccountService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IMapper _mapper;
        private readonly ILogger<AccountService> _logger;

        public AccountService(ApplicationDbContext context, IHubContext<NotificationHub> hubContext, IMapper mapper, ILogger<AccountService> logger)
        {
            _context = context;
            _hubContext = hubContext;
            _mapper = mapper;
            _logger = logger;
        }

        public AccountDto CreateAccount(CreateAccountRequest request, int userId)
        {
            try
            {
                var account = _mapper.Map<Account>(request);
                account.UserId = userId;

                // Generate unique Account Number
                string accNum;
                do
                {
                    accNum = "ACC" + new Random().Next(10000, 99999);
                } while (_context.Accounts.Any(a => a.AccountNumber == accNum));

                account.AccountNumber = accNum;
                account.Status = "Pending";
                account.Balance = 0;
                account.IsClosed = false;
                account.IsCloseRequested = false;
                account.CreatedAt = DateTime.Now;

                if (account.DateOfBirth.HasValue)
                {
                    var today = DateTime.Today;
                    var age = today.Year - account.DateOfBirth.Value.Year;
                    if (account.DateOfBirth.Value.Date > today.AddYears(-age)) age--;
                    account.Age = age;
                }

                _context.Accounts.Add(account);
                _context.SaveChanges();

                return _mapper.Map<AccountDto>(account);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating account for UserId: {UserId}", userId);
                throw new Exception("An error occurred while creating the account. Please try again.", ex);
            }
        }

        public IEnumerable<AccountDto> GetAccounts()
        {
            try
            {
                return _mapper.Map<IEnumerable<AccountDto>>(_context.Accounts.ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching all accounts.");
                throw new Exception("An error occurred while retrieving accounts.", ex);
            }
        }

        public (bool Success, string Message, decimal? DepositedAmount, decimal? NewBalance) Deposit(DepositRequest request, int userId, string userRole)
        {
            try
            {
                var account = _context.Accounts.FirstOrDefault(a => a.Id == request.AccountId);
                if (account == null) return (false, "Account not found", null, null);
                if (account.UserId != userId && userRole != "Admin" && userRole != "Employee") return (false, "You do not own this account", null, null);
                if (account.Status != "Active" || account.IsClosed) return (false, "Account is not active or is closed", null, null);
                if (request.Amount <= 0) return (false, "Invalid deposit amount", null, null);

                account.Balance += request.Amount;

                var transaction = new Transaction
                {
                    AccountId = account.Id,
                    TransactionType = "Deposit",
                    Amount = request.Amount,
                    Description = "Money Deposited",
                    CreatedAt = DateTime.Now
                };

                _context.Transactions.Add(transaction);
                _context.SaveChanges();

                return (true, "Deposit successful", request.Amount, account.Balance);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during deposit for AccountId: {AccountId}", request.AccountId);
                throw new Exception("An error occurred while processing the deposit.", ex);
            }
        }

        public (bool Success, string Message, decimal? WithdrawAmount, decimal? NewBalance) Withdraw(WithdrawRequest request, int userId, string userRole)
        {
            try
            {
                var account = _context.Accounts.FirstOrDefault(a => a.Id == request.AccountId);
                if (account == null) return (false, "Account not found", null, null);
                if (account.UserId != userId && userRole != "Admin" && userRole != "Employee") return (false, "You do not own this account", null, null);
                if (account.Status != "Active" || account.IsClosed) return (false, "Account is not active or is closed", null, null);
                if (request.Amount <= 0) return (false, "Invalid withdraw amount", null, null);
                if (account.Balance < request.Amount) return (false, "Insufficient balance", null, null);

                account.Balance -= request.Amount;

                var transaction = new Transaction
                {
                    AccountId = account.Id,
                    TransactionType = "Withdraw",
                    Amount = request.Amount,
                    Description = "Money Withdrawn",
                    CreatedAt = DateTime.Now
                };

                _context.Transactions.Add(transaction);
                _context.SaveChanges();

                return (true, "Withdraw successful", request.Amount, account.Balance);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during withdrawal for AccountId: {AccountId}", request.AccountId);
                throw new Exception("An error occurred while processing the withdrawal.", ex);
            }
        }

        public (bool Success, string Message, decimal? SenderBalance, bool IsInternal) Transfer(TransferRequest request, int userId, string userRole)
        {
            try
            {
                var sender = _context.Accounts.FirstOrDefault(a => a.Id == request.FromAccountId);
                if (sender == null) return (false, "Sender account not found", null, false);
                if (sender.UserId != userId && userRole != "Admin" && userRole != "Employee") return (false, "You do not own this account", null, false);
                if (sender.Status != "Active" || sender.IsClosed) return (false, "Sender account is not active or is closed", null, false);
                if (request.Amount <= 0) return (false, "Invalid transfer amount", null, false);
                if (sender.Balance < request.Amount) return (false, "Insufficient balance", null, false);

                sender.Balance -= request.Amount;

                var receiver = _context.Accounts.FirstOrDefault(a => a.AccountNumber == request.DestinationAccountNumber && a.Status == "Active" && !a.IsClosed);
                bool isInternal = receiver != null;

                if (isInternal)
                {
                    receiver!.Balance += request.Amount;

                    var senderTx = new Transaction
                    {
                        AccountId = sender.Id,
                        TransactionType = "Transfer Sent",
                        Amount = request.Amount,
                        Description = $"Transferred to {receiver.AccountNumber} ({receiver.FullName})",
                        CreatedAt = DateTime.Now
                    };

                    var receiverTx = new Transaction
                    {
                        AccountId = receiver.Id,
                        TransactionType = "Transfer Received",
                        Amount = request.Amount,
                        Description = $"Received from {sender.AccountNumber} ({sender.FullName})",
                        CreatedAt = DateTime.Now
                    };

                    _context.Transactions.AddRange(senderTx, receiverTx);

                    if (!_context.Beneficiaries.Any(b => b.UserId == userId && b.AccountNumber == receiver.AccountNumber))
                    {
                        var newBen = new Beneficiary
                        {
                            UserId = userId,
                            BeneficiaryName = receiver.FullName ?? "Maverick Account",
                            AccountNumber = receiver.AccountNumber,
                            BankName = "Maverick Bank",
                            BranchName = receiver.BranchName ?? "Main Branch",
                            IFSCCode = receiver.IFSCCode ?? "MAVB0000001",
                            CreatedAt = DateTime.Now
                        };
                        _context.Beneficiaries.Add(newBen);
                    }
                }
                else
                {
                    var exBen = _context.Beneficiaries.FirstOrDefault(b => b.UserId == userId && b.AccountNumber == request.DestinationAccountNumber);
                    string destName = exBen?.BeneficiaryName ?? "External Account";
                    string bankName = exBen?.BankName ?? "External Bank";

                    var senderTx = new Transaction
                    {
                        AccountId = sender.Id,
                        TransactionType = "Transfer Sent",
                        Amount = request.Amount,
                        Description = $"Transferred to {request.DestinationAccountNumber} ({destName} at {bankName})",
                        CreatedAt = DateTime.Now
                    };

                    _context.Transactions.Add(senderTx);

                    if (exBen == null)
                    {
                        var newBen = new Beneficiary
                        {
                            UserId = userId,
                            BeneficiaryName = destName,
                            AccountNumber = request.DestinationAccountNumber,
                            BankName = bankName,
                            BranchName = "External Branch",
                            IFSCCode = "EXTB0000001",
                            CreatedAt = DateTime.Now
                        };
                        _context.Beneficiaries.Add(newBen);
                    }
                }

                _context.SaveChanges();

                if (isInternal && receiver != null)
                {
                    _hubContext.Clients.Group(receiver.UserId.ToString()).SendAsync("ReceiveNotification", "Funds Received", $"You received ₹{request.Amount} from {sender.FullName}");
                    _hubContext.Clients.Group(receiver.UserId.ToString()).SendAsync("BalanceUpdated");
                }

                return (true, "Transfer successful", sender.Balance, isInternal);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during transfer from AccountId: {FromAccountId} to {Destination}", request.FromAccountId, request.DestinationAccountNumber);
                throw new Exception("An error occurred while processing the transfer.", ex);
            }
        }

        public IEnumerable<TransactionDto> GetTransactions(int accountId)
        {
            try
            {
                return _mapper.Map<IEnumerable<TransactionDto>>(_context.Transactions.Where(t => t.AccountId == accountId).OrderByDescending(t => t.CreatedAt).ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching transactions for AccountId: {AccountId}", accountId);
                throw new Exception("An error occurred while retrieving transactions.", ex);
            }
        }

        public PagedResponse<TransactionDto> GetTransactionsPaged(int accountId, int pageNumber, int pageSize, DateTime? fromDate, DateTime? toDate, string type)
        {
            try
            {
                var query = _context.Transactions.Where(t => t.AccountId == accountId).AsQueryable();

                if (fromDate.HasValue) query = query.Where(t => t.CreatedAt >= fromDate.Value.Date);
                if (toDate.HasValue)
                {
                    var endOfDay = toDate.Value.Date.AddDays(1).AddTicks(-1);
                    query = query.Where(t => t.CreatedAt <= endOfDay);
                }

                if (!string.IsNullOrEmpty(type) && type != "All")
                {
                    if (type == "Credit") query = query.Where(t => t.TransactionType == "Deposit" || t.TransactionType == "Transfer Received");
                    else if (type == "Debit") query = query.Where(t => t.TransactionType == "Withdraw" || t.TransactionType == "Transfer Sent");
                }

                int totalRecords = query.Count();
                var transactions = query.OrderByDescending(t => t.CreatedAt).Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList();
                var dtos = _mapper.Map<List<TransactionDto>>(transactions);
                return new PagedResponse<TransactionDto>(dtos, pageNumber, pageSize, totalRecords);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching paged transactions for AccountId: {AccountId}", accountId);
                throw new Exception("An error occurred while retrieving paged transactions.", ex);
            }
        }

        public (bool Success, string Message, string? AccountNumber, decimal? Balance) GetBalance(int accountId)
        {
            try
            {
                var account = _context.Accounts.FirstOrDefault(a => a.Id == accountId);
                if (account == null) return (false, "Account not found", null, null);
                return (true, "Success", account.AccountNumber, account.Balance);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching balance for AccountId: {AccountId}", accountId);
                throw new Exception("An error occurred while retrieving the account balance.", ex);
            }
        }

        public IEnumerable<TransactionDto> MiniStatement(int accountId)
        {
            try
            {
                return _mapper.Map<IEnumerable<TransactionDto>>(_context.Transactions.Where(t => t.AccountId == accountId).OrderByDescending(t => t.CreatedAt).Take(5).ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching mini statement for AccountId: {AccountId}", accountId);
                throw new Exception("An error occurred while retrieving the mini statement.", ex);
            }
        }

        public IEnumerable<AccountDto> GetMyAccounts(int userId)
        {
            try
            {
                return _mapper.Map<IEnumerable<AccountDto>>(_context.Accounts.Where(a => a.UserId == userId).OrderByDescending(a => a.CreatedAt).ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching accounts for UserId: {UserId}", userId);
                throw new Exception("An error occurred while retrieving your accounts.", ex);
            }
        }

        public (bool Success, string Message) RequestCloseAccount(int id, int userId)
        {
            try
            {
                var account = _context.Accounts.FirstOrDefault(a => a.Id == id && a.UserId == userId);
                if (account == null) return (false, "Account not found");
                account.IsCloseRequested = true;
                _context.SaveChanges();
                return (true, "Account closure requested successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while requesting account closure for AccountId: {AccountId}, UserId: {UserId}", id, userId);
                throw new Exception("An error occurred while submitting the closure request.", ex);
            }
        }

        public (bool Success, string Message) ApproveCloseAccount(int id)
        {
            try
            {
                var account = _context.Accounts.Find(id);
                if (account == null) return (false, "Account not found");
                account.IsClosed = true;
                account.Balance = 0;
                _context.SaveChanges();
                return (true, "Account closed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while approving account closure for AccountId: {AccountId}", id);
                throw new Exception("An error occurred while closing the account.", ex);
            }
        }

        public IEnumerable<TransactionDto> GetLast10Transactions(int accountId)
        {
            try
            {
                return _mapper.Map<IEnumerable<TransactionDto>>(_context.Transactions.Where(t => t.AccountId == accountId).OrderByDescending(t => t.CreatedAt).Take(10).ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching last 10 transactions for AccountId: {AccountId}", accountId);
                throw new Exception("An error occurred while retrieving recent transactions.", ex);
            }
        }

        public IEnumerable<TransactionDto> GetMonthlyTransactions(int accountId, int month)
        {
            try
            {
                return _mapper.Map<IEnumerable<TransactionDto>>(_context.Transactions.Where(t => t.AccountId == accountId && t.CreatedAt.Month == month).OrderByDescending(t => t.CreatedAt).ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching monthly transactions for AccountId: {AccountId}, Month: {Month}", accountId, month);
                throw new Exception("An error occurred while retrieving monthly transactions.", ex);
            }
        }

        public IEnumerable<TransactionDto> GetTransactionsBetweenDates(int accountId, DateTime fromDate, DateTime toDate)
        {
            try
            {
                var start = fromDate.Date;
                var end = toDate.Date.AddDays(1).AddTicks(-1);
                return _mapper.Map<IEnumerable<TransactionDto>>(_context.Transactions.Where(t => t.AccountId == accountId && t.CreatedAt >= start && t.CreatedAt <= end).OrderByDescending(t => t.CreatedAt).ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching transactions between dates for AccountId: {AccountId}", accountId);
                throw new Exception("An error occurred while retrieving transactions for the selected date range.", ex);
            }
        }

        public IEnumerable<AccountDto> GetClosureRequests()
        {
            try
            {
                return _mapper.Map<IEnumerable<AccountDto>>(_context.Accounts.Where(a => a.IsCloseRequested == true && a.IsClosed == false).ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching closure requests.");
                throw new Exception("An error occurred while retrieving closure requests.", ex);
            }
        }

        public (bool Success, string Message, AccountDto? Account) ApproveAccount(int id, string status)
        {
            try
            {
                if (status != "Active" && status != "Rejected") return (false, "Invalid status. Must be 'Active' or 'Rejected'.", null);
                var account = _context.Accounts.Find(id);
                if (account == null) return (false, "Account not found", null);

                account.Status = status;
                if (status == "Active")
                {
                    if (string.IsNullOrEmpty(account.BranchName))
                    {
                        account.BranchName = "Maverick Main Branch";
                        account.IFSCCode = "MAVB0000001";
                        account.BranchAddress = "123 Financial Way";
                    }
                }
                _context.SaveChanges();
                return (true, $"Account has been {status}", _mapper.Map<AccountDto>(account));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while approving/rejecting account AccountId: {AccountId} with Status: {Status}", id, status);
                throw new Exception("An error occurred while updating the account status.", ex);
            }
        }

        public IEnumerable<TransactionDto> GetAllTransactions()
        {
            try
            {
                return _mapper.Map<IEnumerable<TransactionDto>>(_context.Transactions.OrderByDescending(t => t.CreatedAt).ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching all transactions.");
                throw new Exception("An error occurred while retrieving all transactions.", ex);
            }
        }
    }
}
