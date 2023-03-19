

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


/* MySQL binary handling hack test */

-- MySQL has wierd behaviour here:
SELECT CONV(0x0F, 10, 16); -- = "F"; OK.
SELECT UNHEX("F"); -- = 0x0F; OK.
SELECT CONV(UNHEX("F"), 10, 16); -- = 0; not OK..!

-- Let us try something else..
BEGIN
    DECLARE str VARCHAR(255); -- TODO: continue this test..
END;
