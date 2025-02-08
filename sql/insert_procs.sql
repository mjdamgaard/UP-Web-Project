
SELECT "Insert procedures";

DROP PROCEDURE _insertUpdateOrDeleteListElement;

DROP PROCEDURE insertOrUpdateScore;
DROP PROCEDURE deleteScore;


DROP PROCEDURE _insertEntityWithoutSecKey;
DROP PROCEDURE _insertOrFindEntityWithSecKey;

DROP PROCEDURE insertFunctionEntity;
DROP PROCEDURE insertOrFindRegularEntity;
DROP PROCEDURE _insertOrFindRegularEntity;
DROP PROCEDURE insertUTF8Entity;
DROP PROCEDURE insertHTMLEntity;
DROP PROCEDURE insertJSONEntity;

DROP PROCEDURE _editEntity;

DROP PROCEDURE editFunctionEntity;
DROP PROCEDURE editUTF8Entity;
DROP PROCEDURE editHTMLEntity;
DROP PROCEDURE editJSONEntity;

DROP PROCEDURE substitutePlaceholdersInEntity;

DROP PROCEDURE _nullUserRefsInEntity;

DROP PROCEDURE nullUserRefsInRegularEntity;

DROP PROCEDURE finalizeEntity;
DROP PROCEDURE anonymizeEntity;


DROP PROCEDURE _parseAndObtainRegularEntity;
DROP PROCEDURE __parseAndObtainRegularEntityHelper;

DROP PROCEDURE _increaseWeeklyUserCounters;







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




















