

SELECT "term_inserts";


DROP PROCEDURE insertOrFindCat;
DROP PROCEDURE insertOrFindETerm;
DROP PROCEDURE insertOrFindRel;

DROP PROCEDURE insertText;






DELIMITER //
CREATE PROCEDURE insertOrFindCat (
    IN catTitle VARCHAR(255),
    IN superCatCombID VARCHAR(17),
    IN userCombID VARCHAR(17),
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
    ELSE
        IF (NOT EXISTS (SELECT id FROM Categories WHERE id = superCatID)) THEN
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
    END IF;
    SET newCombID = CONCAT('c', CONV(newID, 10, 16));
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertOrFindETerm (
    IN eTermTitle VARCHAR(255),
    IN catCombID VARCHAR(17),
    IN userCombID VARCHAR(17),
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
    ELSE
        IF (NOT EXISTS (SELECT id FROM Categories WHERE id = catID)) THEN
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
    END IF;
    SET newCombID = CONCAT('e', CONV(newID, 10, 16));
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE insertOrFindRel (
    IN objNoun VARCHAR(255),
    IN subjCatCombID VARCHAR(17),
    IN userCombID VARCHAR(17),
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
    ELSE
        IF (NOT EXISTS (SELECT id FROM Categories WHERE id = subjCatID)) THEN
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
    END IF;
    SET newCombID = CONCAT('r', CONV(newID, 10, 16));
END //
DELIMITER ;








DELIMITER //
CREATE PROCEDURE insertText (
    IN textStr TEXT,
    IN userCombID VARCHAR(17),
    OUT newCombID VARCHAR(17),
    OUT exitCode TINYINT -- 0 is successful insertion.
)
BEGIN
    DECLARE userID, newID BIGINT UNSIGNED;
    CALL getConvID (userCombID, userID);

    SELECT id INTO newID
    FROM Texts
    WHERE (str = textStr);
    IF (newID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
    ELSE
        -- TODO: Insert a check that the user is part of a set and with a
        -- non-negative rating denoting that the user is allowed to insert.
        INSERT INTO Texts (str)
        VALUES (textStr);
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
