namespace MaverickBank.API.Models
{
    public class Beneficiary
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public string? BeneficiaryName { get; set; }

        public string? AccountNumber { get; set; }

        public string? BankName { get; set; }

        public string? BranchName { get; set; }

        public string? IFSCCode { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}