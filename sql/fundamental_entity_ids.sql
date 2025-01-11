
DROP VIEW FundamentalEntityIDs;

CREATE ALGORITHM = MERGE VIEW FundamentalEntityIDs AS
    SELECT "user_score"     AS ident, 11 AS id
    UNION
    SELECT "min_contr"      AS ident, 12 AS id
    UNION
    SELECT "max_contr"      AS ident, 13 AS id
    UNION
    SELECT "score_med"      AS ident, 14 AS id;
