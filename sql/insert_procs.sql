
SELECT "Insert procedures";

DROP PROCEDURE _insertUpdateOrDeletePublicListElement;
DROP PROCEDURE _getIsMemberAndUserWeight;


DROP PROCEDURE insertOrUpdatePublicUserScore;
DROP PROCEDURE deletePublicUserScore;

DROP PROCEDURE insertOrUpdatePrivateUserScore;
DROP PROCEDURE deletePrivateUserScore;
DROP PROCEDURE deleteAllPrivateUserScores;


DROP PROCEDURE _insertEntityWithoutSecKey;
DROP PROCEDURE _insertOrFindEntityWithSecKey;

DROP PROCEDURE insertAttributeDefinedEntity;
DROP PROCEDURE insertFunctionEntity;
DROP PROCEDURE insertOrFindFunctionCallEntity;
DROP PROCEDURE _insertOrFindFunctionCallEntity;
DROP PROCEDURE insertUTF8Entity;
DROP PROCEDURE insertHTMLEntity;
DROP PROCEDURE insertJSONEntity;

DROP PROCEDURE _editEntity;

DROP PROCEDURE editUTF8Entity;
DROP PROCEDURE editHTMLEntity;
DROP PROCEDURE editJSONEntity;

DROP PROCEDURE _substitutePlaceholdersInEntity;

DROP PROCEDURE substitutePlaceholdersInAttrEntity;
DROP PROCEDURE substitutePlaceholdersInFunEntity;

DROP PROCEDURE _nullUserRefsInEntity;

DROP PROCEDURE nullUserRefsInFunCallEntity;

DROP PROCEDURE finalizeEntity;
DROP PROCEDURE anonymizeEntity;


DROP PROCEDURE _increaseWeeklyUserCounters;







DELIMITER //
CREATE PROCEDURE _insertUpdateOrDeletePublicListElement (
    IN listID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN float1Val FLOAT,
    IN float2Val FLOAT,
    IN onIndexData VARBINARY(32),
    IN offIndexData VARBINARY(32),
    IN addedUploadDataCost FLOAT,
    OUT exitCode TINYINT
)
BEGIN
    DECLARE prevFloatVal1, prevFloatVal2 FLOAT;
    DECLARE prevListLen BIGINT UNSIGNED;
    DECLARE isExceeded TINYINT;

    SET float2Val = CASE WHEN (float2Val IS NULL)
        THEN 0 ELSE float2Val
    END;

    -- We select (for update) the previous score on the list, and branch
    -- accordingly in order to update the ListMetadata table correctly.
    START TRANSACTION;

    SELECT list_len INTO prevListLen -- only used to lock ListMetadata row.
    FROM PublicListMetadata FORCE INDEX (PRIMARY)
    WHERE list_id = listID
    FOR UPDATE;

    SELECT float_1_val, float_2_val INTO prevFloatVal1, prevFloatVal2
    FROM PublicEntityLists FORCE INDEX (PRIMARY)
    WHERE (
        list_id = listID AND
        subj_id = subjID
    );

    -- Branch according to whether the score should be inserted, updated, or
    -- deleted, the latter being the case where the floatVal input is NULL. 
    IF (float1Val IS NOT NULL AND prevFloatVal1 IS NULL) THEN
        INSERT INTO PublicEntityLists (
            list_id, subj_id,
            float_1_val, float_2_val, on_index_data, off_index_data
        ) VALUES (
            listID, subjID,
            float1Val, float2Val, onIndexData, offIndexData
        );

        INSERT INTO PublicListMetadata (
            list_id,
            list_len, float_1_sum, float_1_sum,
            pos_list_len,
            paid_upload_data_cost
        ) VALUES (
            listID,
            1, float1Val, float2Val,
            CASE WHEN (float1Val > 0) THEN 1 ELSE 0 END,
            addedUploadDataCost
        )
        ON DUPLICATE KEY UPDATE
            list_len = list_len + 1,
            float_1_sum = float_1_sum + float1Val,
            float_2_sum = float_2_sum + float2Val,
            pos_list_len = pos_list_len +
                CASE WHEN (float1Val > 0) THEN 1 ELSE 0 END,
            paid_upload_data_cost = paid_upload_data_cost +
                addedUploadDataCost;

        COMMIT;
        SET exitCode = 0; -- insert.

    ELSEIF (float1Val IS NOT NULL AND prevFloatVal1 IS NOT NULL) THEN
        UPDATE PublicEntityLists SET
            float_1_val = float1Val,
            float_2_val = float2Val,
            on_index_data = onIndexData,
            off_index_data = offIndexData
        WHERE (
            list_id = listID AND
            subj_id = subjID
        );
        
        UPDATE PublicListMetadata SET
            float_1_sum = float_1_sum + float1Val - prevFloatVal1,
            float_2_sum = float_2_sum + float2Val - prevFloatVal2,
            pos_list_len = pos_list_len +
                CASE
                    WHEN (float1Val > 0 AND prevFloatVal1 <= 0) THEN 1
                    WHEN (float1Val <= 0 AND prevFloatVal1 > 0) THEN -1
                    ELSE 0
                END,
            paid_upload_data_cost = paid_upload_data_cost +
                addedUploadDataCost
        WHERE list_id = listID;

        COMMIT;
        SET exitCode = 1; -- update.

    ELSEIF (float1Val IS NULL AND prevFloatVal1 IS NOT NULL) THEN
        DELETE FROM PublicEntityLists
        WHERE (
            user_group_id = userGroupID AND
            list_spec_id = listSpecID AND
            subj_id = subjID
        );
        
        UPDATE PublicListMetadata SET
            list_len = list_len - 1,
            float_1_sum = float_1_sum - prevFloatVal1,
            float_2_sum = float_2_sum - prevFloatVal2,
            pos_list_len = pos_list_len +
                CASE WHEN (prevFloatVal1 > 0) THEN -1 ELSE 0 END,
            paid_upload_data_cost = paid_upload_data_cost +
                addedUploadDataCost
        WHERE list_id = listID;

        COMMIT;
        SET exitCode = 2; -- deletion.
    ELSE
        COMMIT;
        SET exitCode = 3; -- no change.
    END IF;
