using IGI.ProductionManager.Api.Models;

namespace IGI.ProductionManager.Api.Data;

public interface IProductionRepository
{
    Task<LoginResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken);
    Task<IReadOnlyList<JobCardDto>> GetDriveJobsAsync(CancellationToken cancellationToken);
    Task<JobBatchesDto?> GetJobBatchesAsync(int jbcNoId, int itemSpecId, CancellationToken cancellationToken);
}
