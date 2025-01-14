
DROP VIEW FundamentalEntityIDs;

CREATE VIEW FundamentalEntityIDs AS
    SELECT "user_score" AS ident, 81 AS id
    UNION
    SELECT "min_contr" AS ident, 76 AS id
    UNION
    SELECT "max_contr" AS ident, 75 AS id
    UNION
    SELECT "score_med" AS ident, 61 AS id;
