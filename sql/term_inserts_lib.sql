

SELECT "term_inserts";


-- DROP PROCEDURE insertOrFindCat;
-- DROP PROCEDURE insertOrFindETerm;
-- DROP PROCEDURE insertOrFindRel;
--
-- DROP PROCEDURE insertTxt;







-- TODO: I sorta started to correct insertOrFindCat(), but I'll finish it later.

DELIMITER //
CREATE PROCEDURE insertOrFindCat (
    IN catTitle TEXT,
    IN superCatCombID VARCHAR(17),
    IN userCombID VARCHAR(17),
    OUT newCombID VARCHAR(17),
    OUT exitCode TINYINT -- 0 is successful insertion, 1 is successful find.
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
            INSERT INTO Categories (title, super_cat_id)
            VALUES (catTitle, superCatID);
            SELECT LAST_INSERT_ID() INTO newID;
            -- NOTE: This procedure assumes that user_id is correct if not null.
            IF (userID IS NOT NULL) THEN
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
    IN eTermTitle TEXT,
    IN catIDHex VARCHAR(16),
    IN userIDHex VARCHAR(16),
    OUT newIDHex VARCHAR(16),
    OUT exitCode TINYINT -- 0 is successful insertion, 1 is successful find.
)
BEGIN
    DECLARE catID, userID, newID BIGINT UNSIGNED;
    SET catID = CONV(catIDHex, 16, 10);
    SET userID = CONV(userIDHex, 16, 10);

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
            INSERT INTO ElementaryTerms (title, cat_id)
            VALUES (eTermTitle, catID);
            SELECT LAST_INSERT_ID() INTO newID;
            -- NOTE: This procedure assumes that user_id is correct if not null.
            IF (userID IS NOT NULL) THEN
                INSERT INTO Creators (term_t, term_id, user_id)
                VALUES ("s", newID, userID);
            END IF;
            SET exitCode = 0; -- insert.
        END IF;
    END IF;
    SET newIDHex = CONV(newID, 10, 16);
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE insertOrFindRel (
    IN objNoun TEXT,
    IN subjCatIDHex VARCHAR(16),
    IN userIDHex VARCHAR(16),
    OUT newIDHex VARCHAR(16),
    OUT exitCode TINYINT -- 0 is successful insertion, 1 is successful find.
)
BEGIN
    DECLARE subjCatID, userID, newID BIGINT UNSIGNED;
    SET subjCatID = CONV(subjCatIDHex, 16, 10);
    SET userID = CONV(userIDHex, 16, 10);

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
            INSERT INTO Relations (obj_noun, subj_cat_id)
            VALUES (objNoun, subjCatID);
            SELECT LAST_INSERT_ID() INTO newID;
            -- NOTE: This procedure assumes that user_id is correct if not null.
            IF (userID IS NOT NULL) THEN
                INSERT INTO Creators (term_t, term_id, user_id)
                VALUES ("r", newID, userID);
            END IF;
            SET exitCode = 0; -- insert.
        END IF;
    END IF;
    SET newIDHex = CONV(newID, 10, 16);
END //
DELIMITER ;








DELIMITER //
CREATE PROCEDURE insertTxt (
    IN textStr TEXT,
    IN userIDHex VARCHAR(16),
    OUT newIDHex VARCHAR(16),
    OUT exitCode TINYINT -- 0 is successful insertion.
)
BEGIN
    DECLARE userID, newID BIGINT UNSIGNED;
    SET userID = CONV(userIDHex, 16, 10);

    INSERT INTO Texts (str) VALUES (textStr);
    SELECT LAST_INSERT_ID() INTO newID;
    IF (userID IS NOT NULL) THEN
        -- NOTE: This procedure assumes that user_id is correct if not null.
        INSERT INTO Creators (term_t, term_id, user_id)
        VALUES ("t", newID, userID);
    END IF;
    SET exitCode = 0; -- insert.
    SET newIDHex = CONV(newID, 10, 16);
END //
DELIMITER ;
