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
    public class AccountsController : ControllerBase
    {
        private readonly IAccountService _accountService;
        private readonly ILogger<AccountsController> _logger;

        public AccountsController(IAccountService accountService, ILogger<AccountsController> logger)
        {
            _accountService = accountService;
            _logger = logger;
        }

        [Authorize]
        [HttpPost]
        public IActionResult CreateAccount(CreateAccountRequest request)
        {
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null) return Unauthorized("User not found in token");
            
            int userId = int.Parse(userIdClaim.Value);
            var createdAccount = _accountService.CreateAccount(request, userId);

            _logger.LogInformation("Account {AccountNumber} created for UserId {UserId} (Status: Pending)", createdAccount.AccountNumber, userId);
            return Ok(createdAccount);
        }

        // GET ALL ACCOUNTS (EMPLOYEE/ADMIN ONLY)
        [Authorize(Roles = "Employee,Admin")]
        [HttpGet]
        public IActionResult GetAccounts()
        {
            return Ok(_accountService.GetAccounts());
        }

        // DEPOSIT MONEY
        [Authorize]
        [HttpPost("deposit")]
        public IActionResult Deposit(DepositRequest request)
        {
            var userIdClaim = User.FindFirst("UserId");
            var roleClaim = User.FindFirst(ClaimTypes.Role);
            if (userIdClaim == null || roleClaim == null) return Unauthorized("Unauthorized access");

            int userId = int.Parse(userIdClaim.Value);
            string userRole = roleClaim.Value;

            var result = _accountService.Deposit(request, userId, userRole);
            if (!result.Success)
            {
                if (result.Message == "Account not found") return NotFound(result.Message);
                if (result.Message == "You do not own this account") return Unauthorized(result.Message);
                return BadRequest(result.Message);
            }

            _logger.LogInformation("Deposit of {Amount} to AccountId {AccountId}. New Balance: {Balance}", request.Amount, request.AccountId, result.NewBalance);

            return Ok(new
            {
                Message = result.Message,
                AccountId = request.AccountId,
                DepositedAmount = result.DepositedAmount,
                NewBalance = result.NewBalance
            });
        }

        // WITHDRAW MONEY
        [Authorize]
        [HttpPost("withdraw")]
        public IActionResult Withdraw(WithdrawRequest request)
        {
            var userIdClaim = User.FindFirst("UserId");
            var roleClaim = User.FindFirst(ClaimTypes.Role);
            if (userIdClaim == null || roleClaim == null) return Unauthorized("Unauthorized access");

            int userId = int.Parse(userIdClaim.Value);
            string userRole = roleClaim.Value;

            var result = _accountService.Withdraw(request, userId, userRole);
            if (!result.Success)
            {
                if (result.Message == "Account not found") return NotFound(result.Message);
                if (result.Message == "You do not own this account") return Unauthorized(result.Message);
                return BadRequest(result.Message);
            }

            _logger.LogInformation("Withdrawal of {Amount} from AccountId {AccountId}. New Balance: {Balance}", request.Amount, request.AccountId, result.NewBalance);

            return Ok(new
            {
                Message = result.Message,
                AccountId = request.AccountId,
                WithdrawAmount = result.WithdrawAmount,
                NewBalance = result.NewBalance
            });
        }

        // TRANSFER MONEY
        [Authorize]
        [HttpPost("transfer")]
        public IActionResult Transfer(TransferRequest request)
        {
            var userIdClaim = User.FindFirst("UserId");
            var roleClaim = User.FindFirst(ClaimTypes.Role);
            if (userIdClaim == null || roleClaim == null) return Unauthorized("Unauthorized access");
            
            int userId = int.Parse(userIdClaim.Value);
            string userRole = roleClaim.Value;
            var result = _accountService.Transfer(request, userId, userRole);

            if (!result.Success)
            {
                if (result.Message == "Sender account not found") return NotFound(result.Message);
                if (result.Message == "You do not own this account") return Unauthorized(result.Message);
                return BadRequest(result.Message);
            }

            _logger.LogInformation("Transfer of {Amount} from AccountId {FromAccountId} to {DestAccount} (Internal: {IsInternal})", request.Amount, request.FromAccountId, request.DestinationAccountNumber, result.IsInternal);

            return Ok(new
            {
                Message = result.Message,
                SenderBalance = result.SenderBalance,
                IsInternal = result.IsInternal
            });
        }

        // GET TRANSACTION HISTORY
        [HttpGet("transactions/{accountId}")]
        public IActionResult GetTransactions(int accountId)
        {
            return Ok(_accountService.GetTransactions(accountId));
        }

        // GET TRANSACTION HISTORY (PAGED & FILTERED)
        [HttpGet("transactions/{accountId}/paged")]
        public IActionResult GetTransactionsPaged(int accountId, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null, [FromQuery] string type = "All")
        {
            return Ok(_accountService.GetTransactionsPaged(accountId, pageNumber, pageSize, fromDate, toDate, type));
        }

        // GET ACCOUNT BALANCE
        [HttpGet("balance/{accountId}")]
        public IActionResult GetBalance(int accountId)
        {
            var result = _accountService.GetBalance(accountId);
            if (!result.Success) return NotFound(result.Message);
            
            return Ok(new
            {
                AccountId = accountId,
                AccountNumber = result.AccountNumber,
                Balance = result.Balance
            });
        }

        // MINI STATEMENT
        [HttpGet("ministatement/{accountId}")]
        public IActionResult MiniStatement(int accountId)
        {
            return Ok(_accountService.MiniStatement(accountId));
        }

        // GET LOGGED-IN USER ACCOUNTS
        [Authorize]
        [HttpGet("myaccounts")]
        public IActionResult GetMyAccounts()
        {
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null) return Unauthorized("User not found in token");
            
            int userId = int.Parse(userIdClaim.Value);
            return Ok(_accountService.GetMyAccounts(userId));
        }

        // REQUEST ACCOUNT CLOSURE
        [Authorize]
        [HttpPut("requestclose/{id}")]
        public IActionResult RequestCloseAccount(int id)
        {
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null) return Unauthorized();
            
            int userId = int.Parse(userIdClaim.Value);
            var result = _accountService.RequestCloseAccount(id, userId);

            if (!result.Success) return NotFound(result.Message);

            return Ok(new { Message = result.Message });
        }

        // APPROVE ACCOUNT CLOSURE (EMPLOYEE/ADMIN ONLY)
        [Authorize(Roles = "Employee,Admin")]
        [HttpPut("approveclose/{id}")]
        public IActionResult ApproveCloseAccount(int id)
        {
            var result = _accountService.ApproveCloseAccount(id);
            if (!result.Success) return NotFound(result.Message);
            return Ok(new { Message = result.Message });
        }

        // LAST 10 TRANSACTIONS
        [Authorize]
        [HttpGet("last10/{accountId}")]
        public IActionResult GetLast10Transactions(int accountId)
        {
            return Ok(_accountService.GetLast10Transactions(accountId));
        }

        // MONTHLY TRANSACTIONS
        [Authorize]
        [HttpGet("month/{accountId}/{month}")]
        public IActionResult GetMonthlyTransactions(int accountId, int month)
        {
            return Ok(_accountService.GetMonthlyTransactions(accountId, month));
        }

        // TRANSACTIONS BETWEEN DATES
        [Authorize]
        [HttpGet("betweendates")]
        public IActionResult GetTransactionsBetweenDates(int accountId, DateTime fromDate, DateTime toDate)
        {
            return Ok(_accountService.GetTransactionsBetweenDates(accountId, fromDate, toDate));
        }

        // GET ACCOUNT CLOSURE REQUESTS (EMPLOYEE/ADMIN ONLY)
        [Authorize(Roles = "Employee,Admin")]
        [HttpGet("closurerequests")]
        public IActionResult GetClosureRequests()
        {
            return Ok(_accountService.GetClosureRequests());
        }

        // APPROVE/REJECT NEW ACCOUNT (EMPLOYEE/ADMIN ONLY) [NEW]
        [Authorize(Roles = "Employee,Admin")]
        [HttpPut("approve/{id}/{status}")]
        public IActionResult ApproveAccount(int id, string status)
        {
            var result = _accountService.ApproveAccount(id, status);
            if (!result.Success)
            {
                if (result.Message == "Account not found") return NotFound(result.Message);
                return BadRequest(result.Message);
            }

            return Ok(new
            {
                Message = result.Message,
                Account = result.Account
            });
        }

        // GET ALL TRANSACTIONS (EMPLOYEE/ADMIN ONLY) [NEW]
        [Authorize(Roles = "Employee,Admin")]
        [HttpGet("alltransactions")]
        public IActionResult GetAllTransactions()
        {
            return Ok(_accountService.GetAllTransactions());
        }
    }
}



