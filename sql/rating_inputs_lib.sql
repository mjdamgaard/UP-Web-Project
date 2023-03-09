



DROP PROCEDURE findOrCreateSet;
DROP PROCEDURE inputOrChangeRating;




DELIMITER //
CREATE PROCEDURE findOrCreateSet (
    IN u_t CHAR(1),
    IN u_id BIGINT UNSIGNED,
    IN s_t CHAR(1),
    IN s_id BIGINT UNSIGNED,
    IN r_id BIGINT UNSIGNED,
    OUT new_id BIGINT UNSIGNED,
    OUT exit_code TINYINT
)
BEGIN
    SELECT set_id INTO new_id
    FROM Sets
    WHERE (
        user_t = u_t AND
        user_id = u_id AND
        subj_t = s_t AND
        subj_id = s_id AND
        rel_id = r_id
    );
    IF (new_id IS NULL) THEN
        INSERT INTO Sets (
            user_t,
            user_id,
            subj_t,
            subj_id,
            rel_id
        )
        VALUES (
            u_t,
            u_id,
            s_t,
            s_id,
            r_id
        );
        SELECT LAST_INSERT_ID() INTO new_id;
        SET exit_code = 1; -- create.
    ELSE
        SET exit_code = 0; -- find.
    END IF;
END //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE inputOrChangeRating (
    IN u_t CHAR(1),
    IN u_id BIGINT UNSIGNED,
    IN s_t CHAR(1),
    IN s_id BIGINT UNSIGNED,
    IN r_id BIGINT UNSIGNED,
    IN rv VARBINARY(255),
    IN o_t CHAR(1),
    IN o_id BIGINT UNSIGNED,
    -- OUT new_id BIGINT UNSIGNED,
    OUT exit_code TINYINT
)
BEGIN
    CALL findOrCreateSet (
        u_t,
        u_id,
        s_t,
        s_id,
        r_id,
        @setID,
        @ec_findOrCreateSet
    );
    SET @existsPriorRating = (
        SELECT set_id
        FROM SemanticInputs
        WHERE (
            set_id = @setID AND
            obj_t = o_t AND
            obj_id = o_id
        )
    );
    IF (@existsPriorRating IS NULL) THEN
        INSERT INTO SemanticInputs (
            set_id,
            rat_val,
            obj_t,
            obj_id
        )
        VALUES (
            @setID,
            rv,
            o_t,
            o_id
        );
        SET exit_code = (0 + @ec_findOrCreateSet); -- no prior rating.
    ELSE
        UPDATE SemanticInputs
        SET rat_val = rv
        WHERE (
            set_id = @setID AND
            obj_t = o_t AND
            obj_id = o_id
        );
        SET exit_code = (2 + @ec_findOrCreateSet); -- overwriting an old rating.
    END IF;
END //
DELIMITER ;
