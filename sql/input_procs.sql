
SELECT "Input procedures";

DROP PROCEDURE insertOrUpdateScore;
DROP PROCEDURE deleteScore;

DROP PROCEDURE insertOrFindEntity;
DROP PROCEDURE insertOrFindAnonymousEntity;
DROP PROCEDURE publicizeEntity;
DROP PROCEDURE privatizeEntity;
DROP PROCEDURE editEntity;
DROP PROCEDURE editEntityIdentifier;






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
    IN ident VARBINARY(255)
)
BEGIN
    DECLARE outID, exitCode BIGINT UNSIGNED;
    DECLARE defHash CHAR(64) DEFAULT (SHA2(CONCAT(type, defStr), 256));

    INSERT IGNORE INTO Entities (
        creator_id, type_ident, def_str, def_hash, is_private, creation_ident
    )
    VALUES (
        userID, type, defStr, defHash, isPrivate, ident
    );
    IF (ROW_COUNT() > 0) THEN
        SET exitCode = 0; -- insert.
        SELECT LAST_INSERT_ID() INTO outID;
    ELSE
        SET exitCode = 1; -- find.
        SELECT id INTO outID
        FROM Entities
        WHERE (
            is_private = isPrivate AND
            def_hash = defHash AND
            creator_id = userID
        );
    END IF;

    SELECT outID, exitCode;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertOrFindAnonymousEntity (
    IN type CHAR,
    IN defStr TEXT
)
BEGIN
    DECLARE outID, exitCode BIGINT UNSIGNED;
    DECLARE defHash CHAR(64) DEFAULT (SHA2(CONCAT(type, defStr), 256));

    INSERT IGNORE INTO Entities (
        creator_id, type_ident, def_str, def_hash, is_private
    )
    VALUES (0, type, defStr, defHash, 0);
    IF (ROW_COUNT() > 0) THEN
        SET exitCode = 0; -- insert.
        SELECT LAST_INSERT_ID() INTO outID;
    ELSE
        SET exitCode = 1; -- find.
        SELECT id INTO outID
        FROM Entities
        WHERE (
            is_private = 0 AND
            def_hash = defHash AND
            creator_id = 0
        );
    END IF;

    SELECT outID, exitCode;
END //
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
    WHERE (id = entID AND creator_id = userID);
    IF (ROW_COUNT() > 0) THEN
        SET exitCode = 0; -- edit.
        SET outID = entID;
    ELSE
        SET exitCode = 1; -- collision.
        SELECT id INTO outID
        FROM Entities
        WHERE (
            is_private = (SELECT is_private FROM Entities WHERE id = entID) AND
            def_hash = defHash AND
            creator_id = userID
        );
    END IF;

    SELECT outID, exitCode;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE editEntityIdentifier (
    IN userID BIGINT UNSIGNED,
    IN entID BIGINT UNSIGNED,
    IN ident VARBINARY(255)
)
BEGIN
    UPDATE Entities
    SET creation_ident = ident
    WHERE (id = entID AND creator_id = userID);

    SELECT entID AS outID, 0 AS exitCode;
END //
DELIMITER ;













-- TODO: There seems to be a bug which can cause a deadlock: "Uncaught
-- mysqli_sql_exception: Deadlock found when trying to get lock; try
-- restarting transaction in /var/www/src/php/db_io/DBConnector.php:30"
-- when a rating deletion request is sent twice at the same time.