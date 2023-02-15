CREATE TABLE mydatabase.SemanticInputs (
	/* semantic input ID */
	id BIGINT AUTO_INCREMENT,
	PRIMARY KEY(id),

	/* primary fields */
	user BIGINT FOREIGN KEY,
	statement BIGINT FOREIGN KEY,
	value BIGINT,
	
	/* database types (tables) of primary fields */
		/* user types */
		-- allowed user types: only User (so no flag needed).

		/* statement types */
		-- allowed statement types: MonadicStatement or DyadicStatement.
		statement_type TINYINT CHECK (
			statement_type = 1 OR -- (MonadicStatement)
			statement_type = 2    -- (DyadicStatement)
		),

		/* value types */
			-- (OBSOLETE: allowed value types: only BIGINT (so no flag needed).)
		-- allowed value types: any (so no constraints).
		value_type TINYINT,
	/**/

	/* timestamp */
	timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- type code for SemanticInput: 0.


CREATE TABLE mydatabase.MonadicStatements (
	/* monadic statement ID */
	id BIGINT AUTO_INCREMENT,
	PRIMARY KEY(id),

	/* primary fields */
	subject BIGINT,
	predicate BIGINT FOREIGN KEY,

	/* database types (tables) of primary fields */
		/* subject types */
		-- allowed subject types: any (so no constraints).
		subject_type TINYINT,

		/* predicate types */
		-- allowed predicate types: only DescribedTerm (so no flag needed).
	/**/
	
	/* user (or bot) responsible for upload */
	user BIGINT FOREIGN KEY,

	/* timestamp */
	timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- type code for MonadicStatement: 1.


CREATE TABLE mydatabase.DyadicStatements (
	/* dyadic statement ID */
	id BIGINT AUTO_INCREMENT,
	PRIMARY KEY(id),

	/* primary fields */
	subject BIGINT,
	relation BIGINT FOREIGN KEY,
	object BIGINT,

	/* database types (tables) of primary fields */
		/* subject types */
		-- allowed subject types: any (so no constraints).
		subject_type TINYINT,

		/* predicate types */
		-- allowed predicate types: only DescribedTerm (so no flag needed).

		/* object types */
		-- allowed object types: any (so no constraints).
		object_type TINYINT,
	/**/

	/* user (or bot) responsible for upload */
	user BIGINT FOREIGN KEY,

	/* timestamp */
	timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- type code for DyadicStatement: 2.


CREATE TABLE mydatabase.DescribedTerms (
	/* described term ID */
	id BIGINT AUTO_INCREMENT,
	PRIMARY KEY(id),

	/* primary fields */
	description BIGINT FOREIGN KEY,

	/* database types (tables) of primary fields */
		/* subject types */
		-- allowed subject types: TText or SText.
		description_type TINYINT CHECK (
			description_type = 11 OR -- (TText)
			description_type = 12    -- (SText)
		),
	/**/

	/* user (or bot) responsible for upload */
	user BIGINT FOREIGN KEY,
	
	/* timestamp */
	timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- type code for DescribedTerm: 3.



CREATE TABLE mydatabase.Users (
	/* user ID */
	id BIGINT AUTO_INCREMENT,
	PRIMARY KEY(id),

	/* primary fields */
	public_encryption_key BIGINT FOREIGN KEY,

	/* database types (tables) of primary fields */
		/* public_encryption_key types */
		-- allowed public_encryption_key types: TBLOB (so no flag needed).
	/**/

	/* user (or bot) responsible for upload */
	user BIGINT FOREIGN KEY,
	
	/* timestamp */
	timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- type code for User: 5.


-- type code for DateTime: 6. 
-- type code for Year: 7. 
-- type code for Date: 8. 
-- type code for Time: 9. 

-- type code for Bool 10. 
-- type code for TinyInt: 11. 
-- type code for SmallInt: 12. 
-- type code for MediumInt: 13. 
-- type code for Int: 14. 
-- type code for BigInt: 18. 



CREATE TABLE mydatabase.TTexts (
	/* tiny text ID */
	id BIGINT AUTO_INCREMENT,
	PRIMARY KEY(id),

	/* primary fields */
	t_text TINYTEXT,

	/* database types (tables) of primary fields */
		/* t_text types */
		-- allowed t_text types: TINYTEXT (so no flag needed).
	/**/

	/* user (or bot) responsible for upload */
	user BIGINT FOREIGN KEY,
	
	/* timestamp */
	timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- type code for TText: 21.

CREATE TABLE mydatabase.STexts (
	/* small text ID */
	id BIGINT AUTO_INCREMENT,
	PRIMARY KEY(id),

	/* primary fields */
	s_text TEXT,

	/* database types (tables) of primary fields */
		/* s_text types */
		-- allowed s_text types: TEXT (so no flag needed).
	/**/

	/* user (or bot) responsible for upload */
	user BIGINT FOREIGN KEY,
	
	/* timestamp */
	timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- type code for SText: 22.

CREATE TABLE mydatabase.MTexts (
	/* medium text ID */
	id BIGINT AUTO_INCREMENT,
	PRIMARY KEY(id),

	/* primary fields */
	m_text MEDIUMTEXT,

	/* database types (tables) of primary fields */
		/* m_text types */
		-- allowed m_text types: MEDIUMTEXT (so no flag needed).
	/**/

	/* user (or bot) responsible for upload */
	user BIGINT FOREIGN KEY,
	
	/* timestamp */
	timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- type code for MText: 23.

-- saving LTexts for later.



CREATE TABLE mydatabase.TBlobs (
	/* tiny BLOB ID */
	id BIGINT AUTO_INCREMENT,
	PRIMARY KEY(id),

	/* primary fields */
	t_blob TINYBLOB,

	/* database types (tables) of primary fields */
		/* t_blob types */
		-- allowed t_blob types: TINYBLOB (so no flag needed).
	/**/

	/* user (or bot) responsible for upload */
	user BIGINT FOREIGN KEY,
	
	/* timestamp */
	timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- type code for TBlob: 31.

CREATE TABLE mydatabase.SBlobs (
	/* small BLOB ID */
	id BIGINT AUTO_INCREMENT,
	PRIMARY KEY(id),

	/* primary fields */
	s_blob BLOB,

	/* database types (tables) of primary fields */
		/* s_blob types */
		-- allowed s_blob types: BLOB (so no flag needed).
	/**/

	/* user (or bot) responsible for upload */
	user BIGINT FOREIGN KEY,
	
	/* timestamp */
	timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- type code for SBlob: 32.

CREATE TABLE mydatabase.MBlobs (
	/* medium BLOB ID */
	id BIGINT AUTO_INCREMENT,
	PRIMARY KEY(id),

	/* primary fields */
	m_blob MEDIUMBLOB,

	/* database types (tables) of primary fields */
		/* m_blob types */
		-- allowed m_blob types: MEDIUMBLOB (so no flag needed).
	/**/

	/* user (or bot) responsible for upload */
	user BIGINT FOREIGN KEY,
	
	/* timestamp */
	timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- type code for MBlob: 33.

-- saving LBlobs for later.



-- (List0 does not need its own table.)
-- type code for L0List: 40.

CREATE TABLE mydatabase.L1Lists (
	/* length 1 list ID */
	id BIGINT AUTO_INCREMENT,
	PRIMARY KEY(id),

	/* primary fields */
	element_1 BIGINT,

	/* database types (tables) of primary fields */
		/* element types */
		-- allowed element types: any (so no constraints).
		element_1_type TINYINT,
	/**/

	/* user (or bot) responsible for upload */
	user BIGINT FOREIGN KEY,
	
	/* timestamp */
	timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- type code for L1List1: 41.

CREATE TABLE mydatabase.L2Lists (
	/* length 2 list ID */
	id BIGINT AUTO_INCREMENT,
	PRIMARY KEY(id),

	/* primary fields */
	element_1 BIGINT,
	element_2 BIGINT,

	/* database types (tables) of primary fields */
		/* element types */
		-- allowed element types: any (so no constraints).
		element_1_type TINYINT,
		element_2_type TINYINT,
	/**/

	/* user (or bot) responsible for upload */
	user BIGINT FOREIGN KEY,
	
	/* timestamp */
	timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- type code for L2List1: 42.

CREATE TABLE mydatabase.L3Lists (
	/* length 2 list ID */
	id BIGINT AUTO_INCREMENT,
	PRIMARY KEY(id),

	/* primary fields */
	element_1 BIGINT,
	element_2 BIGINT,
	element_3 BIGINT,

	/* database types (tables) of primary fields */
		/* element types */
		-- allowed element types: any (so no constraints).
		element_1_type TINYINT,
		element_2_type TINYINT,
		element_3_type TINYINT,
	/**/

	/* user (or bot) responsible for upload */
	user BIGINT FOREIGN KEY,
	
	/* timestamp */
	timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- type code for L3List1: 43.

CREATE TABLE mydatabase.L4Lists (
	/* length 2 list ID */
	id BIGINT AUTO_INCREMENT,
	PRIMARY KEY(id),

	/* primary fields */
	element_1 BIGINT,
	element_2 BIGINT,
	element_3 BIGINT,
	element_4 BIGINT,

	/* database types (tables) of primary fields */
		/* element types */
		-- allowed element types: any (so no constraints).
		element_1_type TINYINT,
		element_2_type TINYINT,
		element_3_type TINYINT,
		element_4_type TINYINT,
	/**/

	/* user (or bot) responsible for upload */
	user BIGINT FOREIGN KEY,
	
	/* timestamp */
	timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- type code for L3List1: 44.

-- saving larger lists for later.






/*
INSERT INTO mydatabase.Users (username, password)
	VALUES ("user0", "pw0");
INSERT INTO mydatabase.Users (username, password)
	VALUES ("user1", "pw1");
INSERT INTO mydatabase.Users (username, password)
	VALUES ("user2", "pw2");
*/