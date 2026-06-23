using FluentValidation;
using MaverickBank.API.DTOs;

namespace MaverickBank.API.Validators
{
    public class CreateLoanRequestValidator : AbstractValidator<CreateLoanRequest>
    {
        public CreateLoanRequestValidator()
        {
            RuleFor(x => x.LoanAmount)
                .GreaterThan(0).WithMessage("Loan Amount must be greater than zero.");

            RuleFor(x => x.TenureMonths)
                .GreaterThan(0).WithMessage("Tenure must be at least 1 month.")
                .LessThanOrEqualTo(360).WithMessage("Tenure cannot exceed 360 months (30 years).");

            RuleFor(x => x.Purpose)
                .NotEmpty().WithMessage("Loan Purpose is required.")
                .MaximumLength(250).WithMessage("Loan Purpose must not exceed 250 characters.");

            RuleFor(x => x.AccountNumber)
                .NotEmpty().WithMessage("Disbursement Account Number is required.");
        }
    }
}
