
SELECT "Input procedures";

DROP PROCEDURE insertOrUpdateRating;

DROP PROCEDURE insertOrFindEntity;
-- DROP PROCEDURE reserveEntityID;
-- DROP PROCEDURE insertReservedEntity;






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
    IF (mysql_affected_rows() > 0) THEN
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
    IN def TEXT
)
BEGIN
    DECLARE outID, exitCode BIGINT UNSIGNED;

    INSERT IGNORE INTO Entities (
        def_str, creator_id
    )
    VALUES (
        def, userID
    );
    IF (mysql_affected_rows() > 0) THEN
        SET exitCode = 0; -- insert.
        SELECT LAST_INSERT_ID() INTO outID;
    ELSE
        SET exitCode = 1; -- find.
        SELECT id INTO outID
        FROM Entities
        WHERE def_hash = SHA2(def, 256);
    END IF;

    SELECT outID, exitCode;
END //
DELIMITER ;






-- DELIMITER //
-- CREATE PROCEDURE reserveEntityID ()
-- BEGIN
--     DECLARE outID BIGINT UNSIGNED;
--     DECLARE code BINARY(32) DEFAULT RANDOM_BYTES(32);
--     DECLARE codeHash CHAR(64) DEFAULT SHA2(code, 256);

--     INSERT IGNORE INTO Entities (
--         def_str, def_hash
--     )
--     VALUES (
--         codeHash, codeHash
--     );
--     SELECT LAST_INSERT_ID() INTO outID;

--     SELECT outID, code;
-- END //
-- DELIMITER ;



-- DELIMITER //
-- CREATE PROCEDURE insertReservedEntity (
--     IN userID BIGINT UNSIGNED,
--     IN code BINARY(32),
--     IN def TEXT,
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
--             def_str = def,
--             creator_id = IF(recordCreator, userID, 0)
--         WHERE id = outID;

--         IF (mysql_affected_rows() > 0) THEN
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