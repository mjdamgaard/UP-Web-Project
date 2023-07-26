
SET GLOBAL event_scheduler = ON;

DELIMITER //
CREATE EVENT publicize_recent_inputs
    ON SCHEDULE EVERY 3 HOUR DO
BEGIN proc: BEGIN
    DECLARE now BIGINT UNSIGNED;
    SET now = UNIX_TIMESTAMP();

    IF (NOT GET_LOCK("publicize_recent_inputs_lock", 0)) THEN
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
    DECLARE lastInput, newestInput, i BIGINT UNSIGNED;
    DECLARE ratVal SMALLINT UNSIGNED;
    DECLARE userID, catID, instID BIGINT UNSIGNED;

    IF (NOT GET_LOCK("update_semantic_inputs_lock", 0)) THEN
        LEAVE proc;
    END IF;

    -- get lastInput and newestInput.
    SELECT data INTO lastInput
    FROM Aggregates
    WHERE (
        def_id = 78 AND
        obj_id = 0
    );
    SELECT MAX(id) INTO newestInput
    FROM RecentInputs;

    SET i = lastInput + 1;
    loop: LOOP
        IF (newestInput IS NULL OR lastInput > newestInput) THEN
            LEAVE loop;
        END IF;

        -- select the ith latest input.
        SELECT (
            user_id,
            cat_id,
            rat_val,
            inst_id
        )
        INTO (
            userID,
            catID,
            ratVal,
            instID
        )
        FROM RecentInputs
        WHERE id = i;
        -- if the input's rat_val is null, delete the corresponding SemInput.
        IF (ratVal IS NULL) THEN
            DELETE FROM SemanticInputs
            WHERE (
                user_id = userID AND
                cat_id = catID AND
                inst_id = instID
            )
        -- else update the corresponding SemInput with the new rat_val.
        ELSE
            REPLACE INTO SemanticInputs (
                user_id,
                cat_id,
                rat_val,
                inst_id
            )
            VALUES (
                userID,
                catID,
                ratVal,
                instID
            );
        END IF;

        SET i = i + 1;
        ITERATE loop;
    END LOOP loop;

    UPDATE Aggregates
    SET data = newestInput
    WHERE (
        def_id = 78 AND
        obj_id = 0
    );

    RELEASE_LOCK("update_semantic_inputs_lock");
END proc; END //
DELIMITER ;


-- -- write the latest inputs with rat_val != NULL into SemanticInputs.
-- REPLACE INTO SemanticInputs (
--     user_id,
--     cat_id,
--     rat_val,
--     inst_id
-- )
-- SELECT (
--     user_id,
--     cat_id,
--     rat_val,
--     inst_id
-- )
-- FROM RecentInputs
-- WHERE (
--     id > lastInput AND
--     id <= newestInput AND
--     rat_val IS NOT NULL
-- );
--
-- -- for the latest inputs where rat_val IS NULL, delete all the corresponding
-- -- SemanticInputs, even those that has just been replaced. NOTE that with
-- -- this implementation, users should not expect a new rating to necessarily
-- -- go through if it is submitted only seconds after a deletion.
-- DELETE FROM SemanticInputs
-- WHERE EXISTS (
--     SELECT * FROM RecentInputs
--     WHERE (
--         RecentInputs.id > lastInput AND
--         RecentInputs.id <= newestInput AND
--         RecentInputs.rat_val IS NULL AND
--         SemanticInputs.user_id = RecentInputs.user_id AND
--         SemanticInputs.cat_id = RecentInputs.cat_id AND
--         SemanticInputs.inst_id = RecentInputs.inst_id
--     )
-- );



-- loop: LOOP
--     IF (newestInput IS NULL OR lastInput >= newestInput) THEN
--         LEAVE loop;
--     END IF;
--
--     SELECT rat_val INTO prevRatVal
--     FROM SemanticInputs
--     WHERE (
--         user_id = userID AND
--         cat_id = catID AND
--         inst_id = instID
--     )
--     FOR UPDATE;
--
--     IF (ratVal IS NOT NULL AND prevRatVal IS NULL) THEN
--         INSERT INTO SemanticInputs (
--             user_id,
--             cat_id,
--             rat_val,
--             inst_id
--         )
--         VALUES (
--             userID,
--             catID,
--             ratVal,
--             instID
--         );
--         SET exitCode = 0; -- no previous rating.
--     ELSEIF (ratVal IS NOT NULL AND prevRatVal IS NOT NULL) THEN
--         UPDATE SemanticInputs
--         SET rat_val = ratVal
--         WHERE (
--             user_id = userID AND
--             cat_id = catID AND
--             inst_id = instID
--         );
--         SET exitCode = 1; -- a previous rating was updated.
--     ELSEIF (ratVal IS NULL AND prevRatVal IS NOT NULL) THEN
--         DELETE FROM SemanticInputs
--         WHERE (
--             user_id = userID AND
--             cat_id = catID AND
--             inst_id = instID
--         );
--         SET exitCode = 2; -- a previous rating was deleted.
--     ELSE
--         SET exitCode = 3; -- trying to delete a non-existing rating.
--     END IF;
--
--     lastInput = lastInput + 1;
--     ITERATE loop;
-- END LOOP loop;
