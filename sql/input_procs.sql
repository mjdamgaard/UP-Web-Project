
SELECT "Input procedures";

-- DROP PROCEDURE inputOrChangeRating;
-- DROP PROCEDURE insertOrFindEntity;
-- DROP PROCEDURE insertOrFindTemplate;
-- DROP PROCEDURE insertOrFindType;
-- -- DROP PROCEDURE private_insertUser;
-- DROP PROCEDURE insertText;
-- DROP PROCEDURE insertBinary;




DELIMITER //
CREATE PROCEDURE inputOrChangeRating (
    IN userID BIGINT UNSIGNED,
    IN catID BIGINT UNSIGNED,
    IN instID BIGINT UNSIGNED,
    IN ratVal SMALLINT UNSIGNED,
    IN liveAtTime BIGINT UNSIGNED
)
BEGIN
    DECLARE exitCode TINYINT;
    DECLARE typeID BIGINT UNSIGNED;
    DECLARE prevRatVal SMALLINT UNSIGNED;
    -- DECLARE now BIGINT UNSIGNED;

    IF (ratVal = 0) THEN
        SET ratVal = NULL;
    END IF;

    SELECT type_id INTO typeID
    FROM Entities
    WHERE id = catID;
    IF (typeID != 2) THEN
        SET exitCode = 1; -- catID is not the ID of a category.
    ELSE
        -- SELECT rat_val INTO prevRatVal
        -- FROM SemanticInputs
        -- WHERE (
        --     user_id = userID AND
        --     cat_id = catID AND
        --     inst_id = instID
        -- )
        -- FOR UPDATE;
        --
        -- IF (ratVal IS NOT NULL AND prevRatVal IS NULL) THEN
        --     INSERT INTO SemanticInputs (
        --         user_id,
        --         cat_id,
        --         rat_val,
        --         inst_id
        --     )
        --     VALUES (
        --         userID,
        --         catID,
        --         ratVal,
        --         instID
        --     );
        --     SET exitCode = 0; -- no previous rating.
        -- ELSEIF (ratVal IS NOT NULL AND prevRatVal IS NOT NULL) THEN
        --     UPDATE SemanticInputs
        --     SET rat_val = ratVal
        --     WHERE (
        --         user_id = userID AND
        --         cat_id = catID AND
        --         inst_id = instID
        --     );
        --     SET exitCode = 1; -- a previous rating was updated.
        -- ELSEIF (ratVal IS NULL AND prevRatVal IS NOT NULL) THEN
        --     DELETE FROM SemanticInputs
        --     WHERE (
        --         user_id = userID AND
        --         cat_id = catID AND
        --         inst_id = instID
        --     );
        --     SET exitCode = 2; -- a previous rating was deleted.
        -- ELSE
        --     SET exitCode = 3; -- trying to delete a non-existing rating.
        -- END IF;

        SET now = UNIX_TIMESTAMP();
        IF (now >= liveAtTime) THEN
            INSERT INTO RecentInputs (
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
        ELSE
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
        END IF;
        SET exitCode = 0; -- rating insert/update is pending.
    END IF;

    SELECT instID AS outID, exitCode;
END //
DELIMITER ;
-- TODO: When moving the ratings from Private_RecentInputs to the public ones
-- also implement an automatic procedure to rate a "this user has rated this
-- statement" relation with a special bot (where the rating then matches the
-- user's rating)..




DELIMITER //
CREATE PROCEDURE insertOrFindEntity (
    IN userID BIGINT UNSIGNED,
    IN typeID BIGINT UNSIGNED,
    IN cxtID BIGINT UNSIGNED,
    IN defStr VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
)
BEGIN proc: BEGIN
    DECLARE outID, typeTypeID, cxtTypeID, cxtCxtID BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;

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

    IF (typeID != 2 AND typeID <= 8) THEN
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

    -- (There is a race condition here, which we will allow. In order to remove
    -- it if this becomes desirable at some point, insert another SELECT
    -- statement here, this time FOR UPDATE.)
    INSERT INTO Entities (type_id, cxt_id, def_str)
    VALUES (typeID, cxtID, defStr);
    SELECT LAST_INSERT_ID() INTO outID;
    INSERT INTO Private_Creators (ent_id, user_id)
    VALUES (outID, userID);
    SET exitCode = 0; -- insert.
    SELECT outID, exitCode;
END proc; END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE insertOrFindTemplate (
    IN userID BIGINT UNSIGNED,
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

    INSERT INTO Entities (type_id, cxt_id, def_str)
    VALUES (3, cxtID, defStr);
    SELECT LAST_INSERT_ID() INTO outID;
    INSERT INTO Private_Creators (ent_id, user_id)
    VALUES (outID, userID);
    SET exitCode = 0; -- insert.
    SELECT outID, exitCode;
END proc; END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE insertOrFindType (
    IN userID BIGINT UNSIGNED,
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
        INSERT INTO Entities (type_id, cxt_id, def_str)
        VALUES (1, NULL, defStr);
        SELECT LAST_INSERT_ID() INTO outID;
        INSERT INTO Private_Creators (ent_id, user_id)
        VALUES (outID, userID);
        SET exitCode = 0; -- insert.
    END IF;
    SELECT outID, exitCode;
END //
DELIMITER ;






-- DELIMITER //
-- CREATE PROCEDURE private_insertUser (
--     IN username VARCHAR(50),
--     IN textStr TEXT
-- )
-- BEGIN
--     DECLARE outID BIGINT UNSIGNED;
--
--     INSERT INTO Entities (type_id, cxt_id, def_str)
--     VALUES (5, NULL, username);
--     SELECT LAST_INSERT_ID() INTO outID;
--     INSERT INTO Users (id, username)
--     VALUES (outID, username);
--     SELECT outID, 0 AS exitCode; -- insert.
-- END //
-- DELIMITER ;




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
    INSERT INTO Private_Creators (ent_id, user_id)
    VALUES (outID, userID);
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
    INSERT INTO Private_Creators (ent_id, user_id)
    VALUES (outID, userID);
    SELECT outID, 0 AS exitCode; -- insert.
END //
DELIMITER ;
