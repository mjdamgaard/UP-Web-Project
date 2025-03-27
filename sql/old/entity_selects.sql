
SELECT "Entity select procedures";


DROP PROCEDURE selectEntity;
DROP PROCEDURE selectEntityIDFromSecKey;






DELIMITER //
CREATE PROCEDURE selectEntity (
    IN entID BIGINT UNSIGNED,
    IN maxLen INT UNSIGNED,
    IN startPos INT UNSIGNED
)
proc: BEGIN
    SELECT
        ent_type AS entType,
        (
            CASE WHEN maxLen = 0 THEN
                SUBSTR(def_str, startPos + 1)
            ELSE
                SUBSTR(def_str, startPos + 1, maxLen)
            END
        ) AS defStr,
        creator_id AS creatorID,
        is_editable AS isEditable,
        whitelist_id AS whitelistID
    FROM Entities FORCE INDEX (PRIMARY)
    WHERE id = entID;
END proc //
DELIMITER ;






DELIMITER //
CREATE PROCEDURE selectEntityIDFromSecKey (
    IN entType CHAR,
    IN editorID BIGINT UNSIGNED,
    IN whitelistID BIGINT UNSIGNED,
    IN defKey VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
)
proc: BEGIN
    SELECT ent_id AS entID
    FROM EntitySecKeys FORCE INDEX (PRIMARY)
    WHERE (
        ent_type = entType AND
        editor_id = editorID AND
        whitelist_id = whitelistID AND
        def_key = defKey
    );
END proc //
DELIMITER ;









-- DELIMITER //
-- CREATE PROCEDURE selectEntityRecursively (
--     IN userID BIGINT UNSIGNED,
--     IN entID BIGINT UNSIGNED,
--     IN maxLen INT UNSIGNED,
--     IN recurseInstructions VARCHAR(255),
--     IN maxRecLevel TINYINT UNSIGNED
-- )
-- proc: BEGIN
--     DECLARE entType CHAR;
--     DECLARE defStr TEXT;
--     DECLARE len, creatorID, whitelistID BIGINT UNSIGNED;
--     DECLARE isEditable, isMember, isExceeded TINYINT;
--     DECLARE listID, instrFunID, entFunID, nestedEntID BIGINT UNSIGNED;
--     DECLARE i, j, refNum, newRowNumber INT DEFAULT 1;
--     DECLARE nextInstruction VARCHAR(255);

--     -- Check that the user isn't out of download data.
--     CALL _increaseWeeklyUserCounters (
--         userID, 0, 0, 1, isExceeded
--     );
--     IF (isExceeded) THEN
--         SELECT entID, NULL AS entType, 5 AS exitCode; -- Counter was exceeded.
--         LEAVE proc;
--     END IF;

--     SELECT
--         ent_type,
--         (
--             CASE WHEN maxLen = 0 THEN
--                 SUBSTR(def_str, 1)
--             ELSE
--                 SUBSTR(def_str, 1, maxLen)
--             END
--         ),
--         LENGTH(def_str),
--         creator_id,
--         is_editable,
--         whitelist_id
--     INTO
--         entType,
--         defStr,
--         len,
--         creatorID,
--         isEditable,
--         whitelistID
--     FROM Entities FORCE INDEX (PRIMARY)
--     WHERE id = entID;

--     CALL _getIsMember (
--         userID, whitelistID,
--         isMember
--     );

--     IF (isMember) THEN
--         CALL _increaseWeeklyUserCounters (
--             userID, 0, 0, LENGTH(defStr) DIV 1000 + 1, isExceeded
--         );
--         IF (isExceeded) THEN
--             SELECT entID, NULL AS entType, 5 AS exitCode; -- Counter exceeded.
--             LEAVE proc;
--         END IF;

--         SELECT
--             entID,
--             entType,
--             defStr,
--             len,
--             creatorID,
--             isEditable,
--             whitelistID;
--     ELSE
--         SELECT entID, NULL AS entType;
--         LEAVE proc;
--     END IF;

