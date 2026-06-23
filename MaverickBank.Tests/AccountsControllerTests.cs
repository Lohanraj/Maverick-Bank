using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using MaverickBank.API.Controllers;
using MaverickBank.API.Models;
using MaverickBank.API.DTOs;
using MaverickBank.API.Services;
using System.Security.Claims;
using System.Collections.Generic;

namespace MaverickBank.Tests
{
    [TestFixture]
    public class AccountsControllerTests
    {
        private AccountsController CreateControllerWithUser(IAccountService service, int userId, string role = "Customer")
        {
            var controller = new AccountsController(service, new Mock<ILogger<AccountsController>>().Object);
            var claims = new List<Claim>
            {
                new Claim("UserId", userId.ToString()),
                new Claim(ClaimTypes.Role, role)
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };
            return controller;
        }

        [Test]
        public void Deposit_ValidAccount_IncreasesBalance()
        {
            var mockService = new Mock<IAccountService>();
            mockService.Setup(s => s.Deposit(It.IsAny<DepositRequest>(), It.IsAny<int>(), It.IsAny<string>()))
                .Returns((true, "Deposit successful", 500m, 1500m));

            var controller = CreateControllerWithUser(mockService.Object, 1);
            var request = new DepositRequest { AccountId = 1, Amount = 500m };

            var result = controller.Deposit(request) as OkObjectResult;

            Assert.That(result, Is.Not.Null);
        }

        [Test]
        public void Deposit_InvalidAmount_ReturnsBadRequest()
        {
            var mockService = new Mock<IAccountService>();
            mockService.Setup(s => s.Deposit(It.IsAny<DepositRequest>(), It.IsAny<int>(), It.IsAny<string>()))
                .Returns((false, "Invalid deposit amount", null, null));

            var controller = CreateControllerWithUser(mockService.Object, 1);
            var request = new DepositRequest { AccountId = 1, Amount = -100m };

            var result = controller.Deposit(request);

            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public void Withdraw_SufficientBalance_DecreasesBalance()
        {
            var mockService = new Mock<IAccountService>();
            mockService.Setup(s => s.Withdraw(It.IsAny<WithdrawRequest>(), It.IsAny<int>(), It.IsAny<string>()))
                .Returns((true, "Withdraw successful", 2000m, 3000m));

            var controller = CreateControllerWithUser(mockService.Object, 1);
            var request = new WithdrawRequest { AccountId = 1, Amount = 2000m };

            var result = controller.Withdraw(request) as OkObjectResult;

            Assert.That(result, Is.Not.Null);
        }

        [Test]
        public void Withdraw_InsufficientBalance_ReturnsBadRequest()
        {
            var mockService = new Mock<IAccountService>();
            mockService.Setup(s => s.Withdraw(It.IsAny<WithdrawRequest>(), It.IsAny<int>(), It.IsAny<string>()))
                .Returns((false, "Insufficient balance", null, null));

            var controller = CreateControllerWithUser(mockService.Object, 1);
            var request = new WithdrawRequest { AccountId = 1, Amount = 1000m };

            var result = controller.Withdraw(request);

            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public void GetBalance_ExistingAccount_ReturnsBalance()
        {
            var mockService = new Mock<IAccountService>();
            mockService.Setup(s => s.GetBalance(1))
                .Returns((true, "Success", "ACC1001", 9999m));

            var controller = CreateControllerWithUser(mockService.Object, 1);

            var result = controller.GetBalance(1) as OkObjectResult;

            Assert.That(result, Is.Not.Null);
        }

        [Test]
        public void GetBalance_NonExistingAccount_ReturnsNotFound()
        {
            var mockService = new Mock<IAccountService>();
            mockService.Setup(s => s.GetBalance(999))
                .Returns((false, "Account not found", null, null));

            var controller = CreateControllerWithUser(mockService.Object, 1);

            var result = controller.GetBalance(999);

            Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        }

        [Test]
        public void GetMyAccounts_ReturnsOnlyUserAccounts()
        {
            var mockService = new Mock<IAccountService>();
            mockService.Setup(s => s.GetMyAccounts(1)).Returns(new List<AccountDto> { new AccountDto(), new AccountDto() });

            var controller = CreateControllerWithUser(mockService.Object, 1);

            var result = controller.GetMyAccounts() as OkObjectResult;

            Assert.That(result, Is.Not.Null);
            var accounts = result!.Value as IEnumerable<AccountDto>;
            Assert.That(accounts!.Count(), Is.EqualTo(2));
        }

        [Test]
        public void RequestCloseAccount_ValidAccount_SetsCloseRequested()
        {
            var mockService = new Mock<IAccountService>();
            mockService.Setup(s => s.RequestCloseAccount(1, 1)).Returns((true, "Account closure requested successfully"));

            var controller = CreateControllerWithUser(mockService.Object, 1);

            var result = controller.RequestCloseAccount(1) as OkObjectResult;

            Assert.That(result, Is.Not.Null);
        }

        [Test]
        public void MiniStatement_ReturnsLast5Transactions()
        {
            var mockService = new Mock<IAccountService>();
            mockService.Setup(s => s.MiniStatement(1)).Returns(new List<TransactionDto> { new TransactionDto(), new TransactionDto() });

            var controller = CreateControllerWithUser(mockService.Object, 1);

            var result = controller.MiniStatement(1) as OkObjectResult;

            Assert.That(result, Is.Not.Null);
        }
    }
}
