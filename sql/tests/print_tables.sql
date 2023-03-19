

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
