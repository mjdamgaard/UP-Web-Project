-- USE mydatabase;


-- DROP PROCEDURE insertString;
-- DROP PROCEDURE insertStringWORollback;
-- DROP PROCEDURE insertOrFindString;
-- DROP PROCEDURE insertText;
-- DROP PROCEDURE insertTextWORollback;
-- DROP PROCEDURE insertOrFindText;

-- DROP PROCEDURE inputUpvote;
-- DROP PROCEDURE inputUpvoteDuringCreation;

-- DROP PROCEDURE insertRels_hasLexItem_and_hasDescription;

-- DROP PROCEDURE insertTermWODescription;
-- DROP PROCEDURE insertTerm;

-- DROP PROCEDURE insertRelationalPredicate;





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
    IN oc_id BIGINT UNSIGNED,
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
        obj_cat_id = oc_id AND
        subj_cat_id = sc_id
    );
    IF (new_id IS NULL) THEN
        INSERT INTO Relations (obj_noun, obj_cat_id, subj_cat_id)
        VALUES (on_str, oc_id, sc_id);
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

























DELIMITER //
CREATE PROCEDURE inputUpvote (
    IN u_id BIGINT UNSIGNED,
    IN s_id BIGINT UNSIGNED,
    IN r_id BIGINT UNSIGNED,
    IN o_id BIGINT UNSIGNED
)
BEGIN
    INSERT INTO SemanticInputs (
        subj_id,
        user_id,
        rel_id,
        obj_id,
        rat_val, opt_data
    )
    VALUES (
        s_id,
        u_id,
        r_id,
        o_id,
        0x7F, NULL
    );
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE inputUpvoteDuringCreation (
    IN u_id BIGINT UNSIGNED,
    IN s_id BIGINT UNSIGNED,
    IN r_id BIGINT UNSIGNED,
    IN o_id BIGINT UNSIGNED
)
BEGIN
    INSERT INTO SemanticInputs (
        subj_id,
        user_id,
        rel_id,
        obj_id,
        rat_val, opt_data
    )
    VALUES (
        s_id,
        u_id,
        r_id,
        o_id,
        0x7F, NULL
    ), (
        s_id,
        1,
        r_id,
        o_id,
        0x7F, NULL
    );
END //
DELIMITER ;




-- First two relations:

-- use once (then drop procedure).
DELIMITER //
CREATE PROCEDURE insertRels_hasLexItem_and_hasDescription (
    IN str_lexItem_of_hasLexItem VARCHAR(255),
    IN str_description_of_hasLexItem TEXT,
    IN str_lexItem_of_hasDescription VARCHAR(255),
    IN str_description_of_hasDescription TEXT
)
BEGIN
    CALL createTerm (0x30, 1, @TermID_hasLexItem);
    CALL createTerm (0x30, 1, @TermID_hasDescription);
    -- There apparently cannot be any selects in a MySQLi prepared statement
    -- for insertion. (?..)
    -- SELECT @TermID_hasLexItem;
    -- SELECT @TermID_hasDescription;

    CALL insertStringWORollback(
        str_lexItem_of_hasLexItem,
        1,
        @StrID_LexItem_of_hasLexItem
    );
    CALL insertTextWORollback(
        str_description_of_hasLexItem,
        1,
        @StrID_Description_of_hasLexItem
    );
    CALL insertStringWORollback(
        str_lexItem_of_hasDescription,
        1,
        @StrID_LexItem_of_hasDescription
    );
    CALL insertTextWORollback(
        str_description_of_hasDescription,
        1,
        @StrID_Description_of_hasDescription
    );


    CALL inputUpvote (
        1,
        @TermID_hasLexItem,
        @TermID_hasLexItem,
        @StrID_LexItem_of_hasLexItem
    );
    CALL inputUpvote (
        1,
        @TermID_hasLexItem,
        @TermID_hasDescription,
        @StrID_Description_of_hasLexItem
    );
    CALL inputUpvote (
        1,
        @TermID_hasDescription,
        @TermID_hasLexItem,
        @StrID_LexItem_of_hasDescription
    );
    CALL inputUpvote (
        1,
        @TermID_hasDescription,
        @TermID_hasLexItem,
        @StrID_Description_of_hasDescription
    );

    IF (@TermID_hasLexItem != 0x3000000000000001) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'TermID_hasLexItem wrong value';
    END IF;
    IF (@TermID_hasDescription != 0x3000000000000002) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'TermID_hasDescription wrong value';
    END IF;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE insertTerm (
    IN str_lexItem VARCHAR(255),
    IN str_description TEXT,
    IN u_id BIGINT UNSIGNED,
    OUT new_id BIGINT UNSIGNED,
    OUT exit_code_lex TINYINT,
    OUT exit_code_dscr TINYINT
)
BEGIN
    CALL createTerm (0x30, u_id, new_id);

    CALL insertOrFindString (
        str_LexItem, u_id, @StrID_lexItem, exit_code_lex
    );
    CALL insertOrFindText (
        str_description, u_id, @StrID_description, exit_code_dscr
    );

    CALL inputUpvoteDuringCreation (
        u_id,
        new_id,
        0x3000000000000001, -- TermID of hasLexItem
        @StrID_lexItem
    );
    CALL inputUpvoteDuringCreation (
        u_id,
        new_id,
        0x3000000000000002, -- TermID of hasDescription
        @StrID_description
    );
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertTermWODescription (
    IN str_lexItem VARCHAR(255),
    IN u_id BIGINT UNSIGNED,
    OUT new_id BIGINT UNSIGNED,
    OUT exit_code_lex TINYINT
)
BEGIN
    CALL createTerm (0x30, u_id, new_id);

    CALL insertOrFindString (
        str_LexItem, u_id, @StrID_lexItem, exit_code_lex
    );

    CALL inputUpvoteDuringCreation (
        u_id,
        new_id,
        0x3000000000000001, -- TermID of hasLexItem
        @StrID_lexItem
    );
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertRelationalPredicate (
    IN u_id BIGINT UNSIGNED,
    IN r_id BIGINT UNSIGNED,
    IN o_id BIGINT UNSIGNED,
    OUT new_id BIGINT UNSIGNED,
    OUT exit_code TINYINT
)
BEGIN
    -- TODO: change.
    CALL createTerm (0x20, u_id, new_id);

    CALL insertOrFindString (
        str_LexItem, u_id, @StrID_lexItem, exit_code_lex
    );

    CALL inputUpvoteDuringCreation (
        u_id,
        new_id,
        0x3000000000000001, -- TermID of hasLexItem
        @StrID_lexItem
    );
END //
DELIMITER ;








-- Some testing.

-- CALL insertString ("hello world!", @hello_id, @exit_code);
-- CALL insertString ("hello world!!", @hello_id, @exit_code);
-- CALL insertString ("hello world!! How are you?", @hello_id, @exit_code);
--
-- CALL insertString ("hello world!", @hello_id, @exit_code);
-- -- CALL insertStringWOROllback ("hello world!", @hello_id); -- correct
-- -- -- (throws error).
-- CALL insertOrFindString ("hello world!", @hello_id, @exit_code);
-- -- SELECT @hello_id; SELECT @exit_code; -- correct
-- CALL insertOrFindString ("hello new world!", @hello_id, @exit_code);
-- -- SELECT @hello_id; SELECT @exit_code; -- corret
--
-- -- SET @hello_id = 0xA000000000000000 + 1;
-- -- SELECT @hello_id;
-- -- SELECT @exit_code;
