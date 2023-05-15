
-- DELETE FROM Categories;
-- ALTER TABLE Categories AUTO_INCREMENT=1;
-- DELETE FROM Terms;
-- ALTER TABLE Terms AUTO_INCREMENT=1;
-- DELETE FROM Terms;
-- DELETE FROM Creators;

-- insert the fundamental category of all terms (with no super category).
INSERT INTO Categories (id, title, super_cat_id)
VALUES (1, "Terms", 0); -- ('super_cat_id = 0' means 'no super category.')
INSERT INTO Creators (entity_t, entity_id, user_id)
VALUES ('c', 1, 1);


CALL insertOrFindTerm (1, 1, "openSDB");

CALL insertOrFindRel (1, 'c', 'c', "Subcategories");
CALL insertOrFindRel (1, 'c', 't', "Elements");

CALL insertOrFindRel (1, 'c', 'c', "Duplicates");
CALL insertOrFindRel (1, 't', 't', "Duplicates");
