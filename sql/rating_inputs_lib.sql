



DROP PROCEDURE findOrCreateSet;
DROP PROCEDURE insertOrUpdateRecentInput;
DROP PROCEDURE inputOrChangeRating;




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

    SELECT set_id INTO newID
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
            rel_id
        )
        VALUES (
            userType,
            userID,
            subjType,
            subjID,
            relID
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
    IN currentDate DATE,
    IN objType CHAR(1),
    IN objID BIGINT UNSIGNED,
    IN ratingVal VARBINARY(255)
)
BEGIN
    DECLARE previousRating VARBINARY(255);
    DECLARE existsPriorChangeToday TINYINT;
    SET existsPriorChangeToday = EXISTS (
        SELECT * FROM RecentInputs
        WHERE (
            set_id = setID AND
            changed_at = currentDate AND
            obj_t = objType AND
            obj_id = objID
        )
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
        SET previousRating = (
            SELECT rat_val FROM SemanticInputs
            WHERE (
                obj_t = objType AND
                obj_id = objID AND
                set_id = setID
            )
        );
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
    IN ratingVal VARBINARY(255),
    IN objType CHAR(1),
    IN objIDHex VARCHAR(16),
    -- OUT newIDHex VARCHAR(16),
    OUT exitCode TINYINT
)
BEGIN
    DECLARE setID BIGINT UNSIGNED;
    DECLARE existsPriorRating, ecFindOrCreateSet TINYINT;
    DECLARE currentDate DATE;
    DECLARE oldRatingVal VARBINARY(255);
    DECLARE userID, subjID, relID, objID BIGINT UNSIGNED;
    SET userID = CONV(userIDHex, 16, 10);
    SET subjID = CONV(subjIDHex, 16, 10);
    SET relID = CONV(relIDHex, 16, 10);
    SET objID = CONV(objIDHex, 16, 10);
    SET currentDate = CURDATE();

    CALL findOrCreateSet (
        userType,
        userID,
        subjType,
        subjID,
        relID,
        setID,
        ecFindOrCreateSet
    );
    SET existsPriorRating = EXISTS (
        SELECT *
        FROM SemanticInputs
        WHERE (
            obj_t = objType AND
            obj_id = objID AND
            set_id = setID
        )
    );
    IF (NOT existsPriorRating AND ratingVal IS NOT NULL) THEN
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
        );
        CALL insertOrUpdateRecentInput (
            setID,
            currentDate,
            objType,
            objID,
            ratingVal
        );
        SET exitCode = (0 + ecFindOrCreateSet); -- no prior rating.
    -- nothing happens if (NOT existsPriorRating AND ratingVal *IS* NULL).
    ELSEIF (existsPriorRating AND ratingVal IS NOT NULL) THEN
        UPDATE SemanticInputs
        SET rat_val = ratingVal
        WHERE (
            obj_t = objType AND
            obj_id = objID AND
            set_id = setID
        );
        CALL insertOrUpdateRecentInput (
            setID,
            currentDate,
            objType,
            objID,
            ratingVal
        );
        SET exitCode = (2 + ecFindOrCreateSet); -- overwriting an old rating.
    ELSEIF (existsPriorRating AND ratingVal IS NULL) THEN
        DELETE FROM SemanticInputs
        WHERE (
            set_id = setID AND
            obj_t = objType AND
            obj_id = objID

        );
        CALL insertOrUpdateRecentInput (
            setID,
            currentDate,
            objType,
            objID,
            ratingVal
        );
        SET exitCode = (2 + ecFindOrCreateSet); -- overwriting an old rating.
    END IF;
END //
DELIMITER ;
