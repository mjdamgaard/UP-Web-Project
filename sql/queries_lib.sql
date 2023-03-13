

DROP PROCEDURE selectSet;
DROP PROCEDURE selectRating;

DROP PROCEDURE selectCatDef;
DROP PROCEDURE selectStdDef;
DROP PROCEDURE selectRelDef;

DROP PROCEDURE selectSuperCats;

DROP PROCEDURE selectData;

DROP PROCEDURE selectCreations;




DELIMITER //
CREATE PROCEDURE selectSet (
    IN userType CHAR(1),
    IN userID BIGINT UNSIGNED,
    IN subjType CHAR(1),
    IN subjID BIGINT UNSIGNED,
    IN relID BIGINT UNSIGNED,
    IN ratingRangeMin VARBINARY(255),
    IN ratingRangeMax VARBINARY(255),
    IN num INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscOrder BOOL
)
BEGIN
    DECLARE setID BIGINT UNSIGNED;
    SELECT set_id INTO setID
    FROM Sets
    WHERE (
        user_t = userType AND
        user_id = userID AND
        subj_t = subjType AND
        subj_id = subjID AND
        rel_id = relID
    );
    IF (isAscOrder) THEN
        SELECT HEX(rat_val) AS ratingVal, obj_t AS objType, obj_id AS objID
        FROM SemanticInputs
        WHERE (
            set_id = setID AND
            rat_val BETWEEN ratingRangeMin AND ratingRangeMax
        )
        ORDER BY rat_val, obj_t, obj_id ASC
        LIMIT numOffset, num;
    ELSE
        SELECT HEX(rat_val) AS ratingVal, obj_t AS objType, obj_id AS objID
        FROM SemanticInputs
        WHERE (
            set_id = setID AND
            rat_val BETWEEN ratingRangeMin AND ratingRangeMax
        )
        ORDER BY rat_val, obj_t, obj_id DESC
        LIMIT numOffset, num;
    END IF;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectRating (
    IN objType CHAR(1),
    IN objID BIGINT UNSIGNED,
    IN userType CHAR(1),
    IN userID BIGINT UNSIGNED,
    IN subjType CHAR(1),
    IN subjID BIGINT UNSIGNED,
    IN relID BIGINT UNSIGNED
)
BEGIN
    DECLARE setID BIGINT UNSIGNED;
    SELECT set_id INTO setID
    FROM Sets
    WHERE (
        user_t = userType AND
        user_id = userID AND
        subj_t = subjType AND
        subj_id = subjID AND
        rel_id = relID
    );
    SELECT HEX(rat_val) AS ratingVal
    FROM SemanticInputs
    WHERE (obj_t = objType AND obj_id = objID AND set_id = setID);
END //
DELIMITER ;









DELIMITER //
CREATE PROCEDURE selectCatDef (
    IN catID BIGINT UNSIGNED
)
BEGIN
    SELECT title AS title, HEX(super_cat_id) AS superCatID
    FROM Categories
    WHERE id = catID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectStdDef (
    IN stdID BIGINT UNSIGNED
)
BEGIN
    SELECT title AS title, HEX(cat_id) AS catID
    FROM StandardTerms
    WHERE id = stdID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectRelDef (
    IN relID BIGINT UNSIGNED
)
BEGIN
    SELECT obj_noun AS objNoun, HEX(subj_cat_id) AS subjCatID
    FROM Relations
    WHERE id = relID;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE selectSuperCats (
    IN catID BIGINT UNSIGNED
)
BEGIN
    DECLARE str VARCHAR(255);
    DECLARE n TINYINT UNSIGNED;
    SET n = 255;
    label1: LOOP
        IF (NOT catID > 0 OR n = 0) THEN
            LEAVE label1;
        END IF;
        SELECT title, super_cat_id INTO str, catID
        FROM Categories
        WHERE id = catID;
        SELECT str as title, catID;
        SET n = n - 1;
        ITERATE label1;
    END LOOP label1;
END //
DELIMITER ;

-- SHOW WARNINGS;



DELIMITER //
CREATE PROCEDURE selectData (
    IN dataType CHAR(1),
    IN dataID BIGINT UNSIGNED
)
BEGIN
    CASE dataType
        WHEN "t" THEN
            SELECT str AS str FROM Texts WHERE (id = dataID);
        -- TODO: Implement more data term types.
        ELSE
            SELECT NULL;
    END CASE;
END //
DELIMITER ;






DELIMITER //
CREATE PROCEDURE selectCreations (
    IN userID BIGINT UNSIGNED,
    IN termType CHAR(1),
    IN num INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscOrder BOOL
)
BEGIN
    IF (isAscOrder) THEN
        SELECT HEX(term_id) AS termID
        FROM Creators
        WHERE (user_id = userID AND term_t = termType)
        ORDER BY term_id ASC
        LIMIT numOffset, num;
    ELSE
        SELECT HEX(term_id) AS termID
        FROM Creators
        WHERE (user_id = userID AND term_t = termType)
        ORDER BY term_id DESC
        LIMIT numOffset, num;
    END IF;
END //
DELIMITER ;
