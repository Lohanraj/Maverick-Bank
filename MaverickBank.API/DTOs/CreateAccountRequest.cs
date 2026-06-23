namespace MaverickBank.API.DTOs
{
    /// <summary>
    /// Request DTO for opening a new bank account.
    /// Contains only the fields the customer supplies; server-assigned fields
    /// (AccountNumber, Balance, Status, IsClosed, IsCloseRequested, CreatedAt)
    /// are set by the service layer.
    /// </summary>
    public class CreateAccountRequest
    {
        public string? AccountType { get; set; }

        public string? FullName { get; set; }

        public string? Address { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public string? AadharNumber { get; set; }

        public string? PANNumber { get; set; }
    }
}
