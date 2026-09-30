using IGI.ProductionManager.Api.Data;
using IGI.ProductionManager.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace IGI.ProductionManager.Api.Controllers;

[ApiController]
[Route("api/jobs")]
public sealed class JobsController : ControllerBase
{
    private readonly IProductionRepository _repository;

    public JobsController(IProductionRepository repository) => _repository = repository;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<JobCardDto>>> Get(CancellationToken cancellationToken)
    {
        var jobs = await _repository.GetDriveJobsAsync(cancellationToken);
        return Ok(jobs);
    }

    [HttpGet("{srno:int}/{itemSpecId:int}/batches")]
    public async Task<ActionResult<JobBatchesDto>> GetBatches(int srno, int itemSpecId, CancellationToken cancellationToken)
    {
        var batches = await _repository.GetJobBatchesAsync(srno, itemSpecId, cancellationToken);
        if (batches is null)
        {
            return NotFound(new ApiMessage("Job card was not found."));
        }

        return Ok(batches);
    }
}
