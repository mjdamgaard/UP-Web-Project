
SELECT "Request procedures";

DROP PROCEDURE insertOrUpdatePublicUserScore;






DELIMITER //
CREATE PROCEDURE _insertOrFindScoreContributionListIDs (
    IN requestingUserID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN userGroupID BIGINT UNSIGNED,
    OUT minScoreContrListID BIGINT UNSIGNED,
    OUT maxScoreContrListID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
proc: BEGIN
    DECLARE minScoreContrListDefStr, maxScoreContrListDefStr
        VARCHAR(700) CHARACTER SET utf8mb4;

    SET minScoreContrListDefStr = CONCAT(
        '@13,@', qualID, ',@', subjID, ',@', userGroupID
    );
    SET maxScoreContrListDefStr = CONCAT(
        '@14,@', qualID, ',@', subjID, ',@', userGroupID
    );

    CALL _insertOrFindFunctionCallEntity (
        requestingUserID, minScoreContrListDefStr, 1,
        minScoreContrListID, exitCode
    );
    IF (exitCode = 5) THEN
        LEAVE proc;
    END IF;
    CALL _insertOrFindFunctionCallEntity (
        requestingUserID, maxScoreContrListDefStr, 1,
        maxScoreContrListID, exitCode
    );
    IF (exitCode = 5) THEN
        LEAVE proc;
    END IF;
END proc //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE _insertUpdateOrDeleteScoreAndWeight (
    IN listID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN scoreVal DOUBLE,
    IN weightExp TINYINT, -- nullable if weightVal is provided.
    IN weightVal DOUBLE, -- nullable unless weightExp is not provided.
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
            list_id, list_len, weight_sum,
            pos_score_list_len,
            -- TODO: Implement:
            -- short_lived_pos_score_points
        ) VALUES (
            listID, 1, weightVal,
            CASE WHEN scoreVal > 0 THEN 1         ELSE 0 END CASE
        )
        ON DUPLICATE KEY UPDATE
            list_len = list_len + 1,
            weight_sum = weight_sum + weightVal - prevWeightVal,
            pos_score_list_len = CASE WHEN scoreVal > 0 THEN
                pos_score_list_len + 1
            ELSE
                pos_score_list_len
            END CASE;

        COMMIT;
        SET exitCode = 0; -- insert.

    ELSEIF (scoreVal IS NOT NULL AND prevScoreVal IS NOT NULL) THEN
        UPDATE FloatScoreAndWeightAggregates SET
            score_val = scoreVal,
            weight_exp = weightExp
        WHERE (
            list_id = listID AND
            subj_id = subjID
        );
        
        UPDATE ListMetadata SET
            weight_sum = weight_sum + weightVal - prevWeightVal,
            pos_score_list_len = pos_score_list_len +
                CASE
                    WHEN (scoreVal > 0 AND prevScoreVal <= 0) THEN
                        1
                    WHEN (scoreVal <= 0 AND prevScoreVal > 0) THEN
                        -1
                    ELSE
                        0
                END CASE
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
            weight_sum = weight_sum - prevWeightVal,
            pos_score_list_len = pos_score_list_len +
                CASE
                    WHEN (prevScoreVal > 0) THEN
                        -1
                    ELSE
                        0
                END CASE
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
CREATE PROCEDURE _insertUpdateOrDeleteScoreContributionWithInputScores (
    IN targetUserID BIGINT UNSIGNED,
    IN targetUserWeightExp TINYINT, -- nullable if targetUserWeightVal is there.
    IN targetUserWeightVal DOUBLE, -- nullable if targetUserWeightExp is there.
    IN minScore DOUBLE,
    IN maxScore DOUBLE,
    IN minScoreContrListID BIGINT UNSIGNED,
    IN maxScoreContrListID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
proc: BEGIN
    IF (minScore IS NULL XOR maxScore IS NULL) THEN
        SIGNAL SQLSTATE "45000" SET MESSAGE_TEXT = CONCAT(
            "_insertUpdateOrDeleteScoreContributionWithInputScores(): ",
            "minScore IS NULL XOR maxScore IS NULL"
        );
        LEAVE proc;
    END IF;

    CALL _insertUpdateOrDeleteScoreAndWeight (
        minScoreContrListID,
        targetUserID,
        minScore,
        targetUserWeightExp,
        targetUserWeightVal,
        exitCode
    );

    CALL _insertUpdateOrDeleteScoreAndWeight (
        maxScoreContrListID,
        targetUserID,
        maxScore,
        targetUserWeightExp,
        targetUserWeightVal,
        exitCode
    );
END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE _insertUpdateOrDeleteScoreContribution (
    IN targetUserID BIGINT UNSIGNED,
    IN targetUserWeightExp TINYINT, -- nullable if targetUserWeightVal is there.
    IN targetUserWeightVal DOUBLE, -- nullable if targetUserWeightExp is there.
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN minScoreContrListID BIGINT UNSIGNED,
    IN maxScoreContrListID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
proc: BEGIN
    DECLARE minScore, maxScore DOUBLE;

    -- Select the minScore and the maxScore.
    SELECT min_score, max_score INTO minScore, maxScore
    FROM PublicUserFloatMinAndMaxScores
    WHERE (
        user_id = targetUserID AND
        qual_id = qualID AND
        subj_id = subjID
    );

    CALL _insertUpdateOrDeleteScoreAndWeight (
        minScoreContrListID,
        targetUserID,
        minScore,
        targetUserWeightExp,
        targetUserWeightVal,
        exitCode
    );
    CALL _insertUpdateOrDeleteScoreAndWeight (
        maxScoreContrListID,
        targetUserID,
        maxScore,
        targetUserWeightExp,
        targetUserWeightVal,
        exitCode
    );
END proc //
DELIMITER ;



-- This sub-procedure also deletes any existing score contribution if the user
-- is no longer a member. 
DELIMITER //
CREATE PROCEDURE _insertUpdateOrDeleteScoreContributionWithInputScoresIfMember (
    IN targetUserID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN userGroupID BIGINT UNSIGNED,
    IN minScoreContrListID BIGINT UNSIGNED,
    IN maxScoreContrListID BIGINT UNSIGNED,
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
        CALL _insertUpdateOrDeleteScoreContributionWithInputScores (
            targetUserID,
            NULL,
            targetUserWeight,
            NULL, -- 'NULL, NULL' here means deletion.
            NULL,
            minScoreContrListID,
            maxScoreContrListID,
            exitCode
        );

        SET exitCode = 1; -- user is not a member of the user group.
        LEAVE proc;
    END IF;

    -- And finally we insert or update, or delete (if the public score is
    -- deleted), the min and max scores.
    CALL _insertUpdateOrDeleteScoreContribution (
        targetUserID,
        NULL,
        targetUserWeight,
        qualID,
        subjID,
        minScoreContrListID,
        maxScoreContrListID,
        exitCode
    );

    IF NOT (exitCode = 5) THEN
        SET exitCode = 0; -- request was carried out.
    END IF;
END proc //
DELIMITER ;













-- With the most basic sub-procedures here above, we can now make the most
-- basic request to add a user's public score to a score contribution list
-- (for a given user group, i.e.).

DELIMITER //
CREATE PROCEDURE requestUpdateOfScoreContribution (
    IN requestingUserID BIGINT UNSIGNED,
    IN targetUserID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN userGroupID BIGINT UNSIGNED
)
proc: BEGIN
    DECLARE minScore, maxScore DOUBLE;
    DECLARE exitCode, isExceeded TINYINT;
    DECLARE minScoreContrListID, minScoreContrListID BIGINT UNSIGNED;

    -- Get (or insert) minScoreContrListID and maxScoreContrListID.
    CALL _insertOrFindScoreContributionListIDs (
        requestingUserID,
        qualID,
        subjID,
        userGroupID,
        minScoreContrListID,
        maxScoreContrListID,
        exitCode
    );
    IF (exitCode = 5) THEN
        SELECT 5 AS exitCode; -- a counter was is exceeded.
        LEAVE proc;
    END IF;

    -- Increase counters due to a (potential) score contribution insert, and
    -- also potentially a ListMetadata insert.
    CALL _increaseUserCounters (
        requestingUserID, 0, 40, 1 << 24, isExceeded
    );
    IF (isExceeded) THEN
        SELECT 5 AS exitCode; -- a counter was is exceeded.
        LEAVE proc;
    END IF;

    CALL _insertUpdateOrDeleteScoreContributionWithInputScoresIfMember (
        targetUserID,
        qualID,
        subjID,
        userGroupID,
        minScoreContrListID,
        maxScoreContrListID,
        exitCode
    );
    IF (exitCode = 5) THEN
        SELECT 5 AS exitCode; -- a counter was is exceeded.
        LEAVE proc;
    END IF;

    UPDATE ListMetadata SET
        paid_upload_data_cost = paid_upload_data_cost + 20
    WHERE (
        list_id = minScoreContrListID OR
        list_id = maxScoreContrListID
    )

    SELECT 0 AS exitCode; -- request was carried out.
END proc //
DELIMITER ;














-- Here are then some sub-procedures to update many score contributions at
-- once. The first one here loops through an ENTIRE user group and checks if
-- any of the users have some scores to contribute (or update) here. The second
-- one just below this one only updates score contributions that already exists
-- on the minScoreContrList (or equivalently on the maxScore...List).

DELIMITER //
CREATE PROCEDURE _updateScoreContributionsForWholeUserGroup (
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN userGroupID BIGINT UNSIGNED,
    IN minScoreContrListID BIGINT UNSIGNED,
    IN maxScoreContrListID BIGINT UNSIGNED
)
proc: BEGIN
    DECLARE exitCode, done TINYINT;

    DECLARE cur CURSOR FOR
        SELECT score_val, weight_exp, subj_id
        FROM FloatScoreAndWeightAggregates
        WHERE (
            list_id = userGroupID AND
            score_val > 0
        )
        ORDER BY
            score_val DESC,
            weight_exp DESC,
            subj_id DESC;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
    DECLARE userWeightVal DOUBLE;
    DECLARE userWeightWeightExp TINYINT;
    DECLARE memberID BIGINT UNSIGNED;

    -- Loop through all members of a group and add any score contributions from
    -- them.
    OPEN cur;
    SET done = 0;
    loop_1: LOOP
        IF (done) THEN
            LEAVE loop_1;
        END IF;

        FETCH cur INTO userWeightVal, userWeightWeightExp, memberID;

        IF (userWeightWeightExp >= 13) THEN
            CALL _insertUpdateOrDeleteScoreContribution (
                memberID,
                NULL,
                userWeightVal,
                qualID,
                subjID,
                minScoreContrListID,
                maxScoreContrListID,
                exitCode
            );
        END IF;

        ITERATE loop_1;
    END LOOP loop_1;
    CLOSE cur;
END proc //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE _updateAllExistingScoreContributions (
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN userGroupID BIGINT UNSIGNED,
    IN minScoreContrListID BIGINT UNSIGNED
)
proc: BEGIN
    DECLARE exitCode, done TINYINT;

    DECLARE cur CURSOR FOR
        SELECT subj_id
        FROM FloatScoreAndWeightAggregates
        WHERE list_id = minScoreContrListID;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
    DECLARE memberID BIGINT UNSIGNED;


    -- Loop through all contributions on the minScoreContrList, and for
    -- each user on there, call _insertUpdate...IfMember().
    OPEN cur;
    SET done = 0;
    loop_1: LOOP
        IF (done) THEN
            LEAVE loop_1;
        END IF;

        FETCH cur INTO memberID;

        CALL _insertUpdateOrDeleteScoreContributionWithInputScoresIfMember (
            memberID,
            qualID,
            subjID,
            userGroupID,
            minScoreContrListID,
            maxScoreContrListID,
            exitCode
        );

        ITERATE loop_1;
    END LOOP loop_1;
    CLOSE cur;
END proc //
DELIMITER ;







-- We can now turn these two sub-procedures into requests. As with all requests
-- that requires looping through entire lists, we'll make each request include
-- a partial payment input ("payment" in terms of the "user counters"), and only
-- once enough has been paid (or if the resources are there) will the update
-- request be carried out. So these procedures thus only queues the requests,
-- in wait for some 'scheduled event' worker threads to pick them up and carry
-- them out.


DELIMITER //
CREATE PROCEDURE requestUpdateOfScoreContributionsForWholeUserGroup (
    IN requestingUserID BIGINT UNSIGNED,
    IN compCostPayment FLOAT,
    IN uploadDataCostPayment FLOAT,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN userGroupID BIGINT UNSIGNED
)
proc: BEGIN
    DECLARE exitCode, isExceeded TINYINT;
    DECLARE minScoreContrListID, minScoreContrListID BIGINT UNSIGNED;
    DECLARE reqType VARCHAR(100) DEFAULT "SCORE_CONTR_WHOLE_USER_GROUP";
    DECLARE reqData VARCHAR(255);
    DECLARE compCostRequired, uploadDataCostRequired FLOAT;
    DECLARE userGroupListLen, curScoreContrListLen BIGINT UNSIGNED;


    CALL _increaseUserCounters (
        requestingUserID, 0, uploadDataCostPayment, compCostPayment, isExceeded
    );
    IF (isExceeded) THEN
        SELECT 5 AS exitCode; -- a counter was is exceeded.
        LEAVE proc;
    END IF;

    -- Get (or insert) minScoreContrListID and maxScoreContrListID.
    CALL _insertOrFindScoreContributionListIDs (
        requestingUserID,
        qualID,
        subjID,
        userGroupID,
        minScoreContrListID,
        maxScoreContrListID,
        exitCode
    );
    IF (exitCode = 5) THEN
        SELECT 5 AS exitCode; -- a counter was is exceeded.
        LEAVE proc;
    END IF;

    SET reqData = CONCAT(
        qualID, ",", subjID, ",", userGroupID, ",",
        minScoreContrListID, ",", maxScoreContrListID
    );

    SELECT pos_score_list_len INTO userGroupListLen
    FROM ListMetadata
    WHERE list_id = userGroupID;

    -- TODO: Correct this estimation (quick guess) of the computation cost.
    SET compCostRequired = CEIL(userGroupListLen * 14 / 4000) * 10;

    SELECT list_len INTO curScoreContrListLen
    FROM ListMetadata
    WHERE list_id = minScoreContrListID;

    -- For the required upload data cost, let's just use an optimistic guess,
    -- assuming that curScoreContrListLen will only double at most, or add
    -- ~100 contributions. Then once the actual list is formed, we can always
    -- elect to delete it if the fraction_of_upload_data_cost_paid is much less
    -- than 1.
    SET uploadDataCostRequired = curScoreContrListLen * 40 + 100;

    CALL _queueOrUpdateRequest (
        reqType,
        reqData,
        compCostPayment,
        uploadDataCostPayment,
        compCostRequired,
        uploadDataCostRequired
    );

    SELECT 0 AS exitCode; -- request was queued.
END proc //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE requestUpdateOfAllExistingScoreContributions (
    IN requestingUserID BIGINT UNSIGNED,
    IN compCostPayment FLOAT,
    IN uploadDataCostPayment FLOAT,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN userGroupID BIGINT UNSIGNED
)
proc: BEGIN
    DECLARE exitCode, isExceeded TINYINT;
    DECLARE minScoreContrListID, minScoreContrListID BIGINT UNSIGNED;
    DECLARE reqType VARCHAR(100) DEFAULT "SCORE_CONTR_ALL_EXISTING";
    DECLARE reqData VARCHAR(255);
    DECLARE compCostRequired, uploadDataCostRequired FLOAT;
    DECLARE userGroupListLen, curScoreContrListLen BIGINT UNSIGNED;


    CALL _increaseUserCounters (
        requestingUserID, 0, uploadDataCostPayment, compCostPayment, isExceeded
    );
    IF (isExceeded) THEN
        SELECT 5 AS exitCode; -- a counter was is exceeded.
        LEAVE proc;
    END IF;

    -- Get (or insert) minScoreContrListID and maxScoreContrListID.
    CALL _insertOrFindScoreContributionListIDs (
        requestingUserID,
        qualID,
        subjID,
        userGroupID,
        minScoreContrListID,
        maxScoreContrListID,
        exitCode
    );
    IF (exitCode = 5) THEN
        SELECT 5 AS exitCode; -- a counter was is exceeded.
        LEAVE proc;
    END IF;

    SET reqData = CONCAT(
        qualID, ",", subjID, ",", userGroupID, ",", minScoreContrListID
    );

    SELECT list_len INTO curScoreContrListLen
    FROM ListMetadata
    WHERE list_id = minScoreContrListID;

    -- TODO: Correct this estimation (quick guess) of the computation cost.
    SET compCostRequired = CEIL(curScoreContrListLen / 4000) * 10;

    SET uploadDataCostRequired = 0;

    CALL _queueOrUpdateRequest (
        reqType,
        reqData,
        compCostPayment,
        uploadDataCostPayment,
        compCostRequired,
        uploadDataCostRequired
    );

    SELECT 0 AS exitCode; -- request was queued.
END proc //
DELIMITER ;













-- Here comes an important sub-procedure to compute and update the 'score
-- median,' as we might call it.

DELIMITER //
CREATE PROCEDURE _getScoreMedianAndWeight (
    IN minScoreContrListID BIGINT UNSIGNED,
    IN maxScoreContrListID BIGINT UNSIGNED,
    IN fullWeightSum DOUBLE,
    OUT scoreMedianVal DOUBLE
)
proc: BEGIN
    DECLARE done TINYINT;
    DECLARE prevScore, minUserWeightVal, maxUserWeightVal,
        curScore, curWeightVal, curWeightSum, halfWeightSum DOUBLE;

    DECLARE minCur CURSOR FOR
        SELECT score_val, weight_exp
        FROM FloatScoreAndWeightAggregates
        WHERE list_id = minScoreContrListID
        ORDER BY
            score_val ASC,
            weight_exp ASC,
            subj_id ASC;
    DECLARE maxCur CURSOR FOR
        SELECT score_val, weight_exp
        FROM FloatScoreAndWeightAggregates
        WHERE list_id = maxScoreContrListID
        ORDER BY
            score_val ASC,
            weight_exp ASC,
            subj_id ASC;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
    DECLARE minScore, maxScore DOUBLE;
    DECLARE minUserWeightExp, maxUserWeightExp TINYINT;

    -- First set halfWeightSum to half of the full weight sum of the score
    -- contribution. which is assumed contained by the fullWeightSum input.
    -- and then half it. Also initialize curWeight.
    SET halfWeightSum = fullWeightSum / 2;
    SET curWeightSum = 0;

    -- Loop through half (weight-wise) of all min and max score contributions
    -- until the we have the two contributions (min or max) that divides the
    -- weight sum in half.
    OPEN minCur;
    OPEN maxCur;
    SET done = 0;
    FETCH minCur INTO minScore, minUserWeightExp;
    FETCH maxCur INTO maxScore, maxUserWeightExp;
    IF (done) THEN
        SET scoreMedianVal = NULL;
        LEAVE proc;
    END IF;
    SET minUserWeightVal = POW(1.2, minUserWeightExp);
    SET maxUserWeightVal = POW(1.2, maxUserWeightExp);
    loop_1: LOOP
        SET prevScore = curScore;

        IF (maxScore <= minScore OR done) THEN
            SET curScore = maxScore;
            SET curWeightVal = maxUserWeightVal;
            FETCH maxCur INTO maxScore, maxUserWeightExp;
            SET maxUserWeightVal = POW(1.2, maxUserWeightExp);
        ELSE
            SET curScore = minScore;
            SET curWeightVal = minUserWeightVal;
            FETCH minCur INTO minScore, minUserWeightExp;
            SET minUserWeightVal = POW(1.2, minUserWeightExp);
        END IF;

        SET curWeightSum = curWeightSum + curWeightVal;

        IF (curWeightSum >= halfWeightSum OR done) THEN
            LEAVE loop_1;
        ELSE
            ITERATE loop_1;
        END IF;
    END LOOP loop_1;
    CLOSE cur;

    -- At this point, curScore will hold the first value greater than or equal
    -- to the desired median, and prevScore will hold the first value
    -- less than or equal to the desired median. All that's left to do is to
    -- extract an appropriate score median value between these two scores, more
    -- precisely given by:
    SET scoreMedianVal = curScore -
        (curScore - prevScore) * (curWeightSum - halfWeightSum) / curWeightVal;
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
CREATE PROCEDURE _queueOrUpdateRequest (
    IN reqType VARCHAR(100),
    IN reqData VARBINARY(2900),
    IN paidCompCost FLOAT,
    IN paidUploadDataCost FLOAT,
    IN compCostRequired FLOAT,
    IN uploadDataCostRequired FLOAT,
)
BEGIN
    INSERT INTO ScheduledRequests (
        req_type, req_data,
        fraction_of_computation_cost_paid, fraction_of_upload_data_cost_paid,
        computation_cost_required, upload_data_cost_required
    ) VALUES (
        reqType, reqData,
        paidCompCost, paidUploadDataCost,
        compCostRequired, uploadDataCostRequired
    )
    ON DUPLICATE KEY UPDATE
        fraction_of_computation_cost_paid = fraction_of_computation_cost_paid +
            paidCompCost / compCostRequired,
        fraction_of_upload_data_cost_paid = fraction_of_upload_data_cost_paid +
            paidUploadDataCost / uploadDataCostRequired,
        -- These values might have changed, so we update them as well:
        computation_cost_required = compCostRequired,
        upload_data_cost_required = uploadDataCostRequired
    WHERE (
        req_type = reqType AND
        req_data = reqData
    );
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE _executeRequest (
    IN reqType VARCHAR(100),
    IN reqData VARCHAR(255)
)
BEGIN
    CASE reqType
        WHEN "SCORE_CONTR_WHOLE_USER_GROUP" THEN BEGIN
            DECLARE qualID, subjID, userGroupID,
                minScoreContrListID, maxScoreContrListID BIGINT UNSIGNED;
            SET qualID = CAST(
                REGEXP_SUBSTR(paths, "[^,]+", 1, 1) AS UNSIGNED
            );
            SET subjID = CAST(
                REGEXP_SUBSTR(paths, "[^,]+", 1, 2) AS UNSIGNED
            );
            SET userGroupID = CAST(
                REGEXP_SUBSTR(paths, "[^,]+", 1, 3) AS UNSIGNED
            );
            SET minScoreContrListID = CAST(
                REGEXP_SUBSTR(paths, "[^,]+", 1, 4) AS UNSIGNED
            );
            SET maxScoreContrListID = CAST(
                REGEXP_SUBSTR(paths, "[^,]+", 1, 5) AS UNSIGNED
            );

            CALL _updateScoreContributionsForWholeUserGroup (
                qualID, subjID, userGroupID,
                minScoreContrListID, maxScoreContrListID
            );
        END
        WHEN "SCORE_CONTR_ALL_EXISTING" THEN BEGIN
            DECLARE qualID, subjID, userGroupID,
                minScoreContrListID BIGINT UNSIGNED;
            SET qualID = CAST(
                REGEXP_SUBSTR(paths, "[^,]+", 1, 1) AS UNSIGNED
            );
            SET subjID = CAST(
                REGEXP_SUBSTR(paths, "[^,]+", 1, 2) AS UNSIGNED
            );
            SET userGroupID = CAST(
                REGEXP_SUBSTR(paths, "[^,]+", 1, 3) AS UNSIGNED
            );
            SET minScoreContrListID = CAST(
                REGEXP_SUBSTR(paths, "[^,]+", 1, 4) AS UNSIGNED
            );

            CALL _updateAllExistingScoreContributions (
                qualID, subjID, userGroupID, minScoreContrListID
            );
        END
        ELSE BEGIN
            SIGNAL SQLSTATE "45000" SET MESSAGE_TEXT = "Unrecognized reqType";
        END
    END CASE;
END //
DELIMITER ;

