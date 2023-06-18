
SELECT "Input procedures";

-- DROP PROCEDURE inputOrChangeRating;
-- DROP PROCEDURE insertOrFindTerm;
-- DROP PROCEDURE private_insertUser;
-- DROP PROCEDURE insertText;
-- DROP PROCEDURE insertBinary;




DELIMITER //
CREATE PROCEDURE inputOrChangeRating (
    IN userID BIGINT UNSIGNED,
    IN predID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN ratVal VARBINARY(255),
    IN live_after TIME
)
BEGIN
    DECLARE exitCode TINYINT;
    DECLARE prevRatVal VARBINARY(255);

    SELECT rat_val INTO prevRatVal
    FROM SemanticInputs
    WHERE (
        user_id = userID AND
        pred_id = predID AND
        subj_id = subjID
    );

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
    -- RecentInputs --- and update SemanticInputs only then! ---
    -- and at some point also make an event to record
    -- recent inputs into RecordedInputs when there is long enough time
    -- between the last last recent input before that.
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
-- statement" relation with user 1 (where the rating then matches the user's
-- rating)..




DELIMITER //
CREATE PROCEDURE insertOrFindTerm (
    IN userID BIGINT UNSIGNED,
    IN cxtID BIGINT UNSIGNED,
    IN defStr VARCHAR(255),
    IN defTermID BIGINT UNSIGNED
)
BEGIN
    DECLARE outID BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;

    IF (cxtID = 0) THEN
        SET cxtID = NULL;
    END IF;
    IF (defTermID = 0) THEN
        SET defTermID = NULL;
    END IF;

    SELECT id INTO outID
    FROM Terms
    WHERE (
        context_id <=> cxtID AND
        def_str = defStr AND
        def_term_id <=> defTermID
    );
    IF (outID IS NOT NULL) THEN
        SET exitCode = 1; -- find.
    ELSEIF (cxtID <= 4) THEN
        SET exitCode = 2; -- user is not permitted to add to this context.
    ELSE
        INSERT INTO Terms (context_id, def_str, def_term_id)
        VALUES (cxtID, defStr, defTermID);
        SELECT LAST_INSERT_ID() INTO outID;
        INSERT INTO PrivateCreators (term_id, user_id)
        VALUES (outID, userID);
        SET exitCode = 0; -- insert.
    END IF;
    SELECT outID, exitCode;
END //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE private_insertUser (
    IN username VARCHAR(255),
    IN textStr TEXT
)
BEGIN
    DECLARE outID BIGINT UNSIGNED;

    INSERT INTO Terms (context_id, def_str, def_term_id)
    VALUES (3, username, NULL);
    SELECT LAST_INSERT_ID() INTO outID;
    INSERT INTO Users (id, username)
    VALUES (outID, username);
    SELECT outID, 0; -- insert.
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE insertText (
    IN userID BIGINT UNSIGNED,
    IN metaStr VARCHAR(255),
    IN textStr TEXT
)
BEGIN
    DECLARE outID BIGINT UNSIGNED;

    INSERT INTO Terms (context_id, def_str, def_term_id)
    VALUES (4, metaStr, NULL);
    SELECT LAST_INSERT_ID() INTO outID;
    INSERT INTO Texts (id, str)
    VALUES (outID, textStr);
    INSERT INTO PrivateCreators (term_id, user_id)
    VALUES (outID, userID);
    SELECT outID, 0; -- insert.
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE insertBinary (
    IN userID BIGINT UNSIGNED,
    IN metaStr VARCHAR(255),
    IN bin TEXT
)
BEGIN
    DECLARE outID BIGINT UNSIGNED;

    INSERT INTO Terms (context_id, def_str, def_term_id)
    VALUES (5, metaStr, NULL);
    SELECT LAST_INSERT_ID() INTO outID;
    INSERT INTO Binaries (id, bin)
    VALUES (outID, bin);
    INSERT INTO PrivateCreators (term_id, user_id)
    VALUES (outID, userID);
    SELECT outID, 0; -- insert.
END //
DELIMITER ;
