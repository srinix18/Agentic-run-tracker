-- Schema, triggers, functions, procedures and seed data for Agentic AI Run Tracker
-- Run this file using the Python runner (recommended) or the mysql client.

-- ==========================
-- CREATE TABLES
-- ==========================

CREATE TABLE `User` ( 
  userID     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, 
  Fname      VARCHAR(100)    NOT NULL, 
  Lname      VARCHAR(100)    NOT NULL, 
  Email      VARCHAR(255)    NOT NULL, 
  CreatedAt  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP, 
  PRIMARY KEY (userID), 
  UNIQUE KEY uq_user_email (Email) 
);

CREATE TABLE `Project` ( 
  ProjectID   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, 
  name        VARCHAR(200)    NOT NULL, 
  status      ENUM('active','archived') NOT NULL DEFAULT 'active', 
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP, 
  userID      BIGINT UNSIGNED NOT NULL, 
  PRIMARY KEY (ProjectID), 
  FOREIGN KEY (userID) REFERENCES `User`(userID) 
    ON UPDATE CASCADE 
    ON DELETE RESTRICT 
);

CREATE TABLE `Dataset` ( 
  DatasetID  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, 
  name       VARCHAR(200)    NOT NULL, 
  version    VARCHAR(50), 
  URL        VARCHAR(1000)   NOT NULL, 
  type       ENUM('text','image','tabular','logs','audio','video') NOT NULL, 
  ProjectID  BIGINT UNSIGNED NOT NULL, 
  PRIMARY KEY (DatasetID), 
  UNIQUE KEY uq_dataset_project_name (ProjectID, name), 
  FOREIGN KEY (ProjectID) REFERENCES `Project`(ProjectID) 
    ON UPDATE CASCADE 
    ON DELETE CASCADE 
);

CREATE TABLE `Agent` ( 
  AgentID    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, 
  name       VARCHAR(200)    NOT NULL, 
  version    VARCHAR(50), 
  model      VARCHAR(200), 
  goal       TEXT, 
  ProjectID  BIGINT UNSIGNED NOT NULL, 
  PRIMARY KEY (AgentID), 
  FOREIGN KEY (ProjectID) REFERENCES `Project`(ProjectID) 
    ON UPDATE CASCADE 
    ON DELETE CASCADE 
);

CREATE TABLE `Run` ( 
  RunID         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, 
  Status        ENUM('queued','running','succeeded','failed','canceled') NOT NULL DEFAULT 'queued', 
  `time`        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP, 
  notes         TEXT, 
  Parent_RunID  BIGINT UNSIGNED NULL, 
  AgentID       BIGINT UNSIGNED NOT NULL, 
  PRIMARY KEY (RunID), 
  FOREIGN KEY (AgentID) REFERENCES `Agent`(AgentID) 
    ON UPDATE CASCADE 
    ON DELETE CASCADE, 
  FOREIGN KEY (Parent_RunID) REFERENCES `Run`(RunID) 
    ON UPDATE CASCADE 
    ON DELETE SET NULL 
);

CREATE TABLE `Environment` ( 
  EnvironmentID   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, 
  Name            VARCHAR(200)    NOT NULL, 
  Framework       VARCHAR(100), 
  Python_Version  VARCHAR(50), 
  GPU_Cores       INT UNSIGNED, 
  CPU_Cores       INT UNSIGNED, 
  RunID           BIGINT UNSIGNED NOT NULL, 
  PRIMARY KEY (EnvironmentID), 
  FOREIGN KEY (RunID) REFERENCES `Run`(RunID) 
    ON UPDATE CASCADE 
    ON DELETE CASCADE 
);

CREATE TABLE `RunStep` ( 
  RunID       BIGINT UNSIGNED NOT NULL, 
  Step_No     INT             NOT NULL, 
  Name        VARCHAR(200), 
  Status      ENUM('pending','ok','error') DEFAULT 'pending', 
  Step_Type   ENUM('plan','tool_call','observe','revise','finalize'), 
  Time        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP, 
  PRIMARY KEY (RunID, Step_No), 
  FOREIGN KEY (RunID) REFERENCES `Run`(RunID) 
    ON UPDATE CASCADE 
    ON DELETE CASCADE 
);

