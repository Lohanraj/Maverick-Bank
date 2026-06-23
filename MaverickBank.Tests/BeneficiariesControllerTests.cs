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
    public class BeneficiariesControllerTests
    {
        private BeneficiariesController CreateControllerWithUser(IBeneficiaryService service, int userId)
        {
            var controller = new BeneficiariesController(service, new Mock<ILogger<BeneficiariesController>>().Object);
            var claims = new List<Claim>
            {
                new Claim("UserId", userId.ToString())
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
        public void AddBeneficiary_Valid_ReturnsOk()
        {
            var mockService = new Mock<IBeneficiaryService>();
            var expectedBen = new BeneficiaryDto { BeneficiaryName = "Test Ben" };
            mockService.Setup(s => s.AddBeneficiary(It.IsAny<AddBeneficiaryRequest>(), 1))
                .Returns(expectedBen);

            var controller = CreateControllerWithUser(mockService.Object, 1);
            var ben = new AddBeneficiaryRequest { BeneficiaryName = "Test Ben" };

            var result = controller.AddBeneficiary(ben) as OkObjectResult;

            Assert.That(result, Is.Not.Null);
            var returned = result!.Value as BeneficiaryDto;
            Assert.That(returned!.BeneficiaryName, Is.EqualTo("Test Ben"));
        }

        [Test]
        public void GetMyBeneficiaries_ReturnsList()
        {
            var mockService = new Mock<IBeneficiaryService>();
            mockService.Setup(s => s.GetMyBeneficiaries(1)).Returns(new List<BeneficiaryDto> { new BeneficiaryDto(), new BeneficiaryDto() });

            var controller = CreateControllerWithUser(mockService.Object, 1);

            var result = controller.GetMyBeneficiaries() as OkObjectResult;

            Assert.That(result, Is.Not.Null);
            var list = result!.Value as IEnumerable<BeneficiaryDto>;
            Assert.That(list!.Count(), Is.EqualTo(2));
        }

        [Test]
        public void DeleteBeneficiary_Existing_ReturnsOk()
        {
            var mockService = new Mock<IBeneficiaryService>();
            mockService.Setup(s => s.DeleteBeneficiary(1)).Returns(true);

            var controller = CreateControllerWithUser(mockService.Object, 1);

            var result = controller.DeleteBeneficiary(1) as OkObjectResult;

            Assert.That(result, Is.Not.Null);
        }

        [Test]
        public void DeleteBeneficiary_NotExisting_ReturnsNotFound()
        {
            var mockService = new Mock<IBeneficiaryService>();
            mockService.Setup(s => s.DeleteBeneficiary(99)).Returns(false);

            var controller = CreateControllerWithUser(mockService.Object, 1);

            var result = controller.DeleteBeneficiary(99);

            Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        }
    }
}
