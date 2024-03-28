
-- TODO: Create a database dump as well, such that the whole installation can be
-- done more quickly and with a single SQL file.

DELETE FROM SemanticInputs;
DELETE FROM Private_RecentInputs;
ALTER TABLE Private_RecentInputs AUTO_INCREMENT=1;
DELETE FROM RecordedInputs;
DELETE FROM EntityIndexKeys;

DELETE FROM Entities;
ALTER TABLE Entities AUTO_INCREMENT=1;
-- DELETE FROM Users;
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
    ("thing", 1),
    ("type", 2),
    ("tag", 3),
    -- Types of non-string entities of the database. (These names are meant
    -- to not be too simple, except 'user,' as this shouldn't conflict with
    -- any real-world, non-meta, custom types, that the users might wish to
    -- define and use, anyway.) (And the same can be said for 'type' and
    -- 'tag' above.) ..Oh wait, 'user' might be usable to refer to users of
    -- other sites.. Hm.. ..Hm, how about 'local user'.. ..Hm, or else the
    -- custom type(s) of internet users would just have to be called that:
    -- internet user.. ..Yeah.. ..Hm, but let me call it 'user of this
    -- network,' still..
    ("string template", 4), -- reserved letter: 't'.
    ("user of this network", 5),  -- reserved letter: 'u'.
    ("aggregation bot", 6), -- reserved letter: 'a'.
    ("text data", 7), -- reserved letter: 'x'.
    ("binary data", 8); -- reserved letter: 'b'.
    ("string index", 9), -- reserved letter: 'i'.
    -- The reserved letters here are when typing out placeholders for string
    -- templates, or references for link substitutions (string substitutions
    -- don't need types). These are however converted to the IDs before the
    -- string is uploaded. (See 23-xx note collection.tex currently for more
    -- info. (28.03.24))


-- INSERT INTO Users (username, id)
-- VALUES ("initial_user", 1);


-- We skip some numbers here, such that it is easier to insert other
-- fundamental types (or other objects) in the future, or to remap some
-- existing object strings to a low number, if that becomes a desire.

INSERT INTO Strings (str, id)
VALUES
    -- Some fundamental templates, plus some more types, such as 'property.'
    ("<1>, <1>", 50),
    ("property", 51),
    ("<51> of <>", 52);
    -- ("aggregate category", 53);


-- We also skip some numbers here, for the same reason.

INSERT INTO Strings (id, str)
VALUES
    (1000, "example of a not very useful entity|1,1.3,1.5,1.7,2.2,3,3.3,4.2,4.4,5.2,5.4,5.6,6.2,6.4,6.6");



-- SELECT SLEEP(1);

/* Some more inserts and also ratings, now using the input_procs API */

CALL insertOrFindEntity(9, 0, 2, 0, "Music"); -- id: 24
CALL insertOrFindEntity(9, 0, 2, 22, "Rock|#24"); -- id: 25
CALL insertOrFindEntity(9, 0, 2, 22, "Jazz|#24"); -- id: 26

CALL insertOrFindType(9, 0, "Movie"); -- id: 27
CALL insertOrFindTemplate(9, 0, 27, "{<Title>}, <Year>"); -- id: 28
CALL insertOrFindEntity(9, 0, 27, 28,
    "The Lord of the Rings: The Fellowship of the Ring|2001"
); -- id: 29
CALL insertOrFindEntity(9, 0, 27, 28,
    "The Lord of the Rings: The Two Towers|2002"
); -- id: 30

CALL insertOrFindEntity(9, 0, 2, 0, "Movies"); -- id: 31
CALL insertOrFindEntity(9, 0, 2, 0, "Science"); -- id: 32
CALL insertOrFindEntity(9, 0, 2, 22, "Musicology|#32"); -- id: 33
CALL insertOrFindEntity(9, 0, 2, 22, "Cinematography|#32"); -- id: 34
CALL insertOrFindEntity(9, 0, 2, 22, "Physics|#32"); -- id: 35
CALL insertOrFindEntity(9, 0, 2, 22, "Mathematics|#32"); -- id: 36

-- SELECT SLEEP(1);


CALL insertOrFindEntity(9, 0, 19, 20, "Subcategories|#2|many"); -- id: 37
CALL insertOrFindEntity(9, 0, 2, 21, "#37|#10"); -- id: 38
CALL insertOrUpdateRating(9, 38, 32, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(9, 38, 31, CONV("F000", 16, 10), 1);
CALL insertOrUpdateRating(9, 38, 24, CONV("F000", 16, 10), 1);
CALL insertOrUpdateRating(9, 38, 25, CONV("A100", 16, 10), 1);
CALL insertOrUpdateRating(9, 38, 26, CONV("A000", 16, 10), 1);
CALL insertOrFindEntity(9, 0, 27, 0, "ExAmPlE oF a NoT vErY uSeFuL eNtItY");
    -- id: 39
CALL insertOrUpdateRating(9, 38, 39, CONV("0103", 16, 10), 1);

-- SELECT SLEEP(1);

CALL insertOrFindEntity(9, 0, 2, 21, "#37|#24"); -- id: 40
CALL insertOrUpdateRating(9, 40, 25, CONV("F100", 16, 10), 1);
CALL insertOrUpdateRating(9, 40, 26, CONV("F000", 16, 10), 1);
CALL insertOrUpdateRating(9, 40, 39, CONV("0100", 16, 10), 1);
CALL insertOrUpdateRating(9, 40, 33, CONV("E000", 16, 10), 1);

CALL insertOrFindEntity(9, 0, 2, 21, "#37|#32"); -- id: 41
CALL insertOrUpdateRating(9, 41, 33, CONV("F000", 16, 10), 1);
CALL insertOrUpdateRating(9, 41, 34, CONV("F100", 16, 10), 1);
CALL insertOrUpdateRating(9, 41, 35, CONV("F200", 16, 10), 1);
CALL insertOrUpdateRating(9, 41, 36, CONV("F100", 16, 10), 1);

CALL insertOrUpdateRating(9, 10, 25, CONV("A100", 16, 10), 1);
CALL insertOrUpdateRating(9, 10, 31, CONV("A400", 16, 10), 1);
CALL insertOrUpdateRating(9, 10, 29, CONV("A000", 16, 10), 1);
CALL insertOrUpdateRating(9, 10, 30, CONV("9000", 16, 10), 1);

CALL insertOrUpdateRating(9, 31, 29, CONV("FF03", 16, 10), 1);
CALL insertOrUpdateRating(9, 31, 30, CONV("FF02", 16, 10), 1);

-- SELECT SLEEP(1);

CALL insertOrFindEntity(9, 0, 19, 20, "Related entities|any type|many");
    -- id: 42
CALL insertOrFindEntity(9, 0, 2, 21, "#42|#29"); -- id: 43
CALL insertOrUpdateRating(9, 43, 30, CONV("FF00", 16, 10), 1);
CALL insertOrFindEntity(9, 0, 2, 21, "#42|#30"); -- id: 44
CALL insertOrUpdateRating(9, 44, 29, CONV("FF00", 16, 10), 1);
CALL insertOrFindEntity(9, 0, 2, 21, "#42|#24"); -- id: 45
CALL insertOrUpdateRating(9, 45, 33, CONV("F000", 16, 10), 1);
CALL insertOrFindEntity(9, 0, 2, 21, "#42|#33"); -- id: 46
CALL insertOrUpdateRating(9, 46, 24, CONV("FF00", 16, 10), 1);

CALL insertOrFindEntity(9, 0, 19, 20, "Supercategories|#2|many"); -- id: 47

-- SELECT SLEEP(1);

-- CALL insertOrFindEntity(9, 0, 2, 23, "Good|#31"); -- id: 48
-- CALL insertOrFindEntity(9, 0, 2, 23, "Funny|#31"); -- id: 49
-- CALL insertOrFindEntity(9, 0, 2, 23, "Scary|#31"); -- id: 50
-- CALL insertOrFindEntity(9, 0, 2, 23, "Iconic|#31"); -- id: 51
CALL insertOrFindEntity(9, 0, 2, 0, "Good"); -- id: 48
CALL insertOrFindEntity(9, 0, 2, 0, "Funny"); -- id: 49
CALL insertOrFindEntity(9, 0, 2, 0, "Scary"); -- id: 50
CALL insertOrFindEntity(9, 0, 2, 0, "Iconic"); -- id: 51
-- (One could have written e.g. "{Good} entities" here, but we'll let that be
-- implicitly understood instead for all such categories with adjectives as
-- titles, and by the way also when the titles are verbs (but refrain from
-- making categories out of verbs starting with 'Is').)

CALL insertOrFindEntity(9, 0, 19, 20,
    "Relevant categories to rate for type instances|#2|many"); -- id: 52
CALL insertOrFindEntity(9, 0, 2, 21, "#52|#27"); -- id: 53
CALL insertOrUpdateRating(9, 53, 48, CONV("F000", 16, 10), 1);
CALL insertOrUpdateRating(9, 53, 49, CONV("E100", 16, 10), 1);
CALL insertOrUpdateRating(9, 53, 50, CONV("E000", 16, 10), 1);

CALL insertOrFindEntity(9, 0, 19, 20, "Relevant categories to rate|#2|many");
    -- id: 54
CALL insertOrFindEntity(9, 0, 2, 21, "#54|#29"); -- id: 55
CALL insertOrUpdateRating(9, 55, 48, CONV("F000", 16, 10), 1);
CALL insertOrUpdateRating(9, 55, 49, CONV("E100", 16, 10), 1);
CALL insertOrUpdateRating(9, 55, 50, CONV("EA00", 16, 10), 1);
CALL insertOrUpdateRating(9, 55, 51, CONV("E000", 16, 10), 1);

-- CALL insertOrFindEntity(9, 0, 2, 23, "well-formed|#10"); -- id: 56
CALL insertOrFindEntity(9, 0, 2, 0, "{Well-formed} as an entity"); -- id: 56
CALL insertOrFindEntity(9, 0, 2, 21, "#54|#10"); -- id: 57
CALL insertOrUpdateRating(9, 57, 54, CONV("F000", 16, 10), 1);
CALL insertOrUpdateRating(9, 57, 10, CONV("9000", 16, 10), 1);

-- SELECT SLEEP(1);

CALL insertOrFindEntity(9, 0, 19, 20, "Relevant properties|#19|many"); -- id: 58
CALL insertOrFindEntity(9, 0, 19, 20,
    "Relevant properties for type instances|#19|many"); -- id: 59
CALL insertOrFindEntity(9, 0, 2, 21, "#59|#27"); -- id: 60
CALL insertOrFindType(9, 0, "Person"); -- id: 61
CALL insertOrFindEntity(9, 0, 19, 20, "Director(s)|#61|few"); -- id: 62
CALL insertOrFindEntity(9, 0, 19, 20, "Actors|#61|many"); -- id: 63
CALL insertOrFindType(9, 0, "Time"); -- id: 64
CALL insertOrFindEntity(9, 0, 19, 20, "Running time|#64|one"); -- id: 65
CALL insertOrUpdateRating(9, 60, 62, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(9, 60, 63, CONV("FE00", 16, 10), 1);
CALL insertOrUpdateRating(9, 60, 65, CONV("FC00", 16, 10), 1);

-- SELECT SLEEP(1);

CALL insertOrFindTemplate(9, 0, 61, CONCAT(
    "{<Popular name>}, <Full name>, <Year of birth>, ",
    "<What the person is known for being>"
    -- (Could have written "is/was" here instead, but maybe it's best to just
    -- keep away from the past tense in general.)
)); -- id: 66
CALL insertOrFindEntity(9, 0, 61, 66,
    "Peter Jackson|Peter Robert Jackson|1961|Film director"); -- id: 67
CALL insertOrFindEntity(9, 0, 61, 66,
    "Ian McKellen|Ian Murray McKellen|1939|Actor"); -- id: 68
CALL insertOrFindEntity(9, 0, 61, 66,
    "Viggo Mortensen|Viggo Peter Mortensen Jr.|1958|Actor"); -- id: 69
CALL insertOrFindEntity(9, 0, 61, 66,
    "Elijah Wood|Elijah Jordan Wood|1981|Actor"); -- id: 70
CALL insertOrFindEntity(9, 0, 64, 0,"2 h 59 min"); -- id: 71

CALL insertOrFindEntity(9, 0, 2, 21, "#62|#29"); -- id: 72
CALL insertOrFindEntity(9, 0, 2, 21, "#63|#29"); -- id: 73
CALL insertOrFindEntity(9, 0, 2, 21, "#65|#29"); -- id: 74
CALL insertOrUpdateRating(9, 72, 67, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(9, 73, 68, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(9, 73, 69, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(9, 73, 70, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(9, 74, 71, CONV("FF00", 16, 10), 1);

-- SELECT SLEEP(1);

CALL insertOrFindType(9, 0, "Statement"); -- id: 75
CALL insertOrFindTemplate(9, 0, 75,
    "{<Entity> is an} important/useful{ instance of <Category>}"); -- id: 76
CALL insertOrFindTemplate(9, 0, 2,
    "Users that rate <Statement> positively"); -- id: 77


CALL insertOrFindTemplate(9, 0, 6,
    "<Name>; <Overall description>; <Event data documentation>;"); -- id: 78
CALL insertOrFindEntity(9, 0, 6, 78, CONCAT(
    "statement_user_rater_bot|",
    "Rates users as instances categories of the #77 template, with ratings ",
    "equal to those of the users regarding the given statement.|"
    "Uses no event data"
)); -- id: 79




CALL insertOrFindType(9, 0, "Event data documentation"); -- id: 80
CALL insertOrFindEntity(9, 0, 80, 0, CONCAT(
    "obj: Statement; ",
    "data_1: Current averaged rating value scaled up as a ulong (for more ",
    "precision), with a neutral rating (of 5/10) as the initial value; ",
    "data_2: Number of users that have rated obj, plus an offset of 3;"
)); -- id: 81
CALL insertOrFindEntity(9, 0, 6, 78, CONCAT(
    "mean_with_offset_3_bot|",
    "Rates all statements according to an arithmetic mean of all users, biased",
    "towards a neutral rating (5/10) by using an offset of 3 neutral ratings.|",
    "#81;"
)); -- id: 82


CALL insertOrFindTemplate(9, 0, 2, "Creations of <User>"); -- id: 83

CALL insertOrFindEntity(9, 0, 6, 78, CONCAT(
    "creator_rater_bot|",
    "Rates entities as instances of categories of the #83 template (with ",
    "maximal rating values) if the relevant users have chosen to be recorded ",
    "as the creators.|"
    "Uses no event data"
)); -- id: 84

-- SELECT SLEEP(1);

CALL insertOrFindEntity(9, 0, 19, 20, "Templates|#3|many"); -- id: 85


CALL insertOrFindEntity(9, 0, 2, 22, "Hip hop|#24"); -- id: 86
CALL insertOrFindEntity(9, 0, 2, 22, "Pop|#24"); -- id: 87
CALL insertOrFindEntity(9, 0, 2, 22, "Classical|#24"); -- id: 88
CALL insertOrUpdateRating(9, 40, 86, CONV("F000", 16, 10), 1);
CALL insertOrUpdateRating(9, 40, 87, CONV("F000", 16, 10), 1);
CALL insertOrUpdateRating(9, 40, 88, CONV("F000", 16, 10), 1);

CALL insertOrFindEntity(9, 0, 2, 22, "Geology|#32"); -- id: 89
CALL insertOrUpdateRating(9, 41, 89, CONV("F000", 16, 10), 1);



CALL insertOrUpdateRating(9, 11, 1, CONV("E000", 16, 10), 1);
CALL insertOrUpdateRating(9, 11, 2, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(9, 11, 3, CONV("E000", 16, 10), 1);
CALL insertOrUpdateRating(9, 11, 5, CONV("EF00", 16, 10), 1);
CALL insertOrUpdateRating(9, 11, 6, CONV("EF00", 16, 10), 1);
CALL insertOrUpdateRating(9, 11, 7, CONV("EF00", 16, 10), 1);
CALL insertOrUpdateRating(9, 11, 8, CONV("EF00", 16, 10), 1);
CALL insertOrUpdateRating(9, 11, 27, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(9, 11, 61, CONV("FF00", 16, 10), 1);
CALL insertOrUpdateRating(9, 11, 64, CONV("EF00", 16, 10), 1);
CALL insertOrUpdateRating(9, 11, 75, CONV("E000", 16, 10), 1);


CALL insertOrFindEntity(9, 0, 2, 0, "Has good acting"); -- id: 90
-- Recommendation: Avoid creating categories from verbs starting with 'Is.'
CALL insertOrUpdateRating(9, 53, 90, CONV("E000", 16, 10), 1);


-- SELECT SLEEP(1);

-- Make some room for some other initial inserts in the future (where we must
-- just remap the IDs, if these entities have already been inserted by users):
ALTER TABLE Entities AUTO_INCREMENT=200;

SELECT "Calling publicizeRecentInputs() can take a while (about 1 minute):";
-- (It takes roughly 30 seconds on my laptop.)
CALL publicizeRecentInputs ();

-- SET FOREIGN_KEY_CHECKS = 1;
