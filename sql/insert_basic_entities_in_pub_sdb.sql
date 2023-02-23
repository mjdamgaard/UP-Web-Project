USE mydatabase;


-- insert some users.
INSERT INTO Users () VALUES ();
INSERT INTO Users () VALUES ();
INSERT INTO Users () VALUES ();

UPDATE Users SET public_encryption_key = 0xAAAA WHERE id = 1;



/* Inserting the most fundamental relations */

-- define the string fields used in '.lexicalItem=' and '.description='.
INSERT INTO Strings (str)
VALUES (1, "can be referenced by the lexical item given by");
SET @has_lex_item = 1;

INSERT INTO Strings (str)
VALUES ("has a description given by");
SET @has_description = 2;

INSERT INTO Strings (str)
VALUES (
    "This relation states about its Subject and its Object, " +
    "the latter of which should be a text string that is part of an English "
    "sentence with a meaning attached to it (i.e. a lexical item), " +
    "that the following is true.\n" +
    "The Object (a string) forms a lexical item that can be seen as defining " +
    "the Subject.\n" +
    "For instance, if the Subject can be referenced by a noun, then the " +
    "Object could be a string forming that noun." +
    "And if the Subject is a relation that can be referenced by a verb, then " +
    "the Object could be a string forming that verb.\n"
    "A special example of the latter case is if the Subject is this very " +
    "relation descibed by this description. In that case, the Object could " +
    "be the string: \"can be referenced by the lexical item given by.\""
);
SET @description_of_has_lex_item = 3;

INSERT INTO Strings (str)
VALUES ( -- TODO: write this description.
    "TODO: write this description."
);
SET @description_of_has_description = 4;


-- insert the "can be referenced by the lexical item given by" relation.
INSERT INTO SimpleTerms (
    spec_lexical_item_id,
    description_id
)
VALUES (
    @has_lex_item,
    @has_description
);

-- insert the "has a description given by" relation.
INSERT INTO SimpleTerms (
    spec_lexical_item_id,
    description_id
)
VALUES (
    @has_description,
    @description_of_has_description
);












-- -- insert basic keywords used for attributes and their values.
-- INSERT INTO TVarChars (str) VALUES (".type="); SET @att_type = 1;
--     -- insert some basic values of type attribute
--     INSERT INTO TVarChars (str) VALUES ("predicate"); SET @type_pred = 2;
--     INSERT INTO TVarChars (str) VALUES ("relation"); SET @type_rel = 3;
--     -- Term is the default type so it is not needed:
--     -- INSERT INTO TVarChars (str) VALUES ("term");
--
-- INSERT INTO TVarChars (str) VALUES (".lexicalItem="); SET @att_lex = 4;
-- INSERT INTO TVarChars (str) VALUES (".description="); SET @att_descript = 5;
--
-- INSERT INTO TVarChars (str) VALUES (".identifierSuggestion:"); SET @att_id = 6;
-- INSERT INTO TVarChars (str) VALUES (".relevantKeyword:"); SET @att_kw = 7;
--
-- -- This is perhaps all we need to start with..
--
--
--
-- -- insert a basic srel lists.
-- -- INSERT INTO L2Lists (
-- --     element_1_type, element_1,
-- --     element_2_type, element_2
-- -- )
-- -- VALUES (
-- --     21, @att_type,
-- --     21, @att_lex
-- -- );
-- -- SET @srel_basic = 1;
-- -- ...wait, no, this does not make sense to have, cause without the description,
-- -- there is no need to use a described term rather than.. hm, unless...
--
-- INSERT INTO L3Lists (
--     element_1_type, element_1,
--     element_2_type, element_2,
--     element_3_type, element_3
-- )
-- VALUES (
--     21, @att_type,
--     21, @att_lex,
--     21, @att_descript
-- );
-- SET @srel_basic = 1;
--
--
--
--
-- -- insert a basic cpreds_and_srels list.
-- INSERT INTO L2Lists (
--     element_1_type, element_1,
--     element_2_type, element_2
-- )
-- VALUES (
--     40, NULL, -- 0, -- the empty list.
--     42, @srel_basic
-- );
-- SET @cps_srs_basic = 1;
--
--
--
--
-- -- Now we can insert some basic relation.
--
-- -- first we define some srel input lists.
-- INSERT INTO TVarChars (str) VALUES ("..."); SET @att_kw = 8;
--
-- INSERT INTO L2Lists (
--     element_1_type, element_1,
--     element_2_type, element_2
-- )
-- VALUES (
--     21, @type_pred,
--     21, @att_lex
-- );
-- SET @srel_basic = 1;
--
--
--
--
--
-- -- insert a basic cpreds_and_srels list.
-- INSERT INTO L2Lists (
--     element_1_type, element_1,
--     element_2_type, element_2
-- )
-- VALUES (
--     40, 0, -- the empty list.
--     43, @srel_basic
-- );
-- SET @cps_srs_basic = 1;
--
-- INSERT INTO DescribedEntities (
--     cpreds_and_srels,
--     srel_inputs_type, srel_inputs
-- )
-- VALUES (
--     @cps_srs_basic,
--     43, @srel_basic
-- );
-- SET @cps_srs_basic = 1;
