USE mydatabase;


DROP PROCEDURE insertString;


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




-- function appendSQL_addString($sql, $inStr, $idVarName) {
--
--     $str_selectID = 'BEGIN DECLARE CALL selectNextTermID (0x20)'
--
--     // Nå, nej jeg burde faktisk hellere lave disse funktioner som SQL-
--     // procedures..
--
--     $sql .= 'INSERT INTO Strings (id, str) VALUES ';
--     $sql .= '(' . $str_selectID . ', \"' . $inStr . '\");';
--
--     return $sql;
-- }
--
--
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
