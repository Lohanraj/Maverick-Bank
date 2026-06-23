using System;

namespace MaverickBank.API.DTOs
{
    public class CardDto
    {
        public int Id { get; set; }
        public int AccountId { get; set; }
        public int UserId { get; set; }
        public string? CardNumber { get; set; }
        public string? CardHolderName { get; set; }
        public string? ExpiryDate { get; set; }
        public string? CardType { get; set; }
        public bool IsBlocked { get; set; }
        public decimal DailyAtmLimit { get; set; }
        public decimal DailyOnlineLimit { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
