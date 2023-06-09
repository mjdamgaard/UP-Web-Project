
SELECT "Input procedures";

-- DROP PROCEDURE inputOrChangeRating;
-- DROP PROCEDURE insertOrFindContext;
-- DROP PROCEDURE insertOrFindTerm;
-- DROP PROCEDURE insertText;
-- DROP PROCEDURE insertBinary;




DELIMITER //
CREATE PROCEDURE inputOrChangeRating (
    IN userID BIGINT UNSIGNED,
    IN predID BIGINT UNSIGNED,
    IN cxtID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN ratValHex VARCHAR(510),
    IN live_after TIME
)
BEGIN
    DECLARE exitCode TINYINT;
    DECLARE ratVal, prevRatVal VARBINARY(255);
    SET ratVal = CONV(ratValHex, 16, 10);

    SELECT rat_val INTO prevRatVal
    FROM SemanticInputs
    WHERE (
        context_id = cxtID AND
        subj_id = subjID AND
        pred_id = predID AND
        user_id = userID
    );

    IF (ratVal IS NOT NULL AND prevRatVal IS NULL) THEN
        INSERT INTO SemanticInputs (
            user_id,
            pred_id,
            context_id,
            rat_val,
            subj_id
        )
        VALUES (
            userID,
            predID,
            cxtID,
            ratVal,
            subjID
        );
        SET exitCode = 0; -- no previous rating.
    ELSEIF (ratVal IS NOT NULL AND prevRatVal IS NOT NULL) THEN
        UPDATE SemanticInputs
        SET rat_val = ratVal
        WHERE (
            context_id = cxtID AND
            subj_id = subjID AND
            pred_id = predID AND
            user_id = userID
        );
        SET exitCode = 1; -- a previous rating was updated.
    ELSEIF (ratVal IS NULL AND prevRatVal IS NOT NULL) THEN
        DELETE FROM SemanticInputs
        WHERE (
            context_id = cxtID AND
            subj_id = subjID AND
            pred_id = predID AND
            user_id = userID
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
        context_id,
        rat_val,
        subj_id
    )
    VALUES (
        userID,
        predID,
        cxtID,
        ratVal,
        subjID
    );

    SELECT subjID AS outID, exitCode;
    -- SELECT HEX(prevRatVal) AS prevRatVal, exitCode;
END //
DELIMITER ;
-- TODO: When moving the ratings from PrivateRecentInputs to the public ones
-- also implement an automatic procedure to rate a "this user has rated this
-- statement" relation with user 1 (where the rating then matches the user's
-- rating)..




DELIMITER //
CREATE PROCEDURE insertOrFindContext (
    IN userID BIGINT UNSIGNED,
    IN parentCxtID BIGINT UNSIGNED,
    IN str VARCHAR(255)
)
BEGIN
    DECLARE outID BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;

    SELECT id INTO outID
    FROM SemanticContexts
    WHERE (
        parent_context_id = parentCxtID AND
        def_str = str
    );
    IF (outID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
    ELSEIF (
        NOT EXISTS (SELECT id FROM SemanticContexts WHERE id = parentCxtID)
    ) THEN
        SET exitCode = 2; -- parent context does not exist.
    ELSE
        INSERT INTO SemanticContexts (parent_context_id, def_str)
        VALUES (parentCxtID, str);
        SELECT LAST_INSERT_ID() INTO outID;
        INSERT INTO PrivateCreators (entity_t, entity_id, user_id)
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
    IN str VARCHAR(255),
    IN defEntType CHAR(1),
    IN defEntID BIGINT UNSIGNED
)
BEGIN
    DECLARE outID BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;

    IF (defEntID = 0) THEN
        SET defEntID = NULL;
    END IF;

    SELECT id INTO outID
    FROM Terms
    WHERE (
        context_id = cxtID AND
        def_entity_t = defEntType AND
        def_entity_id = defEntID AND
        def_str = str
    );
    IF (outID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
    ELSEIF (
        NOT EXISTS (SELECT id FROM SemanticContexts WHERE id = cxtID)
    ) THEN
        SET exitCode = 2; -- context does not exist.
    ELSE
        -- TODO: Insert a check here to see if the Context is not owned by
        -- another user..

        INSERT INTO Terms (context_id, def_str, def_entity_t, def_entity_id)
        VALUES (cxtID, str, defEntType, defEntID);
        SELECT LAST_INSERT_ID() INTO outID;
        INSERT INTO PrivateCreators (entity_t, entity_id, user_id)
        VALUES ("t", outID, userID);
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
    INSERT INTO PrivateCreators (entity_t, entity_id, user_id)
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
    INSERT INTO PrivateCreators (entity_t, entity_id, user_id)
    VALUES ("b", outID, userID);
    SELECT outID, 0; -- insert.
END //
DELIMITER ;
