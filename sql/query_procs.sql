
SELECT "Query procedures";

DROP PROCEDURE selectEntityList;
DROP PROCEDURE selectEntityListFromHash;
DROP PROCEDURE selectEntityListFromDefStr;
DROP PROCEDURE selectScore;

-- TODO: Make proc to query for users who has rated a stmt / scale.

DROP PROCEDURE selectEntity;
DROP PROCEDURE selectEntityAsUser;
DROP PROCEDURE selectEntityFromHash;


DROP PROCEDURE selectUserInfo;







DELIMITER //
CREATE PROCEDURE selectUserOpinionEntityList (
    IN userID BIGINT UNSIGNED,
    IN scaleID BIGINT UNSIGNED,
    IN hi FLOAT,
    IN lo FLOAT,
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscOrder BOOL
)
BEGIN
    SELECT
        score_val AS scoreVal,
        subj_id AS entID
    FROM UserOpinionScores
    WHERE (
        user_id = userID AND
        scale_id = scaleID AND
        score_val BETWEEN lo AND hi
    )
    ORDER BY
        CASE WHEN isAscOrder THEN scoreVal END ASC,
        CASE WHEN NOT isAscOrder THEN scoreVal END DESC,
        CASE WHEN isAscOrder THEN entID END ASC,
        CASE WHEN NOT isAscOrder THEN entID END DESC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectUserOpinionEntityListFromScaleKey (
    IN userID BIGINT UNSIGNED,
    IN scaleKey VARCHAR(3000),
    IN hi FLOAT,
    IN lo FLOAT,
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscOrder BOOL
)
BEGIN
    DECLARE scaleID BIGINT UNSIGNED;

    SELECT ent_id INTO scaleID
    FROM EntitySecKeys
    WHERE (
        type_ident = "f" AND
        def_key = CAST(scaleKey AS BINARY)
    );

    CALL selectUserOpinionEntityList (
        userID, scaleID,
        hi, lo,
        maxNum, numOffset,
        isAscOrder
    );
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectPrivateEntityListFromScaleKey (
    IN userID BIGINT UNSIGNED,
    IN scaleKey VARCHAR(3000),
    IN hi FLOAT,
    IN lo FLOAT,
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscOrder BOOL
)
BEGIN
    SELECT
        score_val AS scoreVal,
        subj_id AS entID
    FROM PrivateScores
    WHERE (
        user_id = userID AND
        scale_key = CAST(scaleKey AS BINARY) AND
        score_val BETWEEN lo AND hi
    )
    ORDER BY
        CASE WHEN isAscOrder THEN scoreVal END ASC,
        CASE WHEN NOT isAscOrder THEN scoreVal END DESC,
        CASE WHEN isAscOrder THEN entID END ASC,
        CASE WHEN NOT isAscOrder THEN entID END DESC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;









DELIMITER //
CREATE PROCEDURE selectEntityListFromHash (
    IN userID BIGINT UNSIGNED,
    IN scaleHash CHAR(64),
    IN hi FLOAT,
    IN lo FLOAT,
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscOrder BOOL
)
BEGIN
    SELECT
        score_val AS scoreVal,
        subj_id AS entID
    FROM Scores
    WHERE (
        user_id = userID AND
        scale_id = (
            SELECT ent_id
            FROM EntityHashes
            WHERE def_hash = scaleHash
        ) AND
        score_val BETWEEN lo AND hi
    )
    ORDER BY
        CASE WHEN isAscOrder THEN scoreVal END ASC,
        CASE WHEN NOT isAscOrder THEN scoreVal END DESC,
        CASE WHEN isAscOrder THEN entID END ASC,
        CASE WHEN NOT isAscOrder THEN entID END DESC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectEntityListFromDefStr (
    IN userID BIGINT UNSIGNED,
    IN scaleDefStr CHAR(64),
    IN hi FLOAT,
    IN lo FLOAT,
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscOrder BOOL
)
BEGIN
    SELECT
        score_val AS scoreVal,
        subj_id AS entID
    FROM Scores
    WHERE (
        user_id = userID AND
        scale_id = (
            SELECT ent_id
            FROM EntityHashes
            WHERE def_hash = SHA2(CONCAT("j.", scaleDefStr), 256)
        ) AND
        score_val BETWEEN lo AND hi
    )
    ORDER BY
        CASE WHEN isAscOrder THEN scoreVal END ASC,
        CASE WHEN NOT isAscOrder THEN scoreVal END DESC,
        CASE WHEN isAscOrder THEN entID END ASC,
        CASE WHEN NOT isAscOrder THEN entID END DESC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;


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
--         score_val AS scoreVal,
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
CREATE PROCEDURE selectScore (
    IN userID BIGINT UNSIGNED,
    IN scaleID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED
)
BEGIN
    SELECT score_val AS scoreVal
    FROM Scores
    WHERE (
        user_id = userID AND
        scale_id = scaleID AND
        subj_id = subjID
    );
END //
DELIMITER ;










DELIMITER //
CREATE PROCEDURE selectEntity (
    IN entID BIGINT UNSIGNED,
    IN maxLen INT UNSIGNED,
    IN startPos INT UNSIGNED
)
BEGIN
    SELECT
        type_ident AS type,
        (
            CASE WHEN maxLen = 0 THEN SUBSTRING(def_str, startPos + 1)
            ELSE SUBSTRING(def_str, startPos + 1, maxLen)
            END
        ) AS defStr,
        LENGTH(def_str) AS len,
        creator_id AS creatorID,
        is_editable AS isEditable
    FROM Entities
    WHERE (
        id = entID AND
        is_private = 0
    );
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectEntityAsUser (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN maxLen INT UNSIGNED,
    IN startPos INT UNSIGNED
)
BEGIN
    SELECT
        type_ident AS type,
        (
            CASE WHEN maxLen = 0 THEN SUBSTRING(def_str, startPos + 1)
            ELSE SUBSTRING(def_str, startPos + 1, maxLen)
            END
        ) AS defStr,
        LENGTH(def_str) AS len,
        creator_id AS creatorID,
        is_editable AS isEditable,
        is_private AS isPrivate
    FROM Entities
    WHERE (
        id = entID AND
        (is_private = 0 OR creator_id = userID)
    );
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectEntityFromHash (
    IN defHash CHAR(64),
    IN maxLen INT UNSIGNED,
    IN startPos INT UNSIGNED
)
BEGIN
    SELECT
        type_ident AS type,
        (
            CASE WHEN maxLen = 0 THEN SUBSTRING(def_str, startPos + 1)
            ELSE SUBSTRING(def_str, startPos + 1, maxLen)
            END
        ) AS defStr,
        LENGTH(def_str) AS len
    FROM Entities
    WHERE id = (
        SELECT ent_id
        FROM EntityHashes
        WHERE def_hash = defHash
    );
END //
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
--             type_ident = "f" AND
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
--         type_ident = "f" AND
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

