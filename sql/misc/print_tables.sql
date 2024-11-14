

SELECT "RecordedInputs:";
SELECT
    id AS id,
    user_id AS userID,
    stmt_id AS stmtID,
    rat_val AS ratVal
FROM RecordedInputs
ORDER BY id ASC;


SELECT "Scores:";
SELECT
    user_id AS userID,
    scale_id AS scaleID,
    score_val AS scoreVal,
    subj_id AS subjID
FROM Scores
ORDER BY userID ASC, scaleID ASC, scoreVal DESC;


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
    id,
    type_ident,
    def_str,
    creator_id,
    is_private
FROM Entities
ORDER BY id;
