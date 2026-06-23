using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MaverickBank.API.Models;
using MaverickBank.API.DTOs;
using MaverickBank.API.Services;
using System.Security.Claims;

namespace MaverickBank.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BeneficiariesController : ControllerBase
    {
        private readonly IBeneficiaryService _beneficiaryService;
        private readonly ILogger<BeneficiariesController> _logger;

        public BeneficiariesController(IBeneficiaryService beneficiaryService, ILogger<BeneficiariesController> logger)
        {
            _beneficiaryService = beneficiaryService;
            _logger = logger;
        }

        // ADD BENEFICIARY
        [HttpPost("add")]
        public IActionResult AddBeneficiary(AddBeneficiaryRequest request)
        {
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null) return Unauthorized();

            int userId = int.Parse(userIdClaim.Value);
            var createdBeneficiary = _beneficiaryService.AddBeneficiary(request, userId);

            _logger.LogInformation("Beneficiary {Name} added by UserId {UserId}", createdBeneficiary.BeneficiaryName, userId);

            return Ok(createdBeneficiary);
        }

        // GET MY BENEFICIARIES
        [HttpGet("mybeneficiaries")]
        public IActionResult GetMyBeneficiaries()
        {
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null) return Unauthorized();

            int userId = int.Parse(userIdClaim.Value);
            var beneficiaries = _beneficiaryService.GetMyBeneficiaries(userId);

            return Ok(beneficiaries);
        }

        // DELETE BENEFICIARY
        [HttpDelete("delete/{id}")]
        public IActionResult DeleteBeneficiary(int id)
        {
            bool success = _beneficiaryService.DeleteBeneficiary(id);
            if (!success)
            {
                return NotFound("Beneficiary not found");
            }

            _logger.LogInformation("Beneficiary {BeneficiaryId} deleted", id);

            return Ok("Beneficiary deleted successfully");
        }
    }
}