CREATE TABLE `RunMetric` ( 
  ID             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, 
  RunID          BIGINT UNSIGNED NOT NULL, 
  Name           VARCHAR(200)    NOT NULL, 
  Value_Text     VARCHAR(1000), 
  DataType       ENUM('numeric','text','boolean','json','other') NOT NULL DEFAULT 'text', 
  Value_Numeric  DOUBLE, 
  PRIMARY KEY (ID), 
  FOREIGN KEY (RunID) REFERENCES `Run`(RunID) 
    ON UPDATE CASCADE 
    ON DELETE CASCADE, 
  CHECK (Value_Text IS NOT NULL OR Value_Numeric IS NOT NULL) 
);

CREATE TABLE `Artifact` ( 
  ArtifactID  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, 
  Type        ENUM('file','log','image','model','report') NOT NULL, 
  URI         VARCHAR(1000)   NOT NULL, 
  Checksum    VARCHAR(128), 
  Created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP, 
  RunID       BIGINT UNSIGNED NOT NULL, 
  PRIMARY KEY (ArtifactID), 
  FOREIGN KEY (RunID) REFERENCES `Run`(RunID) 
    ON UPDATE CASCADE 
    ON DELETE CASCADE 
);

-- ==========================
-- Optional: clear existing data safely (child-to-parent), then re-enable FK checks
-- ==========================

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `Artifact`;
TRUNCATE TABLE `RunMetric`;
TRUNCATE TABLE `RunStep`;
TRUNCATE TABLE `Environment`;
TRUNCATE TABLE `Dataset`;
TRUNCATE TABLE `Run`;
TRUNCATE TABLE `Agent`;
TRUNCATE TABLE `Project`;
TRUNCATE TABLE `User`;
SET FOREIGN_KEY_CHECKS = 1;

START TRANSACTION;

-- ==========================
-- Seed data
-- ==========================

-- 1) Users
INSERT INTO `User` (`userID`, `Fname`, `Lname`, `Email`, `CreatedAt`) VALUES 
(1,'Aarav','Sharma','aarav1@example.com','2025-09-30 10:00:00'), 
(2,'Diya','Patel','diya2@example.com','2025-09-30 10:01:00'), 
(3,'Kabir','Rao','kabir3@example.com','2025-09-30 10:02:00'), 
(4,'Isha','Iyer','isha4@example.com','2025-09-30 10:03:00'), 
(5,'Vivaan','Gupta','vivaan5@example.com','2025-09-30 10:04:00'), 
(6,'Myra','Khan','myra6@example.com','2025-09-30 10:05:00'), 
(7,'Advait','Nair','advait7@example.com','2025-09-30 10:06:00'), 
(8,'Sara','Mehta','sara8@example.com','2025-09-30 10:07:00'), 
(9,'Ishaan','Reddy','ishaan9@example.com','2025-09-30 10:08:00'), 
(10,'Riya','Das','riya10@example.com','2025-09-30 10:09:00');

-- 2) Projects (FK → User.userID)
INSERT INTO `Project` (`ProjectID`, `name`, `status`, `created_at`, `userID`) VALUES 
(1,'Orion','active','2025-09-30 11:00:00',1), 
(2,'Nova','active','2025-09-30 11:01:00',2), 
(3,'Quasar','archived','2025-09-30 11:02:00',3), 
(4,'Pulsar','active','2025-09-30 11:03:00',4), 
(5,'Nebula','active','2025-09-30 11:04:00',5), 
(6,'Aquila','active','2025-09-30 11:05:00',6), 
(7,'Lyra','archived','2025-09-30 11:06:00',7), 
(8,'Vega','active','2025-09-30 11:07:00',8), 
(9,'Sirius','active','2025-09-30 11:08:00',9), 
(10,'Altair','active','2025-09-30 11:09:00',10);

-- 3) Agents (FK → Project.ProjectID)
INSERT INTO `Agent` (`AgentID`, `name`, `version`, `model`, `goal`, `ProjectID`) VALUES 
(1,'Planner-A','1.0.0','gpt-4o','Plan research tasks',1), 
(2,'Executor-B','1.1.0','llama-3','Execute pipelines',2), 
(3,'Retriever-C','2.0.0','gpt-4o-mini','Retrieve evidence',3), 
(4,'Analyst-D','1.0.1','mixtral','Analyze results',4), 
(5,'Reviewer-E','1.2.0','gpt-4o','Review outputs',5), 
(6,'Coordinator-F','1.0.2','llama-3','Coordinate tools',6), 
(7,'Optimizer-G','2.1.0','gpt-4o','Optimize prompts',7), 
(8,'Evaluator-H','1.3.0','gpt-4o-mini','Score answers',8), 
(9,'Monitor-I','1.0.3','mixtral','Monitor runs',9), 
(10,'Summarizer-J','1.4.0','gpt-4o','Summarize logs',10);

