
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
    DECLARE scoreMin, scoreMax, userWeight, prevUserWeight FLOAT;
    DECLARE filterListScore, filterListWeight FLOAT;
    DECLARE userWeightExp, prevUserWeightExp, isExceeded, wasDeleted TINYINT;
    DECLARE filterListWeightExp TINYINT;
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

    SET userWeight = POW(1.2, userWeightExp);

    -- And then we also check whether the subject is on the filter list, with
    -- a score above 0 and a weight sum above 10.
    SELECT score_val, weight_exp INTO filterListScore, filterListWeightExp
    FROM FloatScoreAndWeightAggregates
    WHERE (
        list_id = filterListID AND
        subj_id = subjID
    );
    SET filterListWeight = POW(1.2, filterListWeightExp);

    IF NOT (filterListScore > 0 AND filterListWeight >= 10) THEN
        SELECT 2 AS exitCode; -- subject is not on the filter list.
        LEAVE proc;
    END IF;

    
    -- If the user is a member, select the scoreMin and the scoreMax.
    SELECT score_min, score_max INTO scoreMin, scoreMax
    FROM PublicUserFloatMinAndMaxScores
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

    CALL _insertOrFindFunctionCallEntity (
        requestingUserID, scoreContrListDefStr, 1,
        scoreContrListID, exitCode
    );

    IF (exitCode = 5) THEN
        SELECT 5 AS exitCode; -- a counter was is exceeded.
        LEAVE proc;
    END IF;

    -- Get the previous user weight.
    SELECT user_weight_exp INTO prevUserWeightExp
    FROM ScoreContributors
    WHERE (
        listID = scoreContrListID AND
        user_id = targetUserID
    );

    IF (prevUserWeightExp IS NOT NULL) THEN
        SET prevUserWeight = POW(1.2, prevUserWeightExp);
    ELSE
        SET prevUserWeight = 0;
    END IF;

    -- If the score is deleted/missing, make sure that it is removed from the
    -- score contributors list, and exit.
    IF (scoreMin IS NULL) THEN
        ROLLBACK;

        DELETE FROM ScoreContributors
        WHERE (
            listID = scoreContrListID AND
            user_id = targetUserID
        );
        SET wasDeleted = ROW_COUNT();

        IF (wasDeleted) THEN
            UPDATE EntityListMetadata
            SET
                list_len = list_len - 1,
                weight_sum = weight_sum - prevUserWeight
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
        requestingUserID, 0, 20, 1 << 24, isExceeded
    );
    IF (isExceeded) THEN
        ROLLBACK;
        SELECT 5 AS exitCode; -- a counter was is exceeded.
        LEAVE proc;
    END IF;

    COMMIT;

    -- If successful so far, we then finally insert the score in the
    -- ScoreContributors table
    INSERT INTO ScoreContributors (
        list_id, user_id, score_min, score_max, user_weight_exp
    ) VALUES (
        scoreContrListID, targetUserID, scoreMin, scoreMax, userWeightExp
    )
    ON DUPLICATE KEY UPDATE
        score_min = scoreMin,
        score_max = scoreMax,
        user_weight_exp = userWeightExp;

    -- And we also remember to update the list's length and weight sum.
    INSERT INTO EntityListMetadata (
        list_id, list_len, weight_sum
    ) VALUES (
        scoreContrListID, 1, userWeight
    )
    ON DUPLICATE KEY UPDATE
        list_len = list_len + 1,
        weight_sum = weight_sum + userWeight - prevUserWeight;

    SELECT 0 AS exitCode; -- request was carried out.
END proc //
DELIMITER ;




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
        FROM EntityListMetadata
        WHERE list_id = scoreContrListID;
    );

    DECLARE metricDefStr VARCHAR(700) DEFAULT (
        SELECT def_str
        FROM Entities
        WHERE id = metricID;
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

