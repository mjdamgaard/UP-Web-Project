
SELECT "queries_lib";

DROP PROCEDURE selectSet;
DROP PROCEDURE selectSetInfo;
DROP PROCEDURE selectSetInfoFromSecKey;

DROP PROCEDURE selectRating;

DROP PROCEDURE selectCatDef;
DROP PROCEDURE selectETermDef;
DROP PROCEDURE selectRelDef;

DROP PROCEDURE selectCatInfoFromSecKey;
DROP PROCEDURE selectETermInfoFromSecKey;
DROP PROCEDURE selectRelInfoFromSecKey;

DROP PROCEDURE selectSuperCatDefs;

DROP PROCEDURE selectText;
DROP PROCEDURE selectBinary;
DROP PROCEDURE selectList;
DROP PROCEDURE selectKeywordString;
DROP PROCEDURE selectKeywordIDFromSearch;
DROP PROCEDURE selectPattern;
DROP PROCEDURE selectPatternInfoFromSecKey;

DROP PROCEDURE selectCreator;
DROP PROCEDURE selectCreations;

DROP PROCEDURE selectRecentInputs;

DROP PROCEDURE selectPublicUserKey;

DROP PROCEDURE selectUserGroupInfo;




DELIMITER //
CREATE PROCEDURE selectSet (
    IN setID BIGINT UNSIGNED,
    IN ratingRangeMinHex VARCHAR(510),
    IN ratingRangeMaxHex VARCHAR(510),
    IN num INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscOrder BOOL
)
BEGIN
    DECLARE ratMin, ratMax VARBINARY(255);
    SET ratMin = UNHEX(ratingRangeMinHex);
    SET ratMax = UNHEX(ratingRangeMaxHex);

    SELECT
        HEX(rat_val) AS ratVal,
        obj_id AS objID
    FROM SemanticInputs
    WHERE (
        set_id = setID AND
        (ratMin = "" OR rat_val >= ratMin) AND
        (ratMax = "" OR rat_val <= ratMax)
    )
    ORDER BY
        CASE WHEN isAscOrder THEN rat_val END ASC,
        CASE WHEN NOT isAscOrder THEN rat_val END DESC,
        CASE WHEN isAscOrder THEN obj_id END ASC,
        CASE WHEN NOT isAscOrder THEN obj_id END DESC
    LIMIT numOffset, num;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectSetInfo (
    IN setID BIGINT UNSIGNED
)
BEGIN
    SELECT
        Sets.id AS setID,
        Sets.user_id AS userID,
        Relations.subj_t AS subjType
        Sets.subj_id AS subjID,
        Sets.rel_id AS relID,
        Relations.obj_noun AS relObjNoun
        Relations.obj_t AS objType
        Sets.elem_num AS elemNum
    FROM Sets INNER JOIN Relations ON Sets.rel_id = Relations.id
    WHERE Sets.id = setID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectSetInfoFromSecKey (
    IN userID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN relID BIGINT UNSIGNED
)
BEGIN
    DECLARE setID BIGINT UNSIGNED;
    SELECT id INTO setID
    FROM Sets
    WHERE (
        user_id = userID AND
        subj_id = subjID AND
        rel_id = relID
    );
    CALL selectSetInfo (setID);
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE selectRating (
    IN objID BIGINT UNSIGNED,
    IN setID BIGINT UNSIGNED
)
BEGIN
    SELECT HEX(rat_val) AS ratVal
    FROM SemanticInputs
    WHERE (obj_id = objID AND set_id = setID);
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectCatInfo (
    IN catID VARCHAR(17)
)
BEGIN
    DECLARE catID BIGINT UNSIGNED;
    CALL getConvID (catCombID, catID);

    SELECT
        title AS catTitle,
        CONCAT('c', CONV(super_cat_id, 10, 16)) AS superCatID
    FROM Categories
    WHERE id = catID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectETermDef (
    IN eTermCombID VARCHAR(17)
)
BEGIN
    DECLARE eTermID BIGINT UNSIGNED;
    CALL getConvID (eTermCombID, eTermID);

    SELECT
        title AS eTermTitle,
        CONCAT('e', CONV(cat_id, 10, 16)) AS catID
    FROM ElementaryTerms
    WHERE id = eTermID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectRelDef (
    IN relCombID VARCHAR(17)
)
BEGIN
    DECLARE relID BIGINT UNSIGNED;
    CALL getConvID (relCombID, relID);

    SELECT
        obj_noun AS objNoun,
        CONCAT('c', CONV(subj_cat_id, 10, 16)) AS subjCatID
    FROM Relations
    WHERE id = relID;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE selectSuperCatDefs (
    IN catCombID VARCHAR(17)
)
BEGIN
    DECLARE catID BIGINT UNSIGNED;
    DECLARE str VARCHAR(255);
    DECLARE n TINYINT UNSIGNED;

    CALL getConvID (catCombID, catID);

    CREATE TEMPORARY TABLE ret
        SELECT title, super_cat_id
        FROM Categories
        WHERE id = NULL;

    SET n = 0;
    label1: LOOP
        IF (NOT catID > 0 OR n >= 255) THEN
            LEAVE label1;
        END IF;
        SELECT title, super_cat_id INTO str, catID
        FROM Categories
        WHERE id = catID;
        INSERT INTO ret (title, super_cat_id)
        VALUES (str, catID);
        SET n = n + 1;
        ITERATE label1;
    END LOOP label1;

    SELECT
        title AS catTitle,
        CONCAT('c', CONV(super_cat_id, 10, 16)) AS superCatID
    FROM ret
    ORDER BY super_cat_id DESC;
