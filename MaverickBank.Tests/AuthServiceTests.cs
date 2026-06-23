using MaverickBank.API.Data;
using MaverickBank.API.Models;
using MaverickBank.API.Services;
using MaverickBank.API.DTOs;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;

namespace MaverickBank.Tests
{
    [TestFixture]
    public class AuthServiceTests
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
        public void Login_ValidCredentials_ReturnsTokenAndUser()
        {
            using var context = new ApplicationDbContext(_options);
            
            var user = new User 
            { 
                Email = "test@test.com", 
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
                Role = "Customer"
            };
            context.Users.Add(user);
            context.SaveChanges();

            var inMemorySettings = new Dictionary<string, string?> {
                {"Jwt:Key", "SuperSecretKeyForJwtAuthentication123!"},
                {"Jwt:Issuer", "TestIssuer"},
                {"Jwt:Audience", "TestAudience"}
            };
            IConfiguration configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();

            var mapperMock = new Mock<IMapper>();
            mapperMock.Setup(m => m.Map<UserDto>(It.IsAny<User>())).Returns((User u) => new UserDto { Email = u.Email, Role = u.Role });
            var service = new AuthService(context, configuration, mapperMock.Object, new Mock<ILogger<AuthService>>().Object);

            var token = service.Login("test@test.com", "password123", out var authenticatedUser);

            Assert.That(token, Is.Not.Null);
            Assert.That(authenticatedUser, Is.Not.Null);
            Assert.That(authenticatedUser.Email, Is.EqualTo("test@test.com"));
        }

        [Test]
        public void Login_InvalidEmail_ReturnsNull()
        {
            using var context = new ApplicationDbContext(_options);
            var configuration = new Mock<IConfiguration>().Object;
            var service = new AuthService(context, configuration, new Mock<IMapper>().Object, new Mock<ILogger<AuthService>>().Object);

            var token = service.Login("wrong@test.com", "password", out var authenticatedUser);

            Assert.That(token, Is.Null);
            Assert.That(authenticatedUser, Is.Null);
        }

        [Test]
        public void Login_InvalidPassword_ReturnsNull()
        {
            using var context = new ApplicationDbContext(_options);
            
            var user = new User 
            { 
                Email = "test@test.com", 
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123")
            };
            context.Users.Add(user);
            context.SaveChanges();

            var configuration = new Mock<IConfiguration>().Object;
            var service = new AuthService(context, configuration, new Mock<IMapper>().Object, new Mock<ILogger<AuthService>>().Object);

            var token = service.Login("test@test.com", "wrongpassword", out var authenticatedUser);

            Assert.That(token, Is.Null);
            Assert.That(authenticatedUser, Is.Null);
        }
    }
}
