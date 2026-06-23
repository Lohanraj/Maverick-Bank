namespace MaverickBank.API.DTOs
{
    public class UpdateLimitsRequest
    {
        public decimal DailyAtmLimit { get; set; }
        public decimal DailyOnlineLimit { get; set; }
    }
}
