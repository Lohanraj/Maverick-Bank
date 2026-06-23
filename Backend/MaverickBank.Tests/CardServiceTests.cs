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
using System.Collections.Generic;

namespace MaverickBank.Tests
{
    [TestFixture]
    public class CardServiceTests
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
        public void ApplyCard_SavesAndReturnsCardDto_Successful()
        {
            using var context = new ApplicationDbContext(_options);

            // Seed Account
            var account = new Account
            {
                Id = 1,
                UserId = 1,
                AccountNumber = "ACC1001",
                Status = "Active",
                FullName = "Test Customer",
                IsClosed = false
            };
            context.Accounts.Add(account);
            context.SaveChanges();

            var mapperMock = new Mock<IMapper>();
            mapperMock.Setup(m => m.Map<CardDto>(It.IsAny<Card>())).Returns((Card c) => new CardDto
            {
                Id = 1,
                AccountId = c.AccountId,
                UserId = c.UserId,
                CardNumber = c.CardNumber,
                CardHolderName = c.CardHolderName,
                ExpiryDate = c.ExpiryDate,
                CardType = c.CardType,
                IsBlocked = c.IsBlocked,
                DailyAtmLimit = c.DailyAtmLimit,
                DailyOnlineLimit = c.DailyOnlineLimit
            });

            var service = new CardService(context, mapperMock.Object, new Mock<ILogger<CardService>>().Object);

            var req = new ApplyCardRequest
            {
                AccountId = 1,
                CardType = "Visa Debit",
                Pin = "1234"
            };

            var (success, message, cardDto) = service.ApplyCard(req, 1);

            Assert.That(success, Is.True);
            Assert.That(cardDto, Is.Not.Null);
            Assert.That(cardDto.CardHolderName, Is.EqualTo("Test Customer"));
            Assert.That(context.Cards.Count(), Is.EqualTo(1));
        }

        [Test]
        public void ApplyCard_InactiveAccount_ReturnsFailure()
        {
            using var context = new ApplicationDbContext(_options);

            // Seed Account (Pending)
            var account = new Account
            {
                Id = 2,
                UserId = 1,
                AccountNumber = "ACC1002",
                Status = "Pending",
                FullName = "Test Customer",
                IsClosed = false
            };
            context.Accounts.Add(account);
            context.SaveChanges();

            var service = new CardService(context, new Mock<IMapper>().Object, new Mock<ILogger<CardService>>().Object);

            var req = new ApplyCardRequest
            {
                AccountId = 2,
                CardType = "Visa Debit",
                Pin = "1234"
            };

            var (success, message, cardDto) = service.ApplyCard(req, 1);

            Assert.That(success, Is.False);
            Assert.That(message, Contains.Substring("not active"));
        }

        [Test]
        public void ApplyCard_LimitExceeded_ReturnsFailure()
        {
            using var context = new ApplicationDbContext(_options);

            // Seed Account
            var account = new Account
            {
                Id = 1,
                UserId = 1,
                AccountNumber = "ACC1001",
                Status = "Active",
                FullName = "Test Customer",
                IsClosed = false
            };
            context.Accounts.Add(account);

            // Seed 2 active cards already
            context.Cards.Add(new Card { AccountId = 1, UserId = 1, CardNumber = "1", IsBlocked = false });
            context.Cards.Add(new Card { AccountId = 1, UserId = 1, CardNumber = "2", IsBlocked = false });
            context.SaveChanges();

            var service = new CardService(context, new Mock<IMapper>().Object, new Mock<ILogger<CardService>>().Object);

            var req = new ApplyCardRequest
            {
                AccountId = 1,
                CardType = "Visa Debit",
                Pin = "1234"
            };

            var (success, message, cardDto) = service.ApplyCard(req, 1);

            Assert.That(success, Is.False);
            Assert.That(message, Contains.Substring("maximum of 2 active cards"));
        }

