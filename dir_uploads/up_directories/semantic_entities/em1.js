
// First entity module (EM) with some initial entities, not least the
// 'Entities' class and the 'Classes' class which are fundamental to the
// whole semantic system.




// Class of all things, all "entities." Entities are defined/represented by
// objects of the kind you see below, namely with capitalized property names,
// and always with a "Class" property. We will tend to refer to these defining
// properties of entities as their "attributes."
// It should be noted that all these "attributes" of an entity are not set in
// stone. Any attribute can be overridden by what we can call "scored
// properties," which are properties determined by the users when they score
// the "relations" that are introduced below. So all the attributes that you
// see below are in principle only the "initial" or "default" ones, possibly.
// And their job is thus only to specify what thing or concept is being
// referred to, as well as possibly to declare some metadata properties that
// the app might use as default options.
// Entities will often refer to a real-world things or concepts, or a things or
// concepts relating to this semantic and/or user-programmable system. But they
// can also be self-contained objects that just refers to themselves. Such
// objects will often carry "methods" as part of their attributes, the names for
// which we will tend to use lower camel case (as in e.g. "fetchScoreData"),
// making these entities able to be treated similarly to objects from an OOP
// language.
// The values of the attributes can be anything such as strings and numbers,
// and methods as just mentioned, and can also paths leading to such data. And
// most importantly, they can be so-called "identifiers" of other entities.
// Such identifiers can either be paths to the entity's definition object (as
// see e.g. for all "Class" attributes defined below), or they can be strings
// of the form '#<entID>' or just '<entID>', where entID (entity ID) is a
// hexadecimal string that is assigned to the entity when uploading it via the
// ./entities.sm.js server module. They can also be of the form '@<userID>',
// where userID is the hexadecimal string that the backend uses in order to
// identify users.
// The kind of values to expect for each attributes and their interpretations
// should be defined by the class's description. But unless otherwise specified,
// it should be the convention to escape '#' and '@' characters in string-
// valued attributes, as well as leading '/'s, using backslashes for doing so,
// unless these are to be interpreted as part of an entity identifier and/or a
// path.
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
// the given user and the ID or the UP node that created the user profile.
export const users = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Users",
  "Superclass": abs("./em1.js;get/entities"),
  "Constructor": User,
  "Description": abs("./em1_aux1.js;get/usersDesc"),
};

export const User = (userID, upNodeID) => ({
  "Class": abs("./em1.js;get/users"),
  "User ID": userID,
  "UP node ID": upNodeID,
});


// Class of all texts. Texts can be defined in many ways, so while this class
// of all text introduces the "Common attributes" of "Path" and "URL" to locate
// the text's content, it is expected that users might also define subclasses
// of this 'Texts' class and give them different "Common attributes," such that
// texts can be defined in other ways.
// Note that the "Path" attribute here is meant to be an internal path/route
// to the text (which can either be a JS string or a JSXElement instance), and
// the "URL" attribute is meant to be used if the text has a URL on the WWW.
// At least one of those two attributes is meant to be defined.
export const texts = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Texts",
  "Superclass": abs("./em1.js;get/entities"),
  "Common attributes": ["Title", "Path", "URL"],
  "Description": abs("./em1_aux1.js;get/textsDesc"),
};



// A "quality" in this system refers to a property of an entity that can be
// described by floating-point number within some range. And an important
// subclass of "qualities" is the class of what we will refer to as "semantic
// qualities," which are qualities that are described by a label and a
// description, which users are supposed to score directly. One can think of
// the well-known "tags" that you see in many places on the web, but where each
// tag has a floating-point scale that you rate them on. For example, a movie
// might be rated with respect to a quality of "scary," and the rating scale
// of the quality would then (normally) represents how scary the movie is. And
// that is just one example, qualities can be anything.
// And outside of "semantic qualities," we also have 'derived qualities' which
// are algorithmically computed from other qualities and/or other data in the
// database.
export const qualities = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Qualities",
  "Superclass": abs("./em1.js;get/entities"),
  "Description": abs("./em1_aux1.js;get/qualitiesDesc"),
};


// This is the important subclass of so-called "semantic qualities."  The users
// are meant to score these with respect to given subjects according to their
// opinions, and these scores are also meant to be aggregated into e.g. mean or
// median estimators over larger user groups. Such user groups do not need to
// include all users of the system, but can also be a limited list of users.
// (And the users in the group might even have different weights, meaning that
// the scores of some might count for more than others.)
// Each semantic quality has a domain, which is a class to which the subjects
// are supposed to belong, and a metric, which defines the semantics of the
// range of the floating-point score. And they can also have a (default) "area
// of concern," which, as described below, helps the app choose the right user
// group to query for score aggregates for the given quality.
export const semanticQualities = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Semantic qualities",
  "Superclass": abs("./em1.js;get/qualities"),
  "Common attributes": [
    "Label", "Domain", "Metric", "Area of concern", "Description",
  ],
  "Description": abs("./em1_aux1.js;get/semanticQualitiesDesc"),
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