DELIMITER //
CREATE PROCEDURE _insertEntityWithoutSecKey (
    IN entType CHAR,
    IN userID BIGINT UNSIGNED,
    IN defStr LONGTEXT CHARACTER SET utf8mb4,
    IN readerWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL,
    IN isEditable BOOL,
    OUT outID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
proc: BEGIN
    DECLARE isExceeded TINYINT;

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
        ent_type, def_str, reader_whitelist_id, is_editable,
        paid_upload_data_cost
    )
    VALUES (
        CASE WHEN (isAnonymous) THEN 0 ELSE userID END,
        entType, defStr, readerWhitelistID, isEditable AND NOT isAnonymous,
        LENGTH(defStr) + 25
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
    IN defStr VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    IN readerWhitelistID BIGINT UNSIGNED,
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

    DECLARE EXIT HANDLER FOR 1062, 1586 -- Duplicate key entry error.
    BEGIN
        ROLLBACK;

        SELECT ent_id INTO outID
        FROM EntitySecKeys
        WHERE (
            ent_type = entType AND
            reader_whitelist_id = readerWhitelistID AND
            def_key = defStr
        );

        SET exitCode = 1; -- find.
    END;

    START TRANSACTION;

    INSERT INTO Entities (
        creator_id,
        ent_type, def_str, reader_whitelist_id, is_editable,
        paid_upload_data_cost
    )
    VALUES (
        CASE WHEN (isAnonymous) THEN 0 ELSE userID END,
        entType, defStr, readerWhitelistID, 0,
        LENGTH(defStr) * 2 + 33
    );
    SET outID = LAST_INSERT_ID();

    INSERT INTO EntitySecKeys (
        ent_type, reader_whitelist_id, def_key, ent_id
    )
    VALUES (
        entType, readerWhitelistID, defStr, outID
    );

    CALL _increaseWeeklyUserCounters (
        userID, 0, LENGTH(CAST(defStr AS BINARY)) * 2 + 31, 0, isExceeded
    );

    IF (isExceeded) THEN
        ROLLBACK;
        SET outID = NULL;
        SET exitCode = 5; -- upload limit was exceeded.
        LEAVE proc;
    END IF;

    COMMIT;

    SET exitCode = 0; -- insert.
END proc //
DELIMITER ;







-- DELIMITER //
-- CREATE PROCEDURE insertAttributeDefinedEntity (
--     IN userID BIGINT UNSIGNED,
--     IN defStr TEXT CHARACTER SET utf8mb4,
--     IN readerWhitelistID BIGINT UNSIGNED,
--     IN isAnonymous BOOL
-- )
-- BEGIN
--     CALL _insertEntityWithoutSecKey (
--         "a",
--         userID, defStr, readerWhitelistID, isAnonymous, 0,
--         @unused, @unused
--     );
-- END //
-- DELIMITER ;

DELIMITER //
CREATE PROCEDURE insertScriptEntity (
    IN userID BIGINT UNSIGNED,
    IN defStr TEXT CHARACTER SET utf8mb4,
    IN readerWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL,
    IN isEditable BOOL
)
BEGIN
    CALL _insertEntityWithoutSecKey (
        "s",
        userID, defStr, readerWhitelistID, isAnonymous, isEditable,
        @unused, @unused
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE insertOrFindRegularEntity (
    IN userID BIGINT UNSIGNED,
    IN defStr VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    IN readerWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL
)
BEGIN
    DECLARE outID, exitCode BIGINT UNSIGNED;

    CALL _insertOrFindEntityWithSecKey (
        "r",
        userID, defStr, readerWhitelistID, isAnonymous,
        outID, exitCode
    );

    SELECT outID, exitCode;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE _insertOrFindRegularEntity (
    IN userID BIGINT UNSIGNED,
    IN defStr VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    IN readerWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL,
    OUT outID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
BEGIN
    CALL _insertOrFindEntityWithSecKey (
        "r",
        userID, defStr, readerWhitelistID, isAnonymous,
        outID, exitCode
    );
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertUTF8Entity (
    IN userID BIGINT UNSIGNED,
    IN defStr TEXT CHARACTER SET utf8mb4,
    IN readerWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL,
    IN isEditable BOOL
)
BEGIN
    CALL _insertEntityWithoutSecKey (
        "8",
        userID, defStr, readerWhitelistID, isAnonymous, isEditable,
        @unused, @unused
    );
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE insertHTMLEntity (
    IN userID BIGINT UNSIGNED,
    IN defStr TEXT CHARACTER SET utf8mb4,
    IN readerWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL,
    IN isEditable BOOL
)
BEGIN
    CALL _insertEntityWithoutSecKey (
        "h",
        userID, defStr, readerWhitelistID, isAnonymous, isEditable,
        @unused, @unused
    );
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE insertJSONEntity (
    IN userID BIGINT UNSIGNED,
    IN defStr TEXT CHARACTER SET utf8mb4,
    IN readerWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL,
    IN isEditable BOOL
)
BEGIN
    IF NOT (JSON_VALID(defStr)) THEN
        SELECT entID AS outID, 7 AS exitCode; -- Invalid JSON.
    END IF;
    CALL _insertEntityWithoutSecKey (
        "j",
        userID, defStr, readerWhitelistID, isAnonymous, isEditable,
        @unused, @unused
    );
END //
DELIMITER ;










DELIMITER //
CREATE PROCEDURE _editEntity (
    IN entType CHAR,
    IN maxLen INT UNSIGNED,
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN defStr LONGTEXT CHARACTER SET utf8mb4,
    IN readerWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL,
    IN isEditable BOOL
)
proc: BEGIN
    DECLARE isExceeded TINYINT;
    DECLARE creatorID BIGINT UNSIGNED;
    DECLARE prevIsEditable TINYINT UNSIGNED;
    DECLARE prevDefStr LONGTEXT;
    DECLARE prevLen, newLen, addedLen INT UNSIGNED;
    DECLARE prevType CHAR;

    DO GET_LOCK(CONCAT("EntID.", entID), 10);

    SET newLen = LENGTH(defStr);

    IF (newLen > maxLen) THEN
        DO RELEASE_LOCK(CONCAT("EntID.", entID));
        SELECT entID AS outID, 6 AS exitCode; -- defStr was too long.
        LEAVE proc;
    END IF;

    SELECT
        ent_type, creator_id, def_str, LENGTH(def_str), is_editable
    INTO prevType, creatorID, prevDefStr, prevLen, prevIsEditable 
    FROM Entities
    WHERE id = entID;

    SET addedLen = IF(newLen > prevLen, newLen - prevLen, 0);
    CALL _increaseWeeklyUserCounters (
        userID, 0, addedLen, 0, isExceeded
    );
    IF (isExceeded) THEN
        DO RELEASE_LOCK(CONCAT("EntID.", entID));
        SELECT entID AS outID, 5 AS extCode; -- upload limit was exceeded.
        LEAVE proc;
    END IF;

    IF (creatorID != userID) THEN
        DO RELEASE_LOCK(CONCAT("EntID.", entID));
        SELECT entID AS outID, 2 AS exitCode; -- user is not the owner.
        LEAVE proc;
    END IF;

    IF (NOT prevIsEditable) THEN
        DO RELEASE_LOCK(CONCAT("EntID.", entID));
        SELECT entID AS outID, 3 AS exitCode; -- cannot be edited.
        LEAVE proc;
    END IF;

    IF (prevType != entType) THEN
        DO RELEASE_LOCK(CONCAT("EntID.", entID));
        SELECT entID AS outID, 4 AS exitCode; -- changing entType not allowed.
        LEAVE proc;
    END IF;

    -- If all checks succeed, update the entity.
    UPDATE Entities
    SET
        creator_id = CASE WHEN (isAnonymous) THEN 0 ELSE userID END,
        def_str = defStr,
        reader_whitelist_id = readerWhitelistID,
        is_editable = isEditable
    WHERE id = entID;

    DO RELEASE_LOCK(CONCAT("EntID.", entID));
    SELECT entID AS outID, 0 AS exitCode; -- edit.
END proc //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE editScriptEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN defStr TEXT CHARACTER SET utf8mb4,
    IN readerWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL,
    IN isEditable BOOL
)
BEGIN
    CALL _editEntity (
        "s", 4294967295,
        userID, entID, defStr, readerWhitelistID, isAnonymous, isEditable
    );
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE editUTF8Entity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN defStr TEXT CHARACTER SET utf8mb4,
    IN readerWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL,
    IN isEditable BOOL
)
BEGIN
    CALL _editEntity (
        "8", 4294967295,
        userID, entID, defStr, readerWhitelistID, isAnonymous, isEditable
    );
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE editHTMLEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN defStr TEXT CHARACTER SET utf8mb4,
    IN readerWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL,
    IN isEditable BOOL
)
BEGIN
    CALL _editEntity (
        "h", 4294967295,
        userID, entID, defStr, readerWhitelistID, isAnonymous, isEditable
    );
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE editJSONEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN defStr TEXT CHARACTER SET utf8mb4,
    IN readerWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL,
    IN isEditable BOOL
)
proc: BEGIN
    IF NOT (JSON_VALID(defStr)) THEN
        SELECT entID AS outID, 7 AS exitCode; -- Invalid JSON.
    END IF;
    CALL _editEntity (
        "j", 4294967295,
        userID, entID, defStr, readerWhitelistID, isAnonymous, isEditable
    );
