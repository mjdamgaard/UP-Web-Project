
SELECT "Query procedures";

DROP PROCEDURE selectEntityList;
DROP PROCEDURE selectScore;

-- TODO: Make proc to query for users who has rated a stmt / scale.

DROP PROCEDURE selectEntity;
DROP PROCEDURE selectEntityFromSecKey;
DROP PROCEDURE selectEntityIDFromSecKey;


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

    -- Find the list entity (with isAnonymous = 1, and insertWhenNotFound = 0).
    CALL _parseAndObtainRegularEntity (
        userID, listDefStr, readerWhitelistID, 1, 0,
        listID, exitCode
    );
    IF (exitCode >= 2) THEN
        SELECT listID, 3 AS exitCode; -- finding list failed.
        LEAVE proc;
    END IF;

    -- If the list was obtained, return it as the first result.
    SELECT listID, 0 AS exitCode;

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

    -- Find the list entity (with isAnonymous = 1, and insertWhenNotFound = 0).
    CALL _parseAndObtainRegularEntity (
        userID, listDefStr, readerWhitelistID, 1, 0,
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
        HEX(other_data) AS otherDataHex,
        listID
    FROM EntityLists FORCE INDEX (PRIMARY)
    WHERE (
        list_id = listID AND
        subj_id = subjID
    );
END proc //
DELIMITER ;













-- DELIMITER //
-- CREATE PROCEDURE selectEntityListFromHash (
--     IN userID BIGINT UNSIGNED,
--     IN scaleHash CHAR(64),
--     IN hi FLOAT,
--     IN lo FLOAT,
--     IN maxNum INT UNSIGNED,
--     IN numOffset INT UNSIGNED,
--     IN isAscOrder BOOL
-- )
-- BEGIN
--     SELECT
--         score AS scoreVal,
--         subj_id AS entID
--     FROM Scores
--     WHERE (
--         user_id = userID AND
--         scale_id = (
--             SELECT ent_id
--             FROM EntityHashes
--             WHERE def_hash = scaleHash
--         ) AND
--         score BETWEEN lo AND hi
--     )
--     ORDER BY
--         CASE WHEN isAscOrder THEN scoreVal END ASC,
--         CASE WHEN NOT isAscOrder THEN scoreVal END DESC,
--         CASE WHEN isAscOrder THEN entID END ASC,
--         CASE WHEN NOT isAscOrder THEN entID END DESC
--     LIMIT numOffset, maxNum;
-- END //
-- DELIMITER ;


-- DELIMITER //
-- CREATE PROCEDURE selectEntityListFromDefStr (
--     IN userID BIGINT UNSIGNED,
--     IN scaleDefStr CHAR(64),
--     IN hi FLOAT,
--     IN lo FLOAT,
--     IN maxNum INT UNSIGNED,
--     IN numOffset INT UNSIGNED,
--     IN isAscOrder BOOL
-- )
-- BEGIN
--     SELECT
--         score AS scoreVal,
--         subj_id AS entID
--     FROM Scores
--     WHERE (
--         user_id = userID AND
--         scale_id = (
--             SELECT ent_id
--             FROM EntityHashes
--             WHERE def_hash = SHA2(CONCAT("j.", scaleDefStr), 256)
--         ) AND
--         score BETWEEN lo AND hi
--     )
--     ORDER BY
--         CASE WHEN isAscOrder THEN scoreVal END ASC,
--         CASE WHEN NOT isAscOrder THEN scoreVal END DESC,
--         CASE WHEN isAscOrder THEN entID END ASC,
--         CASE WHEN NOT isAscOrder THEN entID END DESC
--     LIMIT numOffset, maxNum;
-- END //
-- DELIMITER ;


-- DELIMITER //
-- CREATE PROCEDURE selectEntityListFromDefStrings (
--     IN userID BIGINT UNSIGNED,
--     IN defStrList TEXT,
--     IN maxNum INT UNSIGNED,
--     IN numOffset INT UNSIGNED,
--     IN isAscOrder BOOL
-- )
-- BEGIN
--     DECLARE entID1, entID2, entID3, entID4, entID5, scaleID BIGINT UNSIGNED;
--     DECLARE defStr1, defStr2, defStr3, defStr4, defStr5, scaleDefStr TEXT;

--     entID_search: BEGIN 
--         SET defStr1 = SUBSTRING_INDEX(defStrList, "@;", 1);
--         SET defStr1 = SUBSTRING_INDEX(defStrList, "@;", 1);
--         SELECT id INTO entID1
--         FROM Entities
--         WHERE (
--             is_private = 0 AND
--             creator_id = 0 AND
--             def_hash = SHA2(CONCAT("j.", defStr1, 256))
--         );
--         IF (entID1 IS NULL) THEN LEAVE entID_search; END IF;

--         SET defStr2 = SUBSTRING_INDEX(defStrList, "@;", 2);
--         SET defStr2 = REPLACE(defStr2, "@e1", CONCAT("@", entID1));
--         SELECT id INTO entID2
--         FROM Entities
--         WHERE (
--             is_private = 0 AND
--             creator_id = 0 AND
--             def_hash = SHA2(CONCAT("j.", defStr2, 256))
--         );
--         IF (entID2 IS NULL) THEN LEAVE entID_search; END IF;

--         SET defStr3 = SUBSTRING_INDEX(defStrList, "@;", 3);
--         SET defStr3 = REPLACE(defStr3, "@e1", CONCAT("@", entID1));
--         SET defStr3 = REPLACE(defStr3, "@e2", CONCAT("@", entID2));
--         SELECT id INTO entID3
--         FROM Entities
--         WHERE (
--             is_private = 0 AND
--             creator_id = 0 AND
--             def_hash = SHA2(CONCAT("j.", defStr3, 256))
--         );
--         IF (entID3 IS NULL) THEN LEAVE entID_search; END IF;

--         SET defStr4 = SUBSTRING_INDEX(defStrList, "@;", 4);
--         SET defStr4 = REPLACE(defStr4, "@e1", CONCAT("@", entID1));
--         SET defStr4 = REPLACE(defStr4, "@e2", CONCAT("@", entID2));
--         SET defStr4 = REPLACE(defStr4, "@e3", CONCAT("@", entID3));
--         SELECT id INTO entID4
--         FROM Entities
--         WHERE (
--             is_private = 0 AND
--             creator_id = 0 AND
--             def_hash = SHA2(CONCAT("j.", defStr4, 256))
--         );
--         IF (entID4 IS NULL) THEN LEAVE entID_search; END IF;

--         SET defStr5 = SUBSTRING_INDEX(defStrList, "@;", 5);
--         SET defStr5 = REPLACE(defStr5, "@e1", CONCAT("@", entID1));
--         SET defStr5 = REPLACE(defStr5, "@e2", CONCAT("@", entID2));
--         SET defStr5 = REPLACE(defStr5, "@e3", CONCAT("@", entID3));
--         SET defStr5 = REPLACE(defStr5, "@e4", CONCAT("@", entID4));
--         SELECT id INTO entID5
--         FROM Entities
--         WHERE (
--             is_private = 0 AND
--             creator_id = 0 AND
--             def_hash = SHA2(CONCAT("j.", defStr5, 256))
--         );
--     END entID_search;

--     SET scaleDefStr = SUBSTRING_INDEX(defStrList, "@;", -1);
--     SET scaleDefStr = REPLACE(scaleDefStr, "@e1", CONCAT("@", entID1));
--     SET scaleDefStr = REPLACE(scaleDefStr, "@e2", CONCAT("@", entID2));
--     SET scaleDefStr = REPLACE(scaleDefStr, "@e3", CONCAT("@", entID3));
--     SET scaleDefStr = REPLACE(scaleDefStr, "@e4", CONCAT("@", entID4));
--     SET scaleDefStr = REPLACE(scaleDefStr, "@e5", CONCAT("@", entID5));
--     SELECT id INTO scaleID
--     FROM Entities
--     WHERE (
--         is_private = 0 AND
--         creator_id = 0 AND
--         def_hash = SHA2(CONCAT("j.", scaleDefStr, 256))
--     );

--     SELECT
--         NULL AS scoreVal,
--         entID1 AS entID
--     UNION ALL
--     SELECT
--         NULL AS scoreVal,
--         entID2 AS entID
--     UNION ALL
--     SELECT
--         NULL AS scoreVal,
--         entID3 AS entID
--     UNION ALL
--     SELECT
--         NULL AS scoreVal,
--         entID4 AS entID
--     UNION ALL
--     SELECT
--         NULL AS scoreVal,
--         entID5 AS entID
--     UNION ALL
--     SELECT
--         score AS scoreVal,
--         subj_id AS entID
--     FROM Scores
--     WHERE (
--         user_id = userID AND
--         scale_id = scaleID
--     )
--     ORDER BY
--         CASE WHEN isAscOrder THEN scoreVal END ASC,
--         CASE WHEN NOT isAscOrder THEN scoreVal END DESC,
--         CASE WHEN isAscOrder THEN entID END ASC,
--         CASE WHEN NOT isAscOrder THEN entID END DESC
--     LIMIT numOffset, maxNum;
-- END //
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
        SELECT 5 AS exitCode; -- download limit was exceeded.
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

    CALL _getIsMemberAndUserWeight (
        userID, readerWhitelistID, isMember, @unused
    );

    IF (isMember) THEN
        CALL _increaseWeeklyUserCounters (
            userID, 0, 0, LENGTH(defStr) DIV 1000 + 1, isExceeded
        );
        IF (isExceeded) THEN
            SELECT 5 AS exitCode; -- download limit was exceeded.
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
END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectEntityRecursively (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN maxLen INT UNSIGNED,
    IN startPos INT UNSIGNED,
    IN recurseInstructions VARCHAR(255),
    IN maxRowNumber TINYINT UNSIGNED
)
proc: BEGIN
    DECLARE entType CHAR;
    DECLARE defStr LONGTEXT;
    DECLARE len, creatorID, readerWhitelistID BIGINT UNSIGNED;
    DECLARE isEditable, isMember, isExceeded TINYINT;
    DECLARE listID BIGINT UNSIGNED;
    DECLARE i, j INT DEFAULT 1;
    DECLARE nextInstruction VARCHAR(255);

    -- Check that the user isn't out of download data.
    CALL _increaseWeeklyUserCounters (
        userID, 0, 0, 1, isExceeded
    );
    IF (isExceeded) THEN
        SELECT 5 AS exitCode; -- download limit was exceeded.
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

    CALL _getIsMemberAndUserWeight (
        userID, readerWhitelistID, isMember, @unused
    );

    IF (isMember) THEN
        CALL _increaseWeeklyUserCounters (
            userID, 0, 0, LENGTH(defStr) DIV 1000 + 1, isExceeded
        );
        IF (isExceeded) THEN
            SELECT 5 AS exitCode; -- download limit was exceeded.
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

    IF (entType = "r" AND recurseInstructions != 0 AND maxRowNumber > 0) THEN
        loop_1: LOOP
            SET nextInstruction = REGEXP_SUBSTR(
                recurseInstructions, "[^;]", 1, i
            );
            SET funID = REGEXP_SUBSTR(
                nextInstruction, "[1-9][0-9]*", 1, 1
            );
            IF ()

            SET i = i + 1;
            ITERATE loop_1;
        END LOOP loop_1;
    END IF;
END proc //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE selectEntityFromSecKey (
    IN userID BIGINT UNSIGNED,
    IN entType CHAR,
    IN readerWhitelistID BIGINT UNSIGNED,
    IN defKey VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
)
proc: BEGIN
    DECLARE isMember TINYINT;

    -- Exit if the user is not currently on the user whitelist. Do this first
    -- to avoid timing attacks.
    CALL _getIsMemberAndUserWeight (
        userID, readerWhitelistID, isMember, @unused
    );
    IF NOT (isMember) THEN
        SELECT NULL AS entID;
    END IF;

    SELECT
        id AS entID,
        creator_id AS creatorID,
        is_editable AS isEditable
    FROM Entities FORCE INDEX (PRIMARY)
    WHERE id = (
        SELECT ent_id
        FROM EntitySecKeys FORCE INDEX (PRIMARY)
        WHERE (
            ent_type = entType AND
            reader_whitelist_id = readerWhitelistID AND
            def_key = defKey
        )
    );
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