        [Test]
        public void GetMyCards_ReturnsOnlyUserCards_AndMasksNumber()
        {
            using var context = new ApplicationDbContext(_options);

            context.Cards.Add(new Card { Id = 1, UserId = 1, CardNumber = "4532781290345678" });
            context.Cards.Add(new Card { Id = 2, UserId = 1, CardNumber = "4532781290345679" });
            context.Cards.Add(new Card { Id = 3, UserId = 2, CardNumber = "4532781290345670" });
            context.SaveChanges();

            var mapperMock = new Mock<IMapper>();
            mapperMock.Setup(m => m.Map<IEnumerable<CardDto>>(It.IsAny<IEnumerable<Card>>()))
                .Returns((IEnumerable<Card> source) => source.Select(c => new CardDto { Id = c.Id, UserId = c.UserId, CardNumber = c.CardNumber }));

            var service = new CardService(context, mapperMock.Object, new Mock<ILogger<CardService>>().Object);

            var result = service.GetMyCards(1).ToList();

            Assert.That(result.Count, Is.EqualTo(2));
            Assert.That(result[0].CardNumber, Is.EqualTo("4532 XXXX XXXX 5678"));
        }

        [Test]
        public void ToggleBlock_TogglesCorrectly()
        {
            using var context = new ApplicationDbContext(_options);

            var card = new Card { Id = 1, UserId = 1, IsBlocked = false };
            context.Cards.Add(card);
            context.SaveChanges();

            var service = new CardService(context, new Mock<IMapper>().Object, new Mock<ILogger<CardService>>().Object);

            var (success, message) = service.ToggleBlock(1, 1, "Customer");

            Assert.That(success, Is.True);
            Assert.That(card.IsBlocked, Is.True);
        }

        [Test]
        public void UpdateLimits_Successful()
        {
            using var context = new ApplicationDbContext(_options);

            var card = new Card { Id = 1, UserId = 1, CardType = "Visa Debit", DailyAtmLimit = 1000, DailyOnlineLimit = 2000 };
            context.Cards.Add(card);
            context.SaveChanges();

            var service = new CardService(context, new Mock<IMapper>().Object, new Mock<ILogger<CardService>>().Object);

            var req = new UpdateLimitsRequest { DailyAtmLimit = 20000, DailyOnlineLimit = 40000 };
            var (success, message) = service.UpdateLimits(1, req, 1, "Customer");

            Assert.That(success, Is.True);
            Assert.That(card.DailyAtmLimit, Is.EqualTo(20000));
            Assert.That(card.DailyOnlineLimit, Is.EqualTo(40000));
        }

        [Test]
        public void UpdateLimits_ExceedsCap_ReturnsFailure()
        {
            using var context = new ApplicationDbContext(_options);

            var card = new Card { Id = 1, UserId = 1, CardType = "Visa Debit" };
            context.Cards.Add(card);
            context.SaveChanges();

            var service = new CardService(context, new Mock<IMapper>().Object, new Mock<ILogger<CardService>>().Object);

            // Visa Debit limit caps: 100,000 ATM, 250,000 Online
            var req = new UpdateLimitsRequest { DailyAtmLimit = 150000, DailyOnlineLimit = 50000 };
            var (success, message) = service.UpdateLimits(1, req, 1, "Customer");

            Assert.That(success, Is.False);
            Assert.That(message, Contains.Substring("Daily ATM limit cannot exceed"));
        }

        [Test]
        public void UpdatePin_WrongOldPin_ReturnsFailure()
        {
            using var context = new ApplicationDbContext(_options);

            var card = new Card { Id = 1, UserId = 1, PinHash = BCrypt.Net.BCrypt.HashPassword("1234") };
            context.Cards.Add(card);
            context.SaveChanges();

            var service = new CardService(context, new Mock<IMapper>().Object, new Mock<ILogger<CardService>>().Object);

            var req = new UpdatePinRequest { OldPin = "0000", NewPin = "4321" };
            var (success, message) = service.UpdatePin(1, req, 1);

            Assert.That(success, Is.False);
            Assert.That(message, Contains.Substring("PIN is incorrect"));
        }

        [Test]
        public void UpdatePin_Successful()
        {
            using var context = new ApplicationDbContext(_options);

            var card = new Card { Id = 1, UserId = 1, PinHash = BCrypt.Net.BCrypt.HashPassword("1234") };
            context.Cards.Add(card);
            context.SaveChanges();

            var service = new CardService(context, new Mock<IMapper>().Object, new Mock<ILogger<CardService>>().Object);

            var req = new UpdatePinRequest { OldPin = "1234", NewPin = "4321" };
            var (success, message) = service.UpdatePin(1, req, 1);

            Assert.That(success, Is.True);
            Assert.That(BCrypt.Net.BCrypt.Verify("4321", card.PinHash), Is.True);
        }
    }
}
