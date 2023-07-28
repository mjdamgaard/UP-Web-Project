

-- DROP PROCEDURE updateMeanBotInputs;
-- DROP EVENT update_mean_bot_inputs;
--
-- DROP PROCEDURE updateMeanWithOffset3Bot
;

DELIMITER //
CREATE PROCEDURE updateMeanBotInputs ()
BEGIN proc: BEGIN
    DECLARE lastInput, newestInput, i, stmtID BIGINT UNSIGNED;
    DECLARE ratVal SMALLINT UNSIGNED;
    DECLARE userID, catID, instID BIGINT UNSIGNED;

    -- TODO: In-comment:
    -- IF (NOT GET_LOCK("update_mean_bot_inputs_lock", 0)) THEN
    --     LEAVE proc;
    -- END IF;

    -- get lastInput and newestInput.
    SELECT data_1 INTO lastInput
    FROM EventData
    WHERE (
        def_id = 87 AND
        obj_id = 0
    );
    SELECT MAX(id) INTO newestInput
    FROM RecentInputs;

    SET i = lastInput + 1;
    loop: LOOP
        IF (newestInput IS NULL OR i > newestInput) THEN
            LEAVE loop;
        END IF;

        -- select the ith latest input.
        SELECT
            user_id,
            cat_id,
            rat_val,
            inst_id
        INTO
            userID,
            catID,
            ratVal,
            instID
        FROM RecentInputs
        WHERE id = i;
        -- select Statement entity.
        SELECT id INTO stmtID
        FROM Entities
        WHERE (
            type_id = 75 AND
            cxt_id <=> 76 AND
            def_str = CONCAT("#", instID, "|#", catID)
        );
        -- TODO: Out-comment this if statement only if it is ensured that
        -- update_semantic_inputs always runs before this event:
        -- if it does not exist, insert it and get the ID.
        IF (stmtID IS NULL) THEN
            INSERT IGNORE INTO Entities (type_id, cxt_id, def_str)
            VALUES (75, 76, CONCAT("#", instID, "|#", catID));
            SELECT LAST_INSERT_ID() INTO stmtID;
            -- if a race condition means that the insert is ignored and stmtID
            -- is null, select the now added (by another process) Statement.
            IF (stmtID IS NULL) THEN
                SELECT id INTO stmtID
                FROM Entities
                WHERE (
                    type_id = 75 AND
                    cxt_id <=> 76 AND
                    def_str = CONCAT("#", instID, "|#", catID)
                );
            END IF;
        END IF;
        -- update all mean bots for this ith input.
        CALL updateMeanWithOffset3Bot (userID, catID, instID, ratVal, stmtID);

        SET i = i + 1;
        ITERATE loop;
    END LOOP loop;

    UPDATE EventData
    SET data_1 = newestInput
    WHERE (
        def_id = 87 AND
        obj_id = 0
    );

    -- TODO: In-comment:
    -- DO RELEASE_LOCK("mean_with_offset_3_bot_lock");
END proc; END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE updateMeanWithOffset3Bot (
    IN userID BIGINT UNSIGNED,
    IN catID BIGINT UNSIGNED,
    IN instID BIGINT UNSIGNED,
    IN prevRatVal SMALLINT UNSIGNED,
    IN newRatVal SMALLINT UNSIGNED,
    IN stmtID BIGINT UNSIGNED
)
BEGIN proc: BEGIN
    DECLARE prevMeanHP, userNum, ratValHP, newMeanHP BIGINT UNSIGNED;
    DECLARE newMean SMALLINT UNSIGNED;

    -- get previous high-precision mean and the number of users for the
    -- statement.
    SELECT data_1, data_2 INTO prevMeanHP, userNum
    FROM EventData
    WHERE (
        def_id = 86 AND
        obj_id = stmtID
    );
    -- if this is the first input for the statement, initialize a neutral mean
    -- with an offset of what amounts to 3 neutral ratings.
    IF (data_1 IS NULL) THEN
        SET prevMeanHP =  9223372036854775807;
        SET userNum = 3;
        INSERT INTO EventData (def_id, obj_id, data_1, data_2)
        VALUES (86, stmtID, prevMeanHP, userNum);
        -- (There should be no race condition here.)
    END IF;
    -- compute the high-precision rating value.
    -- ...
    
END proc; END //
DELIMITER ;

DELIMITER //
CREATE EVENT update_mean_bot_inputs
    ON SCHEDULE EVERY 3 SECOND DO
BEGIN
    CALL updateMeanBotInputs ();
END //
DELIMITER ;

-- TODO: Remove:
DROP EVENT update_mean_bot_inputs;
