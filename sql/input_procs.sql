
SELECT "Input procedures";

-- DROP PROCEDURE inputOrChangeRating;
-- DROP PROCEDURE insertOrFindEntity;
-- DROP PROCEDURE private_insertUser;
-- DROP PROCEDURE insertText;
-- DROP PROCEDURE insertBinary;




DELIMITER //
CREATE PROCEDURE inputOrChangeRating (
    IN userID BIGINT UNSIGNED,
    IN catID BIGINT UNSIGNED,
    IN instID BIGINT UNSIGNED,
    IN ratVal SMALLINT UNSIGNED,
    IN live_after TIME
)
BEGIN
    DECLARE exitCode TINYINT;
    DECLARE typeID BIGINT UNSIGNED;
    DECLARE prevRatVal SMALLINT UNSIGNED;

    IF (ratVal = 0) THEN
        SET ratVal = NULL;
    END IF;

    SELECT type_id INTO typeID
    FROM Entities
    WHERE id = catID;
    IF (typeID != 2) THEN
        SET exitCode = 4; -- catID is not the ID of a category.
    ELSE
        SELECT rat_val INTO prevRatVal
        FROM SemanticInputs
        WHERE (
            user_id = userID AND
            cat_id = catID AND
            inst_id = instID
        )
        FOR UPDATE;

        IF (ratVal IS NOT NULL AND prevRatVal IS NULL) THEN
            INSERT INTO SemanticInputs (
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
            SET exitCode = 0; -- no previous rating.
        ELSEIF (ratVal IS NOT NULL AND prevRatVal IS NOT NULL) THEN
            UPDATE SemanticInputs
            SET rat_val = ratVal
            WHERE (
                user_id = userID AND
                cat_id = catID AND
                inst_id = instID
            );
            SET exitCode = 1; -- a previous rating was updated.
        ELSEIF (ratVal IS NULL AND prevRatVal IS NOT NULL) THEN
            DELETE FROM SemanticInputs
            WHERE (
                user_id = userID AND
                cat_id = catID AND
                inst_id = instID
            );
            SET exitCode = 2; -- a previous rating was deleted.
        ELSE
            SET exitCode = 3; -- trying to delete a non-existing rating.
        END IF;
    END IF;
    IF (exitCode <= 2) THEN
        -- TODO: Change this to update PrivateRecentInputs instead, make a
        -- scheduled event to move private recent inputs into (the public)
        -- RecentInputs, and update SemanticInputs only then.
        SET live_after = NULL; -- (not implemented yet)
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
    END IF;

    SELECT instID AS outID, exitCode;
END //
DELIMITER ;
-- TODO: When moving the ratings from PrivateRecentInputs to the public ones
-- also implement an automatic procedure to rate a "this user has rated this
-- statement" relation with a special bot (where the rating then matches the
-- user's rating)..




DELIMITER //
CREATE PROCEDURE insertOrFindEntity (
    IN userID BIGINT UNSIGNED,
    IN typeID BIGINT UNSIGNED,
    IN tmplID BIGINT UNSIGNED,
    IN defStr VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
)
BEGIN
    DECLARE outID, varID BIGINT UNSIGNED;
    DECLARE tmplType BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;

    IF (tmplID = 0) THEN
        SET tmplID = NULL;
    END IF;

    IF (typeID = 0 OR 4 <= typeID AND typeID <= 8) THEN
        SET exitCode = 3; -- typeID is not allowed for this procedure.
    ELSE
        SELECT id INTO outID
        FROM Entities
        WHERE (
            type_id = typeID AND
            tmpl_id <=> tmplID AND
            def_str = defStr
        );
        IF (outID IS NOT NULL) THEN
            SET exitCode = 1; -- find.
        ELSEIF (tmplID IS NOT NULL) THEN
            SELECT type_id INTO tmplType
            FROM Entities
            WHERE id = tmplID;
            IF (tmplType != 3) THEN
                SET exitCode = 2; -- tmplID entity is not an existing template.
            END IF;
        END IF;
    END IF;

    IF (exitCode IS NULL) THEN
        INSERT INTO Entities (type_id, tmpl_id, def_str)
        VALUES (typeID, tmplID, defStr);
        SELECT LAST_INSERT_ID() INTO outID;
        INSERT INTO PrivateCreators (ent_id, user_id)
        VALUES (outID, userID);
        SET exitCode = 0; -- insert.
    END IF;
    SELECT outID, exitCode;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE private_insertUser (
    IN username VARCHAR(50),
    IN textStr TEXT
)
BEGIN
    DECLARE outID BIGINT UNSIGNED;

    INSERT INTO Entities (type_id, tmpl_id, def_str)
    VALUES (5, NULL, username);
    SELECT LAST_INSERT_ID() INTO outID;
    INSERT INTO Users (id, username)
    VALUES (outID, username);
    SELECT outID, 0; -- insert.
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE insertText (
    IN userID BIGINT UNSIGNED,
    IN name VARCHAR(255),
    IN textStr TEXT
)
BEGIN
    DECLARE outID BIGINT UNSIGNED;

    INSERT INTO Entities (type_id, tmpl_id, def_str)
    VALUES (7, NULL, name);
    SELECT LAST_INSERT_ID() INTO outID;
    INSERT INTO Texts (id, str)
    VALUES (outID, textStr);
    INSERT INTO PrivateCreators (ent_id, user_id)
    VALUES (outID, userID);
    SELECT outID, 0; -- insert.
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

    INSERT INTO Entities (type_id, tmpl_id, def_str)
    VALUES (8, NULL, name);
    SELECT LAST_INSERT_ID() INTO outID;
    INSERT INTO Binaries (id, bin)
    VALUES (outID, bin);
    INSERT INTO PrivateCreators (ent_id, user_id)
    VALUES (outID, userID);
    SELECT outID, 0; -- insert.
END //
DELIMITER ;
