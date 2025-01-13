
DROP VIEW FundamentalEntityIDs;

CREATE VIEW FundamentalEntityIDs AS
    SELECT "user_score" AS ident, 56 AS id
    UNION
    SELECT "min_contr" AS ident, 59 AS id
    UNION
    SELECT "max_contr" AS ident, 63 AS id
    UNION
    SELECT "score_med" AS ident, 66 AS id;
