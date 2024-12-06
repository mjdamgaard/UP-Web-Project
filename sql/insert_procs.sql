
SELECT "Insert procedures";

DROP PROCEDURE insertOrUpdateOpinionScore;
DROP PROCEDURE deleteOpinionScore;
DROP PROCEDURE insertOrUpdatePrivateScore;
DROP PROCEDURE deletePrivateScore;

DROP PROCEDURE insertOrFindFunctionEntity;
DROP PROCEDURE insertOrFindFunctionCallEntity;
DROP PROCEDURE insertOrFindAttributeDefinedEntity;
DROP PROCEDURE editAttributeDefinedEntity;
DROP PROCEDURE _insertTextDataEntity;
DROP PROCEDURE insertUTF8Entity;
DROP PROCEDURE insertHTMLEntity;
DROP PROCEDURE insertJSONEntity;
DROP PROCEDURE _editTextDataEntity;
DROP PROCEDURE editUTF8Entity;
DROP PROCEDURE editHTMLEntity;
DROP PROCEDURE editJSONEntity;
DROP PROCEDURE anonymizeEntity;





DELIMITER //
CREATE PROCEDURE insertOrUpdateOpinionScore (
    IN userID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN scoreVal FLOAT,
    IN scoreWidth FLOAT
)
BEGIN proc: BEGIN
    -- Exit if the subject entity does not exist.
    IF ((SELECT type_ident FROM Entities WHERE id = subjID) IS NULL) THEN
        SELECT subjID AS outID, 1 AS exitCode; -- subject does not exist.
        LEAVE proc;
    END IF;

    INSERT INTO UserOpinionScores (
        user_id, qual_id, subj_id, score_val, score_width
    )
    VALUES (
        userID, qualID, subjID, scoreVal, scoreWidth
    )
    ON DUPLICATE KEY UPDATE score_val = scoreVal, score_width = scoreWidth;

    SELECT subjID AS outID, 0 AS exitCode; -- inserted or updated.
END proc; END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteOpinionScore (
    IN userID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED
)
BEGIN proc: BEGIN
    DELETE FROM UserOpinionScores
    WHERE (
        user_id <=> userID AND
        qual_id <=> qualID AND
        subj_id <=> subjID
    );

    SELECT subjID AS outID, 0 AS exitCode; -- deleted if there.
END proc; END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertOrUpdatePrivateScore (
    IN userID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN scoreVal FLOAT
)
BEGIN proc: BEGIN
    -- Exit if the subject entity does not exist.
    IF ((SELECT type_ident FROM Entities WHERE id = subjID) IS NULL) THEN
        SELECT subjID AS outID, 1 AS exitCode; -- subject does not exist.
        LEAVE proc;
    END IF;

    INSERT INTO PrivateScores (
        user_id, qual_id, subj_id, score_val
    )
    VALUES (
        userID, qualID, subjID, scoreVal
    )
    ON DUPLICATE KEY UPDATE score_val = scoreVal;

    SELECT subjID AS outID, 0 AS exitCode; -- insert or update.
END proc; END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deletePrivateScore (
    IN userID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED
)
BEGIN proc: BEGIN
    DELETE FROM PrivateScores
    WHERE (
        user_id <=> userID AND
        qual_id <=> qualID AND
        subj_id <=> subjID
    );

    SELECT subjID AS outID, 0 AS exitCode; -- deleted if there.
END proc; END //
DELIMITER ;













DELIMITER //
CREATE PROCEDURE insertOrFindFunctionEntity (
    IN userID BIGINT UNSIGNED,
    IN defStr VARCHAR(700) CHARACTER SET utf8mb4,
    IN isAnonymous BOOL
)
BEGIN proc: BEGIN
    DECLARE outID BIGINT UNSIGNED;

    DECLARE EXIT HANDLER FOR SQLSTATE '40001'
    BEGIN
        ROLLBACK;
        SELECT NULL AS outID, 2 AS exitCode; -- rollback due to deadlock.
    END;

    START TRANSACTION;

    SELECT ent_id INTO outID
    FROM EntitySecKeys
    WHERE (
        type_ident = "f" AND
        def_key = defStr
    )
    FOR UPDATE;

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
        "f", defStr, 0, NULL
    );
    SET outID = LAST_INSERT_ID();

    INSERT INTO EntitySecKeys (
        type_ident, def_key, ent_id
    )
    VALUES (
        "f", defStr, outID
    );

    COMMIT;

    SELECT outID, 0 AS exitCode; -- insert.