-- TODO: Remake selectFunctionalEntityAndChildren() such that it only replaces
-- the function calls that are preceded by '&'. ..And maybe IDs preceded by @
-- should be replaced by the entity's defStr (when it's an 'f' entity, at
-- least).


-- DELIMITER //
-- CREATE PROCEDURE selectFunctionalEntityAndChildren (
--     IN funCallStr VARCHAR(3000) CHARACTER SET utf8mb4
-- )
-- BEGIN
--     DECLARE outValStr, outSubStr TEXT;
--     DECLARE len INT;

--     CALL _selectFunctionalEntityAndChildren(
--         funCallStr, outValStr, outSubStr, len
--     );

--     SELECT outValStr, outSubStr;
-- END //
-- DELIMITER ;



-- DELIMITER //
-- CREATE PROCEDURE _selectFunctionalEntityAndChildren (
--     IN funCallStr VARCHAR(3000),
--     OUT outValStr TEXT,
--     OUT outSubStr TEXT,
--     OUT len INT
-- )
-- BEGIN proc: BEGIN
--     DECLARE fstExp      TEXT DEFAULT (SUBSTRING_INDEX(funCallStr, 1));
--     DECLARE paramNumStr TEXT DEFAULT (SUBSTRING_INDEX(funCallStr, 2));
--     DECLARE p TINYINT UNSIGNED DEFAULT (
--         CAST(paramNumStr AS UNSIGNED INTEGER)
--     );
--     DECLARE valStr, subStr, defStr TEXT;
--     DECLARE l INT;

