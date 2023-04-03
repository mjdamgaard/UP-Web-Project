
SELECT "rating_inputs";




DROP PROCEDURE inputOrChangeRating;





DELIMITER //
CREATE PROCEDURE inputOrChangeRating (
    IN userCombID VARCHAR(17),
    IN subjCombID VARCHAR(17),
    IN relCombID VARCHAR(17),
    IN ratingValHex VARCHAR(510),
    IN objCombID VARCHAR(17),
    -- OUT newCombID VARCHAR(17),
    OUT exitCode TINYINT
)
BEGIN
    DECLARE userType, subjType, objType CHAR(1);
    DECLARE userID, subjID, relID, objID, setID BIGINT UNSIGNED;
    DECLARE previousRating, ratingVal VARBINARY(255);
    DECLARE ecFindOrCreateSet TINYINT;

    CALL getTypeAndConvID (userCombID, userType, userID);
    CALL getTypeAndConvID (subjCombID, subjType, subjID);
    CALL getConvID (relCombID, relID);
    CALL getTypeAndConvID (objCombID, objType, objID);
    SET ratingVal = UNHEX(ratingValHex);
    CALL findOrCreateSet (
        userType,
        userID,
        subjType,
        subjID,
        relID,
        setID, -- OUT
        ecFindOrCreateSet -- OUT
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
