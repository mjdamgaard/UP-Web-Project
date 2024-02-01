
SELECT "Input procedures";

DROP PROCEDURE insertOrUpdateRating;
DROP PROCEDURE private_insertOrUpdateRatingAndRunBots;

DROP PROCEDURE insertOrFindEntity;
DROP PROCEDURE insertOrFindTemplate;
DROP PROCEDURE insertOrFindType;
DROP PROCEDURE insertText;
DROP PROCEDURE insertBinary;




DELIMITER //
CREATE PROCEDURE insertOrUpdateRating (
    IN userID BIGINT UNSIGNED,
    IN catID BIGINT UNSIGNED,
    IN instID BIGINT UNSIGNED,
    IN ratVal SMALLINT UNSIGNED,
    IN liveAtTime BIGINT UNSIGNED
)
BEGIN
    DECLARE exitCode TINYINT;
    DECLARE typeID BIGINT UNSIGNED;
    -- DECLARE now BIGINT UNSIGNED DEFAULT UNIX_TIMESTAMP();

    IF (ratVal = 0) THEN
        SET ratVal = NULL;
    END IF;

    SELECT type_id INTO typeID
    FROM Entities
    WHERE id = catID;
    IF (typeID != 2) THEN
        SET exitCode = 1; -- catID is not the ID of a category.
    ELSE
        IF (liveAtTime > 0) THEN
            INSERT INTO Private_RecentInputs (
                user_id,
                cat_id,
                rat_val,
                inst_id,
                live_at_time
            )
            VALUES (
                userID,
                catID,
                ratVal,
                instID,
                liveAtTime
            );
        ELSE
            CALL private_insertOrUpdateRatingAndRunBots (
                userID, catID, instID, ratVal
            );
        END IF;
        SET exitCode = 0; -- rating insert/update is done or is pending.
    END IF;

    SELECT instID AS outID, exitCode;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE private_insertOrUpdateRatingAndRunBots (
    IN userID BIGINT UNSIGNED,
    IN catID BIGINT UNSIGNED,
    IN instID BIGINT UNSIGNED,
    IN ratVal SMALLINT UNSIGNED
)
BEGIN
    DECLARE stmtID BIGINT UNSIGNED;
    DECLARE prevRatVal SMALLINT UNSIGNED;
    DECLARE now BIGINT UNSIGNED DEFAULT UNIX_TIMESTAMP();


    /* Retrieval of the previous rating the statement entity */

    -- get the previous rating value (might be null).
    SELECT rat_val INTO prevRatVal
    FROM SemanticInputs
    WHERE (
        user_id = userID AND
        cat_id = catID AND
        inst_id = instID
    );

    -- get the statement entity.
    SELECT id INTO stmtID
    FROM Entities
    WHERE (
        type_id = 75 AND
        cxt_id = 76 AND
        def_str = CONCAT("#", instID, "|#", catID)
    );
    -- if it does not exist, insert it and get the ID.
    IF (stmtID IS NULL) THEN
        INSERT IGNORE INTO Entities (type_id, cxt_id, def_str)
        VALUES (75, 76, CONCAT("#", instID, "|#", catID));
        SELECT LAST_INSERT_ID() INTO stmtID;
        -- if a race condition means that the insert is ignored and stmtID
        -- is null, select the now added (by another process) Statement.
        IF (stmtID IS NULL) THEN
            SELECT id INTO stmtID
            FROM Entities
            WHERE (
                type_id = 75 AND
                cxt_id = 76 AND
                def_str = CONCAT("#", instID, "|#", catID)
            );
        END IF;
        -- TODO: It seems that there still is a risk that stmtID is NULL at
        -- this point for simultaneous requests, despite all this. So
        -- investigate and fix (here and other places) at some point.
    END IF;


    /* Updating the user's own input set */

    -- if the input's rat_val is null, delete the corresponding SemInput.
    IF (ratVal IS NULL) THEN
        DELETE FROM SemanticInputs
        WHERE (
            user_id = userID AND
            cat_id = catID AND
            inst_id = instID
        );
    -- else update the corresponding SemInput with the new rat_val.
    ELSE
        REPLACE INTO SemanticInputs (
            user_id,
            cat_id,
            rat_val,
            inst_id
        )
        VALUES (
            userID,
            catID,
            ratVal,
            instID
        );
    END IF;


    /* Updating RecordedInputs */

    REPLACE INTO RecordedInputs (
        changed_at_time,
        user_id,
        cat_id,
        inst_id,
        rat_val
    )
    VALUES (
        now,
        userID,
        catID,
        instID,
        ratVal
    );


    /* Run procedures to update the various aggregation bots */

    CALL updateStatementUserRaterBot (userID, stmtID, ratVal);
    CALL updateMeanBots (
        userID, catID, instID, ratVal, prevRatVal, stmtID
    );

