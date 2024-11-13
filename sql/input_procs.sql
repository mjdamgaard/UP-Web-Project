
SELECT "Input procedures";

DROP PROCEDURE insertOrUpdateScore;
DROP PROCEDURE deleteScore;

DROP PROCEDURE insertOrFindEntity;
DROP PROCEDURE editOrFindEntity;






DELIMITER //
CREATE PROCEDURE insertOrUpdateScore (
    IN userID BIGINT UNSIGNED,
    IN scaleID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN scoreVal FLOAT
)
BEGIN
    INSERT INTO Scores (user_id, scale_id, subj_id, score_val)
    VALUES (userID, scaleID, subjID, scoreVal)
    ON DUPLICATE KEY UPDATE score_val = scoreVal;

    -- -- TODO: Run bots on scheduled events instead.
    -- CALL runBots ();

    SELECT subjID AS outID, 0 AS exitCode;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE deleteScore (
    IN userID BIGINT UNSIGNED,
    IN scaleID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED
)
BEGIN
    DELETE FROM Scores
    WHERE (
        user_id = userID AND
        scale_id = scaleID AND
        subj_id = subjID
    );

    -- -- TODO: Run bots on scheduled events instead.
    -- CALL runBots ();

    SELECT subjID AS outID, 0 AS exitCode;
END //
DELIMITER ;










DELIMITER //
CREATE PROCEDURE insertOrFindEntity (
    IN userID BIGINT UNSIGNED,
    IN type CHAR,
    IN defStr TEXT,
    IN isPrivate BOOL,
    IN isEditable BOOL,
    IN isAnonymous BOOL,
    IN insertHash BOOL
)
BEGIN proc: BEGIN
    DECLARE outID, exitCode BIGINT UNSIGNED;
    DECLARE defHash CHAR(64);
    -- SET autocommit = 0;

    IF NOT (
        (NOT isPrivate OR userID != 0 AND isEditable) AND
        (userID != 0 OR NOT isEditable) AND
        (NOT insertHash OR NOT isEditable)
    ) THEN
        SET exitCode = 2; -- wrong combination is boolean values.
        SET outID = 0;
        SELECT outID, exitCode;
        LEAVE proc;
    END IF;

    IF (insertHash) THEN
        SET defHash = SHA2(CONCAT(type, defStr), 256);

        SELECT ent_id INTO outID
        FROM EntityHashes
        WHERE def_hash = defHash
        FOR UPDATE;

        IF (outID IS NOT NULL) THEN
            SET exitCode = 1; -- find.
            SELECT outID, exitCode;
            LEAVE proc;
        END IF;
    END IF;

    INSERT INTO Entities (
        creator_id,
        type_ident, def_str, is_private, is_editable
    )
    VALUES (
        CASE WHEN (isAnonymous) THEN 0 ELSE userID END,
        type, defStr, isPrivate, isEditable
    );
    SET outID = LAST_INSERT_ID();
    SET exitCode = 0; -- insert.
    
    IF (insertHash) THEN
        INSERT INTO EntityHashes (
            def_hash, ent_id
        )
        VALUES (
            defHash, outID
        );
    END IF;

    SELECT outID, exitCode;
END proc; END //
DELIMITER ;






DELIMITER //
CREATE PROCEDURE editOrFindEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN type CHAR,
    IN defStr TEXT,
    IN isPrivate BOOL,
    IN isEditable BOOL,
    IN isAnonymous BOOL,
    IN insertHash BOOL
)
BEGIN proc: BEGIN
    DECLARE outID, exitCode, prevCreatorID BIGINT UNSIGNED;
    DECLARE prevIsPrivate, prevIsEditable BOOL;
    DECLARE defHash CHAR(64);

    SELECT is_private, is_editable, creator_id
    INTO prevIsPrivate, prevIsEditable, prevCreatorID
    FROM Entities
    WHERE id = entID;
    IF (prevCreatorID != userID OR NOT prevIsEditable) THEN
        SET exitCode = 3; -- entity does not exist, or user does not have the
        -- rights to edit it.
        SET outID = 0;
        SELECT outID, exitCode;
        LEAVE proc;
    END IF;

    -- Repeat the same select statement, but with a locking read (i.e.
    -- SELECT ... FOR UPDATE).
    SELECT is_private, is_editable, creator_id
    INTO prevIsPrivate, prevIsEditable, prevCreatorID
    FROM Entities
    WHERE id = entID
    FOR UPDATE;
    IF NOT (prevCreatorID <=> userID AND prevIsEditable) THEN
        SET exitCode = 3; -- entity does not exist, or user does not have the
        -- rights to edit it.
        SET outID = 0;
        SELECT outID, exitCode;
        LEAVE proc;
    END IF;

    IF NOT (
        (NOT isPrivate OR userID != 0 AND isEditable) AND
        (userID != 0 OR NOT isEditable) AND
        (NOT insertHash OR NOT isEditable) AND
        (prevIsPrivate OR NOT isPrivate)
    ) THEN
        SET exitCode = 2; -- wrong combination is boolean values.
        SET outID = 0;
        SELECT outID, exitCode;
        LEAVE proc;
    END IF;


    IF (insertHash) THEN
        SET defHash = SHA2(CONCAT(type, defStr), 256);

        SELECT ent_id INTO outID
        FROM EntityHashes
        WHERE def_hash = defHash;
        IF (outID IS NOT NULL) THEN
            SET exitCode = 1; -- find.
            SELECT outID, exitCode;
            LEAVE proc;
        END IF;

        -- If the hash does not already exist, repeat the same select statement
        -- but with a locking read (i.e. SELECT ... FOR UPDATE).
        SELECT ent_id INTO outID
        FROM EntityHashes
        WHERE def_hash = defHash
        FOR UPDATE;
        IF (outID IS NOT NULL) THEN
            SET exitCode = 1; -- find.
            SELECT outID, exitCode;
            LEAVE proc;
        END IF;
    END IF;

    UPDATE Entities
    SET
        creator_id = CASE WHEN (isAnonymous) THEN 0 ELSE userID END,
        type_ident = type,
        def_str = defStr,
        is_private = isPrivate,
        is_editable = isEditable
    WHERE id = entID;

    SET outID = entID;
    SET exitCode = 0; -- insert.
    
    IF (insertHash) THEN
        INSERT INTO EntityHashes (
            def_hash, ent_id
        )
        VALUES (
            defHash, outID
        );
    END IF;

    SELECT outID, exitCode;
END proc; END //
DELIMITER ;
















-- TODO: There seems to be a bug which can cause a deadlock: "Uncaught
-- mysqli_sql_exception: Deadlock found when trying to get lock; try
-- restarting transaction in /var/www/src/php/db_io/DBConnector.php:30"
-- when a rating deletion request is sent twice at the same time.