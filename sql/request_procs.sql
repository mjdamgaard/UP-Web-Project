
SELECT "Request procedures";

DROP PROCEDURE insertOrUpdatePublicUserScore;






DELIMITER //
CREATE PROCEDURE _insertOrFindScoreContributionListIDs (
    IN requestingUserID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    OUT minScoreContrListID BIGINT UNSIGNED,
    OUT maxScoreContrListID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
proc: BEGIN
    DECLARE minScoreContrListDefStr, maxScoreContrListDefStr
        VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;

    SET minScoreContrListDefStr = CONCAT(
        '@[12],@[', qualID, '],@[', subjID, ']'
    );
    SET maxScoreContrListDefStr = CONCAT(
        '@[13],@[', qualID, '],@[', subjID, ']'
    );

    CALL _insertOrFindFunctionCallEntity (
        requestingUserID, minScoreContrListDefStr, 0, 1,
        minScoreContrListID, exitCode
    );
    IF (exitCode = 5) THEN
        LEAVE proc;
    END IF;
    CALL _insertOrFindFunctionCallEntity (
        requestingUserID, maxScoreContrListDefStr, 0, 1,
        maxScoreContrListID, exitCode
    );
    IF (exitCode = 5) THEN
        LEAVE proc;
    END IF;
END proc //
DELIMITER ;









DELIMITER //
CREATE PROCEDURE _insertUpdateOrDeleteScoreContribution (
    IN userID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN userWeightVal FLOAT,
    IN minScoreContrListID BIGINT UNSIGNED,
    IN maxScoreContrListID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
proc: BEGIN
    DECLARE userScoreListID BIGINT UNSIGNED;
    DECLARE userScoreListDefStr VARCHAR(700)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT (
            CONCAT('@[11],@[', userID, '],@[', qualID, ']')
        );
    DECLARE scoreMid, scoreRad FLOAT;
    DECLARE unixTimeBin VARBINARY(4);

    -- Get minScoreContrListID.
    SELECT id INTO userScoreListID
    FROM EntitySecKeys FORCE INDEX (PRIMARY)
    WHERE (
        ent_type = "c" AND
        user_whitelist_id = 0 AND
        def_key = userScoreListDefStr
    );

    -- Select the scoreMid, the scoreRad, and the unixTime binary.
    SELECT float_1_val, float_2_val, on_index_data
    INTO scoreMid, scoreRad, unixTimeBin
    FROM PublicEntityLists FORCE INDEX (PRIMARY)
    WHERE (
        list_id = userScoreListID AND
        subj_id = subjID
    );

    CALL _insertUpdateOrDeletePublicListElement (
        minScoreContrListID,
        userID,
        scoreMid - scoreRad,
        userWeightVal,
        unixTimeBin,
        NULL,
        20,
        exitCode
    );
    CALL _insertUpdateOrDeletePublicListElement (
        maxScoreContrListID,
        userID,
        scoreMid + scoreRad,
        userWeightVal,
        unixTimeBin,
        NULL,
        20,
        exitCode
    );
END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE _deleteScoreContribution (
    IN userID BIGINT UNSIGNED,
    IN minScoreContrListID BIGINT UNSIGNED,
    IN maxScoreContrListID BIGINT UNSIGNED
)
proc: BEGIN
    CALL _insertUpdateOrDeletePublicListElement (
        minScoreContrListID,
        userID,
        NULL,
        NULL,
        NULL,
        NULL,
        0,
        exitCode
    );
    CALL _insertUpdateOrDeletePublicListElement (
        maxScoreContrListID,
        userID,
        NULL,
        NULL,
        NULL,
        NULL,
        0,
        exitCode
    );
END proc //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE _insertUpdateOrDeleteScoreContributionIfMemberOrElseDelete (
    IN userID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN userGroupID BIGINT UNSIGNED,
    IN minScoreContrListID BIGINT UNSIGNED,
    IN maxScoreContrListID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
proc: BEGIN
    DECLARE isMember TINYINT;
    DECLARE targetUserWeightVal FLOAT;

    -- We first check that the user is in the given user group. If not, make
    -- sure that any existing score of the user is deleted from the two lists.
    CALL _getIsMemberAndUserWeight (
        userID, userGroupID,
        isMember, targetUserWeightVal
    );

    IF NOT (isMember) THEN
        CALL _deleteScoreContribution (
            userID,
            minScoreContrListID,
            maxScoreContrListID
        );

        SET exitCode = 1; -- user is not a member of the user group.
        LEAVE proc;
    END IF;

    -- If the user is a member, we insert or update, or delete (if the public
    -- score is deleted), the min and max scores.
    CALL _insertUpdateOrDeleteScoreContribution (
        userID,
        qualID,
        subjID,
        targetUserWeightVal,
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
    DECLARE exitCode, isExceeded TINYINT;
    DECLARE minScoreContrListID, minScoreContrListID BIGINT UNSIGNED;

    -- Get (or insert) minScoreContrListID and maxScoreContrListID.
    CALL _insertOrFindScoreContributionListIDs (
        requestingUserID,
        qualID,
        subjID,
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
    CALL _increaseWeeklyUserCounters (
        requestingUserID, 0, 40, 10, isExceeded
    );
    IF (isExceeded) THEN
        SELECT 5 AS exitCode; -- a counter was is exceeded.
        LEAVE proc;
    END IF;

    CALL _insertUpdateOrDeleteScoreContributionIfMemberOrElseDelete (
        targetUserID,
        qualID,
        subjID,
        userGroupID,
        minScoreContrListID,
        maxScoreContrListID,
        exitCode
    );

    IF NOT (exitCode = 5) THEN
        SET exitCode = 0; -- request was carried out.
    END IF;
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
    IN maxScoreContrListID BIGINT UNSIGNED,
    OUT rowCount BIGINT UNSIGNED;
)
BEGIN
    DECLARE exitCode, done TINYINT;

    DECLARE cur CURSOR FOR
        SELECT float_1_val, subj_id
        FROM PublicEntityLists FORCE INDEX (sec_idx)
        WHERE (
            list_id = userGroupID AND
            float_1_val > 0
        )
        ORDER BY float_1_val ASC;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
    DECLARE userWeightVal FLOAT;
    -- DECLARE userWeightWeight FLOAT;
    DECLARE memberID BIGINT UNSIGNED;

    -- Loop through all members of a group and add any score contributions from
    -- them.
    OPEN cur;
    SET done = 0;
    SET rowCount = 0;
    loop_1: LOOP
        FETCH cur INTO userWeightVal, memberID;

        IF (done) THEN
            LEAVE loop_1;
        END IF;

        SET rowCount = rowCount + 1;

        CALL _insertUpdateOrDeleteScoreContribution (
            memberID,
            qualID,
            subjID,
            userWeightVal,
            userScoreListID,
            minScoreContrListID,
            maxScoreContrListID,
            exitCode
        );

        ITERATE loop_1;
    END LOOP loop_1;
    CLOSE cur;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE _updateAllExistingScoreContributions (
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN userGroupID BIGINT UNSIGNED,
    IN minScoreContrListID BIGINT UNSIGNED,
    IN maxScoreContrListID BIGINT UNSIGNED,
    OUT rowCount BIGINT UNSIGNED;
)
proc: BEGIN
    DECLARE exitCode, done TINYINT;

    DECLARE cur CURSOR FOR
        SELECT subj_id
        FROM PublicEntityLists FORCE INDEX (sec_idx, PRIMARY)
        WHERE list_id = minScoreContrListID;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
    DECLARE memberID BIGINT UNSIGNED;

    -- Loop through all contributions on the minScoreContrList, and for
    -- each user on there, call _insertUpdate...IfMember().
    OPEN cur;
    SET done = 0;
    SET rowCount = 0;
    loop_1: LOOP
        FETCH cur INTO memberID;

        IF (done) THEN
            LEAVE loop_1;
        END IF;

        SET rowCount = rowCount + 1;

        CALL _insertUpdateOrDeleteScoreContributionIfMemberOrElseDelete (
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


    CALL _increaseWeeklyUserCounters (
        requestingUserID, 0, uploadDataCostPayment, compCostPayment,
        isExceeded
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

    SELECT pos_list_len INTO userGroupListLen
    FROM PublicListMetadata FORCE INDEX (PRIMARY)
    WHERE list_id = userGroupID;

    -- TODO: Correct this estimation (quick guess) of the computation cost.
    SET compCostRequired = CEIL(userGroupListLen * 14 / 4000) * 10;

    SELECT list_len INTO curScoreContrListLen
    FROM PublicListMetadata FORCE INDEX (PRIMARY)
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
        uploadDataCostPayment,
        compCostPayment,
        uploadDataCostRequired,
        compCostRequired,
        isExceeded
    );
    IF (isExceeded) THEN
        SELECT 5 AS exitCode; -- a counter was is exceeded.
        LEAVE proc;
    END IF;

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


    CALL _increaseWeeklyUserCounters (
        requestingUserID, 0, uploadDataCostPayment, compCostPayment,
        isExceeded
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
    FROM PublicListMetadata FORCE INDEX (PRIMARY)
    WHERE list_id = minScoreContrListID;

    -- TODO: Correct this estimation (quick guess) of the computation cost.
    SET compCostRequired = CEIL(curScoreContrListLen / 4000) * 10;

    SET uploadDataCostRequired = 0;

    CALL _queueOrUpdateRequest (
        reqType,
        reqData,
        uploadDataCostPayment,
        compCostPayment,
        uploadDataCostRequired,
        compCostRequired,
        isExceeded
    );
    IF (isExceeded) THEN
        SELECT 5 AS exitCode; -- a counter was is exceeded.
        LEAVE proc;
    END IF;

    SELECT 0 AS exitCode; -- request was queued.
END proc //
DELIMITER ;













-- Here comes an important sub-procedure to compute and update the 'score
-- median,' as we might call it.

DELIMITER //
CREATE PROCEDURE _getScoreMedian (
    IN minScoreContrListID BIGINT UNSIGNED,
    IN maxScoreContrListID BIGINT UNSIGNED,
    IN fullWeightSum DOUBLE,
    OUT scoreMedianVal DOUBLE
)
proc: BEGIN
    DECLARE done TINYINT;
    DECLARE prevScore, curScore, curWeightVal FLOAT;
    DECLARE curWeightSum, halfWeightSum DOUBLE;

    DECLARE minCur CURSOR FOR
        SELECT float_1_val, float_2_val
        FROM PublicEntityLists FORCE INDEX (sec_idx)
        WHERE list_id = minScoreContrListID
        ORDER BY
            float_1_val ASC,
            float_2_val ASC;
    DECLARE maxCur CURSOR FOR
        SELECT float_1_val, float_2_val
        FROM PublicEntityLists FORCE INDEX (sec_idx)
        WHERE list_id = maxScoreContrListID
        ORDER BY
            float_1_val ASC,
            float_2_val ASC;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
    DECLARE minScore, maxScore FLOAT;
    DECLARE minUserWeightVal, maxUserWeightVal FLOAT;

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
    FETCH minCur INTO minScore, minUserWeightVal;
    FETCH maxCur INTO maxScore, maxUserWeightVal;
    IF (done) THEN
        SET scoreMedianVal = NULL;
        LEAVE proc;
    END IF;
    loop_1: LOOP
        SET prevScore = curScore;

        IF (maxScore < minScore OR done) THEN
            SET curScore = maxScore;
            SET curWeightVal = maxUserWeightVal;
            FETCH maxCur INTO maxScore, maxUserWeightVal;
        ELSE
            SET curScore = minScore;
            SET curWeightVal = minUserWeightVal;
            FETCH minCur INTO minScore, minUserWeightVal;
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







-- And here comes the request for the median score update.

DELIMITER //
CREATE PROCEDURE requestUpdateOfMedianScore (
    IN requestingUserID BIGINT UNSIGNED,
    IN compCostPayment FLOAT,
    IN uploadDataCostPayment FLOAT,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN userGroupID BIGINT UNSIGNED,
    IN filterListID BIGINT UNSIGNED -- 0 means no filter list.
)
proc: BEGIN
    DECLARE exitCode, isExceeded TINYINT;
    DECLARE minScoreContrListID, minScoreContrListID BIGINT UNSIGNED;
    DECLARE fullWeightSum DOUBLE;
    DECLARE reqType VARCHAR(100) DEFAULT "MEDIAN_SCORE";
    DECLARE reqData VARCHAR(255);
    DECLARE compCostRequired, uploadDataCostRequired FLOAT;
    DECLARE scoreContrListLen BIGINT UNSIGNED;


    CALL _increaseWeeklyUserCounters (
        requestingUserID, 0, uploadDataCostPayment, compCostPayment,
        isExceeded
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
        minScoreContrListID,
        maxScoreContrListID,
        exitCode
    );
    IF (exitCode = 5) THEN
        SELECT 5 AS exitCode; -- a counter was is exceeded.
        LEAVE proc;
    END IF;

    -- Get the full weight sum of the contribution score lists.
    SELECT float_2_sum INTO fullWeightSum
    FROM PublicListMetadata FORCE INDEX (PRIMARY)
    WHERE list_id = minScoreContrListID;

    SET reqData = CONCAT(
        minScoreContrListID, ",", maxScoreContrListID, ",", fullWeightSum, ",",
        userGroupID, ",", qualID, ",", subjID, ",", filterListID
    );

    SELECT pos_score_list_len INTO userGroupListLen
    FROM ListMetadata
    WHERE list_id = userGroupID;

    -- TODO: Correct this estimation (quick guess) of the computation cost.
    SET compCostRequired = CEIL(scoreContrListLen * 14 / 4000) * 10;

    SET uploadDataCostRequired = 20;

    CALL _queueOrUpdateRequest (
        reqType,
        reqData,
        uploadDataCostPayment,
        compCostPayment,
        uploadDataCostRequired,
        compCostRequired,
        isExceeded
    );
    IF (isExceeded) THEN
        SELECT 5 AS exitCode; -- a counter was is exceeded.
        LEAVE proc;
    END IF;

    SELECT 0 AS exitCode; -- request was queued.
END proc //
DELIMITER ;










-- A sub-procedure to insert values into two-part lists, where one version of
-- the list is one with the 'Has passed weight threshold' flag set to true,
-- and the other version is for all the scores whose weight did not reach the
-- threshold of >= 10.
DELIMITER //
CREATE PROCEDURE _insertIntoThresholdSeparatedTwoPartList (
    IN requestingUserID BIGINT UNSIGNED,
    IN listFunID BIGINT UNSIGNED,
    IN listFunInputStringFromTheSecondInputAndOn VARCHAR(700)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    IN subjID BIGINT UNSIGNED,
    IN scoreVal,
    IN weightVal,
    IN hasPassedOnIndexData,
    IN hasPassedOffIndexData,
    IN hasNotPassedOnIndexData,
    IN hasNotPassedOffIndexData,
    OUT exitCode TINYINT
)
proc: BEGIN
    DECLARE hasPassedListFunID, hasNotPassedListFunID BIGINT UNSIGNED;
    DECLARE hasPassedListFunDefStr, hasNotPassedListFunDefStr VARCHAR(700)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
    
    -- Find or insert the two list entities, hasPassedListFunID and
    -- hasNotPassedListFunID. 
    SET hasPassedListFunDefStr = CONCAT(
        '@[', listFunID, '],true,' listFunInputStringFromTheSecondInputAndOn
    );
    SET hasNotPassedListFunDefStr = CONCAT(
        '@[', listFunID, '],false,' listFunInputStringFromTheSecondInputAndOn
    );
    CALL _insertOrFindFunctionCallEntity (
        requestingUserID, hasPassedListFunDefStr, 0, 1,
        hasPassedListFunID, exitCode
    );
    IF (exitCode = 5) THEN
        LEAVE proc;
    END IF;
    CALL _insertOrFindFunctionCallEntity (
        requestingUserID, hasNotPassedListFunDefStr, 0, 1,
        hasNotPassedListFunID, exitCode
    );
    IF (exitCode = 5) THEN
        LEAVE proc;
    END IF;

    -- Then insert or update the subj on one of the list, and also make sure
    -- that it is removed from the other list (on which it no longer belongs).
    IF (weightVal >= 10) THEN
        -- First delete the subject from the has-not-passed list if there.
        CALL _insertUpdateOrDeletePublicListElement (
            hasNotPassedListFunID,
            userID,
            NULL,
            NULL,
            NULL,
            NULL,
            0,
            exitCode
        );
        -- And then insert or update the subject into the has-passed list.
        CALL _insertUpdateOrDeletePublicListElement (
            hasPassedListFunID,
            userID,
            scoreVal,
            weightVal,
            hasPassedOnIndexData,
            hasPassedOffIndexData,
            20,
            exitCode
        );
    ELSE
        -- First delete the subject from the has-passed list if there.
        CALL _insertUpdateOrDeletePublicListElement (
            hasPassedListFunID,
            userID,
            NULL,
            NULL,
            NULL,
            NULL,
            0,
            exitCode
        );
        -- And then insert or update the subject into the has-not-passed list,
        -- and make sure to store weightVal in float_1, and scoreVal in float_2.
        CALL _insertUpdateOrDeletePublicListElement (
            hasNotPassedListFunID,
            userID,
            weightVal,
            scoreVal,
            hasNotPassedOnIndexData,
            hasNotPassedOffIndexData,
            20,
            exitCode
        );
    END IF;
END proc //
DELIMITER ;

















-- DELIMITER //
-- CREATE PROCEDURE _constructHistogramOfScoreCenters (
--     IN scoreContrListID BIGINT UNSIGNED,
--     IN lowerBound FLOAT,
--     IN upperBound FLOAT,
--     IN minBinWidth FLOAT,
--     IN maxBinWidth FLOAT,
--     IN hiResBinNum INT UNSIGNED,
--     IN listLen BIGINT UNSIGNED,
--     OUT histData VARBINARY(4000)
-- )
-- proc: BEGIN
--     DECLARE scoreVal, nextBinLimit, userWeight FLOAT;
--     DECLARE userWeightExp, done TINYINT DEFAULT 0;
--     DECLARE i INT UNSIGNED;
--     -- -- Initialize a string where every 20 characters encodes a float number,
--     -- -- padded to left with spaces.
--     -- DECLARE hiResHistData TEXT DEFAULT (
--     --     REPEAT(CONCAT(REPEAT(" ", 19), "0"), hiResBinNum)
--     -- );

--     DECLARE cur CURSOR FOR
--         SELECT score_val, user_weight_exp
--         FROM ScoreContributions
--         WHERE (
--             list_id = scoreContrListID AND
--             score_val >= lowerBound AND
--             score_val <= upperBound
--         )
--         ORDER BY
--             score_val ASC,
--             score_width_exp ASC,
--             user_weight_exp ASC,
--             user_id ASC;
--     DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

--     CREATE TEMPORARY TABLE histBins (
--         bin_ind INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
--         weight_sum FLOAT NOT NULL DEFAULT 0
--     );

--     OPEN cur;

--     FETCH cur INTO scoreVal, userWeightExp;
--     SET nextBinLimit = lowerBound;
--     SET i = 1;
--     bin_loop: LOOP
--         IF (i > hiResBinNum OR done) THEN
--             LEAVE bin_loop;
--         END IF;

--         SET nextBinLimit = nextBinLimit + minBinWidth;

--         INSERT IGNORE INTO histBins (bin_ind, weight_sum)
--         VALUES (i, 0);

--         user_loop: LOOP
--             -- If scoreVal exceeds nextBinLimit, or it is null  break out and iterate bin_loop.
--             IF (scoreVal > nextBinLimit OR done) THEN
--                 LEAVE user_loop;
--             END IF;

--             -- Else add the user's weight to the ith bin.
--             SET userWeight = POW(1.2, userWeightExp);
--             UPDATE histBins
--             SET weight_sum = weight_sum + userWeight
--             WHERE bin_ind = i;

--             FETCH cur INTO scoreVal, userWeightExp;
--             ITERATE user_loop;
--         END LOOP user_loop;

--         SET i = i + 1;
--         ITERATE bin_loop;
--     END LOOP bin_loop;

--     -- Now that histBins is populated, call a procedure that outputs a lower-
--     -- resolution hist_data by gathering bins with a too small weight_sum.
--     CALL _getHistData (
--         lowerBound, upperBound, minBinWidth, maxBinWidth, hiResBinNum,
--         histData
--     );
--     -- This sub-procedure sets the histData to the desired output, and the
--     -- procedure therefore ends here.
-- END proc //
-- DELIMITER ;



















DELIMITER //
CREATE EVENT update_worker_thread_1
ON SCHEDULE EVERY 5 SECOND
DO
BEGIN
    CALL _updateWorkerThreadBody ();
END //
DELIMITER ;

DELIMITER //
CREATE EVENT update_worker_thread_2
ON SCHEDULE EVERY 30 SECOND
DO
BEGIN
    CALL _updateWorkerThreadBody ();
END //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE _updateWorkerThreadBody ()
BEGIN
    DECLARE reqType VARCHAR(100);
    DECLARE reqData VARCHAR(2900);
    DECLARE floatVar FLOAT;

    loop_1: LOOP
        -- First select the next paid-for request in the queue.
        SELECT req_type, req_data INTO reqType, reqData
        FROM ScheduledRequests USE INDEX (sec_idx) -- No need to force here.
        WHERE (
            fraction_of_computation_cost_paid >= 1 AND
            fraction_of_upload_data_cost_paid >= 1
        )
        ORDER BY
            fraction_of_computation_cost_paid ASC,
            fraction_of_upload_data_cost_paid ASC
        LIMIT 1;

        -- Leave and wait another period if there are no more queued paid-for
        -- requests. 
        IF (reqType IS NULL) THEN
            COMMIT;
            LEAVE loop_1;
        END IF;

        -- Then make a locking read of this next paid-for queued request,
        -- delete it and commit to allow for other threads to continue, then
        -- carry out the request. If another process has removed the request
        -- before we get the lock, simply start over. Repeat this whole process
        -- until there are no paid-for requests left, then exit and wait
        -- another period to start again.
        START TRANSACTION;

        -- (The reason for making this redundant select is to avoid gap locks,
        -- as these are apparently *deliberately* designed to dead-lock your
        -- sessions.)
        SELECT fraction_of_computation_cost_paid INTO floatVar
        FROM ScheduledRequests USE INDEX (PRIMARY) -- No need to force here.
        WHERE (
            req_type = reqType,
            req_data = reqData
        )
        FOR UPDATE;

        -- Restart if another thread beat this one to it.
        IF (floatVar IS NULL) THEN
            COMMIT;
            ITERATE loop_1;
        END IF;

        -- Else dequeue the request and commit.
        DELETE FROM ScheduledRequests
        WHERE (
            req_type = reqType,
            req_data = reqData
        );

        COMMIT;

        -- Then carry out the dequeued request, and reiterate.
        CALL _executeRequest (
            reqType, reqData
        );

        ITERATE loop_1;
    END LOOP loop_1;
END //
DELIMITER ;









DELIMITER //
CREATE PROCEDURE _queueOrUpdateRequest (
    IN reqType VARCHAR(100),
    IN reqData VARBINARY(2900),
    IN uploadDataCostPayment FLOAT,
    IN compCostPayment FLOAT,
    IN uploadDataCostRequired FLOAT,
    IN compCostRequired FLOAT,
    OUT isExceeded TINYINT;
)
proc: BEGIN
    CALL _increaseWeeklyUserCounters (
        requestingUserID, 0, uploadDataCostPayment, compCostPayment,
        isExceeded
    );
    IF (isExceeded) THEN
        LEAVE proc;
    END IF;

    INSERT INTO ScheduledRequests (
        req_type, req_data,
        fraction_of_computation_cost_paid, fraction_of_upload_data_cost_paid,
        computation_cost_required, upload_data_cost_required
    ) VALUES (
        reqType, reqData,
        compCostPayment, uploadDataCostPayment,
        compCostRequired, uploadDataCostRequired
    )
    ON DUPLICATE KEY UPDATE
        fraction_of_computation_cost_paid = fraction_of_computation_cost_paid +
            compCostPayment / compCostRequired,
        fraction_of_upload_data_cost_paid = fraction_of_upload_data_cost_paid +
            uploadDataCostPayment / uploadDataCostRequired,
        -- These values might have changed, so we update them as well:
        computation_cost_required = compCostRequired,
        upload_data_cost_required = uploadDataCostRequired
    WHERE (
        req_type = reqType AND
        req_data = reqData
    );
END proc //
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
                REGEXP_SUBSTR(reqData, "[^,]+", 1, 1) AS UNSIGNED
            );
            SET subjID = CAST(
                REGEXP_SUBSTR(reqData, "[^,]+", 1, 2) AS UNSIGNED
            );
            SET userGroupID = CAST(
                REGEXP_SUBSTR(reqData, "[^,]+", 1, 3) AS UNSIGNED
            );
            SET minScoreContrListID = CAST(
                REGEXP_SUBSTR(reqData, "[^,]+", 1, 4) AS UNSIGNED
            );
            SET maxScoreContrListID = CAST(
                REGEXP_SUBSTR(reqData, "[^,]+", 1, 5) AS UNSIGNED
            );

            CALL _updateScoreContributionsForWholeUserGroup (
                qualID, subjID, userGroupID,
                minScoreContrListID, maxScoreContrListID,
                @unused
            );
        END
        WHEN "SCORE_CONTR_ALL_EXISTING" THEN BEGIN
            DECLARE qualID, subjID, userGroupID,
                minScoreContrListID, maxScoreContrListID BIGINT UNSIGNED;
            SET qualID = CAST(
                REGEXP_SUBSTR(reqData, "[^,]+", 1, 1) AS UNSIGNED
            );
            SET subjID = CAST(
                REGEXP_SUBSTR(reqData, "[^,]+", 1, 2) AS UNSIGNED
            );
            SET userGroupID = CAST(
                REGEXP_SUBSTR(reqData, "[^,]+", 1, 3) AS UNSIGNED
            );
            SET minScoreContrListID = CAST(
                REGEXP_SUBSTR(reqData, "[^,]+", 1, 4) AS UNSIGNED
            );

            CALL _updateAllExistingScoreContributions (
                qualID, subjID, userGroupID, minScoreContrListID,
                @unused
            );
        END
        WHEN "SCORE_MEDIAN" THEN score_median_case: BEGIN
            DECLARE scoreMedianVal, fullWeightSum, filterListScore DOUBLE;
            DECLARE minScoreContrListID, maxScoreContrListID,
                userGroupID, qualID, subjID, filterListID BIGINT UNSIGNED;
            SET minScoreContrListID = CAST(
                REGEXP_SUBSTR(paths, "[^,]+", 1, 1) AS UNSIGNED
            );
            SET maxScoreContrListID = CAST(
                REGEXP_SUBSTR(paths, "[^,]+", 1, 2) AS UNSIGNED
            );
            SET fullWeightSum = CAST(
                REGEXP_SUBSTR(paths, "[^,]+", 1, 3) AS DOUBLE
            );
            SET userGroupID = CAST(
                REGEXP_SUBSTR(paths, "[^,]+", 1, 4) AS UNSIGNED
            );
            SET qualID = CAST(
                REGEXP_SUBSTR(paths, "[^,]+", 1, 5) AS UNSIGNED
            );
            SET subjID = CAST(
                REGEXP_SUBSTR(paths, "[^,]+", 1, 6) AS UNSIGNED
            );
            SET filterListID = CAST(
                REGEXP_SUBSTR(paths, "[^,]+", 1, 7) AS UNSIGNED
            );

            -- First check that subjID is on the filter list, and simply abort
            -- and do nothing if not.
            IF (filterListID != 0) THEN
                SELECT float_1_val INTO filterListScore
                FROM PublicEntityLists FORCE INDEX (PRIMARY)
                WHERE (
                    list_id = filterListID AND
                    subj_id = subjID
                );

                IF (filterListScore <= 0) THEN
                    LEAVE score_median_case;
                END IF;
            END IF;

            -- Else continue by computing the median score.
            CALL _getScoreMedian (
                minScoreContrListID, maxScoreContrListID, fullWeightSum,
                scoreMedianVal
            );

            -- Then insert it in either the has-passed or the has_not-passed
            -- median score list, depending on the fullWeightSum. (The subject
            -- will also be removed from the other list in this process if
            -- it was there before.)
            CALL _insertIntoThresholdSeparatedTwoPartList (
                0, 14, CONCAT(
                    '@[', userGroupID, '],@[', qualID, '],',
                    CASE WHEN (filterListID != 0)
                        THEN CONCAT('@[', filterListID, ']')
                        ELSE 'undef'
                    END CASE
                ),
                subjID,
                scoreMedianVal,
                fullWeightSum,
                NULL, NULL, NULL, NULL,
                @unused
            );
        END score_median_case
        ELSE BEGIN
            SIGNAL SQLSTATE "45000" SET MESSAGE_TEXT = "Unrecognized reqType";
        END
    END CASE;
END //
DELIMITER ;

