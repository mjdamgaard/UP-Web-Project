
SELECT "subprocedures";


DROP PROCEDURE getTypeAndConvID;
DROP PROCEDURE getType;
DROP PROCEDURE getConvID;
-- DROP PROCEDURE getCombID;
-- DROP FUNCTION getCombID;


DROP PROCEDURE findOrCreateSet;
DROP PROCEDURE insertOrUpdateRecentInput;




/* Rating inputs */

DELIMITER //
CREATE PROCEDURE findOrCreateSet (
    IN userID BIGINT UNSIGNED,
    IN subjType CHAR(1),
    IN subjID BIGINT UNSIGNED,
    IN relID BIGINT UNSIGNED,
    OUT newID BIGINT UNSIGNED,
    OUT exitCode TINYINT
)
BEGIN
    SELECT id INTO newID
    FROM Sets
    WHERE (
        user_id = userID AND
        subj_t = subjType AND
        subj_id = subjID AND
        rel_id = relID
    );
    IF (newID IS NULL) THEN
        INSERT INTO Sets (
            user_id,
            subj_t,
            subj_id,
            rel_id,
            elem_num
        )
        VALUES (
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
    IN objID BIGINT UNSIGNED,
    IN ratingVal VARBINARY(255),
    IN previousRating VARBINARY(255)
)
BEGIN
    DECLARE existsPriorChangeToday TINYINT;
    DECLARE currentDate DATE;
    SET currentDate = CURDATE();
    SET existsPriorChangeToday = EXISTS (
        SELECT * FROM RecentInputs
        WHERE (
            set_id = setID AND
            changed_at = currentDate AND
            obj_id = objID
        )
        -- If this procedure is not called from any other procedures than
        -- inputOrChangeRating() (as intended!), no race conditions
        -- are possible due to the FOR UPDATE lock on (setID, objID)
        -- in that procedure.
    );

    IF (existsPriorChangeToday) THEN
        UPDATE RecentInputs
        SET new_rat_val = ratingVal
        WHERE (
            set_id = setID AND
            changed_at = currentDate AND
            obj_id = objID
        );
    ELSE
        INSERT INTO RecentInputs (
            set_id,
            changed_at,
            obj_id,
            old_rat_val,
            new_rat_val
        ) VALUES (
            setID,
            currentDate,
            objID,
            previousRating, -- possibly NULL.
            ratingVal  -- also possibly NULL.
        );
    END IF;
END //
DELIMITER ;
