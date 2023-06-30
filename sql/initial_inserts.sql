
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
INSERT INTO Terms (context_id, def_str, id)
VALUES
    (NULL, "{Data} and users of the SDB", 1),
    (1, "Users", 2),
    (2, "admin_1", 3),
    (1, "Texts", 4),
    (1, "Binaries", 5),
    (NULL, "Terms", 6);
INSERT INTO Users (username, id)
VALUES ("admin_1", 3);

/* Some other important initial inserts */
INSERT INTO Terms (context_id, def_str, def_term_id, id)
VALUES
    (NULL, "Template contexts", 7),
    (7, "is an important/useful instance of the {<Noun phrase> of <Term>}", 8),
    (7, "<Predicate> applies to <Term>", 9),
    (7, "is {<Adjective phrase>}", 10),
    -- (some room for more inserts)
    (NULL, "ExAmPlE oF a NoT vErY uSeFuL tErM", NULL, 21);



/* More inserts for testing */

CALL insertOrFindTerm(3, 0, "Science"); -- id: 22
CALL insertOrFindTerm(3, 0, "Music"); -- id: 23
CALL insertOrFindTerm(3, 23, "Rock"); -- id: 24
CALL insertOrFindTerm(3, 23, "Jazz"); -- id: 25
CALL insertOrFindTerm(3, 23, "Hip hop"); -- id: 26

CALL insertOrFindTerm(3, 7, "Movie: <Title>, <Year>"); -- id: 27
CALL insertOrFindTerm(3, 27,
    "The Lord of the Rings: The Fellowship of the Ring;2001)"
); -- id: 28
CALL insertOrFindTerm(3, 27,
    "The Lord of the Rings: The Two Towers;2002"
); -- id: 29

CALL insertOrFindTerm(3, 22, "Music"); -- id: 30
CALL insertOrFindTerm(3, 22, "Cinematography"); -- id: 31
CALL insertOrFindTerm(3, 22, "Physics"); -- id: 32
CALL insertOrFindTerm(3, 22, "Mathematics"); -- id: 33





-- insert some Subcategories, Supercategories and Instances predicates.

DELIMITER //
CREATE PROCEDURE insertPredicates (
    IN str VARCHAR(255),
    IN startTermID BIGINT UNSIGNED,
    IN endTermID BIGINT UNSIGNED
)
BEGIN
    loop1: LOOP
        IF (startTermID <= endTermID) THEN
            CALL insertOrFindTerm(
                3, 8,
                str,
                startTermID
            );

            SET startTermID = startTermID + 1;
            ITERATE loop1;
        END IF;
        LEAVE loop1;
    END LOOP loop1;
END //
DELIMITER ;

CALL insertOrFindTerm(3, NULL, "Subcategories");
CALL insertPredicates("Subcategories", 6, 10);
CALL insertPredicates("Subcategories", 22, 29);

-- rate some statements.


CALL inputOrChangeRating(3, 35, 22, CONV("FFFF", 16, 10), "00");
CALL inputOrChangeRating(3, 35, 23, CONV("F030", 16, 10), "00");
CALL inputOrChangeRating(3, 35, 24, CONV("A130", 16, 10), "00");
CALL inputOrChangeRating(3, 35, 25, CONV("A000", 16, 10), "00");
CALL inputOrChangeRating(3, 35, 21, CONV("0103", 16, 10), "00");

CALL inputOrChangeRating(3, 41, 24, CONV("E100", 16, 10), "00");
CALL inputOrChangeRating(3, 41, 25, CONV("E000", 16, 10), "00");
CALL inputOrChangeRating(3, 41, 26, CONV("E000", 16, 10), "00");
CALL inputOrChangeRating(3, 41, 21, CONV("0001", 16, 10), "00");
CALL inputOrChangeRating(3, 41, 30, CONV("F000", 16, 10), "00");

CALL inputOrChangeRating(3, 40, 30, CONV("F000", 16, 10), "00");


CALL inputOrChangeRating(3, 6, 26, CONV("A000", 16, 10), "00");
CALL inputOrChangeRating(3, 6, 27, CONV("A400", 16, 10), "00");
CALL inputOrChangeRating(3, 6, 28, CONV("9003", 16, 10), "00");
CALL inputOrChangeRating(3, 6, 29, CONV("9002", 16, 10), "00");

CALL inputOrChangeRating(3, 27, 28, CONV("FF03", 16, 10), "00");
CALL inputOrChangeRating(3, 27, 29, CONV("FF02", 16, 10), "00");


CALL insertOrFindTerm(3, NULL, "Related terms");
CALL insertPredicates("Related terms", 27, 31);

CALL inputOrChangeRating(3, 49, 31, CONV("F000", 16, 10), "00");
CALL inputOrChangeRating(3, 53, 27, CONV("FF00", 16, 10), "00");
CALL inputOrChangeRating(3, 50, 29, CONV("FFFF", 16, 10), "00");
CALL inputOrChangeRating(3, 51, 28, CONV("FFF0", 16, 10), "00");



CALL insertOrFindTerm(3, NULL, "Relevant ratings");
CALL insertPredicates("Relevant ratings", 28, 29);
CALL insertOrFindTerm(3, NULL, "Relevant ratings for derived terms");
CALL insertPredicates("Relevant ratings for derived terms", 6, 8);
CALL insertPredicates("Relevant ratings for derived terms", 22, 33);


CALL inputOrChangeRating(3, 58, 6, CONV("A000", 16, 10), "00");
CALL inputOrChangeRating(3, 61, 22, CONV("A000", 16, 10), "00");
CALL inputOrChangeRating(3, 62, 23, CONV("A000", 16, 10), "00");
CALL inputOrChangeRating(3, 66, 27, CONV("A000", 16, 10), "00");

CALL insertOrFindTerm(3, 10, "good"); -- id: 73
CALL insertOrFindTerm(3, 10, "funny"); -- id: 74
CALL insertOrFindTerm(3, 10, "scary"); -- id: 75
CALL insertOrFindTerm(3, 10, "popular"); -- id: 76
CALL insertOrFindTerm(3, 7, "has a long playtime"); -- id: 77

CALL inputOrChangeRating(3, 66, 73, CONV("FF00", 16, 10), "00");
CALL inputOrChangeRating(3, 66, 74, CONV("E000", 16, 10), "00");
CALL inputOrChangeRating(3, 66, 75, CONV("E000", 16, 10), "00");
CALL inputOrChangeRating(3, 66, 76, CONV("DA00", 16, 10), "00");
CALL inputOrChangeRating(3, 66, 77, CONV("C000", 16, 10), "00");

CALL inputOrChangeRating(3, 62, 73, CONV("FF00", 16, 10), "00");

CALL inputOrChangeRating(3, 55, 76, CONV("F000", 16, 10), "00");
CALL insertOrFindTerm(3, 0, "Genres"); -- id: 78
CALL insertOrFindTerm(3, 78, "Fantasy"); -- id: 79
CALL inputOrChangeRating(3, 55, 79, CONV("E400", 16, 10), "00");


DROP PROCEDURE insertPredicates;
