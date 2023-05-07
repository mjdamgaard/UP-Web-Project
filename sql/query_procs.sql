
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
    IN setHexID VARCHAR(16),
    IN ratingRangeMinHex VARCHAR(510),
    IN ratingRangeMaxHex VARCHAR(510),
    IN num INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscOrder BOOL
)
BEGIN
    DECLARE setID BIGINT UNSIGNED;
    DECLARE ratMin, ratMax VARBINARY(255);

    SET setID = CONV(setHexID, 16, 10)
    SET ratMin = UNHEX(ratingRangeMinHex);
    SET ratMax = UNHEX(ratingRangeMaxHex);

    SELECT
        HEX(rat_val) AS ratVal,
        CONV(obj_id, 10, 16) AS objID ...
    FROM SemanticInputs
    WHERE (
        set_id = setID AND
        (ratMin = "" OR rat_val >= ratMin) AND
        (ratMax = "" OR rat_val <= ratMax)
    )
    ORDER BY
        CASE WHEN isAscOrder THEN rat_val END ASC,
        CASE WHEN NOT isAscOrder THEN rat_val END DESC,
        CASE WHEN isAscOrder THEN obj_t END ASC,
        CASE WHEN NOT isAscOrder THEN obj_t END DESC,
        CASE WHEN isAscOrder THEN obj_id END ASC,
        CASE WHEN NOT isAscOrder THEN obj_id END DESC
    LIMIT numOffset, num;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectSetInfo (
    IN setCombID VARCHAR(17)
)
BEGIN
    DECLARE setID BIGINT UNSIGNED;
    CALL getConvID (setCombID, setID);

    SELECT
        CONCAT('u', CONV(user_id, 10, 16)) AS userID,
        CONCAT(subj_t, CONV(subj_id, 10, 16)) AS subjID,
        CONCAT('r', CONV(rel_id, 10, 16)) AS relID,
        elem_num AS elemNum
    FROM Sets
    WHERE id = setID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectSetInfoFromSecKey (
    IN userCombID VARCHAR(17),
    IN subjCombID VARCHAR(17),
    IN relCombID VARCHAR(17)
)
BEGIN
    DECLARE subjType CHAR(1);
    DECLARE userID, subjID, relID, setID, elemNum BIGINT UNSIGNED;

    CALL getConvID (userCombID, userID);
    CALL getTypeAndConvID (subjCombID, subjType, subjID);
    CALL getConvID (relCombID, relID);
    SELECT id, elem_num INTO setID, elemNum
    FROM Sets
    WHERE (
        user_id = userID AND
        subj_t = subjType AND
        subj_id = subjID AND
        rel_id = relID
    );

    SELECT
        CONCAT('s', CONV(setID, 10, 16)) AS setID,
        elemNum;
END //
DELIMITER ;


-- DELIMITER //
-- CREATE PROCEDURE selectSetElemNumFromID(
--     IN setIDHex VARCHAR(16)
-- )
-- BEGIN
--     DECLARE setID BIGINT UNSIGNED;
--     SET setID = CONV(setIDHex, 16, 10);
--     SELECT elem_num AS elemNum
--     FROM Sets
--     WHERE (id = setID);
-- END //
-- DELIMITER ;


-- DELIMITER //
-- CREATE PROCEDURE selectSetFromSecKey(
--     IN userType CHAR(1),
--     IN userIDHex VARCHAR(16),
--     IN subjType CHAR(1),
--     IN subjIDHex VARCHAR(16),
--     IN relIDHex VARCHAR(16),
--     IN ratingRangeMin VARBINARY(255),
--     IN ratingRangeMax VARBINARY(255),
--     IN num INT UNSIGNED,
--     IN numOffset INT UNSIGNED,
--     IN isAscOrder BOOL
-- )
-- BEGIN
--     DECLARE setID BIGINT UNSIGNED;
--     CALL getSetIntsFromSecKey (
--         userType,
--         userIDHex,
--         subjType,
--         subjIDHex,
--         relIDHex,
--         setID
--     );
--     CALL selectSetFromSetIDInt (
--         setID,
--         ratingRangeMin,
--         ratingRangeMax,
--         num,
--         numOffset,
--         isAscOrder
--     );
-- END //
-- DELIMITER ;






-- DELIMITER //
-- CREATE PROCEDURE selectRatingFromSecKey (
--     IN objCombID VARCHAR(17),
--     IN userCombID VARCHAR(17),
--     IN subjCombID VARCHAR(17),
--     IN relCombID VARCHAR(17)
-- )
-- BEGIN
--     DECLARE objType, userType, subjType CHAR(1);
--     DECLARE objID, userID, subjID, relID, setID BIGINT UNSIGNED;
--
--     CALL getTypeAndConvID (objCombID, objType, objID);
--     CALL getTypeAndConvID (userCombID, userType, userID);
--     CALL getTypeAndConvID (subjCombID, subjType, subjID);
--     CALL getConvID (relCombID, relID);
--     SELECT id INTO setID
--     FROM Sets
--     WHERE (
--         user_t = userType AND
--         user_id = userID AND
--         subj_t = subjType AND
--         subj_id = subjID AND
--         rel_id = relID
--     );
--
--     SELECT HEX(rat_val) AS ratVal
--     FROM SemanticInputs
--     WHERE (obj_t = objType AND obj_id = objID AND set_id = setID);
-- END //
-- DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectRating (
    IN objCombID VARCHAR(17),
    IN setCombID VARCHAR(17)
)
BEGIN
    DECLARE objID, setID BIGINT UNSIGNED;

    CALL getConvID (objCombID, objID);
    CALL getConvID (setCombID, setID);

    SELECT HEX(rat_val) AS ratVal
    FROM SemanticInputs
    WHERE (obj_id = objID AND set_id = setID);
END //
DELIMITER ;









DELIMITER //
CREATE PROCEDURE selectCatDef (
    IN catCombID VARCHAR(17)
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
