namespace MaverickBank.API.DTOs
{
    public class RegisterRequest
    {
        public string? FullName { get; set; }

        public string? Email { get; set; }

        public string? Password { get; set; }

        public string? PhoneNumber { get; set; }

        public string? Address { get; set; }

        public string? Role { get; set; }

        public string? Gender { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public string? AadharNumber { get; set; }

        public string? PANNumber { get; set; }
    }
}
