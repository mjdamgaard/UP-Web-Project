
SELECT "Query procedures";

DROP PROCEDURE _getIsMember_01;

DROP PROCEDURE selectEntityList;
DROP PROCEDURE selectScore;

-- TODO: Make proc to query for users who has rated a stmt / scale.

DROP PROCEDURE selectEntity;
DROP PROCEDURE selectEntityRecursively;
DROP PROCEDURE selectEntityIDFromSecKey;
DROP PROCEDURE parseAndObtainRegularEntity;


DROP PROCEDURE selectUserInfo;






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























DELIMITER //
CREATE PROCEDURE selectEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN maxLen INT UNSIGNED,
    IN startPos INT UNSIGNED
)
proc: BEGIN
    DECLARE entType CHAR;
    DECLARE defStr LONGTEXT;
    DECLARE len, creatorID, readerWhitelistID BIGINT UNSIGNED;
    DECLARE isEditable, isMember, isExceeded TINYINT;
    DECLARE listID BIGINT UNSIGNED;

    -- Check that the user isn't out of download data.
    CALL _increaseWeeklyUserCounters (
        userID, 0, 0, 1, isExceeded
    );
    IF (isExceeded) THEN
        SELECT NULL AS entType, 5 AS exitCode; -- Download limit was exceeded.
        LEAVE proc;
    END IF;

    SELECT
        ent_type,
        (
            CASE WHEN maxLen = 0 THEN
                SUBSTR(def_str, startPos + 1)
            ELSE
                SUBSTR(def_str, startPos + 1, maxLen)
            END
        ),
        LENGTH(def_str),
        creator_id,
        is_editable,
        reader_whitelist_id
    INTO
        entType,
        defStr,
        len,
        creatorID,
        isEditable,
        readerWhitelistID
    FROM Entities FORCE INDEX (PRIMARY)
    WHERE id = entID;

    -- Check that the user is on the reader whitelist.
    CALL _getIsMember (
        userID, readerWhitelistID,
        isMember
    );
    IF (isMember) THEN
        CALL _increaseWeeklyUserCounters (
            userID, 0, 0, LENGTH(defStr) DIV 1000 + 1, isExceeded
        );
        IF (isExceeded) THEN
            SELECT NULL AS entType, 5 AS exitCode; -- Counter was exceeded.
            LEAVE proc;
        END IF;

        SELECT
            entType,
            defStr,
            len,
            creatorID,
            isEditable,
            readerWhitelistID;
    ELSE
        SELECT NULL AS entType, 2 AS exitCode; -- User is not on whitelist.
        LEAVE proc;
    END IF;
END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectEntityRecursively (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN maxLen INT UNSIGNED,
    IN recurseInstructions VARCHAR(255),
    IN maxRecLevel TINYINT UNSIGNED
)
proc: BEGIN
    DECLARE entType CHAR;
    DECLARE defStr LONGTEXT;
    DECLARE len, creatorID, readerWhitelistID BIGINT UNSIGNED;
    DECLARE isEditable, isMember, isExceeded TINYINT;
    DECLARE listID, instrFunID, entFunID, nestedEntID BIGINT UNSIGNED;
    DECLARE i, j, refNum, newRowNumber INT DEFAULT 1;
    DECLARE nextInstruction VARCHAR(255);

    -- Check that the user isn't out of download data.
    CALL _increaseWeeklyUserCounters (
        userID, 0, 0, 1, isExceeded
    );
    IF (isExceeded) THEN
        SELECT entID, NULL AS entType, 5 AS exitCode; -- Counter was exceeded.
        LEAVE proc;
    END IF;

    SELECT
        ent_type,
        (
            CASE WHEN maxLen = 0 THEN
                SUBSTR(def_str, 1)
            ELSE
                SUBSTR(def_str, 1, maxLen)
            END
        ),
        LENGTH(def_str),
        creator_id,
        is_editable,
        reader_whitelist_id
    INTO
        entType,
        defStr,
        len,
        creatorID,
        isEditable,
        readerWhitelistID
    FROM Entities FORCE INDEX (PRIMARY)
    WHERE id = entID;

    CALL _getIsMember (
        userID, readerWhitelistID,
        isMember
    );

    IF (isMember) THEN
        CALL _increaseWeeklyUserCounters (
            userID, 0, 0, LENGTH(defStr) DIV 1000 + 1, isExceeded
        );
        IF (isExceeded) THEN
            SELECT entID, NULL AS entType, 5 AS exitCode; -- Counter exceeded.
            LEAVE proc;
        END IF;

        SELECT
            entID,
            entType,
            defStr,
            len,
            creatorID,
            isEditable,
            readerWhitelistID;
    ELSE
        SELECT entID, NULL AS entType;
        LEAVE proc;
    END IF;

    -- If the entity is a regular/referential entity, then we loop through all
    -- the instructions, each of the form 'instrFunID,refNum1,refNum2,...;',
    -- until a instrFunID is found that matches entFunID, and then we loop
    -- through all the refNum's, and for each one parse the refNum^th entity
    -- reference in defStr, and query the defStr in the entity via a recursive
    -- call to this procedure. Note that refNum = 0 here will point to the
    -- entFunID function entity itself.
    -- Also, if recurseInstructions begins with '0,refNum1,refNum2,...;', then
    -- we also treat this as if it matches the entFunID, except that we don't
    -- short circuit the loop here.
    IF (entType = "r" AND maxRecLevel > 0) THEN
        SET entFunID = REGEXP_SUBSTR(
            defStr, "[1-9][0-9]*", 1, 1
        );
        loop_1: LOOP
            -- (Here we actually "cheat" and use a RegExp that skips all
            -- irrelevant instructions immediately, such that the loop only
            -- runs for up to two iterations.)
            SET nextInstruction = REGEXP_SUBSTR(
                recurseInstructions,
                CONCAT("0,[^;]+|(^|;)", entFunID, ",[^;]+"),
                1, i
            );

            IF (nextInstruction IS NULL) THEN
                LEAVE loop_1;
            END IF;

            SET instrFunID = CAST(
                REGEXP_SUBSTR(
                    nextInstruction, "0|[1-9][0-9]*", 1, 1
                )
                AS UNSIGNED
            );

            IF (instrFunID <=> 0 OR instrFunID <=> entFunID) THEN
                loop_2: LOOP
                    SET refNum = CAST(
                        REGEXP_SUBSTR(
                            nextInstruction, "0|[1-9][0-9]*", 1, 1 + j
                        )
                        AS UNSIGNED
                    );
                    IF (refNum IS NULL) THEN
                        LEAVE loop_2;
                    END IF;

                    SET nestedEntID = CAST(
                        SUBSTR(
                            REGEXP_SUBSTR(
                                defStr, "@\\[0|[1-9][0-9]*", 1, 1 + refNum
                            ),
                            3
                        )
                        AS UNSIGNED
                    );
                    IF (nestedEntID IS NULL OR nestedEntID = 0) THEN
                        SELECT NULL AS entType;
                    ELSE
                        CALL selectEntityRecursively (
                            userID,
                            nestedEntID,
                            maxLen,
                            0,
                            recurseInstruction,
                            maxRecLevel - 1
                        );
                    END IF;

                    SET j = j + 1;
                    ITERATE loop_2;
                END LOOP loop_2;
                SET j = 1;
            END IF;

            -- If the instrFunID matches entFunID exactly, short circuit the
            -- loop here.
            IF (instrFunID <=> entFunID) THEN
                LEAVE loop_1;
            END IF;
            SET i = i + 1;
            ITERATE loop_1;
        END LOOP loop_1;
    END IF;
