
SELECT "Input procedures";

-- DROP PROCEDURE inputOrChangeRating;
-- DROP PROCEDURE insertOrFindContext;
-- DROP PROCEDURE insertOrFindTerm;
-- DROP PROCEDURE insertOrFindKeywordString;
-- DROP PROCEDURE insertOrFindPattern;
-- DROP PROCEDURE insertText;
-- DROP PROCEDURE insertBinary;
-- DROP PROCEDURE insertOrFindList;




DELIMITER //
CREATE PROCEDURE inputOrChangeRating (
    IN userID BIGINT UNSIGNED,
    IN predID BIGINT UNSIGNED,
    IN subjType CHAR(1),
    IN subjID BIGINT UNSIGNED,
    IN ratValHex VARCHAR(510),
    IN live_after TIME
)
BEGIN
    DECLARE exitCode TINYINT;
    DECLARE prevRatVal, ratVal VARBINARY(255);

    IF (ratValHex = "") THEN
        SET ratValHex = NULL;
    END IF;
    SET ratVal = UNHEX(ratValHex);

    SELECT rat_val INTO prevRatVal
    FROM SemanticInputs
    WHERE (
        subj_t = subjType AND
        subj_id = subjID AND
        pred_id = predID AND
        user_id = userID
    );

    IF (ratVal IS NOT NULL AND prevRatVal IS NULL) THEN
        INSERT INTO SemanticInputs (
            user_id,
            pred_id,
            subj_t,
            rat_val,
            subj_id
        )
        VALUES (
            userID,
            predID,
            subjType,
            ratVal,
            subjID
        );
        SET exitCode = 0; -- no previous rating.
    ELSEIF (ratVal IS NOT NULL AND prevRatVal IS NOT NULL) THEN
        UPDATE SemanticInputs
        SET rat_val = ratVal
        WHERE (
            subj_t = subjType AND
            subj_id = subjID AND
            pred_id = predID AND
            user_id = userID
        );
        SET exitCode = 1; -- a previous rating was updated.
    ELSEIF (ratVal IS NULL AND prevRatVal IS NOT NULL) THEN
        DELETE FROM SemanticInputs
        WHERE (
            subj_t = subjType AND
            subj_id = subjID AND
            pred_id = predID AND
            user_id = userID AND
            rat_val = ratVal
        );
        SET exitCode = 2; -- a previous rating was deleted.
    ELSE
        SET exitCode = 3; -- trying to delete a non-existing rating.
    END IF;

    -- TODO: Change this to update PrivateRecentInputs instead, make a
    -- scheduled event to move private recent inputs into (the public)
    -- RecentInputs --- and update SemanticInputs only then! ---
    -- and at some point also make an event to record
    -- recent inputs into RecordedInputs when there is long enough time
    -- between the last last recent input before that.
    SET live_after = NULL; -- (not implemented yet)
    INSERT INTO RecentInputs (
        user_id,
        pred_id,
        subj_t,
        rat_val,
        subj_id
    )
    VALUES (
        userID,
        predID,
        subjType,
        ratVal,
        subjID
    );

    SELECT NULL AS outID, exitCode;
    -- SELECT HEX(prevRatVal) AS prevRatVal, exitCode;
