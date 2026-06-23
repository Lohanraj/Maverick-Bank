using FluentValidation;
using MaverickBank.API.DTOs;

namespace MaverickBank.API.Validators
{
    public class CreateAccountRequestValidator : AbstractValidator<CreateAccountRequest>
    {
        public CreateAccountRequestValidator()
        {
            RuleFor(x => x.AccountType)
                .NotEmpty().WithMessage("Account Type is required.")
                .Must(t => t == "Savings" || t == "Current" || t == "Checking" || t == "Business")
                .WithMessage("Account Type must be 'Savings', 'Current', 'Checking', or 'Business'.");

            RuleFor(x => x.FullName)
                .NotEmpty().WithMessage("Full Name is required.")
                .Length(3, 100).WithMessage("Full Name must be between 3 and 100 characters.");

            RuleFor(x => x.Address)
                .NotEmpty().WithMessage("Address is required.");

            RuleFor(x => x.DateOfBirth)
                .NotNull().WithMessage("Date of Birth is required.")
                .Must(dob => dob.HasValue && dob.Value < DateTime.Today)
                    .WithMessage("Date of Birth must be in the past.")
                .Must(dob =>
                {
                    if (!dob.HasValue) return false;
                    var today = DateTime.Today;
                    var age = today.Year - dob.Value.Year;
                    if (dob.Value.Date > today.AddYears(-age)) age--;
                    return age >= 18;
                }).WithMessage("Applicant must be at least 18 years old.");

            RuleFor(x => x.AadharNumber)
                .NotEmpty().WithMessage("Aadhar Number is required.")
                .Matches(@"^\d{12}$").WithMessage("Aadhar Number must be exactly 12 digits.");

            RuleFor(x => x.PANNumber)
                .NotEmpty().WithMessage("PAN Number is required.")
                .Matches(@"^[A-Z]{5}[0-9]{4}[A-Z]{1}$").WithMessage("PAN Number format is invalid (e.g. ABCDE1234F).");
        }
    }
}
