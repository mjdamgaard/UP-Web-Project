
DELETE FROM SemanticInputs;
DELETE FROM RecentInputs;
ALTER TABLE RecentInputs AUTO_INCREMENT=1;

DELETE FROM Entities;
ALTER TABLE Entities AUTO_INCREMENT=1;

DELETE FROM Users;
ALTER TABLE Users AUTO_INCREMENT=1;
-- DELETE FROM Texts;
-- ALTER TABLE Texts AUTO_INCREMENT=1;

DELETE FROM PrivateCreators;



/* From create_open_sdb.sql */
INSERT INTO Entities (type_id, tmpl_id, def_str, id)
VALUES
    (1, NULL, "Type", 1), -- The type of this "Type" entity is itself.
    (1, NULL, "Category", 2), -- This is then "Category" type entity and so on.
    (1, NULL, "Template", 3),
    (1, NULL, "Index", 4),
    (1, NULL, "User", 5),
    (1, NULL, "Aggregation bot", 6),
    (1, NULL, "Text data", 7),
    (1, NULL, "Binary data", 8),
    (5, NULL, "admin_1", 9);
INSERT INTO Users (username, id)
VALUES ("admin_1", 9);

/* Some more useful types and some useful templates and categories */
INSERT INTO Entities (type_id, tmpl_id, def_str, id)
VALUES
    -- Fundamental categories:
    (2, NULL, "Entities", 10),
    (2, NULL, "Types", 11),
    (2, NULL, "Categories", 12),
    (2, NULL, "Templates", 13),
    (2, NULL, "Indexes", 14),
    (2, NULL, "Users", 15),
    (2, NULL, "Aggregation bots", 16),
    (2, NULL, "Texts", 17),
    (2, NULL, "Binaries", 18),
    -- Property type:
    (1, NULL, "Property", 19),
    -- Property template:
    (3, NULL, "{<Title>}, one-to-<Quantity word (e.g. 'one,' 'few,' or 'many')>", 20),
    -- Property category template:
    (3, NULL, "<Property> of <Entity>", 21),
    -- Subcategory template:
    (3, NULL, "{<Title>} (<Supercategory>)", 22),
    -- Adjective subcategory template:
    (3, NULL, "<Adjective phrase> <Category>", 23);



/* More inserts for testing */

CALL insertOrFindEntity(9, 2, 0, "Music"); -- id: 24
CALL insertOrFindEntity(9, 2, 22, "Rock|#23"); -- id: 25
CALL insertOrFindEntity(9, 2, 22, "Jazz|#23"); -- id: 26

CALL insertOrFindEntity(9, 1, 0, "Movie"); -- id: 27
CALL insertOrFindEntity(9, 3, 0, "{<Title>}, <Year>"); -- id: 28
CALL insertOrFindEntity(9, 27, 28,
    "The Lord of the Rings: The Fellowship of the Ring|2001"
); -- id: 29
CALL insertOrFindEntity(9, 27, 28,
    "The Lord of the Rings: The Two Towers|2002"
); -- id: 30

CALL insertOrFindEntity(9, 2, 0, "Movies"); -- id: 31
CALL insertOrFindEntity(9, 2, 0, "Science"); -- id: 32
CALL insertOrFindEntity(9, 2, 22, "Music|#31"); -- id: 33
CALL insertOrFindEntity(9, 2, 22, "Cinematography|#31"); -- id: 34
CALL insertOrFindEntity(9, 2, 22, "Physics|#31"); -- id: 35
CALL insertOrFindEntity(9, 2, 22, "Mathematics|#31"); -- id: 36



-- rate some statements.

CALL insertOrFindEntity(9, 19, 20, "Subcategories|many"); -- id: 37
CALL insertOrFindEntity(9, 2, 21, "#37|#1"); -- id: 38
CALL inputOrChangeRating(9, 38, 32, CONV("FFFF", 16, 10), "00");
CALL inputOrChangeRating(9, 38, 31, CONV("F000", 16, 10), "00");
CALL inputOrChangeRating(9, 38, 24, CONV("F000", 16, 10), "00");
CALL inputOrChangeRating(9, 38, 25, CONV("A130", 16, 10), "00");
CALL inputOrChangeRating(9, 38, 26, CONV("A000", 16, 10), "00");
CALL insertOrFindEntity(9, 27, 0, "ExAmPlE oF a NoT vErY uSeFuL eNtItY"); -- id: 39
CALL inputOrChangeRating(9, 38, 39, CONV("0103", 16, 10), "00");

