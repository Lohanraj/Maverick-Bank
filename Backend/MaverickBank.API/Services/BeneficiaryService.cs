using MaverickBank.API.Data;
using MaverickBank.API.Models;
using MaverickBank.API.DTOs;
using AutoMapper;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MaverickBank.API.Services
{
    public class BeneficiaryService : IBeneficiaryService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<BeneficiaryService> _logger;

        public BeneficiaryService(ApplicationDbContext context, IMapper mapper, ILogger<BeneficiaryService> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public BeneficiaryDto AddBeneficiary(AddBeneficiaryRequest request, int userId)
        {
            try
            {
                var beneficiary = _mapper.Map<Beneficiary>(request);
                beneficiary.UserId = userId;
                beneficiary.CreatedAt = DateTime.Now;

                _context.Beneficiaries.Add(beneficiary);
                _context.SaveChanges();

                return _mapper.Map<BeneficiaryDto>(beneficiary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while adding beneficiary for UserId: {UserId}", userId);
                throw new Exception("An error occurred while adding the beneficiary. Please try again.", ex);
            }
        }

        public IEnumerable<BeneficiaryDto> GetMyBeneficiaries(int userId)
        {
            try
            {
                var beneficiaries = _context.Beneficiaries.Where(b => b.UserId == userId).ToList();
                return _mapper.Map<IEnumerable<BeneficiaryDto>>(beneficiaries);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching beneficiaries for UserId: {UserId}", userId);
                throw new Exception("An error occurred while retrieving your beneficiaries.", ex);
            }
        }

        public bool DeleteBeneficiary(int id)
        {
            try
            {
                var beneficiary = _context.Beneficiaries.Find(id);
                if (beneficiary == null)
                {
                    return false;
                }

                _context.Beneficiaries.Remove(beneficiary);
                _context.SaveChanges();

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while deleting beneficiary with Id: {BeneficiaryId}", id);
                throw new Exception("An error occurred while deleting the beneficiary.", ex);
            }
        }
    }
}
