USE mydatabase;


-- insert some users.
INSERT INTO Users () VALUES ();
INSERT INTO Users () VALUES ();
INSERT INTO Users () VALUES ();

UPDATE Users SET public_encryption_key = 0xAAAA WHERE id = 1;



-- insert basic keywords used for attributes and their values.
INSERT INTO TVarChars (str) VALUES (".type="); SET @att_type = 1;
    -- insert some basic values of type attribute
    INSERT INTO TVarChars (str) VALUES ("predicate"); SET @type_pred = 2;
    INSERT INTO TVarChars (str) VALUES ("relation"); SET @type_rel = 3;
    -- Term is the default type so it is not needed:
    -- INSERT INTO TVarChars (str) VALUES ("term");

INSERT INTO TVarChars (str) VALUES (".lexicalItem="); SET @att_lex = 4;
INSERT INTO TVarChars (str) VALUES (".description="); SET @att_descript = 5;

INSERT INTO TVarChars (str) VALUES (".identifierSuggestion:"); SET @att_id = 6;
INSERT INTO TVarChars (str) VALUES (".relevantKeyword:"); SET @att_kw = 7;

-- This is perhaps all we need to start with..



-- insert a basic srel lists.
-- INSERT INTO L2Lists (
--     element_1_type, element_1,
--     element_2_type, element_2
-- )
-- VALUES (
--     21, @att_type,
--     21, @att_lex
-- );
-- SET @srel_basic = 1;
-- ...wait, no, this does not make sense to have, cause without the description,
-- there is no need to use a described term rather than.. hm, unless...

INSERT INTO L3Lists (
    element_1_type, element_1,
    element_2_type, element_2,
    element_3_type, element_3
)
VALUES (
    21, @att_type,
    21, @att_lex,
    21, @att_descript
);
SET @srel_basic = 1;




-- insert a basic cpreds_and_srels list.
INSERT INTO L2Lists (
    element_1_type, element_1,
    element_2_type, element_2
)
VALUES (
    40, 0, -- the empty list.
    42, @srel_basic
);
SET @cps_srs_basic = 1;




-- Now we can insert some basic relation.

-- first we define some srel input lists.
INSERT INTO TVarChars (str) VALUES ("..."); SET @att_kw = 8;

INSERT INTO L2Lists (
    element_1_type, element_1,
    element_2_type, element_2
)
VALUES (
    21, @type_pred,
    21, @att_lex
);
SET @srel_basic = 1;





-- insert a basic cpreds_and_srels list.
INSERT INTO L2Lists (
    element_1_type, element_1,
    element_2_type, element_2
)
VALUES (
    40, 0, -- the empty list.
    43, @srel_basic
);
SET @cps_srs_basic = 1;

INSERT INTO DescribedEntities (
    cpreds_and_srels,
    srel_inputs_type, srel_inputs
)
VALUES (
    @cps_srs_basic,
    43, @srel_basic
);
SET @cps_srs_basic = 1;
