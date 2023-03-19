

-- SELECT "Categories:";
SELECT
    HEX(id) AS id,
    title,
    super_cat_id AS superCatID
FROM (
    SELECT * FROM Categories
    ORDER BY id
)
AS Categories;


-- SELECT "Sets:";
SELECT
    HEX(id) AS id,
    user_t, Hex(user_id) AS userID,
    subj_t, HEX(subj_id) AS subjID,
    HEX(rel_id) AS relID
FROM (
    SELECT * FROM Sets
    ORDER BY user_t, user_id, subj_t, subj_id, rel_id
)
AS Sets;

-- SELECT "SemanticInputs:";
SELECT
    HEX(set_id) AS setID,
    rat_val,
    obj_t,
    HEX(obj_id) AS objID
FROM (
    SELECT * FROM SemanticInputs
    ORDER BY set_id ASC, rat_val DESC
)
AS SemanticInputs;
