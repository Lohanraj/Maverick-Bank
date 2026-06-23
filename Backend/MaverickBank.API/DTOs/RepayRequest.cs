namespace MaverickBank.API.DTOs
{
    public class RepayRequest
    {
        public decimal Amount { get; set; }
        public string? SourceAccountNumber { get; set; }
    }
}

