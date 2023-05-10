
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
    IN setID BIGINT UNSIGNED,
    IN objID BIGINT UNSIGNED,
    IN maxNum INT,
    IN numOffset INT
)
BEGIN
    IF (objID = 0) THEN
        SELECT
            obj_id AS objID,
            changed_at AS changedAt,
            HEX(old_rat_val) AS oldRatVal,
            HEX(new_rat_val) AS newRatVal
        FROM RecentInputs
        WHERE set_id = setID
        ORDER BY obj_id DESC, changed_at DESC
        LIMIT numOffset, maxNum;
    ELSE
        SELECT
            objID AS objID,
            changed_at AS changedAt,
            HEX(rat_val) AS ratVal
        FROM RecentInputs
        WHERE (set_id = setID AND obj_id = objID)
        ORDER BY changed_at DESC
        LIMIT numOffset, maxNum;
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
CREATE PROCEDURE selectCat (
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
CREATE PROCEDURE selectTerm (
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
CREATE PROCEDURE selectRel (
    IN relID BIGINT UNSIGNED
)
BEGIN
    SELECT
        subj_t AS subjType,
        obj_t AS objType,
        obj_noun AS objNoun
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
CREATE PROCEDURE selectCatIDs (
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
    ORDER BY title ASC
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
    ORDER BY title ASC
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
    ORDER BY obj_noun ASC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectKeywordStringIDs (
    IN s VARCHAR(768),
    IN maxNum INT,
    IN numOffset INT
)
BEGIN
    SELECT
        str AS str,
        id AS kwsID
    FROM KeywordStrings
    WHERE str >= s
    ORDER BY str ASC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectPatternIDs (
    IN s VARCHAR(768),
    IN maxNum INT,
    IN numOffset INT
)
BEGIN
    SELECT
        str AS str,
        id as pattID
    FROM Patterns
    WHERE str >= s
    ORDER BY str ASC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE searchForKeywordStrings (
    IN s VARCHAR(768),
    IN maxNum INT,
    IN numOffset INT
)
BEGIN
    SELECT
        str AS str,
        id AS kwsID
    FROM KeywordStrings
    WHERE MATCH (str) AGAINST (s IN NATURAL LANGUAGE MODE)
    LIMIT numOffset, maxNum;
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE searchForKeywordStringsBooleanMode (
    IN s VARCHAR(768),
    IN maxNum INT,
    IN numOffset INT
)
BEGIN
    SELECT
        str AS str,
        id AS kwsID
    FROM KeywordStrings
    WHERE MATCH (str) AGAINST (s IN BOOLEAN MODE)
    LIMIT numOffset, maxNum;
END //
DELIMITER ;






DELIMITER //
CREATE PROCEDURE selectSuperCatDefs (
    IN catID BIGINT UNSIGNED,
    IN maxNum INT
)
BEGIN
    DECLARE str VARCHAR(255);
    DECLARE n INT UNSIGNED;

    CREATE TEMPORARY TABLE ret
        SELECT title, super_cat_id
        FROM Categories
        WHERE id = NULL;

    SET n = 0;
    label1: LOOP
        IF (catID = 0 OR n >= maxNum) THEN
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


DELIMITER //
CREATE PROCEDURE selectList (
    IN listID BIGINT UNSIGNED
)
BEGIN
    SELECT
        elem_ts AS elemTypeStr,
        HEX(elem_ids) AS elemIDHexStr,
        tail_id AS tailID
    FROM Lists
    WHERE id = listID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectListID (
    IN elemTypeStr VARCHAR(31),
    IN elemIDHexStr VARCHAR(496),
    tailID BIGINT UNSIGNED
)
BEGIN
    SELECT id AS listID
    FROM Lists
    WHERE (
        elem_ts = elemTypeStr AND
        elem_ids = UNHEX(elemIDHexStr) AND
        tail_id = tailID
    );
END //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE selectCreator (
    IN entityType CHAR(1),
    IN entityID BIGINT UNSIGNED
)
BEGIN
    SELECT user_id AS userID
    FROM Creators
    WHERE (entity_t = entityType AND entity_id = entityID);
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectCreations (
    IN userID BIGINT UNSIGNED,
    IN entityType CHAR(1),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscOrder BOOL
)
BEGIN
    SELECT
        entity_t AS entityType,
        entity_id AS entityID
    FROM Creators
    WHERE (
        user_id = userID AND
        (entityType IS NULL OR term_t = termType)
    )
    ORDER BY
        CASE WHEN isAscOrder THEN entity_t END ASC,
        CASE WHEN NOT isAscOrder THEN entity_t END DESC,
        CASE WHEN isAscOrder THEN entity_id END ASC,
        CASE WHEN NOT isAscOrder THEN entity_id END DESC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;
