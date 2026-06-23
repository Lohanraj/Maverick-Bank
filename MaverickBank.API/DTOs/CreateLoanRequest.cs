namespace MaverickBank.API.DTOs
{
    /// <summary>
    /// Request DTO for applying for a loan.
    /// Contains only customer-supplied fields; server-assigned fields
    /// (Id, UserId, LoanStatus, RemainingBalance, CreatedAt) are set by the service layer.
    /// </summary>
    public class CreateLoanRequest
    {
        public decimal LoanAmount { get; set; }

        public int TenureMonths { get; set; }

        public string? Purpose { get; set; }

        /// <summary>
        /// Account number of the active account to which the approved loan amount will be disbursed.
        /// </summary>
        public string? AccountNumber { get; set; }
    }
}