// The so-called "areas of concern" are used for determining with user group
// to query when looking for the scores of a given quality. Different users
// might trust different user groups to deliver the best scores. But rather
// than voting on the best user group to query for every single quality, we can
// instead group qualities into "areas of concern," as we might call it, such
// as e.g. "Taste in fictional media," "Science," "UI," "URL safety,"
// "Sensitive user safety" etc., and then the users only need to pick one user
// group to use for each of these areas. Note that areas can change in time,
// such as "Science" here being split into several subareas, and users might
// not agree completely on which areas to use, and that's completely fine. Like
// all attributes of entities, the "Area of concern" attribute of quality
// entities are only guiding; it is by no means set in stone.  
export const areasOfConcern = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Areas of concern",
  "Superclass": abs("./em1.js;get/entities"),
  "Common attributes": ["Name", "Description"],
  "Description": abs("./em1_aux1.js;get/areasOfConcernDesc"),
};


// Areas of concern can furthermore also be used as a way to achieve almost
// perfect user anonymity while at the same time being able to assign trust to
// anonymous users. Here's how that can work. The system is made open towards
// creating several user profiles with the same e-mail address, and this is so
// for a reason. We want users to create several profiles, namely for different
// areas of concern. A user can then have a sort of "main" profile, either a
// public one, which can be confirmed as a real person via a friend-of-a-friend
// (FoaF) network (similar to Facebook and what have you, and Facebook might
// potentially be used for this FoaF network to some extend), or the "main" user
// profile can also be a private one that is nonetheless able to garner trust
// among the user network. But regardless of whether your "main" profile is
// public or not, you don't necessarily want it connected to all your other
// opinions about everything. Be it political opinions or opinions about
// sensitive things like pornography and sexual matter. Or you might want a
// private account to share and discuss secrets and/or private experiences with
// others. Or you even just might not want, say, your boss and your coworkers,
// and everyone else that you know, to know all your tastes in movies, free-time
// activities, and all other things.
// But if you just create a new anonymous profile for this, how will people
// know that you are not just a bot (a concern that is more relevant than ever
// with AI bots taking over the web)? Well, they can if you connect the new
// profile privately (using private data tables) to your main profile, with
// respect to a given user group, such that others only get to see that the new
// profile is connected to *some* profile that is part of the given user group,
// and what approximate weight that profile has in that user group (they can't
// know the precise wight as that might out the exact profile).
// This can indeed be achieved, but then comes the question: How to prevent
// users from just creating a horde of other profiles in order to boost their
// opinions in the network? By making sure that the new profiles can't score
// the same qualities as the "main"  profile or any of the other profiles that
// is connected to it. And that is what the 'areas of concern' is used for in
// this regard. Each profile needs to select a set of areas of concern,
// possibly just one, when it connects to other profiles this way. And the
// areas of concern will be publicly known for each profile such that the user
// community can make sure that the profile does not score something that is
// unrelated to those areas, or just not aggregate the scores if they are.
// And when the user profiles connect with a "main" profile, you make sure to
// store the selected areas of concern, and make sure they don't overlap with
// any of the ones that are already chosen, by the "main" profile or by others
// that has previously been connected to it.
// And how to decide if two areas overlap? Simply by querying a 'Overlaps with'
// relation (with some appropriate user group to decide this), and checking
// that the score here is below a certain threshold (and with a high enough
// combined weight).
// And there we go, this is how users can get near perfect anonymity, while
// still making it possible for the user network to prevent bots posing as
// humans to a very great extend, and from users duplicating their scores.
// (And the UP node will of course also sign contracts not to read private data
// such as the data stored for connecting the profiles, now and in the future,
// and even if they are somehow not able to sign such contracts, there are
// still encryption schemes that you can implement to make sure that they also
// can't read the data, namely where the user holds an encryption key to the
// data.)




