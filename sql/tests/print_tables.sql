
SELECT "Creators:";
SELECT
    entity_t AS entityType,
    entity_id AS entityID,
    user_id AS userID
FROM Creators
ORDER BY entity_t ASC, entity_id ASC, user_id ASC;

SELECT "SemanticContexts:";
SELECT
    id AS catID,
    parent_context_id AS parentCxtID,
    title
FROM SemanticContexts
ORDER BY id;

SELECT "Terms:";
SELECT
    id AS termID,
    context_id AS cxtID,
    title,
    spec_entity_t AS specType,
    spec_entity_id AS specID
FROM Terms
ORDER BY id;


SELECT "SemanticInputs:";
SELECT
    user_id AS userID,
    pred_id AS predID,
    subj_t AS subjType,
    rat_val AS ratVal,
    subj_id AS subjID
FROM SemanticInputs
ORDER BY user_id ASC, pred_id ASC, subj_t ASC, rat_val DESC;

SELECT "RecentInputs:";
SELECT
    id AS id,
    user_id AS userID,
    pred_id AS predID,
    subj_t AS subjType,
    rat_val AS ratVal,
    obj_id AS objID
FROM RecentInputs
ORDER BY user_id ASC, pred_id ASC, subj_t ASC, id ASC;
