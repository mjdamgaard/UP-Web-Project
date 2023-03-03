
DELETE FROM FundamentalCategories;
DELETE FROM FundamentalRelations;

DROP TABLE FundamentalCategories;
DROP TABLE FundamentalRelations;

/* These tables are not actually used in the semantic system directly. But
 * they are meant to contain some information about the fundamental terms
 * that the semantic database start out with. The information stored in
 * these tables are also supposed to be re-expressed semantically in the
 * database, i.e. by "semantic inputs."
 **/



CREATE TABLE FundamentalCategories (
    -- category ID offset.
    id_offset BIGINT UNSIGNED PRIMARY KEY,

    -- title.
    title VARCHAR(255),

    -- description.
    descr TEXT
);


INSERT INTO FundamentalCategories (
    id_offset,
    title,
    descr
)
VALUES (
    1,
    "Terms",
    "The category of all terms"
), (
    2,
    "Categories",
    "TODO"
), (
    3,
    "Keyword strings",
    "TODO"
), (
    4,
    "User groups",
    "TODO"
), (
    5,
    "Users",
    "TODO"
);



CREATE TABLE FundamentalRelations (
    -- relation ID offset.
    id_offset BIGINT UNSIGNED PRIMARY KEY,

    -- noun describing the object in terms of what the object is to the
    -- subject of the relation.
    -- TODO: mention forward and backwards syntax for parsing this noun from
    -- the realtion expressed as a verb.
    obj_noun VARCHAR(255),

    subj_cat VARCHAR(255), -- this would be a BIGINT id normally, but these
    -- entities are just for show, so we can just write the category as a
    -- string.
    obj_cat VARCHAR(255), -- this would be a BIGINT id normally, but these
    -- entities are just for show, so we can just write the category as a
    -- string.

    -- flag representing if relation expects only one object (in general) per
    -- subject.
    is_one_to_one BOOL

    -- description.
    descr TEXT,

);

INSERT INTO FundamentalRelations (
    id_offset,
    obj_noun,
    subj_cat,
    obj_cat,
    is_one_to_one,
    descr
)
VALUES (
    10,
    "Subcategories",
    "Category",
    "parent",
    FALSE,
    "TODO"
), (
    11,
    "Elements",
    "Category",
    "self",
    FALSE,
    "TODO"
),


-- CREATE VIEW FundamentalTerms (
--     -- simple term ID.
--     id BIGINT UNSIGNED PRIMARY KEY,
--
--     /* A SimpleTerm takes as its first descriptor a string denoting af
--      * lexical item (a semantically meaningful part of a sentence). Examples of
--      * lexical items could be: "the number pi", "is subset of",
--      * "has related link:", "is funny", "is" and "funny".
--      * The description is an (optional) text description, which can be used to
--      * explain the lexical item more thoroughly, and to clear up any potential
--      * ambiguities.
--      **/
--
--     -- defining lexical item.
--     lex_item BIGINT UNSIGNED,
--
--     -- description.
--     descr BIGINT UNSIGNED,
--
--     -- CONSTRAINT CHK_FundamentalTerms_lex_item CHECK (
--     --     lex_item BETWEEN 0xA000000000000000 AND 0xB000000000000000 - 1
--     -- ),
--     --
--     -- CONSTRAINT CHK_FundamentalTerms_descr CHECK (
--     --     descr BETWEEN 0xB000000000000000 AND 0xC000000000000000 - 1
--     -- )
-- );
