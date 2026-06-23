using AutoMapper;
using MaverickBank.API.Models;
using MaverickBank.API.DTOs;

namespace MaverickBank.API
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Response DTOs (bidirectional for update scenarios)
            CreateMap<User, UserDto>().ReverseMap();
            CreateMap<Account, AccountDto>().ReverseMap();
            CreateMap<Transaction, TransactionDto>().ReverseMap();
            CreateMap<Beneficiary, BeneficiaryDto>().ReverseMap();
            CreateMap<Loan, LoanDto>().ReverseMap();
            CreateMap<Card, CardDto>().ReverseMap();

            // Request DTOs → Domain Entities (one-way: client input → entity)
            CreateMap<CreateAccountRequest, Account>();
            CreateMap<CreateLoanRequest, Loan>();
            CreateMap<AddBeneficiaryRequest, Beneficiary>();
            CreateMap<UpdateUserRequest, User>();
            CreateMap<ApplyCardRequest, Card>();
        }
    }
}
