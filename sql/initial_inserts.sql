
DELETE FROM SemanticInputs;
DELETE FROM RecentInputs;
ALTER TABLE RecentInputs AUTO_INCREMENT=1;

DELETE FROM SemanticContexts;
ALTER TABLE SemanticContexts AUTO_INCREMENT=1;
DELETE FROM Terms;
ALTER TABLE Terms AUTO_INCREMENT=1;

-- DELETE FROM Texts;
-- ALTER TABLE Texts AUTO_INCREMENT=1;

DELETE FROM Creators;



-- insert the fundamental context of all terms (with no parent context).
INSERT INTO SemanticContexts (id, parent_context_id, title)
VALUES (1, 0, "Terms");
INSERT INTO Creators (entity_t, entity_id, user_id)
VALUES ('c', 1, 1);
-- insert the Term "Term," referencing (the category of) all terms/Terms.
CALL insertOrFindTerm(1, 1, "Terms", "0", 0); -- id: 1

-- insert basic contexts, terms and realtions meant for common use.


CALL insertOrFindContext(1, 1, "Predicates"); -- id: 2

-- Terms of this Semantic Context is just the Predicate titles without the
-- objects (so with only ("0", 0) as their spect_t/id's). Thus, "Predicate term
-- titles" is a more precise title for this Context, but let us call it
-- "Relations" for simplicity.
CALL insertOrFindContext(1, 1, "Relations"); -- id: 3

CALL insertOrFindContext(1, 1, "Lists"); -- id: 4


CALL insertOrFindTerm(1, 1, "openSDB", "0", 0); -- id: 2

CALL insertOrFindTerm(1, 1, "Music", "0", 0); -- id: 3
CALL insertOrFindTerm(1, 1, "{Rock} (musical genre)", "0", 0); -- id: 4
CALL insertOrFindTerm(1, 1, "Jazz", "0", 0); -- id: 5
CALL insertOrFindTerm(1, 1, "Hip hop", "0", 0); -- id: 6

CALL insertOrFindTerm(1, 1, "Movies", "0", 0); -- id: 7
CALL insertOrFindContext(1, 1, "Movies"); -- id: 5
CALL insertOrFindTerm(1, 5,
    "{The Lord of the Rings: The Fellowship of the Ring} (2001)",
    "0", 0
);-- id: 8
CALL insertOrFindTerm(1, 5,
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


CALL insertOrFindContext(
    1, 2,
    "is a useful instance of the {{$t} of }the term {$d}"
); -- id: 6



CALL insertOrFindTerm(
    1, 3,
    "is a useful instance of the {{Subcategories} of }the term {$}",
    "0", 0
); -- id: 10
CALL insertOrFindTerm(
    1, 3,
    "is a useful instance of the {{Supercategories} of }the term {$}",
    "0", 0
); -- id: 11
CALL insertOrFindTerm(
    1, 3,
    "is a useful instance of the {{Related categories} of }the term {$}",
    "0", 0
); -- id: 12
CALL insertOrFindTerm(
    1, 3,
    "is a useful part of the {{Instances} of }the term {$}",
    "0", 0
); -- id: 13
CALL insertOrFindTerm(
    1, 3,
    "is a useful instance of the {{Related terms} of }the term {$}",
    "0", 0
); -- id: 14
CALL insertOrFindTerm(
    1, 3,
    "is a useful instance of the {{Comments} to }the term {$}",
    "0", 0
); -- id: 15
-- I intend for the Comments on Related terms to be a subtab of a tab "About."
-- And I expect that they will get more sibling tabs in the future, like
-- "Annotations" for instance (and/or perhaps they will get I supercategory,
-- which might be called "Appendices" or something to that effect).


-- insert some Subcategories, Supercategories and Instances predicates.

DELIMITER //
CREATE PROCEDURE insertPredicates (
    IN title VARCHAR(255),
    IN startTermID BIGINT UNSIGNED,
    IN endTermID BIGINT UNSIGNED
)
BEGIN
    loop1: LOOP
        IF (startTermID <= endTermID) THEN
            CALL insertOrFindTerm(
                1, 2,
                title,
                "t", startTermID
            );

            SET startTermID = startTermID + 1;
            ITERATE loop1;
        END IF;
        LEAVE loop1;
    END LOOP loop1;
END //
DELIMITER ;

CALL insertPredicates(
    "is a useful instance of the {{Subcategories} of }the term {$}",
    1, 7
);
CALL insertPredicates(
    "is a useful part of the {{Instances} of }the term {$}",
    1, 3
);

-- rate some statements.

-- TODO: correct these ratVals to 7F etc., but not before debugging how they
-- are converted in the app.
CALL inputOrChangeRating(1, 16, "t", 2, 32767, "00");
CALL inputOrChangeRating(1, 16, "t", 3, 30000, "00");
CALL inputOrChangeRating(1, 16, "t", 4, 10000, "00");


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
