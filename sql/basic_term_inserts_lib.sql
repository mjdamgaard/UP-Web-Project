USE mydatabase;


DROP PROCEDURE insertString;
DROP PROCEDURE insertStringWORollback;
DROP PROCEDURE insertText;
DROP PROCEDURE insertTextWORollback;
DROP PROCEDURE authorBotInsert;
DROP PROCEDURE insertRels_hasLexItem_and_hasDescription;

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
    OUT new_id BIGINT UNSIGNED,
    OUT exit_status TINYINT
)
BEGIN
    DECLARE `_rollback` BOOL DEFAULT 0;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET `_rollback` = 1;
    START TRANSACTION;
        CALL getNewTermID (0xA0, new_id);
        INSERT INTO Strings (id, str) VALUES (new_id, str);
    IF `_rollback` THEN
        ROLLBACK;
        SET exit_status = 1; -- failure.
    ELSE
        COMMIT;
        SET exit_status = 0; -- success.
    END IF;
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE insertStringWORollback (
    IN str VARCHAR(255),
    OUT new_id BIGINT UNSIGNED
)
BEGIN
    CALL getNewTermID (0xA0, new_id);
    INSERT INTO Strings (id, str) VALUES (new_id, str);
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE insertText (
    IN str TEXT,
    OUT new_id BIGINT UNSIGNED,
    OUT exit_status TINYINT
)
BEGIN
    DECLARE `_rollback` BOOL DEFAULT 0;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET `_rollback` = 1;
    START TRANSACTION;
        CALL getNewTermID (0xB0, new_id);
        INSERT INTO Texts (id, str) VALUES (new_id, str);
    IF `_rollback` THEN
        ROLLBACK;
        SET exit_status = 1; -- failure.
    ELSE
        COMMIT;
        SET exit_status = 0; -- success.
    END IF;
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE insertTextWORollback (
    IN str TEXT,
    OUT new_id BIGINT UNSIGNED
)
BEGIN
    CALL getNewTermID (0xB0, new_id);
    INSERT INTO Texts (id, str) VALUES (new_id, str);
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE authorBotInsert (
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
        1,
        r_id,
        o_id,
        0x7F, NULL
    );
END //
DELIMITER ;





-- First two relations:


DELIMITER //
CREATE PROCEDURE insertRels_hasLexItem_and_hasDescription (
    str_LexItem_of_hasLexItem VARCHAR(255),
    str_Description_of_hasLexItem TEXT,
    str_LexItem_of_hasDescription VARCHAR(255),
    str_Description_of_hasDescription TEXT
)
BEGIN
    CALL getNewTermID (0x30, @hasLexItem_id);
    SELECT @hasLexItem_id;
    CALL getNewTermID (0x30, @hasDescription_id);
    SELECT @hasDescription_id;

    CALL insertStringWORollback(
        str_LexItem_of_hasLexItem,
        @StrID_LexItem_of_hasLexItem
    );
    CALL insertTextWORollback(
        str_Description_of_hasLexItem,
        @StrID_Description_of_hasLexItem
    );
    CALL insertStringWORollback(
        str_LexItem_of_hasDescription,
        @StrID_LexItem_of_hasDescription
    );
    CALL insertTextWORollback(
        str_Description_of_hasDescription,
        @StrID_Description_of_hasDescription
    );


    CALL authorBotInsert (
        @hasLexItem_id,
        @hasLexItem_id,
        @StrID_LexItem_of_hasLexItem
    );
    CALL authorBotInsert (
        @hasLexItem_id,
        @hasDescription_id,
        @StrID_Description_of_hasLexItem
    );
    CALL authorBotInsert (
        @hasDescription_id,
        @hasLexItem_id,
        @StrID_LexItem_of_hasDescription
    );
    CALL authorBotInsert (
        @hasDescription_id,
        @hasLexItem_id,
        @StrID_Description_of_hasDescription
    );

END //
DELIMITER ;









-- CALL insertString ("hello world!", @hello_id, @exit_status);
-- CALL insertString ("hello world!!", @hello_id, @exit_status);
-- CALL insertString ("hello world!! How are you?", @hello_id, @exit_status);
-- -- CALL insertString ("hello world!", @hello_id, @exit_status);
-- -- CALL insertString ("hello world!", @hello_id, @exit_status);
-- -- CALL insertString ("hello world!", @hello_id, @exit_status);
-- -- CALL insertString ("hello world!", @hello_id, @exit_status);
--
-- -- SET @hello_id = 0xA000000000000000 + 1;
-- SELECT @hello_id;
-- SELECT @exit_status;







-- function appendSQL_addObjNounRelation($subjType, $objNoun, $objType, $dscrptn) {
--     $sql = "";
--     if (strlen($subjType) != 0) {
--         $sql .= "(".$subjType.") ";
--     }
--     $sql .= "has ".$objNoun . " ";
--     if (strlen($objType) != 0) {
--         $sql .= "(".$objType.") ";
--     }
--     $sql .= "=";
--
--     if (strlen($dscrptn) != 0) {
--
--     }
--
--     return $sql;
-- }
