
-- TRUNCATE TABLE Categories; -- very slow, but this is much faster:
DELETE FROM Categories;
ALTER TABLE Categories AUTO_INCREMENT=1;

-- TRUNCATE TABLE Creators;


-- insert the fundamental category of all terms (with no super category).
INSERT INTO Categories (id, title, super_cat_id)
VALUES (1, "Terms", 0); -- ('super_cat_id = 0' means 'no super category.')


-- insert categories for all the fundamental term types.
CALL insertOrFindCat ("Categories", 1, NULL, @ec, @nid);
CALL insertOrFindCat ("Standard terms", 1, NULL, @ec, @nid);
CALL insertOrFindCat ("Relations", 1, NULL, @ec, @nid);

$res = CALL insertOrFindCat ("Users and bots", 1, NULL, @ec, @usersEtcCatID);
$catUserEtcID = $res["id"];

CALL insertOrFindCat ("Users", @usersEtcCatID, NULL, @ec, @nid);
CALL insertOrFindCat ("User groups", @usersEtcCatID, NULL, @ec, @nid);

CALL insertOrFindCat ("Internal data", 1, NULL, @ec, @dataCatID);

CALL insertOrFindCat ("Keyword strings", @dataCatID, NULL, @ec, @nid);
CALL insertOrFindCat ("Lists", @dataCatID, NULL, @ec, @nid);
CALL insertOrFindCat ("Texts", @dataCatID, NULL, @ec, @nid);
CALL insertOrFindCat ("Binaries", @dataCatID, NULL, @ec, @nid);


-- insert fundamental relations.
CALL insertOrFindRel ("Subcategories", 1, NULL, @ec, @nid);
CALL insertOrFindRel ("Elements", 1, NULL, @ec, @nid);