END //
DELIMITER ;





-- DELIMITER //
-- CREATE PROCEDURE _getModeratorGroupAndUserGroupSpecAndLockedAfterTime (
--     IN userGroupID BIGINT UNSIGNED,
--     IN contextUserGroupID BIGINT UNSIGNED,
--     OUT moderatorGroupID BIGINT UNSIGNED,
--     OUT userGroupSpecID BIGINT UNSIGNED,
--     OUT lockedAfter DATETIME
-- )
-- proc: BEGIN
--     DECLARE userGroupEntType CHAR;
--     DECLARE userGroupDefStr VARCHAR(700);
--     DECLARE isLockedList, isList BOOL;
--     -- We first check that the user is in the given user group. If not, make
--     -- sure that any existing score of the user is deleted from the two lists.
--     SELECT ent_type, def_str INTO userGroupEntType, userGroupDefStr
--     FROM Entities FORCE INDEX (PRIMARY)
--     WHERE (
--         id = userGroupID AND
--         user_whitelist_id = 0
--     );

--     IF (userGroupEntType = "c") THEN
--         -- Check that the entity is either a (dynamic) list or a locked list.
--         SET isLockedList = REGEXP_LIKE(userGroupDefStr, CONCAT(
--             "@12,@[1-9][0-9]*,@[1-9][0-9]*,",
--             "[0-9]{4}\\-[0-9]{2}\\-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}"
--         ));
--         SET isList = isLockedList OR REGEXP_LIKE(userGroupDefStr,
--             "@11,@[1-9][0-9]*,@[1-9][0-9]*"
--         );

--         IF (NOT isList) THEN
--             SET moderatorGroupID = NULL;
--             SET userGroupSpecID = NULL;
--             SET lockedAfter = NULL;
--             LEAVE proc;
--         END IF

--         SET moderatorGroupID = REGEXP_SUBSTR(userGroupDefStr,
--             "[1-9][0-9]*", 6, 1
--         );
--         SET userGroupSpecID = REGEXP_SUBSTR(userGroupDefStr,
--             "[1-9][0-9]*", 6, 2
--         );
--         SET lockedAfter = CASE WHEN (isLockedList)
--             THEN REGEXP_SUBSTR(userGroupDefStr, "[^,]+$", 6, 1)
--             ELSE NULL
--         END CASE;
--         LEAVE proc;

