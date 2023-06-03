
SELECT "Query procedures";

DROP PROCEDURE selectInputSet;
DROP PROCEDURE selectRating;
DROP PROCEDURE selectUsersAndRatings;
DROP PROCEDURE selectRecentInputs;
DROP PROCEDURE selectRecordedInputs;
-- DROP PROCEDURE selectUserInfo;
-- DROP PROCEDURE selectContext;
-- DROP PROCEDURE selectTerm;
-- DROP PROCEDURE selectContextID;
-- DROP PROCEDURE selectTermID;
-- DROP PROCEDURE selectContextIDs;
-- DROP PROCEDURE selectTermIDs;
-- DROP PROCEDURE selectList;
-- DROP PROCEDURE selectListID;
-- DROP PROCEDURE searchForKeywordStrings;
-- DROP PROCEDURE searchForKeywordStringsBooleanMode;
-- DROP PROCEDURE selectKeywordStringIDs;
-- DROP PROCEDURE selectText;
-- DROP PROCEDURE selectBinary;
-- DROP PROCEDURE selectCreator;
-- DROP PROCEDURE selectCreations;



DELIMITER //
CREATE PROCEDURE selectInputSet (
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
    DECLARE ratMin, ratMax VARBINARY(255);
    SET ratMin = UNHEX(ratingRangeMinHex);
    SET ratMax = UNHEX(ratingRangeMaxHex);

    SELECT
        HEX(rat_val) AS ratVal,
        subj_id AS subjID
    FROM SemanticInputs
    WHERE (
        user_id = userID AND
        pred_id = predID AND
        subj_t = subjType AND
        (ratMin = "" OR rat_val >= ratMin) AND
        (ratMax = "" OR rat_val <= ratMax)
    )
    ORDER BY
        CASE WHEN isAscOrder THEN rat_val END ASC,
        CASE WHEN NOT isAscOrder THEN rat_val END DESC,
        CASE WHEN isAscOrder THEN subj_id END ASC,
        CASE WHEN NOT isAscOrder THEN subj_id END DESC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectRating (
    IN subjType CHAR(1),
    IN subjID BIGINT UNSIGNED,
    IN predID BIGINT UNSIGNED,
    IN userID BIGINT UNSIGNED
)
BEGIN
    SELECT HEX(rat_val) AS ratVal
    FROM SemanticInputs
    WHERE (
        subj_t = subjType AND
        subj_id = subjID AND
        pred_id = predID AND
        user_id = userID
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectUsersAndRatings (
    IN subjType CHAR(1),
    IN subjID BIGINT UNSIGNED,
    IN predID BIGINT UNSIGNED,
    IN startUserID BIGINT UNSIGNED,
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED
)
BEGIN
    SELECT
        user_id AS userID,
        HEX(rat_val) AS ratVal
    FROM SemanticInputs
    WHERE (
        subj_t = subjType AND
        subj_id = subjID AND
        pred_id = predID AND
        user_id >= userID
    )
    ORDER BY user_id ASC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;






DELIMITER //
CREATE PROCEDURE selectRecentInputs (
    IN startID BIGINT UNSIGNED,
    IN maxNum INT UNSIGNED
)
BEGIN
    SELECT
        user_id AS userID,
        pred_id AS predID,
        subj_t AS subjType,
        HEX(rat_val) AS ratVal,
        subj_id AS subjID,
        changed_at AS changedAt
    FROM RecentInputs
    WHERE id >= startID
    ORDER BY id ASC
    LIMIT maxNum;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectRecordedInputs (
    IN userID BIGINT UNSIGNED,
    IN predID BIGINT UNSIGNED,
    IN subjType CHAR(1),
    IN subjID BIGINT UNSIGNED,
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED
)
BEGIN
    IF (subjID = 0 OR subjID IS NULL) THEN
        SELECT
            subj_id AS subjID,
            changed_at AS changedAt,
            HEX(rat_val) AS ratVal
        FROM RecordedInputs
        WHERE (
            user_id = userID AND
            pred_id = predID AND
            subj_t = subjType
        )
        ORDER BY subj_id DESC, changed_at DESC
        LIMIT numOffset, maxNum;
    ELSE
        SELECT
            subjID AS subjID,
            changed_at AS changedAt,
            HEX(rat_val) AS ratVal
        FROM RecordedInputs
        WHERE (
            user_id = userID AND
            pred_id = predID AND
            subj_t = subjType AND
            subj_id = subjID
        )
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
    SELECT
        username AS username,
        public_keys_for_authentication AS publicKeys
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
        title AS title
    FROM SemanticContexts
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
        spec_entity_t AS specType,
        spec_entity_id AS specID
    FROM Terms
    WHERE id = termID;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectContextID (
    IN parentCxtID BIGINT UNSIGNED,
    IN str VARCHAR(255)
)
BEGIN
    SELECT id AS cxtID
    FROM SemanticContexts
    WHERE (
        parent_context_id = parentCxtID AND
        title = str
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectTermID (
    IN cxtID BIGINT UNSIGNED,
    IN specType CHAR(1),
    IN specID BIGINT UNSIGNED,
    IN str VARCHAR(255)
)
BEGIN
    IF (specID = 0) THEN
        SET specID = NULL;
    END IF;

    SELECT id AS termID
    FROM Terms
    WHERE (
        context_id = cxtID AND
        spec_entity_t = specType AND
        spec_entity_id <=> specID AND
        title = str
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectContextIDs (
    IN parentCxtID BIGINT UNSIGNED,
    IN str VARCHAR(255),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED
)
BEGIN
    (
        SELECT
            title AS title,
            id AS cxtID
        FROM SemanticContexts
        WHERE (
            parent_context_id = parentCxtID AND
            title < str
        )
        ORDER BY title DESC
        LIMIT 1
    ) UNION (
        SELECT
            title AS title,
            id AS cxtID
        FROM SemanticContexts
        WHERE (
            parent_context_id = parentCxtID AND
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
    IN specType CHAR(1),
    IN specID BIGINT UNSIGNED,
    IN str VARCHAR(255),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED
)
BEGIN
    IF (specID = 0) THEN
        SET specID = NULL;
    END IF;

    (
        SELECT
            title AS title,
            id AS termID
        FROM Terms
        WHERE (
            context_id = cxtID AND
            spec_entity_t = specType AND
            spec_entity_id <=> specID AND
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
            spec_entity_t = specType AND
            spec_entity_id <=> specID AND
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
    IF (tailID = 0) THEN
        SET tailID = NULL;
    END IF;

    SELECT id AS listID
    FROM Lists
    WHERE (
        elem_ts = elemTypeStr AND
        elem_ids = UNHEX(elemIDHexStr) AND
        tail_id <=> tailID
    );
END //
DELIMITER ;








DELIMITER //
CREATE PROCEDURE searchForKeywordStrings (
    IN s VARCHAR(768),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED
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
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED
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
CREATE PROCEDURE selectKeywordStringIDs (
    IN s VARCHAR(768),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED
)
BEGIN
    (
        SELECT
            str AS str,
            id AS kwsID
        FROM KeywordStrings
        WHERE str < s
        ORDER BY str DESC
        LIMIT 1
    ) UNION (
        SELECT
            str AS str,
            id AS kwsID
        FROM KeywordStrings
        WHERE str >= s
        ORDER BY str ASC
        LIMIT numOffset, maxNum
    )
    ORDER BY str ASC;
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
    IF (entityType = "") THEN
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
