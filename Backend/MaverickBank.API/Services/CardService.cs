using MaverickBank.API.Data;
using MaverickBank.API.Models;
using MaverickBank.API.DTOs;
using AutoMapper;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MaverickBank.API.Services
{
    public class CardService : ICardService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<CardService> _logger;

        public CardService(ApplicationDbContext context, IMapper mapper, ILogger<CardService> _logger)
        {
            _context = context;
            _mapper = mapper;
            this._logger = _logger;
        }

        public IEnumerable<CardDto> GetMyCards(int userId)
        {
            try
            {
                var cards = _context.Cards.Where(c => c.UserId == userId).ToList();
                var dtos = _mapper.Map<IEnumerable<CardDto>>(cards).ToList();
                
                // Mask the card numbers in DTOs for security
                foreach (var dto in dtos)
                {
                    if (dto.CardNumber != null && dto.CardNumber.Length == 16)
                    {
                        dto.CardNumber = $"{dto.CardNumber.Substring(0, 4)} XXXX XXXX {dto.CardNumber.Substring(12, 4)}";
                    }
                }
                return dtos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching cards for UserId: {UserId}", userId);
                throw new Exception("An error occurred while retrieving your cards.", ex);
            }
        }

        public (bool Success, string Message, CardDto? Card) ApplyCard(ApplyCardRequest request, int userId)
        {
            try
            {
                // Validate account
                var account = _context.Accounts.FirstOrDefault(a => a.Id == request.AccountId);
                if (account == null) return (false, "Account not found", null);
                if (account.UserId != userId) return (false, "You do not own this account", null);
                if (account.Status != "Active" || account.IsClosed) return (false, "Account is not active or is closed", null);

                // Check card limit per account (e.g. max 2 active cards per account)
                var activeCardsCount = _context.Cards.Count(c => c.AccountId == request.AccountId && !c.IsBlocked);
                if (activeCardsCount >= 2) return (false, "This account already has the maximum of 2 active cards", null);

                // Validate PIN
                if (string.IsNullOrEmpty(request.Pin) || request.Pin.Length != 4 || !request.Pin.All(char.IsDigit))
                {
                    return (false, "PIN must be exactly 4 digits.", null);
                }

                // Validate Card Type
                if (request.CardType != "Visa Debit" && request.CardType != "Mastercard Platinum" && request.CardType != "Visa Gold")
                {
                    return (false, "Invalid card type selected.", null);
                }

                // Generate Unique Card Number (16 digits)
                string prefix = request.CardType == "Mastercard Platinum" ? "5412" : "4532";
                string cardNum;
                var rand = new Random();
                do
                {
                    string randomDigits = "";
                    for (int i = 0; i < 12; i++) randomDigits += rand.Next(0, 10).ToString();
                    cardNum = prefix + randomDigits;
                } while (_context.Cards.Any(c => c.CardNumber == cardNum));

                // Generate Expiry Date (5 years from now: MM/YY)
                var expiry = DateTime.Now.AddYears(5);
                string expiryStr = expiry.ToString("MM/yy");

                // Generate CVV (3 digits)
                string cvv = rand.Next(100, 999).ToString();

                var card = new Card
                {
                    AccountId = request.AccountId,
                    UserId = userId,
                    CardNumber = cardNum,
                    CardHolderName = account.FullName ?? "Valued Customer",
                    ExpiryDate = expiryStr,
                    CVV = cvv,
                    CardType = request.CardType,
                    IsBlocked = false,
                    DailyAtmLimit = request.CardType == "Mastercard Platinum" ? 100000.00m : 50000.00m,
                    DailyOnlineLimit = request.CardType == "Mastercard Platinum" ? 200000.00m : 100000.00m,
                    PinHash = BCrypt.Net.BCrypt.HashPassword(request.Pin),
                    CreatedAt = DateTime.Now
                };

                _context.Cards.Add(card);
                _context.SaveChanges();

                var dto = _mapper.Map<CardDto>(card);
                dto.CardNumber = $"{card.CardNumber.Substring(0, 4)} XXXX XXXX {card.CardNumber.Substring(12, 4)}";

                return (true, "Card applied successfully!", dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while applying card for UserId: {UserId}", userId);
                throw new Exception("An error occurred while creating your card.", ex);
            }
        }

        public (bool Success, string Message) ToggleBlock(int cardId, int userId, string userRole)
        {
            try
            {
                var card = _context.Cards.FirstOrDefault(c => c.Id == cardId);
                if (card == null) return (false, "Card not found");

                // Authorization check
                if (card.UserId != userId && userRole != "Admin" && userRole != "Employee")
                {
                    return (false, "Unauthorized operation");
                }

                card.IsBlocked = !card.IsBlocked;
                _context.SaveChanges();

                string stateMsg = card.IsBlocked ? "frozen" : "unfrozen";
                return (true, $"Card has been successfully {stateMsg}.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling block state for CardId: {CardId}", cardId);
                throw new Exception("An error occurred while modifying the card status.", ex);
            }
        }

        public (bool Success, string Message) UpdateLimits(int cardId, UpdateLimitsRequest request, int userId, string userRole)
        {
            try
            {
                var card = _context.Cards.FirstOrDefault(c => c.Id == cardId);
                if (card == null) return (false, "Card not found");

                // Authorization check
                if (card.UserId != userId && userRole != "Admin" && userRole != "Employee")
                {
                    return (false, "Unauthorized operation");
                }

                if (request.DailyAtmLimit <= 0 || request.DailyOnlineLimit <= 0)
                {
                    return (false, "Limits must be greater than zero.");
                }

                // Check limit caps
                decimal maxAtm = card.CardType == "Mastercard Platinum" ? 200000.00m : 100000.00m;
                decimal maxOnline = card.CardType == "Mastercard Platinum" ? 500000.00m : 250000.00m;

                if (request.DailyAtmLimit > maxAtm || request.DailyOnlineLimit > maxOnline)
                {
                    return (false, $"Daily ATM limit cannot exceed ₹{maxAtm} and Online limit cannot exceed ₹{maxOnline} for {card.CardType}.");
                }

                card.DailyAtmLimit = request.DailyAtmLimit;
                card.DailyOnlineLimit = request.DailyOnlineLimit;
                _context.SaveChanges();

                return (true, "Daily card transaction limits updated successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating limits for CardId: {CardId}", cardId);
                throw new Exception("An error occurred while updating daily transaction limits.", ex);
            }
        }

        public (bool Success, string Message) UpdatePin(int cardId, UpdatePinRequest request, int userId)
        {
            try
            {
                var card = _context.Cards.FirstOrDefault(c => c.Id == cardId);
                if (card == null) return (false, "Card not found");
                if (card.UserId != userId) return (false, "Unauthorized operation");

                if (string.IsNullOrEmpty(request.OldPin) || string.IsNullOrEmpty(request.NewPin))
                {
                    return (false, "Both old and new PIN values are required.");
                }

                if (request.NewPin.Length != 4 || !request.NewPin.All(char.IsDigit))
                {
                    return (false, "New PIN must be exactly 4 digits.");
                }

                // Verify old PIN
                if (!BCrypt.Net.BCrypt.Verify(request.OldPin, card.PinHash))
                {
                    return (false, "Current PIN is incorrect.");
                }

                card.PinHash = BCrypt.Net.BCrypt.HashPassword(request.NewPin);
                _context.SaveChanges();

                return (true, "Card PIN has been updated successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating PIN for CardId: {CardId}", cardId);
                throw new Exception("An error occurred while changing your card PIN.", ex);
            }
        }
    }
}