--     ELSE IF (userGroupEntType = "a") THEN
--         -- Check that the entity is a user group variable.
--         IF NOT (
--             REGEXP_SUBSTR(userGroupDefStr, '^\\{"Class":"@20",', 1, 1)
--         ) THEN
--             SET moderatorGroupID = NULL;
--             SET userGroupSpecID = NULL;
--             SET lockedAfter = NULL;
--             LEAVE proc;
--         END IF

--         -- If so, look up the contextUserGroup's top rated replacement for
--         -- the given user group variable...

--     ELSE
--         SET moderatorGroupID = NULL;
--         SET userGroupSpecID = NULL;
--         SET lockedAfter = NULL;
--     END IF;
-- END proc //
-- DELIMITER ;




DELIMITER //
CREATE PROCEDURE _getIsMemberAndUserWeight (
    IN userID BIGINT UNSIGNED,
    IN userGroupID BIGINT UNSIGNED,
    OUT isMember BOOL,
    OUT userWeightVal FLOAT
)
proc: BEGIN
    IF (
        userGroupID <=> 0 AND
        "u" <=> (
            SELECT ent_type
            FROM Entities FORCE INDEX (PRIMARY)
            WHERE id = userID
        )
        OR
        userGroupID != 0 AND
        userID = userGroupID
    ) THEN
        SET isMember = 1;
        SET userWeightVal = 1;
        LEAVE proc;
    END IF;

    SELECT float_1_val INTO userWeightVal
    FROM PublicEntityLists FORCE INDEX (PRIMARY)
    WHERE (
        list_id = userGroupID AND
        subj_id = userID
    );

    SET isMember = (userWeightVal > 0);
END proc //
DELIMITER ;













DELIMITER //
CREATE PROCEDURE insertOrUpdatePublicUserScore (
    IN userID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN scoreMid FLOAT,
    IN scoreRad FLOAT,
    IN truncateTimeBy TINYINT UNSIGNED
)
proc: BEGIN
    DECLARE isExceeded, exitCode TINYINT;
    DECLARE userScoreListID BIGINT UNSIGNED;
    DECLARE userScoreListDefStr VARCHAR(700)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT (
            CONCAT('@[11],@[', userID, '],@[', qualID, ']')
        );
    DECLARE unixTime INT UNSIGNED DEFAULT (
        UNIX_TIMESTAMP() >> truncateTimeBy << truncateTimeBy
    );
    DECLARE unixTimeBin VARBINARY(4) DEFAULT (
        UNHEX(CONV(unixTime, 10, 16))
    );

    -- Pay the upload data cost for the score insert.
    CALL _increaseWeeklyUserCounters (
        userID, 0, 20, 0, isExceeded
    );
    -- Exit if upload limit was exceeded.
    IF (isExceeded) THEN
        SELECT subjID AS outID, 5 AS exitCode; -- upload limit was exceeded.
        LEAVE proc;
    END IF;

    -- Insert of find the user score list spec entity, and exit if upload limit
    -- is exceeded.
    CALL _insertOrFindFunctionCallEntity (
        userID, userScoreListDefStr, 0, 1,
        userScoreListID, exitCode
    );
    IF (exitCode = 5) THEN
        LEAVE proc;
    END IF;

    -- Exit if the subject entity does not exist.
    IF (
        (
            SELECT ent_type
            FROM Entities FORCE INDEX (PRIMARY)
            WHERE id = subjID
        )
        IS NULL
    ) THEN
        SELECT subjID AS outID, 3 AS exitCode; -- subject does not exist.
        LEAVE proc;
    END IF;

    -- Finally insert the user score, updating the PublicListMetadata in the
    -- process.
    CALL _insertUpdateOrDeletePublicListElement (
        userScoreListID,
        subjID,
        scoreMid,
        scoreRad,
        unixTimeBin,
        NULL,
        20,
        exitCode
    );

    SELECT subjID AS outID, exitCode; -- 0: inserted, or 1: updated.
