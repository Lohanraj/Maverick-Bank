using FluentValidation;
using MaverickBank.API.DTOs;

namespace MaverickBank.API.Validators
{
    public class RepayRequestValidator : AbstractValidator<RepayRequest>
    {
        public RepayRequestValidator()
        {
            RuleFor(x => x.Amount)
                .GreaterThan(0).WithMessage("Repayment amount must be greater than zero.");

            RuleFor(x => x.SourceAccountNumber)
                .NotEmpty().WithMessage("Source Account Number is required.");
        }
    }
}
