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
    }
}