END //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE insertOrFindContext (
    IN userID BIGINT UNSIGNED,
    IN parentCxtID BIGINT UNSIGNED,
    IN cxtTitle VARCHAR(255)
)
BEGIN
    DECLARE outID BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;

    SELECT id INTO outID
    FROM SemanticContexts
    WHERE (
        parent_context_id = parentCxtID AND
        title = cxtTitle
    );
    IF (outID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
    ELSEIF (
        NOT EXISTS (SELECT id FROM SemanticContexts WHERE id = parentCxtID)
    ) THEN
        SET exitCode = 2; -- parent context does not exist.
    ELSE
        INSERT INTO SemanticContexts (parent_context_id, title)
        VALUES (parentCxtID, cxtTitle);
        SELECT LAST_INSERT_ID() INTO outID;
        INSERT INTO Creators (entity_t, entity_id, user_id)
        VALUES ("c", outID, userID);
        SET exitCode = 0; -- insert.
    END IF;
    SELECT outID, exitCode;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertOrFindTerm (
    IN userID BIGINT UNSIGNED,
    IN cxtID BIGINT UNSIGNED,
    IN termTitle VARCHAR(255),
    IN specType CHAR(1),
    IN specID BIGINT UNSIGNED
)
BEGIN
    DECLARE outID BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;

    IF (specID = 0) THEN
        SET specID = NULL;
    END IF;

    SELECT id INTO outID
    FROM Terms
    WHERE (
        context_id = cxtID AND
        spec_entity_t = specType AND
        spec_entity_id = specID AND
        title = termTitle
    );
    IF (outID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
    ELSEIF (
        NOT EXISTS (SELECT id FROM SemanticContexts WHERE id = cxtID)
    ) THEN
        SET exitCode = 2; -- context does not exist.
    ELSE
        INSERT INTO Terms (context_id, title, spec_entity_t, spec_entity_id)
        VALUES (cxtID, termTitle, specType, specID);
        SELECT LAST_INSERT_ID() INTO outID;
        INSERT INTO Creators (entity_t, entity_id, user_id)
        VALUES ("t", outID, userID);
        SET exitCode = 0; -- insert.
    END IF;
    SELECT outID, exitCode;
END //
DELIMITER ;






DELIMITER //
CREATE PROCEDURE insertOrFindList (
    IN userID BIGINT UNSIGNED,
    IN elemTypeStr VARCHAR(31),
    IN elemIDHexStr VARCHAR(496),
    IN tailID BIGINT UNSIGNED
)
BEGIN
    DECLARE outID BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;
    DECLARE elemIDs VARBINARY(248);
    SET elemIDs = UNHEX(elemIDHexStr);

    IF (tailID = 0) THEN
        SET tailID = NULL;
    END IF;

    SELECT id INTO outID
    FROM Lists
    WHERE (elem_ts = elemTypeStr AND elem_ids = elemIDs AND tail_id = tailID);
    IF (outID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
    ELSE
        INSERT INTO Lists (elem_ts, elem_ids, tail_id)
        VALUES (elemTypeStr, elemIDs, tailID);
        SELECT LAST_INSERT_ID() INTO outID;
        INSERT INTO Creators (entity_t, entity_id, user_id)
        VALUES ("l", outID, userID);
        SET exitCode = 0; -- insert.
    END IF;
    SELECT outID, exitCode;
END //
DELIMITER ;






DELIMITER //
CREATE PROCEDURE insertOrFindPattern (
    IN userID BIGINT UNSIGNED,
    IN s VARCHAR(768)
)
BEGIN
    DECLARE outID BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;

    SELECT id INTO outID
    FROM Patterns
    WHERE str = s;
    IF (outID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
    ELSE
        INSERT INTO Patterns (str)
        VALUES (s);
        SELECT LAST_INSERT_ID() INTO outID;
        INSERT INTO Creators (entity_t, entity_id, user_id)
        VALUES ("p", outID, userID);
        SET exitCode = 0; -- insert.
    END IF;
    SELECT outID, exitCode;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE insertOrFindKeywordString (
    IN userID BIGINT UNSIGNED,
    IN s VARCHAR(768)
)
BEGIN
    DECLARE outID BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;

    SELECT id INTO outID
    FROM KeywordStrings
    WHERE str = s;
    IF (outID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
    ELSE
        INSERT INTO KeywordStrings (str)
        VALUES (s);
        SELECT LAST_INSERT_ID() INTO outID;
        INSERT INTO Creators (entity_t, entity_id, user_id)
        VALUES ("k", outID, userID);
        SET exitCode = 0; -- insert.
    END IF;
    SELECT outID, exitCode;
END //
DELIMITER ;






DELIMITER //
CREATE PROCEDURE insertText (
    IN userID BIGINT UNSIGNED,
    IN s TEXT
)
BEGIN
    DECLARE outID BIGINT UNSIGNED;

    INSERT INTO Texts (str)
    VALUES (s);
    SELECT LAST_INSERT_ID() INTO outID;
    INSERT INTO Creators (entity_t, entity_id, user_id)
    VALUES ("x", outID, userID);
    SELECT outID, 0; -- insert.
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
    DECLARE outID BIGINT UNSIGNED;

    INSERT INTO Binaries (bin)
    VALUES (b);
    SELECT LAST_INSERT_ID() INTO outID;
    INSERT INTO Creators (entity_t, entity_id, user_id)
    VALUES ("b", outID, userID);
    SELECT outID, 0; -- insert.
END //
DELIMITER ;
