
SELECT "Insert procedures";

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

DROP PROCEDURE finalizeEntity;
DROP PROCEDURE anonymizeEntity;





DELIMITER //
CREATE PROCEDURE insertOrUpdatePublicUserScore (
    IN userID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN scoreMin FLOAT,
    IN scoreMax FLOAT
)
proc: BEGIN
    DECLARE isExceeded TINYINT;

    CALL _increaseUserCounters (
        userID, 0, 17, 0, isExceeded
    );

    -- Exit if upload limit was exceeded
    IF (isExceeded) THEN
        SELECT subjID AS outID, 5 AS exitCode; -- upload limit was exceeded.
        LEAVE proc;
    END IF;

    -- Exit if the subject entity does not exist.
    IF ((SELECT type_ident FROM Entities WHERE id = subjID) IS NULL) THEN
        SELECT subjID AS outID, 1 AS exitCode; -- subject does not exist.
        LEAVE proc;
    END IF;

    INSERT INTO PublicUserFloatMinAndMaxScores (
        user_id, qual_id, subj_id, score_min, score_min
    )
    VALUES (
        userID, qualID, subjID, scoreMin, scoreMax
    )
    ON DUPLICATE KEY UPDATE
        score_min = scoreMin,
        score_max = scoreMax;

    SELECT subjID AS outID, 0 AS exitCode; -- inserted or updated.
END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deletePublicUserScore (
    IN userID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED
)
BEGIN
    DELETE FROM PublicUserFloatMinAndMaxScores
    WHERE (
        user_id = userID AND
        qual_id = qualID AND
        subj_id = subjID
    );

    SELECT subjID AS outID, 0 AS exitCode; -- deleted if there.
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE insertOrUpdatePrivateUserScore (
    IN userID BIGINT UNSIGNED,
    IN userWhitelistID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN scoreVal BIGINT
)
proc: BEGIN
    DECLARE isExceeded TINYINT;
    DECLARE userWHitelistScoreVal FLOAT;

    CALL _increaseUserCounters (
        userID, 0, 25, 0, isExceeded
    );

    IF (isExceeded) THEN
        SELECT subjID AS outID, 5 AS exitCode; -- upload limit was exceeded.
        LEAVE proc;
    END IF;

    -- Exit if the user is not currently on the user whitelist.
    SELECT score_val INTO userWHitelistScoreVal
    FROM FloatScoreAndWeightAggregates
    WHERE (
        list_id = userWhitelistID AND
        subj_id = userID
    );
    IF (userWHitelistScoreVal IS NULL OR userWHitelistScoreVal <= 0) THEN
        SELECT subjID AS outID, 1 AS exitCode; -- user is not on the whitelist.
        LEAVE proc;
    END IF;

    INSERT INTO PrivateUserScores (
        user_id, user_whitelist_id, qual_id, subj_id, score_val
    )
    VALUES (
        userID, userWhitelistID, qualID, subjID, scoreVal
    )
    ON DUPLICATE KEY UPDATE score_val = scoreVal;

    SELECT subjID AS outID, 0 AS exitCode; -- insert if not already there.
END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deletePrivateUserScore (
    IN userID BIGINT UNSIGNED,
    IN userWhitelistID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN scoreVal BIGINT
)
BEGIN
    DELETE FROM PrivateUserScores
    WHERE (
        user_whitelist_id = userWhitelistID AND
        qual_id = qualID AND
        subj_id = subjID AND
        score_val = scoreVal AND
        subj_id = subjID AND
        user_id = userID
    );

    -- TODO: Also add a request (or reduce the countdown) to go through the
    -- scores on this list and remove any entries from users no longer on the
    -- whitelist. (Implement as a procedure.)

    SELECT subjID AS outID, 0 AS exitCode; -- delete if there.
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteAllPrivateUserScores (
    IN userID BIGINT UNSIGNED,
    IN userWhitelistID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED
)
BEGIN
    DELETE FROM PrivateUserScores
    WHERE (
        user_whitelist_id = userWhitelistID AND
        qual_id = qualID AND
        subj_id = subjID AND
        user_id = userID
    );

    SELECT subjID AS outID, 0 AS exitCode; -- delete if there.
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteSeveralPrivateUserScores (
    IN userID BIGINT UNSIGNED,
    IN userWhitelistID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN scoreCutoff BIGINT UNSIGNED
)
BEGIN
    DELETE FROM PrivateUserScores
    WHERE (
        user_whitelist_id = userWhitelistID AND
        qual_id = qualID AND
        subj_id = subjID AND
        score_val < scoreCutoff AND
        user_id = userID
    );

    SELECT subjID AS outID, 0 AS exitCode; -- delete if there.
END //
DELIMITER ;












