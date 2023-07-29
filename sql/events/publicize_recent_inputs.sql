
SELECT "Events: publicize_recent_inputs event";

-- DROP PROCEDURE publicizeRecentInputs;
-- DROP EVENT publicize_recent_inputs;


DELIMITER //
CREATE PROCEDURE publicizeRecentInputs ()
BEGIN
    DECLARE now BIGINT UNSIGNED DEFAULT UNIX_TIMESTAMP();
    DECLARE userID, catID, instID BIGINT UNSIGNED;
    DECLARE ratVal SMALLINT UNSIGNED;
    DECLARE done BOOL DEFAULT FALSE;
    DECLARE cur CURSOR FOR
        SELECT user_id, cat_id, inst_id, rat_val
        FROM Private_RecentInputs
        WHERE live_at_time <= now
        FOR UPDATE;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;

    loop_1: LOOP
        FETCH cur INTO userID, catID, instID, ratVal;
        IF (done) THEN
            LEAVE loop_1;
        END IF;

        CALL private_insertOrUpdateRatingAndRunBots (
            userID, catID, instID, ratVal
        );

    END LOOP loop_1;

    DELETE FROM Private_RecentInputs
    WHERE live_at_time <= now;
END //
DELIMITER ;


-- TODO: In-comment:
-- DELIMITER //
-- CREATE EVENT publicize_recent_inputs
--     ON SCHEDULE EVERY 30 MINUTE DO
-- BEGIN proc: BEGIN
--     IF (GET_LOCK("publicize_recent_inputs_lock", 0) != 1) THEN
--         LEAVE proc;
--     END IF;
--
--     CALL publicizeRecentInputs ();
--
--     DO RELEASE_LOCK("publicize_recent_inputs_lock");
-- END proc; END //
-- DELIMITER ;
