using FluentValidation;
using MaverickBank.API.DTOs;

namespace MaverickBank.API.Validators
{
    public class TransferRequestValidator : AbstractValidator<TransferRequest>
    {
        public TransferRequestValidator()
        {
            RuleFor(x => x.FromAccountId)
                .GreaterThan(0).WithMessage("A valid source Account ID is required.");

            RuleFor(x => x.DestinationAccountNumber)
                .NotEmpty().WithMessage("Destination Account Number is required.");

            RuleFor(x => x.Amount)
                .GreaterThan(0).WithMessage("Transfer amount must be greater than zero.");
        }
    }
}
