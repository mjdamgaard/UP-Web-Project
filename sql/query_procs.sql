
SELECT "Query procedures";

DROP PROCEDURE selectEntityList;
DROP PROCEDURE selectScore;

-- TODO: Make proc to query for users who has rated a stmt / scale.

DROP PROCEDURE selectEntity;
DROP PROCEDURE selectEntityIDFromSecKey;
DROP PROCEDURE parseAndObtainRegularEntity;


DROP PROCEDURE selectUserInfo;






DELIMITER //
CREATE PROCEDURE selectEntityList (
    IN userID BIGINT UNSIGNED,
    IN listDefStr VARCHAR(700),
    IN readerWhitelistID BIGINT UNSIGNED,
    IN hi FLOAT,
    IN lo FLOAT,
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscOrder BOOL,
    IN includeScore2 BOOL
)
proc: BEGIN
    DECLARE isExceeded, isMember, exitCode TINYINT;
    DECLARE listID, foundRows BIGINT UNSIGNED;

    -- Check that the user isn't out of download data.
    CALL _increaseWeeklyUserCounters (
        userID, 0, 0, 1, isExceeded
    );
    IF (isExceeded) THEN
        SELECT listID, 5 AS exitCode; -- download limit was exceeded.
        LEAVE proc;
    END IF;

    -- Check that user is on the reader whitelist.
    CALL _getIsMemberAndUserWeight (
        userID, readerWhitelistID,
        isMember, @unused
    );
    IF NOT (isMember) THEN
        -- CAUTION: It should be noted that users can use this request to
        -- see if they are on any list, even ones they are not otherwise
        -- allowed to read. They can only see if they themselves are on the
        -- list, however. But this still means that whenever you make an
        -- otherwise private entity list with a user as one on the subjects,
        -- with a score1 > 0, then THE USER CAN STILL IN EFFECTIVELY SEE THAT
        -- THEY ARE ON THAT LIST.
        SELECT listID, 2 AS exitCode; -- user is not on the reader whitelist.
        LEAVE proc;
    END IF;

    -- Find the list entity (with isAnonymous = 1, insertWhenNotFound = 0, and
    -- selectWhenFound = 1).
    CALL _parseAndObtainRegularEntity (
        userID, listDefStr, readerWhitelistID, 1, 0, 1,
        listID, exitCode
    );
    IF (exitCode >= 2) THEN
        SELECT listID, 3 AS exitCode; -- finding list failed.
        LEAVE proc;
    END IF;

    IF (includeScore2) THEN
        SELECT
            score_1 AS score1,
            score_2 AS score2,
            subj_id AS subjID
        FROM EntityLists FORCE INDEX (sec_idx)
        WHERE (
            list_id = listID AND
            score_1 BETWEEN lo AND hi
        )
        ORDER BY
            CASE WHEN isAscOrder THEN score_1 END ASC,
            CASE WHEN NOT isAscOrder THEN score_1 END DESC,
            CASE WHEN isAscOrder THEN score_2 END ASC,
            CASE WHEN NOT isAscOrder THEN score_2 END DESC,
            CASE WHEN isAscOrder THEN subj_id END ASC,
            CASE WHEN NOT isAscOrder THEN subj_id END DESC
        LIMIT numOffset, maxNum;
    ELSE
        SELECT
            score_1 AS score1,
            subj_id AS subjID
        FROM EntityLists FORCE INDEX (sec_idx)
        WHERE (
            list_id = listID AND
            score_1 BETWEEN lo AND hi
        )
        ORDER BY
            CASE WHEN isAscOrder THEN score_1 END ASC,
            CASE WHEN NOT isAscOrder THEN score_1 END DESC,
            CASE WHEN isAscOrder THEN score_2 END ASC,
            CASE WHEN NOT isAscOrder THEN score_2 END DESC,
            CASE WHEN isAscOrder THEN subj_id END ASC,
            CASE WHEN NOT isAscOrder THEN subj_id END DESC
        LIMIT numOffset, maxNum;
    END IF;

    -- We also increase the download counter at the end of this.
    -- NOTE: FOUND_ROWS() is deprecated and might be removed in the future.
    SET foundRows = FOUND_ROWS();
    CALL _increaseWeeklyUserCounters (
        userID, 0, 0, foundRows, isExceeded
    );