-- 4) Runs (FK → Agent.AgentID, self-FK Parent_RunID → Run.RunID)
INSERT INTO `Run` (`RunID`, `Status`, `time`, `notes`, `Parent_RunID`, `AgentID`) VALUES 
(1,'queued','2025-09-30 12:00:00','initial run',NULL,1), 
(2,'running','2025-09-30 12:05:00','pipeline executing',NULL,2), 
(3,'succeeded','2025-09-30 12:10:00','baseline complete',NULL,3), 
(4,'failed','2025-09-30 12:15:00','tool error',NULL,4), 
(5,'canceled','2025-09-30 12:20:00','aborted by user',NULL,5), 
(6,'running','2025-09-30 12:25:00','child of run 2',2,2), 
(7,'queued','2025-09-30 12:30:00','child of run 3',3,3), 
(8,'succeeded','2025-09-30 12:35:00','retry success',4,4), 
(9,'running','2025-09-30 12:40:00','monitoring',NULL,9), 
(10,'queued','2025-09-30 12:45:00','summary pending',NULL,10);

-- 5) Environment (FK → Run.RunID)
INSERT INTO `Environment` (`EnvironmentID`, `Name`, `Framework`, `Python_Version`, 
`GPU_Cores`, `CPU_Cores`, `RunID`) VALUES 
(1,'local-dev','PyTorch','3.10',0,8,1), 
(2,'gpu-a100','TensorFlow','3.11',40,32,2), 
(3,'colab-x','PyTorch','3.10',0,4,3), 
(4,'dockergpu','JAX','3.11',16,24,4), 
(5,'server-ml','PyTorch','3.9',0,16,5), 
(6,'k8s-node-1','TensorFlow','3.11',24,32,6), 
(7,'k8s-node-2','JAX','3.10',0,16,7), 
(8,'ec2-g5','PyTorch','3.11',24,48,8), 
(9,'onprem-v100','TensorFlow','3.8',16,24,9), 
(10,'edge-nano','PyTorch','3.8',0,4,10);

-- 6) Datasets (FK → Project.ProjectID)
INSERT INTO `Dataset` (`DatasetID`, `name`, `version`, `URL`, `type`, `ProjectID`) VALUES 
(1,'news-corpus','v1','https://data.example.com/news-v1','text',1), 
(2,'images-animals','v2','https://data.example.com/animals-v2','image',2), 
(3,'qa-benchmark','v1','https://data.example.com/qa-v1','tabular',3), 
(4,'logs-app','v3','https://data.example.com/logs-v3','logs',4), 
(5,'audio-commands','v1','https://data.example.com/audio-v1','audio',5), 
(6,'video-scenes','v1','https://data.example.com/video-v1','video',6), 
(7,'finance-tables','v2','https://data.example.com/fin-v2','tabular',7), 
(8,'wiki-snap','v1','https://data.example.com/wiki-v1','text',8), 
(9,'product-images','v1','https://data.example.com/prodimg-v1','image',9), 
(10,'code-snippets','v1','https://data.example.com/code-v1','text',10);

-- 7) RunStep
INSERT INTO `RunStep` (`RunID`, `Step_No`, `Name`, `Status`, `Step_Type`, `Time`) VALUES 
(1,1,'plan task','ok','plan','2025-09-30 12:00:10'), 
(1,2,'retrieve docs','ok','tool_call','2025-09-30 12:00:20'), 
(1,3,'observe results','pending','observe','2025-09-30 12:00:30'), 
(2,1,'plan pipeline','ok','plan','2025-09-30 12:05:10'), 
(2,2,'run tool A','ok','tool_call','2025-09-30 12:05:30'), 
(2,3,'revise prompt','ok','revise','2025-09-30 12:05:50'), 
(2,4,'run tool B','ok','tool_call','2025-09-30 12:06:10'), 
(3,1,'baseline plan','ok','plan','2025-09-30 12:10:05'), 
(3,2,'execute baseline','ok','tool_call','2025-09-30 12:10:20'), 
(4,1,'plan retry','error','plan','2025-09-30 12:15:10');

