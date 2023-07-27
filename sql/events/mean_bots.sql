

DELIMITER //
CREATE EVENT mean_with_offset_3_bot
    ON SCHEDULE EVERY 3 SECOND DO
BEGIN proc: BEGIN
    DECLARE lastInput, newestInput, i BIGINT UNSIGNED;
    DECLARE ratVal SMALLINT UNSIGNED;
    DECLARE userID, catID, instID BIGINT UNSIGNED;

    IF (NOT GET_LOCK("mean_with_offset_3_bot_lock", 0)) THEN
        LEAVE proc;
    END IF;

    -- get lastInput and newestInput.
    SELECT data_1 INTO lastInput
    FROM EventData
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

    UPDATE EventData
    SET data_1 = newestInput
    WHERE (
        def_id = 78 AND
        obj_id = 0
    );

    SELECT RELEASE_LOCK("mean_with_offset_3_bot_lock");
END proc; END //
DELIMITER ;
