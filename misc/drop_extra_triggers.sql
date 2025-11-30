-- Script to drop extra triggers, keeping only trg_run_parent_not_self and trg_artifact_checksum_default

DROP TRIGGER IF EXISTS trg_update_run_status_after_step_update;
DROP TRIGGER IF EXISTS trg_validate_dataset_url;
DROP TRIGGER IF EXISTS trg_prevent_active_project_deletion;
DROP TRIGGER IF EXISTS trg_log_failed_run;
DROP TRIGGER IF EXISTS trg_validate_runstep_sequence;

-- List remaining triggers
SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE 
FROM information_schema.TRIGGERS 
WHERE TRIGGER_SCHEMA = DATABASE()
ORDER BY TRIGGER_NAME;