-- 8) RunMetric
INSERT INTO `RunMetric` (`ID`, `RunID`, `Name`, `Value_Text`, `DataType`, `Value_Numeric`) 
VALUES 
(1,1,'latency_ms',NULL,'numeric',1200), 
(2,1,'notes','good recall','text',NULL), 
(3,2,'tool_calls',NULL,'numeric',5), 
(4,3,'accuracy',NULL,'numeric',0.82), 
(5,4,'error_msg','timeout on tool B','text',NULL), 
(6,5,'canceled_by','user','text',NULL), 
(7,6,'latency_ms',NULL,'numeric',950), 
(8,7,'score',NULL,'numeric',0.67), 
(9,8,'throughput',NULL,'numeric',120.5), 
(10,9,'status_note','monitoring stable','text',NULL);

-- 9) Artifact
INSERT INTO `Artifact` (`ArtifactID`, `Type`, `URI`, `Checksum`, `Created_at`, `RunID`) 
VALUES 
(1,'log','https://artifacts.example.com/run1/log.txt','abc123','2025-09-30 12:01:00',1), 
(2,'report','https://artifacts.example.com/run1/report.html','def456','2025-09-30 12:02:00',1), 
(3,'file','https://artifacts.example.com/run2/output.json','ghi789','2025-09-30 12:06:00',2), 
(4,'image','https://artifacts.example.com/run3/plot.png','jkl012','2025-09-30 12:11:00',3), 
(5,'log','https://artifacts.example.com/run4/error.log','mno345','2025-09-30 12:16:00',4), 
(6,'model','https://artifacts.example.com/run5/model.bin','pqr678','2025-09-30 12:21:00',5), 
(7,'report','https://artifacts.example.com/run6/summary.html','stu901','2025-09-30 12:26:00',6), 
(8,'file','https://artifacts.example.com/run7/metrics.json','vwx234','2025-09-30 12:31:00',7), 
(9,'image','https://artifacts.example.com/run8/chart.png','yza567','2025-09-30 12:36:00',8), 
(10,'log','https://artifacts.example.com/run9/monitor.log','bcd890','2025-09-30 12:41:00',9);

COMMIT;

-- ==========================
-- TRIGGERS
-- ==========================

CREATE TRIGGER trg_run_parent_not_self 
BEFORE INSERT ON `Run` 
FOR EACH ROW 
BEGIN 
  IF NEW.Parent_RunID IS NOT NULL AND NEW.Parent_RunID = NEW.RunID THEN 
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Run cannot parent itself'; 
  END IF; 
END;

CREATE TRIGGER trg_artifact_checksum_default 
BEFORE INSERT ON `Artifact` 
FOR EACH ROW 
BEGIN 
  IF NEW.Checksum IS NULL THEN 
    SET NEW.Checksum = SHA2(NEW.URI, 256); 
  END IF; 
END;

-- ==========================
-- FUNCTIONS
-- ==========================

CREATE FUNCTION count_agents_in_project(p_project_id BIGINT UNSIGNED) 
RETURNS INT 
DETERMINISTIC 
READS SQL DATA 
BEGIN 
  DECLARE agent_count INT; 
  SELECT COUNT(*) INTO agent_count 
  FROM `Agent` 
  WHERE ProjectID = p_project_id; 
  RETURN agent_count; 
END;

-- Function to calculate average run duration for an agent
CREATE FUNCTION avg_run_duration_for_agent(p_agent_id BIGINT UNSIGNED)
RETURNS DECIMAL(10,2)
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE avg_duration DECIMAL(10,2);
  
  SELECT AVG(TIMESTAMPDIFF(SECOND, r1.time, r2.time)) INTO avg_duration
  FROM `Run` r1
  LEFT JOIN `Run` r2 ON r1.RunID = r2.Parent_RunID
  WHERE r1.AgentID = p_agent_id AND r2.RunID IS NOT NULL;
  
  RETURN COALESCE(avg_duration, 0);
END;

