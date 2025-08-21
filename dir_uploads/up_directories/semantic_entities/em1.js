
// First entity module (EM) with some initial entities, not least the
// 'Entities' class and the 'Classes' class which are fundamental to the
// whole semantic system.


// Class of all things, all "entities."
export const entities = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "All entities",
  "Superclass": undefined,
  "Common attributes": [
    "Name", "Title", "Label", "Description"
  ],
  "Description": abs("./em1_aux1.js;get/entitiesDesc"),
};

// Class of all classes.
export const classes = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Classes",
  "Superclass": abs("./em1.js;get/entities"),
  "Common attributes": [
    "Name", "Superclass", "Common attributes", "Constructor", "Description"
  ],
  "Description": abs("./em1_aux1.js;get/classesDesc"),
};

// Class of all users. These are all defined solely by the userID assigned to
// the given user and the ID UP node that created the user profile.
export const users = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Users",
  "Superclass": abs("./em1.js;get/entities"),
  "Constructor": getUser,
  "Description": abs("./em1_aux1.js;get/usersDesc"),
};

export const getUser = (userID, upNodeID) => ({
  "Class": abs("./em1.js;get/users"),
  "User ID": userID,
  "UP node ID": upNodeID,
});

// Class of all texts. Texts can be defined in many ways, and the don't have
// to be "referential entities," i.e. entities represented by objects with a
// "Class" attribute, etc. They can also just be JS strings or JSX elements,
// and in fact, this ought be the norm for the texts created by users of this
// system, which is why the "Common attributes" below is meant for when the
// texts in an external one.
export const texts = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Texts",
  "Superclass": abs("./em1.js;get/entities"),
  "Common attributes": ["Title", "URL"],
  "Description": abs("./em1_aux1.js;get/textsDesc"),
};



// A "quality" in this system is a function that takes a subject and returns
// a floating-point parameter that describes something about the subject. Each
// quality also has a domain, which is a class to which the subjects are
// supposed to belong. The users are meant to "score" qualities according to
// their opinions, and so-called "Aggregators" (see below) are then meant to
// aggregate these scores.
export const qualities = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Qualities",
  "Superclass": abs("./em1.js;get/entities"),
  "Common attributes": [
    "Label", "Domain", "Default metric", "Description"
  ],
  "Description": abs("./em1_aux1.js;get/qualitiesDesc"),
};

// A metric is used to describe the semantics of the range of the floating-
// point parameters returned by qualities.
export const metrics = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Metrics",
  "Superclass": abs("./em1.js;get/entities"),
  "Common attributes": [
    "Name", "Unit", "Prepend unit", "Lower limit", "Upper limit",
    "Interval labels", "Description"
  ],
  "Description": abs("./em1_aux1.js;get/metricsDesc"),
};

// Relevancy qualities is how we truly define whether or not a given entity
// belongs to a given class. Entities does thus not just belong the class
// that is used for their definition (i.e. the "Class" attribute), as well as
// the superclasses of that class, of course, but can belong to any number of
// classes. Relevancy qualities are defined solely by a single "target class."
export const relevancyQualities = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Relevancy qualities",
  "Superclass": abs("./em1.js;get/qualities"),
  "Constructor": getRelevancyQuality,
  "Description": abs("./em1_aux1.js;get/relevancyQualitiesDesc"),
};

export const getRelevancyQuality = (classID) => ({
  "Class": abs("./em1.js;get/relevancyQualities"),
  "Target class": "e#" + classID,
  "Label": "Relevant for " + "e#" + classID,
  "Domain": abs("./em1.js;get/entities"),
  "Default metric": abs("./em1.js;get/predicateMetric"),
});



// "Relations" in this system are functions that take a sentence object (or
// "relational object" as we call it here), and returns a new class, namely a
// "relational class" (see below). One might naturally think the verbs would
// be the preferred choice for describing relations, but here we generally much
// prefer using nouns (including compound ones, of course), as this first of
// all allows us to write relational classes compactly as
// "<Object> → <Relation>" (similarly to how properties are accessed in a
// program language (only using '→' instead of '.' when comparing to JS)), and
// it also gives us the titles for free if the relation is used for, say, a
// tab or a section header. For instance, if the relation in question is
// "Parents" (with the object class being e.g. a "Persons" class), we can use
// the title, "Parents," directly for e.g. section headers, tab titles, table
// labels, etc.
// Note also that while "<Object> → <Relation>" might serve as a useful name
// format for these classes, the "Name"/"Title"/"Label" attributes of entities
// can always be overridden by the app that displays them, and can also
// potentially even depend on user preferences. And this goes not just for
// formats like this, but the words themselves. (For instance, users might
// potentially be able to choose a different language.)
export const relations = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Relations",
  "Superclass": abs("./em1.js;get/entities"),
  "Common attributes": [
    "Title", "Object class", "Subject class", "Description"
  ],
  "Description": abs("./em1_aux1.js;get/relationsDesc"),
};

