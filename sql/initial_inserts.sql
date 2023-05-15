
DELETE FROM Categories;
ALTER TABLE Categories AUTO_INCREMENT=1;
DELETE FROM Creators;


-- insert the fundamental category of all terms (with no super category).
INSERT INTO Categories (id, title, super_cat_id)
VALUES (1, "Terms", 0); -- ('super_cat_id = 0' means 'no super category.')
INSERT INTO Creators (entity_t, entity_id, user_id)
VALUES ('c', 1, 1);
