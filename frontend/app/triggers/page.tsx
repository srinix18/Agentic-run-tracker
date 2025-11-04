'use client'

export default function TriggersPage() {
    const triggers = [
        // INSERT TRIGGERS
        {
            name: 'trg_run_parent_not_self',
            type: 'BEFORE INSERT',
            table: 'Run',
            description: 'Prevents a run from being set as its own parent. Ensures data integrity by checking that Parent_RunID is not equal to RunID.',
            timing: 'BEFORE INSERT',
            event: 'INSERT',
            definition: `CREATE TRIGGER trg_run_parent_not_self 
BEFORE INSERT ON \`Run\` 
FOR EACH ROW 
BEGIN 
  IF NEW.Parent_RunID IS NOT NULL AND NEW.Parent_RunID = NEW.RunID THEN 
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Run cannot parent itself'; 
  END IF; 
END;`,
            example: 'INSERT INTO Run (RunID, Parent_RunID, AgentID, Status) VALUES (5, 5, 1, "queued"); -- This will fail'
        },
        {
            name: 'trg_artifact_checksum_default',
            type: 'BEFORE INSERT',
            table: 'Artifact',
            description: 'Automatically generates a SHA-256 checksum for an artifact if one is not provided. Uses the URI as input for the hash.',
            timing: 'BEFORE INSERT',
            event: 'INSERT',
            definition: `CREATE TRIGGER trg_artifact_checksum_default 
BEFORE INSERT ON \`Artifact\` 
FOR EACH ROW 
BEGIN 
  IF NEW.Checksum IS NULL THEN 
    SET NEW.Checksum = SHA2(NEW.URI, 256); 
  END IF; 
END;`,
            example: 'INSERT INTO Artifact (Type, URI, RunID) VALUES ("log", "https://example.com/log.txt", 1); -- Checksum auto-generated'
        },
        {
            name: 'trg_project_validate_status',
            type: 'BEFORE INSERT',
            table: 'Project',
            description: 'Validates project status before insertion. Ensures that only valid status values (active, archived) are inserted into the project table.',
            timing: 'BEFORE INSERT',
            event: 'INSERT',
            definition: `CREATE TRIGGER trg_project_validate_status 
BEFORE INSERT ON \`Project\` 
FOR EACH ROW 
BEGIN 
  IF NEW.status NOT IN ('active', 'archived') THEN 
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Invalid project status. Must be active or archived'; 
  END IF; 
END;`,
            example: 'INSERT INTO Project (name, status, userID) VALUES ("Test Project", "active", 1); -- Valid\nINSERT INTO Project (name, status, userID) VALUES ("Test", "invalid", 1); -- This will fail'
        },
        {
            name: 'trg_user_email_validation',
            type: 'BEFORE INSERT',
            table: 'User',
            description: 'Validates email format before inserting a new user. Checks that the email contains an @ symbol and a domain extension.',
            timing: 'BEFORE INSERT',
            event: 'INSERT',
            definition: `CREATE TRIGGER trg_user_email_validation 
BEFORE INSERT ON \`User\` 
FOR EACH ROW 
BEGIN 
  IF NEW.Email NOT LIKE '%_@__%.__%' THEN 
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Invalid email format'; 
  END IF; 
END;`,
            example: 'INSERT INTO User (Fname, Lname, Email, Password, Role) VALUES ("John", "Doe", "john@example.com", "pass", "user"); -- Valid\nINSERT INTO User (Fname, Lname, Email, Password, Role) VALUES ("Jane", "Doe", "invalid-email", "pass", "user"); -- This will fail'
        },

        // UPDATE TRIGGERS
        {
            name: 'trg_run_status_update_validation',
            type: 'BEFORE UPDATE',
            table: 'Run',
            description: 'Validates run status transitions during updates. Prevents invalid status changes (e.g., cannot go from "succeeded" to "queued"). Ensures logical workflow progression.',
            timing: 'BEFORE UPDATE',
            event: 'UPDATE',
            definition: `CREATE TRIGGER trg_run_status_update_validation 
BEFORE UPDATE ON \`Run\` 
FOR EACH ROW 
BEGIN 
  -- Prevent changing from terminal states to non-terminal states
  IF OLD.Status IN ('succeeded', 'failed', 'canceled') 
     AND NEW.Status IN ('queued', 'running') THEN 
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Cannot restart a terminated run'; 
  END IF; 
END;`,
            example: 'UPDATE Run SET Status = "running" WHERE RunID = 1; -- Valid if current status allows\nUPDATE Run SET Status = "queued" WHERE RunID = 2 AND Status = "succeeded"; -- This will fail'
        },
        {
            name: 'trg_artifact_checksum_update',
            type: 'BEFORE UPDATE',
            table: 'Artifact',
            description: 'Regenerates checksum when artifact URI is updated. Automatically recalculates SHA-256 hash if the URI changes to maintain data integrity.',
            timing: 'BEFORE UPDATE',
            event: 'UPDATE',
            definition: `CREATE TRIGGER trg_artifact_checksum_update 
BEFORE UPDATE ON \`Artifact\` 
FOR EACH ROW 
BEGIN 
  IF NEW.URI != OLD.URI THEN 
    SET NEW.Checksum = SHA2(NEW.URI, 256); 
  END IF; 
END;`,
            example: 'UPDATE Artifact SET URI = "https://example.com/new-log.txt" WHERE ArtifactID = 1; -- Checksum auto-regenerated'
        },
        {
            name: 'trg_project_status_change_audit',
            type: 'AFTER UPDATE',
            table: 'Project',
            description: 'Logs project status changes for auditing purposes. Creates an audit trail whenever a project status is updated from active to archived or vice versa.',
            timing: 'AFTER UPDATE',
            event: 'UPDATE',
            definition: `CREATE TRIGGER trg_project_status_change_audit 
AFTER UPDATE ON \`Project\` 
FOR EACH ROW 
BEGIN 
  IF OLD.status != NEW.status THEN 
    INSERT INTO project_audit_log (ProjectID, old_status, new_status, changed_at) 
    VALUES (NEW.ProjectID, OLD.status, NEW.status, NOW()); 
  END IF; 
END;`,
            example: 'UPDATE Project SET status = "archived" WHERE ProjectID = 1; -- Logs the status change to audit table'
        },
        {
            name: 'trg_user_prevent_role_downgrade',
            type: 'BEFORE UPDATE',
            table: 'User',
            description: 'Prevents downgrading the last admin user to regular user. Ensures at least one admin user exists in the system at all times for system management.',
            timing: 'BEFORE UPDATE',
            event: 'UPDATE',
            definition: `CREATE TRIGGER trg_user_prevent_role_downgrade 
BEFORE UPDATE ON \`User\` 
FOR EACH ROW 
BEGIN 
  DECLARE admin_count INT; 
  IF OLD.Role = 'admin' AND NEW.Role = 'user' THEN 
    SELECT COUNT(*) INTO admin_count FROM User WHERE Role = 'admin'; 
    IF admin_count <= 1 THEN 
      SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = 'Cannot remove the last admin user'; 
    END IF; 
  END IF; 
END;`,
            example: 'UPDATE User SET Role = "user" WHERE userID = 1 AND Role = "admin"; -- Will fail if this is the last admin'
        },
        {
            name: 'trg_runmetric_validate_numeric',
            type: 'BEFORE UPDATE',
            table: 'RunMetric',
            description: 'Validates that numeric metrics have valid numeric values. Ensures data type consistency when updating metric values based on the DataType field.',
            timing: 'BEFORE UPDATE',
            event: 'UPDATE',
            definition: `CREATE TRIGGER trg_runmetric_validate_numeric 
BEFORE UPDATE ON \`RunMetric\` 
FOR EACH ROW 
BEGIN 
  IF NEW.DataType = 'numeric' AND NEW.Value_Numeric IS NULL THEN 
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Numeric metrics must have a Value_Numeric'; 
  END IF; 
END;`,
            example: 'UPDATE RunMetric SET Value_Numeric = 95.5 WHERE ID = 1; -- Valid\nUPDATE RunMetric SET Value_Numeric = NULL WHERE ID = 2 AND DataType = "numeric"; -- This will fail'
        },

        // DELETE TRIGGERS
        {
            name: 'trg_user_prevent_last_admin_delete',
            type: 'BEFORE DELETE',
            table: 'User',
            description: 'Prevents deletion of the last admin user in the system. Ensures system manageability by maintaining at least one admin user at all times.',
            timing: 'BEFORE DELETE',
            event: 'DELETE',
            definition: `CREATE TRIGGER trg_user_prevent_last_admin_delete 
BEFORE DELETE ON \`User\` 
FOR EACH ROW 
BEGIN 
  DECLARE admin_count INT; 
  IF OLD.Role = 'admin' THEN 
    SELECT COUNT(*) INTO admin_count FROM User WHERE Role = 'admin'; 
    IF admin_count <= 1 THEN 
      SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = 'Cannot delete the last admin user'; 
    END IF; 
  END IF; 
END;`,
            example: 'DELETE FROM User WHERE userID = 1 AND Role = "admin"; -- Will fail if this is the last admin user'
        },
        {
            name: 'trg_project_cascade_cleanup',
            type: 'BEFORE DELETE',
            table: 'Project',
            description: 'Archives project instead of deleting. Changes project status to "archived" rather than permanently deleting, preserving historical data for auditing.',
            timing: 'BEFORE DELETE',
            event: 'DELETE',
            definition: `CREATE TRIGGER trg_project_cascade_cleanup 
BEFORE DELETE ON \`Project\` 
FOR EACH ROW 
BEGIN 
  -- Instead of deleting, archive the project
  UPDATE Project SET status = 'archived' WHERE ProjectID = OLD.ProjectID; 
  SIGNAL SQLSTATE '45000' 
  SET MESSAGE_TEXT = 'Project archived instead of deleted'; 
END;`,
            example: 'DELETE FROM Project WHERE ProjectID = 1; -- Project will be archived instead of deleted'
        },
        {
            name: 'trg_run_delete_orphan_prevention',
            type: 'BEFORE DELETE',
            table: 'Run',
            description: 'Prevents deletion of runs that have child runs. Ensures data integrity by checking if any other runs reference this run as their parent before allowing deletion.',
            timing: 'BEFORE DELETE',
            event: 'DELETE',
            definition: `CREATE TRIGGER trg_run_delete_orphan_prevention 
BEFORE DELETE ON \`Run\` 
FOR EACH ROW 
BEGIN 
  DECLARE child_count INT; 
  SELECT COUNT(*) INTO child_count 
  FROM Run WHERE Parent_RunID = OLD.RunID; 
  IF child_count > 0 THEN 
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Cannot delete run with child runs'; 
  END IF; 
END;`,
            example: 'DELETE FROM Run WHERE RunID = 1; -- Will fail if other runs have Parent_RunID = 1'
        },
        {
            name: 'trg_agent_active_runs_check',
            type: 'BEFORE DELETE',
            table: 'Agent',
            description: 'Prevents deletion of agents with active runs. Checks for any runs in "running" or "queued" status before allowing agent deletion to prevent orphaned active processes.',
            timing: 'BEFORE DELETE',
            event: 'DELETE',
            definition: `CREATE TRIGGER trg_agent_active_runs_check 
BEFORE DELETE ON \`Agent\` 
FOR EACH ROW 
BEGIN 
  DECLARE active_runs INT; 
  SELECT COUNT(*) INTO active_runs 
  FROM Run 
  WHERE AgentID = OLD.AgentID 
    AND Status IN ('running', 'queued'); 
  IF active_runs > 0 THEN 
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Cannot delete agent with active runs'; 
  END IF; 
END;`,
            example: 'DELETE FROM Agent WHERE AgentID = 1; -- Will fail if there are active runs for this agent'
        },
        {
            name: 'trg_artifact_cleanup_notification',
            type: 'AFTER DELETE',
            table: 'Artifact',
            description: 'Logs artifact deletion for cleanup tasks. Creates a notification or log entry when artifacts are deleted, useful for external storage cleanup or audit trails.',
            timing: 'AFTER DELETE',
            event: 'DELETE',
            definition: `CREATE TRIGGER trg_artifact_cleanup_notification 
AFTER DELETE ON \`Artifact\` 
FOR EACH ROW 
BEGIN 
  INSERT INTO artifact_deletion_log (ArtifactID, URI, Type, deleted_at) 
  VALUES (OLD.ArtifactID, OLD.URI, OLD.Type, NOW()); 
END;`,
            example: 'DELETE FROM Artifact WHERE ArtifactID = 1; -- Logs deletion for external cleanup processes'
        }
    ]

    const getColorByType = (type: string) => {
        if (type.includes('INSERT')) return 'bg-green-100 text-green-800 border-green-200'
        if (type.includes('UPDATE')) return 'bg-blue-100 text-blue-800 border-blue-200'
        if (type.includes('DELETE')) return 'bg-red-100 text-red-800 border-red-200'
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const getIconByType = (type: string) => {
        if (type.includes('INSERT')) return '➕'
        if (type.includes('UPDATE')) return '🔄'
        if (type.includes('DELETE')) return '🗑️'
        return '⚡'
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Database Triggers</h1>
                <p className="text-gray-600">
                    Automatic database actions that fire on INSERT, UPDATE, or DELETE operations
                </p>
                <div className="mt-4 flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                            {triggers.filter(t => t.event === 'INSERT').length} INSERT
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                            {triggers.filter(t => t.event === 'UPDATE').length} UPDATE
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-medium">
                            {triggers.filter(t => t.event === 'DELETE').length} DELETE
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full font-medium">
                            {triggers.length} Total
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {triggers.map((trigger, idx) => (
                    <div key={idx} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                        {/* Header */}
                        <div className={`border-b p-4 ${getColorByType(trigger.type)}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{getIconByType(trigger.type)}</span>
                                    <div>
                                        <h3 className="text-xl font-bold font-mono">{trigger.name}</h3>
                                        <p className="text-sm mt-1">
                                            <span className="font-semibold">Table:</span> {trigger.table}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getColorByType(trigger.type)}`}>
                                        {trigger.timing}
                                    </span>
                                    <div className="text-xs mt-1 font-semibold">
                                        {trigger.event}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {/* Description */}
                            <div className="mb-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                                <p className="text-gray-700 leading-relaxed">{trigger.description}</p>
                            </div>

                            {/* Definition */}
                            <div className="mb-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Trigger Definition</h4>
                                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                                    <code>{trigger.definition}</code>
                                </pre>
                            </div>

                            {/* Example */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Example Usage</h4>
                                <pre className="bg-blue-50 text-blue-900 p-4 rounded-lg overflow-x-auto text-sm border border-blue-200">
                                    <code>{trigger.example}</code>
                                </pre>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Info Section */}
            <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <span>ℹ️</span>
                    About Database Triggers
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                    <p>
                        <strong>Triggers</strong> are special stored procedures that automatically execute when specific events occur on a table.
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                        <li><strong>BEFORE triggers:</strong> Execute before the triggering event (INSERT, UPDATE, DELETE)</li>
                        <li><strong>AFTER triggers:</strong> Execute after the triggering event completes</li>
                        <li><strong>Benefits:</strong> Enforce business rules, maintain data integrity, automate logging</li>
                        <li><strong>Use cases:</strong> Validation, auto-calculation, auditing, cascading updates</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