END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE deletePublicUserScore (
    IN userID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED
)
BEGIN
    DECLARE userScoreListID BIGINT UNSIGNED;
    DECLARE userScoreListDefStr VARCHAR(700)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT (
            CONCAT('@[11],@[', userID, '],@[', qualID, ']')
        );
    DECLARE exitCode TINYINT;

    SELECT ent_id INTO userScoreListID
    FROM EntitySecKeys FORCE INDEX (PRIMARY)
    WHERE (
        ent_type = "c" AND
        user_whitelist_id = 0 AND
        def_key = userScoreListDefStr
    );

    CALL _insertUpdateOrDeletePublicListElement (
        userScoreListID,
        subjID,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        exitCode
    );
    SET exitCode = CASE WHEN (exitCode = 3)
        THEN 0 -- deleted.
        ELSE 1 -- no change.
    END;

    SELECT subjID AS outID, exitCode; -- score was deleted if there.
END //
DELIMITER ;











-- TODO: Correct these private score insert procedures below at some point.

DELIMITER //
CREATE PROCEDURE insertOrUpdatePrivateUserScore (
    IN userID BIGINT UNSIGNED,
    IN listType CHAR,
    IN userWhitelistID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN scoreVal BIGINT
)
proc: BEGIN
    DECLARE isExceeded TINYINT;
    DECLARE userWhitelistScoreVal FLOAT;

    CALL _increaseWeeklyUserCounters (
        userID, 0, 25, 10, isExceeded
    );
    IF (isExceeded) THEN
        SELECT subjID AS outID, 5 AS exitCode; -- counter was exceeded.
        LEAVE proc;
    END IF;

    -- Exit if the user is not currently on the user whitelist.
    SELECT score_val INTO userWhitelistScoreVal
    FROM FloatScoreAndWeightAggregates
    WHERE (
        list_id = userWhitelistID AND
        subj_id = userID
    );
    IF (userWhitelistScoreVal IS NULL OR userWhitelistScoreVal <= 0) THEN
        SELECT subjID AS outID, 1 AS exitCode; -- user is not on the whitelist.
        LEAVE proc;
    END IF;

    INSERT INTO PrivateUserScores (
        list_type, user_whitelist_id, qual_id,
        score_val, user_id, subj_id
    )
    VALUES (
        listType, userWhitelistID, qualID,
        scoreVal, userID, subjID
    );

    SELECT subjID AS outID, 0 AS exitCode; -- inserted if not already there.
END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deletePrivateUserScore (
    IN userID BIGINT UNSIGNED,
    IN listType CHAR,
    IN userWhitelistID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN scoreVal BIGINT
)
proc: BEGIN
    CALL _increaseWeeklyUserCounters (
        userID, 0, 0, 10, isExceeded
    );
    IF (isExceeded) THEN
        SELECT subjID AS outID, 5 AS exitCode; -- counter was exceeded.
        LEAVE proc;
    END IF;

    DELETE FROM PrivateUserScores
    WHERE (
        list_type = listType AND
        user_whitelist_id = userWhitelistID AND
        qual_id = qualID AND
        score_val = scoreVal AND
        user_id = userID AND
        subj_id = subjID
    );

    -- TODO: Also add a request (or reduce the countdown) to go through the
    -- scores on this list and remove any entries from users no longer on the
    -- whitelist. (Implement as a procedure.)

    SELECT subjID AS outID, 0 AS exitCode; -- delete if there.
END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteAllPrivateUserScores (
    IN userID BIGINT UNSIGNED,
    IN listType CHAR,
    IN userWhitelistID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED
)
proc: BEGIN
    DECLARE isExceeded TINYINT;

    -- Some arbitrary (pessimistic or optimistic) guess at the computation time.
    CALL _increaseWeeklyUserCounters (
        userID, 0, 0, 1000, isExceeded
    );
    IF (isExceeded) THEN
        SELECT subjID AS outID, 5 AS exitCode; -- counter was exceeded.
        LEAVE proc;
    END IF;

    DELETE FROM PrivateUserScores
    WHERE (
        list_type = listType AND
        user_whitelist_id = userWhitelistID AND
        qual_id = qualID AND
        user_id = userID
    );

    SELECT subjID AS outID, 0 AS exitCode; -- deleted if there.
END proc //
DELIMITER ;


-- DELIMITER //
-- CREATE PROCEDURE deleteSeveralPrivateUserScores (
--     IN userID BIGINT UNSIGNED,
--     IN userWhitelistID BIGINT UNSIGNED,
--     IN qualID BIGINT UNSIGNED,
--     IN scoreCutoff BIGINT UNSIGNED
-- )
-- BEGIN
--     DELETE FROM PrivateUserScores
--     WHERE (
--         user_whitelist_id = userWhitelistID AND
--         qual_id = qualID AND
--         subj_id = subjID AND
--         score_val < scoreCutoff AND
--         user_id = userID
--     );

