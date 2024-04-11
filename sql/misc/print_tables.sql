

SELECT "RecentInputs:";
SELECT
    id AS id,
    user_id AS userID,
    tag_id AS tagID,
    inst_id AS instID,
    rat_val AS ratVal,
    live_at_time AS liveAtTime
FROM Private_RecentInputs
ORDER BY id ASC;


SELECT "SemanticInputs:";
SELECT
    user_id AS userID,
    tag_id AS tagID,
    rat_val AS ratVal,
    inst_id AS instID
FROM SemanticInputs
ORDER BY user_id ASC, tag_id ASC, rat_val DESC;


-- SELECT "UserData:";
-- SELECT *
-- FROM Private_UserData
-- ORDER BY user_id;
-- SELECT "Sessions:";
-- SELECT *
-- FROM Private_Sessions
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
    SUBSTRING(def, 1, 80) AS def
FROM Entities
ORDER BY id;
