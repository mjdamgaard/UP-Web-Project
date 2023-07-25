
SET GLOBAL event_scheduler = ON;

DELIMITER //
CREATE EVENT publicize_recent_inputs
    ON SCHEDULE EVERY 30 MINUTE DO
BEGIN proc: BEGIN
    DECLARE now BIGINT UNSIGNED;
    SET now = UNIX_TIMESTAMP();

    IF (NOT GET_LOCK("publicize_recent_inputs_lock")) THEN
        LEAVE proc;
    END IF;

    INSERT INTO RecentInputs
    SELECT (user_id, cat_id, rat_val, inst_id)
    FROM Private_RecentInputs
    WHERE live_at_time <= now;

    DELETE FROM Private_RecentInputs
    WHERE live_at_time <= now;

    RELEASE_LOCK("publicize_recent_inputs_lock");
END proc; END //
DELIMITER ;



DELIMITER //
CREATE EVENT update_semantic_inputs
    ON SCHEDULE EVERY 3 SECOND DO
BEGIN proc: BEGIN
    DECLARE lastRecentInput, newestRecentInput BIGINT UNSIGNED;

    IF (NOT GET_LOCK("update_semantic_inputs")) THEN
        LEAVE proc;
    END IF;

    -- TODO: Insert for loop here.

    RELEASE_LOCK("update_semantic_inputs");
END proc; END //
DELIMITER ;