// Relevancy qualities is how we truly define whether or not a given entity
// belongs to a given class. Entities does thus not just belong the class
// that is used for their definition (i.e. the "Class" attribute), as well as
// the superclasses of that class, of course, but can belong to any number of
// classes. Relevancy qualities are defined either by a single "target class,"
// or by a relation and an object, in which case the target class is assumed to
// be the "relational class" (see below) formed from that pair. (When defining
// a relevancy quality for a relational class, always use the two-argument
// version of the constructor, rather than using the classID directly.)
export const relevancyQualities = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Relevancy qualities",
  "Superclass": abs("./em1.js;get/qualities"),
  "Constructor": RelevancyQuality,
  "Description": abs("./em1_aux1.js;get/relevancyQualitiesDesc"),
};

export const RelevancyQuality = (classOrRelID, objID = undefined) => ({
  "Class": abs("./em1.js;get/relevancyQualities"),
  "Target class": objID === undefined ? "#" + classOrRelID : undefined,
  "Relation": objID === undefined ?  undefined : "#" + classOrRelID,
  "Relational object": objID === undefined ?  undefined : "#" + objID,
  "Label": "Relevant for " + (objID === undefined ?
    "#" + classOrRelID :
    "#" + objID + "→" + "#" + classOrRelID
  ),
  "Domain": abs("./em1.js;get/entities"),
  "Default metric": abs("./em1.js;get/predicateMetric"),
});



// "Relations" in this system are functions that take a sentence object (or
// "relational object" as we call it here), and returns a new class, namely a
// "relational class" (see below). One might naturally think that verbs would
// be the preferred choice for describing relations, but here we generally much
// prefer using nouns (including compound ones, of course). This first of all
// allows us to write relational classes compactly as "<Object> → <Relation>"
// (similarly to how properties are accessed in a program language (only using
// '→' instead of '.' when comparing to JS)), and it also gives us the titles
// for free if the relation is used for, say, a tab or a section header. For
// instance, if the relation in question is "Parents" (with the object class
// being e.g. a "Persons" class), we can use the title, "Parents," directly for
// e.g. section headers, tab titles, table labels, etc.
// (And note that like all entity attributes, the labels of "<Object> →
// <Relation>" that we use here can always be overridden by the app, and be
// made to depend on user preferences.)
export const relations = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Relations",
  "Superclass": abs("./em1.js;get/entities"),
  "Common attributes": [
    "Title", "Object class", "Subject class", "Area of concern",
    "Description"
  ],
  "Description": abs("./em1_aux1.js;get/relationsDesc"),
};

// Relational classes are defined solely by a relation and a relational object.
export const relationalClasses = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Relational classes",
  "Superclass": abs("./em1.js;get/classes"),
  "Constructor": RelationalClass,
  "Description": abs("./em1_aux1.js;get/relationalClassesDesc"),
};

export const RelationalClass = (relID, objID) => ({
  "Class": abs("./em1.js;get/classes"),
  "Relation": "#" + relID,
  "Relational object": "#" + objID,
  "Name": "#" + objID + "→" + "#" + relID,
  "Superclass": abs("./em1.js;get/relationalClasses"),
});


// Quality variables refers to the floating-point number scales that are scored
// by the users, and/or aggregated algorithmically.
export const qualityVariables = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Quality variables",
  "Superclass": abs("./em1.js;get/entities"),
  "Constructor": QualityVariable,
  "Description": abs("./em1_aux1.js;get/qualityVariablesDesc"),
};

export const QualityVariable = (qualID, subjID) => ({
  "Class": abs("./em1.js;get/qualityVariables"),
  "Quality": "#" + qualID,
  "Subject": "#" + subjID,
  "Label": "#" + subjID + "⋲" + "#" + qualID,
});




// Derived qualities are the algorithmically defined qualities that is the
// compliment of the semantic qualities. For the latter, the scores are decided
// by humans, and for the former, the scored are decided by algorithms. For
// this 'Derived qualities' class, the "Common attributes" that you see can be
// used to define one kind of derived quality, but note that users are free to
// add subclasses of this class with completely different "Common attributes,"
// and with different implementations for how the qualities are computed.
// Note that 'derived qualities' differs from 'scored lists' as seen below in
// the fact that derived qualities still leaves room for the scores to depend on
// the user accessing them, in particular by leaving it open which user groups
// are queried and how their scores are aggregated, as opposed to the scored
// lists where the scores are user-independent.
export const derivedQualities = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Scored lists",
  "Superclass": abs("./em1.js;get/qualities"),
  "Common attributes": [
    "Dependencies", // An array of quality identifiers.
    "getScoreData", // A method that receives an array of "score data" from
    // each dependency quality and returns a set of score data. "Score data"
    // here refers to a [score, weight, auxData?] array, where the score is
    // the (possibly aggregated score), the weight is generally a measure of
    // how many (trusted) users has scored the quality (summing their weights
    // in the given user group), and auxData, if defined, is a plain object of
    // additional data. (Note that method attributes like this are not
    // capitalized.)
  ],
  "Description": abs("./em1_aux1.js;get/derivedQualitiesDesc"),
};


