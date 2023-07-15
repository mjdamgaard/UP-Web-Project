
SELECT "Input procedures";

-- DROP PROCEDURE inputOrChangeRating;
--
-- DROP PROCEDURE insertOrFindTerm;
-- DROP PROCEDURE insertOrFindTemplate;
--
-- DROP PROCEDURE private_insertUser;
-- DROP PROCEDURE insertText;
-- DROP PROCEDURE insertBinary;




DELIMITER //
CREATE PROCEDURE inputOrChangeRating (
    IN userID BIGINT UNSIGNED,
    IN predID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN ratVal SMALLINT UNSIGNED,
    IN live_after TIME
)
BEGIN
    DECLARE exitCode TINYINT;
    DECLARE prevRatVal SMALLINT UNSIGNED;

    IF (ratVal = 0) THEN
        SET ratVal = NULL;
    END IF;

    SELECT rat_val INTO prevRatVal
    FROM SemanticInputs
    WHERE (
        user_id = userID AND
        pred_id = predID AND
        subj_id = subjID
    )
    FOR UPDATE;

    IF (ratVal IS NOT NULL AND prevRatVal IS NULL) THEN
        INSERT INTO SemanticInputs (
            user_id,
            pred_id,
            rat_val,
            subj_id
        )
        VALUES (
            userID,
            predID,
            ratVal,
            subjID
        );
        SET exitCode = 0; -- no previous rating.
    ELSEIF (ratVal IS NOT NULL AND prevRatVal IS NOT NULL) THEN
        UPDATE SemanticInputs
        SET rat_val = ratVal
        WHERE (
            user_id = userID AND
            pred_id = predID AND
            subj_id = subjID
        );
        SET exitCode = 1; -- a previous rating was updated.
    ELSEIF (ratVal IS NULL AND prevRatVal IS NOT NULL) THEN
        DELETE FROM SemanticInputs
        WHERE (
            user_id = userID AND
            pred_id = predID AND
            subj_id = subjID
        );
        SET exitCode = 2; -- a previous rating was deleted.
    ELSE
        SET exitCode = 3; -- trying to delete a non-existing rating.
    END IF;

    -- TODO: Change this to update PrivateRecentInputs instead, make a
    -- scheduled event to move private recent inputs into (the public)
    -- RecentInputs, and update SemanticInputs only then.
    SET live_after = NULL; -- (not implemented yet)
    INSERT INTO RecentInputs (
        user_id,
        pred_id,
        rat_val,
        subj_id
    )
    VALUES (
        userID,
        predID,
        ratVal,
        subjID
    );

    SELECT subjID AS outID, exitCode;
END //
DELIMITER ;
-- TODO: When moving the ratings from PrivateRecentInputs to the public ones
-- also implement an automatic procedure to rate a "this user has rated this
-- statement" relation with a special bot (where the rating then matches the
-- user's rating)..




-- DELIMITER //
-- CREATE PROCEDURE insertOrFindEntity (
--     IN userID BIGINT UNSIGNED,
--     IN t CHAR(1),
--     IN tmplID BIGINT UNSIGNED,
--     IN defStr VARCHAR(255)
-- )
-- BEGIN
--     DECLARE outID, tmplTmplID, var BIGINT UNSIGNED;
--     DECLARE exitCode TINYINT;
--
--     IF (tmplID = 0) THEN
--         SET tmplID = NULL;
--     END IF;
--
--     SELECT id INTO outID
--     FROM Entities
--     WHERE (
--         type = t AND
--         tmpl_id <=> tmplID AND
--         def_str = defStr
--     );
--     IF (outID IS NOT NULL) THEN
--         SET exitCode = 1; -- find.
--     ELSEIF (tmplID < 5) THEN
--         SET exitCode = 2; -- tmplID is not permitted for this procedure.
--     ELSEIF (tmplID IS NOT NULL) THEN
--         SELECT id, tmpl_id INTO var, tmplTmplID
--         FROM Entities
--         WHERE id = tmplID;
--         IF (var IS NULL) THEN
--             SET exitCode = 3; -- tmplID is not the ID of an existing entity.
--         ELSEIF (tmplTmplID IS NOT NULL) THEN
--             SET exitCode = 4; -- tmpl_id of the template must be null.
--         END IF;
--     END IF;
--
--     IF (exitCode IS NULL) THEN
--         INSERT INTO Entities (tmpl_id, def_str)
--         VALUES (tmplID, defStr);
--         SELECT LAST_INSERT_ID() INTO outID;
--         INSERT INTO PrivateCreators (ent_id, user_id)
--         VALUES (outID, userID);
--         SET exitCode = 0; -- insert.
--     END IF;
--     SELECT outID, exitCode;
-- END //
-- DELIMITER ;

DELIMITER //
CREATE PROCEDURE insertOrFindTerm (
    IN userID BIGINT UNSIGNED,
    IN t CHAR(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    IN tmplID BIGINT UNSIGNED,
    IN defStr VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
)
BEGIN
    DECLARE outID, varID BIGINT UNSIGNED;
    DECLARE t CHAR(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
    DECLARE exitCode TINYINT;

    IF (tmplID = 0) THEN
        SET tmplID = NULL;
    END IF;

    SELECT id INTO outID
    FROM Entities
    WHERE (
        type = t AND
        tmpl_id <=> tmplID AND
        def_str = defStr
    );
    IF (outID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
    ELSEIF (tmplID IS NOT NULL) THEN
        SELECT type INTO t
        FROM Entities
        WHERE id = tmplID;
        IF (t != 'm') THEN
            SET exitCode = 2; -- tmplID is not the ID of an existing template.
        END IF;
    END IF;

    IF (exitCode IS NULL) THEN
        INSERT INTO Entities (type, tmpl_id, def_str)
        VALUES (t, tmplID, defStr);
        SELECT LAST_INSERT_ID() INTO outID;
        INSERT INTO PrivateCreators (ent_id, user_id)
        VALUES (outID, userID);
        SET exitCode = 0; -- insert.
    END IF;
    SELECT outID, exitCode;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE insertOrFindTemplate (
    IN userID BIGINT UNSIGNED,
    IN defStr VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
)
BEGIN
    DECLARE outID, varID BIGINT UNSIGNED;
    DECLARE t CHAR(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
    DECLARE exitCode TINYINT;

    SELECT id INTO outID
    FROM Entities
    WHERE (
        type = 'm' AND
        tmpl_id IS NULL AND
        def_str = defStr
    );
    IF (outID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
    ELSE
        INSERT INTO Entities (type, tmpl_id, def_str)
        VALUES ('m', NULL, defStr);
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

    INSERT INTO Entities (type, tmpl_id, def_str)
    VALUES ('u', NULL, username);
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

    INSERT INTO Entities (type, tmpl_id, def_str)
    VALUES ('x', NULL, name);
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

    INSERT INTO Entities (type, tmpl_id, def_str)
    VALUES ('b', NULL, name);
    SELECT LAST_INSERT_ID() INTO outID;
    INSERT INTO Binaries (id, bin)
    VALUES (outID, bin);
    INSERT INTO PrivateCreators (ent_id, user_id)
    VALUES (outID, userID);
    SELECT outID, 0; -- insert.
END //
DELIMITER ;
