
SELECT "Input procedures";

DROP PROCEDURE insertOrUpdateRating;
DROP PROCEDURE private_insertOrUpdateRatingAndRunBots;

DROP PROCEDURE insertOrFindEntity;
DROP PROCEDURE insertText;
DROP PROCEDURE insertBinary;




DELIMITER //
CREATE PROCEDURE insertOrUpdateRating (
    IN userID BIGINT UNSIGNED,
    IN tagID BIGINT UNSIGNED,
    IN instID BIGINT UNSIGNED,
    IN ratVal SMALLINT UNSIGNED,
    IN liveAtTime BIGINT UNSIGNED
)
BEGIN
    DECLARE exitCode TINYINT;
    -- DECLARE now BIGINT UNSIGNED DEFAULT UNIX_TIMESTAMP();

    IF (liveAtTime > 0) THEN
        INSERT INTO Private_RecentInputs (
            user_id,
            tag_id,
            rat_val,
            inst_id,
            live_at_time
        )
        VALUES (
            userID,
            tagID,
            ratVal,
            instID,
            liveAtTime
        );
    ELSE
        CALL private_insertOrUpdateRatingAndRunBots (
            userID, tagID, instID, ratVal
        );
    END IF;
    SET exitCode = 0; -- Rating insert/update is done or is pending.

    SELECT instID AS outID, exitCode;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE private_insertOrUpdateRatingAndRunBots (
    IN userID BIGINT UNSIGNED,
    IN tagID BIGINT UNSIGNED,
    IN instID BIGINT UNSIGNED,
    IN ratVal SMALLINT UNSIGNED
)
BEGIN
    DECLARE stmtID BIGINT UNSIGNED;
    DECLARE stmtStr VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
    DEFAULT CONCAT(
        "#45.", instID, ".", tagID
    );
    DECLARE prevRatVal SMALLINT UNSIGNED;
    DECLARE now BIGINT UNSIGNED DEFAULT UNIX_TIMESTAMP();


    /* Retrieval of the previous rating the statement entity */

    -- Get the previous rating value (might be null).
    SELECT rat_val INTO prevRatVal
    FROM SemanticInputs
    WHERE (
        user_id = userID AND
        tag_id = tagID AND
        inst_id = instID
    );

    -- Get the statement entity.
    SELECT id INTO stmtID
    FROM Entities
    WHERE (
        def = stmtStr
    );
    -- If it does not exist, insert it and get the ID.
    IF (stmtID IS NULL) THEN
        INSERT IGNORE INTO Entities (def)
        VALUES (stmtStr);
        SELECT LAST_INSERT_ID() INTO stmtID;
        -- If a race condition means that the insert is ignored and stmtID
        -- is null, select the now added (by another process) Statement.
        IF (stmtID IS NULL) THEN
            SELECT id INTO stmtID
            FROM Entities
            WHERE (
                def = stmtStr
            );
        END IF;
        -- TODO: It seems that there still is a risk that stmtID is NULL at
        -- this point for simultaneous requests, despite all this. So
        -- investigate and fix (here and other places) at some point.
    END IF;


    /* Updating the user's own input set */

    -- If the input's rat_val is 0, delete the corresponding SemInput.
    IF (ratVal = 0) THEN
        DELETE FROM SemanticInputs
        WHERE (
            user_id = userID AND
            tag_id = tagID AND
            inst_id = instID
        );
    -- Else update the corresponding SemInput with the new rat_val.
    ELSE
        REPLACE INTO SemanticInputs (
            user_id,
            tag_id,
            rat_val,
            inst_id
        )
        VALUES (
            userID,
            tagID,
            ratVal,
            instID
        );
    END IF;


    /* Updating RecordedInputs */

    REPLACE INTO RecordedInputs (
        changed_at_time,
        user_id,
        tag_id,
        inst_id,
        rat_val
    )
    VALUES (
        now,
        userID,
        tagID,
        instID,
        ratVal
    );


    /* Run procedures to update the various aggregation bots */

    CALL updateStatementUserRaterBot (userID, stmtID, ratVal);
    CALL updateMeanBots (
        userID, tagID, instID, ratVal, prevRatVal, stmtID
    );

END //
DELIMITER ;









DELIMITER //
CREATE PROCEDURE insertOrFindEntity (
    IN userID BIGINT UNSIGNED,
    IN recordCreator BOOL,
    IN defStr VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
)
BEGIN proc: BEGIN
    DECLARE outID BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;

    -- Check if entity already exists and return its ID as outID if so.
    SELECT id INTO outID
    FROM Entities
    WHERE (
        def = defStr
    );
    IF (outID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
        SELECT outID, exitCode;
        LEAVE proc;
    END IF;

    INSERT IGNORE INTO Entities (def)
    VALUES (defStr);
    SELECT LAST_INSERT_ID() INTO outID;
    IF (outID IS NULL) THEN
        SELECT id INTO outID
        FROM Entities
        WHERE (
            def = defStr
        );
        SET exitCode = 1; -- find.
    ELSE
        IF (recordCreator) THEN
            CALL creatorRaterBot (outID, userID);
        END IF;
        SET exitCode = 0; -- insert.
    END IF;

    SELECT outID, exitCode;
END proc; END //
DELIMITER ;






-- TODO: Reimplement insertText() and insertBinary() to handle the case where
-- name already exists (and think about if.. Hm, if the name shouldn't just be
-- randomly generated (or, better, the same as the ID)...).


DELIMITER //
CREATE PROCEDURE insertText (
    IN userID BIGINT UNSIGNED,
    IN textStr TEXT
)
BEGIN
    DECLARE outID BIGINT UNSIGNED;

    INSERT INTO Texts (str)
    VALUES (textStr);
    SELECT LAST_INSERT_ID() INTO outID;

    SELECT outID, 0 AS exitCode; -- insert.
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE insertBinary (
    IN userID BIGINT UNSIGNED,
    IN binData LONGBLOB
)
BEGIN
    DECLARE outID BIGINT UNSIGNED;

    INSERT INTO Binaries (bin)
    VALUES (binData);
    SELECT LAST_INSERT_ID() INTO outID;
    
    SELECT outID, 0 AS exitCode; -- insert.
END //
DELIMITER ;




-- TODO: There seems to be a bug which can cause a deadlock: "Uncaught
-- mysqli_sql_exception: Deadlock found when trying to get lock; try
-- restarting transaction in /var/www/src/php/db_io/DBConnector.php:30"
-- when a rating deletion request is sent twice at the same time.