END //
DELIMITER ;

-- SHOW WARNINGS;









DELIMITER //
CREATE PROCEDURE selectText (
    IN txtCombID VARCHAR(17)
)
BEGIN
    DECLARE txtID BIGINT UNSIGNED;
    CALL getConvID (txtCombID, txtID);

    SELECT str as text
    FROM Texts
    WHERE id = txtID;
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE selectBinary (
    IN binCombID VARCHAR(17)
)
BEGIN
    DECLARE binID BIGINT UNSIGNED;
    CALL getConvID (binCombID, binID);

    SELECT bin as bin
    FROM Binaries
    WHERE id = binID;
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE selectKeywordString (
    IN kwsCombID VARCHAR(17)
)
BEGIN
    DECLARE kwsID BIGINT UNSIGNED;
    CALL getConvID (kwsCombID, kwsID);

    SELECT str as str
    FROM KeywordStrings
    WHERE id = kwsID;
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE selectPattern (
    IN patCombID VARCHAR(17)
)
BEGIN
    DECLARE patID BIGINT UNSIGNED;
    CALL getConvID (patCombID, patID);

    SELECT str as str
    FROM Patterns
    WHERE id = patID;
END //
DELIMITER ;




-- TODO: Add data select procedures.

-- DELIMITER //
-- CREATE PROCEDURE selectData (
--     IN dataType CHAR(1),
--     IN dataIDHex VARCHAR(16)
-- )
-- BEGIN
--     DECLARE dataID BIGINT UNSIGNED;
--     SET dataID = CONV(dataIDHex, 16, 10);
--
--     CASE dataType
--         WHEN "t" THEN
--             SELECT str AS str FROM Texts WHERE (id = dataID);
--         -- TODO: Implement more data term types.
--         ELSE
--             SELECT NULL;
--     END CASE;
-- END //
-- DELIMITER ;




-- TODO: Add selectRecentInputs()..



-- TODO: Correct and add selectCreations() procedure below (out-commented).

-- DELIMITER //
-- CREATE PROCEDURE selectCreations (
--     IN userIDHex VARCHAR(16),
--     IN termType CHAR(1),
--     IN num INT UNSIGNED,
--     IN numOffset INT UNSIGNED,
--     IN isAscOrder BOOL
-- )
-- BEGIN
--     DECLARE userID BIGINT UNSIGNED;
--     SET userID = CONV(userIDHex, 16, 10);
--
--     IF (isAscOrder) THEN
--         SELECT CONV(term_id, 10, 16) AS termID
--         FROM Creators
--         WHERE (user_id = userID AND term_t = termType)
--         ORDER BY term_id ASC
--         LIMIT numOffset, num;
--     ELSE
--         SELECT CONV(term_id, 10, 16) AS termID
--         FROM Creators
--         WHERE (user_id = userID AND term_t = termType)
--         ORDER BY term_id DESC
--         LIMIT numOffset, num;
--     END IF;
-- END //
-- DELIMITER ;