--     SELECT subjID AS outID, 0 AS exitCode; -- delete if there.
-- END //
-- DELIMITER ;












DELIMITER //
CREATE PROCEDURE _insertEntityWithoutSecKey (
    IN entType CHAR,
    IN userID BIGINT UNSIGNED,
    IN defStr LONGTEXT CHARACTER SET utf8mb4,
    IN userWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL,
    IN isEditable BOOL,
    OUT outID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
proc: BEGIN
    DECLARE isExceeded TINYINT;

    IF (userWhitelistID = 0) THEN
        SET userWhitelistID = NULL;
    END IF;

    CALL _increaseWeeklyUserCounters (
        userID, 0, LENGTH(CAST(defStr AS BINARY)) + 22, 0, isExceeded
    );

    IF (isExceeded) THEN
        SET outID = NULL;
        SET exitCode = 5; -- upload limit was exceeded.
        SELECT outID, exitCode;
        LEAVE proc;
    END IF;

    INSERT INTO Entities (
        creator_id,
        ent_type, def_str, user_whitelist_id, is_editable
    )
    VALUES (
        CASE WHEN (isAnonymous) THEN 0 ELSE userID END,
        entType, defStr, userWhitelistID, isEditable AND NOT isAnonymous
    );
    SET outID = LAST_INSERT_ID();

    SET exitCode = 0; -- insert.
    SELECT outID, exitCode;
END proc //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE _insertOrFindEntityWithSecKey (
    IN entType CHAR,
    IN userID BIGINT UNSIGNED,
    IN defStr TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    IN userWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL,
    OUT outID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
proc: BEGIN
    DECLARE isExceeded TINYINT;
    -- DECLARE EXIT HANDLER FOR 1213 -- Deadlock error.
    -- BEGIN
    --     ROLLBACK;
    --     SELECT NULL AS outID, 10 AS exitCode; -- rollback due to deadlock.
    -- END;

    DECLARE EXIT HANDLER FOR 1586 -- Duplicate key entry error.
    BEGIN
        ROLLBACK;

        SELECT ent_id INTO outID
        FROM EntitySecKeys
        WHERE (
            ent_type = entType AND
            user_whitelist_id = userWhitelistID AND
            def_key = defStr
        );

        SET exitCode = 1; -- find.
        SELECT outID, exitCode;
    END;

    START TRANSACTION;

    INSERT INTO Entities (
        creator_id,
        ent_type, def_str, user_whitelist_id, is_editable
    )
    VALUES (
        CASE WHEN (isAnonymous) THEN 0 ELSE userID END,
        entType, defStr, userWhitelistID, 0
    );
    SET outID = LAST_INSERT_ID();

    INSERT INTO EntitySecKeys (
        ent_type, user_whitelist_id, def_key, ent_id
    )
    VALUES (
        entType, userWhitelistID, defStr, outID
    );

    CALL _increaseWeeklyUserCounters (
        userID, 0, LENGTH(CAST(defStr AS BINARY)) * 2 + 31, 0, isExceeded
    );

    IF (isExceeded) THEN
        ROLLBACK;
        SET outID = NULL;
        SET exitCode = 5; -- upload limit was exceeded.
        SELECT outID, exitCode;
        LEAVE proc;
    END IF;

    COMMIT;

    SET exitCode = 0; -- insert.
    SELECT outID, exitCode;
END proc //
DELIMITER ;







DELIMITER //
CREATE PROCEDURE insertAttributeDefinedEntity (
    IN userID BIGINT UNSIGNED,
    IN defStr VARCHAR(700) CHARACTER SET utf8mb4,
    IN userWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL
)
BEGIN
    CALL _insertEntityWithoutSecKey (
        "a",
        userID, defStr, userWhitelistID, isAnonymous, 0,
        @unused, @unused
    );
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE insertFunctionEntity (
    IN userID BIGINT UNSIGNED,
    IN defStr VARCHAR(700) CHARACTER SET utf8mb4,
    IN userWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL
)
BEGIN
    CALL _insertEntityWithoutSecKey (
        "f",
        userID, defStr, userWhitelistID, isAnonymous, 0,
        @unused, @unused
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE insertOrFindFunctionCallEntity (
    IN userID BIGINT UNSIGNED,
    IN defStr VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    IN userWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL
)
BEGIN
    CALL _insertOrFindEntityWithSecKey (
        "c",
        userID, defStr, userWhitelistID, isAnonymous,
        @unused, @unused
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE _insertOrFindFunctionCallEntity (
    IN userID BIGINT UNSIGNED,
    IN defStr VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    IN userWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL,
    OUT outID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
BEGIN
    CALL _insertOrFindEntityWithSecKey (
        "c",
        userID, defStr, userWhitelistID, isAnonymous,
        outID, exitCode
    );
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertUTF8Entity (
    IN userID BIGINT UNSIGNED,
    IN defStr TEXT CHARACTER SET utf8mb4,
    IN userWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL,
    IN isEditable BOOL
)
BEGIN
    CALL _insertEntityWithoutSecKey (
        "8",
        userID, defStr, userWhitelistID, isAnonymous, isEditable,
        @unused, @unused
    );
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE insertHTMLEntity (
    IN userID BIGINT UNSIGNED,
    IN defStr TEXT CHARACTER SET utf8mb4,
    IN userWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL,
    IN isEditable BOOL
)
BEGIN
    CALL _insertEntityWithoutSecKey (
        "h",
        userID, defStr, userWhitelistID, isAnonymous, isEditable,
        @unused, @unused
    );
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE insertJSONEntity (
    IN userID BIGINT UNSIGNED,
    IN defStr TEXT CHARACTER SET utf8mb4,
    IN userWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL,
    IN isEditable BOOL
)
BEGIN
    CALL _insertEntityWithoutSecKey (
        "j",
        userID, defStr, userWhitelistID, isAnonymous, isEditable,
        @unused, @unused
    );
END //
DELIMITER ;










DELIMITER //
CREATE PROCEDURE _editEntity (
    IN entType CHAR,
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN defStr LONGTEXT CHARACTER SET utf8mb4,
    IN userWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL,
    IN isEditable BOOL
)
proc: BEGIN
    DECLARE isExceeded TINYINT;
    DECLARE creatorID BIGINT UNSIGNED;
    DECLARE prevIsEditable TINYINT UNSIGNED;
    DECLARE prevDefStr LONGTEXT;
    DECLARE prevType CHAR;

    IF (userWhitelistID = 0) THEN
        SET userWhitelistID = NULL;
    END IF;

    CALL _increaseWeeklyUserCounters (
        userID, 0, LENGTH(CAST(defStr AS BINARY)) + 22, 0, isExceeded
    );

    IF (isExceeded) THEN
        SELECT entID AS outID, 5 AS extCode; -- upload limit was exceeded.
        LEAVE proc;
    END IF;


    SELECT ent_type, creator_id, def_str, is_editable
    INTO prevType, creatorID, prevDefStr, prevIsEditable 
    FROM Entities
    WHERE id = entID;

    IF (creatorID != userID) THEN
        SELECT entID AS outID, 2 AS exitCode; -- user is not the owner.
        LEAVE proc;
    END IF;

    IF (NOT prevIsEditable) THEN
        SELECT entID AS outID, 3 AS exitCode; -- can not be edited.
        LEAVE proc;
    END IF;

    IF (prevType != entType) THEN
        SELECT entID AS outID, 4 AS exitCode; -- changing entType not allowed.
        LEAVE proc;
    END IF;

    -- If all checks succeed, update the entity.
    UPDATE Entities
    SET
        creator_id = CASE WHEN (isAnonymous) THEN 0 ELSE userID END,
        def_str = defStr,
        user_whitelist_id = userWhitelistID,
        is_editable = isEditable
    WHERE id = entID;

    SELECT entID AS outID, 0 AS exitCode; -- edit.
END proc //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE editUTF8Entity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN defStr TEXT CHARACTER SET utf8mb4,
    IN userWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL,
    IN isEditable BOOL
)
BEGIN
    CALL _editEntity (
        "8",
        userID, entID, defStr, userWhitelistID, isAnonymous, isEditable
    );
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE editHTMLEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN defStr TEXT CHARACTER SET utf8mb4,
    IN userWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL,
    IN isEditable BOOL
)
BEGIN
    CALL _editEntity (
        "h",
        userID, entID, defStr, userWhitelistID, isAnonymous, isEditable
    );
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE editJSONEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN defStr TEXT CHARACTER SET utf8mb4,
    IN userWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL,
    IN isEditable BOOL
)
proc: BEGIN
    CALL _editEntity (
        "j",
        userID, entID, defStr, userWhitelistID, isAnonymous, isEditable
    );
END proc //
DELIMITER ;









-- TODO: Add counter increase to this procedure.

DELIMITER //
CREATE PROCEDURE _substitutePlaceholdersInEntity (
    IN entType CHAR,
    IN maxLen INT UNSIGNED,
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN paths TEXT, -- List of the form '<path_1>,<path_2>...'
    IN substitutionEntIDs TEXT -- List of the form '<entID_1>,<entID_2>...'
)
proc: BEGIN
    DECLARE creatorID BIGINT UNSIGNED;
    DECLARE prevDefStr, newDefStr LONGTEXT;
    DECLARE prevType CHAR;
    DECLARE i TINYINT UNSIGNED DEFAULT 0;
    DECLARE pathStr TEXT;
    DECLARE subEntID BIGINT UNSIGNED;

    SELECT ent_type, creator_id, def_str
    INTO prevType, creatorID, prevDefStr 
    FROM Entities
    WHERE id = entID;

    IF (creatorID != userID) THEN
        SELECT entID AS outID, 2 AS exitCode; -- user is not the owner.
        LEAVE proc;
    END IF;

    IF (prevType != entType) THEN
        SELECT entID AS outID, 3 AS exitCode; -- entType is incorrect.
        LEAVE proc;
    END IF;

    -- If all checks succeed, first initialize newDefStr.
    SET newDefStr = prevDefStr;

    -- Then loop through all the paths and substitute any
    -- occurrences inside prevDefStr with the corresponding entIDs.
    label: LOOP
        SET i = i + 1;

        SET pathStr = REGEXP_SUBSTR(paths, "[^,]+", 1, i);
        SET subEntID = CAST(
            REGEXP_SUBSTR(substitutionEntIDs, "[^,]+", 1, i) AS UNSIGNED
        );

        IF (pathStr IS NULL OR subEntID IS NULL) THEN
            LEAVE label;
        ELSE
            -- Replace all occurrences of '@[<path>]' with '@<subEntID>'.
            SET newDefStr = REPLACE(
                newDefStr,
                CONCAT("@[", pathStr,  "]"),
                CONCAT("@[", subEntID, "]")
            );
            ITERATE label;
        END IF;
    END LOOP label;

    -- Check that newDefStr is not too long.
    IF (LENGTH(newDefStr) > maxLen) THEN
        SELECT entID AS outID, 4 AS exitCode; -- new defStr too long.
        LEAVE proc;
    END IF;
    

    -- Then finally update the entity with the new defStr.
    UPDATE Entities
    SET def_str = newDefStr
    WHERE id = entID;

    SELECT entID AS outID, 0 AS exitCode; -- edit.
END proc //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE substitutePlaceholdersInAttrEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN paths TEXT, -- List of the form '<path_1>,<path_2>...'
    IN substitutionEntIDs TEXT -- List of the form '<entID_1>,<entID_2>...'
)
BEGIN
    CALL _substitutePlaceholdersInEntity (
        "a",
        700, userID, entID, defStr, paths, substitutionEntIDs
    );
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE substitutePlaceholdersInFunEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN paths TEXT, -- List of the form '<path_1>,<path_2>...'
    IN substitutionEntIDs TEXT -- List of the form '<entID_1>,<entID_2>...'
)
BEGIN
    CALL _substitutePlaceholdersInEntity (
        "f",
        700, userID, entID, defStr, paths, substitutionEntIDs
    );
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE _nullUserRefsInEntity (
    IN entType CHAR,
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
proc: BEGIN
    DECLARE prevDefStr, newDefStr LONGTEXT CHARACTER SET utf8mb4
        COLLATE utf8mb4_bin;
    DECLARE userWhiteListID BIGINT UNSIGNED;
    DECLARE isMember TINYINT;

    SELECT def_str, user_whitelist_id INTO prevDefStr, userWhiteListID
    FROM Entities FORCE INDEX (PRIMARY)
    WHERE (
        id = entID AND
        ent_type = entType
    );

    CALL _getIsMemberAndUserWeight (
        userID,
        userWhiteListID,
        isMember,
        @unused
    );

    IF NOT (isMember) THEN
        SET exitCode = 2; -- user is not on whitelist.
        LEAVE proc;
    END IF;
    
    SET newDefStr = REGEXP_REPLACE(
        prevDefStr, CONCAT('@[', userID, ']'), '@[0]'
    );

    IF (newDefStr <=> prevDefStr) THEN
        SET exitCode = 1; -- no changes.
    ELSE
        START TRANSACTION;

        UPDATE Entities
        SET def_str = newDefStr
        WHERE id = entID;

        DELETE FROM EntitySecKeys
        WHERE (
            ent_type = entType AND
            user_whitelist_id = userWhiteListID AND
            def_key = prevDefStr
        );

        COMMIT;
        SET exitCode = 0; -- occurrences was nulled.
    END IF;
END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE nullUserRefsInFunCallEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED
)
proc: BEGIN
    DECLARE exitCode TINYINT;

    CALL _substitutePlaceholdersInEntity (
        "c", userID, entID, exitCode
    );

    SELECT entID AS outID, exitCode;
