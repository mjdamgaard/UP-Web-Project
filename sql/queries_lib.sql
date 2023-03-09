




DELIMITER //
CREATE PROCEDURE selectSet (
    IN userType CHAR(1),
    IN userID BIGINT UNSIGNED,
    IN subjType CHAR(1),
    IN subjID BIGINT UNSIGNED,
    IN relID BIGINT UNSIGNED,
    IN ratingRangeMin VARBINARY(255),
    IN ratingRangeMax VARBINARY(255),
    IN num INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscOrder BOOL
)
BEGIN
    SELECT set_id INTO @setID
    FROM Sets
    WHERE (
        user_t = userType AND
        user_id = userID AND
        subj_t = subjType AND
        subj_id = subjID AND
        rel_id = relID
    );
    IF (isAscOrder) THEN
        SELECT (rat_val, obj_t, obj_id)
        FROM SemanticInputs
        WHERE (
            set_id = @setID AND
            (rat_val BETWEEN ratingRangeMin AND ratingRangeMax)
        )
        ORDER BY rat_val, obj_t, obj_id ASC
        LIMIT numOffset, num;
    ELSE
        SELECT (rat_val, obj_t, obj_id)
        FROM SemanticInputs
        WHERE (
            set_id = @setID AND
            (rat_val BETWEEN ratingRangeMin AND ratingRangeMax)
        )
        ORDER BY rat_val, obj_t, obj_id DESC
        LIMIT numOffset, num;
    END IF;
END //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE selectData (
    IN data_t CHAR(1),
    IN data_id BIGINT UNSIGNED,
    IN relID BIGINT UNSIGNED,
)
BEGIN
    SELECT set_id INTO @setID
    FROM Sets
    WHERE (
        user_t = userType AND
        user_id = userID AND
        subj_t = subjType AND
        subj_id = subjID AND
        rel_id = relID
    );
    IF (isAscOrder) THEN
        SELECT (rat_val, obj_t, obj_id)
        FROM SemanticInputs
        WHERE (
            set_id = @setID AND
            (rat_val BETWEEN ratingRangeMin AND ratingRangeMax)
        )
        ORDER BY rat_val, obj_t, obj_id ASC
        LIMIT numOffset, num;
    ELSE
        SELECT (rat_val, obj_t, obj_id)
        FROM SemanticInputs
        WHERE (
            set_id = @setID AND
            (rat_val BETWEEN ratingRangeMin AND ratingRangeMax)
        )
        ORDER BY rat_val, obj_t, obj_id DESC
        LIMIT numOffset, num;
    END IF;
END //
DELIMITER ;








DELIMITER //
CREATE PROCEDURE selectCreations (
    IN userID BIGINT UNSIGNED,
       termT
    IN num INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscOrder BOOL
)
BEGIN
    SELECT (term_t, term_id)
    FROM Creators
    WHERE (user_id = userID)
    ORDER BY rat_val, obj_t, obj_id DESC
    LIMIT numOffset, num;
END //
DELIMITER ;
