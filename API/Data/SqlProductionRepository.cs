using System.Data;
using System.Globalization;
using Dapper;
using IGI.ProductionManager.Api.Models;

namespace IGI.ProductionManager.Api.Data;

public sealed class SqlProductionRepository : IProductionRepository
{
    private readonly ISqlConnectionFactory _connections;
    private readonly IConfiguration _configuration;

    public SqlProductionRepository(ISqlConnectionFactory connections, IConfiguration configuration)
    {
        _connections = connections;
        _configuration = configuration;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        await using var connection = _connections.Create();
        var row = await connection.QueryFirstOrDefaultAsync<LoginRow>(new CommandDefinition(
            Procedure("Login"),
            new { loginID = request.UserId.Trim(), Pwd = request.Password },
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken));

        if (row is null)
        {
            return null;
        }

        return new LoginResponse
        {
            StatusCode = row.StatusCode,
            StatusMessage = row.StatusMessage,
            UserId = request.UserId.Trim(),
            UserName = row.UserName ?? "",
            LabourId = row.LabourID ?? ""
        };
    }

    public async Task<IReadOnlyList<JobCardDto>> GetDriveJobsAsync(CancellationToken cancellationToken)
    {
        await using var connection = _connections.Create();
        var rows = (await connection.QueryAsync<JobRow>(new CommandDefinition(
            Procedure("GetDriveJobs"),
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken))).ToList();

        var jobs = new List<JobCardDto>(rows.Count);
        foreach (var row in rows)
        {
            var card = ToJob(row);
            var parameters = new { JBCNoID = row.Srno, ItemSpecID = row.ItemSpecID };
            var waiting = await connection.QueryAsync<BatchRow>(new CommandDefinition(
                Procedure("GetWaiting"),
                parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken));
            var under = await connection.QueryAsync<BatchRow>(new CommandDefinition(
                Procedure("GetUnderProcess"),
                parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken));
            card.WaitingCount = waiting.Count();
            card.UnderProcessCount = under.Count();
            jobs.Add(card);
        }

        return jobs;
    }

    public async Task<JobBatchesDto?> GetJobBatchesAsync(int jbcNoId, int itemSpecId, CancellationToken cancellationToken)
    {
        await using var connection = _connections.Create();
        var jobs = (await connection.QueryAsync<JobRow>(new CommandDefinition(
            Procedure("GetDriveJobs"),
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken))).ToList();

        var job = jobs.FirstOrDefault(row => row.Srno == jbcNoId && row.ItemSpecID == itemSpecId);
        if (job is null)
        {
            return null;
        }

        var parameters = new { JBCNoID = jbcNoId, ItemSpecID = itemSpecId };
        var under = (await connection.QueryAsync<BatchRow>(new CommandDefinition(
            Procedure("GetUnderProcess"),
            parameters,
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken))).Select(row => ToBatch(row, row.CurrentStageNo)).ToList();
        var waiting = (await connection.QueryAsync<BatchRow>(new CommandDefinition(
            Procedure("GetWaiting"),
            parameters,
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken))).Select(row => ToBatch(row, row.CurrentStageNo)).ToList();

        var card = ToJob(job);
        return new JobBatchesDto
        {
            Srno = card.Srno,
            ItemSpecId = card.ItemSpecId,
            JobNo = card.JobNo,
            Date = card.Date,
            Item = card.Item,
            JobQuantity = card.Quantity,
            UnderProcessCount = under.Count,
            WaitingCount = waiting.Count,
            UnderProcess = under,
            Waiting = waiting
        };
    }

    public async Task<LabourDetailsDto> GetLabourDetailsAsync(DateTime attendanceDate, CancellationToken cancellationToken)
    {
        await using var connection = _connections.CreateIgi();
        var parameters = new { Attdate = attendanceDate.Date };
        var presentRows = (await connection.QueryAsync<LabourRow>(new CommandDefinition(
            Procedure("GetLabourHeadCount"),
            parameters,
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken))).ToList();
        var unassignedRows = (await connection.QueryAsync<LabourRow>(new CommandDefinition(
            Procedure("GetLabourUnassigned"),
            parameters,
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken))).ToList();

        var portalUsers = await LoadPortalUsersAsync(connection, attendanceDate.Date, cancellationToken);
        var present = ToPeople(presentRows, portalUsers);
        var unassigned = ToPeople(unassignedRows, portalUsers);
        var groups = presentRows
            .Select(row => new { Row = row, Label = MachineLabel(row) })
            .Where(item => item.Label.Length > 0)
            .GroupBy(item => item.Label, StringComparer.OrdinalIgnoreCase)
            .Select(grouping =>
            {
                var members = grouping.Select(item => item.Row).ToList();
                var labour = ToPeople(members, portalUsers);
                return new LabourGroupDto
                {
                    Name = grouping.Key,
                    Assigned = labour.Count,
                    Required = RequiredCount(members),
                    Labour = labour
                };
            })
            .ToList();

        return new LabourDetailsDto
        {
            Date = attendanceDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            PresentCount = present.Count,
            UnassignedCount = unassigned.Count,
            Present = present,
            Unassigned = unassigned,
            Groups = groups
        };
    }