END proc //
DELIMITER ;







DELIMITER //
CREATE PROCEDURE selectEntityIDFromSecKey (
    IN userID BIGINT UNSIGNED,
    IN entType CHAR,
    IN readerWhitelistID BIGINT UNSIGNED,
    IN defKey VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
)
proc: BEGIN
    DECLARE isMember TINYINT;

    -- Check that the user isn't out of download data.
    CALL _increaseWeeklyUserCounters (
        userID, 0, 0, 1, isExceeded
    );

    -- Exit if the user is not currently on the user whitelist. Do this first
    -- to avoid timing attacks.
    CALL _getIsMember (
        userID, readerWhitelistID,
        isMember
    );
    IF NOT (isMember) THEN
        SELECT NULL AS entID;
    END IF;

    SELECT ent_id AS entID
    FROM EntitySecKeys FORCE INDEX (PRIMARY)
    WHERE (
        ent_type = entType AND
        reader_whitelist_id = readerWhitelistID AND
        def_key = defKey
    );
END proc //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE parseAndObtainRegularEntity (
    IN userID BIGINT UNSIGNED,
    IN readerWhitelistID BIGINT UNSIGNED,
    IN defStr VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
)
proc: BEGIN
    -- Find the entity (with isAnonymous = 1, insertWhenNotFound = 0, and
    -- selectWhenFound = 1).
    CALL _parseAndObtainRegularEntity (
        userID, defStr, readerWhitelistID, 1, 0, 1,
        @unused, @unused
    );
END proc //
DELIMITER ;





-- DELIMITER //
-- CREATE PROCEDURE selectEntityFromSecKey (
--     IN userID BIGINT UNSIGNED,
--     IN entType CHAR,
--     IN readerWhitelistID BIGINT UNSIGNED,
--     IN defKey VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
-- )
-- proc: BEGIN
--     DECLARE isMember TINYINT;

--     -- Exit if the user is not currently on the user whitelist. Do this first
--     -- to avoid timing attacks.
--     CALL _getIsMember (
--         userID, readerWhitelistID, isMember, @unused
--     );
--     IF NOT (isMember) THEN
--         SELECT NULL AS entID;
--     END IF;

--     SELECT
--         id AS entID,
--         creator_id AS creatorID,
--         is_editable AS isEditable
--     FROM Entities FORCE INDEX (PRIMARY)
--     WHERE id = (
--         SELECT ent_id
--         FROM EntitySecKeys FORCE INDEX (PRIMARY)
--         WHERE (
--             ent_type = entType AND
--             reader_whitelist_id = readerWhitelistID AND
--             def_key = defKey
--         )
--     );
-- END proc //
-- DELIMITER ;























DELIMITER //
CREATE PROCEDURE selectUserInfo (
    IN userID BIGINT UNSIGNED
)
BEGIN
    SELECT
        username AS username,
        public_keys_for_authentication AS publicKeys
    FROM UserData
    WHERE data_key = (
        SELECT data_key
        FROM Entities
        WHERE id = userID
    );
END //
DELIMITER ;

