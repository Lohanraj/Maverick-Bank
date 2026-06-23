using FluentValidation;
using MaverickBank.API.DTOs;

namespace MaverickBank.API.Validators
{
    public class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
    {
        private static readonly string[] AllowedRoles = { "Customer", "Employee", "Admin" };

        public UpdateUserRequestValidator()
        {
            RuleFor(x => x.FullName)
                .NotEmpty().WithMessage("Full Name is required.")
                .Length(3, 100).WithMessage("Full Name must be between 3 and 100 characters.");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required.")
                .EmailAddress().WithMessage("A valid email address is required.");

            RuleFor(x => x.PhoneNumber)
                .NotEmpty().WithMessage("Phone Number is required.")
                .Matches(@"^\d{10}$").WithMessage("Phone Number must be exactly 10 digits.");

            RuleFor(x => x.Address)
                .NotEmpty().WithMessage("Address is required.");

            RuleFor(x => x.Role)
                .Must(r => string.IsNullOrEmpty(r) || AllowedRoles.Contains(r))
                .WithMessage($"Role must be one of: {string.Join(", ", AllowedRoles)}.");

            RuleFor(x => x.AadharNumber)
                .NotEmpty().WithMessage("Aadhar Number is required.")
                .Matches(@"^\d{12}$").WithMessage("Aadhar Number must be exactly 12 digits.");

            RuleFor(x => x.PANNumber)
                .NotEmpty().WithMessage("PAN Number is required.")
                .Matches(@"^[A-Z]{5}[0-9]{4}[A-Z]{1}$").WithMessage("PAN Number format is invalid (e.g. ABCDE1234F).");
        }
    }
}
