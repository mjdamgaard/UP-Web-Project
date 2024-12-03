
SELECT "Insert procedures";

DROP PROCEDURE insertOrUpdateScore;
DROP PROCEDURE deleteScore;

DROP PROCEDURE insertOrFindEntity;
DROP PROCEDURE editOrFindEntity;





-- TODO: Consider if constant 'op' lists should exits, and then if that should
-- change this implementation. ..Nah, who cares about score widths for constant
-- lists; they should just be put in FloatingPointScoreAggregates instead. 
DELIMITER //
CREATE PROCEDURE insertOrUpdateScore (
    IN userID BIGINT UNSIGNED,
    IN listID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN scoreVal FLOAT,
    IN scoreWidth FLOAT
)
BEGIN proc: BEGIN
    DECLARE listDef, scaleDef, estDef VARCHAR(700);
    DECLARE listOwnerID, scaleID, estID BIGINT UNSIGNED;
    DECLARE scoreMin, scoreMax FLOAT;

    -- Exit if the subject entity does not exist.
    IF ((SELECT type_ident FROM Entities WHERE id = subjID) IS NULL) THEN
        SELECT subjID AS outID, 1 AS exitCode; -- subject does not exist.
        LEAVE proc;
    END IF;

    -- Parse userID and scaleID from listDef = "'op',userID,scaleID".
    SELECT def_str INTO listDef
    FROM Entities
    WHERE id = listID;
    SET listOwnerID = CAST(
        SUBSTRING_INDEX(listDef, ",", 2) AS UNSIGNED INTEGER
    );
    SET scaleID = CAST(
        SUBSTRING_INDEX(listDef, ",", 3) AS UNSIGNED INTEGER
    );

    -- Exit if the list's owner does not match the input userID.
    IF (listOwnerID != userID) THEN
        SELECT listOwnerID AS outID, 2 AS exitCode; -- user does not own list.
        LEAVE proc;
    END IF;

    -- Parse estID from ScaleDef = "'scale',objID,relID,qualID,estID".
    SELECT def_str INTO scaleDef
    FROM Entities
    WHERE id = scaleID;
    SET estID = CAST(
        SUBSTRING_INDEX(scaleDef, ",", 5) AS UNSIGNED INTEGER
    );

    -- Parse interval limits from estDef = "'est',min,max,step,metricID".
    SELECT def_str INTO estDef
    FROM Entities
    WHERE id = estID;
    SET scoreMin = CAST(
        SUBSTRING_INDEX(estDef, ",", 2) AS FLOAT
    );
    SET scoreMax = CAST(
        SUBSTRING_INDEX(estDef, ",", 3) AS FLOAT
    );

    -- Exit if the score is not within the range.
    IF (score < scoreMin OR score > scoreMax) THEN
        SELECT subjID AS outID, 3 AS exitCode; -- score is not within range.
        LEAVE proc;
    END IF;

    INSERT INTO UserOpinionScores (
        list_id, subj_id, score_val, score_width
    )
    VALUES (
        listID, subjID, scoreVal, scoreWidth
    )
    ON DUPLICATE KEY UPDATE score_val = scoreVal, score_width = scoreWidth;

    SELECT subjID AS outID, 0 AS exitCode; -- insert or update.
END proc; END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE deleteScore (
    IN userID BIGINT UNSIGNED,
    IN listID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED
)
BEGIN proc: BEGIN
    DECLARE listDef VARCHAR(700);
    DECLARE listOwnerID BIGINT UNSIGNED;

    -- Parse userID from listDef = "'op',userID,scaleID".
    SELECT def_str INTO listDef
    FROM Entities
    WHERE id = listID;
    SET listOwnerID = CAST(
        SUBSTRING_INDEX(listDef, ",", 2) AS UNSIGNED INTEGER
    );

    -- Exit if the list's owner does not match the input userID.
    IF (listOwnerID != userID) THEN
        SELECT listOwnerID AS outID, 2 AS exitCode; -- user does not own list.
        LEAVE proc;
    END IF;


    DELETE FROM UserOpinionScores
    WHERE (
        list_id = listID AND
        subj_id = subjID
    );

    SELECT subjID AS outID, 0 AS exitCode; -- delete.
END proc; END //
DELIMITER ;