END proc; END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE insertOrFindFunctionCallEntity (
    IN userID BIGINT UNSIGNED,
    IN defStr VARCHAR(700) CHARACTER SET utf8mb4,
    IN isAnonymous BOOL
)
BEGIN proc: BEGIN
    DECLARE outID BIGINT UNSIGNED;

    DECLARE EXIT HANDLER FOR SQLSTATE '40001'
    BEGIN
        ROLLBACK;
        SELECT NULL AS outID, 2 AS exitCode; -- rollback due to deadlock.
    END;

    START TRANSACTION;

    SELECT ent_id INTO outID
    FROM EntitySecKeys
    WHERE (
        type_ident = "c" AND
        def_key = defStr
    )
    FOR UPDATE;

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
        "c", defStr, 0, NULL
    );
    SET outID = LAST_INSERT_ID();

    INSERT INTO EntitySecKeys (
        type_ident, def_key, ent_id
    )
    VALUES (
        "c", defStr, outID
    );

    COMMIT;

    SELECT outID, 0 AS exitCode; -- insert.
END proc; END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertOrFindAttributeDefinedEntity (
    IN userID BIGINT UNSIGNED,
    IN defStr VARCHAR(700) CHARACTER SET utf8mb4,
    IN isAnonymous BOOL,
    IN daysLeftOfEditing INT
)
BEGIN proc: BEGIN
    DECLARE outID BIGINT UNSIGNED;

    DECLARE EXIT HANDLER FOR SQLSTATE '40001'
    BEGIN
        ROLLBACK;
        SELECT NULL AS outID, 2 AS exitCode; -- rollback due to deadlock.
    END;

    IF (isAnonymous OR daysLeftOfEditing <= 0) THEN
        SET daysLeftOfEditing = NULL;
    END IF;

    START TRANSACTION;

    SELECT ent_id INTO outID
    FROM EntitySecKeys
    WHERE (
        type_ident = "a" AND
        def_key = defStr
    )
    FOR UPDATE;

    IF (outID IS NOT NULL) THEN
        ROLLBACK;
        SELECT outID, 1 AS exitCode; -- find.
        LEAVE proc;
    END IF;

    INSERT INTO Entities (
        creator_id,
        type_ident, def_str, is_private,
        editable_until
    )
    VALUES (
        CASE WHEN (isAnonymous) THEN 0 ELSE userID END,
        "a", defStr, 0,
        ADDDATE(CURDATE(), INTERVAL daysLeftOfEditing DAY)
    );
    SET outID = LAST_INSERT_ID();

    INSERT INTO EntitySecKeys (
        type_ident, def_key, ent_id
    )
    VALUES (
        "a", defStr, outID
    );

    COMMIT;

    SELECT outID, 0 AS exitCode; -- insert.
END proc; END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE editAttributeDefinedEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN defStr VARCHAR(700) CHARACTER SET utf8mb4,
    IN isAnonymous BOOL,
    IN daysLeftOfEditing INT
)
BEGIN proc: BEGIN
    DECLARE outID, creatorID BIGINT UNSIGNED;
    DECLARE prevEditableUntil DATE;
    DECLARE prevDefStr VARCHAR(700);
    DECLARE prevType CHAR;

    DECLARE EXIT HANDLER FOR SQLSTATE '40001'
    BEGIN
        ROLLBACK;
        SELECT NULL AS outID, 4 AS exitCode; -- rollback due to deadlock.
    END;

    IF (isAnonymous OR daysLeftOfEditing <= 0) THEN
        SET daysLeftOfEditing = NULL;
    END IF;

    SELECT creator_id, editable_until, def_str, type_ident
    INTO creatorID, prevEditableUntil, prevDefStr, prevType
    FROM Entities
    WHERE id = entID;

    IF (creatorID != userID) THEN
        SELECT entID AS outID, 1 AS exitCode; -- user is not the owner.
        LEAVE proc;
    END IF;

    IF (prevEditableUntil IS NULL OR prevEditableUntil > CURDATE()) THEN
        SELECT entID AS outID, 2 AS exitCode; -- can no longer be edited.
        LEAVE proc;
    END IF;

    IF (prevType != "a") THEN
        SELECT entID AS outID, 3 AS exitCode; -- changing datatype not impl.
        LEAVE proc;
    END IF;

    IF (prevDefStr <=> defStr) THEN
        UPDATE Entities
        SET
            creator_id = CASE WHEN (isAnonymous) THEN 0 ELSE userID END,
            editable_until = ADDDATE(CURDATE(), INTERVAL daysLeftOfEditing DAY)
        WHERE id = entID;
        SELECT entID AS outID, 0 AS exitCode; -- edit.
    END IF;


    START TRANSACTION;

    SELECT ent_id INTO outID
    FROM EntitySecKeys
    WHERE (
        type_ident = "a" AND
        def_key = defStr
    )
    FOR UPDATE;

    IF (outID IS NOT NULL) THEN
        ROLLBACK;
        SELECT outID, 1 AS exitCode; -- find.
        LEAVE proc;
    END IF;


    UPDATE Entities
    SET
        creator_id = CASE WHEN (isAnonymous) THEN 0 ELSE userID END,
        def_str = defStr,
        editable_until = ADDDATE(CURDATE(), INTERVAL daysLeftOfEditing DAY)
    WHERE id = entID;

    UPDATE EntitySecKeys
    SET def_key = defStr
    WHERE (
        type_ident = "a" AND
        def_key = prevDefStr
    );

    COMMIT;

    SELECT entID AS outID, 0 AS exitCode; -- edit.
