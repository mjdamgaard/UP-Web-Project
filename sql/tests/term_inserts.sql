

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
SET @termsID = "1";

-- insert categories for all the fundamental term types.
CALL insertOrFindCat ("Categories", @termsID, NULL, @catCatid, @ec);
CALL insertOrFindCat ("Standard terms", @termsID, NULL, @stdCatID, @ec);
CALL insertOrFindCat ("Relations", @termsID, NULL, @relCatid, @ec);

CALL insertOrFindCat ("Users and bots", @termsID, NULL, @usersEtcCatID, @ec);

CALL insertOrFindCat ("Users", @usersEtcCatID, NULL, @nid, @ec);
CALL insertOrFindCat ("User groups", @usersEtcCatID, NULL, @nid, @ec);

CALL insertOrFindCat ("Internal data", @termsID, NULL, @dataCatID, @ec);

CALL insertOrFindCat ("Keyword strings", @dataCatID, NULL, @nid, @ec);
CALL insertOrFindCat ("Lists", @dataCatID, NULL, @nid, @ec);
CALL insertOrFindCat ("Texts", @dataCatID, NULL, @nid, @ec);
CALL insertOrFindCat ("Binaries", @dataCatID, NULL, @nid, @ec);


-- insert fundamental relations.
CALL insertOrFindRel ("Subcategories", @termsID, NULL, @s, @ec);
CALL insertOrFindRel ("Elements", @termsID, NULL, @e, @ec);




-- up-vote categories for all the fundamental term types.
CALL inputOrChangeRating (
    'u', 1, 'c', @termsID, @s, 0xF0, 'c', @catCatid, @ec
);
CALL inputOrChangeRating (
    'u', 1, 'c', @catCatid, @e, 0xF1, 'c', @catCatid, @ec
);
CALL inputOrChangeRating (
    'u', 1, 'c', @termsID, @s, 0xF2, 'c', @stdCatID, @ec
);
CALL inputOrChangeRating (
    'u', 1, 'c', @catCatid, @e, 0xF3, 'c', @stdCatID, @ec
);
CALL inputOrChangeRating (
    'u', 1, 'c', @termsID, @s, 0xF4, 'c', @relCatid, @ec
);
CALL inputOrChangeRating (
    'u', 1, 'c', @catCatid, @e, 0xF5, 'c', @relCatid, @ec
);




CALL insertOrFindCat ("Media", @stdCatID, NULL, @mediaCatID, @ec);
    CALL insertOrFindCat ("Music", @mediaCatID, NULL, @musicCatID, @ec);
        CALL insertOrFindCat ("Rock", @musicCatID, NULL, @Rock, @ec);
        CALL insertOrFindCat ("Pop", @musicCatID, NULL, @Pop, @ec);
        CALL insertOrFindCat ("Blues", @musicCatID, NULL, @Blues, @ec);
        CALL insertOrFindCat ("R&B", @musicCatID, NULL, @RandB, @ec);
        CALL insertOrFindCat ("Hip hop", @musicCatID, NULL, @Hip_hop, @ec);
        CALL insertOrFindCat ("Indie", @musicCatID, NULL, @Indie, @ec);
        CALL insertOrFindCat ("Electronic", @musicCatID, NULL, @Electronic, @ec);
        CALL insertOrFindCat ("Techno", @musicCatID, NULL, @Techno, @ec);
    CALL insertOrFindCat ("Movies", @mediaCatID, NULL, @movCatID, @ec);
        CALL insertOrFindCat ("Sci-fi", @movCatID, NULL, @scifi, @ec);
        CALL insertOrFindCat ("Action", @movCatID, NULL, @Action, @ec);
        CALL insertOrFindCat ("Comedy", @movCatID, NULL, @Comedy, @ec);


CALL inputOrChangeRating (
    'u', 1, 'c', @stdCatID, @s, 0xFF, 'c', @mediaCatID, @ec
);
    CALL inputOrChangeRating (
        'u', 1, 'c', @mediaCatID, @s, 0xF6, 'c', @musicCatID, @ec
    );
        CALL inputOrChangeRating (
            'u', 1, 'c', @musicCatID, @s, 0xFF, 'c', @Rock, @ec
        );
        CALL inputOrChangeRating (
            'u', 1, 'c', @musicCatID, @s, 0xFF, 'c', @Pop, @ec
        );
        CALL inputOrChangeRating (
            'u', 1, 'c', @musicCatID, @s, 0xEF, 'c', @Blues, @ec
        );
        CALL inputOrChangeRating (
            'u', 1, 'c', @musicCatID, @s, 0xDF, 'c', @RandB, @ec
        );
        CALL inputOrChangeRating (
            'u', 1, 'c', @musicCatID, @s, 0xCF, 'c', @Hip_hop, @ec
        );
        CALL inputOrChangeRating (
            'u', 1, 'c', @musicCatID, @s, 0xFFCC, 'c', @Indie, @ec
        );
        CALL inputOrChangeRating (
            'u', 1, 'c', @musicCatID, @s, 0xFFF, 'c', @Electronic, @ec
        );
        CALL inputOrChangeRating (
            'u', 1, 'c', @musicCatID, @s, 0x7FF, 'c', @Techno, @ec
        );
    CALL inputOrChangeRating (
        'u', 1, 'c', @mediaCatID, @s, 0xFF, 'c', @movCatID, @ec
    );
        CALL inputOrChangeRating (
            'u', 1, 'c', @movCatID, @s, 0xFF, 'c', @scifi, @ec
        );
        CALL inputOrChangeRating (
            'u', 1, 'c', @movCatID, @s, 0xFF, 'c', @Action, @ec
        );
        CALL inputOrChangeRating (
            'u', 1, 'c', @movCatID, @s, 0xFF, 'c', @Comedy, @ec
        );



CALL insertOrFindCat ("Books etc.", @stdCatID, NULL, @booksEtcCatID, @ec);
    CALL insertOrFindCat ("Fiction", @booksEtcCatID, NULL, @ficCatID, @ec);
    CALL insertOrFindCat (
        "Nonfiction", @booksEtcCatID, NULL, @nonficCatID, @ec
    );




-- -- Works; "terms" are seen as different from "Terms."
-- CALL insertOrFindCat ("terms", @termsID, NULL, @stdCatID, @ec);









--
