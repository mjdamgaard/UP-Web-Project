
SELECT "Input procedures";

DROP PROCEDURE insertOrUpdateRating;

DROP PROCEDURE insertOrFindEntity;
DROP PROCEDURE insertOrFindAnonymousEntity;
DROP PROCEDURE publicizeEntity;






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
    IN isPublic BOOL
)
BEGIN proc: BEGIN
    DECLARE outID, exitCode BIGINT UNSIGNED;

    INSERT IGNORE INTO Entities (creator_id, def_str, is_public)
    VALUES (userID, defStr, isPublic);
    IF (ROW_COUNT() > 0) THEN
        SET exitCode = 0; -- insert.
        SELECT LAST_INSERT_ID() INTO outID;
    ELSE
        SET exitCode = 1; -- find.
        SELECT id INTO outID
        FROM Entities
        WHERE (
            is_public = isPublic AND
            def_hash = SHA2(defStr, 256) AND
            creator_id = userID
        );
    END IF;

    SELECT outID, exitCode;
END proc; END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertOrFindAnonymousEntity (
    IN defStr TEXT
)
BEGIN proc: BEGIN
    DECLARE outID, exitCode BIGINT UNSIGNED;

    INSERT IGNORE INTO Entities (creator_id, def_str, is_public)
    VALUES (0, defStr, 1);
    IF (ROW_COUNT() > 0) THEN
        SET exitCode = 0; -- insert.
        SELECT LAST_INSERT_ID() INTO outID;
    ELSE
        SET exitCode = 1; -- find.
        SELECT id INTO outID
        FROM Entities
        WHERE (
            is_public = 1 AND
            def_hash = SHA2(defStr, 256) AND
            creator_id = 0
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
    SET is_public = 1
    WHERE (id = entID AND creator_id = userID);

    SELECT entID AS outID, 0 AS exitCode;
END //
DELIMITER ;



-- DELIMITER //
-- CREATE PROCEDURE reserveNewEntityIDInterval (
--     IN userID BIGINT UNSIGNED,
--     IN intervalKey BIGINT UNSIGNED,
--     IN len TINYINT UNSIGNED
-- )
-- BEGIN proc: BEGIN
--     DECLARE outID, exitCode, lastHeadID, lastLen BIGINT UNSIGNED;
--     IF (len < 1) THEN
--         SET exitCode = 1; -- len < 1.
--         SELECT outID, exitCode;
--         LEAVE proc;
--     END IF;

--     -- Simply select the last allocated interval (works for now) in order to
--     -- get the next interval head at lastHeadID + interval_length.
--     SELECT head_id, interval_length INTO lastHeadID, lastLen
--     FROM EntityIDIntervals
--     ORDER BY head_id DESC
--     LIMIT 1;

--     SET outID = lastHeadID + lastLen;
--     INSERT INTO EntityIDIntervals (
--         head_id,
--         interval_length,
--         parent_head_id,
--         user_id,
--         interval_key
--     )
--     VALUES (
--         outID,
--         len,
--         1,
--         userID,
--         intervalKey
--     );

--     SELECT outID, code;
-- END proc; END //
-- DELIMITER ;



-- DELIMITER //
-- CREATE PROCEDURE insertReservedEntity (
--     IN userID BIGINT UNSIGNED,
--     IN code BINARY(32),
--     IN defStr TEXT,
--     IN recordCreator TINYINT
-- )
-- BEGIN
--     DECLARE outID, exitCode BIGINT UNSIGNED;
--     DECLARE codeHash CHAR(64) DEFAULT SHA2(code, 256);

--     SELECT id INTO outID
--     FROM Entities
--     WHERE (
--         def_str  = codeHash AND
--         def_hash = codeHash
--     );

--     IF (outID IS NULL) THEN
--         SET exitCode = 2; -- no reservation.
--     ELSE
--         UPDATE IGNORE Entities
--         SET
--             def_str = defStr,
--             creator_id = IF(recordCreator, userID, 0)
--         WHERE id = outID;

--         IF (ROW_COUNT() > 0) THEN
--             SET exitCode = 0; -- insert.
--         ELSE
--             SET exitCode = 1; -- find.
--             SELECT id INTO outID
--             FROM Entities
--             WHERE def_hash = SHA2(def, 256);
--         END IF;
--     END IF;

--     SELECT outID, exitCode;
-- END //
-- DELIMITER ;









-- TODO: There seems to be a bug which can cause a deadlock: "Uncaught
-- mysqli_sql_exception: Deadlock found when trying to get lock; try
-- restarting transaction in /var/www/src/php/db_io/DBConnector.php:30"
-- when a rating deletion request is sent twice at the same time.