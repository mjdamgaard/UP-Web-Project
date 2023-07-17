
SELECT "Creators:";
SELECT
    entity_id AS entityID,
    user_id AS userID
FROM PrivateCreators
ORDER BY entity_id ASC, user_id ASC;


SELECT "Entities:";
SELECT
    id AS entID,
    type_id AS typeID,
    tmpl_id AS tmplID,
    def_str AS defStr
FROM Entities
ORDER BY id;


SELECT "SemanticInputs:";
SELECT
    user_id AS userID,
    cat_id AS catID,
    rat_val AS ratVal,
    inst_id AS instID
FROM SemanticInputs
ORDER BY user_id ASC, cat_id ASC, rat_val DESC;

SELECT "RecentInputs:";
SELECT
    id AS id,
    user_id AS userID,
    cat_id AS catID,
    rat_val AS ratVal,
    inst_id AS instID
FROM RecentInputs
ORDER BY id ASC;