// Relational classes are defined solely by a relation and a relational object.
export const relationalClasses = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Relational classes",
  "Superclass": abs("./em1.js;get/classes"),
  "Constructor": getRelationalClass,
  "Description": abs("./em1_aux1.js;get/relationalClassesDesc"),
};

export const getRelationalClass = (relID, objID) => ({
  "Class": abs("./em1.js;get/classes"),
  "Relation": "e#" + relID,
  "Relational object": "e#" + objID,
  "Name": "e#" + objID + "→" + "e#" + relID,
  "Superclass": abs("./em1.js;get/relationalClasses"),
});


// Semantic parameters refers to the floating-point number scales that are the
// outputs of a quality when paired with a subject. Note that we take "semantic
// parameter" to refer to the *scale* that can be scored by users or
// aggregators, and we take "score" to mean the specific values that are given
// to those scales.
export const semanticParameters = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Semantic parameters",
  "Superclass": abs("./em1.js;get/entities"),
  "Constructor": getSemanticParameter,
  "Description": abs("./em1_aux1.js;get/semanticParametersDesc"),
};

export const getSemanticParameter = (subjID, qualID) => ({
  "Class": abs("./em1.js;get/semanticParameters"),
  "Subject": "e#" + subjID,
  "Quality": "e#" + qualID,
  "Label": "e#" + subjID + "⋲" + "e#" + qualID,
});



// Each quality results in an ordered list (at least partially so) of subjects,
// namely ordered by the scores. However, it takes someone to provide these
// scores, and that is the so-called Aggregator. Note that an aggregator is
// free to aggregate the scores from just a single user, which is how one can
// also construct semantic lists directly from just a single user's scores.
export const semanticLists = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Semantic lists",
  "Superclass": abs("./em1.js;get/entities"),
  "Constructor": getSemanticList,
  "Description": abs("./em1_aux1.js;get/semanticListsDesc"),
};

export const getSemanticList = (qualID, aggregatorID) => ({
  "Class": abs("./em1.js;get/semanticLists"),
  "Quality": "e#" + qualID,
  "Aggregator": "e#" + aggregatorID,
  "Label": "e#" + qualID + "< e#" + aggregatorID + ">",
});


// An aggregator is defined by, first of all a name, and then an aggregator
// object, which might be an instance of the Aggregator JS class below, or
// should at least follow the same API to some extend.
export const aggregators = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Aggregators",
  "Constructor": getAggregator,
  "Superclass": abs("./em1.js;get/entities"),
  "Common attributes": ["Name", "Aggregator object", "Description"],
  "Description": abs("./em1_aux1.js;get/aggregatorsDesc"),
};

export class Aggregator {

  getScore(qualIDOrPath, subjIDOrPath) {}

  getList(qualIDOrPath, isAscending, maxNum, offset, hi, lo) {}

  updateScore(qualIDOrPath, subjIDOrPath) {}

  updateList(qualIDOrPath) {}
}



// Some useful metrics for qualities.

export const percentageMetric = {
  "Class": abs("./em1.js;get/metrics"),
  "Name": "Percentage metric",
  "Unit": "%",
  "Lower limit": 0,
  "Upper limit": 100,
  "Description": abs("./em1_aux1.js;get/percentageMetricsDesc"),
};

export const predicateMetric = {
  "Class": abs("./em1.js;get/metrics"),
  "Name": "Predicate metric",
  "Lower limit": -10,
  "Upper limit": 10,
  "Interval labels": [
    [-10, -8,  "extremely not"],
    [-8,  -6,  "very much not"],
    [-6,  -4,  "truly not"],
    [-4,  -2,  "somewhat not"],
    [-2,   0,  "slightly not"],
    [ 0,   2,  "slightly"],
    [ 2,   4,  "somewhat"],
    [ 4,   6,  "truly"],
    [ 6,   8,  "very much"],
    [ 8,  10,  "extremely"],
  ],
  "Description": abs("./em1_aux1.js;get/predicateMetricsDesc"),
};