END proc; END //
DELIMITER ;








DELIMITER //
CREATE PROCEDURE _insertTextDataEntity (
    IN datatype CHAR,
    IN userID BIGINT UNSIGNED,
    IN defStr LONGTEXT CHARACTER SET utf8mb4,
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
    IF (isAnonymous OR daysLeftOfEditing <= 0) THEN
        SET daysLeftOfEditing = NULL;
    END IF;

    INSERT INTO Entities (
        creator_id,
        type_ident, def_str, is_private,
        editable_until
    )
    VALUES (
        CASE WHEN (isAnonymous) THEN 0 ELSE userID END,
        datatype, defStr, isPrivate,
        ADDDATE(CURDATE(), INTERVAL daysLeftOfEditing DAY)
    );
    SET outID = LAST_INSERT_ID();

    SELECT outID, 0 AS exitCode; -- insert.
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
    CALL _insertTextDataEntity (
        "u",
        userID, defStr, isPrivate, isAnonymous, daysLeftOfEditing
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
    CALL _insertTextDataEntity (
        "h",
        userID, defStr, isPrivate, isAnonymous, daysLeftOfEditing
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
    CALL _insertTextDataEntity (
        "j",
        userID, defStr, isPrivate, isAnonymous, daysLeftOfEditing
    );
END //
DELIMITER ;










DELIMITER //
CREATE PROCEDURE _editTextDataEntity (
    IN datatype CHAR,
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN defStr LONGTEXT CHARACTER SET utf8mb4,
    IN isPrivate BOOL,
    IN isAnonymous BOOL,
    IN daysLeftOfEditing INT
)
BEGIN proc: BEGIN
    DECLARE creatorID BIGINT UNSIGNED;
    DECLARE prevIsPrivate TINYINT UNSIGNED;
    DECLARE prevEditableUntil DATE;
    DECLARE prevType CHAR;

    IF (isPrivate) THEN
        SET isAnonymous = 0;
        SET daysLeftOfEditing = NULL;
    END IF;
    IF (isAnonymous OR daysLeftOfEditing <= 0) THEN
        SET daysLeftOfEditing = NULL;
    END IF;

    SELECT creator_id, is_private, editable_until, type_ident
    INTO creatorID, prevIsPrivate, prevEditableUntil, prevType
    FROM Entities
    WHERE id = entID;

    IF (creatorID != userID) THEN
        SELECT entID AS outID, 1 AS exitCode; -- user is not the owner.
        LEAVE proc;
    END IF;

    IF (
        NOT prevIsPrivate AND
        (prevEditableUntil IS NULL OR prevEditableUntil > CURDATE())
    ) THEN
        SELECT entID AS outID, 2 AS exitCode; -- can no longer be edited.
        LEAVE proc;
    END IF;

    IF (prevType != datatype) THEN
        SELECT entID AS outID, 3 AS exitCode; -- changing datatype not impl.
        LEAVE proc;
    END IF;

    UPDATE Entities
    SET
        creator_id = CASE WHEN (isAnonymous) THEN 0 ELSE userID END,
        def_str = defStr,
        is_private = isPrivate,
        editable_until = ADDDATE(CURDATE(), INTERVAL daysLeftOfEditing DAY)
    WHERE id = entID;

    SELECT entID AS outID, 0 AS exitCode; -- edit.
END proc; END //
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
    CALL _editTextDataEntity (
        "u",
        userID, entID, defStr, isPrivate, isAnonymous, daysLeftOfEditing
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
    CALL _editTextDataEntity (
        "h",
        userID, entID, defStr, isPrivate, isAnonymous, daysLeftOfEditing
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
    CALL _editTextDataEntity (
        "j",
        userID, entID, defStr, isPrivate, isAnonymous, daysLeftOfEditing
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
