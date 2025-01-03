
SELECT "Request procedures";

DROP PROCEDURE insertOrUpdatePublicUserScore;






DELIMITER //
CREATE PROCEDURE _insertOrFindUserGroupMinAndMaxScoreListIDs (
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN userGroupID BIGINT UNSIGNED,
    OUT userGroupMinScoreListID BIGINT UNSIGNED,
    OUT userGroupMaxScoreListID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
proc: BEGIN
    DECLARE userGroupMinScoreListDefStr, userGroupMaxScoreListDefStr
        VARCHAR(700) CHARACTER SET utf8mb4;

    SET userGroupMinScoreListDefStr = CONCAT(
        '@13,@', qualID, ',@', subjID, ',@', userGroupID
    );
    SET userGroupMaxScoreListDefStr = CONCAT(
        '@14,@', qualID, ',@', subjID, ',@', userGroupID
    );

    CALL _insertOrFindFunctionCallEntity (
        requestingUserID, userGroupMinScoreListDefStr, 1,
        userGroupMinScoreListID, exitCode
    );
    IF (exitCode = 5) THEN
        LEAVE proc;
    END IF;
    CALL _insertOrFindFunctionCallEntity (
        requestingUserID, userGroupMaxScoreListDefStr, 1,
        userGroupMaxScoreListID, exitCode
    );
    IF (exitCode = 5) THEN
        LEAVE proc;
    END IF;
END proc //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE _insertUpdateOrDeleteScoreAndWeight (
    IN requestingUserID BIGINT UNSIGNED,
    IN listID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN scoreVal DOUBLE,
    IN weightExp TINYINT, -- nullable if weightVal is provided.
    IN weightVal DOUBLE, -- nullable unless weightExp is not provided.
    IN rollBackOnExcess BOOL,
    OUT exitCode TINYINT
)
BEGIN
    DECLARE prevScoreVal, prevWeightVal, prevWeightSum DOUBLE;
    DECLARE prevWeightExp, isExceeded TINYINT;

    IF (weightExp IS NULL) THEN
        IF (weightVal > 1.1E+10) THEN
            SET weightExp = 127;
        ELSEIF (weightVal < 7.4E-11) THEN
            SET weightExp = -128;
        ELSE
            SET weightExp = ROUND(LOG2(weightVal) / LOG2(1.2));
        END IF;
    END IF;

    SET weightVal = POW(1.2, weightExp);

    -- We select (for update) the previous score on the list, and branch
    -- accordingly in order to update the ListMetadata table correctly.
    START TRANSACTION;


    SELECT weight_sum INTO prevWeightSum
    FROM ListMetadata
    WHERE (
        list_id = listID AND
        subj_id = subjID
    )
    FOR UPDATE;

    SELECT score_val, weight_exp INTO prevScoreVal, prevWeightExp
    FROM FloatScoreAndWeightAggregates
    WHERE (
        list_id = listID AND
        subj_id = subjID
    );

    SET prevWeightVal = POW(1.2, prevWeightExp);

    -- Branch according to whether the score should be inserted, updated, or
    -- deleted, the latter being the case where the scoreVal input is NULL. 
    IF (scoreVal IS NOT NULL AND prevScoreVal IS NULL) THEN
        INSERT INTO FloatScoreAndWeightAggregates (
            list_id, subj_id, score_val, weight_exp 
        ) VALUES (
            listID, subjID, scoreVal, weightExp
        );

        INSERT INTO ListMetadata (
            list_id, list_len, weight_sum
        ) VALUES (
            listID, 1, weightVal
        )
        ON DUPLICATE KEY UPDATE
            list_len = list_len + 1,
            weight_sum = weight_sum + weightVal - prevWeightVal;

        IF (prevWeightSum IS NULL) THEN
            CALL _increaseUserCounters (
                requestingUserID, 0, 33, 1 << 24, isExceeded
            );
        ELSE
            CALL _increaseUserCounters (
                requestingUserID, 0, 20, 1 << 24, isExceeded
            );
        END IF;

        IF (isExceeded AND rollBackOnExcess) THEN
            ROLLBACK;
            SET exitCode = 5; -- a counter was is exceeded.
        ELSE
            COMMIT;
            SET exitCode = 0; -- insert.
        END IF;

    ELSEIF (scoreVal IS NOT NULL AND prevScoreVal IS NOT NULL) THEN
        UPDATE FloatScoreAndWeightAggregates SET
            score_val = scoreVal,
            weight_exp = weightExp
        WHERE (
            list_id = listID AND
            subj_id = subjID
        );
        
        UPDATE ListMetadata SET
            weight_sum = weight_sum + weightVal - prevWeightVal
        WHERE list_id = listID;

        COMMIT;
        SET exitCode = 1; -- update.

    ELSEIF (scoreVal IS NULL AND prevScoreVal IS NOT NULL) THEN
        DELETE FROM FloatScoreAndWeightAggregates
        WHERE (
            list_id = listID AND
            subj_id = subjID
        );
        
        UPDATE ListMetadata SET
            list_len = list_len - 1,
            weight_sum = weight_sum - prevWeightVal
        WHERE list_id = listID;

        COMMIT;
        SET exitCode = 2; -- deletion.
    ELSE
        COMMIT;
        SET exitCode = 3; -- no change.
    END IF;
