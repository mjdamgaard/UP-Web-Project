
DELETE FROM SemanticInputs;
DELETE FROM RecentInputs;
ALTER TABLE RecentInputs AUTO_INCREMENT=1;

DELETE FROM Terms;
ALTER TABLE Terms AUTO_INCREMENT=1;

DELETE FROM Users;
ALTER TABLE Users AUTO_INCREMENT=1;
-- DELETE FROM Texts;
-- ALTER TABLE Texts AUTO_INCREMENT=1;

DELETE FROM PrivateCreators;



/* From create_open_sdb.sql */
INSERT INTO Terms (tmpl_id, type, def_str, id)
VALUES
    (NULL, 'c', "Terms", 1),
    (NULL, 'c', "Categories", 2),
    (NULL, 'c', "Predicates", 3),
    (NULL, 'c', "Objects", 4),
    (NULL, 'c', "Indexes", 5),
    (NULL, 'c', "Users", 6),
    (NULL, 'c', "Texts", 7),
    (NULL, 'c', "Binaries", 8),
    (NULL, 'c', "Aggregation algorithms (Bots)", 9),
    (NULL, 'u', "admin_1", 10),
INSERT INTO Users (username, id)
VALUES ("admin_1", 10);

/* Some important templates */
INSERT INTO Templates (tmpl_str, id)
VALUES
    (NULL, "is an important/useful instance of the {<Noun phrase> of <Term>}", 1),
    (NULL, "Statement: {<Predicate> applies to <Term>}", 2),
    (NULL, "is {<Adjective phrase>}", 3);



/* More inserts for testing */

CALL insertOrFindTerm(3, 0, "ExAmPlE oF a NoT vErY uSeFuL tErM"); -- id: 22
CALL insertOrFindTerm(3, 0, "Music"); -- id: 22
CALL insertOrFindTerm(3, 0, "Music genre: {<Title>}"); -- id: 23
CALL insertOrFindTerm(3, 23, "Rock"); -- id: 24
CALL insertOrFindTerm(3, 23, "Jazz"); -- id: 25
CALL insertOrFindTerm(3, 23, "Hip hop"); -- id: 26

CALL insertOrFindTerm(3, 0, "Movie: {<Title>}, <Year>"); -- id: 27
CALL insertOrFindTerm(3, 27,
    "The Lord of the Rings: The Fellowship of the Ring|2001"
); -- id: 28
CALL insertOrFindTerm(3, 27,
    "The Lord of the Rings: The Two Towers|2002"
); -- id: 29

CALL insertOrFindTerm(3, 0, "Science"); -- id: 30
CALL insertOrFindTerm(3, 0, "Field of science: {<Title>}"); -- id: 31
CALL insertOrFindTerm(3, 31, "Music"); -- id: 32
CALL insertOrFindTerm(3, 31, "Cinematography"); -- id: 33
CALL insertOrFindTerm(3, 31, "Physics"); -- id: 34
CALL insertOrFindTerm(3, 31, "Mathematics"); -- id: 35

CALL insertOrFindTerm(3, 0, "Movies"); -- id: 36


-- rate some statements.

CALL insertOrFindTerm(3, 6, "Subcategories|#1"); -- id: 37
CALL inputOrChangeRating(3, 37, 22, CONV("FFFF", 16, 10), "00");
CALL inputOrChangeRating(3, 37, 24, CONV("A130", 16, 10), "00");
CALL inputOrChangeRating(3, 37, 25, CONV("A000", 16, 10), "00");
CALL inputOrChangeRating(3, 37, 21, CONV("0103", 16, 10), "00");

CALL insertOrFindTerm(3, 6, "Subcategories|#22"); -- id: 38
CALL inputOrChangeRating(3, 38, 24, CONV("E100", 16, 10), "00");
CALL inputOrChangeRating(3, 38, 25, CONV("E000", 16, 10), "00");
CALL inputOrChangeRating(3, 38, 26, CONV("E000", 16, 10), "00");
CALL inputOrChangeRating(3, 38, 21, CONV("0001", 16, 10), "00");
CALL inputOrChangeRating(3, 38, 32, CONV("F000", 16, 10), "00");

CALL insertOrFindTerm(3, 6, "Subcategories|#30"); -- id: 39
CALL inputOrChangeRating(3, 39, 32, CONV("F000", 16, 10), "00");


CALL inputOrChangeRating(3, 1, 24, CONV("A000", 16, 10), "00");
CALL inputOrChangeRating(3, 1, 36, CONV("A400", 16, 10), "00");
CALL inputOrChangeRating(3, 1, 28, CONV("9003", 16, 10), "00");
CALL inputOrChangeRating(3, 1, 29, CONV("9002", 16, 10), "00");

CALL inputOrChangeRating(3, 36, 28, CONV("FF03", 16, 10), "00");
CALL inputOrChangeRating(3, 36, 29, CONV("FF02", 16, 10), "00");


CALL insertOrFindTerm(3, 6, "Related terms|#28"); -- id: 40
CALL inputOrChangeRating(3, 40, 29, CONV("FFFF", 16, 10), "00");
CALL insertOrFindTerm(3, 6, "Related terms|#29"); -- id: 41
CALL inputOrChangeRating(3, 41, 28, CONV("FFF0", 16, 10), "00");
CALL insertOrFindTerm(3, 6, "Related terms|#22"); -- id: 42
CALL inputOrChangeRating(3, 42, 32, CONV("F000", 16, 10), "00");
CALL insertOrFindTerm(3, 6, "Related terms|#32"); -- id: 43
CALL inputOrChangeRating(3, 43, 22, CONV("FF00", 16, 10), "00");


CALL insertOrFindTerm(3, 8, "good"); -- id: 44
CALL insertOrFindTerm(3, 8, "funny"); -- id: 45
CALL insertOrFindTerm(3, 8, "scary"); -- id: 46
CALL insertOrFindTerm(3, 8, "iconic"); -- id: 47

CALL insertOrFindTerm(3, 6, "Relevant ratings for derived terms|#1"); -- id: 48
CALL inputOrChangeRating(3, 48, 44, CONV("F000", 16, 10), "00");
CALL inputOrChangeRating(3, 48, 1, CONV("F000", 16, 10), "00");

CALL insertOrFindTerm(3, 6, "Relevant ratings for derived terms|#27"); -- id: 49
CALL inputOrChangeRating(3, 49, 44, CONV("F000", 16, 10), "00");
CALL inputOrChangeRating(3, 49, 45, CONV("E100", 16, 10), "00");
CALL inputOrChangeRating(3, 49, 46, CONV("E000", 16, 10), "00");


CALL insertOrFindTerm(3, 6, "Relevant ratings|#28"); -- id: 50
CALL inputOrChangeRating(3, 50, 44, CONV("F000", 16, 10), "00");
CALL inputOrChangeRating(3, 50, 45, CONV("E100", 16, 10), "00");
CALL inputOrChangeRating(3, 50, 46, CONV("EAAA", 16, 10), "00");
CALL inputOrChangeRating(3, 50, 47, CONV("E000", 16, 10), "00");
