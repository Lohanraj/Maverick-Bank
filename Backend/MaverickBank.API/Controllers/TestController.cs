using Microsoft.AspNetCore.Mvc;
namespace MaverickBank.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok("Maverick Bank Backend Running Successfully");
        }
    }
}


