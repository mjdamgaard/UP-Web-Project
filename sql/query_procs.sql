
SELECT "Query procedures";

-- DROP PROCEDURE selectInputSet;
-- DROP PROCEDURE selectRating;
-- DROP PROCEDURE selectRecentInputs;
-- DROP PROCEDURE selectRecordedInputs;
-- DROP PROCEDURE selectUserInfo;
-- DROP PROCEDURE selectContext;
-- DROP PROCEDURE selectTerm;
-- DROP PROCEDURE selectContextID;
-- DROP PROCEDURE selectTermID;
-- DROP PROCEDURE selectContextStrings;
-- DROP PROCEDURE selectTermStrings;
-- DROP PROCEDURE selectText;
-- DROP PROCEDURE selectBinary;
-- DROP PROCEDURE selectCreator;
-- DROP PROCEDURE selectCreations;



DELIMITER //
CREATE PROCEDURE selectInputSet (
    IN userID BIGINT UNSIGNED,
    IN predID BIGINT UNSIGNED,
    IN cxtID BIGINT UNSIGNED,
    IN ratingRangeMin SMALLINT,
    IN ratingRangeMax SMALLINT,
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED,
    IN isAscOrder BOOL
)
BEGIN
    SELECT
        rat_val AS ratVal,
        subj_id AS subjID
    FROM SemanticInputs
    WHERE (
        user_id = userID AND
        pred_id = predID AND
        context_id = cxtID AND
        rat_val >= ratingRangeMin AND
        rat_val <= ratingRangeMax
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
    IN cxtID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN predID BIGINT UNSIGNED,
    IN userID BIGINT UNSIGNED
)
BEGIN
    SELECT rat_val AS ratVal
    FROM SemanticInputs
    WHERE (
        user_id = userID AND
        pred_id = predID AND
        context_id = cxtID AND
        subj_id = subjID

    );
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
        context_id AS cxtID,
        rat_val AS ratVal,
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
    IN cxtID BIGINT UNSIGNED,
    IN subjID BIGINT UNSIGNED,
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED
)
BEGIN
    IF (subjID = 0 OR subjID IS NULL) THEN
        SELECT
            subj_id AS subjID,
            changed_at AS changedAt,
            rat_val AS ratVal
        FROM RecordedInputs
        WHERE (
            user_id = userID AND
            pred_id = predID AND
            context_id = cxtID
        )
        ORDER BY subj_id DESC, changed_at DESC
        LIMIT numOffset, maxNum;
    ELSE
        SELECT
            subjID AS subjID,
            changed_at AS changedAt,
            rat_val AS ratVal
        FROM RecordedInputs
        WHERE (
            user_id = userID AND
            pred_id = predID AND
            context_id = cxtID AND
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
        def_str AS str
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
        def_str AS str,
        def_entity_t AS defEntType,
        def_entity_id AS defEntID
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
        def_str = str
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectTermID (
    IN cxtID BIGINT UNSIGNED,
    IN defEntType CHAR(1),
    IN defEntID BIGINT UNSIGNED,
    IN str VARCHAR(255)
)
BEGIN
    IF (defEntID = 0) THEN
        SET defEntID = NULL;
    END IF;

    SELECT id AS termID
    FROM Terms
    WHERE (
        context_id = cxtID AND
        def_entity_t = defEntType AND
        def_entity_id <=> defEntID AND
        def_str = str
    );
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectContextStrings (
    IN parentCxtID BIGINT UNSIGNED,
    IN str VARCHAR(255),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED
)
BEGIN
    SELECT
        def_str AS str,
        id AS cxtID
    FROM SemanticContexts
    WHERE (
        parent_context_id = parentCxtID AND
        def_str >= str
    )
    ORDER BY def_str ASC
    LIMIT numOffset, maxNum;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE selectTermStrings (
    IN cxtID BIGINT UNSIGNED,
    IN defEntType CHAR(1),
    IN defEntID BIGINT UNSIGNED,
    IN str VARCHAR(255),
    IN maxNum INT UNSIGNED,
    IN numOffset INT UNSIGNED
)
BEGIN
    IF (defEntID = 0) THEN
        SET defEntID = NULL;
    END IF;

    SELECT
        def_str AS str,
        id AS termID
    FROM Terms
    WHERE (
        context_id = cxtID AND
        def_entity_t = defEntType AND
        def_entity_id <=> defEntID AND
        def_str >= str
    )
    ORDER BY def_str ASC
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






-- TODO: Remove the Creator procs below, and make Creators a private table..

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
