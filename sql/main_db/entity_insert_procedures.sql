
SELECT "Insert procedures";

DROP PROCEDURE insertEntityWithoutSecKey;
DROP PROCEDURE insertOrFindEntityWithSecKey;

DROP PROCEDURE editEntity;

DROP PROCEDURE finalizeEntity;
DROP PROCEDURE anonymizeEntity;







DELIMITER //
CREATE PROCEDURE insertEntityWithoutSecKey (
    IN entType CHAR,
    IN userID BIGINT UNSIGNED,
    IN defStr LONGTEXT CHARACTER SET utf8mb4,
    IN whitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL,
    IN isEditable BOOL
)
proc: BEGIN
    INSERT INTO Entities (
        creator_id,
        ent_type, def_str, whitelist_id, is_editable,
        paid_upload_data_cost
    )
    VALUES (
        CASE WHEN (isAnonymous) THEN 0 ELSE userID END,
        entType, defStr, whitelistID, isEditable AND NOT isAnonymous,
        LENGTH(defStr) + 25
    );
    SET outID = LAST_INSERT_ID();

    SET exitCode = 0; -- insert.
    SELECT outID, exitCode;
END proc //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE insertOrFindEntityWithSecKey (
    IN entType CHAR,
    IN userID BIGINT UNSIGNED,
    IN defStr VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    IN whitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL
)
proc: BEGIN
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
            whitelist_id = whitelistID AND
            def_key = defStr
        );

        SET exitCode = 1; -- find.
    END;

    START TRANSACTION;

    INSERT INTO Entities (
        creator_id,
        ent_type, def_str, whitelist_id, is_editable,
        paid_upload_data_cost
    )
    VALUES (
        CASE WHEN (isAnonymous) THEN 0 ELSE userID END,
        entType, defStr, whitelistID, 0,
        LENGTH(defStr) * 2 + 33
    );
    SET outID = LAST_INSERT_ID();

    INSERT INTO EntitySecKeys (
        ent_type, whitelist_id, def_key, ent_id
    )
    VALUES (
        entType, whitelistID, defStr, outID
    );

    COMMIT;

    SET exitCode = 0; -- insert.
    SELECT outID, exitCode;
END proc //
DELIMITER ;







-- DELIMITER //
-- CREATE PROCEDURE insertScriptEntity (
--     IN userID BIGINT UNSIGNED,
--     IN defStr TEXT CHARACTER SET utf8mb4,
--     IN whitelistID BIGINT UNSIGNED,
--     IN isAnonymous BOOL,
--     IN isEditable BOOL
-- )
-- BEGIN
--     CALL _insertEntityWithoutSecKey (
--         "s",
--         userID, defStr, whitelistID, isAnonymous, isEditable,
--         @unused, @unused
--     );
-- END //
-- DELIMITER ;


-- DELIMITER //
-- CREATE PROCEDURE insertExpressionEntity (
--     IN userID BIGINT UNSIGNED,
--     IN defStr TEXT CHARACTER SET utf8mb4,
--     IN whitelistID BIGINT UNSIGNED,
--     IN isAnonymous BOOL,
--     IN isEditable BOOL
-- )
-- BEGIN
--     CALL _insertEntityWithoutSecKey (
--         "e",
--         userID, defStr, whitelistID, isAnonymous, isEditable,
--         @unused, @unused
--     );
-- END //
-- DELIMITER ;


-- DELIMITER //
-- CREATE PROCEDURE insertOrFindFormalEntity (
--     IN userID BIGINT UNSIGNED,
--     IN defStr VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
--     IN whitelistID BIGINT UNSIGNED,
--     IN isAnonymous BOOL,
--     OUT outID BIGINT UNSIGNED,
--     OUT exitCode TINYINT
-- )
-- BEGIN
--     CALL _insertOrFindEntityWithSecKey (
--         "f",
--         userID, defStr, whitelistID, isAnonymous,
--         @unused, @unused
--     );
-- END //
-- DELIMITER ;