END //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE _insertUpdateOrDeleteUserGroupMinAndMaxScore (
    IN requestingUserID BIGINT UNSIGNED,
    IN targetUserID BIGINT UNSIGNED,
    IN targetUserWeightExp TINYINT, -- nullable if targetUserWeightVal is there.
    IN targetUserWeightVal DOUBLE, -- nullable if targetUserWeightExp is there.
    IN minScore DOUBLE,
    IN maxScore DOUBLE,
    IN userGroupMinScoreListID BIGINT UNSIGNED,
    IN userGroupMaxScoreListID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
proc: BEGIN
    IF (minScore IS NULL XOR maxScore IS NULL) THEN
        SIGNAL SQLSTATE "45000" SET MESSAGE_TEXT = CONCAT(
            "_insertUpdateOrDeleteUserGroupMinAndMaxScore(): ",
            "minScore IS NULL XOR maxScore IS NULL"
        );
        LEAVE proc;
    END IF;

    CALL _insertUpdateOrDeleteScoreAndWeight (
        requestingUserID,
        userGroupMinScoreListID,
        targetUserID,
        minScore,
        targetUserWeightExp,
        targetUserWeightVal,
        1,
        exitCode
    );

    IF (exitCode = 5) THEN
        LEAVE proc;
    END IF;

    CALL _insertUpdateOrDeleteScoreAndWeight (
        requestingUserID,
        userGroupMaxScoreListID,
        targetUserID,
        maxScore,
        targetUserWeightExp,
        targetUserWeightVal,
        0,
        exitCode
    );
END proc //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE _insertUpdateOrDeleteUserGroupMinAndMaxScoreIfUserIsMember (
    IN requestingUserID BIGINT UNSIGNED,
    IN targetUserID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN userGroupID BIGINT UNSIGNED,
    IN userGroupMinScoreListID BIGINT UNSIGNED,
    IN userGroupMaxScoreListID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
proc: BEGIN
    DECLARE minScore, maxScore DOUBLE;

    -- We first check that the user is in the given user group. If not, make
    -- sure that any existing score of the user is deleted from the two lists.
    SELECT score_val, weight_exp
    INTO targetUserWeight, targetUserWeightWeightExp
    FROM FloatScoreAndWeightAggregates
    WHERE (
        list_id = userGroupID AND
        subj_id = targetUserID
    );

    IF NOT (targetUserWeight > 0 AND targetUserWeightWeightExp >= 13) THEN
        CALL _insertUpdateOrDeleteUserGroupMinAndMaxScore (
            requestingUserID,
            targetUserID,
            NULL,
            targetUserWeight,
            NULL,
            NULL,
            userGroupMinScoreListID,
            userGroupMaxScoreListID,
            exitCode
        );

        SET exitCode = 1; -- user is not a member of the user group.
        LEAVE proc;
    END IF;


    -- If the user is a member, select the minScore and the maxScore.
    SELECT min_score, max_score INTO minScore, maxScore
    FROM PublicUserFloatMinAndMaxScores
    WHERE (
        user_id = targetUserID AND
        qual_id = qualID AND
        subj_id = subjID
    );

    -- And finally we insert or update, or delete (if the public score is
    -- deleted), the min and max scores. (This sub-procedure fails if the
    -- user's data counters is exceeded when inserting the min score, but the
    -- subsequent max score insertion will always succeed if the min score did.)
    CALL _insertUpdateOrDeleteUserGroupMinAndMaxScore (
        requestingUserID,
        targetUserID,
        NULL,
        targetUserWeight,
        minScore,
        maxScore,
        userGroupMinScoreListID,
        userGroupMaxScoreListID,
        exitCode
    );

    IF NOT (exitCode = 5) THEN
        SET exitCode = 0; -- request was carried out.
    END IF;
