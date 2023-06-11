
DELETE FROM SemanticInputs;
DELETE FROM RecentInputs;
ALTER TABLE RecentInputs AUTO_INCREMENT=1;

DELETE FROM Terms;
ALTER TABLE Terms AUTO_INCREMENT=1;

-- DELETE FROM Texts;
-- ALTER TABLE Texts AUTO_INCREMENT=1;

DELETE FROM PrivateCreators;



/* From create_open_sdb.sql */
-- INSERT INTO Terms (context_id, def_str, def_term_id, id)
-- VALUES
--     (NULL, "{Users} of the SDB", 1, 1),
--     (NULL, "{Texts} of the SDB", 1, 2),
--     (NULL, "{Binaries} of the SDB", 1, 3),
--     (1, "admin_1", NULL, 4);


INSERT INTO Terms (context_id, def_str, def_term_id, id)
VALUES
    (NULL, "Terms", NULL, 5),
    (NULL, "Predicates", NULL, 6),
    (6, ">Verbs, s.", NULL, 7),
    (NULL, "Nouns for predicate definitions", NULL, 8),
    (7, ">is a useful instance of the {$s of }the term, {$t}", NULL, 9),
    (NULL, "openSDB", NULL, 10);


CALL insertOrFindTerm(4, 0, "Science", 0); -- id: 11
CALL insertOrFindTerm(4, 0, "Music", 0); -- id: 12
-- CALL insertOrFindTerm(4, 0, "{Rock} (musical genre)", 0); -- id: 13
CALL insertOrFindTerm(4, 12, "Rock", 0); -- id: 13
CALL insertOrFindTerm(4, 12, "Jazz", 0); -- id: 14
CALL insertOrFindTerm(4, 12, "Hip hop", 0); -- id: 15

CALL insertOrFindTerm(4, 0, "Movies", 0); -- id: 16
CALL insertOrFindTerm(4, 16,
    "{The Lord of the Rings: The Fellowship of the Ring} (2001)", 0
);-- id: 17
CALL insertOrFindTerm(4, 16,
    "{The Lord of the Rings: The Two Towers} (2002)", 0
); -- id: 18






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
                4, 10,
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

CALL insertOrFindTerm(4, 9, "Subcategories", 0);
CALL insertPredicates("Subcategories", 1, 18);
CALL insertOrFindTerm(4, 9, "Instances", 0);
CALL insertPredicates("Instances", 1, 12);

-- rate some statements.


CALL inputOrChangeRating(4, 24, 11, "FF", "00");
CALL inputOrChangeRating(4, 24, 12, "F0", "00");
CALL inputOrChangeRating(4, 24, 13, "A1", "00");
CALL inputOrChangeRating(4, 24, 14, "A0", "00");

CALL inputOrChangeRating(4, 31, 13, "E1", "00");
CALL inputOrChangeRating(4, 31, 14, "E0", "00");
CALL inputOrChangeRating(4, 31, 15, "E0", "00");




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