END proc //
DELIMITER ;









-- TODO: Add counter increase to this procedure.

DELIMITER //
CREATE PROCEDURE substitutePlaceholdersInEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN paths TEXT, -- List of the form '<path_1>,<path_2>...'
    IN substitutionEntIDs TEXT -- List of the form '<entID_1>,<entID_2>...'
)
proc: BEGIN
    DECLARE pathRegExp VARCHAR(80) DEFAULT '[^0-9\\[\\]@,;"][^\\[\\]@,;"]*';
    DECLARE creatorID, subEntID, readerWhitelistID, outID BIGINT UNSIGNED;
    DECLARE entType CHAR;
    DECLARE prevDefStr, newDefStr LONGTEXT;
    DECLARE prevType CHAR;
    DECLARE i TINYINT UNSIGNED DEFAULT 0;
    DECLARE pathStr TEXT;
    DECLARE prevLen, newLen, maxLen, addedLen INT UNSIGNED;
    DECLARE isExceeded TINYINT;

    DO GET_LOCK(CONCAT("EntID.", entID), 10);

    SELECT ent_type, creator_id, def_str, LENGTH(def_str), reader_whitelist_id
    INTO entType, creatorID, prevDefStr, prevLen, readerWhitelistID
    FROM Entities FORCE INDEX (PRIMARY)
    WHERE id = entID;

    IF (creatorID != userID) THEN
        DO RELEASE_LOCK(CONCAT("EntID.", entID));
        SELECT entID AS outID, 2 AS exitCode; -- user is not the owner.
        LEAVE proc;
    END IF;

    -- If all checks succeed, first initialize newDefStr.
    SET newDefStr = prevDefStr;

    -- Then loop through all the paths and substitute any
    -- occurrences inside prevDefStr with the corresponding entIDs.
    loop_1: LOOP
        SET i = i + 1;

        SET pathStr = REGEXP_SUBSTR(paths, "[^,]+", 1, i);
        SET subEntID = CAST(
            REGEXP_SUBSTR(substitutionEntIDs, "[^,]+", 1, i) AS UNSIGNED
        );

        IF (pathStr IS NULL) THEN
            LEAVE loop_1;
        END IF;
        IF (subEntID IS NULL OR subEntID = 0) THEN
            ITERATE loop_1;
        END IF;

        -- If a path is ill-formed, exit and make no updates.
        IF NOT (IFNULL(REGEXP_LIKE(pathStr, pathRegExp), 0)) THEN
            DO RELEASE_LOCK(CONCAT("EntID.", entID));
            SELECT entID AS outID, 3 AS exitCode; -- a path was ill-formed.
            LEAVE proc;
        END IF;

        -- Replace all occurrences of '@[<path>]' with '@<subEntID>'.
        SET newDefStr = REPLACE(
            newDefStr,
            CONCAT("@[", pathStr,  "]"),
            CONCAT("@[", subEntID, "]")
        );

        ITERATE loop_1;
    END LOOP loop_1;

    -- Check that newDefStr is not too long.
    SET maxLen = CASE
        WHEN (entType = "r") THEN 700
        WHEN (entType = "f") THEN 65535
        ELSE 4294967295
    END;
    SET newLen = LENGTH(newDefStr);
    IF (newLen > maxLen) THEN
        DO RELEASE_LOCK(CONCAT("EntID.", entID));
        SELECT entID AS outID, 4 AS exitCode; -- new defStr too long.
        LEAVE proc;
    END IF;

    -- Pay the upload data cost for the edit.
    SET addedLen = CASE WHEN (newLen > prevLen)
        THEN newLen - prevLen
        ELSE 0
    END;
    CALL _increaseWeeklyUserCounters (
        userID, 0, addedLen, 10, isExceeded
    );
    -- Exit if upload limit was exceeded.
    IF (isExceeded) THEN
        DO RELEASE_LOCK(CONCAT("EntID.", entID));
        SELECT subjID AS outID, 5 AS exitCode; -- upload limit was exceeded.
        LEAVE proc;
    END IF;

    -- Then finally update the entity with the new defStr.
    IF (entType != "r") THEN
        UPDATE Entities
        SET def_str = newDefStr
        WHERE id = entID;
    ELSE
        BEGIN
            DECLARE outID BIGINT UNSIGNED;
            DECLARE EXIT HANDLER FOR 1062, 1586 -- Duplicate key entry error.
            BEGIN
                SELECT ent_id INTO outID
                FROM EntitySecKeys
                WHERE (
                    ent_type = "r" AND
                    reader_whitelist_id = readerWhitelistID AND
                    def_key = prevDefStr AND
                    ent_id = entID
                );

                SELECT outID, 3 AS exitCode; -- Resulting entity already exists.
            END;

            UPDATE EntitySecKeys
            SET def_key = newDefStr
            WHERE (
                ent_type = "r" AND
                reader_whitelist_id = readerWhitelistID AND
                def_key = prevDefStr AND
                ent_id = entID
            );

            UPDATE Entities
            SET def_str = newDefStr
            WHERE id = entID;
        END;
    END IF;

    DO RELEASE_LOCK(CONCAT("EntID.", entID));
    SELECT entID AS outID, 0 AS exitCode; -- edit.