END proc //
DELIMITER ;
-- SHOW WARNINGS; -- This warning is just the "FOUND_ROWS() is deprecated" one.




DELIMITER //
CREATE PROCEDURE selectScore (
    IN userID BIGINT UNSIGNED,
    IN listDefStr VARCHAR(700),
    IN readerWhitelistID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED
)
proc: BEGIN
    DECLARE isExceeded, isMember, exitCode TINYINT;
    DECLARE listID, foundRows BIGINT UNSIGNED;

    -- Check that the user isn't out of download data.
    CALL _increaseWeeklyUserCounters (
        userID, 0, 0, 2, isExceeded
    );
    IF (isExceeded) THEN
        SELECT 5 AS exitCode; -- download limit was exceeded.
        LEAVE proc;
    END IF;

    -- Find the list entity (with isAnonymous = 1, insertWhenNotFound = 0, and
    -- selectWhenFound = 1).
    CALL _parseAndObtainRegularEntity (
        userID, listDefStr, readerWhitelistID, 1, 0, 1,
        listID, exitCode
    );
    IF (exitCode >= 2) THEN
        SELECT 3 AS exitCode; -- finding list failed.
        LEAVE proc;
    END IF;

    -- Check that user is on the reader whitelist.
    CALL _getIsMemberAndUserWeight (
        userID, readerWhitelistID,
        isMember, @unused
    );
    IF NOT (isMember) THEN
        -- CAUTION: It should be noted that users can use this request to
        -- see if they are on any list, even ones they are not otherwise
        -- allowed to read. They can only see if they themselves are on the
        -- list, however. But this still means that whenever you make an
        -- otherwise private entity list with a user as one on the subjects,
        -- with a score1 > 0, then THE USER CAN STILL IN EFFECTIVELY SEE THAT
        -- THEY ARE ON THAT LIST.
        SELECT 2 AS exitCode; -- user is not on the reader whitelist.
        LEAVE proc;
    END IF;

    SELECT
        score_1 AS score1,
        score_2 AS score2,
        HEX(other_data) AS otherDataHex
    FROM EntityLists FORCE INDEX (PRIMARY)
    WHERE (
        list_id = listID AND
        subj_id = subjID
    );
END proc //
DELIMITER ;























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
    CALL _getIsMemberAndUserWeight (
        userID, readerWhitelistID, isMember, @unused
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
        SELECT NULL AS entType, 5 AS exitCode; -- Download limit was exceeded.
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

    CALL _getIsMemberAndUserWeight (
        userID, readerWhitelistID, isMember, @unused
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
        SELECT NULL AS entType;
        LEAVE proc;
    END IF;

    IF (entType = "r" AND recurseInstructions != 0 AND maxRecLevel > 0) THEN
        SET entFunID = REGEXP_SUBSTR(
            defStr, "[1-9][0-9]*", 1, 1
        );
        loop_1: LOOP
            SET nextInstruction = REGEXP_SUBSTR(
                recurseInstructions, "[^;]", 1, i
            );

            IF (nextInstruction IS NULL) THEN
                LEAVE loop_1;
            END IF;

            SET instrFunID = CAST(
                REGEXP_SUBSTR(
                    nextInstruction, "[1-9][0-9]*", 1, 1
                )
                AS UNSIGNED
            );

            IF (instrFunID <=> entFunID) THEN
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
    CALL _getIsMemberAndUserWeight (
        userID, readerWhitelistID, isMember, @unused
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
    IN entType CHAR,
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
--     CALL _getIsMemberAndUserWeight (
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