DELIMITER //
CREATE PROCEDURE insertOrFindFunctionalEntity (
    IN userID BIGINT UNSIGNED,
    IN defStr VARCHAR(3000) CHARACTER SET utf8mb4,
    IN isAnonymous BOOL,
    IN daysLeftOfEditing INT
)
BEGIN proc: BEGIN
    DECLARE outID BIGINT UNSIGNED;

    START TRANSACTION;

    INSERT IGNORE INTO EntitySecKeys (
        type_ident, def_key, ent_id
    )
    VALUES (
        datatype, defStr, 0
    );
    SET outID = LAST_INSERT_ID();

    IF (outID IS NOT NULL) THEN
        ROLLBACK;
        SELECT outID, 1 AS exitCode; -- find.
        LEAVE proc;
    END IF;

    INSERT INTO Entities (
        creator_id,
        type_ident, def_str, is_private, editable_until
    )
    VALUES (
        CASE WHEN (isAnonymous) THEN 0 ELSE userID END,
        "f", CAST(defStr AS BINARY), 0, NULL
    );
    SET outID = LAST_INSERT_ID();

    COMMIT;
    SELECT outID, 0 AS exitCode; -- insert.
END proc; END //
DELIMITER ;







DELIMITER //
CREATE PROCEDURE _insertBinaryEntity (
    IN datatype CHAR,
    IN userID BIGINT UNSIGNED,
    IN defStr LONGBLOB,
    IN isPrivate BOOL,
    IN isAnonymous BOOL,
    IN daysLeftOfEditing INT
)
BEGIN
    DECLARE outID BIGINT UNSIGNED;

    IF (isPrivate) THEN
        SET isAnonymous = 0;
        SET daysLeftOfEditing = NULL;
    END IF;
    IF (isAnonymous || daysLeftOfEditing <= 0) THEN
        SET daysLeftOfEditing = NULL
    END IF;

    INSERT INTO Entities (
        creator_id,
        type_ident, def_str, is_private,
        editable_until
    )
    VALUES (
        CASE WHEN (isAnonymous) THEN 0 ELSE userID END,
        datatype, defStr, isPrivate,
        ADDDATE(CURDATE, INTERVAL daysLeftOfEditing DAY)
    );
    SET outID = LAST_INSERT_ID();

    SELECT outID, 0 AS exitCode; -- insert.
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertBinaryEntity (
    IN userID BIGINT UNSIGNED,
    IN defStr BLOB,
    IN isPrivate BOOL,
    IN isAnonymous BOOL,
    IN daysLeftOfEditing INT
)
BEGIN
    CALL _insertBinaryEntity(
        "b",
        userID, defStr, isPrivate, isAnonymous, daysLeftOfEditing
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE insertAttributeDefinedEntity (
    IN userID BIGINT UNSIGNED,
    IN defStr VARCHAR(600) CHARACTER SET utf8mb4, -- TODO: Determine this initial size.
    IN isPrivate BOOL,
    IN isAnonymous BOOL,
    IN daysLeftOfEditing INT
)
BEGIN
    CALL _insertBinaryEntity(
        "a",
        userID, CAST(defStr AS BINARY), isPrivate, isAnonymous,
        daysLeftOfEditing
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE insertUTF8Entity (
    IN userID BIGINT UNSIGNED,
    IN defStr TEXT CHARACTER SET utf8mb4,
    IN isPrivate BOOL,
    IN isAnonymous BOOL,
    IN daysLeftOfEditing INT
)
BEGIN
    CALL _insertBinaryEntity(
        "u",
        userID, CAST(defStr AS BINARY), isPrivate, isAnonymous,
        daysLeftOfEditing
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE insertHTMLEntity (
    IN userID BIGINT UNSIGNED,
    IN defStr TEXT CHARACTER SET utf8mb4,
    IN isPrivate BOOL,
    IN isAnonymous BOOL,
    IN daysLeftOfEditing INT
)
BEGIN
    CALL _insertBinaryEntity(
        "h",
        userID, CAST(defStr AS BINARY), isPrivate, isAnonymous,
        daysLeftOfEditing
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE insertJSONEntity (
    IN userID BIGINT UNSIGNED,
    IN defStr TEXT CHARACTER SET utf8mb4,
    IN isPrivate BOOL,
    IN isAnonymous BOOL,
    IN daysLeftOfEditing INT
)
BEGIN
    CALL _insertBinaryEntity(
        "j",
        userID, CAST(defStr AS BINARY), isPrivate, isAnonymous,
        daysLeftOfEditing
    );
END //
DELIMITER ;









DELIMITER //
CREATE PROCEDURE _editBinaryEntity (
    IN datatype CHAR,
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN defStr LONGBLOB,
    IN isPrivate BOOL,
    IN isAnonymous BOOL,
    IN daysLeftOfEditing INT
)
BEGIN proc: BEGIN
    DECLARE creatorID BIGINT UNSIGNED;
    DECLARE editableUntil DATE;

    IF (isPrivate) THEN
        SET isAnonymous = 0;
        SET daysLeftOfEditing = NULL;
    END IF;
    IF (isAnonymous || daysLeftOfEditing <= 0) THEN
        SET daysLeftOfEditing = NULL
    END IF;

    SELECT creator_id, editable_until
    INTO creatorID, editableUntil
    FROM Entities
    WHERE id = entID;

    IF (creatorID != userID) THEN
        SELECT entID AS outID, 1 AS exitCode; -- user is not the owner.
        LEAVE proc;
    END IF;

    IF (editableUntil IS NULL OR editableUntil > CURDATE()) THEN
        SELECT entID AS outID, 2 AS exitCode; -- can no longer be edited.
        LEAVE proc;
    END IF;

    UPDATE Entities
    SET
        creator_id = CASE WHEN (isAnonymous) THEN 0 ELSE userID END,
        type_ident = datatype,
        def_str = defStr,
        is_private = isPrivate,
        editable_until = ADDDATE(CURDATE, INTERVAL daysLeftOfEditing DAY)
    WHERE id = entID;

    SELECT entID AS outID, 0 AS exitCode; -- insert.
END proc; END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE editBinaryEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN defStr BLOB,
    IN isPrivate BOOL,
    IN isAnonymous BOOL,
    IN daysLeftOfEditing INT
)
BEGIN
    CALL _editBinaryEntity(
        "b",
        userID, entID, defStr, isPrivate, isAnonymous, daysLeftOfEditing
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE insertAttributeDefinedEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN defStr VARCHAR(600) CHARACTER SET utf8mb4, -- TODO: Determine this initial size.
    IN isPrivate BOOL,
    IN isAnonymous BOOL,
    IN daysLeftOfEditing INT
)
BEGIN
    CALL _editBinaryEntity(
        "a",
        userID, entID, CAST(defStr AS BINARY), isPrivate, isAnonymous,
        daysLeftOfEditing
    );
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE editUTF8Entity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN defStr TEXT CHARACTER SET utf8mb4,
    IN isPrivate BOOL,
    IN isAnonymous BOOL,
    IN daysLeftOfEditing INT
)
BEGIN
    CALL _editBinaryEntity(
        "u",
        userID, entID, CAST(defStr AS BINARY), isPrivate, isAnonymous,
        daysLeftOfEditing
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE editHTMLEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN defStr TEXT CHARACTER SET utf8mb4,
    IN isPrivate BOOL,
    IN isAnonymous BOOL,
    IN daysLeftOfEditing INT
)
BEGIN
    CALL _editBinaryEntity(
        "h",
        userID, entID, CAST(defStr AS BINARY), isPrivate, isAnonymous,
        daysLeftOfEditing
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE editJSONEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN defStr TEXT CHARACTER SET utf8mb4,
    IN isPrivate BOOL,
    IN isAnonymous BOOL,
    IN daysLeftOfEditing INT
)
BEGIN
    CALL _editBinaryEntity(
        "j",
        userID, entID, CAST(defStr AS BINARY), isPrivate, isAnonymous,
        daysLeftOfEditing
    );
END //
DELIMITER ;







DELIMITER //
CREATE PROCEDURE anonymizeEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED
)
BEGIN proc: BEGIN
    DECLARE creatorID BIGINT UNSIGNED;

    SELECT creator_id INTO creatorID
    FROM Entities
    WHERE id = entID;

    IF (creatorID != userID) THEN
        SELECT entID AS outID, 1 AS exitCode; -- user is not the owner.
        LEAVE proc;
    END IF;

    UPDATE Entities
    SET creator_id = 0, is_private = 0, editable_until = NULL
    WHERE id = entID;

    SELECT entID AS outID, 0 AS exitCode; -- edit.
END proc; END //
DELIMITER ;










-- BEGIN proc: BEGIN
--     DECLARE outID, exitCode BIGINT UNSIGNED;
--     DECLARE defKey VARBINARY(700);

--     IF NOT (
--         (userID != 0 OR NOT isEditable) AND
--         (NOT insertSK OR NOT isEditable)
--     ) THEN
--         SET exitCode = 2; -- wrong combination is boolean values.
--         SET outID = 0;
--         SELECT outID, exitCode;
--         LEAVE proc;
--     END IF;

--     IF (insertSK) THEN
--         SET defKey = SHA2(defStr, 256);

--         SELECT ent_id INTO outID
--         FROM EntitySecKeys
--         WHERE (
--             type_ident = type AND
--             def_key = defKey
--         );
--         IF (outID IS NOT NULL) THEN
--             SET exitCode = 1; -- find.
--             SELECT outID, exitCode;
--             LEAVE proc;
--         END IF;
--     END IF;

--     INSERT INTO Entities (
--         creator_id,
--         type_ident, def_str, is_private, is_editable
--     )
--     VALUES (
--         CASE WHEN (isAnonymous) THEN 0 ELSE userID END,
--         type, defStr, isPrivate, isEditable
--     );
--     SET outID = LAST_INSERT_ID();
--     SET exitCode = 0; -- insert.

--     IF (insertSK) THEN
--         INSERT IGNORE INTO EntitySecKeys (
--             def_key, ent_id
--         )
--         VALUES (
--             defKey, outID
--         );
--         IF (ROW_COUNT() <= 0) THEN
--             SELECT ent_id INTO outID
--             FROM EntitySecKeys
--             WHERE def_key = defKey;
--             IF (outID IS NOT NULL) THEN
--                 SET exitCode = 1; -- find.
--                 SELECT outID, exitCode;
--                 LEAVE proc;
--             END IF;
--         ELSE

--             INSERT IGNORE INTO EntitySecKeys (
--                 def_key, ent_id
--             )
--             VALUES (
--                 defKey, outID
--             );
--         END IF;
--     END IF;

--     SELECT outID, exitCode;
-- END proc; END //
-- DELIMITER ;




-- DELIMITER //
-- CREATE PROCEDURE editOrFindEntity (
--     IN userID BIGINT UNSIGNED,
--     IN entID BIGINT UNSIGNED,
--     IN datatype CHAR,
--     IN defStr BLOB,
--     IN isPrivate BOOL,
--     IN isEditable BOOL,
--     IN isAnonymous BOOL,
--     IN insertSK BOOL
-- )
-- BEGIN proc: BEGIN
--     DECLARE outID, exitCode, prevCreatorID BIGINT UNSIGNED;
--     DECLARE prevIsPrivate, prevIsEditable BOOL;
--     DECLARE defKey VARCHAR(700);

--     SELECT is_private, is_editable, creator_id
--     INTO prevIsPrivate, prevIsEditable, prevCreatorID
--     FROM Entities
--     WHERE id = entID;
--     IF (prevCreatorID != userID OR NOT prevIsEditable) THEN
--         SET exitCode = 3; -- entity does not exist, or user does not have the
--         -- rights to edit it.
--         SET outID = 0;
--         SELECT outID, exitCode;
--         LEAVE proc;
--     END IF;

--     -- Start a transaction and repeat the same select statement, but with a
--     -- locking read (i.e. SELECT ... FOR UPDATE).
--     START TRANSACTION;
--     SELECT is_private, is_editable, creator_id
--     INTO prevIsPrivate, prevIsEditable, prevCreatorID
--     FROM Entities
--     WHERE id = entID
--     FOR UPDATE;
--     IF NOT (prevCreatorID <=> userID AND prevIsEditable) THEN
--         ROLLBACK;
--         SET exitCode = 3; -- entity does not exist, or user does not have the
--         -- rights to edit it.
--         SET outID = 0;
--         SELECT outID, exitCode;
--         LEAVE proc;
--     END IF;

--     IF NOT (
--         (NOT isPrivate OR userID != 0 AND isEditable) AND
--         (userID != 0 OR NOT isEditable) AND
--         (NOT insertSK OR NOT isEditable) AND
--         (prevIsPrivate OR NOT isPrivate)
--     ) THEN
--         ROLLBACK;
--         SET exitCode = 2; -- wrong combination is boolean values.
--         SET outID = 0;
--         SELECT outID, exitCode;
--         LEAVE proc;
--     END IF;


--     IF (insertSK) THEN
--         SET defKey = SHA2(CONCAT(datatype, ".", defStr), 256);

--         SELECT ent_id INTO outID
--         FROM EntitySecKeys
--         WHERE def_key = defKey;
--         IF (outID IS NOT NULL) THEN
--             SET exitCode = 1; -- find.
--             SELECT outID, exitCode;
--             LEAVE proc;
--         END IF;
--     END IF;

--     UPDATE Entities
--     SET
--         creator_id = CASE WHEN (isAnonymous) THEN 0 ELSE userID END,
--         type_ident = datatype,
--         def_str = defStr,
--         is_private = isPrivate,
--         is_editable = isEditable
--     WHERE id = entID;

--     SET outID = entID;
--     SET exitCode = 0; -- insert.

--     IF (insertSK) THEN
--         INSERT IGNORE INTO EntitySecKeys (
--             def_key, ent_id
--         )
--         VALUES (
--             defKey, outID
--         );
--         IF (ROW_COUNT() <= 0) THEN
--             SELECT ent_id INTO outID
--             FROM EntitySecKeys
--             WHERE def_key = defKey;
--             IF (outID IS NOT NULL) THEN
--                 SET exitCode = 1; -- find.
--                 SELECT outID, exitCode;
--                 LEAVE proc;
--             END IF;
--         END IF;
--     END IF;

--     COMMIT; 
--     SELECT outID, exitCode;
-- END proc; END //
-- DELIMITER ;
