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
    public class LoansControllerTests
    {
        private LoansController CreateControllerWithUser(ILoanService service, int userId, string role = "Customer")
        {
            var controller = new LoansController(service, new Mock<ILogger<LoansController>>().Object);
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
        public void ApplyLoan_ValidAccount_ReturnsOk()
        {
            var mockService = new Mock<ILoanService>();
            var expectedLoan = new LoanDto { LoanAmount = 100000m, LoanStatus = "Pending" };
            mockService.Setup(s => s.ApplyLoan(It.IsAny<CreateLoanRequest>(), 1))
                .Returns((true, "Success", expectedLoan));

            var controller = CreateControllerWithUser(mockService.Object, 1);
            var loan = new CreateLoanRequest { LoanAmount = 100000m, AccountNumber = "ACC1001" };

            var result = controller.ApplyLoan(loan) as OkObjectResult;

            Assert.That(result, Is.Not.Null);
            var returnedLoan = result!.Value as LoanDto;
            Assert.That(returnedLoan!.LoanStatus, Is.EqualTo("Pending"));
        }

        [Test]
        public void ApplyLoan_InvalidAccount_ReturnsBadRequest()
        {
            var mockService = new Mock<ILoanService>();
            mockService.Setup(s => s.ApplyLoan(It.IsAny<CreateLoanRequest>(), 1))
                .Returns((false, "Invalid active disbursement account number", null));

            var controller = CreateControllerWithUser(mockService.Object, 1);
            var loan = new CreateLoanRequest { LoanAmount = 100000m, AccountNumber = "INVALID" };

            var result = controller.ApplyLoan(loan);

            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public void GetMyLoans_ReturnsOnlyUserLoans()
        {
            var mockService = new Mock<ILoanService>();
            mockService.Setup(s => s.GetMyLoans(1)).Returns(new List<LoanDto> { new LoanDto(), new LoanDto() });

            var controller = CreateControllerWithUser(mockService.Object, 1);

            var result = controller.GetMyLoans() as OkObjectResult;

            Assert.That(result, Is.Not.Null);
            var list = result!.Value as IEnumerable<LoanDto>;
            Assert.That(list!.Count(), Is.EqualTo(2));
        }

        [Test]
        public void ApproveLoan_PendingLoan_DisbursesFundsAndUpdatesStatus()
        {
            var mockService = new Mock<ILoanService>();
            var expectedLoan = new LoanDto { LoanStatus = "Approved" };
            mockService.Setup(s => s.ApproveLoan(1)).Returns((true, "Success", expectedLoan));

            var controller = CreateControllerWithUser(mockService.Object, 1, "Employee");

            var result = controller.ApproveLoan(1) as OkObjectResult;

            Assert.That(result, Is.Not.Null);
            var returnedLoan = result!.Value as LoanDto;
            Assert.That(returnedLoan!.LoanStatus, Is.EqualTo("Approved"));
        }

        [Test]
        public void RejectLoan_PendingLoan_SetsRejectedStatus()
        {
            var mockService = new Mock<ILoanService>();
            var expectedLoan = new LoanDto { LoanStatus = "Rejected" };
            mockService.Setup(s => s.RejectLoan(1)).Returns((true, "Success", expectedLoan));

            var controller = CreateControllerWithUser(mockService.Object, 1, "Employee");

            var result = controller.RejectLoan(1) as OkObjectResult;

            Assert.That(result, Is.Not.Null);
            var returnedLoan = result!.Value as LoanDto;
            Assert.That(returnedLoan!.LoanStatus, Is.EqualTo("Rejected"));
        }

        [Test]
        public void ApproveLoan_AlreadyApproved_ReturnsBadRequest()
        {
            var mockService = new Mock<ILoanService>();
            mockService.Setup(s => s.ApproveLoan(1)).Returns((false, "Loan has already been processed", null));

            var controller = CreateControllerWithUser(mockService.Object, 1, "Employee");

            var result = controller.ApproveLoan(1);

            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public void RepayLoan_ValidRepayment_ReducesBalances()
        {
            var mockService = new Mock<ILoanService>();
            mockService.Setup(s => s.RepayLoan(1, It.IsAny<RepayRequest>(), 1))
                .Returns((true, "Success", 60000m, "Approved", 30000m));

            var controller = CreateControllerWithUser(mockService.Object, 1);
            var req = new RepayRequest { Amount = 20000m, SourceAccountNumber = "ACC001" };

            var result = controller.RepayLoan(1, req) as OkObjectResult;

            Assert.That(result, Is.Not.Null);
        }

        [Test]
        public void RepayLoan_InsufficientFunds_ReturnsBadRequest()
        {
            var mockService = new Mock<ILoanService>();
            mockService.Setup(s => s.RepayLoan(1, It.IsAny<RepayRequest>(), 1))
                .Returns((false, "Insufficient funds in the selected account", null, null, null));

            var controller = CreateControllerWithUser(mockService.Object, 1);
            var req = new RepayRequest { Amount = 20000m };

            var result = controller.RepayLoan(1, req);

            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public void RepayLoan_OverpayingLoan_ReturnsBadRequest()
        {
            var mockService = new Mock<ILoanService>();
            mockService.Setup(s => s.RepayLoan(1, It.IsAny<RepayRequest>(), 1))
                .Returns((false, "Repayment amount cannot exceed the remaining balance", null, null, null));

            var controller = CreateControllerWithUser(mockService.Object, 1);
            var req = new RepayRequest { Amount = 30000m };

            var result = controller.RepayLoan(1, req);

            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }
    }
}
