-- USE mydatabase;







DROP PROCEDURE insertOrFindCat;
DROP PROCEDURE insertOrFindStd;
DROP PROCEDURE insertOrFindRel;

DROP PROCEDURE findOrCreateSet;
DROP PROCEDURE inputOrChangeRating;




-- DELETE FROM Sets;
-- DELETE FROM SemanticInputs;
--
-- DELETE FROM UserGroups;
-- DELETE FROM Users;
--
-- TRUNCATE TABLE Categories; -- slow..
-- DELETE FROM StandardTerms;
-- DELETE FROM Relations;
-- DELETE FROM KeywordStrings;
-- DELETE FROM SavedSets;
-- DELETE FROM Texts;
-- DELETE FROM Lists;
-- DELETE FROM Binaries;
--
-- DELETE FROM Creators;







DELIMITER //
CREATE PROCEDURE insertOrFindCat (
    IN t_str TEXT,
    IN sc_id BIGINT UNSIGNED,
    IN u_id BIGINT UNSIGNED,
    OUT new_id BIGINT UNSIGNED,
    OUT exit_code TINYINT -- 0 is successful insertion, 1 is successful find.
)
BEGIN
    SELECT id INTO new_id
    FROM Categories
    WHERE (title = t_str AND super_cat_id = sc_id);
    IF (new_id IS NULL) THEN
        INSERT INTO Categories (title, super_cat_id)
        VALUES (t_str, sc_id);
        SELECT LAST_INSERT_ID() INTO new_id;
        IF (u_id IS NOT NULL) THEN
            -- NOTE: This procedure assumes that user_id is correct if not null.
            INSERT INTO Creators (term_t, term_id, user_id)
            VALUES ("cat", new_id, u_id);
        END IF;
        SET exit_code = 0; -- insert.
    ELSE
        SET exit_code = 1; -- find.
    END IF;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertOrFindStd (
    IN t_str TEXT,
    IN c_id BIGINT UNSIGNED,
    IN u_id BIGINT UNSIGNED,
    OUT new_id BIGINT UNSIGNED,
    OUT exit_code TINYINT -- 0 is successful insertion, 1 is successful find.
)
BEGIN
    SELECT id INTO new_id
    FROM StandardTerms
    WHERE (title = t_str AND cat_id = c_id);
    IF (new_id IS NULL) THEN
        INSERT INTO StandardTerms (title, cat_id)
        VALUES (t_str, c_id);
        SELECT LAST_INSERT_ID() INTO new_id;
        IF (u_id IS NOT NULL) THEN
            -- NOTE: This procedure assumes that user_id is correct if not null.
            INSERT INTO Creators (term_t, term_id, user_id)
            VALUES ("std", new_id, u_id);
        END IF;
        SET exit_code = 0; -- insert.
    ELSE
        SET exit_code = 1; -- find.
    END IF;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE insertOrFindRel (
    IN on_str TEXT,
    IN sc_id BIGINT UNSIGNED,
    IN u_id BIGINT UNSIGNED,
    OUT new_id BIGINT UNSIGNED,
    OUT exit_code TINYINT -- 0 is successful insertion, 1 is successful find.
)
BEGIN
    SELECT id INTO new_id
    FROM Relations
    WHERE (
        obj_noun = on_str AND
        subj_cat_id = sc_id
    );
    IF (new_id IS NULL) THEN
        INSERT INTO Relations (obj_noun, subj_cat_id)
        VALUES (on_str, sc_id);
        SELECT LAST_INSERT_ID() INTO new_id;
        IF (u_id IS NOT NULL) THEN
            -- NOTE: This procedure assumes that user_id is correct if not null.
            INSERT INTO Creators (term_t, term_id, user_id)
            VALUES ("rel", new_id, u_id);
        END IF;
        SET exit_code = 0; -- insert.
    ELSE
        SET exit_code = 1; -- find.
    END IF;
END //
DELIMITER ;








DELIMITER //
CREATE PROCEDURE insertTxt (
    IN s TEXT,
    IN u_id BIGINT UNSIGNED,
    OUT new_id BIGINT UNSIGNED
    OUT exit_code TINYINT -- 0 is successful insertion.
)
BEGIN
    INSERT INTO Texts (srt) VALUES (s);
    SELECT LAST_INSERT_ID() INTO new_id;
    IF (u_id IS NOT NULL) THEN
        -- NOTE: This procedure assumes that user_id is correct if not null.
        INSERT INTO Creators (term_t, term_id, user_id)
        VALUES ("txt", new_id, u_id);
    END IF;
    SET exit_code = 0; -- insert.
END //
DELIMITER ;




















DELIMITER //
CREATE PROCEDURE findOrCreateSet (
    IN u_t CHAR(3),
    IN u_id BIGINT UNSIGNED,
    IN s_t CHAR(3),
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
    IN u_t CHAR(3),
    IN u_id BIGINT UNSIGNED,
    IN s_t CHAR(3),
    IN s_id BIGINT UNSIGNED,
    IN r_id BIGINT UNSIGNED,
    IN rv VARBINARY(255),
    IN o_t CHAR(3),
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