CALL insertOrFindEntity(9, 2, 21, "#37|#24"); -- id: 40
CALL inputOrChangeRating(9, 40, 25, CONV("E100", 16, 10), "00");
CALL inputOrChangeRating(9, 40, 26, CONV("E000", 16, 10), "00");
CALL inputOrChangeRating(9, 40, 39, CONV("0001", 16, 10), "00");
CALL inputOrChangeRating(9, 40, 33, CONV("F000", 16, 10), "00");

CALL insertOrFindEntity(9, 2, 21, "#37|#31"); -- id: 41
CALL inputOrChangeRating(9, 41, 32, CONV("F000", 16, 10), "00");

CALL inputOrChangeRating(9, 10, 25, CONV("A000", 16, 10), "00");
CALL inputOrChangeRating(9, 10, 37, CONV("A400", 16, 10), "00");
CALL inputOrChangeRating(9, 10, 29, CONV("9003", 16, 10), "00");
CALL inputOrChangeRating(9, 10, 30, CONV("9002", 16, 10), "00");

CALL inputOrChangeRating(9, 31, 29, CONV("FF03", 16, 10), "00");
CALL inputOrChangeRating(9, 31, 30, CONV("FF02", 16, 10), "00");


CALL insertOrFindEntity(9, 19, 20, "Related entities|many"); -- id: 42
CALL insertOrFindEntity(9, 2, 21, "#42|#29"); -- id: 43
CALL inputOrChangeRating(9, 43, 30, CONV("FFFF", 16, 10), "00");
CALL insertOrFindEntity(9, 2, 21, "#42|#30"); -- id: 44
CALL inputOrChangeRating(9, 44, 29, CONV("FFF0", 16, 10), "00");
CALL insertOrFindEntity(9, 2, 21, "#42|#24"); -- id: 45
CALL inputOrChangeRating(9, 45, 33, CONV("F000", 16, 10), "00");
CALL insertOrFindEntity(9, 2, 21, "#42|#33"); -- id: 46
CALL inputOrChangeRating(9, 46, 24, CONV("FF00", 16, 10), "00");


CALL insertOrFindEntity(9, 2, 23, "good"); -- id: 47
CALL insertOrFindEntity(9, 2, 23, "funny"); -- id: 48
CALL insertOrFindEntity(9, 2, 23, "scary"); -- id: 49
CALL insertOrFindEntity(9, 2, 23, "iconic"); -- id: 50

-- TODO: Redo the last part of this file as well:

-- CALL insertOrFindEntity(9, 'p', 12, "Relevant ratings for derived entities|#1"); -- id: 50
-- CALL inputOrChangeRating(9, 50, 46, CONV("F000", 16, 10), "00");
-- CALL inputOrChangeRating(9, 50, 40, CONV("F000", 16, 10), "00");
--
-- CALL insertOrFindEntity(9, 'p', 12, "Relevant ratings for derived entities|#27"); -- id: 51
-- CALL inputOrChangeRating(9, 51, 46, CONV("F000", 16, 10), "00");
-- CALL inputOrChangeRating(9, 51, 47, CONV("E100", 16, 10), "00");
-- CALL inputOrChangeRating(9, 51, 48, CONV("E000", 16, 10), "00");
--
--
-- CALL insertOrFindEntity(9, 'p', 12, "Relevant ratings|#28"); -- id: 52
-- CALL inputOrChangeRating(9, 52, 46, CONV("F000", 16, 10), "00");
-- CALL inputOrChangeRating(9, 52, 47, CONV("E100", 16, 10), "00");
-- CALL inputOrChangeRating(9, 52, 48, CONV("EAAA", 16, 10), "00");
-- CALL inputOrChangeRating(9, 52, 49, CONV("E000", 16, 10), "00");
