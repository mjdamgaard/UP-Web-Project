USE mydatabase;


-- insert some users.
INSERT INTO Users () VALUES ();
INSERT INTO Users () VALUES ();
INSERT INTO Users () VALUES ();

-- insert some bots.
INSERT INTO Bots () VALUES ();
SET @author_bot = 1;
INSERT INTO Bots () VALUES ();
INSERT INTO Bots () VALUES ();



/* Inserting the most fundamental relations */

-- define the string fields used in '.full lexical item='.

INSERT INTO Strings (str)
VALUES (
    "can be referenced by the full (non-abbreviated) lexical item given by"
);
SET @Str_canbereferencedbyfulllex = 1 + 0x0A00000000000000;

INSERT INTO Strings (str)
VALUES (".full lexical item=");
SET @Str_dotfulllex = 2 + 0x0A00000000000000;




INSERT INTO Texts (str)
VALUES (
    CONCAT (
"This relation states about its Subject and its Object, ",
"the latter of which should be a text string that is part of an ",
"English sentence with a meaning attached to it ",
"(i.e. a lexical item), that the following is true: ",
"The Object (a string) forms a lexical item that can be seen ",
"as defining the Subject.\n",
"\t",
"For instance, if the Subject can be referenced by a noun, then the ",
"Object could be a string forming that noun.",
"And if the Subject is a relation that can be referenced by a verb, ",
"then the Object could be a string forming that verb.\n",
"\t",
"A special example of the latter case is if the Subject is this very ",
"relation descibed by this description. In that case, the Object ",
"could be the string: \'can be referenced by the lexical item given ",
"by\'.\n",
-- I am choosing to let periods and commas be outside of the (single)
-- quotation marks when it references a specific string or character.
"\t",
"As a standard, we propose that first letter are not capitalized, ",
"except if the word is part of a proper noun or an abbreviation that ",
"requires capitalization."
    )
);
SET @Text_description_of_rel_fulllex = 1 + 0x0B00000000000000;


-- insert the '.Full lexical item=' fundamental relation.
-- INSERT INTO SimpleTerms (
--     full_lexical_item,
--     abbr_lexical_item,
--     description
-- )
-- VALUES (
--     @Str_canbereferencedbyfulllex,
--     @Str_dotfulllex,
--     @Str_description_of_rel_fulllex
-- );
SET @Term_rel_hasfulllex = 1 + 0x0200000000000000;


-- define the string fields used in '.lexical item='.
INSERT INTO Strings (str)
VALUES (
    "can be referenced by the abbreviated lexical item given by"
);
SET @Str_canbereferencedbyabbrlex = 3 + 0x0A00000000000000;

INSERT INTO Strings (str)
VALUES (".lexical item=");
SET @Str_dotlexitem = 4 + 0x0A00000000000000;


INSERT INTO Texts (str)
VALUES (
    CONCAT (
"This relation is similar to the relation with lexical item given by ",
"\'can be referenced by the full (non-abbreviated) ",
"lexical item given by\' ",
"(and abbreviated lexical item given by \'.full lexical item=\'), ",
"except that the Object is this relation has to be the abbreviated ",
"lexical item rather than the full lexical item.\n",
"We propose the following standard for constructing ",
"abbreviated lexical items.\n\t",
-- TODO: I can write this shorter writing out the syntax instead..
"1) First letters should not be capitalized, except if the given word is part ",
"of a proper noun or an abbreviation that requires capitalization.\n\t",
"2) Refer to abbreviated lexical items simply as ",
"\'lexical items\' for short.\n\t",
" 3) When referencing a relation, first of all reformulate the ",
"full lexical item as a sentence beginning with \'has a/an\' ",
"and ending with \'given by\'. ",
"Then replace \'has a/an\' with \'.\' and \'given by\' with ",
"\'=\', and remove any whitespaces before and after these replacements. ",
-- "Use \'=\' when expecting that users will generally only be "
-- "interested in querying about one Object ",
-- "(i.e. the most fitting one) for the relation ",
-- "(given a specific Subject). ",
-- "And use \':\' when expecting that users will generally ",
-- "often be interested in querying for several Objects fitting the ",
-- "relation (given a specific Subject).\n",
-- " 3) When referencing a predicate, consider first of all if it ",
-- "is not possible to instead formulate that predicate via a ",
-- "relation instead. ",
"4) When referencing a predicate, simply abbreviate the full ",
"lexical item by simplifying it (if possible) ",
"as a shortened verb. ",
"(Note that verbs do not have to be single words, ",
"though; they can be compound verbs as well.) ",
"5) When referencing things, simply choose a fitting ",
"(possibly proper) noun. ",
"Do not include \'a\' or \'an\' at the beginning."
    )
);
SET @Text_description_of_haslexitem = 2 + 0x0B00000000000000;


