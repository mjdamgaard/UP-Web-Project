
-- TODO: Create a database dump as well, such that the whole installation can be
-- done more quickly and with a single SQL file.

DELETE FROM SemanticInputs;
DELETE FROM Private_RecentInputs;
ALTER TABLE Private_RecentInputs AUTO_INCREMENT=1;
DELETE FROM RecordedInputs;
DELETE FROM StringIndexKeys;

DELETE FROM Strings;
ALTER TABLE Strings AUTO_INCREMENT=1;

-- DELETE FROM UsersAndBots;

DELETE FROM Texts;
DELETE FROM Binaries;

DELETE FROM BotData;
DELETE FROM Private_UserData;
DELETE FROM Private_Sessions;
DELETE FROM Private_EMails;

-- SET FOREIGN_KEY_CHECKS = 0;

/* From create_open_sdb.sql */
INSERT INTO Strings (str, id)
VALUES
    -- Most fundamental three types:
    ("something", 1),
    ("type", 2),
    ("tag", 3),
-- ("template| for entity strings", 4), -- reserved letter: 't'.
-- ("user| of this network", 5),  -- reserved letter: 'u'.
-- ("bot| for aggregation", 6), -- reserved letter: 'u'. (also a "user")
-- ("text| (internally stored)", 7), -- reserved letter: 'x'.
-- ("binary| (internally stored)", 8), -- reserved letter: 'b'.
-- ("index| of entity strings", 9), -- reserved letter: 'i'.
-- ("user/bot| of this network", 10);
    -- Now the so-called specifications, such as ' for entity strings' etc.
    -- above, can just be added at some later appropriate point, once we have
    -- implemented dealing with duplicates, which will now not very hard.
    -- Oh, and we also won't need templates at all as a fundamental thing.
    ("user/bot", 4), -- reserved letter: 'u'.
    ("user", 5),  -- reserved letter: 'u'.
    ("bot", 6), -- reserved letter: 'u'.
    ("text data", 7), -- reserved letter: 't'.
    ("binary data", 8), -- reserved letter: 'b'.
    ("index", 9); -- reserved letter: 'i'.
    -- The reserved letters here are when typing out placeholders for string
    -- templates, or references for link substitutions (string substitutions
    -- don't need types). These are however converted to the IDs before the
    -- string is uploaded. (See 23-xx note collection.tex currently for more
    -- info. (28.03.24))

-- (29.03.24) [...] let us actually just
-- reserve all single letters, and all single symbols as well, meaning that
-- users can't expect to type out custom single-symbol types for there entity
-- references, e.g.\ as in '@s[axophone]', and then expect the app to find the
-- string ID of 's' and insert it in its place.
-- ... Oh, but what about e.g. Chinese?.. ..Hm, let's just reserve all ASCII
-- symbols, then..


-- INSERT INTO UsersAndBots (username, id)
-- VALUES ("initial_user", 1);


-- We skip some numbers here, such that it is easier to insert other
-- fundamental types (or other entities) in the future, or to remap some
-- existing entity strings to a low number, if that becomes a desire.

INSERT INTO Strings (str, id)
VALUES
    -- Some fundamental templates, plus some more types, such as 'property.'
    ("property", 40),
    ("<property> of <any>", 41),
    ("statement", 42),
    ("<tag> fits <any>", 43);
    -- ("aggregate category", 53);

INSERT INTO Strings (str, id)
VALUES
    -- Some fundamental aggregation bots.
    ("creator_rater_bot", 60),
    ("statement_user_rater_bot", 61),
    ("mean_with_offset_3_bot", 62);


-- We also skip some numbers here, for the same reason.

INSERT INTO Strings (str, id)
VALUES
    ("example of a not very useful entity||eapefnteysflniy", 1000);



-- SELECT SLEEP(1);

/* Some more inserts and also ratings, now using the input_procs API */

CALL insertOrFindString(1, 0, "music"); -- id: (1000) +1
CALL insertOrFindString(1, 0, "rock music"); -- id: +2
CALL insertOrFindString(1, 0, "jazz"); -- id: +3

CALL insertOrFindString(1, 0, "movie"); -- id: +4
CALL insertOrFindString(1, 0, "year"); -- id: +5
CALL insertOrFindString(1, 0, "director"); -- id: +6
CALL insertOrFindString(1, 0, "2001"); -- id: +8
CALL insertOrFindString(1, 0, "2002"); -- id: +9
CALL insertOrFindString(1, 0, "person"); -- id: +10
CALL insertOrFindString(1, 0, "Peter Jackson"); -- id: +11
CALL insertOrFindString(1, 0, CONCAT(
    "The Lord of the Rings: The Fellowship of the Ring"
)); -- id: +12
CALL insertOrFindString(1, 0, "@2[1004], @1005[1008]"); -- id: +13
    -- renders as: "movie, 2001".
CALL insertOrFindString(1, 0, "#1012:1013"); -- id: +14
    -- renders as: "The Lord of the Rings: The Fellowship of the Ring
    -- <i>movie, 2001</i>".
CALL insertOrFindString(1, 0,
    "The Lord of the Rings: The Two Towers"
); -- id: +15
CALL insertOrFindString(1, 0, "@2[1004], @1005[1009]"); -- id: +16
    -- renders as: "movie, 2002".
CALL insertOrFindString(1, 0, "#1015:1016"); -- id: +17
    -- renders as: "The Lord of the Rings: The Two Towers <i>movie, 2002</i>".

-- These two examples (the two movies above, i.e.) are examples of what we
-- might call 'specified titles.' Note that the first part of such 'specified
-- titles,' i.e.\ the 'title' part, should be as searchable as possible, and
-- therefore should preferably include no '@'-references. The second part,
-- on the other hand is free to use as many '@'-references (or 'entity
-- references' more formally) as they like (and it can be a good idea to
-- use them a lot). *(We can call this second part the 'specification,' btw.)
-- Specified titles are very useful for the fundamental things that we want
-- to rate, i.e.\ things of the "real word," also counting fictional things
-- of the real world as being "of the real world" here. Other kinds of
-- entities include the tags. (Of course it is also often useful to
-- rate tags, but only so that we can ultimately better rate the "real-world"
-- (non-meta) things.) We do not need to specify the tags too precisely.
-- For instance, it is not necessary to specify what we mean by the tag
-- 'funny' any further, but as for a thing like The Lord of the Rings: The
-- Two Towers, it is more important to be specify what we are talking about,
-- at least enough so that it is the same movie that all users are thinking
-- about when they rate it.



CALL insertOrFindString(1, 0, "science"); -- id: +18
CALL insertOrFindString(1, 0, "musicology|#32"); -- id: +19
CALL insertOrFindString(1, 0, "cinematography|#32"); -- id: +20
CALL insertOrFindString(1, 0, "physics|#32"); -- id: +21
CALL insertOrFindString(1, 0, "mathematics|#32"); -- id: +22

-- SELECT SLEEP(1);


CALL insertOrFindString(1, 0, "subcategory"); -- id: +23
CALL insertOrFindString(1, 0, "@40[1023] of @3[1]"); -- id: +24

CALL insertOrUpdateRating(1, 3, 1024, 1018, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(1, 3, 1024, 1021, CONV("E000", 16, 10), 1);
CALL insertOrUpdateRating(1, 3, 1024, 1022, CONV("E000", 16, 10), 1);
CALL insertOrUpdateRating(1, 3, 1024, 1001, CONV("F000", 16, 10), 1);
CALL insertOrUpdateRating(1, 3, 1024, 1004, CONV("F000", 16, 10), 1);
CALL insertOrUpdateRating(1, 3, 1024, 1000, CONV("0100", 16, 10), 1);

-- SELECT SLEEP(1);


CALL insertOrFindString(1, 0, "@40[1023] of @3[1001]"); -- id: +25
CALL insertOrUpdateRating(1, 3, 1025, 1002, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(1, 3, 1025, 1003, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(1, 3, 1025, 1019, CONV("E000", 16, 10), 1);
CALL insertOrUpdateRating(1, 3, 1025, 1000, CONV("0100", 16, 10), 1);

CALL insertOrFindString(1, 0, "@40[1023] of @3[1018]"); -- id: +26
CALL insertOrUpdateRating(1, 3, 1026, 1019, CONV("F000", 16, 10), 1);
CALL insertOrUpdateRating(1, 3, 1026, 1020, CONV("F100", 16, 10), 1);
CALL insertOrUpdateRating(1, 3, 1026, 1021, CONV("F200", 16, 10), 1);
CALL insertOrUpdateRating(1, 3, 1026, 1022, CONV("F100", 16, 10), 1);


CALL insertOrUpdateRating(1, 1, 1, 1002, CONV("A100", 16, 10), 1);
CALL insertOrUpdateRating(1, 1, 1, 1014, CONV("C400", 16, 10), 1);
CALL insertOrUpdateRating(1, 1, 1, 1017, CONV("C000", 16, 10), 1);

CALL insertOrUpdateRating(1, 1, 1004, 1014, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(1, 1, 1004, 1017, CONV("FE00", 16, 10), 1);

-- SELECT SLEEP(1);

CALL insertOrFindString(1, 0, "related entity"); -- id: +27

-- (Note the '1' is omitted here after the '@'. *No, not after all..)
CALL insertOrFindString(1, 0, "@40[1027] of @1[1014]"); -- id: +28
CALL insertOrUpdateRating(1, 1, 1028, 1017, CONV("FF00", 16, 10), 1);
CALL insertOrFindString(1, 0, "@40[1027] of @1[1017]"); -- id: +29
CALL insertOrUpdateRating(1, 1, 1029, 1014, CONV("FF00", 16, 10), 1);

CALL insertOrFindString(1, 0, "@40[1027] of @1[1004]"); -- id: +30
CALL insertOrUpdateRating(1, 1, 1030, 1019, CONV("F000", 16, 10), 1);
CALL insertOrFindString(1, 0, "@40[1027] of @1[1019]"); -- id: +31
CALL insertOrUpdateRating(1, 1, 1031, 1004, CONV("FF00", 16, 10), 1);


CALL insertOrFindString(1, 0, "supercategory"); -- id: +32

-- SELECT SLEEP(1);


CALL insertOrFindString(1, 0, "good"); -- id: +33
CALL insertOrFindString(1, 0, "funny"); -- id: +34
CALL insertOrFindString(1, 0, "scary"); -- id: +35
CALL insertOrFindString(1, 0, "iconic"); -- id: +36


CALL insertOrFindString(1, 0, "relevant tag to rate"); -- id: +37

CALL insertOrFindString(1, 0, "@40[1037] of @2[1004]"); -- id: +38
CALL insertOrUpdateRating(1, 3, 1038, 1033, CONV("F000", 16, 10), 1);
CALL insertOrUpdateRating(1, 3, 1038, 1034, CONV("E100", 16, 10), 1);
CALL insertOrUpdateRating(1, 3, 1038, 1035, CONV("E000", 16, 10), 1);


CALL insertOrFindString(1, 0, "@40[1037] of @1004[1014]"); -- id: +39
CALL insertOrUpdateRating(1, 3, 1039, 1033, CONV("F000", 16, 10), 1);
CALL insertOrUpdateRating(1, 3, 1039, 1034, CONV("E100", 16, 10), 1);
CALL insertOrUpdateRating(1, 3, 1039, 1035, CONV("EA00", 16, 10), 1);
CALL insertOrUpdateRating(1, 3, 1039, 1036, CONV("E000", 16, 10), 1);

CALL insertOrFindString(1, 0, "@40[1037] of @2[1]"); -- id: +40
CALL insertOrUpdateRating(1, 3, 1040, 1033, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(1, 3, 1040, 1034, CONV("9000", 16, 10), 1);

-- SELECT SLEEP(1);


CALL insertOrFindString(1, 0, "relevant property"); -- id: +41
-- CALL insertOrFindString(1, 0, "director"); -- id: +6
-- CALL insertOrFindString(1, 0, "person"); -- id: +10
CALL insertOrFindString(1, 0, "time"); -- id: +42
CALL insertOrFindString(1, 0, "running time"); -- id: +43
CALL insertOrFindString(1, 0, "actor"); -- id: +44

CALL insertOrFindString(1, 0, "@40[1041] of @2[1004]"); -- id: +45
CALL insertOrUpdateRating(1, 40, 1045, 1006, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(1, 40, 1045, 1044, CONV("FE00", 16, 10), 1);
CALL insertOrUpdateRating(1, 40, 1045, 1043, CONV("FC00", 16, 10), 1);



-- CALL insertOrFindString(1, 0, "Peter Jackson"); -- id: +11
CALL insertOrFindString(1, 0, "Ian McKellen"); -- id: +46
CALL insertOrFindString(1, 0, "Viggo Mortensen"); -- id: +47
CALL insertOrFindString(1, 0, "Elijah Wood"); -- id: +48

CALL insertOrFindString(1, 0, "2 h 59 min"); -- id: +49

CALL insertOrFindString(1, 0, "@40[1006] of @1004[1014]"); -- id: +50
CALL insertOrFindString(1, 0, "@40[1044] of @1004[1014]"); -- id: +51
CALL insertOrFindString(1, 0, "@40[1043] of @1004[1014]"); -- id: +52
CALL insertOrUpdateRating(1, 1006, 1050, 1011, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(1, 1044, 1051, 1046, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(1, 1044, 1051, 1047, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(1, 1044, 1051, 1048, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(1, 1042, 1052, 1049, CONV("FF00", 16, 10), 1);

-- SELECT SLEEP(1);

-- CALL insertOrFindTemplate(1, 0, 61, CONCAT(
--     "{<Popular name>}, <Full name>, <Year of birth>, ",
--     "<What the person is known for being>"
--     -- (Could have written "is/was" here instead, but maybe it's best to just
--     -- keep away from the past tense in general.)
-- )); -- id: 66
-- CALL insertOrFindString(1, 0, 61, 66,
--     "Peter Jackson|Peter Robert Jackson|1961|Film director"); -- id: 67
-- CALL insertOrFindString(1, 0, 61, 66,
--     "Ian McKellen|Ian Murray McKellen|1939|Actor"); -- id: 68
-- CALL insertOrFindString(1, 0, 61, 66,
--     "Viggo Mortensen|Viggo Peter Mortensen Jr.|1958|Actor"); -- id: 69
-- CALL insertOrFindString(1, 0, 61, 66,
--     "Elijah Wood|Elijah Jordan Wood|1981|Actor"); -- id: 70
-- CALL insertOrFindString(1, 0, 64, 0,"2 h 59 min"); -- id: 71

-- SELECT SLEEP(1);



-- CALL insertOrFindType(1, 0, "Statement"); -- id: 75
-- CALL insertOrFindTemplate(1, 0, 75,
--     "{<something> is an} important/useful{ instance of <Category>}"); -- id: 76
-- CALL insertOrFindTemplate(1, 0, 2,
--     "Users that rate <Statement> positively"); -- id: 77


-- CALL insertOrFindTemplate(1, 0, 6,
--     "<Name>; <Overall description>; <Event data documentation>;"); -- id: 78
-- CALL insertOrFindString(1, 0, 6, 78, CONCAT(
--     "statement_user_rater_bot|",
--     "Rates users as instances categories of the #77 template, with ratings ",
--     "equal to those of the users regarding the given statement.|"
--     "Uses no event data"
-- )); -- id: 79




-- CALL insertOrFindType(1, 0, "Event data documentation"); -- id: 80
-- CALL insertOrFindString(1, 0, 80, 0, CONCAT(
--     "obj: Statement; ",
--     "data_1: Current averaged rating value scaled up as a ulong (for more ",
--     "precision), with a neutral rating (of 5/10) as the initial value; ",
--     "data_2: Number of users that have rated obj, plus an offset of 3;"
-- )); -- id: 81
-- CALL insertOrFindString(1, 0, 6, 78, CONCAT(
--     "mean_with_offset_3_bot|",
--     "Rates all statements according to an arithmetic mean of all users, biased",
--     "towards a neutral rating (5/10) by using an offset of 3 neutral ratings.|",
--     "#81;"
-- )); -- id: 82


-- CALL insertOrFindTemplate(1, 0, 2, "Creations of <User>"); -- id: 83

-- CALL insertOrFindString(1, 0, 6, 78, CONCAT(
--     "creator_rater_bot|",
--     "Rates entities as instances of categories of the #83 template (with ",
--     "maximal rating values) if the relevant users have chosen to be recorded ",
--     "as the creators.|"
--     "Uses no event data"
-- )); -- id: 84

-- SELECT SLEEP(1);


CALL insertOrFindString(1, 0, "hip hop music"); -- id: +53
CALL insertOrFindString(1, 0, "pop music"); -- id: +54
CALL insertOrFindString(1, 0, "classical music"); -- id: +55
CALL insertOrUpdateRating(1, 3, 1025, 1053, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(1, 3, 1025, 1054, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(1, 3, 1025, 1055, CONV("FF00", 16, 10), 1);

CALL insertOrFindString(1, 0, "geology"); -- id: +56
CALL insertOrUpdateRating(1, 3, 1026, 1056, CONV("F100", 16, 10), 1);




-- TODO: Continue correcting/changing this initial_inserts program.



-- CALL insertOrUpdateRating(1, 11, 1, CONV("E000", 16, 10), 1);
-- CALL insertOrUpdateRating(1, 11, 2, CONV("FF00", 16, 10), 1);
-- CALL insertOrUpdateRating(1, 11, 3, CONV("E000", 16, 10), 1);
-- CALL insertOrUpdateRating(1, 11, 5, CONV("EF00", 16, 10), 1);
-- CALL insertOrUpdateRating(1, 11, 6, CONV("EF00", 16, 10), 1);
-- CALL insertOrUpdateRating(1, 11, 7, CONV("EF00", 16, 10), 1);
-- CALL insertOrUpdateRating(1, 11, 8, CONV("EF00", 16, 10), 1);
-- CALL insertOrUpdateRating(1, 11, 27, CONV("FF00", 16, 10), 1);
-- CALL insertOrUpdateRating(1, 11, 61, CONV("FF00", 16, 10), 1);
-- CALL insertOrUpdateRating(1, 11, 64, CONV("EF00", 16, 10), 1);
-- CALL insertOrUpdateRating(1, 11, 75, CONV("E000", 16, 10), 1);


-- CALL insertOrFindString(1, 0, 2, 0, "Has good acting"); -- id: 90
-- -- Recommendation: Avoid creating categories from verbs starting with 'Is.'
-- CALL insertOrUpdateRating(1, 53, 90, CONV("E000", 16, 10), 1);


-- SELECT SLEEP(1);

-- Make some room for some other initial inserts in the future (where we must
-- just remap the IDs, if these entities have already been inserted by users):
ALTER TABLE Strings AUTO_INCREMENT=3000;

SELECT "Calling publicizeRecentInputs() can take a while (about 1 minute):";
-- (It takes roughly 30 seconds on my laptop.)
CALL publicizeRecentInputs ();

-- SET FOREIGN_KEY_CHECKS = 1;
