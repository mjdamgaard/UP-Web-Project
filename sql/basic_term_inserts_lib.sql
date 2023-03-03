-- USE mydatabase;


DROP PROCEDURE insertString;
DROP PROCEDURE insertStringWORollback;
DROP PROCEDURE insertOrFindString;
DROP PROCEDURE insertText;
DROP PROCEDURE insertTextWORollback;
DROP PROCEDURE insertOrFindText;

DROP PROCEDURE inputUpvote;
DROP PROCEDURE inputUpvoteDuringCreation;

DROP PROCEDURE insertRels_hasLexItem_and_hasDescription;

DROP PROCEDURE insertTermWODescription;
DROP PROCEDURE insertTerm;

DROP PROCEDURE insertRelationalPredicate;


DELETE FROM SemanticInputs;

DELETE FROM NativeBots;
DELETE FROM UserGroups;
DELETE FROM Users;

DELETE FROM DerivedTerms;

DELETE FROM NextIDPointers;
INSERT INTO NextIDPointers (type_code, next_id_pointer)
VALUES
    (0x00, 0x0000000000000001),
    -- (0x06, 0x0600000000000001),
    (0x10, 0x1000000000000001),
    (0x20, 0x2000000000000001),
    (0x30, 0x3000000000000001),
    (0x70, 0x7000000000000001),
    (0x80, 0x8000000000000001),
    (0x90, 0x9000000000000001),
    (0xA0, 0xA000000000000001),
    (0xB0, 0xB000000000000001)
;
DELETE FROM Creators;

DELETE FROM Lists;
DELETE FROM Binaries;
DELETE FROM Blobs;
DELETE FROM Strings;
DELETE FROM Texts;


/* This library is for the basic insert functions used to initialize
 * the semantic tree (adding some fundamental terms).
 * I intend to also write more advanced term insertion functions,
 * but I will then do so in another library so that I can make a
 * term insertion script for the fundamental terms which only depennds
 * on this basic (and more constant) library.
 **/


DELIMITER //
CREATE PROCEDURE insertString (
    IN str VARCHAR(255),
    IN u_id BIGINT UNSIGNED,
    OUT new_id BIGINT UNSIGNED,
    OUT exit_code TINYINT
)
BEGIN
    DECLARE `_rollback` BOOL DEFAULT 0;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET `_rollback` = 1;
    START TRANSACTION;
        CALL createTerm (0xA0, u_id, new_id);
        INSERT INTO Strings (id, str) VALUES (new_id, str);
    IF `_rollback` THEN
        ROLLBACK;
        SET exit_code = 1; -- failure.
    ELSE
        COMMIT;
        SET exit_code = 0; -- success.
    END IF;
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE insertStringWORollback (
    IN str VARCHAR(255),
    IN u_id BIGINT UNSIGNED,
    OUT new_id BIGINT UNSIGNED
)
BEGIN
    CALL createTerm (0xA0, u_id, new_id);
    INSERT INTO Strings (id, str) VALUES (new_id, str);
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE insertOrFindString (
    IN in_str VARCHAR(255),
    IN u_id BIGINT UNSIGNED,
    OUT new_id BIGINT UNSIGNED,
    OUT exit_code TINYINT -- 0 is successful insertion, 2 is successful find.
)
BEGIN
    SELECT id INTO new_id FROM Strings WHERE str = in_str;
    IF (new_id IS NULL) THEN
        CALL createTerm (0xA0, u_id, new_id);
        INSERT INTO Strings (id, str) VALUES (new_id, in_str);
        SET exit_code = 0; -- insert.
    ELSE
        SET exit_code = 2; -- find.
    END IF;
END //
DELIMITER ;






DELIMITER //
CREATE PROCEDURE insertText (
    IN str TEXT,
    IN u_id BIGINT UNSIGNED,
    OUT new_id BIGINT UNSIGNED,
    OUT exit_code TINYINT
)
BEGIN
    DECLARE `_rollback` BOOL DEFAULT 0;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET `_rollback` = 1;
    START TRANSACTION;
        CALL createTerm (0xB0, u_id, new_id);
        INSERT INTO Texts (id, str) VALUES (new_id, str);
    IF `_rollback` THEN
        ROLLBACK;
        SET exit_code = 1; -- failure.
    ELSE
        COMMIT;
        SET exit_code = 0; -- success.
    END IF;
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE insertTextWORollback (
    IN str TEXT,
    IN u_id BIGINT UNSIGNED,
    OUT new_id BIGINT UNSIGNED
)
BEGIN
    CALL createTerm (0xB0, u_id, new_id);
    INSERT INTO Texts (id, str) VALUES (new_id, str);
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE insertOrFindText (
    IN in_str TEXT,
    IN u_id BIGINT UNSIGNED,
    OUT new_id BIGINT UNSIGNED,
    OUT exit_code TINYINT -- 0 is successful insertion, 2 is successful find.
)
BEGIN
    SELECT id INTO new_id FROM Texts WHERE str = in_str;
    IF (new_id IS NULL) THEN
        CALL createTerm (0xB0, u_id, new_id);
        INSERT INTO Texts (id, str) VALUES (new_id, in_str);
        SET exit_code = 0; -- insert.
    ELSE
        SET exit_code = 2; -- find.
    END IF;
END //
DELIMITER ;




-- DELIMITER //
-- CREATE PROCEDURE authorBotInsert (
--     IN s_id BIGINT UNSIGNED,
--     IN r_id BIGINT UNSIGNED,
--     IN o_id BIGINT UNSIGNED
-- )
-- BEGIN
--     INSERT INTO SemanticInputs (
--         subj_id,
--         user_id,
--         rel_id,
--         obj_id,
--         rat_val, opt_data
--     )
--     VALUES (
--         s_id,
--         1,
--         r_id,
--         o_id,
--         0x7F, NULL
--     );
-- END //
-- DELIMITER ;


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
