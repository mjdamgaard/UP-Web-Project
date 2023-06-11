
DELETE FROM SemanticInputs;
DELETE FROM RecentInputs;
ALTER TABLE RecentInputs AUTO_INCREMENT=1;

DELETE FROM Terms;
ALTER TABLE Terms AUTO_INCREMENT=1;

-- DELETE FROM Texts;
-- ALTER TABLE Texts AUTO_INCREMENT=1;

DELETE FROM PrivateCreators;



-- From create_open_sdb:
-- INSERT INTO Terms (context_id, def_str, def_term_id, id)
-- VALUES
--     (NULL, "{Users} of the SDB", 1, 1),
--     (NULL, "{Texts} of the SDB", 1, 2),
--     (NULL, "{Binaries} of the SDB", 1, 3),
--     (1, "admin_1", NULL, 4);


INSERT INTO Terms (context_id, def_str, def_term_id, id)
VALUES
    (NULL, "Predicates", NULL), -- id: 7
    (7, ">Verbs, s.", NULL), -- id: 8
    (NULL, "Nouns for predicate definitions", NULL), -- id: 9
    (8, "is a useful instance of the {$s of }the term, {$t}", NULL), -- id: 10
    (NULL, "openSDB", NULL), -- id: 11

-- CALL insertOrFindTerm(6, 2, "Predicates", 1); -- id: 7
-- CALL insertOrFindTerm(6, 2, "Verbs, s.", 7); -- id: 8
--
-- CALL insertOrFindTerm(6, 2, "Nouns for predicate definitions", 1); -- id: 9
--
-- CALL insertOrFindTerm(
--     6, 2,
--     "is a useful instance of the {$s of }the term, {$t}",
--     8
-- ); -- id: 10
--
-- CALL insertOrFindTerm(6, 1, "openSDB", 0); -- id: 11

CALL insertOrFindTerm(6, 1, "Music", 0); -- id: 12
CALL insertOrFindTerm(6, 1, "{Rock} (musical genre)", 0); -- id: 13
CALL insertOrFindTerm(6, 1, "Jazz", 0); -- id: 14
CALL insertOrFindTerm(6, 1, "Hip hop", 0); -- id: 15

CALL insertOrFindTerm(6, 1, "Movies", 0); -- id: 16
-- CALL insertOrFindTerm(1, 2, "Movies", 1); -- id: 17
CALL insertOrFindTerm(1, 16,
    "{The Lord of the Rings: The Fellowship of the Ring} (2001)",
    "0", 0
);-- id: 8
CALL insertOrFindTerm(1, 16,
    "{The Lord of the Rings: The Two Towers} (2002)",
    "0", 0
); -- id: 9
-- (Note that the Semantic Context "Movies" is here used as the context of the
-- two movie examples, since these two terms are not meant to be interpreted as
-- categories, which will (as I foresee) usually be the case for Terms that
-- simply has "Terms" as their Semantic Context. Rather they are meant to be
-- iterpreted as refering to the movies themselves, and we therefore expect
-- that the userbase might want to attach special rendering options when such
-- Terms are viewed, either in their own Column or as a SetList element.)






-- insert some Subcategories, Supercategories and Instances predicates.

DELIMITER //
CREATE PROCEDURE insertPredicates (
    IN predCxt BIGINT UNSIGNED,
    IN str VARCHAR(255),
    IN startTermID BIGINT UNSIGNED,
    IN endTermID BIGINT UNSIGNED
)
BEGIN
    loop1: LOOP
        IF (startTermID <= endTermID) THEN
            CALL insertOrFindTerm(
                1, predCxt,
                str,
                "t", startTermID
            );

            SET startTermID = startTermID + 1;
            ITERATE loop1;
        END IF;
        LEAVE loop1;
    END LOOP loop1;
END //
DELIMITER ;

CALL insertOrFindTerm(1, 8, "Subcategories", 0);
CALL insertPredicates(11, "Subcategories", 1, 7);
CALL insertOrFindTerm(1, 8, "Instances", 0);
CALL insertPredicates(11, "Instances", 1, 3);

-- rate some statements.


CALL inputOrChangeRating(1, 16, 1, 2, "FF", "00");
CALL inputOrChangeRating(1, 16, 1, 3, "E0", "00");
CALL inputOrChangeRating(1, 16, 1, 4, "90", "00");





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
