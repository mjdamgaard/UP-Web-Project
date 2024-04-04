
-- TODO: Create a database dump as well, such that the whole installation can be
-- done more quickly and with a single SQL file.

DELETE FROM SemanticInputs;
DELETE FROM Private_RecentInputs;
ALTER TABLE Private_RecentInputs AUTO_INCREMENT=1;
DELETE FROM RecordedInputs;
DELETE FROM EntityIndexKeys;

DELETE FROM Entities;
ALTER TABLE Entities AUTO_INCREMENT=1;

-- DELETE FROM UsersAndBots;

DELETE FROM Texts;
DELETE FROM Binaries;

DELETE FROM BotData1e2d;
DELETE FROM Private_UserData;
DELETE FROM Private_Sessions;
DELETE FROM Private_EMails;

-- SET FOREIGN_KEY_CHECKS = 0;

-- Some fundamental types:
INSERT INTO Entities (def, id)
VALUES
    ("entity", 1), -- reserved letter: 'e'.
    ("type", 2),
    ("tag", 3),
    ("template| used to define entities", 4),
    ("user| of this sdb|s2db", 5), -- reserved letter: 'u'.
    ("bot| native to this sdb|s1db", 6), -- reserved letter: 'u'.
    ("text| stored by this sdb|s2db", 7), -- reserved letter: 't'.
    ("binary| file stored by this sdb|s2db", 8), -- reserved letter: 'b'.
    ("index| of entity definitions, stored by this sdb|s3db", 9),
        -- reserved letter: 'i'.
    ("user/bot| of this sdb|s2db", 10); -- reserved letter: 'u'.
    


-- INSERT INTO UsersAndBots (username, id)
-- VALUES ("initial_user", 1);


-- We skip some numbers here, such that it is easier to insert other
-- fundamental types (or other entities) in the future, or to remap some
-- existing entity strings to a low number, if that becomes a desire.

INSERT INTO Entities (def, id)
VALUES
    -- Some fundamental templates, plus some more types, such as 'property.'
    ("%e of %e|: an instance of the property %1 of the entity %2", 40),
    ("property", 41),
    (CONCAT(
        "%e of %e, the %e|: ",
        "an instance of the property %1 of the entity %2, when said entity ",
        "is interpreted as being of the type %3"
    ), 42), -- This template might come in handy, but it also might not.
    (CONCAT(
        "%e :: %e|. ",
        "this tag is meant for bots, not users. ",
        "it means 'fits the tag %1 while also having the type %2.'",
        "|ti2"
    ), 43),
    ("statement", 44),
    ("%e fits %e|: the tag %1 fits the entity %2", 45),
    ("better duplicate| than this one to use", 46),
    (CONCAT(
        "user who thinks that %e|: ",
        "user who thinks that the statement %1 is true"
    ), 47),
    ("submitted by %u|: is submitted by the user %1", 48),
    ("url||url", 49),
    ("user %u|: the user/bot %1 of this sdb|s3db", 50);
    -- ("%u|: the user/bot %1 of this sdb|s3db", 50);


INSERT INTO Entities (def, id)
VALUES
    -- Some fundamental aggregation bots.
    ("creator_rater_bot", 60),
    ("statement_user_rater_bot", 61),
    ("mean_with_offset_3_bot", 62);


-- We also skip some numbers here, for the same reason.

INSERT INTO Entities (def, id)
VALUES
    ("example of a not very useful entity||eapefnteysflniy", 1000);



-- SELECT SLEEP(1);

/* Some more inserts and also ratings, now using the input_procs API */

CALL insertOrFindEntity(1, 0, "music"); -- id: (1000) +1
CALL insertOrFindEntity(1, 0, "rock music"); -- id: +2
CALL insertOrFindEntity(1, 0, "jazz"); -- id: +3

CALL insertOrFindEntity(1, 0, "movie"); -- id: +4
CALL insertOrFindEntity(1, 0, "year"); -- id: +5
CALL insertOrFindEntity(1, 0, "film director"); -- id: +6
CALL insertOrFindEntity(1, 0, "2001"); -- id: +8
CALL insertOrFindEntity(1, 0, "2002"); -- id: +9
CALL insertOrFindEntity(1, 0, "person"); -- id: +10
CALL insertOrFindEntity(1, 0, "peter jackson|film director|pj"); -- id: +11
CALL insertOrFindEntity(1, 0, CONCAT(
    "the lord of the rings: the fellowship of the ring",
    "|2001 movie|tlr1tfr"
)); -- id: +12
-- CALL insertOrFindEntity(1, 0, "@2[1004], @1005[1008]"); -- id: +13
--     -- renders as: "movie, 2001".
-- These two Entities are obsolete, and ought to be changed to something else:
CALL insertOrFindEntity(1, 0, "change me!"); -- id: +13
CALL insertOrFindEntity(1, 0, "change me too!"); -- id: +14

