using FluentValidation;
using MaverickBank.API.DTOs;

namespace MaverickBank.API.Validators
{
    public class AddBeneficiaryRequestValidator : AbstractValidator<AddBeneficiaryRequest>
    {
        public AddBeneficiaryRequestValidator()
        {
            RuleFor(x => x.BeneficiaryName)
                .NotEmpty().WithMessage("Beneficiary Name is required.")
                .MaximumLength(100).WithMessage("Beneficiary Name must not exceed 100 characters.");

            RuleFor(x => x.AccountNumber)
                .NotEmpty().WithMessage("Account Number is required.");

            RuleFor(x => x.BankName)
                .NotEmpty().WithMessage("Bank Name is required.")
                .MaximumLength(100).WithMessage("Bank Name must not exceed 100 characters.");

            RuleFor(x => x.BranchName)
                .NotEmpty().WithMessage("Branch Name is required.")
                .MaximumLength(100).WithMessage("Branch Name must not exceed 100 characters.");

            RuleFor(x => x.IFSCCode)
                .NotEmpty().WithMessage("IFSC Code is required.")
                .Matches(@"^[A-Z]{4}0[A-Z0-9]{6}$").WithMessage("IFSC Code format is invalid (e.g. SBIN0001234).");
        }
    }
}