-- Function to get project status based on runs
CREATE FUNCTION get_project_health(p_project_id BIGINT UNSIGNED)
RETURNS VARCHAR(20)
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE failed_count INT;
  DECLARE total_count INT;
  DECLARE health_status VARCHAR(20);
  
  SELECT COUNT(*) INTO total_count
  FROM `Run` r
  JOIN `Agent` a ON r.AgentID = a.AgentID
  WHERE a.ProjectID = p_project_id;
  
  SELECT COUNT(*) INTO failed_count
  FROM `Run` r
  JOIN `Agent` a ON r.AgentID = a.AgentID
  WHERE a.ProjectID = p_project_id AND r.Status = 'failed';
  
  IF total_count = 0 THEN
    SET health_status = 'no_runs';
  ELSEIF failed_count = 0 THEN
    SET health_status = 'healthy';
  ELSEIF failed_count / total_count < 0.2 THEN
    SET health_status = 'good';
  ELSEIF failed_count / total_count < 0.5 THEN
    SET health_status = 'warning';
  ELSE
    SET health_status = 'critical';
  END IF;
  
  RETURN health_status;
END;

-- Function to count successful runs for an agent
CREATE FUNCTION count_successful_runs(p_agent_id BIGINT UNSIGNED)
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE success_count INT;
  
  SELECT COUNT(*) INTO success_count
  FROM `Run`
  WHERE AgentID = p_agent_id AND Status = 'succeeded';
  
  RETURN success_count;
END;

-- Function to check if a run has any failed steps
CREATE FUNCTION has_failed_steps(p_run_id BIGINT UNSIGNED)
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE failed_count INT;
  
  SELECT COUNT(*) INTO failed_count
  FROM `RunStep`
  WHERE RunID = p_run_id AND Status = 'error';
  
  RETURN failed_count > 0;
END;

-- ==========================
-- PROCEDURES
-- ==========================

CREATE PROCEDURE GetRunsByAgent ( 
  IN p_agent_id BIGINT UNSIGNED 
) 
BEGIN 
  SELECT * FROM `Run` WHERE AgentID = p_agent_id ORDER BY `time` DESC; 
END;

CREATE PROCEDURE GetRunMetrics ( 
  IN p_run_id BIGINT UNSIGNED 
) 
BEGIN 
  SELECT Name, DataType, Value_Numeric, Value_Text 
  FROM `RunMetric` 
  WHERE RunID = p_run_id; 
END;

CREATE PROCEDURE GetArtifactsForRun ( 
  IN p_run_id BIGINT UNSIGNED 
) 
BEGIN 
  SELECT Type, URI, Checksum, Created_at 
  FROM `Artifact` 
  WHERE RunID = p_run_id; 
END;

-- Procedure to get project summary with agent and run counts
CREATE PROCEDURE GetProjectSummary(
  IN p_project_id BIGINT UNSIGNED
)
BEGIN
  SELECT 
    p.ProjectID,
    p.name AS ProjectName,
    p.status AS ProjectStatus,
    p.created_at,
    u.Fname,
    u.Lname,
    COUNT(DISTINCT a.AgentID) AS TotalAgents,
    COUNT(DISTINCT r.RunID) AS TotalRuns,
    SUM(CASE WHEN r.Status = 'succeeded' THEN 1 ELSE 0 END) AS SuccessfulRuns,
    SUM(CASE WHEN r.Status = 'failed' THEN 1 ELSE 0 END) AS FailedRuns,
    SUM(CASE WHEN r.Status = 'running' THEN 1 ELSE 0 END) AS RunningRuns
  FROM `Project` p
  JOIN `User` u ON p.userID = u.userID
  LEFT JOIN `Agent` a ON p.ProjectID = a.ProjectID
  LEFT JOIN `Run` r ON a.AgentID = r.AgentID
  WHERE p.ProjectID = p_project_id
  GROUP BY p.ProjectID, p.name, p.status, p.created_at, u.Fname, u.Lname;
END;

