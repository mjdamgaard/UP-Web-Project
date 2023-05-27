
DELETE FROM Sets;
ALTER TABLE Sets AUTO_INCREMENT=1;
DELETE FROM SemanticInputs;
DELETE FROM RecentInputs;
ALTER TABLE RecentInputs AUTO_INCREMENT=1;

DELETE FROM Contexts;
ALTER TABLE Contexts AUTO_INCREMENT=1;
DELETE FROM Terms;
ALTER TABLE Terms AUTO_INCREMENT=1;

DELETE FROM Texts;
ALTER TABLE Texts AUTO_INCREMENT=1;

DELETE FROM Creators;



-- insert the fundamental context of all terms (with no parent context).
INSERT INTO Contexts (
    id, parent_context_id, title, description_text_id, spec_entity_t
)
VALUES (
    1, 0, "Terms", 1, "0"
);
INSERT INTO Creators (entity_t, entity_id, user_id)
VALUES ('c', 1, 1);

-- insert basic contexts, terms and realtions meant for common use.


CALL insertOrFindContext(
    1, 1, 1,
    "{Predicates} \\(holding an optional term ..\\)",
    "t"
); -- id: 2





-- CALL insertOrFindCat(1, 1, "openSDB"); -- id: 2
-- CALL insertOrFindTerm (1, 1, "openSDB"); -- id: 1
--
-- CALL insertOrFindRel (1, 'c', 'c', "Subcategories");
-- CALL insertOrFindRel (1, 'c', 't', "Elements");
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



--