// Scored lists are similar to qualities in that they each associate a set of
// subjects to a score for that subject, but while the list for the qualities
// might depend on the user viewing them, as different users might choose
// different user groups to query, and/or different algorithms to aggregate the
// scores, the scored lists are supposed to be objectively defined and thus
// independent of the user viewing or accessing the list.
// The lists that the app shows the users whenever they e.g. browse a quality
// are also referred to as 'scored lists,' but these are generally just
// 'anonymous' ones. Scored lists can also be defined via a 'scored list'
// entity of the following class. And while the anonymous scored lists might
// only exist for a moment, the entity-defined scored lists are supposed to be
// stored in a table on its own, which is why these entities do not only have
// methods to fetch data from the list, but also methods to update it.
export const scoredLists = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Scored lists",
  "Superclass": abs("./em1.js;get/entities"),
  "Common attributes": [
    // fetchScoreData(subjIdent) fetches the score data for the given "subject,"
    // i.e. the given entity on the list. "Score data" refers here to a [score,
    // weight, auxData?] array, as described above. Note that an "identifier"
    // (shortened to "ident") here can be either an absolute entity path, a
    // user ID prefixed by "@", an entity ID prefixed with "#", or can also
    // just be the entity ID without the leading "#".
    "fetchScoreData",

    // fetchList({lo, hi, maxNum, offset, isAscending}) fetches a section of
    // the scored list as a 2-dimensional array. The arguments 'lo', 'hi',
    // 'maxNum', 'offset', and 'isAscending' specifies which section of the
    // list should be returned. (And and all these arguments should have default
    // values and thus be optional.) Each row of the returned 2-dimensional
    // array should be of the form [entID, score, weight?, auxData?], but note
    // that auxData in particular does not need to be included here even if it
    // exists (and can also just contain only a subset of the full auxData
    // objects properties). (You generally don't want to include any data that
    // is stored in the "payload" column of the BTT table.)
    "fetchList",

    // getLength() (optional) returns the current length of the list.
    "getLength",

    // updateScore(subjID) (optional) updates the score for a given subject on
    // the list.
    "updateScore",

    // updateList() (optional) updates the whole list.
    "updateList",

    // Documentation describing the scored list is generated.
    "Documentation",
  ],
  "Description": abs("./em1_aux1.js;get/scoredListsDesc"),
};



// User groups are defined from just a single scored list, namely a list of
// user entities, where the scores use a positive dimensionless metric
// representing the so-called weight of each user in the user group. These
// wights are used when aggregating scores from the user group: If all weights
// are equal, each user score counts the same, but otherwise some users' scores
// might count for more than others. 
export const userGroups = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "User groups",
  "Superclass": abs("./em1.js;get/entities"),
  "Common attributes": [
    "Name", "User list", "Description"
  ],
  "Description": abs("./em1_aux1.js;get/userGroupsDesc"),
};