END proc //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE requestUserGroupMinAndMaxScoreUpdate (
    IN requestingUserID BIGINT UNSIGNED,
    IN targetUserID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN userGroupID BIGINT UNSIGNED
)
proc: BEGIN
    DECLARE minScore, maxScore DOUBLE;
    DECLARE exitCode TINYINT;
    DECLARE userGroupMinScoreListID, userGroupMinScoreListID BIGINT UNSIGNED;

    -- Get (or insert) userGroupMinScoreListID and userGroupMaxScoreListID.
    CALL _insertOrFindUserGroupMinAndMaxScoreListIDs (
        qualID,
        subjID,
        userGroupID,
        userGroupMinScoreListID,
        userGroupMaxScoreListID,
        exitCode
    );
    IF (exitCode = 5) THEN
        SELECT 5 AS exitCode; -- a counter was is exceeded.
        LEAVE proc;
    END IF;

    CALL _insertUpdateOrDeleteUserGroupMinAndMaxScoreIfUserIsMember (
        requestingUserID,
        targetUserID,
        qualID,
        subjID,
        userGroupID,
        userGroupMinScoreListID,
        userGroupMaxScoreListID,
        exitCode
    );
    IF (exitCode = 5) THEN
        SELECT 5 AS exitCode; -- a counter was is exceeded.
        LEAVE proc;
    END IF;

    SELECT 0 AS exitCode; -- request was carried out.
END proc //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE requestFullUserGroupMinAndMaxScoresUpdate (
    IN requestingUserID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN userGroupID BIGINT UNSIGNED
)
proc: BEGIN
    DECLARE minScore, maxScore DOUBLE;
    DECLARE exitCode, done TINYINT;
    DECLARE userGroupMinScoreListID, userGroupMinScoreListID BIGINT UNSIGNED;

    DECLARE cur CURSOR FOR
        SELECT score_val, weight_exp
        FROM FloatScoreAndWeightAggregates
        -- WHERE list_id = userGroupID
        -- ORDER BY subj_id ASC;
        WHERE (
            list_id = userGroupID AND
            score_val > 0
        );
        ORDER BY score_val DESC;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
    DECLARE userWeightVal DOUBLE;
    DECLARE userWeightWeightExp TINYINT;

    -- Get (or insert) userGroupMinScoreListID and userGroupMaxScoreListID.
    CALL _insertOrFindUserGroupMinAndMaxScoreListIDs (
        qualID,
        subjID,
        userGroupID,
        userGroupMinScoreListID,
        userGroupMaxScoreListID,
        exitCode
    );
    IF (exitCode = 5) THEN
        SELECT 5 AS exitCode; -- a counter was is exceeded.
        LEAVE proc;
    END IF;

    -- ...
    OPEN cur;
    SET done = 0;
    loop_1: LOOP
        SET i = i + 1;
        FETCH cur INTO userWeightVal, userWeightWeightExp;
    END LOOP loop_1; 

    SELECT 0 AS exitCode; -- request was carried out.
END proc //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE requestFullExistingUserGroupMinAndMaxScoresUpdate (
    IN requestingUserID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN userGroupID BIGINT UNSIGNED
)
proc: BEGIN

    -- TODO: Implement (by queuing request).

    SELECT 0 AS exitCode; -- request was carried out.
END proc //
DELIMITER ;












-- -- And then we also check whether the subject is on the filter list, with
-- -- a score above 0 and a weight sum above 10.
-- SELECT score_val, weight_exp INTO filterListScore, filterListWeightExp
-- FROM FloatScoreAndWeightAggregates
-- WHERE (
--     list_id = filterListID AND
--     subj_id = subjID
-- );

-- IF NOT (filterListScore > 0 AND filterListWeightExp >= 13) THEN
--     SELECT 2 AS exitCode; -- subject is not on the filter list.
--     LEAVE proc;
-- END IF;







