
DROP VIEW FundamentalEntityIDs;

CREATE VIEW FundamentalEntityIDs AS
    SELECT "user_score" AS ident, 26 AS id
    UNION
    SELECT "min_contr" AS ident, 34 AS id
    UNION
    SELECT "max_contr" AS ident, 31 AS id
    UNION
    SELECT "score_med" AS ident, 54 AS id;
