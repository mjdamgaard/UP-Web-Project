
SELECT "Input procedures";

-- DROP PROCEDURE inputOrChangeRating;
-- DROP PROCEDURE insertOrFindTerm;
DROP PROCEDURE insertOrFindContext;
-- DROP PROCEDURE insertOrFindSubcontext;
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
END //
DELIMITER ;
-- TODO: When moving the ratings from PrivateRecentInputs to the public ones
-- also implement an automatic procedure to rate a "this user has rated this
-- statement" relation with user 1 (where the rating then matches the user's
-- rating)..




DELIMITER //
CREATE PROCEDURE insertOrFindTerm (
    IN userID BIGINT UNSIGNED,
    IN cxtID BIGINT UNSIGNED,
    IN str VARCHAR(255),
    IN entID BIGINT UNSIGNED,
    IN derivedEntType CHAR(1)
)
BEGIN
    DECLARE outID BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;
    DECLARE cxtStr VARCHAR(255),
    DECLARE entType CHAR(1);
    DECLARE username VARCHAR(50);

    SELECT (def_str, derived_term_def_entity_t)
    INTO (cxtStr, entType)
    FROM Terms
    WHERE id = cxtID;

    IF (entID = 0 OR entType = '0') THEN
        SET entID = NULL;
    END IF;

    SELECT id INTO outID
    FROM Terms
    WHERE (
        context_id = cxtID AND
        def_str = str AND
        def_entity_id = entID AND
        derived_term_def_entity_t = derivedEntType
    );
    IF (outID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
    ELSEIF (entType IS NULL) THEN
        SET exitCode = 2; -- context does not exist.
    ELSEIF (cxtStr > "Added by user: " AND cxtStr < "Added by user:!") THEN
        SELECT username INTO username
        FROM Users
        WHERE id = userID;
        IF (cxtStr != CONCAT("Added by user: ", username)) THEN
            SET exitCode = 3; -- user is not permitted to add to this context.
        ELSE
            INSERT INTO Terms (
                context_id, def_str, def_entity_id, derived_term_def_entity_t
            )
            VALUES (
                cxtID, str, entID, derivedEntType
            );
            SELECT LAST_INSERT_ID() INTO outID;
            INSERT INTO PrivateCreators (term_id, user_id)
            VALUES (outID, userID);
            SET exitCode = 0; -- insert.
        END IF;
    ELSE
        INSERT INTO Terms (
            context_id, def_str, def_entity_id, derived_term_def_entity_t
        )
        VALUES (
            cxtID, str, entID, derivedEntType
        );
        SELECT LAST_INSERT_ID() INTO outID;
        INSERT INTO PrivateCreators (term_id, user_id)
        VALUES (outID, userID);
        SET exitCode = 0; -- insert.
    END IF;
    SELECT outID, exitCode;
END //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE insertOrFindSubcontext (
    IN userID BIGINT UNSIGNED,
    IN parentCxtID BIGINT UNSIGNED,
    IN str VARCHAR(255),
    IN derivedEntType CHAR(1)
)
BEGIN
    CALL insertOrFindTerm(userID, 2, str, parentCxtID, derivedEntType);
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
