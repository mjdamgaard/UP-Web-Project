

-- TRUNCATE TABLE Categories;
DELETE FROM Categories;
ALTER TABLE Categories AUTO_INCREMENT=1;

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
CALL insertOrFindRel ("Subcategories", @termsID, NULL, @nid, @ec);
CALL insertOrFindRel ("Elements", @termsID, NULL, @nid, @ec);




-- up-vote categories for all the fundamental term types.
CALL inputOrChangeRating (
    'u', 1, 'c', @termsID, @s, "F0", 'c', @catCatid, @ec
);
CALL inputOrChangeRating (
    'u', 1, 'c', @catCatid, @e, "F1", 'c', @catCatid, @ec
);
CALL inputOrChangeRating (
    'u', 1, 'c', @termsID, @s, "F2", 'c', @stdCatID, @ec
);
CALL inputOrChangeRating (
    'u', 1, 'c', @catCatid, @e, "F3", 'c', @stdCatID, @ec
);
CALL inputOrChangeRating (
    'u', 1, 'c', @termsID, @s, "F4", 'c', @relCatid, @ec
);
CALL inputOrChangeRating (
    'u', 1, 'c', @catCatid, @e, "F5", 'c', @relCatid, @ec
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
    'u', 1, 'c', @stdCatID, @s, "FF", 'c', @mediaCatID, @ec
);
    CALL inputOrChangeRating (
        'u', 1, 'c', @mediaCatID, @s, "F6", 'c', @musicCatID, @ec
    );
        CALL inputOrChangeRating (
            'u', 1, 'c', @musicCatID, @s, "FF", 'c', @Rock, @ec
        );
        CALL inputOrChangeRating (
            'u', 1, 'c', @musicCatID, @s, "FF", 'c', @Pop, @ec
        );
        CALL inputOrChangeRating (
            'u', 1, 'c', @musicCatID, @s, "EF", 'c', @Blues, @ec
        );
        CALL inputOrChangeRating (
            'u', 1, 'c', @musicCatID, @s, "DF", 'c', @RandB, @ec
        );
        CALL inputOrChangeRating (
            'u', 1, 'c', @musicCatID, @s, "CF", 'c', @Hip_hop, @ec
        );
        CALL inputOrChangeRating (
            'u', 1, 'c', @musicCatID, @s, "FFCC", 'c', @Indie, @ec
        );
        CALL inputOrChangeRating (
            'u', 1, 'c', @musicCatID, @s, "FFF", 'c', @Electronic, @ec
        );
        CALL inputOrChangeRating (
            'u', 1, 'c', @musicCatID, @s, "7FF", 'c', @Techno, @ec
        );
    CALL inputOrChangeRating (
        'u', 1, 'c', @mediaCatID, @s, "FF", 'c', @movCatID, @ec
    );
        CALL inputOrChangeRating (
            'u', 1, 'c', @movCatID, @s, "FF", 'c', @scifi, @ec
        );
        CALL inputOrChangeRating (
            'u', 1, 'c', @movCatID, @s, "FF", 'c', @Action, @ec
        );
        CALL inputOrChangeRating (
            'u', 1, 'c', @movCatID, @s, "FF", 'c', @Comedy, @ec
        );



CALL insertOrFindCat ("Books etc.", @stdCatID, NULL, @booksEtcCatID, @ec);
    CALL insertOrFindCat ("Fiction", @booksEtcCatID, NULL, @ficCatID, @ec);
    CALL insertOrFindCat (
        "Nonfiction", @booksEtcCatID, NULL, @nonficCatID, @ec
    );














--
