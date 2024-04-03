
SELECT "Bots: Mean bots";

DROP PROCEDURE updateMeanBots;

DROP PROCEDURE updateMeanWithOffset3Bot;

DELIMITER //
CREATE PROCEDURE updateMeanBots (
    IN userID BIGINT UNSIGNED, -- (unused for now)
    IN tagID BIGINT UNSIGNED,
    IN instID BIGINT UNSIGNED,
    IN ratVal SMALLINT UNSIGNED,
    IN prevRatVal SMALLINT UNSIGNED,
    IN stmtID BIGINT UNSIGNED
)
BEGIN
    CALL updateMeanWithOffset3Bot (
        tagID, instID, ratVal, prevRatVal, stmtID
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE updateMeanWithOffset3Bot (
    IN tagID BIGINT UNSIGNED,
    IN instID BIGINT UNSIGNED,
    IN ratVal SMALLINT UNSIGNED,
    IN prevRatVal SMALLINT UNSIGNED,
    IN stmtID BIGINT UNSIGNED
)
BEGIN
    DECLARE prevMeanHP, newMeanHP, ratValHP, prevRatValHP BIGINT UNSIGNED;
    DECLARE prevUserNum, newUserNum BIGINT UNSIGNED;
    DECLARE newMean SMALLINT UNSIGNED;

    -- get previous high-precision mean and the number of users for the
    -- statement.
    SELECT data_1, data_2 INTO prevMeanHP, prevUserNum
    FROM BotData1e2d
    WHERE (
        bot_id = 62 AND -- ID of the "mean_with_offset_3_bot."
        ent_id = stmtID
    )
    FOR UPDATE;
    -- if this is the first input for the statement, initialize a neutral mean
    -- with an offset of what amounts to 3 neutral ratings.
    IF (prevMeanHP IS NULL) THEN
        SET prevMeanHP =  9223372036854775807;
        SET prevUserNum = 3;
        INSERT INTO BotData1e2d (bot_id, ent_id, data_1, data_2)
        VALUES (62, stmtID, prevMeanHP, prevUserNum);
        SELECT data_1, data_2 INTO prevMeanHP, prevUserNum
        FROM BotData1e2d
        WHERE (
            bot_id = 62 AND
            ent_id = stmtID
        )
        FOR UPDATE;
    END IF;
    -- compute the high-precision rating values.
    SET ratValHP = ratVal << (6 * 8);
    SET prevRatValHP = prevRatVal << (6 * 8);
    -- branch and compute the new high-precision mean and the new user number.
    IF (prevRatVal IS NULL AND ratVal IS NOT NULL) THEN
        -- compute newMeanHP as the new arithmetic mean from the previous one.
        SET newMeanHP = prevMeanHP DIV (prevUserNum + 1) * prevUserNum +
            ratValHP DIV (prevUserNum + 1);
        -- increase the user number by one.
        SET newUserNum = prevUserNum + 1;
    ELSEIF (prevRatVal IS NULL AND ratVal IS NULL) THEN
        -- make no changes to newMeanHP and the user number.
        SET newMeanHP = prevMeanHP;
        SET newUserNum = prevUserNum;
    ELSEIF (prevRatVal IS NOT NULL AND ratVal IS NOT NULL) THEN
        -- compute newMeanHP as the new arithmetic mean from the previous one.
        IF (ratVal >= prevRatVal) THEN
            SET newMeanHP = prevMeanHP +
                (ratValHP - prevRatValHP) DIV prevUserNum;
        ELSE
            SET newMeanHP = prevMeanHP -
                (prevRatValHP - ratValHP) DIV prevUserNum;
        END IF;
        -- make no changes to the user number.
        SET newUserNum = prevUserNum;
    ELSE -- IF (prevRatVal IS NOT NULL AND ratVal IS NULL) THEN
        -- compute newMeanHP as the new arithmetic mean from the previous one.
        SET newMeanHP = (prevMeanHP - prevRatValHP DIV prevUserNum)
            DIV (prevUserNum - 1) * prevUserNum;
        -- decrease the user number by one.
        SET newUserNum = prevUserNum - 1;
    END IF;
    -- compute the new normal-precision mean.
    SET newMean = newMeanHP >> (6 * 8);

    -- update the bot's input set.
    REPLACE INTO SemanticInputs (
        user_id,
        tag_id,
        rat_val,
        inst_id
    )
    VALUES (
        62,
        tagID,
        newMean,
        instID
    );
    -- update the bot's data for the statement.
    REPLACE INTO BotData1e2d (bot_id, ent_id, data_1, data_2)
    VALUES (62, stmtID, newMeanHP, newUserNum);
END //
DELIMITER ;
