
DELETE FROM Sets;
ALTER TABLE Sets AUTO_INCREMENT=1;
DELETE FROM SemanticInputs;
DELETE FROM RecentInputs;
ALTER TABLE RecentInputs AUTO_INCREMENT=1;

DELETE FROM Categories;
ALTER TABLE Categories AUTO_INCREMENT=1;
DELETE FROM Terms;
ALTER TABLE Terms AUTO_INCREMENT=1;
DELETE FROM Relations;
ALTER TABLE Relations AUTO_INCREMENT=1;

DELETE FROM Creators;



-- insert the fundamental category of all terms (with no super category).

INSERT INTO Categories (id, title, super_cat_id)
VALUES (1, "Terms", 0); -- ('super_cat_id = 0' means 'no super category.')
INSERT INTO Creators (entity_t, entity_id, user_id)
VALUES ('c', 1, 1);


-- insert basic categories, terms and realtions meant for common use.

CALL insertOrFindCat(1, 1, "openSDB"); -- id: 2
CALL insertOrFindTerm (1, 1, "openSDB"); -- id: 1

CALL insertOrFindRel (1, 'c', 'c', "Subcategories");
CALL insertOrFindRel (1, 'c', 't', "Elements");

CALL insertOrFindRel (1, 'c', 'c', "Duplicates");
CALL insertOrFindRel (1, 't', 't', "Duplicates");

CALL insertOrFindRel (1, 't', 't', "Duplicate to draw ratings from");


-- insert some example inputs of all kinds to use for development.

CALL insertOrFindCat(1, 1, "Music"); -- id: 3
CALL insertOrFindCat(1, 3, "Rock"); -- id: 4
CALL insertOrFindCat(1, 3, "Artists"); -- id: 5
CALL insertOrFindCat(1, 4, "Artists"); -- id: 6

CALL insertOrFindTerm (1, 5, "Led Zeppelin"); -- id: 2

CALL createOrFindSet(1, 1, 1); -- id: 1
CALL inputOrChangeRating (1, 1, 3, "70", "00");
CALL inputOrChangeRating (1, 1, 3, "7F", "00");
CALL inputOrChangeRatingFromSecKey (1, 1, 1, 3, "71", "00");

CALL inputOrChangeRatingFromSecKey (1, 1, 1, 2, "7A", "00");

CALL inputOrChangeRatingFromSecKey (1, 1, 2, 1, "7F", "00");

CALL inputOrChangeRatingFromSecKey (1, 1, 2, 2, "6F", "00");



--
