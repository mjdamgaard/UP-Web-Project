
-- TRUNCATE TABLE Categories; -- very slow, but this is much faster:
DELETE FROM Categories;
ALTER TABLE Categories AUTO_INCREMENT=1;
DELETE FROM Creators;

-- TRUNCATE TABLE Creators;


-- insert the fundamental category of all terms (with no super category).
INSERT INTO Categories (id, title, super_cat_id)
VALUES (1, "Terms", 0); -- ('super_cat_id = 0' means 'no super category.')
-- SET @termsID = "1";
INSERT INTO Creators (entity_t, entity_id, user_id)
VALUES ('c', 1, 1);
--
-- -- insert categories for all the fundamental term types.
-- CALL insertOrFindCat ("Categories", @termsID, NULL, @ec, @nid);
-- CALL insertOrFindCat ("Standard terms", @termsID, NULL, @ec, @nid);
-- CALL insertOrFindCat ("Relations", @termsID, NULL, @ec, @nid);
--
-- CALL insertOrFindCat ("Users and bots", @termsID, NULL, @ec, @usersEtcCatID);
--
-- CALL insertOrFindCat ("Users", @usersEtcCatID, NULL, @ec, @nid);
-- CALL insertOrFindCat ("User groups", @usersEtcCatID, NULL, @ec, @nid);
--
-- CALL insertOrFindCat ("Internal data", @termsID, NULL, @ec, @dataCatID);
--
-- CALL insertOrFindCat ("Keyword strings", @dataCatID, NULL, @ec, @nid);
-- CALL insertOrFindCat ("Lists", @dataCatID, NULL, @ec, @nid);
-- CALL insertOrFindCat ("Texts", @dataCatID, NULL, @ec, @nid);
-- CALL insertOrFindCat ("Binaries", @dataCatID, NULL, @ec, @nid);
--
--
-- -- insert fundamental relations.
-- CALL insertOrFindRel ("Subcategories", @termsID, NULL, @ec, @nid);
-- CALL insertOrFindRel ("Elements", @termsID, NULL, @ec, @nid);
