using System;

namespace MaverickBank.API.Models
{
    public class Card
    {
        public int Id { get; set; }

        public int AccountId { get; set; }

        public int UserId { get; set; }

        public string? CardNumber { get; set; }

        public string? CardHolderName { get; set; }

        public string? ExpiryDate { get; set; }

        public string? CVV { get; set; }

        public string? CardType { get; set; } // "Visa Debit", "Mastercard Platinum", etc.

        public bool IsBlocked { get; set; }

        public decimal DailyAtmLimit { get; set; }

        public decimal DailyOnlineLimit { get; set; }

        public string? PinHash { get; set; } // Hashed 4-digit PIN

        public DateTime CreatedAt { get; set; }
    }
}
