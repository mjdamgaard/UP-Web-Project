
SELECT "Insert procedures";

DROP PROCEDURE insertOrUpdateOpinionScore;
DROP PROCEDURE deleteOpinionScore;
DROP PROCEDURE insertOrUpdatePrivateScore;
DROP PROCEDURE deletePrivateScore;

DROP PROCEDURE _insertOrFindStringBasedEntity;
DROP PROCEDURE insertOrFindFunctionEntity;
DROP PROCEDURE insertOrFindFunctionCallEntity;
DROP PROCEDURE insertOrFindAttributeDefinedEntity;
DROP PROCEDURE _editOrFindStringBasedEntity;
DROP PROCEDURE editOrFindFunctionEntity;
DROP PROCEDURE editOrFindFunctionCallEntity;
DROP PROCEDURE editOrFindAttributeDefinedEntity;
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
proc: BEGIN
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
END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteOpinionScore (
    IN userID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED
)
proc: BEGIN
    DELETE FROM UserOpinionScores
    WHERE (
        user_id <=> userID AND
        qual_id <=> qualID AND
        subj_id <=> subjID
    );

    SELECT subjID AS outID, 0 AS exitCode; -- deleted if there.
END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertOrUpdatePrivateScore (
    IN userID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN scoreVal FLOAT
)
proc: BEGIN
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
END proc //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deletePrivateScore (
    IN userID BIGINT UNSIGNED,
    IN qualID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED
)
proc: BEGIN
    DELETE FROM PrivateScores
    WHERE (
        user_id <=> userID AND
        qual_id <=> qualID AND
        subj_id <=> subjID
    );

    SELECT subjID AS outID, 0 AS exitCode; -- deleted if there.
END proc //
DELIMITER ;













DELIMITER //
CREATE PROCEDURE _insertEntityWithoutSecKey (
    IN datatype CHAR,
    IN userID BIGINT UNSIGNED,
    IN defStr LONGTEXT CHARACTER SET utf8mb4,
    IN userWhitelistID BIGINT UNSIGNED,
    IN isAnonymous BOOL,
    IN isEditable BOOL
)
BEGIN
    DECLARE outID BIGINT UNSIGNED;

    IF (userWhitelistID = 0) THEN
        SET userWhitelistID = NULL;
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

    SELECT outID, 0 AS exitCode; -- insert.
END //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE _insertOrFindEntityWithSecKey (
    IN datatype CHAR,
    IN userID BIGINT UNSIGNED,
    IN defStr TEXT CHARACTER SET utf8mb4,
    IN isAnonymous BOOL
)
proc: BEGIN
    DECLARE outID BIGINT UNSIGNED;

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
            def_key = defStr
        );

        SELECT outID, 1 AS exitCode; -- find.
    END;

    START TRANSACTION;

    INSERT INTO Entities (
        creator_id,
        type_ident, def_str, is_editable
    )
    VALUES (
        CASE WHEN (isAnonymous) THEN 0 ELSE userID END,
        datatype, defStr, 0
    );
    SET outID = LAST_INSERT_ID();

    INSERT INTO EntitySecKeys (
        type_ident, def_key, ent_id
    )
    VALUES (
        datatype, defStr, outID
    );

    COMMIT;

    SELECT outID, 0 AS exitCode; -- insert.
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
        userID, defStr, userWhitelistID, isAnonymous, 0
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
        userID, defStr, userWhitelistID, isAnonymous, 0
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
        userID, defStr, isAnonymous, 0
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
        userID, defStr, userWhitelistID, isAnonymous, isEditable
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
        userID, defStr, userWhitelistID, isAnonymous, isEditable
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
        userID, defStr, userWhitelistID, isAnonymous, isEditable
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
    DECLARE creatorID BIGINT UNSIGNED;
    DECLARE prevIsEditable TINYINT UNSIGNED;
    DECLARE prevDefStr LONGTEXT;
    DECLARE prevType CHAR;

    IF (userWhitelistID = 0) THEN
        SET userWhitelistID = NULL;
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
CREATE PROCEDURE _substitutePlaceholdersInEntity (
    IN datatype CHAR,
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

    IF (userWhitelistID = 0) THEN
        SET userWhitelistID = NULL;
    END IF;

    SELECT type_ident, creator_id, def_str, is_editable
    INTO prevType, creatorID, prevDefStr, prevIsEditable 
    FROM Entities
    WHERE id = entID;

    IF (creatorID != userID) THEN
        SELECT entID AS outID, 2 AS exitCode; -- user is not the owner.
        LEAVE proc;
    END IF;

    IF (prevType != datatype) THEN
        SELECT entID AS outID, 4 AS exitCode; -- changing datatype not allowed.
        LEAVE proc;
    END IF;

    -- If all checks succeed, loop through all the paths and substitute any
    -- occurrences inside prevDefStr with the corresponding entIDs.
    SET newDefStr = prevDefStr;
    loop_label: LOOP

        LEAVE loop_label;
    END loop_label;

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
CREATE PROCEDURE editOrFindFunctionEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN defStr VARCHAR(700) CHARACTER SET utf8mb4,
    IN isAnonymous BOOL,
    IN daysLeftOfEditing INT
)
BEGIN
    CALL _editOrFindStringBasedEntity (
        "f",
        userID, entID, defStr, isAnonymous, daysLeftOfEditing
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE editOrFindFunctionCallEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN defStr VARCHAR(700) CHARACTER SET utf8mb4,
    IN isAnonymous BOOL,
    IN daysLeftOfEditing INT
)
BEGIN
    CALL _editOrFindStringBasedEntity (
        "c",
        userID, entID, defStr, isAnonymous, daysLeftOfEditing
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE editOrFindAttributeDefinedEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN defStr VARCHAR(700) CHARACTER SET utf8mb4,
    IN isAnonymous BOOL,
    IN daysLeftOfEditing INT
)
BEGIN
    CALL _editOrFindStringBasedEntity (
        "a",
        userID, entID, defStr, isAnonymous, daysLeftOfEditing
    );
END //
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
CREATE PROCEDURE _editTextDataEntity (
    IN datatype CHAR,
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN defStr LONGTEXT CHARACTER SET utf8mb4,
    IN isPrivate BOOL,
    IN isAnonymous BOOL,
    IN daysLeftOfEditing INT
)
proc: BEGIN
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
        SELECT entID AS outID, 2 AS exitCode; -- user is not the owner.
        LEAVE proc;
    END IF;

    IF (
        NOT prevIsPrivate AND
        (prevEditableUntil IS NULL OR prevEditableUntil < CURDATE())
    ) THEN
        SELECT entID AS outID, 3 AS exitCode; -- can no longer be edited.
        LEAVE proc;
    END IF;

    IF (prevType != datatype) THEN
        SELECT entID AS outID, 4 AS exitCode; -- changing datatype not impl.
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
END proc //
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
        "8",
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
proc: BEGIN
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
END proc //
DELIMITER ;










-- proc: BEGIN
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
-- END proc //
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
-- proc: BEGIN
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
-- END proc //
-- DELIMITER ;