DELIMITER //
CREATE PROCEDURE requestHistogramOfScoreCentersUpdate (
    IN requestingUserID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN userGroupID BIGINT UNSIGNED,
    IN filterListID BIGINT UNSIGNED,
    IN metricID BIGINT UNSIGNED
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
        FROM ListMetadata
        WHERE list_id = scoreContrListID;
    );

    DECLARE metricDefStr VARCHAR(700) DEFAULT (
        SELECT def_str
        FROM Entities
        WHERE id = metricID;
    );

    DECLARE binUserNumber BIGINT UNSIGNED DEFAULT listLen DIV 19;
    DECLARE i BIGINT UNSIGNED DEFAULT 0;
    DECLARE weightSum DOUBLE;

    DECLARE cur CURSOR FOR
        SELECT score_val, user_weight_exp
        FROM ScoreContributors
        WHERE list_id = scoreContrListID
        ORDER BY
            score_val ASC,
            score_width_exp ASC,
            user_weight_exp ASC,
            user_id ASC;
    DECLARE scoreVal DOUBLE;
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
        SELECT 5 AS exitCode; -- a counter was is exceeded.
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
CREATE PROCEDURE _constructHistogramOfScoreCenters (
    IN scoreContrListID BIGINT UNSIGNED,
    IN lowerBound FLOAT,
    IN upperBound FLOAT,
    IN minBinWidth FLOAT,
    IN maxBinWidth FLOAT,
    IN hiResBinNum INT UNSIGNED,
    IN listLen BIGINT UNSIGNED,
    OUT histData VARBINARY(4000)
)
proc: BEGIN
    DECLARE scoreVal, nextBinLimit, userWeight FLOAT;
    DECLARE userWeightExp, done TINYINT DEFAULT 0;
    DECLARE i INT UNSIGNED;
    -- -- Initialize a string where every 20 characters encodes a float number,
    -- -- padded to left with spaces.
    -- DECLARE hiResHistData TEXT DEFAULT (
    --     REPEAT(CONCAT(REPEAT(" ", 19), "0"), hiResBinNum)
    -- );

    DECLARE cur CURSOR FOR
        SELECT score_val, user_weight_exp
        FROM ScoreContributors
        WHERE (
            list_id = scoreContrListID AND
            score_val >= lowerBound AND
            score_val <= upperBound
        )
        ORDER BY
            score_val ASC,
            score_width_exp ASC,
            user_weight_exp ASC,
            user_id ASC;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    CREATE TEMPORARY TABLE histBins (
        bin_ind INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        weight_sum FLOAT NOT NULL DEFAULT 0
    );

    OPEN cur;

    FETCH cur INTO scoreVal, userWeightExp;
    SET nextBinLimit = lowerBound;
    SET i = 1;
    bin_loop: LOOP
        IF (i > hiResBinNum OR done) THEN
            LEAVE bin_loop;
        END IF;

        SET nextBinLimit = nextBinLimit + minBinWidth;

        INSERT IGNORE INTO histBins (bin_ind, weight_sum)
        VALUES (i, 0);

        user_loop: LOOP
            -- If scoreVal exceeds nextBinLimit, or it is null  break out and iterate bin_loop.
            IF (scoreVal > nextBinLimit OR done) THEN
                LEAVE user_loop;
            END IF;

            -- Else add the user's weight to the ith bin.
            SET userWeight = POW(1.2, userWeightExp);
            UPDATE histBins
            SET weight_sum = weight_sum + userWeight
            WHERE bin_ind = i;

            FETCH cur INTO scoreVal, userWeightExp;
            ITERATE user_loop;
        END LOOP user_loop;

        SET i = i + 1;
        ITERATE bin_loop;
    END LOOP bin_loop;

    -- Now that histBins is populated, call a procedure that outputs a lower-
    -- resolution hist_data by gathering bins with a too small weight_sum.
    CALL _getHistData (
        lowerBound, upperBound, minBinWidth, maxBinWidth, hiResBinNum,
        histData
    );
    -- This sub-procedure sets the histData to the desired output, and the
    -- procedure therefore ends here.
END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE _getHistData (
    IN lowerBound FLOAT,
    IN upperBound FLOAT,
    IN minBinWidth FLOAT,
    IN maxBinWidth FLOAT,
    IN hiResBinNum INT UNSIGNED,
    OUT histData VARBINARY(4000)
)
proc: BEGIN
    -- TODO: Implement using histData, which should be populated by a
    -- _constructHistogram...() procedure in the same session.
END proc //
DELIMITER ;





















