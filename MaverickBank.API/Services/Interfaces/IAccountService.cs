using MaverickBank.API.DTOs;
using System;
using System.Collections.Generic;

namespace MaverickBank.API.Services
{
    public interface IAccountService
    {
        AccountDto CreateAccount(CreateAccountRequest request, int userId);
        IEnumerable<AccountDto> GetAccounts();
        
        (bool Success, string Message, decimal? DepositedAmount, decimal? NewBalance) Deposit(DepositRequest request, int userId, string userRole);
        (bool Success, string Message, decimal? WithdrawAmount, decimal? NewBalance) Withdraw(WithdrawRequest request, int userId, string userRole);
        (bool Success, string Message, decimal? SenderBalance, bool IsInternal) Transfer(TransferRequest request, int userId, string userRole);
        
        IEnumerable<TransactionDto> GetTransactions(int accountId);
        PagedResponse<TransactionDto> GetTransactionsPaged(int accountId, int pageNumber, int pageSize, DateTime? fromDate, DateTime? toDate, string type);
        
        (bool Success, string Message, string? AccountNumber, decimal? Balance) GetBalance(int accountId);
        IEnumerable<TransactionDto> MiniStatement(int accountId);
        IEnumerable<AccountDto> GetMyAccounts(int userId);
        
        (bool Success, string Message) RequestCloseAccount(int id, int userId);
        (bool Success, string Message) ApproveCloseAccount(int id);
        
        IEnumerable<TransactionDto> GetLast10Transactions(int accountId);
        IEnumerable<TransactionDto> GetMonthlyTransactions(int accountId, int month);
        IEnumerable<TransactionDto> GetTransactionsBetweenDates(int accountId, DateTime fromDate, DateTime toDate);
        
        IEnumerable<AccountDto> GetClosureRequests();
        (bool Success, string Message, AccountDto? Account) ApproveAccount(int id, string status);
        IEnumerable<TransactionDto> GetAllTransactions();
    }
}