DELIMITER //
CREATE PROCEDURE _insertEntityWithoutSecKey (
    IN datatype CHAR,
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

    CALL _increaseUserCounters (
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
        type_ident, def_str, user_whitelist_id, is_editable
    )
    VALUES (
        CASE WHEN (isAnonymous) THEN 0 ELSE userID END,
        datatype, defStr, userWhitelistID, isEditable AND NOT isAnonymous
    );
    SET outID = LAST_INSERT_ID();

    SET exitCode = 0; -- insert.
    SELECT outID, exitCode;
END proc //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE _insertOrFindEntityWithSecKey (
    IN datatype CHAR,
    IN userID BIGINT UNSIGNED,
    IN defStr TEXT CHARACTER SET utf8mb4,
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
            type_ident = datatype AND
            user_whitelist_id = userWhitelistID AND
            def_key = defStr
        );

        SET exitCode = 1; -- find.
        SELECT outID, exitCode;
    END;

    START TRANSACTION;

    INSERT INTO Entities (
        creator_id,
        type_ident, def_str, user_whitelist_id, is_editable
    )
    VALUES (
        CASE WHEN (isAnonymous) THEN 0 ELSE userID END,
        datatype, defStr, userWhitelistID, 0
    );
    SET outID = LAST_INSERT_ID();

    INSERT INTO EntitySecKeys (
        type_ident, user_whitelist_id, def_key, ent_id
    )
    VALUES (
        datatype, userWhitelistID, defStr, outID
    );

    CALL _increaseUserCounters (
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
    IN defStr VARCHAR(700) CHARACTER SET utf8mb4,
    IN isAnonymous BOOL
)
BEGIN
    CALL _insertOrFindEntityWithSecKey (
        "c",
        userID, defStr, isAnonymous, 0,
        @unused, @unused
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE _insertOrFindFunctionCallEntity (
    IN userID BIGINT UNSIGNED,
    IN defStr VARCHAR(700) CHARACTER SET utf8mb4,
    IN isAnonymous BOOL,
    OUT outID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
BEGIN
    CALL _insertOrFindEntityWithSecKey (
        "c",
        userID, defStr, isAnonymous, 0,
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
    IN datatype CHAR,
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

    CALL _increaseUserCounters (
        userID, 0, LENGTH(CAST(defStr AS BINARY)) + 22, 0, isExceeded
    );

    IF (isExceeded) THEN
        SELECT entID AS outID, 5 AS extCode; -- upload limit was exceeded.
        LEAVE proc;
    END IF;


    SELECT type_ident, creator_id, def_str, is_editable
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

    IF (prevType != datatype) THEN
        SELECT entID AS outID, 4 AS exitCode; -- changing datatype not allowed.
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











DELIMITER //
CREATE PROCEDURE _substitutePlaceholdersInEntity (
    IN datatype CHAR,
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

    SELECT type_ident, creator_id, def_str
    INTO prevType, creatorID, prevDefStr 
    FROM Entities
    WHERE id = entID;

    IF (creatorID != userID) THEN
        SELECT entID AS outID, 2 AS exitCode; -- user is not the owner.
        LEAVE proc;
    END IF;

    IF (prevType != datatype) THEN
        SELECT entID AS outID, 3 AS exitCode; -- datatype is incorrect.
        LEAVE proc;
    END IF;

    -- If all checks succeed, first initialize newDefStr by replacing all
    -- escaped '@'s with some temporary placeholders ("@@" -> "@;").
    SET newDefStr = REPLACE(newDefStr, "@@", "@;");

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
                newDefStr, CONCAT("@[", pathStr, "]"), CONCAT("@", subEntID)
            );
            ITERATE label;
        END IF;
    END LOOP label;

    -- Restore the escaped '@'s.
    SET newDefStr = REPLACE(newDefStr, "@;", "@@");

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




-- DELIMITER //
-- CREATE PROCEDURE substitutePlaceholdersInEntity (
--     IN datatype CHAR,
--     IN userID BIGINT UNSIGNED,
--     IN entID BIGINT UNSIGNED,
--     IN paths TEXT, -- List of the form '<path_1>,<path_2>...'
--     IN substitutionEntIDs TEXT -- List of the form '<entID_1>,<entID_2>...'
-- )
-- BEGIN
--     IF (datatype = "a" OR datatype = "f") THEN
--         CALL _substitutePlaceholdersInEntity (
--             datatype, 700, userID, entID, defStr, paths, substitutionEntIDs
--         );
--     ELSE
--         SELECT entID AS outID, 5 AS exitCode; -- datatype is not allowed.
--     END IF;
-- END //
-- DELIMITER ;















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
CREATE PROCEDURE _increaseUserCounters (
    IN userID BIGINT UNSIGNED,
    IN downloadData BIGINT UNSIGNED, -- Only used for query "as user" requests.
    IN uploadData BIGINT UNSIGNED,
    IN compUsage BIGINT UNSIGNED,
    OUT isExceeded TINYINT
)
proc: BEGIN
    DECLARE downloadCount, uploadCount, compCount BIGINT UNSIGNED;
    DECLARE downloadLimit, uploadLimit, compLimit BIGINT UNSIGNED;
    DECLARE lastRefreshedAt DATE;
    DECLARE currentDate DATE DEFAULT (CURDATE());
    
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