export const dimensionlessMetric = {
  "Class": abs("./em1.js;get/metrics"),
  "Name": "Dimensionless metric",
  "Description": abs("./em1_aux1.js;get/dimensionlessDesc"),
};

export const positiveDimensionlessMetric = {
  "Class": abs("./em1.js;get/metrics"),
  "Name": "Positive dimensionless metric",
  "Lower limit": 0,
  "Description": abs("./em1_aux1.js;get/positiveDimensionlessMetricDesc"),
};

export const priceInUSDMetric = {
  "Class": abs("./em1.js;get/metrics"),
  "Name": "Prince metric (USD)",
  "Unit": "$",
  "Prepend unit": true,
  "Description": abs("./em1_aux1.js;get/priceInUSDMetricDesc"),
};

export const timeInYearsMetric = {
  "Class": abs("./em1.js;get/metrics"),
  "Name": "Time metric (years)",
  "Unit": "yr",
  "Lower limit": 0,
  "Description": abs("./em1_aux1.js;get/timeInYearsMetricDesc"),
};
export const timeInDaysMetric = {
  "Class": abs("./em1.js;get/metrics"),
  "Name": "Time metric (days)",
  "Unit": "days",
  "Lower limit": 0,
  "Description": abs("./em1_aux1.js;get/timeInDaysMetricDesc"),
};
export const timeInSecondsMetric = {
  "Class": abs("./em1.js;get/metrics"),
  "Name": "Time metric (seconds)",
  "Unit": "s",
  "Lower limit": 0,
  "Description": abs("./em1_aux1.js;get/timeInSecondsMetricDesc"),
};


// Some useful qualities.

export const probability = {
  "Class": abs("./em1.js;get/qualities"),
  "Label": "Probability",
  "Domain": abs("./em1.js;get/texts"),
  "Default metric": abs("./em1.js;get/percentageMetric"),
  "Description": abs("./em1_aux1.js;get/probabilityDesc"),
};

// "Truthfulness" is here taken as a measure, not of the probability that the
// whole texts, as a combined statement, is true, but instead more of a sort of 
// average of probability of each individual statement made by the text, but
// where more important statements might get more weight in this average. How
// to divide the text up into individual statements and how to weight each one
// is up to the users to decide. In short, this quality is meant to give a
// measure of how much of this combined text is truthful and reliable.
export const truthfulness = {
  "Class": abs("./em1.js;get/qualities"),
  "Label": "Truthfulness",
  "Domain": abs("./em1.js;get/texts"),
  "Default metric": abs("./em1.js;get/percentageMetric"),
  "Description": abs("./em1_aux1.js;get/truthfulnessDesc"),
};

// Agreement is not an objective quality: Qualities can depend on the user
// scoring them. This quality is a measure of how much the user agrees with the
// statement, and/or the sentiment of the statement (and the "or" here is
// actually important, as some statements are made hyperbolic).
export const agreement = {
  "Class": abs("./em1.js;get/qualities"),
  "Label": "Agreement",
  "Domain": abs("./em1.js;get/texts"),
  "Default metric": abs("./em1.js;get/percentageMetric"),
  "Description": abs("./em1_aux1.js;get/agreementDesc"),
};



// Some times, it's better to leave the description out of the qualities,
// especially for predicate qualities, as it is better to just let users
// interpret the qualities in their own ways, just based on the label of the
// quality. These will by the way often be (compound) adjectives or
// (compound) static verbs, but these can also be abbreviated (and often
// should) when the meaning can be implicitly understood, such as using label
// of 'spoilers' rather than 'has spoilers'. Here, we will by the way follow a
// convention of not capitalizing the labels of qualities. 
export const simplePredicates = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Simple predicates",
  "Superclass": abs("./em1.js;get/qualities"),
  "Constructor": getSimplePredicate,
  "Description": abs("./em1_aux1.js;get/simplePredicatesDesc"),
};

export const getSimplePredicateQuality = (label) => ({
  "Class": abs("./em1.js;get/simplePredicates"),
  "Label": label,
  "Default metric": abs("./em1.js;get/predicateMetric"),
});