DELIMITER //
CREATE PROCEDURE editEntity (
    IN entType CHAR,
    IN maxLen INT UNSIGNED,
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN defStr LONGTEXT CHARACTER SET utf8mb4,
    IN whitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL,
    IN isEditable BOOL
)
proc: BEGIN
    DECLARE creatorID BIGINT UNSIGNED;
    DECLARE prevIsEditable TINYINT UNSIGNED;
    DECLARE prevDefStr LONGTEXT;
    DECLARE prevLen, newLen INT UNSIGNED;
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
        whitelist_id = whitelistID,
        is_editable = isEditable
    WHERE id = entID;

    DO RELEASE_LOCK(CONCAT("EntID.", entID));

    INSERT INTO RecentlyEditedEntities (ent_ID)
    VALUES (entID);

    SELECT entID AS outID, 0 AS exitCode; -- edit.
END proc //
DELIMITER ;








-- DELIMITER //
-- CREATE PROCEDURE editScriptEntity (
--     IN userID BIGINT UNSIGNED,
--     IN entID BIGINT UNSIGNED,
--     IN defStr TEXT CHARACTER SET utf8mb4,
--     IN whitelistID BIGINT UNSIGNED,
--     IN isAnonymous BOOL,
--     IN isEditable BOOL
-- )
-- BEGIN
--     CALL _editEntity (
--         "s", 4294967295,
--         userID, entID, defStr, whitelistID, isAnonymous, isEditable
--     );
-- END //
-- DELIMITER ;

-- DELIMITER //
-- CREATE PROCEDURE editExpressionEntity (
--     IN userID BIGINT UNSIGNED,
--     IN entID BIGINT UNSIGNED,
--     IN defStr TEXT CHARACTER SET utf8mb4,
--     IN whitelistID BIGINT UNSIGNED,
--     IN isAnonymous BOOL,
--     IN isEditable BOOL
-- )
-- BEGIN
--     CALL _editEntity (
--         "e", 4294967295,
--         userID, entID, defStr, whitelistID, isAnonymous, isEditable
--     );
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











-- These next two procedures are implemented in the control server instead,
-- using the parser to recognize entity references rather than saying that
-- '@[' is just wild everywhere, and should be escaped as '@[;', even within
-- string literals. No, we parse instead, and then transform the entity. 



-- DELIMITER //
-- CREATE PROCEDURE substitutePlaceholdersInEntity (
--     IN userID BIGINT UNSIGNED,
--     IN entID BIGINT UNSIGNED,
--     IN paths TEXT, -- List of the form '<path_1>,<path_2>...'
--     IN substitutionEntIDs TEXT -- List of the form '<entID_1>,<entID_2>...'
-- )
-- proc: BEGIN
--     DECLARE pathRegExp VARCHAR(80) DEFAULT '[^0-9\\[\\]@,;"][^\\[\\]@,;"]*';
--     DECLARE creatorID, subEntID, whitelistID, outID BIGINT UNSIGNED;
--     DECLARE entType CHAR;
--     DECLARE prevDefStr, newDefStr LONGTEXT;
--     DECLARE prevType CHAR;
--     DECLARE i TINYINT UNSIGNED DEFAULT 0;
--     DECLARE pathStr TEXT;
--     DECLARE prevLen, newLen, maxLen, addedLen INT UNSIGNED;
--     DECLARE isExceeded TINYINT;

--     DO GET_LOCK(CONCAT("EntID.", entID), 10);

--     SELECT ent_type, creator_id, def_str, LENGTH(def_str), whitelist_id
--     INTO entType, creatorID, prevDefStr, prevLen, whitelistID
--     FROM Entities FORCE INDEX (PRIMARY)
--     WHERE id = entID;

--     IF (creatorID != userID) THEN
--         DO RELEASE_LOCK(CONCAT("EntID.", entID));
--         SELECT entID AS outID, 2 AS exitCode; -- user is not the owner.
--         LEAVE proc;
--     END IF;

--     -- If all checks succeed, first initialize newDefStr.
--     SET newDefStr = prevDefStr;

--     -- Then loop through all the paths and substitute any
--     -- occurrences inside prevDefStr with the corresponding entIDs.
--     loop_1: LOOP
--         SET i = i + 1;

