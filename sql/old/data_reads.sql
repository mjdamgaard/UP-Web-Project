
SELECT "Query procedures";

DROP PROCEDURE selectEntityList;
DROP PROCEDURE selectScore;








DELIMITER //
CREATE PROCEDURE _getIsMember (
    IN userID BIGINT UNSIGNED,
    IN userGroupID BIGINT UNSIGNED,
    OUT isMember BOOL
)
proc: BEGIN
    DECLARE listElemKey VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;

    IF (userGroupID = 1) THEN
        SET isMember = 0;
        LEAVE proc;
    END IF;

    IF (
        userGroupID <=> 0 OR
        userGroupID != 0 AND userID = userGroupID
    ) THEN
        SET isMember = 1;
        LEAVE proc;
    END IF;

    SELECT list_elem_key INTO listElemKey
    FROM ListData FORCE INDEX (PRIMARY)
    WHERE (
        list_elem_key = CONCAT(userGroupID, ';0;', userID) OR
        list_elem_key = CONCAT(userGroupID, ';1;', userID)
    );

    IF (listElemKey IS NULL) THEN
        SET isMember = 0;
    ELSE
        SET isMember = 1;
    END IF;
END proc //
DELIMITER ;







DELIMITER //
CREATE PROCEDURE selectEntityList (
    IN userID BIGINT UNSIGNED,
    IN listID BIGINT UNSIGNED,
    IN readerWhitelistID BIGINT UNSIGNED,
    IN hiStr VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    IN includeHiStr BOOL,
    IN loStr VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    IN includeLoStr BOOL,
    IN isAsc BOOL,
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN fistCol TINYINT UNSIGNED,
    IN colNum TINYINT UNSIGNED
)
proc: BEGIN
    DECLARE isMember, fistChar, lastCol TINYINT UNSIGNED;
    DECLARE downloadData, downloadDataLimit FLOAT;
    DECLARE listHeader VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;

    -- Check that the user isn't out of download data.
    SELECT download_data_this_week, download_data_weekly_limit
    INTO downloadData, downloadDataLimit
    FROM Private_UserData FORCE INDEX (PRIMARY)
    WHERE user_id = userID;

    IF (downloadData + maxNum DIV 1000 + 1 > downloadDataLimit) THEN
        SELECT listID, 5 AS exitCode; -- Download limit is exceeded.
        LEAVE proc;
    END IF;

    -- Check that user is on the reader whitelist.
    CALL _getIsMember (
        userID, readerWhitelistID,
        isMember
    );
    IF NOT (isMember) THEN
        -- CAUTION: It should be noted that users can use this request to
        -- see if they are on any list, even ones they are not otherwise
        -- allowed to read. They can only see if they themselves are on the
        -- list, however. But this still means that whenever you make an
        -- otherwise private entity list with a user as one on the subjects,
        -- then user can in principle see that they are on that list.
        SELECT listID, 2 AS exitCode; -- user is not on the reader whitelist.
        LEAVE proc;
    END IF;

    -- Select the list.
    SET listHeader = CONCAT(listID, ';', readerWhitelistID, ';');
    SET fistChar = LENGTH(listHeader) + 1;
    SET hiStr = CONCAT(listHeader, hiStr);
    SET loStr = CONCAT(listHeader, loStr);
    SET lastCol = firstCol + colNum - 1;

    SELECT
        SUBSTRING_INDEX(
            SUBSTRING_INDEX(
                SUBSTR(CONCAT(list_elem_key, ';', elem_data), fistChar),
                ';',
                lastCol
            ),
            ';',
            -colNum
        )
        AS elemStr
    FROM ListData FORCE INDEX (PRIMARY)
    WHERE (
        (NOT includeHiStr OR list_elem_key <= hiStr) AND
        (includeHiStr OR list_elem_key < hiStr) AND
        (NOT includeLoStr OR list_elem_key >= loStr) AND
        (includeLoStr OR list_elem_key > loStr)
    )
    ORDER BY
        CASE WHEN isAsc THEN list_elem_key END ASC,
        CASE WHEN NOT isAsc THEN list_elem_key END DESC
    LIMIT numOffset, maxNum;
