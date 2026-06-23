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
    public class UsersControllerTests
    {
        private UsersController CreateControllerWithUser(IUserService service, int userId, string role = "Admin")
        {
            var controller = new UsersController(service, new Mock<ILogger<UsersController>>().Object);
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
        public void CreateUser_EmailUnique_SavesUserAndReturnsOk()
        {
            // Arrange
            var mockService = new Mock<IUserService>();
            string errorMessage;
            var expectedUser = new UserDto { FullName = "New User", Email = "new@maverick.com" };
            mockService.Setup(s => s.CreateUser(It.IsAny<RegisterRequest>(), out errorMessage))
                .Returns(expectedUser);

            var controller = CreateControllerWithUser(mockService.Object, 1);
            var request = new RegisterRequest { FullName = "New User", Email = "new@maverick.com", Password = "Password123" };

            // Act
            var result = controller.CreateUser(request) as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            var returnedUser = result!.Value as UserDto;
            Assert.That(returnedUser, Is.Not.Null);
            Assert.That(returnedUser!.FullName, Is.EqualTo("New User"));
        }

        [Test]
        public void CreateUser_EmailExists_ReturnsBadRequest()
        {
            // Arrange
            var mockService = new Mock<IUserService>();
            string errorMessage = "Email already registered";
            mockService.Setup(s => s.CreateUser(It.IsAny<RegisterRequest>(), out errorMessage))
                .Returns((UserDto?)null);

            var controller = CreateControllerWithUser(mockService.Object, 1);
            var request = new RegisterRequest { Email = "existing@maverick.com" };

            // Act
            var result = controller.CreateUser(request);

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequest = (BadRequestObjectResult)result;
            Assert.That(badRequest.Value, Is.EqualTo("Email already registered"));
        }

        [Test]
        public void GetUsers_ReturnsAllUsers()
        {
            // Arrange
            var mockService = new Mock<IUserService>();
            mockService.Setup(s => s.GetUsers()).Returns(new List<UserDto> { new UserDto(), new UserDto() });

            var controller = CreateControllerWithUser(mockService.Object, 1, "Admin");

            // Act
            var result = controller.GetUsers() as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            var list = result!.Value as IEnumerable<UserDto>;
            Assert.That(list, Is.Not.Null);
            Assert.That(list.Count(), Is.EqualTo(2));
        }

        [Test]
        public void UpdateUser_ValidUpdate_UpdatesAndReturnsOk()
        {
            // Arrange
            var mockService = new Mock<IUserService>();
            string errorMessage;
            var expectedUser = new UserDto { FullName = "New Name" };
            mockService.Setup(s => s.UpdateUser(It.IsAny<int>(), It.IsAny<UpdateUserRequest>(), out errorMessage))
                .Returns(expectedUser);

            var controller = CreateControllerWithUser(mockService.Object, 1, "Admin");

            // Act
            var result = controller.UpdateUser(1, new UpdateUserRequest()) as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            var returnedUser = result!.Value as UserDto;
            Assert.That(returnedUser!.FullName, Is.EqualTo("New Name"));
        }

        [Test]
        public void ToggleUserStatus_TogglesIsActive()
        {
            // Arrange
            var mockService = new Mock<IUserService>();
            bool isActive = false;
            mockService.Setup(s => s.ToggleUserStatus(1, out isActive)).Returns(true);

            var controller = CreateControllerWithUser(mockService.Object, 1, "Admin");

            // Act
            var result = controller.ToggleUserStatus(1) as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
        }
    }
}
