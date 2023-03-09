-- USE mydatabase;







DROP PROCEDURE insertOrFindCat;
DROP PROCEDURE insertOrFindStd;
DROP PROCEDURE insertOrFindRel;




-- DELETE FROM Sets;
-- DELETE FROM SemanticInputs;
--
-- DELETE FROM UserGroups;
-- DELETE FROM Users;
--
-- TRUNCATE TABLE Categories; -- slow..
-- DELETE FROM StandardTerms;
-- DELETE FROM Relations;
-- DELETE FROM KeywordStrings;
-- DELETE FROM SavedSets;
-- DELETE FROM Texts;
-- DELETE FROM Lists;
-- DELETE FROM Binaries;
--
-- DELETE FROM Creators;







DELIMITER //
CREATE PROCEDURE insertOrFindCat (
    IN catTitle TEXT,
    IN subjCatID BIGINT UNSIGNED,
    IN userID BIGINT UNSIGNED,
    OUT newID BIGINT UNSIGNED,
    OUT exitCode TINYINT -- 0 is successful insertion, 1 is successful find.
)
BEGIN
    SELECT id INTO newID
    FROM Categories
    WHERE (title = catTitle AND super_cat_id = subjCatID);
    IF (newID IS NULL) THEN
        INSERT INTO Categories (title, super_cat_id)
        VALUES (catTitle, subjCatID);
        SELECT LAST_INSERT_ID() INTO newID;
        IF (userID IS NOT NULL) THEN
            -- NOTE: This procedure assumes that user_id is correct if not null.
            INSERT INTO Creators (term_t, term_id, user_id)
            VALUES ("c", newID, userID);
        END IF;
        SET exitCode = 0; -- insert.
    ELSE
        SET exitCode = 1; -- find.
    END IF;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertOrFindStd (
    IN stdTitle TEXT,
    IN catID BIGINT UNSIGNED,
    IN userID BIGINT UNSIGNED,
    OUT newID BIGINT UNSIGNED,
    OUT exitCode TINYINT -- 0 is successful insertion, 1 is successful find.
)
BEGIN
    SELECT id INTO newID
    FROM StandardTerms
    WHERE (title = stdTitle AND cat_id = catID);
    IF (newID IS NULL) THEN
        INSERT INTO StandardTerms (title, cat_id)
        VALUES (stdTitle, catID);
        SELECT LAST_INSERT_ID() INTO newID;
        IF (userID IS NOT NULL) THEN
            -- NOTE: This procedure assumes that user_id is correct if not null.
            INSERT INTO Creators (term_t, term_id, user_id)
            VALUES ("s", newID, userID);
        END IF;
        SET exitCode = 0; -- insert.
    ELSE
        SET exitCode = 1; -- find.
    END IF;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE insertOrFindRel (
    IN objNoun TEXT,
    IN subjCatID BIGINT UNSIGNED,
    IN userID BIGINT UNSIGNED,
    OUT newID BIGINT UNSIGNED,
    OUT exitCode TINYINT -- 0 is successful insertion, 1 is successful find.
)
BEGIN
    SELECT id INTO newID
    FROM Relations
    WHERE (
        obj_noun = objNoun AND
        subj_cat_id = subjCatID
    );
    IF (newID IS NULL) THEN
        INSERT INTO Relations (obj_noun, subj_cat_id)
        VALUES (objNoun, subjCatID);
        SELECT LAST_INSERT_ID() INTO newID;
        IF (userID IS NOT NULL) THEN
            -- NOTE: This procedure assumes that user_id is correct if not null.
            INSERT INTO Creators (term_t, term_id, user_id)
            VALUES ("r", newID, userID);
        END IF;
        SET exitCode = 0; -- insert.
    ELSE
        SET exitCode = 1; -- find.
    END IF;
END //
DELIMITER ;








DELIMITER //
CREATE PROCEDURE insertTxt (
    IN textStr TEXT,
    IN userID BIGINT UNSIGNED,
    OUT newID BIGINT UNSIGNED,
    OUT exitCode TINYINT -- 0 is successful insertion.
)
BEGIN
    INSERT INTO Texts (str) VALUES (textStr);
    SELECT LAST_INSERT_ID() INTO newID;
    IF (userID IS NOT NULL) THEN
        -- NOTE: This procedure assumes that user_id is correct if not null.
        INSERT INTO Creators (term_t, term_id, user_id)
        VALUES ("t", newID, userID);
    END IF;
    SET exitCode = 0; -- insert.
END //
DELIMITER ;
