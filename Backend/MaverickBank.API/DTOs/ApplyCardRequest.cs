namespace MaverickBank.API.DTOs
{
    public class ApplyCardRequest
    {
        public int AccountId { get; set; }
        public string? CardType { get; set; }
        public string? Pin { get; set; }
    }
}
