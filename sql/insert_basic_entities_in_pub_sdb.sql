USE mydatabase;


-- insert some users
INSERT INTO Users () VALUES ();
INSERT INTO Users () VALUES ();
INSERT INTO Users () VALUES ();

UPDATE Users SET public_encryption_key = 0xAAAA WHERE id = 1;




-- -- insert basic keywords used for attributes and their values
-- INSERT INTO TVarChars (str) VALUES ("type =");
--     -- insert some basic values of type attribute
--     INSERT INTO TVarChars (str) VALUES ("predicate");
--     INSERT INTO TVarChars (str) VALUES ("relation");
--     INSERT INTO TVarChars (str) VALUES ("attribute"); -- (described, i.e.)
--     INSERT INTO TVarChars (str) VALUES ("category"); -- (described, i.e.)
--     --INSERT INTO TVarChars (str) VALUES ("word or compound term");--(described)
--     -- INSERT INTO TVarChars (str) VALUES ("phrase"); -- (described, i.e.)
--
--
-- INSERT INTO TVarChars (str) VALUES ("category =");
--     -- category categories:
--     -- INSERT INTO TVarChars (str) VALUES ("predicate category");
--     -- INSERT INTO TVarChars (str) VALUES ("relation category");
--     -- INSERT INTO TVarChars (str) VALUES ("attribute category");
--     -- ... Hm, never mind, cause it's not normal think of categories of, say,
--     -- predicates and relations etc.
--     --
--     -- -- some word/phrase categories:
--     -- INSERT INTO TVarChars (str) VALUES ("noun");
--     -- INSERT INTO TVarChars (str) VALUES ("proper noun");
--     -- INSERT INTO TVarChars (str) VALUES ("verb"); -- this might be
--     -- INSERT INTO TVarChars (str) VALUES ("adjective");
--     -- INSERT INTO TVarChars (str) VALUES ("adverb");
--     -- INSERT INTO TVarChars (str) VALUES ("preposition");
--     -- -- (These are not important, but I might as well insert them... ..no..)
--
--
-- INSERT INTO TVarChars (str) VALUES ("genre =");
--
-- INSERT INTO TVarChars (str) VALUES ("subcategory =");
-- INSERT INTO TVarChars (str) VALUES ("subgenre =");


-- insert basic keywords used for attributes and their values
INSERT INTO TVarChars (str) VALUES (".type=");
    -- insert some basic values of type attribute
    INSERT INTO TVarChars (str) VALUES ("predicate");
    INSERT INTO TVarChars (str) VALUES ("relation");
    -- Term is the default type so it is not needed:
    -- INSERT INTO TVarChars (str) VALUES ("term");

INSERT INTO TVarChars (str) VALUES (".favname=");
INSERT INTO TVarChars (str) VALUES (".description=");






-- -- The users can then define their own term types/main categories from here.
-- -- ... But some examples are:
-- INSERT INTO TVarChars (str) VALUES ("movie");
-- INSERT INTO TVarChars (str) VALUES ("book");
-- INSERT INTO TVarChars (str) VALUES ("article");
-- INSERT INTO TVarChars (str) VALUES ("text");
-- INSERT INTO TVarChars (str) VALUES ("video");
-- INSERT INTO TVarChars (str) VALUES ("image");
-- INSERT INTO TVarChars (str) VALUES ("social media post");
-- INSERT INTO TVarChars (str) VALUES ("meme");
-- INSERT INTO TVarChars (str) VALUES ("word or compound term");
-- INSERT INTO TVarChars (str) VALUES ("person");
-- INSERT INTO TVarChars (str) VALUES ("place");
-- INSERT INTO TVarChars (str) VALUES ("fictive character");
-- INSERT INTO TVarChars (str) VALUES ("fictive place");




-- insert basic ...
