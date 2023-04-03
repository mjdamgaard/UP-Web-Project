
SELECT "subprocedures";


DROP PROCEDURE getTypeAndConvID;
DROP PROCEDURE getType;
DROP PROCEDURE getConvID;
-- DROP PROCEDURE getCombID;
-- DROP FUNCTION getCombID;


DROP PROCEDURE findOrCreateSet;
DROP PROCEDURE insertOrUpdateRecentInput;






/* General */

DELIMITER //
CREATE PROCEDURE getTypeAndConvID (
    IN combID VARCHAR(17),
    OUT type CHAR(1),
    OUT id BIGINT UNSIGNED
)
BEGIN
    SET type = SUBSTRING(combID, 1, 1);
    SET id = CONV(SUBSTRING(combID, 2) , 16, 10);
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE getType (
    IN combID VARCHAR(17),
    OUT type CHAR(1)
)
BEGIN
    SET type = SUBSTRING(combID, 1, 1);
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE getConvID (
    IN combID VARCHAR(17),
    OUT id BIGINT UNSIGNED
)
BEGIN
    SET id = CONV(SUBSTRING(combID, 2) , 16, 10);
END //
DELIMITER ;


-- DELIMITER //
-- CREATE FUNCTION getCombID (
--     type CHAR(1),
--     id BIGINT UNSIGNED
-- )
-- RETURNS VARCHAR(17) DETERMINISTIC
-- BEGIN
--     RETURN CONCAT(type, CONV(id, 10, 16));
-- END //
-- DELIMITER ;




/* Query */

-- TODO: Cut--paste existing helper procedures here.



/* Rating inputs */



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
