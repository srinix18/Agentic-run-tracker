-- Optional: helper queries you might want to run separately

-- Count agents per project using the function (example):
SELECT ProjectID, count_agents_in_project(ProjectID) AS agent_count
FROM Project;

-- Get runs for an agent (example): CALL GetRunsByAgent(1);
-- Get run metrics for a run: CALL GetRunMetrics(1);
-- Get artifacts for a run: CALL GetArtifactsForRun(1);
