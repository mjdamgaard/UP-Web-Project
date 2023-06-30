
SELECT "Creators:";
SELECT
    entity_id AS entityID,
    user_id AS userID
FROM PrivateCreators
ORDER BY entity_id ASC, user_id ASC;


SELECT "Terms:";
SELECT
    id AS termID,
    context_id AS cxtID,
    def_str AS str
FROM Terms
ORDER BY id;


SELECT "SemanticInputs:";
SELECT
    user_id AS userID,
    pred_id AS predID,
    rat_val AS ratVal,
    subj_id AS subjID
FROM SemanticInputs
ORDER BY user_id ASC, pred_id ASC, rat_val DESC;

SELECT "RecentInputs:";
SELECT
    id AS id,
    user_id AS userID,
    pred_id AS predID,
    rat_val AS ratVal,
    subj_id AS subjID
FROM RecentInputs
ORDER BY user_id ASC, pred_id ASC, id ASC;
