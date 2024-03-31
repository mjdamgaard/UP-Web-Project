
SELECT "Input procedures";

DROP PROCEDURE insertOrUpdateRating;
DROP PROCEDURE private_insertOrUpdateRatingAndRunBots;

DROP PROCEDURE insertOrFindString;
DROP PROCEDURE insertText;
DROP PROCEDURE insertBinary;




DELIMITER //
CREATE PROCEDURE insertOrUpdateRating (
    IN userID BIGINT UNSIGNED,
    IN entTypeID BIGINT UNSIGNED,
    IN tagID BIGINT UNSIGNED,
    IN entDefID BIGINT UNSIGNED,
    IN ratVal SMALLINT UNSIGNED,
    IN liveAtTime BIGINT UNSIGNED
)
BEGIN
    DECLARE exitCode TINYINT;
    -- DECLARE now BIGINT UNSIGNED DEFAULT UNIX_TIMESTAMP();

    IF (liveAtTime > 0) THEN
        INSERT INTO Private_RecentInputs (
            user_id,
            ent_type_id,
            tag_id,
            rat_val,
            ent_def_id,
            live_at_time
        )
        VALUES (
            userID,
            entTypeID,
            tagID,
            ratVal,
            entDefID,
            liveAtTime
        );
    ELSE
        CALL private_insertOrUpdateRatingAndRunBots (
            userID, entTypeID, tagID, entDefID, ratVal
        );
    END IF;
    SET exitCode = 0; -- Rating insert/update is done or is pending.

    SELECT entDefID AS outID, exitCode;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE private_insertOrUpdateRatingAndRunBots (
    IN userID BIGINT UNSIGNED,
    IN entTypeID BIGINT UNSIGNED,
    IN tagID BIGINT UNSIGNED,
    IN entDefID BIGINT UNSIGNED,
    IN ratVal SMALLINT UNSIGNED
)
BEGIN
    DECLARE stmtID BIGINT UNSIGNED;
    DECLARE stmtStr VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
    DEFAULT CONCAT(
        "@3[", tagID, "] fits @", entTypeID, "[", entDefID, "] as a ",
        "@2[", entTypeID, "]"
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
        ent_def_id = entDefID
    );

    -- Get the statement entity.
    SELECT id INTO stmtID
    FROM Strings
    WHERE (
        -- type_id = 75 AND
        -- cxt_id = 76 AND
        -- def_str = CONCAT("#", entDefID, "|#", tagID)
        str = stmtStr
    );
    -- If it does not exist, insert it and get the ID.
    IF (stmtID IS NULL) THEN
        INSERT IGNORE INTO Strings (str)
        VALUES (stmtStr);
        SELECT LAST_INSERT_ID() INTO stmtID;
        -- If a race condition means that the insert is ignored and stmtID
        -- is null, select the now added (by another process) Statement.
        IF (stmtID IS NULL) THEN
            SELECT id INTO stmtID
            FROM Strings
            WHERE (
                str = stmtStr
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
            ent_type_id = entTypeID AND
            tag_id = tagID AND
            ent_def_id = entDefID
        );
    -- Else update the corresponding SemInput with the new rat_val.
    ELSE
        REPLACE INTO SemanticInputs (
            user_id,
            ent_type_id,
            tag_id,
            rat_val,
            ent_def_id
        )
        VALUES (
            userID,
            entTypeID,
            tagID,
            ratVal,
            entDefID
        );
    END IF;


    /* Updating RecordedInputs */

    REPLACE INTO RecordedInputs (
        changed_at_time,
        user_id,
        ent_type_id,
        tag_id,
        ent_def_id,
        rat_val
    )
    VALUES (
        now,
        userID,
        entTypeID,
        tagID,
        entDefID,
        ratVal
    );


    /* Run procedures to update the various aggregation bots */

    CALL updateStatementUserRaterBot (userID, stmtID, ratVal);
    CALL updateMeanBots (
        userID, entTypeID, tagID, entDefID, ratVal, prevRatVal, stmtID
    );

END //
DELIMITER ;









DELIMITER //
CREATE PROCEDURE insertOrFindString (
    IN userID BIGINT UNSIGNED,
    IN recordCreator BOOL,
    IN string VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
)
BEGIN proc: BEGIN
    DECLARE outID BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;

    -- Check if entity already exists and return its ID as outID if so.
    SELECT id INTO outID
    FROM Strings
    WHERE (
        str = string
    );
    IF (outID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
        SELECT outID, exitCode;
        LEAVE proc;
    END IF;

    INSERT IGNORE INTO Strings (str)
    VALUES (string);
    SELECT LAST_INSERT_ID() INTO outID;
    IF (outID IS NULL) THEN
        SELECT id INTO outID
        FROM Strings
        WHERE (
            str = string
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