END proc //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE selectEntityListFromListDefStr (
    IN userID BIGINT UNSIGNED,
    IN listDefStr VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    IN listEntityReaderWhitelistID BIGINT UNSIGNED,
    IN readerWhitelistID BIGINT UNSIGNED,
    IN hiStr VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    IN includeHiStr BOOL,
    IN loStr VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    IN includeLoStr BOOL,
    IN isAsc BOOL,
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN fistCol TINYINT UNSIGNED,
    IN colNum TINYINT UNSIGNED
)
proc: BEGIN
    DECLARE isMember TINYINT UNSIGNED;
    DECLARE listID BIGINT UNSIGNED;
    DECLARE downloadData, downloadDataLimit FLOAT;

    -- Check that the user isn't out of download data.
    SELECT download_data_this_week, download_data_weekly_limit
    INTO downloadData, downloadDataLimit
    FROM Private_UserData FORCE INDEX (PRIMARY)
    WHERE user_id = userID;

    IF (downloadData + 1 > downloadDataLimit) THEN
        SELECT listID, 5 AS exitCode; -- Download limit is exceeded.
        LEAVE proc;
    END IF;

    -- Check that user is on the reader whitelist.
    CALL _getIsMember (
        userID, readerWhitelistID,
        isMember
    );
    IF NOT (isMember) THEN
        -- CAUTION: It should be noted that users can use this request to
        -- see if they are on any list, even ones they are not otherwise
        -- allowed to read. They can only see if they themselves are on the
        -- list, however. But this still means that whenever you make an
        -- otherwise private entity list with a user as one on the subjects,
        -- then user can in principle see that they are on that list.
        SELECT listID, 2 AS exitCode; -- user is not on the reader whitelist.
        LEAVE proc;
    END IF;

    -- Find the list entity (with isAnonymous = 1, insertWhenNotFound = 0,
    -- and selectWhenFound = 1).
    CALL _parseAndObtainRegularEntity (
        userID, listDefStr, listEntityReaderWhitelistID, 1, 0, 1,
        listID, exitCode
    );
    IF (exitCode >= 2) THEN
        SELECT listID, 3 AS exitCode; -- Finding list failed.
        LEAVE proc;
    END IF;

    CALL selectEntityList (
        userID,
        listID,
        readerWhitelistID,
        hiStr,
        includeHiStr,
        loStr,
        includeLoStr,
        isAsc,
        maxNum,
        numOffset,
        fistCol,
        colNum
    );
END proc //
DELIMITER ;










-- DELIMITER //
-- CREATE PROCEDURE selectScore (
--     IN userID BIGINT UNSIGNED,
--     IN listDefStr VARCHAR(700),
--     IN readerWhitelistID BIGINT UNSIGNED,
--     IN subjID BIGINT UNSIGNED
-- )
-- proc: BEGIN
--     DECLARE isExceeded, isMember, exitCode TINYINT;
--     DECLARE listID, foundRows BIGINT UNSIGNED;

--     -- Check that the user isn't out of download data.
--     CALL _increaseWeeklyUserCounters (
--         userID, 0, 0, 2, isExceeded
--     );
--     IF (isExceeded) THEN
--         SELECT 5 AS exitCode; -- download limit was exceeded.
--         LEAVE proc;
--     END IF;

--     -- Find the list entity (with isAnonymous = 1, insertWhenNotFound = 0, and
--     -- selectWhenFound = 1).
--     CALL _parseAndObtainRegularEntity (
--         userID, listDefStr, readerWhitelistID, 1, 0, 1,
--         listID, exitCode
--     );
--     IF (exitCode >= 2) THEN
--         SELECT 3 AS exitCode; -- finding list failed.
--         LEAVE proc;
--     END IF;

