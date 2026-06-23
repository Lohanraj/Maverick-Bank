using FluentValidation;
using MaverickBank.API.DTOs;
using System.Linq;

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
                .When(x => string.IsNullOrEmpty(x.Role) || x.Role.Equals("Customer", System.StringComparison.OrdinalIgnoreCase));

            RuleFor(x => x.Address)
                .NotEmpty().WithMessage("Address is required.")
                .When(x => string.IsNullOrEmpty(x.Role) || x.Role.Equals("Customer", System.StringComparison.OrdinalIgnoreCase));

            RuleFor(x => x.Role)
                .Must(r => string.IsNullOrEmpty(r) || AllowedRoles.Contains(r))
                .WithMessage($"Role must be one of: {string.Join(", ", AllowedRoles)}.");

            RuleFor(x => x.AadharNumber)
                .NotEmpty().WithMessage("Aadhar Number is required.")
                .When(x => string.IsNullOrEmpty(x.Role) || x.Role.Equals("Customer", System.StringComparison.OrdinalIgnoreCase));

            RuleFor(x => x.PANNumber)
                .NotEmpty().WithMessage("PAN Number is required.")
                .When(x => string.IsNullOrEmpty(x.Role) || x.Role.Equals("Customer", System.StringComparison.OrdinalIgnoreCase));
        }
    }
}
