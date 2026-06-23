using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using Microsoft.Extensions.Logging;
using MaverickBank.API.Controllers;
using MaverickBank.API.Models;
using MaverickBank.API.DTOs;
using MaverickBank.API.Services;

namespace MaverickBank.Tests
{
    [TestFixture]
    public class AuthControllerTests
    {
        [Test]
        public void Login_UserDoesNotExist_ReturnsUnauthorized()
        {
            // Arrange
            var mockAuthService = new Mock<IAuthService>();
            UserDto? outUser = null;
            mockAuthService.Setup(s => s.Login(It.IsAny<string>(), It.IsAny<string>(), out outUser))
                .Returns((string?)null); // Returning null token means failure
            
            var controller = new AuthController(mockAuthService.Object, new Mock<ILogger<AuthController>>().Object);
            var loginRequest = new LoginRequest
            {
                Email = "nonexistent@maverick.com",
                Password = "Password123"
            };

            // Act
            var result = controller.Login(loginRequest);

            // Assert
            Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
            var unauthorizedResult = (UnauthorizedObjectResult)result;
            Assert.That(unauthorizedResult.Value, Is.EqualTo("Invalid email or password"));
        }

        [Test]
        public void Login_UserExistsWithIncorrectPassword_ReturnsUnauthorized()
        {
            // Arrange
            var mockAuthService = new Mock<IAuthService>();
            UserDto? outUser = null;
            mockAuthService.Setup(s => s.Login(It.IsAny<string>(), It.IsAny<string>(), out outUser))
                .Returns((string?)null); // Returning null token means failure

            var controller = new AuthController(mockAuthService.Object, new Mock<ILogger<AuthController>>().Object);
            var loginRequest = new LoginRequest
            {
                Email = "test@maverick.com",
                Password = "WrongPassword123"
            };

            // Act
            var result = controller.Login(loginRequest);

            // Assert
            Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
            var unauthorizedResult = (UnauthorizedObjectResult)result;
            Assert.That(unauthorizedResult.Value, Is.EqualTo("Invalid email or password"));
        }
    }
}
