
SELECT "rating_inputs";




DROP PROCEDURE inputOrChangeRatingSecKey;
DROP PROCEDURE inputOrChangeRating;



DROP PROCEDURE insertOrFindCat;
DROP PROCEDURE insertOrFindETerm;
DROP PROCEDURE insertOrFindRel;

DROP PROCEDURE insertText;




DELIMITER //
CREATE PROCEDURE createOrFindSet (
    IN userID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN relID BIGINT UNSIGNED,
    OUT newID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
BEGIN
    SELECT id INTO newID
    FROM Sets
    WHERE (
        user_id = userID AND
        subj_id = subjID AND
        rel_id = relID
    );
    IF (newID IS NULL) THEN
        INSERT INTO Sets (
            user_id,
            subj_id,
            rel_id,
            elem_num
        )
        VALUES (
            userID,
            subjID,
            relID,
            0
        );
        SELECT LAST_INSERT_ID() INTO newID;
        SET exitCode = 0; -- create.
    ELSE
        SET exitCode = 1; -- find.
    END IF;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE inputOrChangeRating (
    IN userID BIGINT UNSIGNED,
    IN objID BIGINT UNSIGNED,
    IN setID BIGINT UNSIGNED,
    IN ratValHex VARCHAR(510),
    IN delayTimeMin TIME,
    IN delayTimeSigma TIME,
    OUT newID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
BEGIN
    DECLARE prevRatVal, ratVal VARBINARY(255);
    DECLARE setUserID, prevElemNum BIGINT UNSIGNED;

    IF NOT EXISTS (
        SELECT id FROM Sets WHERE (id = setID AND user_id = userID)
    ) THEN
        SET exitCode = 2; -- user does not own the set (or set doesn't exist).
    ELSE
        IF (ratValHex = "") THEN
            SET ratValHex = NULL;
        END IF;
        SET ratVal = UNHEX(ratValHex);

        SELECT rat_val INTO prevRatVal
        FROM SemanticInputs
        WHERE (
            obj_t = objType AND
            obj_id = objID AND
            set_id = setID
        );
        SELECT elem_num INTO prevElemNum
        FROM Sets
        WHERE id = setID
        FOR UPDATE;
        SELECT rat_val INTO prevRatVal
        FROM SemanticInputs
        WHERE (
            obj_id = objID AND
            set_id = setID
        )
        FOR UPDATE;

        -- TODO: Change this to update PrivateRecentInputs instead, make a
        -- scheduled event to move private recent inputs into (the public)
        -- RecentInputs, and at some point also make an event to record
        -- recent inputs into RecordedInputs when there is long enough time
        -- between the last last recent input before that.
        SET delayTimeMin = 0; -- (not implemented yet)
        SET delayTimeSigma = 0; -- (not implemented yet)
        INSERT INTO RecentInputs (set_id, rat_val, obj_id)
        VALUES (setID, ratVal, objID); -- (This can in theory fail if to
        -- changes can happen at the same millisecond, so let's keep it here
        -- above the following updates, for aesthetics if nothing else.)

        IF (ratVal IS NOT NULL AND prevRatVal IS NULL) THEN
            INSERT INTO SemanticInputs (set_id, rat_val, obj_id)
            VALUES (setID, ratVal, objID);
            SET exitCode = 0; -- success(ful insertion of new rating).
        ELSEIF (ratVal IS NOT NULL AND prevRatVal IS NOT NULL) THEN
            UPDATE SemanticInputs
            SET rat_val = ratVal
            WHERE (
                obj_id = objID AND
                set_id = setID
            );
            SET exitCode = 0; -- success(ful update of previous rating).
        ELSEIF (ratVal IS NULL AND prevRatVal IS NOT NULL) THEN
            DELETE FROM SemanticInputs
            WHERE (
                obj_id = objID AND
                set_id = setID
            );
            SET exitCode = 0; -- success(ful deletion of previous rating).
        ELSE
            SET exitCode = 1; -- trying to delete a non-existing rating.
        END IF;
    END IF;
END //
DELIMITER ;








DELIMITER //
CREATE PROCEDURE insertOrFindCat (
    IN userCombID VARCHAR(17),
    IN superCatCombID VARCHAR(17),
    IN catTitle VARCHAR(255),
    OUT newCombID VARCHAR(17),
    OUT exitCode TINYINT
)
BEGIN
    DECLARE superCatID, userID, newID BIGINT UNSIGNED;
    CALL getConvID (superCatCombID, superCatID);
    CALL getConvID (userCombID, userID);

    SELECT id INTO newID
    FROM Categories
    WHERE (title = catTitle AND super_cat_id = superCatID);
    IF (newID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
    ELSEIF (NOT EXISTS (SELECT id FROM Categories WHERE id = superCatID)) THEN
        SET newID = NULL;
        SET exitCode = 2; -- super category doesn't exist.
    ELSE
        -- TODO: Insert a check that the user is part of a set and with a
        -- non-negative rating denoting that the user is allowed to insert.
        INSERT INTO Categories (title, super_cat_id)
        VALUES (catTitle, superCatID);
        SELECT LAST_INSERT_ID() INTO newID;
        IF (userID != 0) THEN
            INSERT INTO Creators (term_t, term_id, user_id)
            VALUES ("c", newID, userID);
        END IF;
        SET exitCode = 0; -- insert.
    END IF;
    SET newCombID = CONCAT('c', CONV(newID, 10, 16));
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertOrFindETerm (
    IN userCombID VARCHAR(17),
    IN catCombID VARCHAR(17),
    IN eTermTitle VARCHAR(255),
    OUT newCombID VARCHAR(17),
    OUT exitCode TINYINT
)
BEGIN
    DECLARE catID, userID, newID BIGINT UNSIGNED;
    CALL getConvID (catCombID, catID);
    CALL getConvID (userCombID, userID);

    SELECT id INTO newID
    FROM ElementaryTerms
    WHERE (title = eTermTitle AND cat_id = catID);
    IF (newID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
    ELSEIF (NOT EXISTS (SELECT id FROM Categories WHERE id = catID)) THEN
        SET newID = NULL;
        SET exitCode = 2; -- category doesn't exist.
    ELSE
        -- TODO: Insert a check that the user is part of a set and with a
        -- non-negative rating denoting that the user is allowed to insert.
        INSERT INTO ElementaryTerms (title, cat_id)
        VALUES (eTermTitle, catID);
        SELECT LAST_INSERT_ID() INTO newID;
        IF (userID != 0) THEN
            INSERT INTO Creators (term_t, term_id, user_id)
            VALUES ("e", newID, userID);
        END IF;
        SET exitCode = 0; -- insert.
    END IF;
    SET newCombID = CONCAT('e', CONV(newID, 10, 16));
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE insertOrFindRel (
    IN userCombID VARCHAR(17),
    IN subjCatCombID VARCHAR(17),
    IN objNoun VARCHAR(255),
    OUT newCombID VARCHAR(17),
    OUT exitCode TINYINT
)
BEGIN
    DECLARE subjCatID, userID, newID BIGINT UNSIGNED;
    CALL getConvID (subjCatCombID, subjCatID);
    CALL getConvID (userCombID, userID);

    SELECT id INTO newID
    FROM Relations
    WHERE (obj_noun = objNoun AND subj_cat_id = subjCatID);
    IF (newID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
    ELSEIF (NOT EXISTS (SELECT id FROM Categories WHERE id = subjCatID)) THEN
        SET newID = NULL;
        SET exitCode = 2; -- subject category doesn't exist.
    ELSE
        -- TODO: Insert a check that the user is part of a set and with a
        -- non-negative rating denoting that the user is allowed to insert.
        INSERT INTO Relations (obj_noun, subj_cat_id)
        VALUES (objNoun, subjCatID);
        SELECT LAST_INSERT_ID() INTO newID;
        IF (userID != 0) THEN
            INSERT INTO Creators (term_t, term_id, user_id)
            VALUES ("r", newID, userID);
        END IF;
        SET exitCode = 0; -- insert.
    END IF;
    SET newCombID = CONCAT('r', CONV(newID, 10, 16));
END //
DELIMITER ;








DELIMITER //
CREATE PROCEDURE insertText (
    IN userCombID VARCHAR(17),
    IN inStr TEXT,
    OUT newCombID VARCHAR(17),
    OUT exitCode TINYINT -- 0 is successful insertion.
)
BEGIN
    DECLARE userID, newID BIGINT UNSIGNED;
    CALL getConvID (userCombID, userID);

    SELECT id INTO newID
    FROM Texts
    WHERE (str = inStr);
    IF (newID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
    ELSE
        -- TODO: Insert a check that the user is part of a set and with a
        -- non-negative rating denoting that the user is allowed to insert.
        INSERT INTO Texts (str)
        VALUES (inStr);
        SELECT LAST_INSERT_ID() INTO newID;
        IF (userID != 0) THEN
            INSERT INTO Creators (term_t, term_id, user_id)
            VALUES ("t", newID, userID);
        END IF;
        SET exitCode = 0; -- insert.
    END IF;
    SET newCombID = CONCAT('t', CONV(newID, 10, 16));
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE insertBinary (
    IN userCombID VARCHAR(17),
    IN inBin BLOB,
    OUT newCombID VARCHAR(17),
    OUT exitCode TINYINT -- 0 is successful insertion.
)
BEGIN
    DECLARE userID, newID BIGINT UNSIGNED;
    CALL getConvID (userCombID, userID);

    SELECT id INTO newID
    FROM Binaries
    WHERE (bin = inBin);
    IF (newID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
    ELSE
        -- TODO: Insert a check that the user is part of a set and with a
        -- non-negative rating denoting that the user is allowed to insert.
        INSERT INTO Binaries (bin)
        VALUES (inBin);
        SELECT LAST_INSERT_ID() INTO newID;
        IF (userID != 0) THEN
            INSERT INTO Creators (term_t, term_id, user_id)
            VALUES ("b", newID, userID);
        END IF;
        SET exitCode = 0; -- insert.
    END IF;
    SET newCombID = CONCAT('t', CONV(newID, 10, 16));
END //
DELIMITER ;
