
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
    DECLARE scoreWidthExp, userWeightExp, isExceeded, wasDeleted TINYINT;
    DECLARE uploadDataCost BIGINT UNSIGNED 0;
    DECLARE scoreContrListDefStr VARCHAR(700) CHARACTER SET utf8mb4;
    DECLARE scoreContrListID, exitCode BIGINT UNSIGNED;

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

    
    -- If the user is a member, select the scoreVal and the scoreWidthExp.
    SELECT score_val, score_width_exp INTO scoreVal, scoreWidthExp
    FROM PublicUserFloatAndWidthScores
    WHERE (
        user_id = targetUserID AND
        qual_id = qualID AND
        subj_id = subjID
    );

    -- Then we insert or find the List entity, and increase the uploadDataCost
    -- on insertion, but roll back the transaction if the upload data exceeds
    -- the weekly limit for the requesting user.
    START TRANSACTION;
    
    SET scoreContrListDefStr = CONCAT(
        '@13,@', qualID, ',@', subjID, ',@', userGroupID,
        CASE filterListID
            WHEN 0 THEN ',null'
            ELSE CONCAT(',@', filterListID)
        END CASE
    );

    -- TODO: I forgot that _insertOrFindFunctionCallEntity will increase the
    -- upload counter anyway, so correct the following (after also correcting
    -- _insertOrFindFunctionCallEntity).

    CALL _insertOrFindFunctionCallEntity (
        requestingUserID, scoreContrListDefStr, 1,
        scoreContrListID, exitCode
    );

    IF (exitCode = 0) THEN
        SET uploadDataCost = uploadDataCost +
            LENGTH(scoreContrListDefStr) + 20
    END IF;

    -- If the score is deleted/missing, make sure that it is removed from the
    -- score contributors list, and exit.
    IF (scoreVal IS NULL) THEN
        ROLLBACK;

        DELETE FROM ScoreContributors
        WHERE (
            listID = scoreContrListID AND
            user_id = targetUserID
        );
        SET wasDeleted = ROW_COUNT();

        IF (wasDeleted) THEN
            UPDATE EntityListMetadata
            SET list_len = list_len - 1
            WHERE list_id = scoreContrListID;
        END IF;

        SELECT 0 AS exitCode; -- request was carried out (score deleted).
        LEAVE proc;
    ELSE
        SET uploadDataCost = uploadDataCost + 30;
    END IF;

    -- If not, then we call _increaseUserCounters() to increase the user's
    -- counters, and if some were exceeded, we also exit early.
    CALL _increaseUserCounters (
        requestingUserID, 20, 1 << 24, isExceeded
    );
    IF (isExceeded) THEN
        ROLLBACK;
        SELECT 2 AS exitCode; -- a counter was is exceeded.
        LEAVE proc;
    END IF;

    COMMIT;

    -- If successful so far, we then finally insert the score in the
    -- ScoreContributors table
    INSERT INTO ScoreContributors (
        list_id, user_id, score_val, score_width_exp, user_weight_exp
    ) VALUES (
        scoreContrListID, targetUserID, scoreVal, scoreWidthExp, userWeightExp
    )
    ON DUPLICATE KEY UPDATE
        score_val = scoreVal,
        score_width_exp = scoreWidthExp,
        user_weight_exp = userWeightExp;

    -- And we also remember to update the list's length.
    INSERT INTO EntityListMetadata (
        list_id, list_len
    ) VALUES (
        scoreContrListID, 1
    )
    ON DUPLICATE KEY UPDATE
        list_len = list_len + 1;

    SELECT 0 AS exitCode; -- request was carried out.
END proc //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE requestHistogramOfScoreCentersUpdate (
    IN requestingUserID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN userGroupID BIGINT UNSIGNED,
    IN lowerBoundLiteral VARCHAR(255),
    IN upperBoundLiteral VARCHAR(255),
    IN filterListID BIGINT UNSIGNED
)
proc: BEGIN
    DECLARE scoreContrListDefStr VARCHAR(700) CHARACTER SET utf8mb4 DEFAULT (
        CONCAT(
            '@13,@', qualID, ',@', subjID, ',@', userGroupID,
            CASE filterListID
                WHEN 0 THEN ',null'
                ELSE CONCAT(',@', filterListID)
            END CASE
        )
    );
    DECLARE scoreContrListID BIGINT UNSIGNED DEFAULT (
        SELECT ent_id
        FROM EntitySecKeys
        WHERE (
            type_ident = "c",
            user_whitelist_id = 0,
            def_key = scoreContrListDefStr
        )
    );

    DECLARE listLen BIGINT UNSIGNED DEFAULT (
        SELECT list_len
        FROM EntityListMetadata
        WHERE list_id = scoreContrListID;
    );

    DECLARE binUserNumber BIGINT UNSIGNED DEFAULT listLen DIV 19;
    DECLARE i BIGINT UNSIGNED DEFAULT 0;
    DECLARE weightSum FLOAT;

    DECLARE cur CURSOR FOR
        SELECT score_val, user_weight_exp
        FROM ScoreContributors
        WHERE list_id = scoreContrListID
        ORDER BY
            score_val ASC,
            score_width_exp ASC,
            user_weight_exp ASC,
            user_id ASC;
    DECLARE scoreVal FLOAT;
    DECLARE userWeightExp TINYINT;

    DECLARE uploadDataCost BIGINT UNSIGNED DEFAULT CASE WHEN (
        SELECT hist_data
        FROM ScoreHistograms
        WHERE (
            hist_fun_id = 14 AND
            lower_bound_literal = lowerBoundLiteral AND
            upper_bound_literal = upperBoundLiteral AND
            score_contributor_list_id = scoreContrListID
        )
        IS NULL
    ) THEN
        200 -- TODO: Correct.
    ELSE
        0
    END CASE;

    -- First check that the user has enough upload data and computation usage
    -- available.
    CALL _increaseUserCounters (
        requestingUserID, uploadDataCost, (listLen DIV 4000) << 5,
        -- TODO: All these compCosts are just loose guesses for now. Correct
        -- them at some point.
        isExceeded
    );
    IF (isExceeded) THEN
        SELECT 2 AS exitCode; -- a counter was is exceeded.
        LEAVE proc;
    END IF;

    -- If they do, open the cursor and start constructing the histogram.
    OPEN cur;

    loop_1: LOOP
        SET i = i + 1;
        FETCH cur INTO scoreVal, userWeightExp;
    END LOOP loop_1; 

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