--         SET pathStr = REGEXP_SUBSTR(paths, "[^,]+", 1, i);
--         SET subEntID = CAST(
--             REGEXP_SUBSTR(substitutionEntIDs, "[^,]+", 1, i) AS UNSIGNED
--         );

--         IF (pathStr IS NULL) THEN
--             LEAVE loop_1;
--         END IF;
--         IF (subEntID IS NULL OR subEntID = 0) THEN
--             ITERATE loop_1;
--         END IF;

--         -- If a path is ill-formed, exit and make no updates.
--         IF NOT (IFNULL(REGEXP_LIKE(pathStr, pathRegExp), 0)) THEN
--             DO RELEASE_LOCK(CONCAT("EntID.", entID));
--             SELECT entID AS outID, 3 AS exitCode; -- a path was ill-formed.
--             LEAVE proc;
--         END IF;

--         -- Replace all occurrences of '@[<path>]' with '@<subEntID>'.
--         SET newDefStr = REPLACE(
--             newDefStr,
--             CONCAT("@[", pathStr,  "]"),
--             CONCAT("@[", subEntID, "]")
--         );

--         ITERATE loop_1;
--     END LOOP loop_1;

--     -- Check that newDefStr is not too long.
--     SET maxLen = CASE
--         WHEN (entType = "r") THEN 700
--         WHEN (entType = "f") THEN 65535
--         ELSE 4294967295
--     END;
--     SET newLen = LENGTH(newDefStr);
--     IF (newLen > maxLen) THEN
--         DO RELEASE_LOCK(CONCAT("EntID.", entID));
--         SELECT entID AS outID, 4 AS exitCode; -- new defStr too long.
--         LEAVE proc;
--     END IF;

--     -- Pay the upload data cost for the edit.
--     SET addedLen = CASE WHEN (newLen > prevLen)
--         THEN newLen - prevLen
--         ELSE 0
--     END;
--     CALL _increaseWeeklyUserCounters (
--         userID, 0, addedLen, 10, isExceeded
--     );
--     -- Exit if upload limit was exceeded.
--     IF (isExceeded) THEN
--         DO RELEASE_LOCK(CONCAT("EntID.", entID));
--         SELECT subjID AS outID, 5 AS exitCode; -- upload limit was exceeded.
--         LEAVE proc;
--     END IF;

--     -- Then finally update the entity with the new defStr.
--     IF (entType != "r") THEN
--         UPDATE Entities
--         SET def_str = newDefStr
--         WHERE id = entID;
--     ELSE
--         BEGIN
--             DECLARE outID BIGINT UNSIGNED;
--             DECLARE EXIT HANDLER FOR 1062, 1586 -- Duplicate key entry error.
--             BEGIN
--                 SELECT ent_id INTO outID
--                 FROM EntitySecKeys
--                 WHERE (
--                     ent_type = "r" AND
--                     whitelist_id = whitelistID AND
--                     def_key = prevDefStr AND
--                     ent_id = entID
--                 );

--                 SELECT outID, 3 AS exitCode; -- Resulting entity already exists.
--             END;

--             UPDATE EntitySecKeys
--             SET def_key = newDefStr
--             WHERE (
--                 ent_type = "r" AND
--                 whitelist_id = whitelistID AND
--                 def_key = prevDefStr AND
--                 ent_id = entID
--             );

--             UPDATE Entities
--             SET def_str = newDefStr
--             WHERE id = entID;
--         END;
--     END IF;

--     DO RELEASE_LOCK(CONCAT("EntID.", entID));
--     SELECT entID AS outID, 0 AS exitCode; -- edit.
-- END proc //
-- DELIMITER ;




-- DELIMITER //
-- CREATE PROCEDURE _nullUserRefsInEntity (
--     IN entType CHAR,
--     IN userID BIGINT UNSIGNED,
--     IN entID BIGINT UNSIGNED,
--     OUT exitCode TINYINT
-- )
-- proc: BEGIN
--     DECLARE prevDefStr, newDefStr LONGTEXT CHARACTER SET utf8mb4
--         COLLATE utf8mb4_bin;
--     DECLARE whitelistID BIGINT UNSIGNED;
--     DECLARE isMember TINYINT;