    private async Task<IReadOnlyList<T>> QueryAsync<T>(string procedure, object? parameters, CancellationToken cancellationToken)
    {
        await using var connection = _connections.Create();
        var rows = await connection.QueryAsync<T>(new CommandDefinition(
            procedure,
            parameters,
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken));
        return rows.ToList();
    }

    private string Procedure(string key)
    {
        var name = _configuration[$"StoredProcedures:{key}"];
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new InvalidOperationException($"Stored procedure '{key}' is not configured.");
        }

        return name;
    }

    private static JobCardDto ToJob(JobRow row) => new()
    {
        Srno = row.Srno,
        ItemSpecId = row.ItemSpecID,
        JobNo = row.JBCNo ?? "",
        Date = FormatJobDate(row.JBCDate),
        Item = row.ItemSpecName ?? "",
        Quantity = row.ITEMTOTALQTY
    };

    private static BatchDto ToBatch(BatchRow row, int stageNo) => new()
    {
        BatchNo = row.JobNo ?? "",
        Item = row.ItemSpecName ?? "",
        Quantity = row.Quantity,
        Stage = $"S{stageNo}"
    };

    private async Task<Dictionary<string, string>> LoadPortalUsersAsync(
        IDbConnection connection,
        DateTime attendanceDate,
        CancellationToken cancellationToken)
    {
        var rows = await connection.QueryAsync<PortalUserRow>(new CommandDefinition(
            """
            SELECT EmployeeID, portalusername AS PortalUserName
            FROM WEB.tvfLABGetLabourCurrentStatus('', 0)
            WHERE CONVERT(date, ActivityTime) = @Attdate
            """,
            new { Attdate = attendanceDate },
            cancellationToken: cancellationToken));

        return rows
            .Select(row => (Id: AsText(row.EmployeeID), Name: (row.PortalUserName ?? "").Trim()))
            .Where(row => row.Id.Length > 0 && row.Name.Length > 0)
            .GroupBy(row => row.Id, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.First().Name, StringComparer.OrdinalIgnoreCase);
    }

    private static List<LabourPersonDto> ToPeople(IEnumerable<LabourRow> rows, IReadOnlyDictionary<string, string> portalUsers)
    {
        return rows
            .GroupBy(PersonKey, StringComparer.OrdinalIgnoreCase)
            .Select(group =>
            {
                var name = group.Select(row => (row.Employeename ?? "").Trim()).FirstOrDefault(value => value.Length > 0) ?? "";
                var ssl = group.Select(row => AsText(row.SslNo)).FirstOrDefault(value => value.Length > 0) ?? "";
                var status = group.Select(row => (row.Currentstatus ?? "").Trim()).FirstOrDefault(value => value.Length > 0) ?? "";
                var machine = ChooseMachine(group, portalUsers);
                return new LabourPersonDto
                {
                    EmployeeId = group.Key.StartsWith("id:", StringComparison.Ordinal) ? group.Key[3..] : "",
                    Name = name.Length > 0 ? name : group.Key,
                    Ssl = ssl,
                    Group = machine?.Label ?? "",
                    PortalUser = machine?.PortalUser ?? "",
                    Unassigned = machine?.Unassigned ?? true,
                    Status = status
                };
            })
            .OrderBy(person => person.Name, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private readonly record struct MachineAssignment(string Label, bool Unassigned, string PortalUser);

    private static MachineAssignment? ChooseMachine(IEnumerable<LabourRow> rows, IReadOnlyDictionary<string, string> portalUsers)
    {
        MachineAssignment? fallback = null;
        foreach (var row in rows)
        {
            var next = AssignedMachine(row, portalUsers);
            if (!next.Unassigned)
            {
                return next;
            }

            fallback ??= next;
        }

        return fallback;
    }

    private static MachineAssignment AssignedMachine(LabourRow row, IReadOnlyDictionary<string, string> portalUsers)
    {
        var employeeId = AsText(row.Employeeid);
        var portalUser = employeeId.Length > 0 && portalUsers.TryGetValue(employeeId, out var portal)
            ? portal
            : "";
        var groupName = (row.MachineGroupName ?? "").Trim();
        if (groupName.Length > 0)
        {
            return new MachineAssignment(groupName, false, portalUser);
        }

        var display = (row.MachineDisplay ?? "").Trim();
        var status = (row.Currentstatus ?? "").Trim();
        var machine = display.Length > 0 ? display : status;
        if (machine.Length == 0 || IsAttendanceStatus(machine))
        {
            return new MachineAssignment("Unassigned", true, portalUser);
        }

        return new MachineAssignment(machine, false, portalUser);
    }

    private static bool IsAttendanceStatus(string value)
    {
        return value.Equals("TimeIn", StringComparison.OrdinalIgnoreCase)
            || value.Equals("TimeOut", StringComparison.OrdinalIgnoreCase)
            || value.Equals("LunchIn", StringComparison.OrdinalIgnoreCase)
            || value.Equals("LunchOut", StringComparison.OrdinalIgnoreCase)
            || value.Equals("Unloading", StringComparison.OrdinalIgnoreCase)
            || value.Equals("ODOfficialTimeIn", StringComparison.OrdinalIgnoreCase);
    }

    private static string MachineLabel(LabourRow row)
    {
        var display = (row.MachineDisplay ?? "").Trim();
        if (display.Length > 0)
        {
            return display;
        }

        var group = (row.MachineGroupName ?? "").Trim();
        if (group.Length > 0)
        {
            return group;
        }

        return (row.Currentstatus ?? "").Trim();
    }

  

    private static string PersonKey(LabourRow row)
    {
        var id = AsText(row.Employeeid);
        if (id.Length > 0)
        {
            return $"id:{id}";
        }

        var name = (row.Employeename ?? "").Trim();
        return name.Length > 0 ? $"name:{name}" : "unknown";
    }

    private static string AsText(object? value)
    {
        if (value is null or DBNull)
        {
            return "";
        }

        return Convert.ToString(value, CultureInfo.InvariantCulture)?.Trim() ?? "";
    }

    private static int? RequiredCount(IEnumerable<LabourRow> rows)
    {
        int? required = null;
        foreach (var row in rows)
        {
            var value = AsCount(row.RequiredLabours);
            if (value is > 0 && (required is null || value > required))
            {
                required = value;
            }
        }

        return required;
    }

    private static int? AsCount(object? value)
    {
        if (value is null or DBNull)
        {
            return null;
        }

        try
        {
            return Convert.ToInt32(value, CultureInfo.InvariantCulture);
        }
        catch (Exception ex) when (ex is FormatException or InvalidCastException or OverflowException)
        {
            return null;
        }
    }

    private static string FormatJobDate(object? value) => value switch
    {
        DateTime date => date.ToString("dd.MM.yy", CultureInfo.InvariantCulture),
        DateTimeOffset date => date.ToString("dd.MM.yy", CultureInfo.InvariantCulture),
        null => "",
        _ => Convert.ToString(value, CultureInfo.InvariantCulture) ?? ""
    };

    private sealed class LoginRow
    {
        public int StatusCode { get; set; }
        public string StatusMessage { get; set; } = "";
        public string? UserName { get; set; }
        public string? LabourID { get; set; }
    }

    private sealed class JobRow
    {
        public string? JBCNo { get; set; }
        public object? JBCDate { get; set; }
        public string? ItemSpecName { get; set; }
        public decimal ITEMTOTALQTY { get; set; }
        public int Srno { get; set; }
        public int ItemSpecID { get; set; }
    }

    private sealed class BatchRow
    {
        public string? JobNo { get; set; }
        public string? ItemSpecName { get; set; }
        public decimal Quantity { get; set; }
        public int CurrentStageNo { get; set; }
    }

    private sealed class LabourRow
    {
        public string? Employeename { get; set; }
        public object? Employeeid { get; set; }
        public string? Currentstatus { get; set; }
        public int? MachineID { get; set; }
        public string? MachineName { get; set; }
        public string? MachineDisplay { get; set; }
        public string? MachineGroupName { get; set; }
        public object? SslNo { get; set; }
        public object? RequiredLabours { get; set; }
    }

    private sealed class PortalUserRow
    {
        public object? EmployeeID { get; set; }
        public string? PortalUserName { get; set; }
    }
}
