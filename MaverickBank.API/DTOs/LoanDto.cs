using System;

namespace MaverickBank.API.DTOs
{
    public class LoanDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public decimal LoanAmount { get; set; }
        public decimal InterestRate { get; set; }
        public int TenureMonths { get; set; }
        public string? Purpose { get; set; }
        public string? LoanStatus { get; set; }
        public string? AccountNumber { get; set; }
        public decimal RemainingBalance { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