-- insert the '.Lexical item=' fundamental relation.
-- INSERT INTO SimpleTerms (
--     full_lexical_item,
--     abbr_lexical_item,
--     description
-- )
-- VALUES (
--     @Str_canbereferencedbyabbrlex,
--     @Str_dotlexitem,
--     @Str_description_of_haslexitem
-- );
SET @Term_rel_haslex = 2 + 0x0200000000000000;



-- define the string fields used in '.Description='.

INSERT INTO Strings (str)
VALUES ("has a description given by");
SET @Str_has_description = 5 + 0x0A00000000000000;

INSERT INTO Strings (str)
VALUES (".description=");
SET @Str_dotdescription = 6 + 0x0A00000000000000;

INSERT INTO Texts (str)
VALUES ( -- TODO: write this description.
    "TODO: write this description.\n"
    -- "TODO: Write about standard of beginning relations with something like:\n",
    -- "Relation: Object (a String) forms a lexical item which references",
    -- "Subject (any Term)."
);
SET @Text_description_of_hasdescription = 3 + 0x0B00000000000000;



-- insert the '.Description=' fundamental relation.
-- INSERT INTO SimpleTerms (
--     full_lexical_item,
--     abbr_lexical_item,
--     description
-- )
-- VALUES (
--     @Str_has_description,
--     @Str_dotdescription,
--     @Str_description_of_hasdescription
-- );
SET @Term_rel_hasdescription = 3 + 0x0200000000000000;


-- types for reference:
-- SET @empty_t = -1;
-- SET @bot_t = 0;
-- SET @user_t = 1;
-- SET @simple_t = 2;
-- SET @relpred_t = 3;
-- SET @standard_t = 4;
-- SET @string_t = 5;
-- SET @binary_t = 6;
-- SET @list_t = 7;


-- connect these three (most) fundamental relations to their text fields via
-- themselves.



-- insert relations about '.Full lexical item='.

-- '.Full lexical item=' isert for reference:
-- INSERT INTO SimpleTerms (
--     full_lexical_item,
--     abbr_lexical_item,
--     description
-- )
-- VALUES (
--     @Str_canbereferencedbyfulllex,
--     @Str_dotfulllex,
--     @Str_description_of_rel_fulllex
-- );
-- SET @Term_rel_hasfulllex = 1;


-- insert ralations about '.full lexical item' relation.
INSERT INTO SemanticInputs (
    subj_id,
    user_id,
    rel_id,
    obj_id,
    rat_val, opt_data
)
VALUES
(
    @Term_rel_hasfulllex,
    @author_bot,
    @Term_rel_hasfulllex,
    @Str_canbereferencedbyfulllex,
    0x7FFFFFFF, NULL
),
(
    @Term_rel_hasfulllex,
    @author_bot,
    @Term_rel_haslex,
    @Str_dotfulllex,
    0x7FFFFFFF, NULL
),
(
    @Term_rel_hasfulllex,
    @author_bot,
    @Term_rel_hasdescription,
    @Text_description_of_rel_fulllex,
    0x7FFFFFFF, NULL
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
