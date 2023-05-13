
SELECT "Creators:";
SELECT
    entity_t AS entityType,
    entity_id AS entityID,
    user_id AS userID
FROM Creators
ORDER BY entity_t ASC, entity_id ASC, user_id ASC;

SELECT "Categories:";
SELECT
    id AS catID,
    title,
    super_cat_id AS superCatID
FROM Categories
ORDER BY id;

SELECT "Relations:";
SELECT
    id AS relID,
    subj_t AS subjType,
    obj_t AS objType,
    obj_noun AS objNoun
FROM Relations
ORDER BY id;

SELECT "Sets:";
SELECT
    id AS id,
    user_id AS userID,
    subj_id AS subjID,
    rel_id AS relID
FROM Sets
ORDER BY user_id, subj_id, rel_id;


SELECT "SemanticInputs:";
SELECT
    set_id AS setID,
    rat_val AS ratVal,
    obj_id AS objID
FROM SemanticInputs
ORDER BY set_id DESC, rat_val DESC;
