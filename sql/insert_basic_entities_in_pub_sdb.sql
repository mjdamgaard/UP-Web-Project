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

-- define the string fields used in '.Full lexical item='.

INSERT INTO Strings (str)
VALUES (
    "can be referenced by the full (non-abbreviated) lexical item given by"
);
SET @fullLexItem_has_full_lex = 1;

INSERT INTO Strings (str)
VALUES (".Full lexical item=");
SET @abbrLexItem_has_full_lex = 2;




INSERT INTO Strings (str)
VALUES (
    CONCAT (
        "This relation states about its Subject and its Object, ",
        "the latter of which should be a text string that is part of an ",
        "English sentence with a meaning attached to it ",
        "(i.e. a lexical item), that the following is true: ",
        "The Object (a string) forms a lexical item that can be seen ",
        "as defining the Subject.\n",
        -- "\n",
        -- "For instance, if the Subject can be referenced by a noun, then the ",
        -- "Object could be a string forming that noun.",
        -- "And if the Subject is a relation that can be referenced by a verb, ",
        -- "then the Object could be a string forming that verb.\n",
        -- "\n",
        -- "A special example of the latter case is if the Subject is this very ",
        -- "relation descibed by this description. In that case, the Object ",
        -- "could be the string: \'can be referenced by the lexical item given ",
        -- "by\'.\n",
        -- -- I am choosing to let periods and commas be outside of the (single)
        -- -- quotation marks when it references a specific string or character.
        -- "\n",
        -- "As a standard, we propose that when the lexical items are nouns, ",
        -- "they should be capitalized (in a manner fitting to that noun). ",
        -- "(Note that nouns do not have to be single words; they can be ",
        -- "compound nouns as well.)"
        ""
    )
);
SET @description_has_full_lex = 3;


-- insert the '.Full lexical item=' fundamental relation.
INSERT INTO SimpleTerms (
    full_lexical_item,
    abbr_lexical_item,
    description
)
VALUES (
    @fullLexItem_has_full_lex,
    @abbrLexItem_has_full_lex,
    @description_has_full_lex
);
SET @rel_has_full_lex = 1;


-- define the string fields used in '.Lexical item='.
INSERT INTO Strings (str)
VALUES (
    "can be referenced by the abbreviated lexical item given by"
);
SET @fullLexItem_has_abbr_lex = 4;

INSERT INTO Strings (str)
VALUES (".Lexical item=");
SET @abbrLexItem_has_abbr_lex = 5;


INSERT INTO Strings (str)
VALUES (
    CONCAT (
        "This relation is similar to the relation with lexical item given by ",
        "\'can be referenced by the full (non-abbreviated) ",
        "lexical item given by\' ",
        "(and abbreviated lexical item given by \'.Full lexical item=\'), ",
        "except that the Object is this relation has to be the abbreviated ",
        "lexical item rather than the full lexical item.\n",
        -- "We propose the following standard for constructing ",
        -- "abbreviated lexical items:\n",
        -- " 1) Refer to abbreviated lexical items simply as ",
        --   "\t\'lexical items.\'\n",
        -- " 2) When referencing a relation, first of all reformulate the ",
        --   "\tfull lexical item as a sentence beginning with \'has a/an\' ",
        --   "\tand ending with \'given by\'. ",
        --   "\tThen replace \'has a/an\' with \'.\' and \'given by\' with ",
        --   "\teither \'=\' or \':\', remove any spaces before and after these ",
        --   "\treplacements, and capitalize the first letter after \'.\' ",
        --   "\tin the same fashion as for a section title in a text ",
        --   "\t(and indeed the sentence should now look like a section title). ",
        --   "\tUse \'=\' when expecting that users will generally only be "
        --   "\tinterested in querying about one Object ",
        --   "\t(i.e. the most fitting one) for the relation ",
        --   "\t(given a specific Subject). ",
        --   "\tAnd use \':\' when expecting that users will generally ",
        --   "\toften be interested in querying for several Objects fitting the ",
        --   "\trelation (given a specific Subject).\n",
        -- " 3) When referencing a predicate, consider first of all if it ",
        --   "\tis not possible to instead formulate that predicate via a ",
        --   "\trelation instead. ",
        --   "\tAnd if this is difficult in nature, simply abbreviate the full ",
        --   "\tlexical item by simplifying it (if possible) ",
        --   "\tas a shortened verb. ",
        --   "\t(Note that verbs do not have to be single words, ",
        --   "\tthough; they can be compound verbs as well.) ",
        --   "\tDo not capitalize the first letter if the lexical item ",
        --   "\tbegins with a verb.\n",
        -- " 4) When referencing things, simply choose a fitting ",
        --   "\t(possibly proper) noun and capitalize it in a fitting manner. ",
        --   "\tFor improper nouns, include an uncapitalized ",
        --   "\t\'a\' or \'an\' at the beginning."
        ""
    )
);
SET @description_has_abbr_lex = 6;


-- insert the '.Lexical item=' fundamental relation.
INSERT INTO SimpleTerms (
    full_lexical_item,
    abbr_lexical_item,
    description
)
VALUES (
    @fullLexItem_has_abbr_lex,
    @abbrLexItem_has_abbr_lex,
    @description_has_abbr_lex
);
SET @rel_has_abbr_lex = 2;



-- define the string fields used in '.Description='.

INSERT INTO Strings (str)
VALUES ("has a description given by");
SET @fullLexItem_has_description = 7;

INSERT INTO Strings (str)
VALUES (".Description=");
SET @abbrLexItem_has_description = 8;

INSERT INTO Strings (str)
VALUES ( -- TODO: write this description.
    "TODO: write this description.\n"
    -- "TODO: Write about standard of beginning relations with something like:\n",
    -- "Relation: Object (a String) forms a lexical item which references",
    -- "Subject (any Term)."
);
SET @description_has_description = 9;



-- insert the '.Description=' fundamental relation.
INSERT INTO SimpleTerms (
    full_lexical_item,
    abbr_lexical_item,
    description
)
VALUES (
    @fullLexItem_has_description,
    @abbrLexItem_has_description,
    @description_has_description
);
SET @rel_has_description = 3;


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
--     @fullLexItem_has_full_lex,
--     @abbrLexItem_has_full_lex,
--     @description_has_full_lex
-- );
-- SET @rel_has_full_lex = 1;

INSERT INTO SemanticInputs (
    subj_t, subj_id,
    user_t, user_id,
    rel_t, rel_id,
    obj_t, obj_id,
    rat_val, opt_data
)
VALUES (
    2, @rel_has_full_lex,
    0, @author_bot,
    2, @rel_has_full_lex,
    5, @fullLexItem_has_full_lex,
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