--     -- Check that user is on the reader whitelist.
--     CALL _getIsMember (
--         userID, readerWhitelistID,
--         isMember, @unused
--     );
--     IF NOT (isMember) THEN
--         -- CAUTION: It should be noted that users can use this request to
--         -- see if they are on any list, even ones they are not otherwise
--         -- allowed to read. They can only see if they themselves are on the
--         -- list, however. But this still means that whenever you make an
--         -- otherwise private entity list with a user as one on the subjects,
--         -- with a score1 > 0, then THE USER CAN STILL IN EFFECTIVELY SEE THAT
--         -- THEY ARE ON THAT LIST.
--         SELECT 2 AS exitCode; -- user is not on the reader whitelist.
--         LEAVE proc;
--     END IF;

--     SELECT
--         score_1 AS score1,
--         score_2 AS score2,
--         HEX(other_data) AS otherDataHex
--     FROM EntityLists FORCE INDEX (PRIMARY)
--     WHERE (
--         list_id = listID AND
--         subj_id = subjID
--     );
-- END proc //
-- DELIMITER ;























-- DELIMITER //
-- CREATE PROCEDURE _insertUpdateOrDeleteListElement (
--     IN listID BIGINT UNSIGNED,
--     IN subjID BIGINT UNSIGNED,
--     IN score1 FLOAT,
--     IN score2 FLOAT,
--     IN otherData VARBINARY(16),
--     IN addedUploadDataCost FLOAT,
--     OUT exitCode TINYINT
-- )
-- BEGIN
--     DECLARE prevScore1, prevScore2 FLOAT;
--     DECLARE prevListLen BIGINT UNSIGNED;
--     DECLARE isExceeded TINYINT;

--     SET score2 = IFNULL(score2, 0);

--     -- We get a lock on the ListMetadata row, and branch accordingly in order
--     -- to update the ListMetadata table correctly.
--     DO GET_LOCK(CONCAT( "ListMetadata.", listID ), 10);


--     SELECT score_1, score_2 INTO prevScore1, prevScore2
--     FROM EntityLists FORCE INDEX (PRIMARY)
--     WHERE (
--         list_id = listID AND
--         subj_id = subjID
--     );

--     -- Branch according to whether the score should be inserted, updated, or
--     -- deleted, the latter being the case where the floatVal input is NULL. 
--     IF (score1 IS NOT NULL AND prevScore1 IS NULL) THEN
--         INSERT INTO EntityLists (
--             list_id, subj_id,
--             score_1, score_2,
--             other_data
--         ) VALUES (
--             listID, subjID,
--             score1, score2,
--             IFNULL(otherData, DEFAULT(other_data))
--         );

--         INSERT INTO ListMetadata (
--             list_id,
--             list_len, score_1_sum, score_2_sum,
--             pos_list_len,
--             paid_upload_data_cost
--         ) VALUES (
--             listID,
--             1, score1, score2,
--             IF(score1 > 0, 1, 0),
--             addedUploadDataCost
--         )
--         ON DUPLICATE KEY UPDATE
--             list_len = list_len + 1,
--             score_1_sum = score_1_sum + score1,
--             score_2_sum = score_2_sum + score2,
--             pos_list_len = pos_list_len + IF(score1 > 0, 1, 0),
--             paid_upload_data_cost = paid_upload_data_cost +
--                 addedUploadDataCost;

--         SET exitCode = 0; -- insert.

--     ELSEIF (score1 IS NOT NULL AND prevScore1 IS NOT NULL) THEN
--         UPDATE EntityLists SET
--             score_1 = score1,
--             score_2 = score2,
--             other_data = IFNULL(otherData, DEFAULT(other_data))
--         WHERE (
--             list_id = listID AND
--             subj_id = subjID
--         );
        
--         UPDATE ListMetadata SET
--             score_1_sum = score_1_sum + score1 - prevScore1,
--             score_2_sum = score_2_sum + score2 - prevScore2,
--             pos_list_len = pos_list_len + CASE
--                 WHEN (score1 > 0 AND prevScore1 <= 0) THEN 1
--                 WHEN (score1 <= 0 AND prevScore1 > 0) THEN -1
--                 ELSE 0
--             END,
--             paid_upload_data_cost = paid_upload_data_cost +
--                 addedUploadDataCost
--         WHERE list_id = listID;

