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
    public class AccountServiceTests
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
        public void CreateAccount_SavesAccountWithDefaultValues()
        {
            using var context = new ApplicationDbContext(_options);
            var hubMock = new Mock<IHubContext<NotificationHub>>();
            var mapperMock = new Mock<IMapper>();
            mapperMock.Setup(m => m.Map<Account>(It.IsAny<CreateAccountRequest>())).Returns((CreateAccountRequest req) => new Account { AccountType = req.AccountType, DateOfBirth = req.DateOfBirth });
            mapperMock.Setup(m => m.Map<AccountDto>(It.IsAny<Account>())).Returns((Account a) => new AccountDto { AccountNumber = a.AccountNumber, Status = a.Status, Balance = a.Balance });
            var service = new AccountService(context, hubMock.Object, mapperMock.Object, new Mock<ILogger<AccountService>>().Object);

            var account = new CreateAccountRequest { AccountType = "Savings", DateOfBirth = new DateTime(1990, 1, 1) };
            int userId = 1;

            var createdAccount = service.CreateAccount(account, userId);

            Assert.That(createdAccount, Is.Not.Null);
            Assert.That(createdAccount.Status, Is.EqualTo("Pending"));
            Assert.That(createdAccount.Balance, Is.EqualTo(0));
            Assert.That(createdAccount.AccountNumber, Does.StartWith("ACC"));
        }

        [Test]
        public void Deposit_ValidAmount_UpdatesBalanceAndLogsTransaction()
        {
            using var context = new ApplicationDbContext(_options);
            var hubMock = new Mock<IHubContext<NotificationHub>>();
            var service = new AccountService(context, hubMock.Object, new Mock<IMapper>().Object, new Mock<ILogger<AccountService>>().Object);

            var account = new Account { Status = "Active", Balance = 100, IsClosed = false };
            context.Accounts.Add(account);
            context.SaveChanges();

            var request = new DepositRequest { AccountId = account.Id, Amount = 50 };
            var result = service.Deposit(request, account.UserId, "Customer");

            Assert.That(result.Success, Is.True);
            Assert.That(result.NewBalance, Is.EqualTo(150));
            Assert.That(context.Transactions.Count(), Is.EqualTo(1));
            Assert.That(context.Transactions.First().TransactionType, Is.EqualTo("Deposit"));
        }

        [Test]
        public void Withdraw_InsufficientBalance_ReturnsFalse()
        {
            using var context = new ApplicationDbContext(_options);
            var hubMock = new Mock<IHubContext<NotificationHub>>();
            var service = new AccountService(context, hubMock.Object, new Mock<IMapper>().Object, new Mock<ILogger<AccountService>>().Object);

            var account = new Account { Status = "Active", Balance = 50, IsClosed = false };
            context.Accounts.Add(account);
            context.SaveChanges();

            var request = new WithdrawRequest { AccountId = account.Id, Amount = 100 };
            var result = service.Withdraw(request, account.UserId, "Customer");

            Assert.That(result.Success, Is.False);
            Assert.That(result.Message, Is.EqualTo("Insufficient balance"));
            Assert.That(context.Transactions.Count(), Is.EqualTo(0));
        }

        [Test]
        public void Transfer_SufficientBalance_UpdatesBalancesAndLogsTransactions()
        {
            using var context = new ApplicationDbContext(_options);
            
            var hubMock = new Mock<IHubContext<NotificationHub>>();
            var clientsMock = new Mock<IHubClients>();
            var groupMock = new Mock<IClientProxy>();
            
            clientsMock.Setup(c => c.Group(It.IsAny<string>())).Returns(groupMock.Object);
            hubMock.Setup(h => h.Clients).Returns(clientsMock.Object);
            
            var service = new AccountService(context, hubMock.Object, new Mock<IMapper>().Object, new Mock<ILogger<AccountService>>().Object);

            var sender = new Account { UserId = 1, Status = "Active", Balance = 200, IsClosed = false };
            var receiver = new Account { AccountNumber = "ACC999", Status = "Active", Balance = 50, IsClosed = false };
            context.Accounts.AddRange(sender, receiver);
            context.SaveChanges();

            var request = new TransferRequest { FromAccountId = sender.Id, DestinationAccountNumber = "ACC999", Amount = 100 };
            var result = service.Transfer(request, 1, "Customer");

            Assert.That(result.Success, Is.True);
            Assert.That(result.SenderBalance, Is.EqualTo(100));
            Assert.That(receiver.Balance, Is.EqualTo(150));
            Assert.That(context.Transactions.Count(), Is.EqualTo(2));
        }
    }
}