END //
DELIMITER ;









DELIMITER //
CREATE PROCEDURE insertOrFindEntity (
    IN userID BIGINT UNSIGNED,
    IN recordCreator BOOL,
    IN typeID BIGINT UNSIGNED,
    IN cxtID BIGINT UNSIGNED,
    IN defStr VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
)
BEGIN proc: BEGIN
    DECLARE outID, typeTypeID, cxtTypeID, cxtCxtID BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;
    DECLARE userCreationsCatID BIGINT UNSIGNED;

    -- IF (cxtID = 0) THEN
    --     SET cxtID = NULL;
    -- END IF;

    -- check if entity already exists and return its ID as outID if so.
    SELECT id INTO outID
    FROM Entities
    WHERE (
        type_id = typeID AND
        cxt_id = cxtID AND
        def_str = defStr
    );
    IF (outID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
        SELECT outID, exitCode;
        LEAVE proc;
    END IF;

    -- check that typeID is not the "User", "Text data", or "Binary data" types,
    -- and also that it's not the "Index" type as this is not implemented yet.
    IF (typeID != 6 AND 4 <= typeID AND typeID <= 8) THEN
        SET exitCode = 2; -- typeID is not allowed for this procedure.
        SELECT outID, exitCode;
        LEAVE proc;
    END IF;

    -- check that typeID is indeed that of a type entity.
    SELECT type_id INTO typeTypeID
    FROM Entities
    WHERE id = typeID;
    IF (typeTypeID != 1) THEN
        SET exitCode = 3; -- typeID is not of an existing Type entity.
        SELECT outID, exitCode;
        LEAVE proc;
    END IF;

    -- if cxtID is not 0, fetch that entity's own type and context.
    IF (cxtID != 0) THEN
        SELECT type_id, cxt_id INTO cxtTypeID, cxtCxtID
        FROM Entities
        WHERE id = cxtID;
    END IF;

    -- if typeID is the "Type" type entity, check this cxtID is 0.
    -- (Types might be allowed to have other (super)types as their context in
    -- the future, but it is not allowed at this point.)
    IF (typeID = 1) THEN
        IF (cxtID != 0) THEN
            SET exitCode = 4; -- trying to give a type entity a context.
            SELECT outID, exitCode;
            LEAVE proc;
        END IF;
    -- else if typeID is the "Template" type entity, check that cxtID is that
    -- of a type entity itself.
    ELSEIF (typeID = 3) THEN
        IF (cxtTypeID != 1) THEN
            SET exitCode = 5; -- cxtID is not of an existing type entity.
            SELECT outID, exitCode;
            LEAVE proc;
        END IF;
    -- else the context has to be either null or that of a template entity, in
    -- which case the context of that template entity has to also match typeID,
    -- so check these things.
    ELSEIF (cxtID != 0) THEN
        IF (cxtTypeID != 3) THEN
            SET exitCode = 6; -- cxtID is not of an existing template entity.
            SELECT outID, exitCode;
            LEAVE proc;
        ELSEIF (cxtCxtID != typeID) THEN
            SET exitCode = 7; -- cxt_id of the cxtID entity is not the
            -- same as the input typeID.
            SELECT outID, exitCode;
            LEAVE proc;
        END IF;
    END IF;

    INSERT IGNORE INTO Entities (type_id, cxt_id, def_str)
    VALUES (typeID, cxtID, defStr);
    SELECT LAST_INSERT_ID() INTO outID;
    IF (outID IS NULL) THEN
        SELECT id INTO outID
        FROM Entities
        WHERE (
            type_id = typeID AND
            cxt_id = cxtID AND
            def_str = defStr
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


DELIMITER //
CREATE PROCEDURE insertOrFindTemplate (
    IN userID BIGINT UNSIGNED,
    IN recordCreator BOOL,
    IN cxtID BIGINT UNSIGNED,
    IN defStr VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
)
BEGIN
    CALL insertOrFindEntity (userID, recordCreator, 3, cxtID, defStr);
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE insertOrFindType (
    IN userID BIGINT UNSIGNED,
    IN recordCreator BOOL,
    IN defStr VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
)
BEGIN
    CALL insertOrFindEntity (userID, recordCreator, 1, 0, defStr);
END //
DELIMITER ;






-- TODO: Reimplement insertText() and insertBinary() to handle the case where
-- name already exists (and think about if.. Hm, if the name shouldn't just be
-- randomly generated (or, better, the same as the ID)...).

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