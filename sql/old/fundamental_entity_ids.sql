
DROP VIEW FundamentalEntityIDs;

CREATE VIEW FundamentalEntityIDs AS
    SELECT "this_db_node" AS ident, 18 AS id
    UNION
    SELECT "user_score" AS ident, 57 AS id
    UNION
    SELECT "min_contr" AS ident, 56 AS id
    UNION
    SELECT "max_contr" AS ident, 50 AS id
    UNION
    SELECT "score_med" AS ident, 91 AS id;
