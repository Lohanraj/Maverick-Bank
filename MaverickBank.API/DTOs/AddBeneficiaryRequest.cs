namespace MaverickBank.API.DTOs
{
    /// <summary>
    /// Request DTO for adding a new beneficiary.
    /// Contains only the fields the customer supplies; server-assigned fields
    /// (Id, UserId, CreatedAt) are set by the service layer.
    /// </summary>
    public class AddBeneficiaryRequest
    {
        public string? BeneficiaryName { get; set; }

        public string? AccountNumber { get; set; }

        public string? BankName { get; set; }

        public string? BranchName { get; set; }

        public string? IFSCCode { get; set; }
    }
}