--     DO GET_LOCK(CONCAT("EntID.", entID), 10);

--     SELECT def_str, whitelist_id INTO prevDefStr, whitelistID
--     FROM Entities FORCE INDEX (PRIMARY)
--     WHERE (
--         id = entID AND
--         ent_type = entType
--     );

--     CALL _getIsMember (
--         userID,
--         whitelistID,
--         isMember,
--         @ unused
--     );

--     IF NOT (isMember) THEN
--         DO RELEASE_LOCK(CONCAT("EntID.", entID));
--         SET exitCode = 2; -- user is not on whitelist.
--         LEAVE proc;
--     END IF;
    
--     SET newDefStr = REGEXP_REPLACE(
--         prevDefStr, CONCAT('@[', userID, ']'), '@[0]'
--     );

--     IF (newDefStr <=> prevDefStr) THEN
--         SET exitCode = 1; -- no changes.
--     ELSE
--         UPDATE Entities
--         SET def_str = newDefStr
--         WHERE id = entID;

--         DELETE FROM EntitySecKeys
--         WHERE (
--             ent_type = entType AND
--             whitelist_id = whitelistID AND
--             def_key = prevDefStr
--         );

--         SET exitCode = 0; -- occurrences was nulled.
--     END IF;

--     DO RELEASE_LOCK(CONCAT("EntID.", entID));
-- END proc //
-- DELIMITER ;



-- DELIMITER //
-- CREATE PROCEDURE nullUserRefsInRegularEntity (
--     IN userID BIGINT UNSIGNED,
--     IN entID BIGINT UNSIGNED
-- )
-- proc: BEGIN
--     DECLARE exitCode TINYINT;

--     CALL _substitutePlaceholdersInEntity (
--         "r", userID, entID, exitCode
--     );

--     SELECT entID AS outID, exitCode;
-- END proc //
-- DELIMITER ;



























-- DELIMITER //
-- CREATE PROCEDURE _parseAndObtainRegularEntity (
--     IN userID BIGINT UNSIGNED,
--     IN defStr VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
--     IN whitelistID BIGINT UNSIGNED,
--     IN isAnonymous BOOL,
--     IN insertWhenNotFound BOOL,
--     IN selectWhenFound BOOL,
--     OUT outID BIGINT UNSIGNED,
--     OUT exitCode TINYINT
-- )
-- BEGIN
--     SET max_sp_recursion_depth = 255;
--     CALL __parseAndObtainRegularEntityHelper (
--         userID,
--         defStr,
--         whitelistID,
--         isAnonymous,
--         insertWhenNotFound,
--         selectWhenFound,
--         NULL,
--         LENGTH(defStr),
--         1,
--         @unused,
--         outID,
--         exitCode
--     );
--     IF (exitCode >= 2) THEN
--         SET outID = NULL;
--     END IF;
-- END //
-- DELIMITER ;



-- DELIMITER //
-- CREATE PROCEDURE __parseAndObtainRegularEntityHelper (
--     IN userID BIGINT UNSIGNED,
--     IN defStr VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
--     IN whitelistID BIGINT UNSIGNED,
--     IN isAnonymous BOOL,
--     IN insertWhenNotFound BOOL,
--     IN selectWhenFound BOOL,
--     IN curTagName VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
--     IN defStrLen INT,
--     IN inPos INT,
--     OUT outPos INT,
--     OUT outID BIGINT UNSIGNED,
--     OUT exitCode TINYINT
-- )
-- proc: BEGIN
--     DECLARE subbedDefStr TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
--     DECLARE elemContent, nextTag, endTag, tagName
--         VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
--     DECLARE nextTagPos, curPos, nextPos INT;
--     DECLARE nestedwhitelistID, nestedEntID BIGINT UNSIGNED;
--     DECLARE isEndTag, isMember TINYINT;

--     SET outID = NULL;

--     -- Before parsing the defStr, we first check that the user is on the reader
--     -- whitelist.
--     CALL _getIsMember (
--         userID, whitelistID, isMember, @unused
--     );
--     IF NOT (isMember) THEN
--         SET exitCode = 4; -- user is not on whitelist.
--         IF (selectWhenFound) THEN
--             SELECT tagName, outID, exitCode;
--         END IF; 
--         LEAVE proc;
--     END IF;