END proc //
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
    DECLARE readerWhitelistID BIGINT UNSIGNED;
    DECLARE isMember TINYINT;

    DO GET_LOCK(CONCAT("EntID.", entID), 10);

    SELECT def_str, reader_whitelist_id INTO prevDefStr, readerWhitelistID
    FROM Entities FORCE INDEX (PRIMARY)
    WHERE (
        id = entID AND
        ent_type = entType
    );

    CALL _getIsMember_01 (
        userID,
        readerWhitelistID,
        isMember,
        @unused
    );

    IF NOT (isMember) THEN
        DO RELEASE_LOCK(CONCAT("EntID.", entID));
        SET exitCode = 2; -- user is not on whitelist.
        LEAVE proc;
    END IF;
    
    SET newDefStr = REGEXP_REPLACE(
        prevDefStr, CONCAT('@[', userID, ']'), '@[0]'
    );

    IF (newDefStr <=> prevDefStr) THEN
        SET exitCode = 1; -- no changes.
    ELSE
        UPDATE Entities
        SET def_str = newDefStr
        WHERE id = entID;

        DELETE FROM EntitySecKeys
        WHERE (
            ent_type = entType AND
            reader_whitelist_id = readerWhitelistID AND
            def_key = prevDefStr
        );

        SET exitCode = 0; -- occurrences was nulled.
    END IF;

    DO RELEASE_LOCK(CONCAT("EntID.", entID));
