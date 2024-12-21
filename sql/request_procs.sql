
SELECT "Request procedures";

DROP PROCEDURE insertOrUpdatePublicUserScore;






DELIMITER //
CREATE PROCEDURE requestUserGroupScoreUpdate (
    IN requestingUserID BIGINT UNSIGNED,
    IN targetUserID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN userGroupID BIGINT UNSIGNED,
    IN filterListID BIGINT UNSIGNED
)
proc: BEGIN
    DECLARE scoreVal FLOAT;
    DECLARE scoreWidthExp, userWeightExp, isExceeded TINYINT;
    DECLARE uploadDataCost BIGINT UNSIGNED DEFAULT 30;

    -- First we check that the user is in the given user group.
    SELECT user_weight_exp INTO userWeightExp
    FROM UserWeights
    WHERE (
        user_group_id = userGroupID AND
        user_id = targetUserID
    );
    IF (userWeightExp IS NULL) THEN
        SELECT 1 AS exitCode; -- user is not a member of the user group.
        LEAVE proc;
    END IF;

    
    -- If the user is a member, select the scoreVal and the scoreWidthExp. If
    -- these are missing, we exit early as well.
    SELECT score_val, score_width_exp INTO scoreVal, scoreWidthExp
    FROM PublicUserFloatAndWidthScores
    WHERE (
        user_id = targetUserID AND
        qual_id = qualID AND
        subj_id = subjID
    );
    IF (scoreVal IS NULL) THEN
        SELECT 2 AS exitCode; -- user score is missing.
        LEAVE proc;
    END IF;

    -- Then we insert or find the List entity, and increase the uploadDataCost
    -- on find, but roll back the transaction if the upload data exceeds the
    -- weekly limit for the requesting user.
    START TRANSACTION;

    CALL insertOrFindFunctionCallEntity (
        requestingUserID,
        CONCAT(
            '@13,@', qualID, ',@', subjID, ',@', userGroupID,
            CASE filterListID
                WHEN 0 THEN ',null'
                ELSE CONCAT(',@', filterListID)
            END CASE
        ),
        1
    );
    -- Oh, I can't select the output here.. ..But I could just make a wrapper
    -- it that has OUT.. Oh no, I can't do that.. ..I could go the other way,
    -- though.. ..Well, I can change _insertOrFindEntityWithSecKey() (and the
    -- like) not matter what.. ..Hm, I could also just add OUT parameters to
    -- all the API insert procs, and then just not use them in the.. API.. ..Or
    -- should I just wrap them.. or call _insertOrFindEntityWithSecKey()
    -- directly..?

    -- Then we call _increaseUserCounters() to increase the user's counters,
    -- and if some were exceeded, we also exit early.
    CALL _increaseUserCounters (
        requestingUserID, 20, 1 << 24, isExceeded
    );
    IF (isExceeded) THEN
        SELECT 3 AS exitCode; -- a counter was is exceeded.
    END IF;

    -- If successful so far, we then finally insert the score in the
    -- ScoreContributors table
    INSERT INTO ScoreContributors (
        list_id, user_id, score_val, score_width_exp, user_weight_exp
    ) VALUES (
        "...", targetUserID, scoreVal, scoreWidthExp, userWeightExp
    )
    ON DUPLICATE KEY UPDATE
        score_val = scoreVal,
        score_width_exp = scoreWidthExp,
        user_weight_exp = userWeightExp;

    SELECT 0 AS exitCode; -- request was carried out.
END proc //
DELIMITER ;









