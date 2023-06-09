
SELECT "Creators:";
SELECT
    entity_t AS entityType,
    entity_id AS entityID,
    user_id AS userID
FROM PrivateCreators
ORDER BY entity_t ASC, entity_id ASC, user_id ASC;

SELECT "SemanticContexts:";
SELECT
    id AS catID,
    parent_context_id AS parentCxtID,
    def_str AS str
FROM SemanticContexts
ORDER BY id;

SELECT "Terms:";
SELECT
    id AS termID,
    context_id AS cxtID,
    def_str AS str,
    def_entity_t AS defEntType,
    def_entity_id AS defEntID
FROM Terms
ORDER BY id;


SELECT "SemanticInputs:";
SELECT
    user_id AS userID,
    pred_id AS predID,
    context_id AS ctxID,
    CONV(rat_val, 10, 16) AS ratVal,
    subj_id AS subjID
FROM SemanticInputs
ORDER BY user_id ASC, pred_id ASC, context_id ASC, rat_val DESC;

SELECT "RecentInputs:";
SELECT
    id AS id,
    user_id AS userID,
    pred_id AS predID,
    context_id AS ctxID,
    CONV(rat_val, 10, 16) AS ratVal,
    subj_id AS subjID
FROM RecentInputs
ORDER BY user_id ASC, pred_id ASC, context_id ASC, id ASC;
