

-- TRUNCATE TABLE Categories;
DELETE FROM Categories;
ALTER TABLE Categories AUTO_INCREMENT=1;

-- TRUNCATE TABLE Creators;


-- insert the fundamental category of all terms (with no super category).
INSERT INTO Categories (id, title, super_cat_id)
VALUES (1, "Terms", 0); -- ('super_cat_id = 0' means 'no super category.')


-- insert categories for all the fundamental term types.
CALL insertOrFindCat ("Categories", 1, NULL, @nid, @ec);
CALL insertOrFindCat ("Standard terms", 1, NULL, @stdCatID, @ec);
CALL insertOrFindCat ("Relations", 1, NULL, @nid, @ec);

CALL insertOrFindCat ("Users and bots", 1, NULL, @usersEtcCatID, @ec);
    CALL insertOrFindCat ("Users", @usersEtcCatID, NULL, @nid, @ec);
    CALL insertOrFindCat ("User groups", @usersEtcCatID, NULL, @nid, @ec);

CALL insertOrFindCat ("Internal data", 1, NULL, @dataCatID, @ec);
    CALL insertOrFindCat ("Keyword strings", @dataCatID, NULL, @nid, @ec);
    CALL insertOrFindCat ("Lists", @dataCatID, NULL, @nid, @ec);
    CALL insertOrFindCat ("Texts", @dataCatID, NULL, @nid, @ec);
    CALL insertOrFindCat ("Binaries", @dataCatID, NULL, @nid, @ec);


-- insert fundamental relations.
CALL insertOrFindRel ("Subcategories", 1, NULL, @nid, @ec);
CALL insertOrFindRel ("Elements", 1, NULL, @nid, @ec);






CALL insertOrFindCat ("Media", @stdCatID, NULL, @mediaCatID, @ec);
    CALL insertOrFindCat ("Music", @mediaCatID, NULL, @musicCatID, @ec);
        CALL insertOrFindCat ("Rock", @musicCatID, NULL, @nid, @ec);
        CALL insertOrFindCat ("Pop", @musicCatID, NULL, @nid, @ec);
        CALL insertOrFindCat ("Blues", @musicCatID, NULL, @nid, @ec);
        CALL insertOrFindCat ("R&B", @musicCatID, NULL, @nid, @ec);
        CALL insertOrFindCat ("Hip hop", @musicCatID, NULL, @nid, @ec);
        CALL insertOrFindCat ("Indie", @musicCatID, NULL, @nid, @ec);
        CALL insertOrFindCat ("Electronic", @musicCatID, NULL, @nid, @ec);
        CALL insertOrFindCat ("Techno", @musicCatID, NULL, @nid, @ec);
    CALL insertOrFindCat ("Movies", @mediaCatID, NULL, @movCatID, @ec);
        CALL insertOrFindCat ("Sci-fi", @movCatID, NULL, @nid, @ec);
        CALL insertOrFindCat ("Action", @movCatID, NULL, @nid, @ec);
        CALL insertOrFindCat ("Comedy", @movCatID, NULL, @nid, @ec);


CALL insertOrFindCat ("Books etc.", @stdCatID, NULL, @booksEtcCatID, @ec);
    CALL insertOrFindCat ("Fiction", @booksEtcCatID, NULL, @ficCatID, @ec);
    CALL insertOrFindCat (
        "Nonfiction", @booksEtcCatID, NULL, @nonficCatID, @ec
    );














--