DELIMITER //
CREATE PROCEDURE _increaseUserCounters (
    IN userID BIGINT UNSIGNED,
    IN uploadData BIGINT UNSIGNED,
    IN compUsage BIGINT UNSIGNED,
    OUT isExceeded TINYINT
)
proc: BEGIN
    DECLARE uploadCount, compCount BIGINT UNSIGNED;
    DECLARE uploadLimit, compLimit BIGINT UNSIGNED;
    DECLARE lastRefreshedAt DATE;
    DECLARE currentDate DATE DEFAULT (CURDATE());
    
    SELECT
        upload_data_this_week + uploadData,
        upload_data_weekly_limit,
        computation_usage_this_week + compUsage,
        computation_usage_weekly_limit,
        last_refreshed_at
    INTO
        uploadCount,
        uploadLimit,
        compCount,
        compLimit,
        lastRefreshedAt
    FROM Private_UserData
    WHERE user_id = userID;

    -- If it has been more than a week since freshing the counters to 0, do so
    -- first. 
    IF (currentDate >= ADDDATE(lastRefreshedAt, INTERVAL 1 WEEK)) THEN
        UPDATE Private_UserData
        SET
            upload_data_this_week = 0,
            computation_usage_this_week = 0,
            last_refreshed_at = currentDate
        WHERE user_id = userID;

        SET uploadCount = uploadData;
        SET compCount = compUsage;
    END IF;

    -- Then check if any limits are exceeded, and return isExceeded = 1 if so
    -- (without updating the user's counters).
    IF (
        uploadCount > uploadLimit OR
        compCount > compLimit
    ) THEN
        SET isExceeded = 1;
        LEAVE proc;
    END IF;

    -- If not, update the counters and return isExceeded = 0.
    UPDATE Private_UserData
    SET
        upload_data_this_week = uploadCount,
        computation_usage_this_week = compCount
    WHERE user_id = userID;

    SET isExceeded = 0;
END proc //
DELIMITER ;




-- DELIMITER //
-- CREATE PROCEDURE _queueRequest (
--     IN userID BIGINT UNSIGNED,
--     IN reqType VARCHAR(100),
--     IN reqData VARBINARY(2900),
--     IN delayTime BIGINT UNSIGNED, -- delay time >> 32 = UNIX timestamp.
--     IN uploadDataCost BIGINT UNSIGNED,
--     IN compCost BIGINT UNSIGNED,
--     OUT isExceeded TINYINT
-- )
-- BEGIN
--     -- If the insert statement following this handler declaration fails, simply
--     -- roll back the transaction.
--     DECLARE EXIT HANDLER FOR 1586 -- Duplicate key entry error.
--     BEGIN
--         ROLLBACK;
--     END;

--     START TRANSACTION;

--     -- The first thing we do is to try to insert the request as a new one, and
--     -- if this fails due to a duplicate key entry error, the above exit handler
--     -- finishes the procedure.
--     INSERT INTO ScheduledRequests (
--         req_type, req_data, exec_at
--     )
--     VALUES (
--         reqType, reqData, UNIX_TIMESTAMP() << 32 + initDelayTime
--     );

--     -- If this insertion succeeds, we then we increase the user's counters,
--     -- and if these don't exceed their limits, we commit, and otherwise we
--     -- roll back the transaction.
--     CALL _increaseUserCounters (
--         userID, uploadDataCost, compCost, isExceeded
--     );

--     IF (isExceeded) THEN
--         ROLLBACK;
--     ELSE
--         COMMIT;
--     END IF;
-- END //
-- DELIMITER ;



-- DELIMITER //
-- CREATE PROCEDURE _executeRequest (
--     IN reqType VARCHAR(100),
--     IN reqData VARCHAR(255)
-- )
-- BEGIN
--     CASE reqType
--         WHEN "USER_GROUP_SCORE" THEN BEGIN
--             DECLARE qualID, subjID, userGroupID, userWeightExp BIGINT UNSIGNED;
--             SET qualID = CAST(
--                 REGEXP_SUBSTR(paths, "[^,]+", 1, 1) AS UNSIGNED
--             );
--             SET subjID = CAST(
--                 REGEXP_SUBSTR(paths, "[^,]+", 1, 2) AS UNSIGNED
--             );
--             SET userGroupID = CAST(
--                 REGEXP_SUBSTR(paths, "[^,]+", 1, 3) AS UNSIGNED
--             );
--             SET userWeightExp = CAST(
--                 REGEXP_SUBSTR(paths, "[^,]+", 1, 4) AS UNSIGNED
--             );

--             CALL _executeUserGroupScoreUpdateRequest (
--                 qualID, subjID, userGroupID, userWeightExp
--             );
--         END
--         ELSE BEGIN
--             SIGNAL SQLSTATE "45000" SET MESSAGE_TEXT = "Unrecognized reqType";
--         END
--     END CASE;
-- END //
-- DELIMITER ;