--     IF (SUBSTR(fstExp, 1, 1) NOT REGEXP "[a-zA-z_\\$]") THEN
--         SET outValStr = fstExp;
--         SET outSubStr = fstExp;
--         SET len = LENGTH(fstExp);
--         LEAVE proc;
--     END IF;

--     IF (p = 0) THEN
--         SELECT CAST(ent_id AS CHAR) INTO outValStr
--         FROM EntitySecKeys
--         WHERE (
--             ent_type = "f" AND
--             def_key = fstExp
--         );
--         SET outSubStr = CONCAT(outValStr, ",", paramNumStr);
--         SET len = LENGTH(fstExp) + 1 + LENGTH(paramNumStr);
--         LEAVE proc;
--     END IF;

--     SET outSubStr = CONCAT(",", paramNumStr);
--     SET defStr = "";
--     SET len = LENGTH(fstExp) + 1 + LENGTH(paramNumStr);
--     for_loop: LOOP

--         CALL _selectFunctionalEntityAndChildren(
--             SUBSTR(funCallStr, len + 2), valStr, subStr, l
--         );

--         SET outSubStr = CONCAT(outSubStr, ",", subStr);
--         SET defStr = CONCAT(defStr, ",", valStr);
--         SET len = len + 1 + l;

--         SET p = p - 1;
--         IF (p > 0) THEN
--             ITERATE for_loop;
--         END IF;
--         LEAVE for_loop;
--     END LOOP for_loop;


--     SET defStr = CONCAT(fstExp, defStr);

--     SELECT CAST(ent_id AS CHAR) INTO outValStr
--     FROM EntitySecKeys
--     WHERE (
--         ent_type = "f" AND
--         def_key = defStr;
--     );
--     SET outSubStr = CONCAT(outValStr, outSubStr);

-- END proc; END //
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

