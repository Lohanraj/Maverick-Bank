using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MaverickBank.API.DTOs;
using MaverickBank.API.Services;
using System.Security.Claims;
using System;

namespace MaverickBank.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CardsController : ControllerBase
    {
        private readonly ICardService _cardService;
        private readonly ILogger<CardsController> _logger;

        public CardsController(ICardService cardService, ILogger<CardsController> logger)
        {
            _cardService = cardService;
            _logger = logger;
        }

        // GET USER'S CARDS
        [HttpGet("mycards")]
        public IActionResult GetMyCards()
        {
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null) return Unauthorized("User not found in token");

            int userId = int.Parse(userIdClaim.Value);
            return Ok(_cardService.GetMyCards(userId));
        }

        // APPLY FOR A NEW CARD
        [HttpPost("apply")]
        public IActionResult ApplyCard(ApplyCardRequest request)
        {
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null) return Unauthorized("User not found in token");

            int userId = int.Parse(userIdClaim.Value);
            var result = _cardService.ApplyCard(request, userId);

            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            _logger.LogInformation("Card applied successfully for AccountId {AccountId} by UserId {UserId}", request.AccountId, userId);
            return Ok(result.Card);
        }

        // FREEZE/UNFREEZE CARD
        [HttpPut("toggleblock/{cardId}")]
        public IActionResult ToggleBlock(int cardId)
        {
            var userIdClaim = User.FindFirst("UserId");
            var roleClaim = User.FindFirst(ClaimTypes.Role);
            if (userIdClaim == null || roleClaim == null) return Unauthorized("Unauthorized access");

            int userId = int.Parse(userIdClaim.Value);
            string role = roleClaim.Value;

            var result = _cardService.ToggleBlock(cardId, userId, role);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            _logger.LogInformation("Card status toggled for CardId {CardId} by UserId {UserId}", cardId, userId);
            return Ok(new { Message = result.Message });
        }

        // UPDATE CARD DAILY LIMITS
        [HttpPut("limits/{cardId}")]
        public IActionResult UpdateLimits(int cardId, UpdateLimitsRequest request)
        {
            var userIdClaim = User.FindFirst("UserId");
            var roleClaim = User.FindFirst(ClaimTypes.Role);
            if (userIdClaim == null || roleClaim == null) return Unauthorized("Unauthorized access");

            int userId = int.Parse(userIdClaim.Value);
            string role = roleClaim.Value;

            var result = _cardService.UpdateLimits(cardId, request, userId, role);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            _logger.LogInformation("Card daily limits updated for CardId {CardId} by UserId {UserId}", cardId, userId);
            return Ok(new { Message = result.Message });
        }

        // UPDATE CARD PIN
        [HttpPut("pin/{cardId}")]
        public IActionResult UpdatePin(int cardId, UpdatePinRequest request)
        {
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null) return Unauthorized("User not found in token");

            int userId = int.Parse(userIdClaim.Value);
            var result = _cardService.UpdatePin(cardId, request, userId);

            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            _logger.LogInformation("Card PIN updated for CardId {CardId} by UserId {UserId}", cardId, userId);
            return Ok(new { Message = result.Message });
        }
    }
}
