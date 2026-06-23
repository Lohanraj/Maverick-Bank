using MaverickBank.API.DTOs;
using System.Collections.Generic;

namespace MaverickBank.API.Services
{
    public interface ILoanService
    {
        (bool Success, string Message, LoanDto? Loan) ApplyLoan(CreateLoanRequest request, int userId);
        IEnumerable<LoanDto> GetMyLoans(int userId);
        IEnumerable<LoanDto> GetLoans();
        (bool Success, string Message, LoanDto? Loan) ApproveLoan(int id);
        (bool Success, string Message, LoanDto? Loan) RejectLoan(int id);
        (bool Success, string Message, decimal? NewRemainingBalance, string? LoanStatus, decimal? NewAccountBalance) RepayLoan(int id, RepayRequest request, int userId);
    }
}






