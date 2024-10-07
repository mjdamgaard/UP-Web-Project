
SELECT "Input procedures";

DROP PROCEDURE insertOrUpdateRating;

DROP PROCEDURE insertOrFindEntity;
DROP PROCEDURE insertOrFindAnonymousEntity;
DROP PROCEDURE publicizeEntity;
DROP PROCEDURE privatizeEntity;
DROP PROCEDURE editEntity;
DROP PROCEDURE editEntityIdentifier;






DELIMITER //
CREATE PROCEDURE insertOrUpdateRating (
    IN userID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN tagID BIGINT UNSIGNED,
    IN objID BIGINT UNSIGNED,
    IN encodedRatVal SMALLINT UNSIGNED
)
BEGIN proc: BEGIN
    DECLARE exitCode TINYINT UNSIGNED DEFAULT 0;
    DECLARE ratVal, prevRatVal TINYINT UNSIGNED;
    DECLARE stmtID, stmtDataKey BIGINT UNSIGNED;

    -- Get or create the statement entity.
    INSERT IGNORE INTO StatementData (tag_id, obj_id)
    VALUES (tagID, objID);
    IF (ROW_COUNT() > 0) THEN
        SELECT LAST_INSERT_ID() INTO stmtDataKey;
        INSERT INTO Entities (data_type, data_key, creator_id)
        VALUES ('m', stmtDataKey, userID);
        SELECT LAST_INSERT_ID() INTO stmtID;
    ELSE
        SELECT data_key INTO stmtDataKey
        FROM StatementData
        WHERE (
            tag_id = tagID AND
            obj_id = objID
        );
        SELECT id INTO stmtID
        FROM Entities
        WHERE (
            data_type = 'm' AND
            data_key = stmtDataKey
        );
    END IF;

    -- If encodedRatVal > 256, delete the rating stored in SemanticInputs, and
    -- add the rating deletion as a record in RecordedInputs (without deleting
    -- the previous rating there, as this should be done via another procedure).
    IF (encodedRatVal > 256) THEN
        DELETE FROM SemanticInputs
        WHERE (
            user_id = userID AND
            tag_id = tagID AND
            obj_id = objID
        );
        INSERT INTO RecordedInputs (
            user_id,
            stmt_id,
            rat_val
        )
        VALUES (
            userID,
            stmtID,
            300 -- just a number larger than 256 meaning 'deletion.'
        );
    ELSE
        SET ratVal = encodedRatVal;

        -- Get the previous rating value (might be null).
        SELECT rat_val INTO prevRatVal
        FROM SemanticInputs
        WHERE (
            user_id = userID AND
            tag_id = tagID AND
            obj_id = objID
        );
        -- If prevRatVal is the same as before, set exitCode = 1 and do nothing
        -- further.
        IF (prevRatVal <=> ratVal) THEN
            SET exitCode = 1; -- Rating is the same value as before.
        ELSE
            -- Else insert the rating into SemanticInputs, as well as into
            -- RecordedInputs.
            REPLACE INTO SemanticInputs (
                user_id,
                tag_id,
                rat_val,
                obj_id
            )
            VALUES (
                userID,
                tagID,
                ratVal,
                objID
            );
            INSERT INTO RecordedInputs (
                user_id,
                stmt_id,
                rat_val
            )
            VALUES (
                userID,
                stmtID,
                ratVal
            );
        END IF;
    END IF;


    -- TODO: Run bots on scheduled events instead.
    CALL runBots ();

    SELECT stmtID AS outID, exitCode;
END proc; END //
DELIMITER ;











DELIMITER //
CREATE PROCEDURE insertOrFindEntity (
    IN userID BIGINT UNSIGNED,
    IN defStr TEXT,
    IN isPrivate BOOL,
    IN ident VARBINARY(255)
)
BEGIN
    DECLARE outID, exitCode BIGINT UNSIGNED;
    DECLARE defHash CHAR(64) DEFAULT (SHA2(defStr, 256));

    INSERT IGNORE INTO Entities (
        creator_id, def_str, def_hash, is_private, creation_ident
    )
    VALUES (
        userID, defStr, defHash, isPrivate, ident
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
    IN defStr TEXT
)
BEGIN
    DECLARE outID, exitCode BIGINT UNSIGNED;
    DECLARE defHash CHAR(64) DEFAULT (SHA2(defStr, 256));

    INSERT IGNORE INTO Entities (creator_id, def_str, def_hash, is_private)
    VALUES (0, defStr, defHash, 0);
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
    IN defStr TEXT
)
BEGIN
    DECLARE outID, exitCode BIGINT UNSIGNED;
    DECLARE defHash CHAR(64) DEFAULT (SHA2(defStr, 256));

    UPDATE IGNORE Entities
    SET def_str = defStr, def_hash = defHash
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