--         SET exitCode = 1; -- update.

--     ELSEIF (score1 IS NULL AND prevScore1 IS NOT NULL) THEN
--         DELETE FROM EntityLists
--         WHERE (
--             user_group_id = userGroupID AND
--             list_spec_id = listSpecID AND
--             subj_id = subjID
--         );
        
--         UPDATE ListMetadata SET
--             list_len = list_len - 1,
--             score_1_sum = score_1_sum - prevScore1,
--             score_2_sum = score_2_sum - prevScore2,
--             pos_list_len = pos_list_len + IF(prevScore1 > 0, -1, 0),
--             paid_upload_data_cost = paid_upload_data_cost +
--                 addedUploadDataCost
--         WHERE list_id = listID;

--         SET exitCode = 2; -- deletion.
--     ELSE
--         SET exitCode = 3; -- no change.
--     END IF;

--     DO RELEASE_LOCK(CONCAT( "ListMetadata.", listID ));
-- END //
-- DELIMITER ;















-- DELIMITER //
-- CREATE PROCEDURE insertOrUpdateScore (
--     IN userID BIGINT UNSIGNED,
--     IN listDefStr VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
--     IN readerWhitelistID BIGINT UNSIGNED,
--     IN subjID BIGINT UNSIGNED,
--     IN score1 FLOAT,
--     IN score2 FLOAT,
--     IN otherDataHex VARCHAR(32)
-- )
-- proc: BEGIN
--     DECLARE isExceeded, exitCode TINYINT;
--     DECLARE listID, editorID BIGINT UNSIGNED;
--     DECLARE otherData VARBINARY(16) DEFAULT (UNHEX(otherDataHex));
--     DECLARE addedUploadDataCost FLOAT DEFAULT (32 + LENGTH(otherData));

--     -- Insert of find the list entity.
--     CALL _parseAndObtainRegularEntity (
--         userID, listDefStr, readerWhitelistID, 0, 1, 0,
--         listID, exitCode
--     );
--     IF (exitCode >= 2) THEN
--         SELECT listID AS outID, 3 AS exitCode; -- finding/inserting list failed.
--         LEAVE proc;
--     END IF;

--     -- Pay the upload data cost for the score insert.
--     CALL _increaseWeeklyUserCounters (
--         userID, 0, addedUploadDataCost, 0, isExceeded
--     );
--     -- Exit if upload limit was exceeded.
--     IF (isExceeded) THEN
--         SELECT listID AS outID, 5 AS exitCode; -- upload limit was exceeded.
--         LEAVE proc;
--     END IF;

--     -- Check that user is the editor of the list, which is always the first
--     -- input in a list function (even though the parameter is sometimes named
--     -- something else, like 'User').
--     SET editorID = CAST(REGEXP_SUBSTR(listDefStr, "[0-9]+", 1, 2) AS UNSIGNED);
--     IF NOT (userID <=> editorID) THEN
--         SELECT listID AS outID, 2 AS exitCode; -- user is not the editor.
--         LEAVE proc;
--     END IF;

--     -- Finally insert the user score, updating the ListMetadata in the
--     -- process.
--     CALL _insertUpdateOrDeleteListElement (
--         listID,
--         subjID,
--         score1,
--         score2,
--         otherData,
--         addedUploadDataCost,
--         exitCode
--     );

--     SELECT listID AS outID, exitCode; -- 0: inserted, or 1: updated.
-- END proc //
-- DELIMITER ;



-- DELIMITER //
-- CREATE PROCEDURE deleteScore (
--     IN userID BIGINT UNSIGNED,
--     IN listDefStr VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
--     IN readerWhitelistID BIGINT UNSIGNED,
--     IN subjID BIGINT UNSIGNED
-- )
-- proc: BEGIN
--     DECLARE isExceeded, exitCode TINYINT;
--     DECLARE listID, editorID BIGINT UNSIGNED;