--     SET subbedDefStr = "";
--     SET curPos = inPos;
--     loop_1: LOOP
--         -- If the end of defStr has been reached, exit with error if an end tag
--         -- was expected (when curTagName is not null), or else end the loop.
--         IF (curPos > defStrLen) THEN
--             IF (curTagName IS NOT NULL) THEN
--                 SET exitCode = 2; -- No end tag was found matching a start tag.
--                 IF (selectWhenFound) THEN
--                     SELECT tagName, outID, exitCode;
--                 END IF; 
--                 LEAVE proc;
--             END IF;

--             SET outPos = curPos;
--             LEAVE loop_1;
--         END IF;

--         -- Find the next tag.
--         SET nextTagPos = REGEXP_INSTR(
--             defStr, "@</?[a-zA-Z_]+( w=[1-9][0-9]*)? s>", curPos, 1
--         );

--         -- If there are no more tags to be found, exit with error if an end tag
--         -- was expected (when curTagName is not null), or else append the rest
--         -- of string to subbedDefStr and end the loop.
--         IF (nextTagPos IS NULL OR nextTagPos = 0) THEN
--             IF (curTagName IS NOT NULL) THEN
--                 SET exitCode = 2; -- No end tag was found matching a start tag.
--                 IF (selectWhenFound) THEN
--                     SELECT tagName, outID, exitCode;
--                 END IF; 
--                 LEAVE proc;
--             END IF;

--             SET subbedDefStr = CONCAT(
--                 subbedDefStr, SUBSTR(defStr, curPos)
--             );
--             SET outPos = defStrLen + 1;
--             LEAVE loop_1;
--         END IF;

--         -- If a tag was found, then first parse the next tag.
--         SET nextTag = REGEXP_SUBSTR(
--             defStr, "@</?[a-zA-Z_]+( w=[1-9][0-9]*)? s>", nextTagPos, 1
--         );
--         SET tagName = REGEXP_SUBSTR(nextTag, "[a-zA-Z_]+", 1, 1);
--         SET nestedwhitelistID = CAST(
--             IFNULL( REGEXP_SUBSTR(nextTag, "[1-9][0-9]*", 1, 1), 0 )
--             AS UNSIGNED
--         );
--         SET isEndTag = (SUBSTR(nextTag, 3, 1) = "/");

--         -- If the next tag is an end tag, see if it matches the curTagName. If
--         -- not, exit with an error code. If so, append the substring between
--         -- curPos and this end tag to subbedDefStr and end the loop.
--         IF (isEndTag) THEN
--             IF (curTagName IS NULL OR tagName != curTagName) THEN
--                 SET exitCode = 3; -- An end tag did not match the start tag.
--                 IF (selectWhenFound) THEN
--                     SELECT tagName, outID, exitCode;
--                 END IF; 
--                 LEAVE proc;
--             END IF;

--             SET subbedDefStr = CONCAT(
--                 subbedDefStr, SUBSTR(defStr, curPos, nextTagPos - curPos)
--             );
--             SET outPos = nextTagPos + LENGTH(nextTag);
--             LEAVE loop_1;
--         END IF;

--         -- If on the other hand nextTag is a start tag, then we call this
--         -- procedure recursively to obtain the entity ID of the entity
--         -- referenced by the content of this next element.
--         CALL __parseAndObtainRegularEntityHelper (
--             userID,
--             defStr,
--             nestedwhitelistID,
--             1, -- We set isAnonymous = 1 for all inserts of nested entities.
--             insertWhenNotFound,
--             selectWhenFound,
--             tagName,
--             defStrLen,
--             nextTagPos + LENGTH(nextTag),
--             nextPos,
--             nestedEntID,
--             exitCode
--         );
--         -- If something went wrong, exit all calls of this helper procedure.
--         IF (exitCode >= 2) THEN
--             IF (selectWhenFound) THEN
--                 SELECT tagName, outID, 6 AS exitCode; -- Error in a nested call.
--             END IF; 
--             LEAVE proc;
--         END IF;

