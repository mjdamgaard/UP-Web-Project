




DELIMITER //
CREATE PROCEDURE selectSet (
    IN u_t CHAR(1),
    IN u_id BIGINT UNSIGNED,
    IN s_t CHAR(1),
    IN s_id BIGINT UNSIGNED,
    IN r_id BIGINT UNSIGNED,
    IN rat_range_min VARBINARY(255),
    IN rat_range_max VARBINARY(255),
    IN is_asc_order BOOL,
    IN num INT UNSIGNED,
    IN num_offset INT UNSIGNED
)
BEGIN
    SELECT set_id INTO @setID
    FROM Sets
    WHERE (
        user_t = u_t AND
        user_id = u_id AND
        subj_t = s_t AND
        subj_id = s_id AND
        rel_id = r_id
    );
    IF (is_asc_order) THEN
        SELECT (rat_val, obj_t, obj_id)
        FROM SemanticInputs
        WHERE (
            set_id = @setID AND
            (rat_val BETWEEN rat_range_min AND rat_range_max)
        )
        ORDER BY rat_val, obj_t, obj_id ASC
        LIMIT num_offset, num;
    ELSE
        SELECT (rat_val, obj_t, obj_id)
        FROM SemanticInputs
        WHERE (
            set_id = @setID AND
            (rat_val BETWEEN rat_range_min AND rat_range_max)
        )
        ORDER BY rat_val, obj_t, obj_id DESC
        LIMIT num_offset, num;
    END IF;
END //
DELIMITER ;
