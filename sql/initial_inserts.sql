
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
INSERT INTO Entities (tmpl_id, type, def_str, id)
VALUES
    (NULL, 'c', "Entities", 1),
    (NULL, 'c', "Categories", 2),
    (NULL, 'c', "Templates", 3),
    (NULL, 'c', "Predicates", 4),
    (NULL, 'c', "Objects", 5),
    (NULL, 'c', "Indexes", 6),
    (NULL, 'c', "Users", 7),
    (NULL, 'c', "Texts", 8),
    (NULL, 'c', "Binaries", 9),
    (NULL, 'c', "Aggregation algorithms (Bots)", 10),
    (NULL, 'u', "admin_1", 11);
INSERT INTO Users (username, id)
VALUES ("admin_1", 11);

/* Some important templates */
INSERT INTO Entities (tmpl_id, type, def_str, id)
VALUES
    (
        NULL, 'm',
        "is an important/useful instance of the {<Noun phrase> of <Entity>}",
        12
    ),
    (NULL, 'm', "Statement: {<Predicate> applies to <Entity>}", 13),
    (NULL, 'm', "is {<Adjective phrase>}", 14),
    (NULL, 'o', "ExAmPlE oF a NoT vErY uSeFuL eNtItY", 21);



/* More inserts for testing */

CALL insertOrFindTerm(11, 'o', 0, "Music"); -- id: 22
CALL insertOrFindTemplate(11, "Music genre: {<Title>}"); -- id: 23
CALL insertOrFindTerm(11, 'o', 23, "Rock"); -- id: 24
CALL insertOrFindTerm(11, 'o', 23, "Jazz"); -- id: 25
CALL insertOrFindTerm(11, 'o', 23, "Hip hop"); -- id: 26

CALL insertOrFindTemplate(11, "Movie: {<Title>}, <Year>"); -- id: 27
CALL insertOrFindTerm(11, 'o', 27,
    "The Lord of the Rings: The Fellowship of the Ring|2001"
); -- id: 28
CALL insertOrFindTerm(11, 'o', 27,
    "The Lord of the Rings: The Two Towers|2002"
); -- id: 29

CALL insertOrFindTerm(11, 'o', 0, "Science"); -- id: 30
CALL insertOrFindTemplate(11, "Field of science: {<Title>}"); -- id: 31
CALL insertOrFindTerm(11, 'o', 31, "Music"); -- id: 32
CALL insertOrFindTerm(11, 'o', 31, "Cinematography"); -- id: 33
CALL insertOrFindTerm(11, 'o', 31, "Physics"); -- id: 34
CALL insertOrFindTerm(11, 'o', 31, "Mathematics"); -- id: 35

CALL insertOrFindTerm(11, 'o', 0, "Movies"); -- id: 36


-- rate some statements.

CALL insertOrFindTerm(11, 'p', 12, "Subcategories|#1"); -- id: 37
CALL inputOrChangeRating(3, 37, 22, CONV("FFFF", 16, 10), "00");
CALL inputOrChangeRating(3, 37, 24, CONV("A130", 16, 10), "00");
CALL inputOrChangeRating(3, 37, 25, CONV("A000", 16, 10), "00");
CALL inputOrChangeRating(3, 37, 21, CONV("0103", 16, 10), "00");

CALL insertOrFindTerm(11, 'p', 12, "Subcategories|#22"); -- id: 38
CALL inputOrChangeRating(3, 38, 24, CONV("E100", 16, 10), "00");
CALL inputOrChangeRating(3, 38, 25, CONV("E000", 16, 10), "00");
CALL inputOrChangeRating(3, 38, 26, CONV("E000", 16, 10), "00");
CALL inputOrChangeRating(3, 38, 21, CONV("0001", 16, 10), "00");
CALL inputOrChangeRating(3, 38, 32, CONV("F000", 16, 10), "00");

CALL insertOrFindTerm(11, 'p', 12, "Subcategories|#30"); -- id: 39
CALL inputOrChangeRating(3, 39, 32, CONV("F000", 16, 10), "00");

CALL insertOrFindTerm(11, 'p', 12, "Instances|#1"); -- id: 40
CALL inputOrChangeRating(3, 40, 24, CONV("A000", 16, 10), "00");
CALL inputOrChangeRating(3, 40, 36, CONV("A400", 16, 10), "00");
CALL inputOrChangeRating(3, 40, 28, CONV("9003", 16, 10), "00");
CALL inputOrChangeRating(3, 40, 29, CONV("9002", 16, 10), "00");

CALL insertOrFindTerm(11, 'p', 12, "Instances|#36"); -- id: 41
CALL inputOrChangeRating(3, 41, 28, CONV("FF03", 16, 10), "00");
CALL inputOrChangeRating(3, 41, 29, CONV("FF02", 16, 10), "00");


CALL insertOrFindTerm(11, 'p', 12, "Related entities|#28"); -- id: 42
CALL inputOrChangeRating(3, 42, 29, CONV("FFFF", 16, 10), "00");
CALL insertOrFindTerm(11, 'p', 12, "Related entities|#29"); -- id: 43
CALL inputOrChangeRating(3, 43, 28, CONV("FFF0", 16, 10), "00");
CALL insertOrFindTerm(11, 'p', 12, "Related entities|#22"); -- id: 44
CALL inputOrChangeRating(3, 44, 32, CONV("F000", 16, 10), "00");
CALL insertOrFindTerm(11, 'p', 12, "Related entities|#32"); -- id: 45
CALL inputOrChangeRating(3, 45, 22, CONV("FF00", 16, 10), "00");


CALL insertOrFindTerm(11, 'p', 14, "good"); -- id: 46
CALL insertOrFindTerm(11, 'p', 14, "funny"); -- id: 47
CALL insertOrFindTerm(11, 'p', 14, "scary"); -- id: 48
CALL insertOrFindTerm(11, 'p', 14, "iconic"); -- id: 49

CALL insertOrFindTerm(11, 'p', 12, "Relevant ratings for derived entities|#1"); -- id: 50
CALL inputOrChangeRating(3, 50, 46, CONV("F000", 16, 10), "00");
CALL inputOrChangeRating(3, 50, 40, CONV("F000", 16, 10), "00");

CALL insertOrFindTerm(11, 'p', 12, "Relevant ratings for derived entities|#27"); -- id: 51
CALL inputOrChangeRating(3, 51, 46, CONV("F000", 16, 10), "00");
CALL inputOrChangeRating(3, 51, 47, CONV("E100", 16, 10), "00");
CALL inputOrChangeRating(3, 51, 48, CONV("E000", 16, 10), "00");


CALL insertOrFindTerm(11, 'p', 12, "Relevant ratings|#28"); -- id: 52
CALL inputOrChangeRating(3, 52, 46, CONV("F000", 16, 10), "00");
CALL inputOrChangeRating(3, 52, 47, CONV("E100", 16, 10), "00");
CALL inputOrChangeRating(3, 52, 48, CONV("EAAA", 16, 10), "00");
CALL inputOrChangeRating(3, 52, 49, CONV("E000", 16, 10), "00");
