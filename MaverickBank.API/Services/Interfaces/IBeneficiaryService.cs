using MaverickBank.API.DTOs;
using System.Collections.Generic;

namespace MaverickBank.API.Services
{
    public interface IBeneficiaryService
    {
        BeneficiaryDto AddBeneficiary(AddBeneficiaryRequest request, int userId);
        IEnumerable<BeneficiaryDto> GetMyBeneficiaries(int userId);
        bool DeleteBeneficiary(int id);
    }
}


