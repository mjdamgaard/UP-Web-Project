
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
INSERT INTO Texts (str)
VALUES (CONCAT(
    "This text desribes the fundamental semantics of the so-called Contexts ",
    "and Terms of the database. ", -- TODO: Continue this text.. (And only start
    -- making it bootstrap its own meaning towards the end of it.)


    "This is a description of any Term with a Context equal to this one, ",
    "i.e. the Context with id=1, title=""Terms"", or equal to a ",
    "descendant Context. ",
    "All Contexts hold an ID of a so-called 'parent context' in the ",
    "database, and a 'descendant context' is thus one that has the relevant ",
    "Context as an ancestor. All Contexts in the database will have this ",
    "Context (i.e. the one that this text descibes) as their greatest ",
    "ancestor. Apart from a parent context ID and a title, the Contexts holds ",
    "an ID of a description text, such as this one, as well as ",
    "a 'specifying entity type,' which will be explained shortly.\n\t",
        "All Terms of this Context, meaning all Terms in the database since ",
    "this is the outermost Context, is defined by the following data that ",
    "they hold in the database. They hold an ID of their Context, a title, ",
    "and an ID of a so-called 'specifying entity.' The Context of a Term ",
    "defines how the data of the Term is to be interpreted, just as this text ",
    "is trying to do for all Terms. The held Context can be a ",
    "child/descendent of another Context, by which the statements of that ",
    "Context is inherited by the child/descendant, unless an inherited ",
    "is explicitely amended. Since all Contexts are descendant of this ",
    """Terms"" Context, all Terms an Contexts will inherit these ",
    "fundamental rules."
));
INSERT INTO Creators (entity_t, entity_id, user_id)
VALUES ('t', 1, 1);

-- insert basic contexts, terms and realtions meant for common use.


CALL insertText(CONCAT(
    -- TODO..
    "..Hm, måske jeg godt bare kan starte med en grundlæggende Prædikatklasse,",
    " hvor titlen bare kan være enten navneord, verber.. Hm.. Eller måske en ",
    "netop hvor ordklassen parses fra et indledende n.s., n.pl., v.s., v.pl., ",
    "adj. ..."
)); -- id: 2
CALL insertOrFindContext(1, 1, 1, "Predicates", 2, "t"); -- id: 2





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