--     -- If the entity is a regular/referential entity, then we loop through all
--     -- the instructions, each of the form 'instrFunID,refNum1,refNum2,...;',
--     -- until a instrFunID is found that matches entFunID, and then we loop
--     -- through all the refNum's, and for each one parse the refNum^th entity
--     -- reference in defStr, and query the defStr in the entity via a recursive
--     -- call to this procedure. Note that refNum = 0 here will point to the
--     -- entFunID function entity itself.
--     -- Also, if recurseInstructions begins with '0,refNum1,refNum2,...;', then
--     -- we also treat this as if it matches the entFunID, except that we don't
--     -- short circuit the loop here.
--     IF (entType = "r" AND maxRecLevel > 0) THEN
--         SET entFunID = REGEXP_SUBSTR(
--             defStr, "[1-9][0-9]*", 1, 1
--         );
--         loop_1: LOOP
--             -- (Here we actually "cheat" and use a RegExp that skips all
--             -- irrelevant instructions immediately, such that the loop only
--             -- runs for up to two iterations.)
--             SET nextInstruction = REGEXP_SUBSTR(
--                 recurseInstructions,
--                 CONCAT("0,[^;]+|(^|;)", entFunID, ",[^;]+"),
--                 1, i
--             );

--             IF (nextInstruction IS NULL) THEN
--                 LEAVE loop_1;
--             END IF;

--             SET instrFunID = CAST(
--                 REGEXP_SUBSTR(
--                     nextInstruction, "0|[1-9][0-9]*", 1, 1
--                 )
--                 AS UNSIGNED
--             );

--             IF (instrFunID <=> 0 OR instrFunID <=> entFunID) THEN
--                 loop_2: LOOP
--                     SET refNum = CAST(
--                         REGEXP_SUBSTR(
--                             nextInstruction, "0|[1-9][0-9]*", 1, 1 + j
--                         )
--                         AS UNSIGNED
--                     );
--                     IF (refNum IS NULL) THEN
--                         LEAVE loop_2;
--                     END IF;

--                     SET nestedEntID = CAST(
--                         SUBSTR(
--                             REGEXP_SUBSTR(
--                                 defStr, "@\\[0|[1-9][0-9]*", 1, 1 + refNum
--                             ),
--                             3
--                         )
--                         AS UNSIGNED
--                     );
--                     IF (nestedEntID IS NULL OR nestedEntID = 0) THEN
--                         SELECT NULL AS entType;
--                     ELSE
--                         CALL selectEntityRecursively (
--                             userID,
--                             nestedEntID,
--                             maxLen,
--                             0,
--                             recurseInstruction,
--                             maxRecLevel - 1
--                         );
--                     END IF;

--                     SET j = j + 1;
--                     ITERATE loop_2;
--                 END LOOP loop_2;
--                 SET j = 1;
--             END IF;

--             -- If the instrFunID matches entFunID exactly, short circuit the
--             -- loop here.
--             IF (instrFunID <=> entFunID) THEN
--                 LEAVE loop_1;
--             END IF;
--             SET i = i + 1;
--             ITERATE loop_1;
--         END LOOP loop_1;
--     END IF;
-- END proc //
-- DELIMITER ;








-- DELIMITER //
-- CREATE PROCEDURE parseAndObtainRegularEntity (
--     IN userID BIGINT UNSIGNED,
--     IN whitelistID BIGINT UNSIGNED,
--     IN defStr VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
-- )
-- proc: BEGIN
--     -- Find the entity (with isAnonymous = 1, insertWhenNotFound = 0, and
--     -- selectWhenFound = 1).
--     CALL _parseAndObtainRegularEntity (
--         userID, defStr, whitelistID, 1, 0, 1,
--         @unused, @unused
--     );
-- END proc //
-- DELIMITER ;





-- DELIMITER //
-- CREATE PROCEDURE selectEntityFromSecKey (
--     IN userID BIGINT UNSIGNED,
--     IN entType CHAR,
--     IN whitelistID BIGINT UNSIGNED,
--     IN defKey VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
-- )
-- proc: BEGIN
--     DECLARE isMember TINYINT;

--     -- Exit if the user is not currently on the user whitelist. Do this first
--     -- to avoid timing attacks.
--     CALL _getIsMember (
--         userID, whitelistID, isMember, @unused
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
--             whitelist_id = whitelistID AND
--             def_key = defKey
--         )
--     );
-- END proc //
-- DELIMITER ;














-- DELIMITER //
-- CREATE PROCEDURE selectUserInfo (
--     IN userID BIGINT UNSIGNED
-- )
-- BEGIN
--     SELECT
--         username AS username,
--         public_keys_for_authentication AS publicKeys
--     FROM UserData
--     WHERE data_key = (
--         SELECT data_key
--         FROM Entities
--         WHERE id = userID
--     );
-- END //
-- DELIMITER ;

