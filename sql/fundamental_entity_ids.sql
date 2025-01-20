
DROP VIEW FundamentalEntityIDs;

CREATE VIEW FundamentalEntityIDs AS
    SELECT "this_db_node" AS ident, 18 AS id
    UNION
    SELECT "user_score" AS ident, 39 AS id
    UNION
    SELECT "min_contr" AS ident, 35 AS id
    UNION
    SELECT "max_contr" AS ident, 83 AS id
    UNION
    SELECT "score_med" AS ident, 86 AS id;
