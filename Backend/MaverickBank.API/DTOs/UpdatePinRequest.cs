namespace MaverickBank.API.DTOs
{
    public class UpdatePinRequest
    {
        public string? OldPin { get; set; }
        public string? NewPin { get; set; }
    }
}