END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE nullUserRefsInRegularEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED
)
proc: BEGIN
    DECLARE exitCode TINYINT;

    CALL _substitutePlaceholdersInEntity (
        "r", userID, entID, exitCode
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
CREATE PROCEDURE _parseAndObtainRegularEntity (
    IN userID BIGINT UNSIGNED,
    IN defStr VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    IN readerWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL,
    IN insertWhenNotFound BOOL,
    IN selectWhenFound BOOL,
    OUT outID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
BEGIN
    SET max_sp_recursion_depth = 255;
    CALL __parseAndObtainRegularEntityHelper (
        userID,
        defStr,
        readerWhitelistID,
        isAnonymous,
        insertWhenNotFound,
        selectWhenFound,
        NULL,
        LENGTH(defStr),
        1,
        @unused,
        outID,
        exitCode
    );
    IF (exitCode >= 2) THEN
        SET outID = NULL;
    END IF;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE __parseAndObtainRegularEntityHelper (
    IN userID BIGINT UNSIGNED,
    IN defStr VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    IN readerWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL,
    IN insertWhenNotFound BOOL,
    IN selectWhenFound BOOL,
    IN curTagName VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    IN defStrLen INT,
    IN inPos INT,
    OUT outPos INT,
    OUT outID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
proc: BEGIN
    DECLARE subbedDefStr TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
    DECLARE elemContent, nextTag, endTag, tagName
        VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
    DECLARE nextTagPos, curPos, nextPos INT;
    DECLARE nestedReaderWhitelistID, nestedEntID BIGINT UNSIGNED;
    DECLARE isEndTag, isMember TINYINT;

    SET outID = NULL;

    -- Before parsing the defStr, we first check that the user is on the reader
    -- whitelist.
    CALL _getIsMember_01 (
        userID, readerWhitelistID, isMember, @unused
    );
    IF NOT (isMember) THEN
        SET exitCode = 4; -- user is not on whitelist.
        IF (selectWhenFound) THEN
            SELECT tagName, outID, exitCode;
        END IF; 
        LEAVE proc;
    END IF;

    SET subbedDefStr = "";
    SET curPos = inPos;
    loop_1: LOOP
        -- If the end of defStr has been reached, exit with error if an end tag
        -- was expected (when curTagName is not null), or else end the loop.
        IF (curPos > defStrLen) THEN
            IF (curTagName IS NOT NULL) THEN
                SET exitCode = 2; -- No end tag was found matching a start tag.
                IF (selectWhenFound) THEN
                    SELECT tagName, outID, exitCode;
                END IF; 
                LEAVE proc;
            END IF;

            SET outPos = curPos;
            LEAVE loop_1;
        END IF;

        -- Find the next tag.
        SET nextTagPos = REGEXP_INSTR(
            defStr, "@</?[a-zA-Z_]+( w=[1-9][0-9]*)? s>", curPos, 1
        );

        -- If there are no more tags to be found, exit with error if an end tag
        -- was expected (when curTagName is not null), or else append the rest
        -- of string to subbedDefStr and end the loop.
        IF (nextTagPos IS NULL OR nextTagPos = 0) THEN
            IF (curTagName IS NOT NULL) THEN
                SET exitCode = 2; -- No end tag was found matching a start tag.
                IF (selectWhenFound) THEN
                    SELECT tagName, outID, exitCode;
                END IF; 
                LEAVE proc;
            END IF;

            SET subbedDefStr = CONCAT(
                subbedDefStr, SUBSTR(defStr, curPos)
            );
            SET outPos = defStrLen + 1;
            LEAVE loop_1;
        END IF;

        -- If a tag was found, then first parse the next tag.
        SET nextTag = REGEXP_SUBSTR(
            defStr, "@</?[a-zA-Z_]+( w=[1-9][0-9]*)? s>", nextTagPos, 1
        );
        SET tagName = REGEXP_SUBSTR(nextTag, "[a-zA-Z_]+", 1, 1);
        SET nestedReaderWhitelistID = CAST(
            IFNULL( REGEXP_SUBSTR(nextTag, "[1-9][0-9]*", 1, 1), 0 )
            AS UNSIGNED
        );
        SET isEndTag = (SUBSTR(nextTag, 3, 1) = "/");

        -- If the next tag is an end tag, see if it matches the curTagName. If
        -- not, exit with an error code. If so, append the substring between
        -- curPos and this end tag to subbedDefStr and end the loop.
        IF (isEndTag) THEN
            IF (curTagName IS NULL OR tagName != curTagName) THEN
                SET exitCode = 3; -- An end tag did not match the start tag.
                IF (selectWhenFound) THEN
                    SELECT tagName, outID, exitCode;
                END IF; 
                LEAVE proc;
            END IF;

            SET subbedDefStr = CONCAT(
                subbedDefStr, SUBSTR(defStr, curPos, nextTagPos - curPos)
            );
            SET outPos = nextTagPos + LENGTH(nextTag);
            LEAVE loop_1;
        END IF;

        -- If on the other hand nextTag is a start tag, then we call this
        -- procedure recursively to obtain the entity ID of the entity
        -- referenced by the content of this next element.
        CALL __parseAndObtainRegularEntityHelper (
            userID,
            defStr,
            nestedReaderWhitelistID,
            1, -- We set isAnonymous = 1 for all inserts of nested entities.
            insertWhenNotFound,
            selectWhenFound,
            tagName,
            defStrLen,
            nextTagPos + LENGTH(nextTag),
            nextPos,
            nestedEntID,
            exitCode
        );
        -- If something went wrong, exit all calls of this helper procedure.
        IF (exitCode >= 2) THEN
            IF (selectWhenFound) THEN
                SELECT tagName, outID, 6 AS exitCode; -- Error in a nested call.
            END IF; 
            LEAVE proc;
        END IF;

        -- Then we append the substring before the start tag to subbedDefStr,
        -- as well as the entity reference substituted in place of the whole
        -- element. Then we update curPos and iterate the loop.
        SET subbedDefStr = CONCAT(
            subbedDefStr, SUBSTR(defStr, curPos, nextTagPos - curPos),
            "@[", nestedEntID, "]"
        );
        SET curPos = nextPos;

        ITERATE loop_1;
    END LOOP loop_1;

    -- After the loop, if no error occurred, we now have the substituted
    -- defStr, and we just need to now find the corresponding ID of the
    -- regular entity, and if insertWhenNotFound is set as true, we also try
    -- to insert it in case it wasn't found.
    SELECT ent_id INTO outID
    FROM EntitySecKeys FORCE INDEX (PRIMARY)
    WHERE (
        ent_type = "r" AND
        reader_whitelist_id = readerWhitelistID AND
        def_key = subbedDefStr
    );

    IF (outID IS NULL AND NOT insertWhenNotFound) THEN
        SET exitCode = 4; -- Entity was not found.
        LEAVE proc;
    ELSEIF (outID IS NULL AND insertWhenNotFound) THEN
        CALL _insertOrFindRegularEntity (
            userID, subbedDefStr, readerWhitelistID, isAnonymous,
            outID, exitCode
        );
        -- exitCode will here be either 0 if inserted, 1 if found, or 5 if a
        -- counter was exceeded.
    END IF;

    IF (selectWhenFound) THEN
        SELECT tagName, outID, exitCode;
    END IF; 
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
