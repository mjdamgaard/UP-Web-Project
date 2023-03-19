



-- DROP PROCEDURE findOrCreateSet;
-- DROP PROCEDURE insertOrUpdateRecentInput;
-- DROP PROCEDURE inputOrChangeRating;




DELIMITER //
CREATE PROCEDURE findOrCreateSet (
    IN userType CHAR(1),
    IN userIDHex VARCHAR(16),
    IN subjType CHAR(1),
    IN subjIDHex VARCHAR(16),
    IN relIDHex VARCHAR(16),
    OUT newID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
BEGIN
    DECLARE userID, subjID, relID BIGINT UNSIGNED;
    SET userID = CONV(userIDHex, 16, 10);
    SET subjID = CONV(subjIDHex, 16, 10);
    SET relID = CONV(relIDHex, 16, 10);

    SELECT id INTO newID
    FROM Sets
    WHERE (
        user_t = userType AND
        user_id = userID AND
        subj_t = subjType AND
        subj_id = subjID AND
        rel_id = relID
    );
    IF (newID IS NULL) THEN
        INSERT INTO Sets (
            user_t,
            user_id,
            subj_t,
            subj_id,
            rel_id,
            elem_num
        )
        VALUES (
            userType,
            userID,
            subjType,
            subjID,
            relID,
            0
        );
        SELECT LAST_INSERT_ID() INTO newID;
        SET exitCode = 1; -- create.
    ELSE
        SET exitCode = 0; -- find.
    END IF;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE insertOrUpdateRecentInput (
    IN setID BIGINT UNSIGNED,
    IN objType CHAR(1),
    IN objID BIGINT UNSIGNED,
    IN ratingValHex VARCHAR(510),
    IN previousRatingHex VARCHAR(510)
)
BEGIN
    DECLARE existsPriorChangeToday TINYINT;
    DECLARE currentDate DATE;
    DECLARE ratingVal, previousRating VARBINARY(255);
    SET ratingVal = UNHEX(ratingValHex);
    SET previousRating = UNHEX(previousRatingHex);
    SET currentDate = CURDATE();
    SET existsPriorChangeToday = EXISTS (
        SELECT * FROM RecentInputs
        WHERE (
            set_id = setID AND
            changed_at = currentDate AND
            obj_t = objType AND
            obj_id = objID
        )
        -- If this procedure is not called from any other procedures than
        -- inputOrChangeRating() below (as intended!), no race conditions
        -- are possible due to the FOR UPDATE lock on (setID, objType, objID)
        -- in that procedure.
    );

    IF (existsPriorChangeToday) THEN
        UPDATE RecentInputs
        SET new_rat_val = ratingVal
        WHERE (
            set_id = setID AND
            changed_at = currentDate AND
            obj_t = objType AND
            obj_id = objID
        );
    ELSE
        INSERT INTO RecentInputs (
            set_id,
            changed_at,
            obj_t,
            obj_id,
            old_rat_val,
            new_rat_val
        ) VALUES (
            setID,
            currentDate,
            objType,
            objID,
            previousRating, -- possibly NULL.
            ratingVal  -- also possibly NULL.
        );
    END IF;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE inputOrChangeRating (
    IN userType CHAR(1),
    IN userIDHex VARCHAR(16),
    IN subjType CHAR(1),
    IN subjIDHex VARCHAR(16),
    IN relIDHex VARCHAR(16),
    IN ratingValHex VARCHAR(510),
    IN objType CHAR(1),
    IN objIDHex VARCHAR(16),
    -- OUT newIDHex VARCHAR(16),
    OUT exitCode TINYINT
)
BEGIN
    DECLARE setID BIGINT UNSIGNED;
    DECLARE ecFindOrCreateSet TINYINT;
    DECLARE previousRating, ratingVal VARBINARY(255);
    DECLARE userID, subjID, relID, objID BIGINT UNSIGNED;
    SET userID = CONV(userIDHex, 16, 10);
    SET subjID = CONV(subjIDHex, 16, 10);
    SET relID = CONV(relIDHex, 16, 10);
    SET objID = CONV(objIDHex, 16, 10);
    SET ratingVal = UNHEX(ratingValHex);

    CALL findOrCreateSet (
        userType,
        userID,
        subjType,
        subjID,
        relID,
        setID,
        ecFindOrCreateSet
    );
    SELECT rat_val INTO previousRating
    FROM SemanticInputs
    WHERE (
        obj_t = objType AND
        obj_id = objID AND
        set_id = setID
    );
    -- FOR UPDATE; -- Since this search only touches one row, only that row will
    -- be locked. *No, this might cause some weird next-key locking.. Let me
    -- see what to do.. ...Wait no, that actually shouldn't hurt much..
    -- ..Yes, it might hurt (by beeing slow), who knows. I think I will
    -- actually just query the Users table FOR UPDATE, which might actually
    -- be reasonable in the future as well to check if the user is allowed
    -- to make more inputs today, and thereby we will then also create a
    -- mutex lock to ensure that a user (or user group (bot)) can only input/
    -- update one rating at a time even when using several server clients at
    -- the same time. ..But let me implement all this at a later time..
    IF (previousRating IS NULL AND ratingVal IS NOT NULL) THEN
        INSERT INTO SemanticInputs (
            set_id,
            rat_val,
            obj_t,
            obj_id
        )
        VALUES (
            setID,
            ratingVal,
            objType,
            objID
        ); -- This might throw error due to race condition, but only if several
        -- clients are logged in as the same user and rates at the same time.
        -- ...(At least I think so, because FOR SHARE shouldn't lock indices..)
        -- If the insert succeeds, we can then update elem_num.
        UPDATE Sets
        SET elem_num = elem_num + 1
        WHERE id = setID;
        CALL insertOrUpdateRecentInput (
            setID,
            objType,
            objID,
            ratingVal,
            previousRating
        );
        SET exitCode = (0 + ecFindOrCreateSet); -- no prior rating.
    -- nothing happens if (previousRating IS NULL AND ratingVal IS NULL).
    ELSEIF (previousRating IS NOT NULL AND ratingVal IS NOT NULL) THEN
        CALL insertOrUpdateRecentInput (
            setID,
            objType,
            objID,
            ratingVal,
            previousRating
        );
        UPDATE SemanticInputs
        SET rat_val = ratingVal
        WHERE (
            obj_t = objType AND
            obj_id = objID AND
            set_id = setID
        );
        SET exitCode = (2 + ecFindOrCreateSet); -- overwriting an old rating.
    ELSEIF (previousRating IS NOT NULL AND ratingVal IS NULL) THEN
        CALL insertOrUpdateRecentInput (
            setID,
            objType,
            objID,
            ratingVal,
            previousRating
        );
        DELETE FROM SemanticInputs
        WHERE (
            set_id = setID AND
            obj_t = objType AND
            obj_id = objID

        );
        -- This UPDATE statement might cause a harmful race condition until
        -- I reimplement this procedure more correctly at some point.
        UPDATE Sets
        SET elem_num = elem_num - 1
        WHERE id = setID;
        SET exitCode = (2 + ecFindOrCreateSet); -- overwriting an old rating.
    END IF;
END //
DELIMITER ;