-- Procedure to get all runs with their steps count
CREATE PROCEDURE GetRunsWithStepsCount(
  IN p_agent_id BIGINT UNSIGNED
)
BEGIN
  SELECT 
    r.RunID,
    r.Status,
    r.time,
    r.notes,
    COUNT(rs.Step_No) AS TotalSteps,
    SUM(CASE WHEN rs.Status = 'ok' THEN 1 ELSE 0 END) AS CompletedSteps,
    SUM(CASE WHEN rs.Status = 'error' THEN 1 ELSE 0 END) AS FailedSteps,
    SUM(CASE WHEN rs.Status = 'pending' THEN 1 ELSE 0 END) AS PendingSteps
  FROM `Run` r
  LEFT JOIN `RunStep` rs ON r.RunID = rs.RunID
  WHERE r.AgentID = p_agent_id
  GROUP BY r.RunID, r.Status, r.time, r.notes
  ORDER BY r.time DESC;
END;

-- Procedure to get agent performance metrics
CREATE PROCEDURE GetAgentPerformance(
  IN p_agent_id BIGINT UNSIGNED
)
BEGIN
  SELECT 
    a.AgentID,
    a.name AS AgentName,
    a.version,
    a.model,
    COUNT(r.RunID) AS TotalRuns,
    SUM(CASE WHEN r.Status = 'succeeded' THEN 1 ELSE 0 END) AS SuccessfulRuns,
    SUM(CASE WHEN r.Status = 'failed' THEN 1 ELSE 0 END) AS FailedRuns,
    ROUND(SUM(CASE WHEN r.Status = 'succeeded' THEN 1 ELSE 0 END) * 100.0 / COUNT(r.RunID), 2) AS SuccessRate,
    COUNT(DISTINCT art.ArtifactID) AS TotalArtifacts,
    AVG(rm.Value_Numeric) AS AvgMetricValue
  FROM `Agent` a
  LEFT JOIN `Run` r ON a.AgentID = r.AgentID
  LEFT JOIN `Artifact` art ON r.RunID = art.RunID
  LEFT JOIN `RunMetric` rm ON r.RunID = rm.RunID AND rm.DataType = 'numeric'
  WHERE a.AgentID = p_agent_id
  GROUP BY a.AgentID, a.name, a.version, a.model;
END;

-- Procedure to get user's project statistics
CREATE PROCEDURE GetUserProjectStats(
  IN p_user_id BIGINT UNSIGNED
)
BEGIN
  SELECT 
    u.userID,
    CONCAT(u.Fname, ' ', u.Lname) AS FullName,
    u.Email,
    COUNT(DISTINCT p.ProjectID) AS TotalProjects,
    SUM(CASE WHEN p.status = 'active' THEN 1 ELSE 0 END) AS ActiveProjects,
    SUM(CASE WHEN p.status = 'archived' THEN 1 ELSE 0 END) AS ArchivedProjects,
    COUNT(DISTINCT a.AgentID) AS TotalAgents,
    COUNT(DISTINCT r.RunID) AS TotalRuns
  FROM `User` u
  LEFT JOIN `Project` p ON u.userID = p.userID
  LEFT JOIN `Agent` a ON p.ProjectID = a.ProjectID
  LEFT JOIN `Run` r ON a.AgentID = r.AgentID
  WHERE u.userID = p_user_id
  GROUP BY u.userID, u.Fname, u.Lname, u.Email;
END;

-- Procedure to get all datasets for a project with usage statistics
CREATE PROCEDURE GetProjectDatasets(
  IN p_project_id BIGINT UNSIGNED
)
BEGIN
  SELECT 
    d.DatasetID,
    d.name AS DatasetName,
    d.version,
    d.URL,
    d.type AS DatasetType,
    p.name AS ProjectName,
    COUNT(DISTINCT a.AgentID) AS AgentsUsingProject
  FROM `Dataset` d
  JOIN `Project` p ON d.ProjectID = p.ProjectID
  LEFT JOIN `Agent` a ON p.ProjectID = a.ProjectID
  WHERE d.ProjectID = p_project_id
  GROUP BY d.DatasetID, d.name, d.version, d.URL, d.type, p.name
  ORDER BY d.name;
END;

-- Procedure to create a new run with environment
CREATE PROCEDURE CreateRunWithEnvironment(
  IN p_agent_id BIGINT UNSIGNED,
  IN p_notes TEXT,
  IN p_env_name VARCHAR(200),
  IN p_framework VARCHAR(100),
  IN p_python_version VARCHAR(50),
  IN p_gpu_cores INT UNSIGNED,
  IN p_cpu_cores INT UNSIGNED,
  OUT p_run_id BIGINT UNSIGNED
)
BEGIN
  -- Insert the run
  INSERT INTO `Run` (Status, notes, AgentID)
  VALUES ('queued', p_notes, p_agent_id);
  
  SET p_run_id = LAST_INSERT_ID();
  
  -- Insert the environment
  INSERT INTO `Environment` (Name, Framework, Python_Version, GPU_Cores, CPU_Cores, RunID)
  VALUES (p_env_name, p_framework, p_python_version, p_gpu_cores, p_cpu_cores, p_run_id);
  
  SELECT p_run_id AS NewRunID;
