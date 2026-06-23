using MaverickBank.API.Data;
using MaverickBank.API.Models;
using MaverickBank.API.DTOs;
using AutoMapper;
using MaverickBank.API.Services;
using MaverickBank.API.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using System;
using System.Linq;

namespace MaverickBank.Tests
{
    [TestFixture]
    public class LoanServiceTests
    {
        private DbContextOptions<ApplicationDbContext> _options;

        [SetUp]
        public void Setup()
        {
            _options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
        }

        [Test]
        public void ApplyLoan_ValidAccount_ReturnsSuccess()
        {
            using var context = new ApplicationDbContext(_options);
            var hubMock = new Mock<IHubContext<NotificationHub>>();
            var mapperMock = new Mock<IMapper>();
            mapperMock.Setup(m => m.Map<Loan>(It.IsAny<CreateLoanRequest>())).Returns(new Loan { AccountNumber = "ACC123", LoanAmount = 5000 });
            mapperMock.Setup(m => m.Map<LoanDto>(It.IsAny<Loan>())).Returns((Loan l) => new LoanDto { LoanStatus = l.LoanStatus });
            var service = new LoanService(context, hubMock.Object, mapperMock.Object, new Mock<ILogger<LoanService>>().Object);

            var account = new Account { AccountNumber = "ACC123", UserId = 1, Status = "Active" };
            context.Accounts.Add(account);
            context.SaveChanges();

            var loan = new CreateLoanRequest { AccountNumber = "ACC123", LoanAmount = 5000 };
            var result = service.ApplyLoan(loan, 1);

            Assert.That(result.Success, Is.True);
            Assert.That(result.Loan, Is.Not.Null);
            Assert.That(result.Loan.LoanStatus, Is.EqualTo("Pending"));
            Assert.That(context.Loans.Count(), Is.EqualTo(1));
        }

        [Test]
        public void ApplyLoan_InvalidAccount_ReturnsFailure()
        {
            using var context = new ApplicationDbContext(_options);
            var hubMock = new Mock<IHubContext<NotificationHub>>();
            var mapperMock = new Mock<IMapper>();
            mapperMock.Setup(m => m.Map<Loan>(It.IsAny<CreateLoanRequest>())).Returns(new Loan { AccountNumber = "ACC123", LoanAmount = 5000 });
            var service = new LoanService(context, hubMock.Object, mapperMock.Object, new Mock<ILogger<LoanService>>().Object);

            var loan = new CreateLoanRequest { AccountNumber = "ACC123", LoanAmount = 5000 };
            var result = service.ApplyLoan(loan, 1);

            Assert.That(result.Success, Is.False);
            Assert.That(result.Message, Is.EqualTo("Invalid active disbursement account number"));
            Assert.That(context.Loans.Count(), Is.EqualTo(0));
        }

        [Test]
        public void ApproveLoan_ValidPendingLoan_ApprovesAndDepositsMoney()
        {
            using var context = new ApplicationDbContext(_options);
            var hubMock = new Mock<IHubContext<NotificationHub>>();
            var clientsMock = new Mock<IHubClients>();
            var groupMock = new Mock<IClientProxy>();
            clientsMock.Setup(c => c.Group(It.IsAny<string>())).Returns(groupMock.Object);
            hubMock.Setup(h => h.Clients).Returns(clientsMock.Object);
            var mapperMock = new Mock<IMapper>();
            mapperMock.Setup(m => m.Map<LoanDto>(It.IsAny<Loan>())).Returns((Loan l) => new LoanDto { LoanStatus = l.LoanStatus });
            var service = new LoanService(context, hubMock.Object, mapperMock.Object, new Mock<ILogger<LoanService>>().Object);

            var account = new Account { AccountNumber = "ACC123", UserId = 1, Status = "Active", Balance = 0 };
            context.Accounts.Add(account);
            
            var loan = new Loan { AccountNumber = "ACC123", UserId = 1, LoanAmount = 5000, LoanStatus = "Pending" };
            context.Loans.Add(loan);
            context.SaveChanges();

            var result = service.ApproveLoan(loan.Id);

            Assert.That(result.Success, Is.True);
            Assert.That(result.Loan!.LoanStatus, Is.EqualTo("Approved"));
            Assert.That(account.Balance, Is.EqualTo(5000));
            Assert.That(context.Transactions.Count(), Is.EqualTo(1));
        }

        [Test]
        public void RejectLoan_ValidPendingLoan_RejectsLoan()
        {
            using var context = new ApplicationDbContext(_options);
            var hubMock = new Mock<IHubContext<NotificationHub>>();
            var clientsMock = new Mock<IHubClients>();
            var groupMock = new Mock<IClientProxy>();
            clientsMock.Setup(c => c.Group(It.IsAny<string>())).Returns(groupMock.Object);
            hubMock.Setup(h => h.Clients).Returns(clientsMock.Object);
            var mapperMock = new Mock<IMapper>();
            mapperMock.Setup(m => m.Map<LoanDto>(It.IsAny<Loan>())).Returns((Loan l) => new LoanDto { LoanStatus = l.LoanStatus });
            var service = new LoanService(context, hubMock.Object, mapperMock.Object, new Mock<ILogger<LoanService>>().Object);

            var loan = new Loan { AccountNumber = "ACC123", UserId = 1, LoanAmount = 5000, LoanStatus = "Pending" };
            context.Loans.Add(loan);
            context.SaveChanges();

            var result = service.RejectLoan(loan.Id);

            Assert.That(result.Success, Is.True);
            Assert.That(result.Loan!.LoanStatus, Is.EqualTo("Rejected"));
        }

        [Test]
        public void RepayLoan_ValidRepayment_ReducesRemainingBalanceAndDeductsFromAccount()
        {
            using var context = new ApplicationDbContext(_options);
            var hubMock = new Mock<IHubContext<NotificationHub>>();
            var mapperMock = new Mock<IMapper>();
            var service = new LoanService(context, hubMock.Object, mapperMock.Object, new Mock<ILogger<LoanService>>().Object);

            var account = new Account { AccountNumber = "ACC123", UserId = 1, Status = "Active", Balance = 10000, IsClosed = false };
            context.Accounts.Add(account);

            var loan = new Loan { AccountNumber = "ACC123", UserId = 1, LoanAmount = 5000, RemainingBalance = 5000, LoanStatus = "Approved" };
            context.Loans.Add(loan);
            context.SaveChanges();

            var request = new RepayRequest { SourceAccountNumber = "ACC123", Amount = 2000 };
            var result = service.RepayLoan(loan.Id, request, 1);

            Assert.That(result.Success, Is.True);
            Assert.That(result.NewRemainingBalance, Is.EqualTo(3000));
            Assert.That(result.NewAccountBalance, Is.EqualTo(8000));
            Assert.That(result.LoanStatus, Is.EqualTo("Approved"));
            Assert.That(account.Balance, Is.EqualTo(8000));
            Assert.That(loan.RemainingBalance, Is.EqualTo(3000));
            Assert.That(context.Transactions.Count(), Is.EqualTo(1));
            Assert.That(context.Transactions.First().TransactionType, Is.EqualTo("Loan Repayment"));
        }
    }
}
