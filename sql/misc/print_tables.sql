
SELECT "Creators:";
SELECT
    ent_id AS entID,
    user_id AS userID
FROM Private_Creators
ORDER BY ent_id ASC, user_id ASC;

SELECT "RecentInputs:";
SELECT
    id AS id,
    user_id AS userID,
    cat_id AS catID,
    inst_id AS instID,
    rat_val AS ratVal,
    live_at_time AS liveAtTime
FROM Private_RecentInputs
ORDER BY id ASC;


SELECT "SemanticInputs:";
SELECT
    user_id AS userID,
    cat_id AS catID,
    rat_val AS ratVal,
    inst_id AS instID
FROM SemanticInputs
ORDER BY user_id ASC, cat_id ASC, rat_val DESC;


-- SELECT "UserData:";
-- SELECT *
-- FROM Private_UserData
-- ORDER BY user_id;
SELECT "Sessions:";
SELECT *
FROM Private_Sessions
ORDER BY user_id;
SELECT "EMails:";
SELECT *
FROM Private_EMails;



SELECT "Users:";
SELECT *
FROM Users
ORDER BY id;

SELECT "Entities:";
SELECT
    id AS entID,
    type_id AS typeID,
    cxt_id AS cxtID,
    SUBSTRING(def_str, 1, 80) AS defStr_substring
FROM Entities
ORDER BY id;
