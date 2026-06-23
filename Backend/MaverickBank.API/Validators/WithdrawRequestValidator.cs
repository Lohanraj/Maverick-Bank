using FluentValidation;
using MaverickBank.API.DTOs;

namespace MaverickBank.API.Validators
{
    public class WithdrawRequestValidator : AbstractValidator<WithdrawRequest>
    {
        public WithdrawRequestValidator()
        {
            RuleFor(x => x.AccountId)
                .GreaterThan(0).WithMessage("A valid Account ID is required.");

            RuleFor(x => x.Amount)
                .GreaterThan(0).WithMessage("Withdrawal amount must be greater than zero.");
        }
    }
}