CALL insertOrFindEntity(1, 0,
    "the lord of the rings: the two towers|2002 movie|tlr1ttt"
); -- id: +15

-- These two Entities are obsolete, and ought to be changed to something else:
CALL insertOrFindEntity(1, 0, "...and me!"); -- id: +16
CALL insertOrFindEntity(1, 0, "...and me as well!"); -- id: +17




CALL insertOrFindEntity(1, 0, "science"); -- id: +18
CALL insertOrFindEntity(1, 0, "musicology"); -- id: +19
CALL insertOrFindEntity(1, 0, "cinematography"); -- id: +20
CALL insertOrFindEntity(1, 0, "physics"); -- id: +21
CALL insertOrFindEntity(1, 0, "mathematics"); -- id: +22

-- SELECT SLEEP(1);


CALL insertOrFindEntity(1, 0, "subcategory"); -- id: +23
CALL insertOrFindEntity(1, 0, "@40.1023.1"); -- id: +24

CALL insertOrUpdateRating(1, 1024, 1018, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(1, 1024, 1021, CONV("E000", 16, 10), 1);
CALL insertOrUpdateRating(1, 1024, 1022, CONV("E000", 16, 10), 1);
CALL insertOrUpdateRating(1, 1024, 1001, CONV("F000", 16, 10), 1);
CALL insertOrUpdateRating(1, 1024, 1004, CONV("F000", 16, 10), 1);
CALL insertOrUpdateRating(1, 1024, 1000, CONV("0100", 16, 10), 1);

-- SELECT SLEEP(1);


CALL insertOrFindEntity(1, 0, "@40.1023.1001"); -- id: +25
CALL insertOrUpdateRating(1, 1025, 1002, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(1, 1025, 1003, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(1, 1025, 1019, CONV("E000", 16, 10), 1);
CALL insertOrUpdateRating(1, 1025, 1000, CONV("0100", 16, 10), 1);

CALL insertOrFindEntity(1, 0, "@40.1023.1018"); -- id: +26
CALL insertOrUpdateRating(1, 1026, 1019, CONV("F000", 16, 10), 1);
CALL insertOrUpdateRating(1, 1026, 1020, CONV("F100", 16, 10), 1);
CALL insertOrUpdateRating(1, 1026, 1021, CONV("F200", 16, 10), 1);
CALL insertOrUpdateRating(1, 1026, 1022, CONV("F100", 16, 10), 1);


CALL insertOrUpdateRating(1, 1, 1002, CONV("A100", 16, 10), 1);
CALL insertOrUpdateRating(1, 1, 1012, CONV("C400", 16, 10), 1);
CALL insertOrUpdateRating(1, 1, 1015, CONV("C000", 16, 10), 1);

CALL insertOrUpdateRating(1, 1004, 1012, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(1, 1004, 1015, CONV("FE00", 16, 10), 1);

-- SELECT SLEEP(1);

CALL insertOrFindEntity(1, 0, "related entity"); -- id: +27

-- (Note the '1' is omitted here after the '@'. *No, not after all..)
CALL insertOrFindEntity(1, 0, "@40.1027.1012"); -- id: +28
CALL insertOrUpdateRating(1, 1028, 1015, CONV("FF00", 16, 10), 1);
CALL insertOrFindEntity(1, 0, "@40.1027.1.1015"); -- id: +29
CALL insertOrUpdateRating(1, 1029, 1012, CONV("FF00", 16, 10), 1);

CALL insertOrFindEntity(1, 0, "@40.1027.1001"); -- id: +30
CALL insertOrUpdateRating(1, 1030, 1019, CONV("F000", 16, 10), 1);
CALL insertOrFindEntity(1, 0, "@40.1027.1019"); -- id: +31
CALL insertOrUpdateRating(1, 1031, 1004, CONV("FF00", 16, 10), 1);


CALL insertOrFindEntity(1, 0, "supercategory"); -- id: +32

-- SELECT SLEEP(1);


-- CALL insertOrFindEntity(1, 0, "good|to watch as a piece of media"); -- id: +33
CALL insertOrFindEntity(1, 0, "good|as a piece of media"); -- id: +33
CALL insertOrFindEntity(1, 0, "funny|as a piece of media"); -- id: +34
CALL insertOrFindEntity(1, 0, "scary|as a piece of media"); -- id: +35
CALL insertOrFindEntity(1, 0, "iconic|as a piece of media"); -- id: +36


CALL insertOrFindEntity(1, 0, "relevant tag to rate"); -- id: +37

CALL insertOrFindEntity(1, 0, "@40.1037.1004"); -- id: +38
CALL insertOrUpdateRating(1, 1038, 1033, CONV("F000", 16, 10), 1);
CALL insertOrUpdateRating(1, 1038, 1034, CONV("E100", 16, 10), 1);
CALL insertOrUpdateRating(1, 1038, 1035, CONV("E000", 16, 10), 1);


CALL insertOrFindEntity(1, 0, "@40.1037.1012"); -- id: +39
CALL insertOrUpdateRating(1, 1039, 1033, CONV("F000", 16, 10), 1);
CALL insertOrUpdateRating(1, 1039, 1034, CONV("E100", 16, 10), 1);
CALL insertOrUpdateRating(1, 1039, 1035, CONV("EA00", 16, 10), 1);
CALL insertOrUpdateRating(1, 1039, 1036, CONV("E000", 16, 10), 1);

CALL insertOrFindEntity(1, 0, "@40.1037.1"); -- id: +40
-- CALL insertOrUpdateRating(1, 1040, 1033, CONV("FF00", 16, 10), 1);
-- CALL insertOrUpdateRating(1, 1040, 1034, CONV("9000", 16, 10), 1);

-- SELECT SLEEP(1);


CALL insertOrFindEntity(1, 0, "relevant property"); -- id: +41
-- CALL insertOrFindEntity(1, 0, "director"); -- id: +6
-- CALL insertOrFindEntity(1, 0, "person"); -- id: +10
CALL insertOrFindEntity(1, 0, "time"); -- id: +42
CALL insertOrFindEntity(1, 0, "running time"); -- id: +43
CALL insertOrFindEntity(1, 0, "actor"); -- id: +44

CALL insertOrFindEntity(1, 0, "@40.1041.1004"); -- id: +45
CALL insertOrUpdateRating(1, 1045, 1006, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(1, 1045, 1044, CONV("FE00", 16, 10), 1);
CALL insertOrUpdateRating(1, 1045, 1043, CONV("FC00", 16, 10), 1);



-- CALL insertOrFindEntity(1, 0, "Peter Jackson"); -- id: +11
CALL insertOrFindEntity(1, 0, "ian mckellen||imk"); -- id: +46
CALL insertOrFindEntity(1, 0, "viggo mortensen||vm"); -- id: +47
CALL insertOrFindEntity(1, 0, "elijah wood||ew"); -- id: +48

CALL insertOrFindEntity(1, 0, "2 h 59 min"); -- id: +49

CALL insertOrFindEntity(1, 0, "@40.1006.1012"); -- id: +50
CALL insertOrFindEntity(1, 0, "@40.1044.1012"); -- id: +51
CALL insertOrFindEntity(1, 0, "@40.1043.1012"); -- id: +52
CALL insertOrUpdateRating(1, 1050, 1011, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(1, 1051, 1046, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(1, 1051, 1047, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(1, 1051, 1048, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(1, 1052, 1049, CONV("FF00", 16, 10), 1);
-- CALL insertOrUpdateRating(1, 1006, 1050, 1011, CONV("FF00", 16, 10), 1);
-- CALL insertOrUpdateRating(1, 1044, 1051, 1046, CONV("FF00", 16, 10), 1);
-- CALL insertOrUpdateRating(1, 1044, 1051, 1047, CONV("FF00", 16, 10), 1);
-- CALL insertOrUpdateRating(1, 1044, 1051, 1048, CONV("FF00", 16, 10), 1);
-- CALL insertOrUpdateRating(1, 1042, 1052, 1049, CONV("FF00", 16, 10), 1);

-- SELECT SLEEP(1);

-- CALL insertOrFindTemplate(1, 0, 61, CONCAT(
--     "{<Popular name>}, <Full name>, <Year of birth>, ",
--     "<What the person is known for being>"
--     -- (Could have written "is/was" here instead, but maybe it's best to just
--     -- keep away from the past tense in general.)
-- )); -- id: 66
-- CALL insertOrFindEntity(1, 0, 61, 66,
--     "Peter Jackson|Peter Robert Jackson|1961|Film director"); -- id: 67
-- CALL insertOrFindEntity(1, 0, 61, 66,
--     "Ian McKellen|Ian Murray McKellen|1939|Actor"); -- id: 68
-- CALL insertOrFindEntity(1, 0, 61, 66,
--     "Viggo Mortensen|Viggo Peter Mortensen Jr.|1958|Actor"); -- id: 69
-- CALL insertOrFindEntity(1, 0, 61, 66,
--     "Elijah Wood|Elijah Jordan Wood|1981|Actor"); -- id: 70
-- CALL insertOrFindEntity(1, 0, 64, 0,"2 h 59 min"); -- id: 71

-- SELECT SLEEP(1);



-- CALL insertOrFindType(1, 0, "Statement"); -- id: 75
-- CALL insertOrFindTemplate(1, 0, 75,
--     "{<something> is an} important/useful{ instance of <Category>}"); -- id: 76
-- CALL insertOrFindTemplate(1, 0, 2,
--     "Users that rate <Statement> positively"); -- id: 77


-- CALL insertOrFindTemplate(1, 0, 6,
--     "<Name>; <Overall description>; <Event data documentation>;"); -- id: 78
-- CALL insertOrFindEntity(1, 0, 6, 78, CONCAT(
--     "statement_user_rater_bot|",
--     "Rates users as instances categories of the #77 template, with ratings ",
--     "equal to those of the users regarding the given statement.|"
--     "Uses no event data"
-- )); -- id: 79




-- CALL insertOrFindType(1, 0, "Event data documentation"); -- id: 80
-- CALL insertOrFindEntity(1, 0, 80, 0, CONCAT(
--     "obj: Statement; ",
--     "data_1: Current averaged rating value scaled up as a ulong (for more ",
--     "precision), with a neutral rating (of 5/10) as the initial value; ",
--     "data_2: Number of users that have rated obj, plus an offset of 3;"
-- )); -- id: 81
-- CALL insertOrFindEntity(1, 0, 6, 78, CONCAT(
--     "mean_with_offset_3_bot|",
--     "Rates all statements according to an arithmetic mean of all users, biased",
--     "towards a neutral rating (5/10) by using an offset of 3 neutral ratings.|",
--     "#81;"
-- )); -- id: 82


-- CALL insertOrFindTemplate(1, 0, 2, "Creations of <User>"); -- id: 83

-- CALL insertOrFindEntity(1, 0, 6, 78, CONCAT(
--     "creator_rater_bot|",
--     "Rates entities as instances of categories of the #83 template (with ",
--     "maximal rating values) if the relevant users have chosen to be recorded ",
--     "as the creators.|"
--     "Uses no event data"
-- )); -- id: 84

-- SELECT SLEEP(1);


CALL insertOrFindEntity(1, 0, "hip hop music"); -- id: +53
CALL insertOrFindEntity(1, 0, "pop music"); -- id: +54
CALL insertOrFindEntity(1, 0, "classical music"); -- id: +55
CALL insertOrUpdateRating(1, 1025, 1053, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(1, 1025, 1054, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(1, 1025, 1055, CONV("FF00", 16, 10), 1);

CALL insertOrFindEntity(1, 0, "geology"); -- id: +56
CALL insertOrUpdateRating(1, 1026, 1056, CONV("F100", 16, 10), 1);




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


-- CALL insertOrFindEntity(1, 0, 2, 0, "Has good acting"); -- id: 90
-- -- Recommendation: Avoid creating categories from verbs starting with 'Is.'
-- CALL insertOrUpdateRating(1, 53, 90, CONV("E000", 16, 10), 1);


-- SELECT SLEEP(1);

-- Make some room for some other initial inserts in the future (where we must
-- just remap the IDs, if these entities have already been inserted by users):
ALTER TABLE Entities AUTO_INCREMENT=3000;

SELECT "Calling publicizeRecentInputs() can take a while (about 1 minute):";
-- (It takes roughly 30 seconds on my laptop.)
CALL publicizeRecentInputs ();

-- SET FOREIGN_KEY_CHECKS = 1;