END;

-- Procedure to get run execution timeline
CREATE PROCEDURE GetRunTimeline(
  IN p_run_id BIGINT UNSIGNED
)
BEGIN
  SELECT 
    rs.RunID,
    rs.Step_No,
    rs.Name AS StepName,
    rs.Status,
    rs.Step_Type,
    rs.Time AS StepTime,
    TIMEDIFF(
      LEAD(rs.Time) OVER (ORDER BY rs.Step_No),
      rs.Time
    ) AS Duration
  FROM `RunStep` rs
  WHERE rs.RunID = p_run_id
  ORDER BY rs.Step_No;
END;

-- Procedure to archive old projects
CREATE PROCEDURE ArchiveOldProjects(
  IN p_days_old INT
)
BEGIN
  UPDATE `Project`
  SET status = 'archived'
  WHERE status = 'active'
  AND created_at < DATE_SUB(NOW(), INTERVAL p_days_old DAY);
  
  SELECT ROW_COUNT() AS ProjectsArchived;
END;

-- Procedure to get top performing agents by success rate
CREATE PROCEDURE GetTopPerformingAgents(
  IN p_limit INT
)
BEGIN
  SELECT 
    a.AgentID,
    a.name AS AgentName,
    a.version,
    a.model,
    p.name AS ProjectName,
    COUNT(r.RunID) AS TotalRuns,
    SUM(CASE WHEN r.Status = 'succeeded' THEN 1 ELSE 0 END) AS SuccessfulRuns,
    ROUND(SUM(CASE WHEN r.Status = 'succeeded' THEN 1 ELSE 0 END) * 100.0 / COUNT(r.RunID), 2) AS SuccessRate
  FROM `Agent` a
  JOIN `Project` p ON a.ProjectID = p.ProjectID
  JOIN `Run` r ON a.AgentID = r.AgentID
  GROUP BY a.AgentID, a.name, a.version, a.model, p.name
  HAVING COUNT(r.RunID) > 0
  ORDER BY SuccessRate DESC, TotalRuns DESC
  LIMIT p_limit;
END;

-- ==========================
-- Complex queries (examples)
-- ==========================

-- 1) Find Runs where completed finalize steps < total steps
SELECT r.RunID, r.Status,  
  (SELECT COUNT(*) FROM RunStep rs WHERE rs.RunID = r.RunID AND rs.Step_Type = 'finalize' AND rs.Status = 'ok') AS Completed_Finalize_Steps, 
  (SELECT COUNT(*) FROM RunStep rs WHERE rs.RunID = r.RunID) AS Total_Steps 
FROM `Run` r 
WHERE (SELECT COUNT(*) FROM RunStep rs WHERE rs.RunID = r.RunID AND rs.Step_Type = 'finalize' AND rs.Status = 'ok')  
      < (SELECT COUNT(*) FROM RunStep rs WHERE rs.RunID = r.RunID);

-- 2) List all Runs where the average latency metric is greater than overall average
SELECT r.RunID, r.Status, 
  (SELECT AVG(Value_Numeric) FROM RunMetric rm WHERE rm.RunID = r.RunID AND rm.Name = 'latency_ms') AS Run_Latency 
FROM `Run` r 
WHERE (SELECT AVG(Value_Numeric) FROM RunMetric rm WHERE rm.Name = 'latency_ms') < 
      (SELECT AVG(Value_Numeric) FROM RunMetric rm WHERE rm.RunID = r.RunID AND rm.Name = 'latency_ms');

-- 3) List Projects for which no agent has run any run
SELECT p.ProjectID, p.Name 
FROM `Project` p 
WHERE NOT EXISTS ( 
  SELECT 1 FROM `Agent` a 
  JOIN `Run` r ON a.AgentID = r.AgentID 
  WHERE a.ProjectID = p.ProjectID 
);
