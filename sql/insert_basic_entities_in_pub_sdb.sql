USE mydatabase;


-- insert some users
INSERT INTO Users () VALUES ();
INSERT INTO Users () VALUES ();
INSERT INTO Users () VALUES ();

UPDATE Users SET public_encryption_key = 0xAAAA WHERE id = 1;



-- insert basic keywords used for attributes and their values
INSERT INTO TVarChars (str) VALUES (".type=");
    -- insert some basic values of type attribute
    INSERT INTO TVarChars (str) VALUES ("predicate");
    INSERT INTO TVarChars (str) VALUES ("relation");
    -- Term is the default type so it is not needed:
    -- INSERT INTO TVarChars (str) VALUES ("term");

INSERT INTO TVarChars (str) VALUES (".favname=");
INSERT INTO TVarChars (str) VALUES (".description=");

-- This is perhaps all we need to start with..
