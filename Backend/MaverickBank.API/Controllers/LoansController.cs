using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MaverickBank.API.Models;
using MaverickBank.API.DTOs;
using MaverickBank.API.Services;
using System.Security.Claims;
using System;

namespace MaverickBank.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LoansController : ControllerBase
    {
        private readonly ILoanService _loanService;
        private readonly ILogger<LoansController> _logger;

        public LoansController(ILoanService loanService, ILogger<LoansController> logger)
        {
            _loanService = loanService;
            _logger = logger;
        }

        // APPLY FOR A LOAN
        [HttpPost("apply")]
        public IActionResult ApplyLoan(CreateLoanRequest request)
        {
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null) return Unauthorized();

            int userId = int.Parse(userIdClaim.Value);
            var result = _loanService.ApplyLoan(request, userId);

            if (!result.Success) return BadRequest(result.Message);

            _logger.LogInformation("Loan application submitted by UserId {UserId} for {Amount} (Purpose: {Purpose})", userId, request.LoanAmount, request.Purpose);

            return Ok(result.Loan);
        }

        // get LOGGED IN USER LOANS (MY LOANS) [NEW]
        [HttpGet("myloans")]
        public IActionResult GetMyLoans()
        {
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null) return Unauthorized();

            int userId = int.Parse(userIdClaim.Value);
            return Ok(_loanService.GetMyLoans(userId));
        }

        // Get ALL LOANS (EMPLOYEE/ADMIN ONLY)
        [Authorize(Roles = "Employee,Admin")]
        [HttpGet]
        public IActionResult GetLoans()
        {
            return Ok(_loanService.GetLoans());
        }

        // APPROVE LOAN AND DISBURSE FUNDS (EMPLOYEE/ADMIN ONLY)
        [Authorize(Roles = "Employee,Admin")]
        [HttpPut("approve/{id}")]
        public IActionResult ApproveLoan(int id)
        {
            var result = _loanService.ApproveLoan(id);
            if (!result.Success)
            {
                if (result.Message == "Loan not found") return NotFound(result.Message);
                return BadRequest(result.Message);
            }

            _logger.LogInformation("Loan {LoanId} approved. {Amount} disbursed to account {AccountNumber}", result.Loan!.Id, result.Loan.LoanAmount, result.Loan.AccountNumber);

            return Ok(result.Loan);
        }

        // REJECT LOAN (EMPLOYEE/ADMIN ONLY)
        [Authorize(Roles = "Employee,Admin")]
        [HttpPut("reject/{id}")]
        public IActionResult RejectLoan(int id)
        {
            var result = _loanService.RejectLoan(id);
            if (!result.Success)
            {
                if (result.Message == "Loan not found") return NotFound(result.Message);
                return BadRequest(result.Message);
            }

            _logger.LogInformation("Loan {LoanId} rejected", result.Loan!.Id);

            return Ok(result.Loan);
        }

        // REPAY LOAN
        [HttpPost("repay/{id}")]
        public IActionResult RepayLoan(int id, [FromBody] RepayRequest request)
        {
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null) return Unauthorized("User not found in token");
            
            int userId = int.Parse(userIdClaim.Value);

            var result = _loanService.RepayLoan(id, request, userId);
            if (!result.Success)
            {
                if (result.Message == "Loan not found") return NotFound(result.Message);
                if (result.Message == "You do not own this loan") return Unauthorized(result.Message);
                return BadRequest(result.Message);
            }

            _logger.LogInformation("Loan {LoanId} repayment of {Amount} from account {AccountNumber}. Remaining: {Remaining}", id, request.Amount, request.SourceAccountNumber, result.NewRemainingBalance);

            return Ok(new
            {
                Message = result.Message,
                NewRemainingBalance = result.NewRemainingBalance,
                LoanStatus = result.LoanStatus,
                NewAccountBalance = result.NewAccountBalance
            });
        }
    }
}