--         -- Then we append the substring before the start tag to subbedDefStr,
--         -- as well as the entity reference substituted in place of the whole
--         -- element. Then we update curPos and iterate the loop.
--         SET subbedDefStr = CONCAT(
--             subbedDefStr, SUBSTR(defStr, curPos, nextTagPos - curPos),
--             "@[", nestedEntID, "]"
--         );
--         SET curPos = nextPos;

--         ITERATE loop_1;
--     END LOOP loop_1;

--     -- After the loop, if no error occurred, we now have the substituted
--     -- defStr, and we just need to now find the corresponding ID of the
--     -- regular entity, and if insertWhenNotFound is set as true, we also try
--     -- to insert it in case it wasn't found.
--     SELECT ent_id INTO outID
--     FROM EntitySecKeys FORCE INDEX (PRIMARY)
--     WHERE (
--         ent_type = "r" AND
--         whitelist_id = whitelistID AND
--         def_key = subbedDefStr
--     );

--     IF (outID IS NULL AND NOT insertWhenNotFound) THEN
--         SET exitCode = 4; -- Entity was not found.
--         LEAVE proc;
--     ELSEIF (outID IS NULL AND insertWhenNotFound) THEN
--         CALL _insertOrFindRegularEntity (
--             userID, subbedDefStr, whitelistID, isAnonymous,
--             outID, exitCode
--         );
--         -- exitCode will here be either 0 if inserted, 1 if found, or 5 if a
--         -- counter was exceeded.
--     END IF;

--     IF (selectWhenFound) THEN
--         SELECT tagName, outID, exitCode;
--     END IF; 
-- END proc //
-- DELIMITER ;





























-- DELIMITER //
-- CREATE PROCEDURE _increaseWeeklyUserCounters (
--     IN userID BIGINT UNSIGNED,
--     IN downloadData FLOAT, -- Only used for query "as user" requests.
--     IN uploadData FLOAT,
--     IN compUsage FLOAT,
--     OUT isExceeded TINYINT
-- )
-- proc: BEGIN
--     DECLARE downloadCount, uploadCount, compCount FLOAT;
--     DECLARE downloadLimit, uploadLimit, compLimit FLOAT;
--     DECLARE lastRefreshedAt DATE;
--     DECLARE currentDate DATE DEFAULT (CURDATE());

--     -- userID can be set to 0 in order to suppress any counter checks.
--     IF (userID = 0) THEN
--         SET isExceeded = 0;
--         LEAVE proc;
--     END IF;
    
--     SELECT
--         download_data_this_week + uploadData,
--         download_data_weekly_limit,
--         upload_data_this_week + uploadData,
--         upload_data_weekly_limit,
--         computation_usage_this_week + compUsage,
--         computation_usage_weekly_limit,
--         last_refreshed_at
--     INTO
--         downloadCount,
--         downloadLimit,
--         uploadCount,
--         uploadLimit,
--         compCount,
--         compLimit,
--         lastRefreshedAt
--     FROM Private_UserData
--     WHERE user_id = userID;

--     -- If it has been more than a week since freshing the counters to 0, do so
--     -- first. 
--     IF (currentDate >= ADDDATE(lastRefreshedAt, INTERVAL 1 WEEK)) THEN
--         UPDATE Private_UserData
--         SET
--             download_data_this_week = 0,
--             upload_data_this_week = 0,
--             computation_usage_this_week = 0,
--             last_refreshed_at = currentDate
--         WHERE user_id = userID;

--         SET downloadCount = downloadData;
--         SET uploadCount = uploadData;
--         SET compCount = compUsage;
--     END IF;

--     -- Then check if any limits are exceeded.
--     SET isExceeded = (
--         downloadCount > downloadLimit OR
--         uploadCount > uploadLimit OR
--         compCount > compLimit
--     );

--     -- Finally update the counters and return isExceeded.
--     UPDATE Private_UserData
--     SET
--         download_data_this_week = downloadCount,
--         upload_data_this_week = uploadCount,
--         computation_usage_this_week = compCount
--     WHERE user_id = userID;
-- END proc //
-- DELIMITER ;