--     -- Insert of find the list entity.
--     CALL _parseAndObtainRegularEntity (
--         userID, listDefStr, readerWhitelistID, 0, 1, 0,
--         listID, exitCode
--     );
--     IF (exitCode >= 2) THEN
--         SELECT listID AS outID, 3 AS exitCode; -- finding/inserting list failed.
--         LEAVE proc;
--     END IF;

--     -- Check that user is the editor of the list, which is always the first
--     -- input in a list function (even though the parameter is sometimes named
--     -- something else, like 'User').
--     SET editorID = CAST(REGEXP_SUBSTR(listDefStr, "[0-9]+", 1, 2) AS UNSIGNED);
--     IF NOT (userID <=> editorID) THEN
--         SELECT listID AS outID, 2 AS exitCode; -- user is not the editor.
--         LEAVE proc;
--     END IF;

--     -- Finally delete the score.
--     CALL _insertUpdateOrDeleteListElement (
--         listID,
--         subjID,
--         NULL,
--         NULL,
--         NULL,
--         0,
--         exitCode
--     );

--     SELECT listID AS outID, 0 AS exitCode; -- score was deleted if there.
-- END proc //
-- DELIMITER ;




-- DELIMITER //
-- CREATE PROCEDURE insertOrUpdateUserScore (
--     IN userID BIGINT UNSIGNED,
--     IN qualID BIGINT UNSIGNED,
--     IN subjID BIGINT UNSIGNED,
--     IN scoreMid FLOAT,
--     IN scoreRad FLOAT,
--     IN truncateTimeBy TINYINT UNSIGNED
-- )
-- proc: BEGIN
--     DECLARE isExceeded, exitCode TINYINT;
--     DECLARE userScoreFunID BIGINT UNSIGNED DEFAULT (
--         SELECT id FROM FundamentalEntityIDs WHERE ident = "user_score"
--     );
--     DECLARE userScoreListID BIGINT UNSIGNED;
--     DECLARE userScoreListDefStr VARCHAR(700)
--         CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT (
--             CONCAT('@[', userScoreFunID, '],@[', userID, '],@[', qualID, ']')
--         );
--     DECLARE unixTime INT UNSIGNED DEFAULT (
--         UNIX_TIMESTAMP() >> truncateTimeBy << truncateTimeBy
--     );
--     DECLARE unixTimeBin VARBINARY(4) DEFAULT (
--         UNHEX(CONV(unixTime, 10, 16))
--     );

--     -- Pay the upload data cost for the score insert.
--     CALL _increaseWeeklyUserCounters (
--         userID, 0, 20, 0, isExceeded
--     );
--     -- Exit if upload limit was exceeded.
--     IF (isExceeded) THEN
--         SELECT subjID AS outID, 5 AS exitCode; -- upload limit was exceeded.
--         LEAVE proc;
--     END IF;

--     -- Insert of find the user score list spec entity, and exit if upload limit
--     -- is exceeded.
--     CALL _insertOrFindRegularEntity (
--         userID, userScoreListDefStr, 0, 1,
--         userScoreListID, exitCode
--     );
--     IF (exitCode = 5) THEN
--         SELECT subjID AS outID, 5 AS exitCode; -- upload limit was exceeded.
--         LEAVE proc;
--     END IF;

--     -- Exit if the subject entity does not exist.
--     IF (
--         (
--             SELECT ent_type
--             FROM Entities FORCE INDEX (PRIMARY)
--             WHERE id = subjID
--         )
--         IS NULL
--     ) THEN
--         SELECT subjID AS outID, 3 AS exitCode; -- subject does not exist.
--         LEAVE proc;
--     END IF;

--     -- Finally insert the user score, updating the ListMetadata in the
--     -- process.
--     CALL _insertUpdateOrDeleteListElement (
--         userScoreListID,
--         subjID,
--         scoreMid,
--         scoreRad,
--         unixTimeBin,
--         NULL,
--         20,
--         exitCode
--     );

--     SELECT subjID AS outID, exitCode; -- 0: inserted, or 1: updated.
-- END proc //
-- DELIMITER ;