DELIMITER //
CREATE PROCEDURE _computeMedian (
    IN scoreContrListID BIGINT UNSIGNED,
    IN lowerBound FLOAT,
    IN upperBound FLOAT,
    IN minBinWidth FLOAT,
    IN maxBinWidth FLOAT,
    IN hiResBinNum INT UNSIGNED,
    IN listLen BIGINT UNSIGNED,
    OUT histData VARBINARY(4000)
)
proc: BEGIN
    DECLARE scoreVal, nextBinLimit, userWeight FLOAT;
    DECLARE userWeightExp, done TINYINT DEFAULT 0;
    DECLARE i INT UNSIGNED;
    -- -- Initialize a string where every 20 characters encodes a float number,
    -- -- padded to left with spaces.
    -- DECLARE hiResHistData TEXT DEFAULT (
    --     REPEAT(CONCAT(REPEAT(" ", 19), "0"), hiResBinNum)
    -- );

    DECLARE cur CURSOR FOR
        SELECT score_val, user_weight_exp
        FROM ScoreContributors
        WHERE (
            list_id = scoreContrListID AND
            score_val >= lowerBound AND
            score_val <= upperBound
        )
        ORDER BY
            score_val ASC,
            score_width_exp ASC,
            user_weight_exp ASC,
            user_id ASC;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    CREATE TEMPORARY TABLE histBins (
        bin_ind INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        weight_sum FLOAT NOT NULL DEFAULT 0
    );

    OPEN cur;

    FETCH cur INTO scoreVal, userWeightExp;
    SET nextBinLimit = lowerBound;
    SET i = 1;
    bin_loop: LOOP
        IF (i > hiResBinNum OR done) THEN
            LEAVE bin_loop;
        END IF;

        SET nextBinLimit = nextBinLimit + minBinWidth;

        INSERT IGNORE INTO histBins (bin_ind, weight_sum)
        VALUES (i, 0);

        user_loop: LOOP
            -- If scoreVal exceeds nextBinLimit, or it is null  break out and iterate bin_loop.
            IF (scoreVal > nextBinLimit OR done) THEN
                LEAVE user_loop;
            END IF;

            -- Else add the user's weight to the ith bin.
            SET userWeight = POW(1.2, userWeightExp);
            UPDATE histBins
            SET weight_sum = weight_sum + userWeight
            WHERE bin_ind = i;

            FETCH cur INTO scoreVal, userWeightExp;
            ITERATE user_loop;
        END LOOP user_loop;

        SET i = i + 1;
        ITERATE bin_loop;
    END LOOP bin_loop;

    -- Now that histBins is populated, call a procedure that outputs a lower-
    -- resolution hist_data by gathering bins with a too small weight_sum.
    CALL _getHistData (
        lowerBound, upperBound, minBinWidth, maxBinWidth, hiResBinNum,
        histData
    );
    -- This sub-procedure sets the histData to the desired output, and the
    -- procedure therefore ends here.
END proc //
DELIMITER ;





















DELIMITER //
CREATE PROCEDURE _queueRequest (
    IN userID BIGINT UNSIGNED,
    IN reqType VARCHAR(100),
    IN reqData VARBINARY(2900),
    IN delayTime BIGINT UNSIGNED, -- delay time >> 32 = UNIX timestamp.
    IN uploadDataCost BIGINT UNSIGNED,
    IN compCost BIGINT UNSIGNED,
    OUT isExceeded TINYINT
)
BEGIN
    -- If the insert statement following this handler declaration fails, simply
    -- roll back the transaction.
    DECLARE EXIT HANDLER FOR 1586 -- Duplicate key entry error.
    BEGIN
        ROLLBACK;
    END;

    START TRANSACTION;

    -- The first thing we do is to try to insert the request as a new one, and
    -- if this fails due to a duplicate key entry error, the above exit handler
    -- finishes the procedure.
    INSERT INTO ScheduledRequests (
        req_type, req_data, exec_at
    )
    VALUES (
        reqType, reqData, UNIX_TIMESTAMP() << 32 + initDelayTime
    );

    -- If this insertion succeeds, we then we increase the user's counters,
    -- and if these don't exceed their limits, we commit, and otherwise we
    -- roll back the transaction.
    CALL _increaseUserCounters (
        userID, uploadDataCost, compCost, isExceeded
    );

    IF (isExceeded) THEN
        ROLLBACK;
    ELSE
        COMMIT;
    END IF;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE _executeRequest (
    IN reqType VARCHAR(100),
    IN reqData VARCHAR(255)
)
BEGIN
    CASE reqType
        WHEN "USER_GROUP_SCORE" THEN BEGIN
            DECLARE qualID, subjID, userGroupID, userWeightExp BIGINT UNSIGNED;
            SET qualID = CAST(
                REGEXP_SUBSTR(paths, "[^,]+", 1, 1) AS UNSIGNED
            );
            SET subjID = CAST(
                REGEXP_SUBSTR(paths, "[^,]+", 1, 2) AS UNSIGNED
            );
            SET userGroupID = CAST(
                REGEXP_SUBSTR(paths, "[^,]+", 1, 3) AS UNSIGNED
            );
            SET userWeightExp = CAST(
                REGEXP_SUBSTR(paths, "[^,]+", 1, 4) AS UNSIGNED
            );

            CALL _executeUserGroupScoreUpdateRequest (
                qualID, subjID, userGroupID, userWeightExp
            );
        END
        ELSE BEGIN
            SIGNAL SQLSTATE "45000" SET MESSAGE_TEXT = "Unrecognized reqType";
        END
    END CASE;
END //
DELIMITER ;

