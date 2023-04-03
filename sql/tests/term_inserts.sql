

-- TRUNCATE TABLE Categories;
DELETE FROM Categories;
ALTER TABLE Categories AUTO_INCREMENT=1;

DELETE FROM Sets;
ALTER TABLE Sets AUTO_INCREMENT=1;
DELETE FROM SemanticInputs;
DELETE FROM RecentInputs;

-- DELETE FROM UserGroups;
-- DELETE FROM Users;

DELETE FROM Categories;
ALTER TABLE Categories AUTO_INCREMENT=1;
-- DELETE FROM ElementaryTerms;
-- ALTER TABLE ElementaryTerms AUTO_INCREMENT=1;
-- DELETE FROM Relations;
-- ALTER TABLE Relations AUTO_INCREMENT=1;
-- DELETE FROM KeywordStrings;
-- DELETE FROM Lists;
-- DELETE FROM Texts;
-- DELETE FROM Binaries;

DELETE FROM Creators;
ALTER TABLE Creators AUTO_INCREMENT=1;

-- TRUNCATE TABLE Creators;


-- insert the fundamental category of all terms (with no super category).
INSERT INTO Categories (id, title, super_cat_id)
VALUES (1, "Terms", 0); -- ('super_cat_id = 0' means 'no super category.')
SET @termsID = "c1";

-- insert categories for all the fundamental term types.
CALL insertOrFindCat (NULL, @termsID, "Categories", @catCatid, @ec);
CALL insertOrFindCat (NULL, @termsID, "Standard terms", @stdCatID, @ec);
CALL insertOrFindCat (NULL, @termsID, "Relations", @relCatid, @ec);

CALL insertOrFindCat (NULL, @termsID, "Users and bots", @usersEtcCatID, @ec);

CALL insertOrFindCat (NULL, @usersEtcCatID, "Users", @nid, @ec);
CALL insertOrFindCat (NULL, @usersEtcCatID, "User groups", @nid, @ec);

CALL insertOrFindCat (NULL, @termsID, "Internal data", @nid, @ec);

CALL insertOrFindCat (NULL, @dataCatID, "Keyword strings", @nid, @ec);
CALL insertOrFindCat (NULL, @dataCatID, "Lists", @nid, @ec);
CALL insertOrFindCat (NULL, @dataCatID, "Texts", @nid, @ec);
CALL insertOrFindCat (NULL, @dataCatID,  "Binaries", @nid, @ec);


-- insert fundamental relations.
CALL insertOrFindRel (NULL, @catCatid, "Subcategories", @s, @ec);
CALL insertOrFindRel (NULL, @catCatid, "Elements", @e, @ec);


SELECT "hell0";

-- up-vote categories for all the fundamental term types.
CALL inputOrChangeRating (
    'u1', @termsID, @s, @catCatid, "F0", @ec
);
CALL inputOrChangeRating (
    'u1', @catCatid, @e, @catCatid, "F1", @ec
);
CALL inputOrChangeRating (
    'u1', @termsID, @s, @stdCatID, "F2", @ec
);
CALL inputOrChangeRating (
    'u1', @catCatid, @e, @stdCatID, "F3", @ec
);
CALL inputOrChangeRating (
    'u1', @termsID, @s, @relCatid, "F4", @ec
);
CALL inputOrChangeRating (
    'u1', @catCatid, @e, @relCatid, "F5", @ec
);




CALL insertOrFindCat (NULL, @stdCatID, "Media", @mediaCatID, @ec);
    CALL insertOrFindCat (NULL, @mediaCatID, "Music", @musicCatID, @ec);
        CALL insertOrFindCat (NULL, @musicCatID, "Rock", @Rock, @ec);
        CALL insertOrFindCat (NULL, @musicCatID, "Pop", @Pop, @ec);
        CALL insertOrFindCat (NULL, @musicCatID, "Blues", @Blues, @ec);
        CALL insertOrFindCat (NULL, @musicCatID, "R&B", @RandB, @ec);
        CALL insertOrFindCat (NULL, @musicCatID, "Hip hop", @Hip_hop, @ec);
        CALL insertOrFindCat (NULL, @musicCatID, "Indie", @Indie, @ec);
        CALL insertOrFindCat (NULL, @musicCatID, "Electronic", @Electronic, @ec);
        CALL insertOrFindCat (NULL, @musicCatID, "Techno", @Techno, @ec);
    CALL insertOrFindCat (NULL, @mediaCatID, "Movies", @movCatID, @ec);
        CALL insertOrFindCat (NULL, @movCatID, "Sci-fi", @scifi, @ec);
        CALL insertOrFindCat (NULL, @movCatID, "Action", @Action, @ec);
        CALL insertOrFindCat (NULL, @movCatID, "Comedy", @Comedy, @ec);


CALL inputOrChangeRating (
    'u1', @stdCatID, @s, @mediaCatID, "FF", @ec
);
    CALL inputOrChangeRating (
        'u1', @mediaCatID, @s, @musicCatID, "F6", @ec
    );
        CALL inputOrChangeRating (
            'u1', @musicCatID, @s, @Rock, "FF", @ec
        );
        CALL inputOrChangeRating (
            'u1', @musicCatID, @s, @Pop, "FF", @ec
        );
        CALL inputOrChangeRating (
            'u1', @musicCatID, @s, @Blues, "EF", @ec
        );
        CALL inputOrChangeRating (
            'u1', @musicCatID, @s, @RandB, "DF", @ec
        );
        CALL inputOrChangeRating (
            'u1', @musicCatID, @s, @Hip_hop, "CF", @ec
        );
        CALL inputOrChangeRating (
            'u1', @musicCatID, @s, @Indie, "FFCC", @ec
        );
        CALL inputOrChangeRating (
            'u1', @musicCatID, @s, @Electronic, "FFF", @ec
        );
        CALL inputOrChangeRating (
            'u1', @musicCatID, @s, @Techno, "7FF", @ec
        );
    CALL inputOrChangeRating (
        'u1', @mediaCatID, @s, @movCatID, "FF", @ec
    );
        CALL inputOrChangeRating (
            'u1', @movCatID, @s, @scifi, "FF", @ec
        );
        CALL inputOrChangeRating (
            'u1', @movCatID, @s, @Action, "FF", @ec
        );
        CALL inputOrChangeRating (
            'u1', @movCatID, @s, @Comedy, "FF", @ec
        );



CALL insertOrFindCat (NULL, @stdCatID, "Books etc.", @booksEtcCatID, @ec);
    CALL insertOrFindCat (NULL, @booksEtcCatID, "Fiction", @ficCatID, @ec);
    CALL insertOrFindCat (NULL @booksEtcCatID, "Nonfiction", @nonficCatID, @ec);




-- -- Works; "terms" are seen as different from "Terms."
-- CALL insertOrFindCat (NULL, "terms", @stdCatID, @ec);









--
