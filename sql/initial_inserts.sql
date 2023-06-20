
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
INSERT INTO Terms (context_id, def_str, def_term_id, id)
VALUES
    (NULL, "{Data} and users of the SDB", NULL, 1),
    (1, "/Users", NULL, 2),
    (1, "/Texts", NULL, 3),
    (1, "/Binaries", NULL, 4),
    (2, "admin_1", NULL, 5);
INSERT INTO Users (username, id)
VALUES ("admin_1", 5);

/* Some other important initial inserts */
INSERT INTO Terms (context_id, def_str, def_term_id, id)
VALUES
    (NULL, "Terms", NULL, 6),
    (NULL, "Predicates", NULL, 7),
    (7, ":is an important/useful instance of the {$s of }the Term, {$t}", NULL, 8),
    (NULL, "Noun lexemes for predicate definitions", NULL, 9),
    (NULL, "Statements", NULL, 10),
    (10, ":$s[0] applies to $t", NULL, 11),
    -- some room for more important inserts..
    (NULL, "ExAmPlE oF a NoT vErY uSeFuL tErM", NULL, 21);



/* More inserts for testing */

CALL insertOrFindTerm(5, 0, "Science", 0); -- id: 22
CALL insertOrFindTerm(5, 0, "Music", 0); -- id: 23
-- CALL insertOrFindTerm(5, 0, "{Rock} (musical genre)", 0); -- id: 24
CALL insertOrFindTerm(5, 23, "Rock", 0); -- id: 24
CALL insertOrFindTerm(5, 23, "Jazz", 0); -- id: 25
CALL insertOrFindTerm(5, 23, "Hip hop", 0); -- id: 26

CALL insertOrFindTerm(5, 0, "Movies", 0); -- id: 27
CALL insertOrFindTerm(5, 27,
    "{The Lord of the Rings: The Fellowship of the Ring} (2001)", 0
);-- id: 28
CALL insertOrFindTerm(5, 27,
    "{The Lord of the Rings: The Two Towers} (2002)", 0
); -- id: 29

CALL insertOrFindTerm(5, 22, "Music", 0); -- id: 30
CALL insertOrFindTerm(5, 22, "Cinematography", 0); -- id: 31
CALL insertOrFindTerm(5, 22, "Physics", 0); -- id: 32
CALL insertOrFindTerm(5, 22, "Mathematics", 0); -- id: 33





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
                5, 8,
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

CALL insertOrFindTerm(5, 9, "Subcategories", 0);
CALL insertPredicates("Subcategories", 6, 12);
CALL insertPredicates("Subcategories", 22, 29);

-- rate some statements.


CALL inputOrChangeRating(5, 35, 22, CONV("FFFF", 16, 10), "00");
CALL inputOrChangeRating(5, 35, 23, CONV("F030", 16, 10), "00");
CALL inputOrChangeRating(5, 35, 24, CONV("A130", 16, 10), "00");
CALL inputOrChangeRating(5, 35, 25, CONV("A000", 16, 10), "00");
CALL inputOrChangeRating(5, 35, 21, CONV("0103", 16, 10), "00");

CALL inputOrChangeRating(5, 43, 24, CONV("E100", 16, 10), "00");
CALL inputOrChangeRating(5, 43, 25, CONV("E000", 16, 10), "00");
CALL inputOrChangeRating(5, 43, 26, CONV("E000", 16, 10), "00");
CALL inputOrChangeRating(5, 43, 21, CONV("0001", 16, 10), "00");
CALL inputOrChangeRating(5, 43, 30, CONV("F000", 16, 10), "00");

CALL inputOrChangeRating(5, 42, 30, CONV("F000", 16, 10), "00");



--
-- CALL insertOrFindPattern(1, "About");
-- CALL insertOrFindPattern(1, "Subcategories");
-- CALL insertOrFindPattern(1, "Supercategories");
-- CALL insertOrFindPattern(1, "Related categories");
-- CALL insertOrFindPattern(1, "Instances");
-- --
-- CALL insertOrFindPattern(1, "General info");
-- CALL insertOrFindPattern(1, "Related terms");
-- CALL insertOrFindPattern(1, "Comments");
--
-- CALL insertOrFindRel (1, 'c', 'c', "Duplicates");
-- CALL insertOrFindRel (1, 't', 't', "Duplicates");
--
-- CALL insertOrFindRel (1, 't', 't', "Duplicate to draw ratings from");
--
--
-- -- insert some example inputs of all kinds to use for development.
--
-- CALL insertOrFindCat(1, 1, "Music"); -- id: 3
-- CALL insertOrFindCat(1, 3, "Rock"); -- id: 4
-- CALL insertOrFindCat(1, 3, "Artists"); -- id: 5
-- CALL insertOrFindCat(1, 4, "Artists"); -- id: 6
--
-- CALL insertOrFindTerm (1, 5, "Led Zeppelin"); -- id: 2
--
-- CALL createOrFindSet(1, 1, 1); -- id: 1
-- CALL inputOrChangeRating (1, 1, 3, "70", "00");
-- CALL inputOrChangeRating (1, 1, 3, "7F", "00");
-- CALL inputOrChangeRatingFromSecKey (1, 1, 1, 3, "71", "00");
--
-- CALL inputOrChangeRatingFromSecKey (1, 1, 1, 2, "7A", "00");
--
-- CALL inputOrChangeRatingFromSecKey (1, 1, 2, 1, "7F", "00");
--
-- CALL inputOrChangeRatingFromSecKey (1, 1, 2, 2, "6F", "00");



DROP PROCEDURE insertPredicates;
