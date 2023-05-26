
SELECT "Query procedures";

-- DROP PROCEDURE selectSet;
-- DROP PROCEDURE selectSetFromSecKey;
-- DROP PROCEDURE selectSetInfo;
-- DROP PROCEDURE selectSetInfoFromSecKey;
-- DROP PROCEDURE selectRating;
-- DROP PROCEDURE selectRecentInputs;
-- DROP PROCEDURE selectRecordedInputs;
-- DROP PROCEDURE selectUserInfo;
-- DROP PROCEDURE selectContext;
-- DROP PROCEDURE selectTerm;
-- DROP PROCEDURE selectContextIDs;
-- DROP PROCEDURE selectTermIDs;
-- DROP PROCEDURE selectList;
-- DROP PROCEDURE selectListID;
-- DROP PROCEDURE selectPattern;
-- DROP PROCEDURE selectPatternIDs;
-- DROP PROCEDURE searchForKeywordStrings;
-- DROP PROCEDURE searchForKeywordStringsBooleanMode;
-- DROP PROCEDURE selectText;
-- DROP PROCEDURE selectBinary;
-- DROP PROCEDURE selectCreator;
-- DROP PROCEDURE selectCreations;



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
CREATE PROCEDURE selectSetFromSecKey (
    IN userID BIGINT UNSIGNED,
    IN predID BIGINT UNSIGNED,
    IN subjType CHAR(1),
    IN ratingRangeMinHex VARCHAR(510),
    IN ratingRangeMaxHex VARCHAR(510),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscOrder BOOL
)
BEGIN
    DECLARE setID BIGINT UNSIGNED;
    SELECT id INTO setID
    FROM Sets
    WHERE (
        user_id = userID AND
        pred_id = predID AND
        subj_t = subjType
    );
    CALL selectSet (
        setID,
        ratingRangeMinHex,
        ratingRangeMaxHex,
        maxNum,
        numOffset,
        isAscOrder
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectSetInfo (
    IN setID BIGINT UNSIGNED
)
BEGIN
    SELECT
        id AS setID,
        user_id AS userID,
        pred_id AS predID,
        subj_t AS subjType,
        elem_num AS elemNum
    FROM Sets;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectSetInfoFromSecKey (
    IN userID BIGINT UNSIGNED,
    IN predID BIGINT UNSIGNED,
    IN subjType CHAR(1)
)
BEGIN
    DECLARE setID BIGINT UNSIGNED;
    SELECT id INTO setID
    FROM Sets
    WHERE (
        user_id = userID AND
        pred_id = predID AND
        subj_t = subjType
    );
    CALL selectSetInfo (setID);
END //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE selectRating (
    IN subjID BIGINT UNSIGNED,
    IN setID BIGINT UNSIGNED
)
BEGIN
    SELECT HEX(rat_val) AS ratVal
    FROM SemanticInputs
    WHERE (subj_id = subjID AND set_id = setID);
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectRecentInputs (
    IN startID BIGINT UNSIGNED,
    IN maxNum INT
)
BEGIN
    SELECT
        set_id AS setID,
        subj_id AS subjID,
        HEX(rat_val) AS ratVal
    FROM RecentInputs
    WHERE id >= startID
    ORDER BY id ASC
    LIMIT maxNum;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectRecordedInputs (
    IN setID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN maxNum INT,
    IN numOffset INT
)
BEGIN
    IF (subjID = 0 OR subjID IS NULL) THEN
        SELECT
            subj_id AS subjID,
            changed_at AS changedAt,
            HEX(rat_val) AS ratVal
        FROM RecordedInputs
        WHERE set_id = setID
        ORDER BY subj_id DESC, changed_at DESC
        LIMIT numOffset, maxNum;
    ELSE
        SELECT
            subjID AS subjID,
            changed_at AS changedAt,
            HEX(rat_val) AS ratVal
        FROM RecordedInputs
        WHERE (set_id = setID AND subj_id = subjID)
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
CREATE PROCEDURE selectContext (
    IN cxtID BIGINT UNSIGNED
)
BEGIN
    SELECT
        parent_context_id AS parentCxtID,
        title AS title,
        description_text_id AS desTextID,
        spec_entity_t AS specType
    FROM Contexts
    WHERE id = cxtID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectTerm (
    IN termID BIGINT UNSIGNED
)
BEGIN
    SELECT
        context_id AS cxtID,
        title AS title,
        spec_entity_id AS specID
    FROM Terms
    WHERE id = termID;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectContextIDs (
    IN parentCxtID BIGINT UNSIGNED,
    IN desTextID BIGINT UNSIGNED,
    IN specType CHAR(1),
    IN str VARCHAR(255),
    IN maxNum INT,
    IN numOffset INT
)
BEGIN
    (
        SELECT
            title AS title,
            id AS cxtID
        FROM Contexts
        WHERE (
            parent_context_id = parentCxtID AND
            description_text_id = desTextID AND
            spec_entity_t = specType AND
            title < str
        )
        ORDER BY title DESC
        LIMIT 1
    ) UNION (
        SELECT
            title AS title,
            id AS cxtID
        FROM Contexts
        WHERE (
            parent_context_id = parentCxtID AND
            description_text_id = desTextID AND
            spec_entity_t = specType AND
            title >= str
        )
        ORDER BY title ASC
        LIMIT numOffset, maxNum
    )
    ORDER BY title ASC;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectTermIDs (
    IN cxtID BIGINT UNSIGNED,
    IN specID BIGINT UNSIGNED,
    IN str VARCHAR(255),
    IN maxNum INT,
    IN numOffset INT
)
BEGIN
    (
        SELECT
            title AS title,
            id AS termID
        FROM Terms
        WHERE (
            context_id = cxtID AND
            spec_entity_id = specID AND
            title < str
        )
        ORDER BY title DESC
        LIMIT 1
    ) UNION (
        SELECT
            title AS title,
            id AS termID
        FROM Terms
        WHERE (
            context_id = cxtID AND
            spec_entity_id = specID AND
            title >= str
        )
        ORDER BY title ASC
        LIMIT numOffset, maxNum
    )
    ORDER BY title ASC;
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
CREATE PROCEDURE selectPatternIDs (
    IN s VARCHAR(768),
    IN maxNum INT,
    IN numOffset INT
)
BEGIN
    (
        SELECT
            str AS str,
            id AS pattID
        FROM Patterns
        WHERE str < s
        ORDER BY str DESC
        LIMIT 1
    ) UNION (
        SELECT
            str AS str,
            id AS pattID
        FROM Patterns
        WHERE str >= s
        ORDER BY str ASC
        LIMIT numOffset, maxNum
    )
    ORDER BY str ASC;
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
    IF entityType = "" THEN
        SET entityType = NULL;
    END IF;

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