END proc //
DELIMITER ;











DELIMITER //
CREATE PROCEDURE finalizeEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED
)
proc: BEGIN
    DECLARE creatorID BIGINT UNSIGNED;

    SELECT creator_id INTO creatorID
    FROM Entities
    WHERE id = entID;

    IF (creatorID != userID) THEN
        SELECT entID AS outID, 2 AS exitCode; -- user is not the owner.
        LEAVE proc;
    END IF;

    UPDATE Entities
    SET is_editable = 0
    WHERE id = entID;

    SELECT entID AS outID, 0 AS exitCode; -- edit.
END proc //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE anonymizeEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED
)
proc: BEGIN
    DECLARE creatorID BIGINT UNSIGNED;

    SELECT creator_id INTO creatorID
    FROM Entities
    WHERE id = entID;

    IF (creatorID != userID) THEN
        SELECT entID AS outID, 2 AS exitCode; -- user is not the owner.
        LEAVE proc;
    END IF;

    UPDATE Entities
    SET creator_id = 0, is_editable = 0
    WHERE id = entID;

    SELECT entID AS outID, 0 AS exitCode; -- edit.
END proc //
DELIMITER ;


















DELIMITER //
CREATE PROCEDURE _increaseWeeklyUserCounters (
    IN userID BIGINT UNSIGNED,
    IN downloadData FLOAT, -- Only used for query "as user" requests.
    IN uploadData FLOAT,
    IN compUsage FLOAT,
    OUT isExceeded TINYINT
)
proc: BEGIN
    DECLARE downloadCount, uploadCount, compCount FLOAT;
    DECLARE downloadLimit, uploadLimit, compLimit FLOAT;
    DECLARE lastRefreshedAt DATE;
    DECLARE currentDate DATE DEFAULT (CURDATE());

    -- userID can be set to 0 in order to suppress any counter checks.
    IF (userID = 0) THEN
        SET isExceeded = 0;
        LEAVE proc;
    END IF;
    
    SELECT
        download_data_this_week + uploadData,
        download_data_weekly_limit,
        upload_data_this_week + uploadData,
        upload_data_weekly_limit,
        computation_usage_this_week + compUsage,
        computation_usage_weekly_limit,
        last_refreshed_at
    INTO
        downloadCount,
        downloadLimit,
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
            download_data_this_week = 0,
            upload_data_this_week = 0,
            computation_usage_this_week = 0,
            last_refreshed_at = currentDate
        WHERE user_id = userID;

        SET downloadCount = downloadData;
        SET uploadCount = uploadData;
        SET compCount = compUsage;
    END IF;

    -- Then check if any limits are exceeded.
    SET isExceeded = (
        downloadCount > downloadLimit OR
        uploadCount > uploadLimit OR
        compCount > compLimit
    );

    -- Finally update the counters and return isExceeded.
    UPDATE Private_UserData
    SET
        download_data_this_week = downloadCount,
        upload_data_this_week = uploadCount,
        computation_usage_this_week = compCount
    WHERE user_id = userID;
END proc //
DELIMITER ;
