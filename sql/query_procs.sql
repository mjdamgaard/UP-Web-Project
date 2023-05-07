
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
    IN maxNum INT UNSIGNED,
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
    LIMIT numOffset, maxNum;
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
CREATE PROCEDURE selectSetID (
    IN userID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN relID BIGINT UNSIGNED
)
BEGIN
    SELECT id AS setID
    FROM Sets
    WHERE (
        user_id = userID AND
        subj_id = subjID AND
        rel_id = relID
    );
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
CREATE PROCEDURE selectRecentInputs (
    IN setID BIGINT UNSIGNED
    IN objID BIGINT UNSIGNED,
)
BEGIN
    IF (objID IS NULL OR objID = 0) THEN
        SELECT
            obj_id AS objID,
            counter AS counter,
            HEX(old_rat_val) AS oldRatVal,
            HEX(new_rat_val) AS newRatVal
        FROM RecentInputs
        WHERE (set_id = setID);
    ELSE
        SELECT
            counter AS counter,
            HEX(old_rat_val) AS oldRatVal,
            HEX(new_rat_val) AS newRatVal
        FROM RecentInputs
        WHERE (set_id = setID AND obj_id = objID);
    END IF;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE selectUserInfo (
    IN userID BIGINT UNSIGNED
)
BEGIN
    SELECT public_keys_for_authentication AS publicKeys
    FROM Users
    WHERE id = userID;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE selectCatInfo (
    IN catID BIGINT UNSIGNED
)
BEGIN
    SELECT
        title AS title,
        super_cat_id AS superCatID
    FROM Categories
    WHERE id = catID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectTermInfo (
    IN termID BIGINT UNSIGNED
)
BEGIN
    SELECT
        title AS title,
        cat_id AS catID
    FROM Terms
    WHERE id = termID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectRelInfo (
    IN relID BIGINT UNSIGNED
)
BEGIN
    SELECT
        subj_t AS subjType
        obj_t AS objType
        obj_noun AS objNoun,
        subj_cat_id AS subjCatID
    FROM Relations
    WHERE id = relID;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectKeywordString (
    IN kwsID BIGINT UNSIGNED
)
BEGIN
    SELECT str AS str
    FROM KeywordStrings
    WHERE id = kwsID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectPattern (
    IN pattID BIGINT UNSIGNED
)
BEGIN
    SELECT str AS str
    FROM Patterns
    WHERE id = pattID;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE searchForCatIDs (
    IN str VARCHAR(255),
    IN superCatID BIGINT UNSIGNED,
    IN maxNum INT,
    IN numOffset INT
)
BEGIN
    SELECT
        title AS title,
        id AS catID
    FROM Categories
    WHERE (title >= str AND super_cat_id = superCatID)
    LIMIT numOffset, maxNum;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectTermIDs (
    IN str VARCHAR(255),
    IN catID BIGINT UNSIGNED,
    IN maxNum INT,
    IN numOffset INT
)
BEGIN
    SELECT
        title AS title,
        id AS termID
    FROM Terms
    WHERE (title >= str AND cat_id = catID)
    LIMIT numOffset, maxNum;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectRelIDs (
    IN subjType CHAR(1),
    IN objType CHAR(1),
    IN str VARCHAR(255),
    IN maxNum INT,
    IN numOffset INT
)
BEGIN
    SELECT
        obj_noun AS objNoun,
        id AS relID
    FROM Relations
    WHERE (subj_t = subjType AND obj_t = objType AND obj_noun >= str)
    LIMIT numOffset, maxNum;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectKeywordStringIDs (
    IN s VARCHAR(768)
)
BEGIN
    SELECT
        str AS str,
        id AS kwsID
    FROM KeywordStrings
    WHERE str >= s;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectPatternIDs (
    IN s VARCHAR(768)
)
BEGIN
    SELECT
        str AS str,
        id as pattID
    FROM Patterns
    WHERE str >= s;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE searchForKeywordStrings (
    IN s VARCHAR(768),
    IN mode VARCHAR(2)
)
BEGIN
    SELECT
        str AS str,
        id AS kwsID
    FROM KeywordStrings
    WHERE MATCH (str) AGAINST (
        s
        CASE WHEN mode = "NL" THEN IN NATURAL LANGUAGE MODE END
        CASE WHEN mode = "B" THEN IN BOOLEAN MODE END
    );
END //
DELIMITER ;










DELIMITER //
CREATE PROCEDURE selectSuperCatDefs (
    IN catID BIGINT UNSIGNED
)
BEGIN
    DECLARE str VARCHAR(255);
    DECLARE n TINYINT UNSIGNED;

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
        title AS title,
        super_cat_id AS superCatID
    FROM ret
    ORDER BY super_cat_id DESC;
END //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE selectText (
    IN textID BIGINT UNSIGNED
)
BEGIN
    SELECT str AS text
    FROM Texts
    WHERE id = textID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectBinary (
    IN binID BIGINT UNSIGNED
)
BEGIN
    SELECT bin AS bin
    FROM Binaries
    WHERE id = binID;
END //
DELIMITER ;









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