// Some useful simple predicates are 'good', 'funny', 'witty', 'spoilers',
// 'good acting', 'inspiring' and so on. But as all "derived entities" ( i.e.
// ones constructed from a class's "Constructor"), these should not be defined
// in the entity modules like this themselves, but are purely defined by
// posting to ./entities.sm.js. 



export const price = {
  "Class": abs("./em1.js;get/qualities"),
  "Label": "price",
  // The class of valuable things is so large and varied that we might as well
  // make All entities the domain:
  "Domain": abs("./em1.js;get/entities"),
  "Default metric": abs("./em1.js;get/priceInUSDMetric"),
  // No description required for this quality.
};

export const durability = {
  "Class": abs("./em1.js;get/qualities"),
  "Label": "durability",
  // The class is too wide and varied to try to use a more narrow domain.
  "Domain": abs("./em1.js;get/entities"),
  "Default metric": abs("./em1.js;get/timeInYearsMetric"),
  // No description required for this quality.
};






// Some useful relations.

// The useful subclasses when browsing a class and wanting to look for one or
// more subcategories of it (or to see which subcategories there are).
export const subclasses = {
  "Class": abs("./em1.js;get/relations"),
  "Title": "Subclasses",
  "Object class": abs("./em1.js;get/classes"),
  "Subject class": abs("./em1.js;get/classes"),
  "Description": abs("./em1_aux1.js;get/subclassesDesc"),
};

// The relevant relations of a given entity, i.e. all the relations (obviously
// not counting this one), that are relevant to have as tabs when viewing the
// entity's page, and/or the relevant section titles you would want to see in
// an information article about the entity, and/or relevant labels to see in an
// information table about the entity.
export const relevantRelations = {
  "Class": abs("./em1.js;get/relations"),
  "Title": "Relations",
  "Object class": abs("./em1.js;get/entities"),
  "Subject class": abs("./em1.js;get/relations"),
  "Description": abs("./em1_aux1.js;get/relevantRelationsDesc"),
};

// Same as the above, but where the object of the relation is not the entity
// itself but its class. This is very useful as it allows you to define useful
// relations for a whole class at once.
export const relationsForMembers = {
  "Class": abs("./em1.js;get/relations"),
  "Title": "Relations for members",
  "Object class": abs("./em1.js;get/classes"),
  "Subject class": abs("./em1.js;get/relations"),
  "Description": abs("./em1_aux1.js;get/relationsForMembersDesc"),
};

// This class is useful primarily if you want to have a tab menu where
// selecting a tab (based on a given relation) will spawn "sub-tabs" of that
// tab (which are then "sub-relations" of that relation).
export const subRelations = {
  "Class": abs("./em1.js;get/relations"),
  "Title": "Sub-relations",
  "Object class": abs("./em1.js;get/relations"),
  "Subject class": abs("./em1.js;get/relations"),
  "Description": abs("./em1_aux1.js;get/subRelationsDesc"),
};

// Relevant qualities for users to see, score, and search on for a given entity.
export const relevantQualities = {
  "Class": abs("./em1.js;get/relations"),
  "Title": "Qualities",
  "Object class": abs("./em1.js;get/entities"),
  "Subject class": abs("./em1.js;get/qualities"),
  "Description": abs("./em1_aux1.js;get/relevantQualitiesDesc"),
};

// Relevant qualities for users to see, score, and search on in general for
// entities of a given class.
export const qualitiesForMembers = {
  "Class": abs("./em1.js;get/relations"),
  "Title": "Qualities for members",
  "Object class": abs("./em1.js;get/classes"),
  "Subject class": abs("./em1.js;get/qualities"),
  "Description": abs("./em1_aux1.js;get/qualitiesForMembersDesc"),
};

// "Sub-qualities" are essentially to qualities what subclasses are to classes.
// A good example: 'witty' is a sub-quality of 'funny'. This relation can also
// be used in a multi-layer tab menu where you want quality tabs to spawn sub-
// quality tabs, but they can also be used in any case when a user browses a
// quality and wants to look for more specific qualities. (Come to think of it,
// you can also say the same thing about the "sub-relations" above.)
export const subQualities = {
  "Class": abs("./em1.js;get/relations"),
  "Title": "Sub-qualities",
  "Object class": abs("./em1.js;get/qualities"),
  "Subject class": abs("./em1.js;get/qualities"),
  "Description": abs("./em1_aux1.js;get/subQualitiesDesc"),
};

// TODO: Continue.