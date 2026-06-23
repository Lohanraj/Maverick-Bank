namespace MaverickBank.API.DTOs
{
    public class TransferRequest
    {
        public int FromAccountId { get; set; }

        public string? DestinationAccountNumber { get; set; }

        public decimal Amount { get; set; }
    }
}
