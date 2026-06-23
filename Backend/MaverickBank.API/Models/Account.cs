namespace MaverickBank.API.Models
{
    public class Account
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public string? AccountNumber { get; set; }

        public string? AccountType { get; set; }

        public decimal Balance { get; set; }

        public bool IsCloseRequested { get; set; }

        public bool IsClosed { get; set; }

        public string Status { get; set; } = "Pending"; // "Pending", "Active", "Rejected"

        public string? FullName { get; set; }

        public string? Address { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public string? AadharNumber { get; set; }

        public string? PANNumber { get; set; }

        public int Age { get; set; }

        public string? BranchName { get; set; }

        public string? IFSCCode { get; set; }

        public string? BranchAddress { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}