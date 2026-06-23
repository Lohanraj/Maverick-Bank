namespace MaverickBank.API.DTOs
{
    public class DepositRequest
    {
        public int AccountId { get; set; }

        public decimal Amount { get; set; }
    }
}
