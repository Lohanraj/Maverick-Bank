using MaverickBank.API.Data;
using MaverickBank.API.Models;
using MaverickBank.API.Services;
using MaverickBank.API.DTOs;
using AutoMapper;
using Moq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NUnit.Framework;
using System;
using System.Linq;

namespace MaverickBank.Tests
{
    [TestFixture]
    public class UserServiceTests
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
        public void CreateUser_UniqueEmail_SavesUserAndReturnsIt()
        {
            using var context = new ApplicationDbContext(_options);
            var mapperMock = new Mock<IMapper>();
            mapperMock.Setup(m => m.Map<User>(It.IsAny<RegisterRequest>())).Returns((RegisterRequest r) => new User { FullName = r.FullName, Email = r.Email, PasswordHash = "hashed" });
            mapperMock.Setup(m => m.Map<UserDto>(It.IsAny<User>())).Returns((User u) => new UserDto { Email = u.Email, FullName = u.FullName });
            var service = new UserService(context, mapperMock.Object, new Mock<ILogger<UserService>>().Object);

            var request = new RegisterRequest
            {
                FullName = "John Doe",
                Email = "john@example.com",
                Password = "Password123"
            };

            var user = service.CreateUser(request, out string errorMessage);

            Assert.That(user, Is.Not.Null);
            Assert.That(errorMessage, Is.Empty);
            Assert.That(user.Email, Is.EqualTo("john@example.com"));
            Assert.That(context.Users.Count(), Is.EqualTo(1));
        }

        [Test]
        public void CreateUser_DuplicateEmail_ReturnsNullAndErrorMessage()
        {
            using var context = new ApplicationDbContext(_options);
            context.Users.Add(new User { Email = "john@example.com", PasswordHash = "hash" });
            context.SaveChanges();

            var mapperMock = new Mock<IMapper>();
            mapperMock.Setup(m => m.Map<User>(It.IsAny<RegisterRequest>())).Returns((RegisterRequest r) => new User { FullName = r.FullName, Email = r.Email, PasswordHash = "hashed" });
            mapperMock.Setup(m => m.Map<UserDto>(It.IsAny<User>())).Returns((User u) => new UserDto { Email = u.Email, FullName = u.FullName });
            var service = new UserService(context, mapperMock.Object, new Mock<ILogger<UserService>>().Object);

            var request = new RegisterRequest
            {
                FullName = "John Doe Two",
                Email = "john@example.com",
                Password = "Password123"
            };

            var user = service.CreateUser(request, out string errorMessage);

            Assert.That(user, Is.Null);
            Assert.That(errorMessage, Is.EqualTo("Email already registered"));
            Assert.That(context.Users.Count(), Is.EqualTo(1));
        }

        [Test]
        public void GetUsers_ReturnsAllUsers()
        {
            using var context = new ApplicationDbContext(_options);
            context.Users.Add(new User { Email = "user1@example.com", PasswordHash = "hash" });
            context.Users.Add(new User { Email = "user2@example.com", PasswordHash = "hash" });
            context.SaveChanges();

            var mapperMock = new Mock<IMapper>();
            mapperMock.Setup(m => m.Map<IEnumerable<UserDto>>(It.IsAny<IEnumerable<User>>())).Returns(new[] { new UserDto(), new UserDto() });
            var service = new UserService(context, mapperMock.Object, new Mock<ILogger<UserService>>().Object);
            var users = service.GetUsers();

            Assert.That(users.Count(), Is.EqualTo(2));
        }

        [Test]
        public void DeleteUser_ExistingUser_RemovesUserAndCascadeRecords()
        {
            using var context = new ApplicationDbContext(_options);
            
            // Seed user and dependencies
            var user = new User { Id = 10, Email = "test@delete.com", PasswordHash = "hash" };
            context.Users.Add(user);
            context.Accounts.Add(new Account { Id = 1, UserId = 10, AccountNumber = "ACC1", Status = "Active" });
            context.Loans.Add(new Loan { Id = 1, UserId = 10, LoanAmount = 100 });
            context.Cards.Add(new Card { Id = 1, UserId = 10, CardNumber = "1234" });
            context.Beneficiaries.Add(new Beneficiary { Id = 1, UserId = 10 });
            context.Transactions.Add(new Transaction { Id = 1, AccountId = 1, Amount = 50 });
            context.SaveChanges();

            var service = new UserService(context, new Mock<IMapper>().Object, new Mock<ILogger<UserService>>().Object);
            
            var result = service.DeleteUser(10, out string errorMessage);

            Assert.That(result, Is.True);
            Assert.That(errorMessage, Is.Empty);
            Assert.That(context.Users.Count(u => u.Id == 10), Is.EqualTo(0));
            Assert.That(context.Accounts.Count(a => a.UserId == 10), Is.EqualTo(0));
            Assert.That(context.Loans.Count(l => l.UserId == 10), Is.EqualTo(0));
            Assert.That(context.Cards.Count(c => c.UserId == 10), Is.EqualTo(0));
            Assert.That(context.Beneficiaries.Count(b => b.UserId == 10), Is.EqualTo(0));
            Assert.That(context.Transactions.Count(t => t.AccountId == 1), Is.EqualTo(0));
        }

        [Test]
        public void DeleteUser_NonExistingUser_ReturnsFalse()
        {
            using var context = new ApplicationDbContext(_options);
            var service = new UserService(context, new Mock<IMapper>().Object, new Mock<ILogger<UserService>>().Object);

            var result = service.DeleteUser(999, out string errorMessage);

            Assert.That(result, Is.False);
            Assert.That(errorMessage, Is.EqualTo("User not found"));
        }
    }
}
