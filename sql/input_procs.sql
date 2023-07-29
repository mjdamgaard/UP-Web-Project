
SELECT "Input procedures";

-- DROP PROCEDURE insertOrUpdateRating;
-- DROP PROCEDURE private_insertOrUpdateRatingAndRunBots;
--
-- DROP PROCEDURE insertOrFindEntity;
-- DROP PROCEDURE insertOrFindTemplate;
-- DROP PROCEDURE insertOrFindType;
-- DROP PROCEDURE insertText;
-- DROP PROCEDURE insertBinary;




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
        cxt_id <=> 76 AND
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
                cxt_id <=> 76 AND
                def_str = CONCAT("#", instID, "|#", catID)
            );
        END IF;
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

    IF (cxtID = 0) THEN
        SET cxtID = NULL;
    END IF;

    SELECT id INTO outID
    FROM Entities
    WHERE (
        type_id = typeID AND
        cxt_id <=> cxtID AND
        def_str = defStr
    );
    IF (outID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
        SELECT outID, exitCode;
        LEAVE proc;
    END IF;

    IF (typeID != 2 AND typeID != 6 AND typeID <= 8) THEN
        SET exitCode = 2; -- typeID is not allowed for this procedure.
        SELECT outID, exitCode;
        LEAVE proc;
    END IF;
    SELECT type_id INTO typeTypeID
    FROM Entities
    WHERE id = typeID;
    IF (typeTypeID != 1) THEN
        SET exitCode = 3; -- typeID is not of an existing Type entity.
        SELECT outID, exitCode;
        LEAVE proc;
    END IF;

    IF (cxtID IS NOT NULL) THEN
        SELECT type_id, cxt_id INTO cxtTypeID, cxtCxtID
        FROM Entities
        WHERE id = cxtID;
        IF (cxtTypeID != 3) THEN
            SET exitCode = 4; -- cxtID is not of an existing Template entity.
            SELECT outID, exitCode;
            LEAVE proc;
        ELSEIF (cxtCxtID != typeID) THEN
            SET exitCode = 5; -- cxt_id of the cxtID entity is not the
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
            cxt_id <=> cxtID AND
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
BEGIN proc: BEGIN
    DECLARE outID, cxtTypeID BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;

    SELECT id INTO outID
    FROM Entities
    WHERE (
        type_id = 3 AND
        cxt_id = cxtID AND
        def_str = defStr
    );
    IF (outID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
        SELECT outID, exitCode;
        LEAVE proc;
    END IF;

    SELECT type_id INTO cxtTypeID
    FROM Entities
    WHERE id = cxtID;
    IF (cxtTypeID != 1) THEN
        SET exitCode = 2; -- cxtID is not of an existing Type entity.
        SELECT outID, exitCode;
        LEAVE proc;
    END IF;

    INSERT IGNORE INTO Entities (type_id, cxt_id, def_str)
    VALUES (3, cxtID, defStr);
    SELECT LAST_INSERT_ID() INTO outID;
    IF (outID IS NULL) THEN
        SELECT id INTO outID
        FROM Entities
        WHERE (
            type_id = 3 AND
            cxt_id <=> cxtID AND
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
CREATE PROCEDURE insertOrFindType (
    IN userID BIGINT UNSIGNED,
    IN recordCreator BOOL,
    IN defStr VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
)
BEGIN
    DECLARE outID BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;

    SELECT id INTO outID
    FROM Entities
    WHERE (
        type_id = 1 AND
        cxt_id IS NULL AND -- Types might be allowed to have other (super)types
        -- as their context in the future.
        def_str = defStr
    );
    IF (outID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
    ELSE
        INSERT IGNORE INTO Entities (type_id, cxt_id, def_str)
        VALUES (1, NULL, defStr);
        SELECT LAST_INSERT_ID() INTO outID;
        IF (outID IS NULL) THEN
            SELECT id INTO outID
            FROM Entities
            WHERE (
                type_id = 1 AND
                cxt_id <=> NULL AND
                def_str = defStr
            );
            SET exitCode = 1; -- find.
        ELSE
            IF (recordCreator) THEN
                CALL creatorRaterBot (outID, userID);
            END IF;
            SET exitCode = 0; -- insert.
        END IF;
    END IF;
    SELECT outID, exitCode;
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
    VALUES (7, NULL, name);
    SELECT LAST_INSERT_ID() INTO outID;
    INSERT INTO Texts (id, str)
    VALUES (outID, textStr);
    -- INSERT INTO Private_Creators (ent_id, user_id)
    -- VALUES (outID, userID);
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
    VALUES (8, NULL, name);
    SELECT LAST_INSERT_ID() INTO outID;
    INSERT INTO Binaries (id, bin)
    VALUES (outID, bin);
    -- INSERT INTO Private_Creators (ent_id, user_id)
    -- VALUES (outID, userID);
    SELECT outID, 0 AS exitCode; -- insert.
END //
DELIMITER ;
