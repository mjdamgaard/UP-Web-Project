
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
    OUT outID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
BEGIN
    SELECT id INTO outID
    FROM Sets
    WHERE (
        user_id = userID AND
        subj_id = subjID AND
        rel_id = relID
    );
    IF (outID IS NULL) THEN
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
        SELECT LAST_INSERT_ID() INTO outID;
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
    OUT outID BIGINT UNSIGNED,
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
            UPDATE Sets
            SET elem_num = prevElemNum + 1
            WHERE id = setID;
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
            UPDATE Sets
            SET elem_num = prevElemNum - 1
            WHERE id = setID;
            SET exitCode = 0; -- success(ful deletion of previous rating).
        ELSE
            SET exitCode = 1; -- trying to delete a non-existing rating.
        END IF;
    END IF;
END //
DELIMITER ;








DELIMITER //
CREATE PROCEDURE insertOrFindCat (
    IN userID BIGINT UNSIGNED,
    IN superCatID BIGINT UNSIGNED,
    IN catTitle VARCHAR(255),
    OUT outID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
BEGIN
    SELECT id INTO outID
    FROM Categories
    WHERE (title = catTitle AND super_cat_id = superCatID);
    IF (outID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
    ELSEIF (NOT EXISTS (SELECT id FROM Categories WHERE id = superCatID)) THEN
        SET exitCode = 2; -- super category does not exist.
    ELSE
        INSERT INTO Categories (title, super_cat_id)
        VALUES (catTitle, superCatID);
        SELECT LAST_INSERT_ID() INTO outID;
        INSERT INTO Creators (term_t, term_id, user_id)
        VALUES ("c", outID, userID);
        SET exitCode = 0; -- insert.
    END IF;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertOrFindETerm (
    IN userID BIGINT UNSIGNED,
    IN catID BIGINT UNSIGNED,
    IN termTitle VARCHAR(255),
    OUT outID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
BEGIN
    SELECT id INTO outID
    FROM Terms
    WHERE (title = termTitle AND cat_id = catID);
    IF (outID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
    ELSEIF (NOT EXISTS (SELECT id FROM Categories WHERE id = catID)) THEN
        SET exitCode = 2; -- category doesn't exist.
    ELSE
        INSERT INTO Terms (title, cat_id)
        VALUES (termTitle, catID);
        SELECT LAST_INSERT_ID() INTO outID;
        INSERT INTO Creators (term_t, term_id, user_id)
        VALUES ("t", outID, userID);
        SET exitCode = 0; -- insert.
    END IF;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE insertOrFindRel (
    IN userID BIGINT UNSIGNED,
    IN subjType CHAR(1),
    IN objType CHAR(1),
    IN objNoun VARCHAR(255),
    OUT outID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
BEGIN
    SELECT id INTO outID
    FROM Relations
    WHERE (subj_t = subjType AND obj_t = objType AND obj_noun = objNoun);
    IF (outID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
    ELSE
        INSERT INTO Relations (subj_t, obj_t, obj_noun)
        VALUES (subjType, objType, objNoun);
        SELECT LAST_INSERT_ID() INTO outID;
        INSERT INTO Creators (term_t, term_id, user_id)
        VALUES ("r", outID, userID);
        SET exitCode = 0; -- insert.
    END IF;
END //
DELIMITER ;







DELIMITER //
CREATE PROCEDURE insertOrFindKeywordString (
    IN userID BIGINT UNSIGNED,
    IN s VARCHAR(768),
    OUT outID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
BEGIN
    SELECT id INTO outID
    FROM KeywordStrings
    WHERE str = s;
    IF (outID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
    ELSE
        INSERT INTO KeywordStrings (str)
        VALUES (s);
        SELECT LAST_INSERT_ID() INTO outID;
        INSERT INTO Creators (term_t, term_id, user_id)
        VALUES ("k", outID, userID);
        SET exitCode = 0; -- insert.
    END IF;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE insertOrFindPattern (
    IN userID BIGINT UNSIGNED,
    IN s VARCHAR(768),
    OUT outID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
BEGIN
    SELECT id INTO outID
    FROM Patterns
    WHERE str = s;
    IF (outID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
    ELSE
        INSERT INTO Patterns (str)
        VALUES (s);
        SELECT LAST_INSERT_ID() INTO outID;
        INSERT INTO Creators (term_t, term_id, user_id)
        VALUES ("p", outID, userID);
        SET exitCode = 0; -- insert.
    END IF;
END //
DELIMITER ;







DELIMITER //
CREATE PROCEDURE insertText (
    IN userID BIGINT UNSIGNED,
    IN s TEXT,
    OUT outID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
BEGIN
    INSERT INTO Texts (str)
    VALUES (s);
    SELECT LAST_INSERT_ID() INTO outID;
    INSERT INTO Creators (term_t, term_id, user_id)
    VALUES ("x", outID, userID);
    SET exitCode = 0; -- insert.
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE insertBinary (
    IN userID BIGINT UNSIGNED,
    IN b TEXT,
    OUT outID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
BEGIN
    INSERT INTO Binaries (bin)
    VALUES (b);
    SELECT LAST_INSERT_ID() INTO outID;
    INSERT INTO Creators (term_t, term_id, user_id)
    VALUES ("b", outID, userID);
    SET exitCode = 0; -- insert.
END //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE insertOrFindList (
    IN userID BIGINT UNSIGNED,
    IN elemTypeStr VARCHAR(31),
    IN elemIDHexStr VARCHAR(496),
    IN tailID BIGINT UNSIGNED,
    OUT outID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
BEGIN
    DECLARE elemIDs VARBINARY(248);
    SET elemIDs = UNHEX(elemIDHexStr);

    SELECT id INTO outID
    FROM Lists
    WHERE (elem_ts = elemTypeStr AND elem_ids = elemIDs AND tail_id = tailID);
    IF (outID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
    ELSE
        INSERT INTO Lists (elem_ts, elem_ids, tail_id)
        VALUES (elemTypeStr, elemIDs, tailID);
        SELECT LAST_INSERT_ID() INTO outID;
        INSERT INTO Creators (term_t, term_id, user_id)
        VALUES ("l", outID, userID);
        SET exitCode = 0; -- insert.
    END IF;
END //
DELIMITER ;
