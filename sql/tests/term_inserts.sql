

-- TRUNCATE TABLE Categories;
DELETE FROM Categories;
ALTER TABLE Categories AUTO_INCREMENT=1;

-- TRUNCATE TABLE Creators;


-- insert the fundamental category of all terms (with no super category).
INSERT INTO Categories (id, title, super_cat_id)
VALUES (1, "Terms", 0); -- ('super_cat_id = 0' means 'no super category.')
SET @termsID = "1";

-- insert categories for all the fundamental term types.
CALL insertOrFindCat ("Categories", @termsID, NULL, @ec, @nid);
CALL insertOrFindCat ("Standard terms", @termsID, NULL, @ec, @nid);
CALL insertOrFindCat ("Relations", @termsID, NULL, @ec, @nid);

CALL insertOrFindCat ("Users and bots", @termsID, NULL, @ec, @usersEtcCatID);

CALL insertOrFindCat ("Users", @usersEtcCatID, NULL, @ec, @nid);
CALL insertOrFindCat ("User groups", @usersEtcCatID, NULL, @ec, @nid);

CALL insertOrFindCat ("Internal data", @termsID, NULL, @ec, @dataCatID);

CALL insertOrFindCat ("Keyword strings", @dataCatID, NULL, @ec, @nid);
CALL insertOrFindCat ("Lists", @dataCatID, NULL, @ec, @nid);
CALL insertOrFindCat ("Texts", @dataCatID, NULL, @ec, @nid);
CALL insertOrFindCat ("Binaries", @dataCatID, NULL, @ec, @nid);


-- insert fundamental relations.
CALL insertOrFindRel ("Subcategories", @termsID, NULL, @ec, @nid);
CALL insertOrFindRel ("Elements", @termsID, NULL, @ec, @nid);



-- up-vote categories for all the fundamental term types.
CALL inputOrChangeRating (
    'u', 1, 'c', @termsID, @s, 0xFF, 'c', @catCatid, @ec
);
CALL inputOrChangeRating (
    'u', 1, 'c', @catCatid, @e, 0xFF, 'c', @catCatid, @ec
);
CALL inputOrChangeRating (
    'u', 1, 'c', @termsID, @s, 0xFF, 'c', @stdCatID, @ec
);
CALL inputOrChangeRating (
    'u', 1, 'c', @catCatid, @e, 0xFF, 'c', @stdCatID, @ec
);
CALL inputOrChangeRating (
    'u', 1, 'c', @termsID, @s, 0xFF, 'c', @relCatid, @ec
);
CALL inputOrChangeRating (
    'u', 1, 'c', @catCatid, @e, 0xFF, 'c', @relCatid, @ec
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
        'u', 1, 'c', @mediaCatID, @s, 0xFF, 'c', @musicCatID, @ec
    );
        CALL inputOrChangeRating (
            'u', 1, 'c', @musicCatID, @s, 0xFF, 'c', @Rock, @ec
        );
        CALL inputOrChangeRating (
            'u', 1, 'c', @musicCatID, @s, 0xFF, 'c', @Pop, @ec
        );
        CALL inputOrChangeRating (
            'u', 1, 'c', @musicCatID, @s, 0xFF, 'c', @Blues, @ec
        );
        CALL inputOrChangeRating (
            'u', 1, 'c', @musicCatID, @s, 0xFF, 'c', @RandB, @ec
        );
        CALL inputOrChangeRating (
            'u', 1, 'c', @musicCatID, @s, 0xFF, 'c', @Hip_hop, @ec
        );
        CALL inputOrChangeRating (
            'u', 1, 'c', @musicCatID, @s, 0xFF, 'c', @Indie, @ec
        );
        CALL inputOrChangeRating (
            'u', 1, 'c', @musicCatID, @s, 0xFF, 'c', @Electronic, @ec
        );
        CALL inputOrChangeRating (
            'u', 1, 'c', @musicCatID, @s, 0xFF, 'c', @Techno, @ec
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














--
