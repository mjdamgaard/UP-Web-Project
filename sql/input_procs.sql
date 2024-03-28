
SELECT "Input procedures";

DROP PROCEDURE insertOrUpdateRating;
DROP PROCEDURE private_insertOrUpdateRatingAndRunBots;

DROP PROCEDURE insertOrFindString;
DROP PROCEDURE insertText;
DROP PROCEDURE insertBinary;




DELIMITER //
CREATE PROCEDURE insertOrUpdateRating (
    IN userID BIGINT UNSIGNED,
    IN objTypeID BIGINT UNSIGNED,
    IN tagID BIGINT UNSIGNED,
    IN objStrID BIGINT UNSIGNED,
    IN ratVal SMALLINT UNSIGNED,
    IN liveAtTime BIGINT UNSIGNED
)
BEGIN
    DECLARE exitCode TINYINT;
    -- DECLARE now BIGINT UNSIGNED DEFAULT UNIX_TIMESTAMP();

    IF (liveAtTime > 0) THEN
        INSERT INTO Private_RecentInputs (
            user_id,
            obj_type_id,
            tag_id,
            rat_val,
            obj_str_id,
            live_at_time
        )
        VALUES (
            userID,
            objTypeID,
            tagID,
            ratVal,
            objStrID,
            liveAtTime
        );
    ELSE
        CALL private_insertOrUpdateRatingAndRunBots (
            userID, objTypeID, tagID, objStrID, ratVal
        );
    END IF;
    SET exitCode = 0; -- Rating insert/update is done or is pending.

    SELECT objStrID AS outID, exitCode;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE private_insertOrUpdateRatingAndRunBots (
    IN userID BIGINT UNSIGNED,
    IN objTypeID BIGINT UNSIGNED,
    IN tagID BIGINT UNSIGNED,
    IN objStrID BIGINT UNSIGNED,
    IN ratVal SMALLINT UNSIGNED
)
BEGIN
    DECLARE stmtID BIGINT UNSIGNED;
    DECLARE prevRatVal SMALLINT UNSIGNED;
    DECLARE now BIGINT UNSIGNED DEFAULT UNIX_TIMESTAMP();


    /* Retrieval of the previous rating the statement entity */

    -- Get the previous rating value (might be null).
    SELECT rat_val INTO prevRatVal
    FROM SemanticInputs
    WHERE (
        user_id = userID AND
        tag_id = tagID AND
        obj_str_id = objStrID
    );

    -- TODO: Fix and in-comment again:
    -- -- Get the statement entity.
    -- SELECT id INTO stmtID
    -- FROM Entities
    -- WHERE (
    --     type_id = 75 AND
    --     cxt_id = 76 AND
    --     def_str = CONCAT("#", objStrID, "|#", tagID)
    -- );
    -- -- If it does not exist, insert it and get the ID.
    -- IF (stmtID IS NULL) THEN
    --     INSERT IGNORE INTO Entities (type_id, cxt_id, def_str)
    --     VALUES (75, 76, CONCAT("#", objStrID, "|#", tagID));
    --     SELECT LAST_INSERT_ID() INTO stmtID;
    --     -- If a race condition means that the insert is ignored and stmtID
    --     -- is null, select the now added (by another process) Statement.
    --     IF (stmtID IS NULL) THEN
    --         SELECT id INTO stmtID
    --         FROM Entities
    --         WHERE (
    --             type_id = 75 AND
    --             cxt_id = 76 AND
    --             def_str = CONCAT("#", objStrID, "|#", tagID)
    --         );
    --     END IF;
    --     -- TODO: It seems that there still is a risk that stmtID is NULL at
    --     -- this point for simultaneous requests, despite all this. So
    --     -- investigate and fix (here and other places) at some point.
    -- END IF;


    /* Updating the user's own input set */

    -- If the input's rat_val is null, delete the corresponding SemInput.
    IF (ratVal = 0) THEN
        DELETE FROM SemanticInputs
        WHERE (
            user_id = userID AND
            obj_type_id = objTypeID AND
            tag_id = tagID AND
            obj_str_id = objStrID
        );
    -- Else update the corresponding SemInput with the new rat_val.
    ELSE
        REPLACE INTO SemanticInputs (
            user_id,
            obj_type_id,
            tag_id,
            rat_val,
            obj_str_id
        )
        VALUES (
            userID,
            objTypeID,
            tagID,
            ratVal,
            objStrID
        );
    END IF;


    /* Updating RecordedInputs */

    REPLACE INTO RecordedInputs (
        changed_at_time,
        user_id,
        obj_type_id,
        tag_id,
        obj_str_id,
        rat_val
    )
    VALUES (
        now,
        userID,
        objTypeID,
        tagID,
        objStrID,
        ratVal
    );


    /* Run procedures to update the various aggregation bots */

    CALL updateStatementUserRaterBot (userID, objTypeID, stmtID, ratVal);
    CALL updateMeanBots (
        userID, objTypeID, tagID, objStrID, ratVal, prevRatVal, stmtID
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
    DECLARE userCreationsCatID BIGINT UNSIGNED; -- TODO: I might have deleted
    -- some code I need to reproduce..

    -- Check if entity already exists and return its ID as outID if so.
    SELECT id INTO outID
    FROM Entities
    WHERE (
        str = string
    );
    IF (outID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
        SELECT outID, exitCode;
        LEAVE proc;
    END IF;

    INSERT IGNORE INTO Entities (str)
    VALUES (string);
    SELECT LAST_INSERT_ID() INTO outID;
    IF (outID IS NULL) THEN
        SELECT id INTO outID
        FROM Entities
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

-- And TODO: Fix according to the new changes. (26.03.24)

DELIMITER //
CREATE PROCEDURE insertText (
    IN userID BIGINT UNSIGNED,
    IN name VARCHAR(255),
    IN textStr TEXT
)
BEGIN
    DECLARE outID BIGINT UNSIGNED;

    INSERT INTO Entities (type_id, cxt_id, def_str)
    VALUES (7, 0, name);
    SELECT LAST_INSERT_ID() INTO outID;
    INSERT INTO Texts (id, str)
    VALUES (outID, textStr);
    SELECT outID, 0 AS exitCode; -- insert.
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE insertBinary (
    IN userID BIGINT UNSIGNED,
    IN name VARCHAR(255),
    IN bin TEXT
)
BEGIN
    DECLARE outID BIGINT UNSIGNED;

    INSERT INTO Entities (type_id, cxt_id, def_str)
    VALUES (8, 0, name);
    SELECT LAST_INSERT_ID() INTO outID;
    INSERT INTO Binaries (id, bin)
    VALUES (outID, bin);
    SELECT outID, 0 AS exitCode; -- insert.
END //
DELIMITER ;




-- TODO: There seems to be a bug which can cause a deadlock: "Uncaught
-- mysqli_sql_exception: Deadlock found when trying to get lock; try
-- restarting transaction in /var/www/src/php/db_io/DBConnector.php:30"
-- when a rating deletion request is sent twice at the same time.