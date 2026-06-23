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
    public class BeneficiaryServiceTests
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
        public void AddBeneficiary_SavesBeneficiaryAndReturnsIt()
        {
            using var context = new ApplicationDbContext(_options);
            var mapperMock = new Mock<IMapper>();
            mapperMock.Setup(m => m.Map<Beneficiary>(It.IsAny<AddBeneficiaryRequest>())).Returns(new Beneficiary { BeneficiaryName = "John Doe", AccountNumber = "ACC123" });
            mapperMock.Setup(m => m.Map<BeneficiaryDto>(It.IsAny<Beneficiary>())).Returns((Beneficiary b) => new BeneficiaryDto { BeneficiaryName = b.BeneficiaryName, UserId = b.UserId });
            var service = new BeneficiaryService(context, mapperMock.Object, new Mock<ILogger<BeneficiaryService>>().Object);

            var beneficiary = new AddBeneficiaryRequest { BeneficiaryName = "John Doe", AccountNumber = "ACC123" };
            int userId = 1;

            var result = service.AddBeneficiary(beneficiary, userId);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.UserId, Is.EqualTo(userId));
            Assert.That(context.Beneficiaries.Count(), Is.EqualTo(1));
        }

        [Test]
        public void GetMyBeneficiaries_ReturnsOnlyUserBeneficiaries()
        {
            using var context = new ApplicationDbContext(_options);
            var mapperMock = new Mock<IMapper>();
            mapperMock.Setup(m => m.Map<IEnumerable<BeneficiaryDto>>(It.IsAny<IEnumerable<Beneficiary>>())).Returns(new[] { new BeneficiaryDto { UserId = 1 }, new BeneficiaryDto { UserId = 1 } });
            var service = new BeneficiaryService(context, mapperMock.Object, new Mock<ILogger<BeneficiaryService>>().Object);

            context.Beneficiaries.Add(new Beneficiary { BeneficiaryName = "Ben 1", UserId = 1 });
            context.Beneficiaries.Add(new Beneficiary { BeneficiaryName = "Ben 2", UserId = 1 });
            context.Beneficiaries.Add(new Beneficiary { BeneficiaryName = "Ben 3", UserId = 2 });
            context.SaveChanges();

            var result = service.GetMyBeneficiaries(1);

            Assert.That(result.Count(), Is.EqualTo(2));
            Assert.That(result.All(b => b.UserId == 1), Is.True);
        }

        [Test]
        public void DeleteBeneficiary_ExistingId_ReturnsTrueAndDeletes()
        {
            using var context = new ApplicationDbContext(_options);
            var service = new BeneficiaryService(context, new Mock<IMapper>().Object, new Mock<ILogger<BeneficiaryService>>().Object);

            var beneficiary = new Beneficiary { BeneficiaryName = "Delete Me", UserId = 1 };
            context.Beneficiaries.Add(beneficiary);
            context.SaveChanges();

            var result = service.DeleteBeneficiary(beneficiary.Id);

            Assert.That(result, Is.True);
            Assert.That(context.Beneficiaries.Count(), Is.EqualTo(0));
        }

        [Test]
        public void DeleteBeneficiary_NonExistingId_ReturnsFalse()
        {
            using var context = new ApplicationDbContext(_options);
            var service = new BeneficiaryService(context, new Mock<IMapper>().Object, new Mock<ILogger<BeneficiaryService>>().Object);

            var result = service.DeleteBeneficiary(99);

            Assert.That(result, Is.False);
        }
    }
}