// Score handlers are extensive objects with methods that handle almost
// everything about the scores of both the semantic and the derived qualities:
// How they are fetched, where they are stored, how they are updated, how they
// are aggregated (e.g. whether to use the mean or the median for a given
// quality), which "areas of concern" (AoC) are used for which quality and what
// user group is chosen for each AoC.
// Since score handlers are able to adjust their methods to the specific user's
// own preferences, it is likely that the user base will gravitate towards
// using the same (advanced) score handler in the end. But the development of a
// better and better score handler will require experimentation, where some
// (super)users will develop and/or try new versions, which is why we need for
// users to be able to choose between more than just one score handler for the
// app, hence the need for this 'Score handlers' class.
export const scoreHandlers = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Score handlers",
  "Superclass": abs("./em1.js;get/entities"),
  "Common attributes": [
    // fetchScoreData(qualIdent, subjIdent, options) is similar to
    // fetchScoreData() of the scored lists, except that you need to specify
    // the quality that the scores concern.
    // Furthermore, the 'options' argument can contain auxiliary parameters
    // such as a 'userGroup' option, which overrides whatever user group the
    // score handler would choose by default for the quality, and for the given
    // user.
    // Another important option is a 'query' option, with the (optional) values
    // of "user", "user-first", and "group". If "user" is chosen, the score
    // handler should only return the user's own score (possibly undefined).
    // If "user-first" is chosen, the score handler will query for both the
    // user's own score and that of the appropriate user group, and return the
    // former only if it is defined, and else return the latter. And a value of
    // "group" means that only the user group is queried.  
    "fetchScoreData",

    // fetchList(qualIdent, options) is similar to the fetchList() method of
    // scored lists, but where the 'lo', 'hi', 'maxNum', 'offset', and
    // 'isAscending' parameters are part of the 'options' object.
    // There's also an important 'minWeight' option, which defines the minimum
    // weight that a score needs to have in order to be shown in the list. One
    // might think that 0 would be the natural default value for this, but it
    // will actually probably be better for a score handler to choose a
    // positive default value, such as e.g. 10. This will mean that the app can
    // show weight-filtered lists as the default option (and rely on the score
    // handler to choose default weight threshold), making the search result
    // more reliable than if just showing all the elements. And if a user is
    // interested to see of their are other candidates for list entries that
    // just haven't got a sufficient amount of scores yet, they can then adjust
    // the minWeight option manually (via some input field somewhere) to see
    // more of the candidates for the list.  
    "fetchList",

    // updateScoreForUser(qualIdent, subjIdent, userID, options): When a user
    // submits a score for a quality, this method should be called.
    "updateScoreForUser",

    // updateScoreForGroup(qualIdent, subjIdent, options): When viewing a score
    // from a user group, the app might afford a button to "refresh"/"update"
    // the score for the given subject. If the user clicks that button, this
    // methods should then be called.
    "updateScoreForGroup",

    // updateList(qualIdent, options) is similar to updateScoreForGroup() but
    // for a whole list of subjects at once. When viewing a scored list, the
    // app might thus provide also afford a "refresh"/"update" button to click.
    // Note that since updating a whole list might be expensive, the score
    // handler might use a SMF for such updates, that rather than running the
    // whole update each time, instead just deposits some gas at the server
    // module (see the filetypes/text_files.js module in the src folder for the
    // 'query' dev lib), and then only run the update once enough gas has been
    // deposited. (And updateScoreForGroup() can also do the same for that
    // matter.)
    "updateList",

    // fetchDefaultOptions(qualIdent) returns a promise to the default options
    // chosen by the score handler for a given quality. This allows the app to
    // inform the user of these choices should they inspect the score in more
    // detail. Thus, if the user open a menu to adjust the search options, e.g.
    // when viewing a list, the appropriate initial values of the various input
    // fields can be gotten from this method.
    "fetchDefaultOptions",

    // Documentation describing the given score handler works and its usage.
    "Documentation",
  ],
  "Description": abs("./em1_aux1.js;get/scoreHandlersDesc"),
};





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
    [ -8, -6,  "very much not"],
    [ -6, -4,  "truly not"],
    [ -4, -2,  "somewhat not"],
    [ -2,  0,  "slightly not"],
    [  0,  2,  "slightly"],
    [  2,  4,  "somewhat"],
    [  4,  6,  "truly"],
    [  6,  8,  "very much"],
    [  8, 10,  "extremely"],
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



// This "Trusted" quality is meant as a standard way to obtain the weighted
// user lists that are used for user groups, namely by having a "moderator
// group" that scores other users, and themselves, with respect to this
// "Trusted" quality. The quality uses the predicate metric, with the range
// from -10 to 10, and how this range is converted to a (non-negative) weight
// is up to who defines the user list. 
// Now, as things progress, it is likely that users will create more specific
// sub- qualities of this one, which will define the sought-for qualities of
// the new user group in more detail. (For instance, one might make sub-
// qualities of "Trusted w.r.t. URL safety" or "Trusted w.r.t. (the field of)
// Chemistry", etc.) But initially, this more vague "Trusted" quality will
// probably do.
export const trusted = {
  "Class": abs("./em1.js;get/qualities"),
  "Label": "Trusted",
  "Domain": abs("./em1.js;get/users"),
  "Default metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux1.js;get/trustedDesc"),
};


// Some times, it's better to leave the description out of the qualities,
// especially for predicate qualities, as it is better to just let users
// interpret the qualities in their own ways, just based on the label of the
// quality. These will by the way often be (compound) adjectives or
// (compound) static verbs, but these can also be abbreviated (and often
// should) when the meaning can be implicitly understood, such as using label
// of 'spoilers' rather than 'has spoilers'. Here, we will by the way follow a
// convention of not capitalizing the labels of all description-less qualities,
// such that the users will have a way to know if a description is included or
// not, without having to look for it. 
export const simplePredicates = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Simple predicates",
  "Superclass": abs("./em1.js;get/qualities"),
  "Constructor": SimplePredicate,
  "Description": abs("./em1_aux1.js;get/simplePredicatesDesc"),
};

export const SimplePredicate = (label) => ({
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