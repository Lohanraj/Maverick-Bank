namespace MaverickBank.API.DTOs
{
    /// <summary>
    /// Request DTO for updating an existing user (admin use).
    /// Never exposes PasswordHash or IsActive (use the dedicated toggle endpoint for activation).
    /// </summary>
    public class UpdateUserRequest
    {
        public string? FullName { get; set; }

        public string? Email { get; set; }

        public string? PhoneNumber { get; set; }

        public string? Address { get; set; }

        public string? Role { get; set; }

        public string? Gender { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public string? AadharNumber { get; set; }

        public string? PANNumber { get; set; }
    }
}
