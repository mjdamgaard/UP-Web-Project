

-- SELECT "Categories:";
SELECT
    HEX(id) AS catID,
    title,
    super_cat_id AS superCatID
FROM Categories
ORDER BY id;


SELECT
    HEX(id) AS id,
    user_t, Hex(user_id) AS userID,
    subj_t, HEX(subj_id) AS subjID,
    HEX(rel_id) AS relID
FROM Sets
ORDER BY user_t, user_id, subj_t, subj_id, rel_id;


-- SELECT "SemanticInputs:";
SELECT
    HEX(set_id) AS setID,
    rat_val,
    obj_t,
    HEX(obj_id) AS objID
FROM SemanticInputs
ORDER BY set_id ASC, rat_val DESC;

--
-- /* MySQL binary handling hack test */
--
-- -- MySQL has wierd behaviour here:
-- SELECT CONV(0x0F, 10, 16); -- = "F"; OK.
-- SELECT UNHEX("F"); -- = 0x0F; OK.
-- SELECT CONV(UNHEX("F"), 10, 16); -- = 0; not OK..!
--
-- -- Let us try something else..
--
-- DELIMITER //
-- CREATE PROCEDURE test ()
-- BEGIN
--     DECLARE bin VARBINARY(255);
--     DECLARE str VARCHAR(510);
--     DECLARE n BIGINT UNSIGNED;
--     SET bin = UNHEX("100001");
--     SELECT HEX(bin);
--     SET str = HEX(bin);
--     -- SELECT CONV(bin, 10, 16); and SELECT CONV(bin, 2, 16); returns "0".
--     SET n = CONV(str, 16, 10);
--     SELECT n;
-- END //
-- DELIMITER ;
-- CALL test ();
-- DROP PROCEDURE test;
-- -- This does work, and I almost expect that UNHEX and HEX will cancel, but it
-- -- might depend on their implementation.. ..Ah, let me also try CONV()..
-- -- *Yeah, they probably don't necessarily cancel if they are both implemented
-- -- as loops, which they most likely are; what else?.
--
-- -- DELIMITER //
-- -- CREATE PROCEDURE test ()
-- -- BEGIN
-- --     DECLARE bin VARBINARY(255);
-- --     DECLARE str VARCHAR(510);
-- --     DECLARE n BIGINT UNSIGNED;
-- --     SET bin = UNHEX("100001");
-- --     SELECT CONV(bin, 2, 16); -- CONV(bin, 10, 16);
-- --     SET str = CONV(bin, 10, 16);
-- --     -- SELECT CONV(bin, 10, 16); and SELECT CONV(bin, 2, 16); returns "0".
-- --     SET n = CONV(str, 16, 10);
-- --     SELECT n;
-- -- END //
-- -- DELIMITER ;
-- -- CALL test ();
-- -- DROP PROCEDURE test;
-- -- -- ..That doesn't work..
