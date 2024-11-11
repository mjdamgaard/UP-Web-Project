
SELECT "Input procedures";

DROP PROCEDURE insertOrUpdateScore;
DROP PROCEDURE deleteScore;

DROP PROCEDURE insertEntity;
DROP PROCEDURE publicizeEntity;
DROP PROCEDURE privatizeEntity;
DROP PROCEDURE editEntity;






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
CREATE PROCEDURE insertEntity (
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
    DECLARE defHash CHAR(64); -- DEFAULT (SHA2(CONCAT(type, defStr), 256));

    IF NOT (
        (isPrivate <= 1 AND isEditable <= 1) AND
        (isPrivate = 0 OR userID != 0 AND isEditable = 1) AND
        (userID != 0 OR isEditable = 0) AND
        (NOT insertHash OR isEditable = 0)
    ) THEN
        SET exitCode = 2; -- wrong combination is boolean values.
        SET outID = NULL;
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
CREATE PROCEDURE publicizeEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED
)
BEGIN
    UPDATE Entities
    SET is_private = 0
    WHERE (id = entID AND creator_id = userID);

    SELECT entID AS outID, 0 AS exitCode;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE privatizeEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED
)
BEGIN
    UPDATE Entities
    SET is_private = 1
    WHERE (id = entID AND creator_id = userID);

    SELECT entID AS outID, 0 AS exitCode;
END //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE editEntity (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN type CHAR,
    IN defStr TEXT
)
BEGIN
    DECLARE outID, exitCode BIGINT UNSIGNED;
    DECLARE defHash CHAR(64) DEFAULT (SHA2(CONCAT(type, defStr), 256));

    UPDATE IGNORE Entities
    SET type_ident = type, def_str = defStr, def_hash = defHash
    WHERE (id = entID AND creator_id = userID AND is_editable = 1);
    IF (ROW_COUNT() > 0) THEN
        SET exitCode = 0; -- edit.
        SET outID = entID;
    ELSE
        SET exitCode = 1; -- collision or not editable.
        SELECT id INTO outID
        FROM Entities
        WHERE (
            is_private = (SELECT is_private FROM Entities WHERE id = entID) AND
            creator_id = userID AND
            def_hash = defHash
        );
    END IF;

    SELECT outID, exitCode;
END //
DELIMITER ;
















-- TODO: There seems to be a bug which can cause a deadlock: "Uncaught
-- mysqli_sql_exception: Deadlock found when trying to get lock; try
-- restarting transaction in /var/www/src/php/db_io/DBConnector.php:30"
-- when a rating deletion request is sent twice at the same time.