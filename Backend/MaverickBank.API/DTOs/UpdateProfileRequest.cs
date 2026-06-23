namespace MaverickBank.API.DTOs
{
    /// <summary>
    /// Request DTO for a user updating their own profile.
    /// Cannot change Role — that is admin-only.
    /// </summary>
    public class UpdateProfileRequest
    {
        public string? FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public string? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
    }
}
