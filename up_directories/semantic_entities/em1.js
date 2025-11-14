
// First entity module (EM) with some initial entities, not least the
// 'Entities' class and the 'Classes' class which are fundamental to the
// whole semantic system.



// 'Semantic entities,' or just 'entities' for short, are objects with a human-
// understandable meaning attached to them. They most often take the form of
// JS objects whose properties combines to describe the thing in question.
// These objects alway starts with a "Class" property that determines what type
// of thing we are talking about, followed by a "Name" property, which labels
// the entity. For instance, if the entity is the movie, Pulp Fiction, the
// object in question would have a reference to a "Movies" class as its "Class"
// property, followed by a "Name" property of "Pulp Fiction". These two initial
// properties can then potentially be followed by other defining properties if
// needed, and finally there's always the potential to include a "Description"
// property with a reference to text that describes the thing in question, and
// clears up any unintended ambiguities as to what the entity refers to.
//
// We will refer to the JS object that defines an entity as the entity's
// 'definition.' And we will refer to all the defining properties like the ones
// we've seen so far, with capitalized first letters, as the entity's
// 'attributes.' The attributes can either be plain strings, such as
// "Pulp Fiction" in our example above, or they can be absolute paths to other
// entities (see all the attributes below using the built-in abs() function),
// or they can also be functions. If they are functions, the convention is that
// these functions first need to be substituted with their return value (called
// with no arguments) before the entity definition is interpreted. And
// importantly, if the function returns a promise, the result of that promise
// when it result is what should substitute the attribute. Below can be seen
// some examples of how this can be useful, in particular when it comes to
// getting the "Name" attributes for 'Relational qualities' (see below).
//
// After all the function-valued attributes have been substituted, there are
// also one more layer of reinterpretation, if you will, namely since any
// entity reference that appears inside the string needs to be reinterpreted
// as that entity. Thus, when we e.g. say that abs("./em1.js;get/classes") is
// the class of the 'All entities' class entity below, we don't say that the
// string, abs("./em1.js;get/classes"), itself is the class, but rather the
// entity it points to. The syntax for referencing entities in attributes is as
// follows. All attributes containing nothing but an absolute path starting
// with "/" is interpreted as an entity reference. So if you ever want an
// attribute with a leading slash (for whatever weird reason), we might have to
// escape the leading slash with a backslash. Furthermore, all appearances of
// "${<entity key>}", where "$" has not been escaped by a preceding backslash,
// is interpreted as an entity reference. And here, <entity key> can either
// be the entity's path or the entity's ID, which we will talk more about in a
// moment.
// 
// Apart from the 'attributes,' an entity definition might also include what
// we refer to as 'methods,' which function-valued properties with lower camel
// case names (such as in e.g. "fetchScoreData()"). And unlike the 'attributes,'
// the methods are not substituted. The convention of using capital first
// letters for the attributes thus serves more than just aesthetical purposes,
// as it also helps to distinguish 'methods' from 'attributes,' in terms of
// what needs substitution and what doesn't.
//
// With the convention described above, we are able to define entities
// representing anything in the world. However, if you want to talk about
// something like a simple JS string, a JSX element, or a function, it is
// somewhat redundant to wrap that in a whole object, with a "Class" attribute
// and "Name," etc., when the thing at hand really describes itself. And that's
// why entities can also just be what we might refer to as 'value entities,'
// which can any kind of JS value that you want, also including JSX elements,
// and whish thus simply "refers" to themselves. And thus whenever an entity's
// definition is not an object that includes a "Class" attribute, the entity
// should be interpreted as such a self-referring value entity.
//
// And how are entities stored in the back end? Well, all the entities'
// definitions are just stored in whatever .js file that defines (and exports)
// them. And then we have the ./entities.sm.js that is used to give each new
// entity an unique (hexadecimal) ID. These entity IDs are generated from the
// ./entPaths.att table, which then also provides a entID -> entPath index,
// where entID here is the entity's ID and entPath is the absolute path to the
// entities definition (most often using a ";get" casting to extract the
// particular export in question). And whenever a new entity ID is created, we
// generally also store this ID in the entIDs.bt table, giving us a entPath ->
// entID index as well for when you have the path to an entity and want to
// query for its ID.
//
// Lastly, let's discuss the fact that the attributes are of course only a
// subset of all the properties of an entity, of which there generally are
// infinitely many. For instance, a movie might also have an "Editor(s)"
// property, even though "Editor(s)" was not part of the defining attributes.
// Such properties are instead defined via the "Relations" that can be read
// about below. And in fact, such relational properties might even be used to
// overwrite some of the defining properties. This could for instance happen
// if the facts change. For instance, a person or an organization, might
// change their/its, just to give one example. It should thus be noted that the
// attributes are never final. They might change over time. And they can even
// be made to depend on the user viewing them, in fact (since relational
// properties can be user-dependent). This means that we can even do things
// like change the language of the entire entity to a user's preferred one,
// meaning that different users will ultimately be able to see entities in
// their own preferred languages.
//
// That covers the basics of the 'semantic entities,' and in this module below,
// we introduce some of the most important entities that are used in this whole
// "semantic system," as we might call it, starting of course with some of the
// most imported class entities, and in particular the class of all entities,
// as well as the class of all class entities (both of which have themselves as
// part of their members). 



// Class of all things, or of all "entities," as we will call it here.
export const entities = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "All entities",
  "Superclass": undefined,
  "Common attributes": [
    // The "Name" attribute is understood in a very broad sense of the word.
    // It is a string, preferably as brief as possibly, that is used to label
    // the given entity when it is referred to. So in a sense, "Name" here is
    // used synonymously with "Label." 
    "Name",

    // The "Elaboration" is a slightly longer string that can be shown
    // underneath the "Name," either as a kind of subtitle, or as a mouseover
    // text, etc., elaborating on the generally very brief "Name" attribute. 
    "Elaboration",

    // The "Description" is a longer text, typically formatted as a HTML text
    // (namely by utilizing a JSX component), which describes the entity in
    // some more detail, hopefully removing any unintentional ambiguities from
    // it.
    "Description",
  ],
  "Description": abs("./em1_aux.js;get/entitiesDesc"),
};


// Class of all classes. (This class is thus a subclass of the 'All entities'
// class above. Also, the 'All entities' class is a member of this class, and
// so is this class itself.)
export const classes = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Classes",
  "Superclass": abs("./em1.js;get/entities"),
  "Common attributes": [
    "Name",
    "Elaboration",

    // A superclass (i.e. the opposite of "subclass") that helps define the
    // class.
    "Superclass",

    // An array of names of the potential attributes and methods you might
    // expect the members of this class to be defined by. (This list is only
    // guiding). Note that any subclass of the given class generally does not
    // have to use the same set of "Common attributes" (even though this is
    // sometimes preferred).
    "Common attributes",

    // Rather than a "Common attributes" attribute, a class might also have a
    // "constructor" method instead which is generally used to define its
    // members. This is particularly useful for compound entities that you want
    // to be able to search for given its constituents. (For an example, see
    // the "Users" class or the "Relational qualities" class below.)
    "constructor",

    // And as a third alternative, a class have a "Member type(s)" in case its
    // members are 'value entities' (see above). Examples of this attribute
    // are: "string", "jsx", "function", and "integer unsigned", etc. using the
    // same convention as verifyType() (in ScriptInterpreter.js). Or the value
    // can also be an array of such type strings, which means the type is a
    // disjunction of all the contained types. A class might also have both a
    // "Common attributes" and a "Member type(s)" attribute in case its members
    // can be both value entities as well as referential entities.
    "Member type(s)",

    // An entity used to specify which users are qualified to help determine
    // the members of the given class, among other things. See below for more
    // details. 
    "Area of concern",

    "Description",
  ],
  "Description": abs("./em1_aux.js;get/classesDesc"),
};


// Class of all users. These are all defined solely by the userID assigned to
// the given user and the ID or the UP node that created the user profile.
export const User = (upNodeID, userID) => ({
  "Class": abs("./em1.js;get/users"),

  // (This "Name" attribute is only meant to be temporary, as we will also
  // implement a system for allowing users to choose their own user name/tag
  // at will.)
  "Name": "User " + userID,

  "UP node ID": upNodeID,
  "User ID": userID,
});
export const users = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Users",
  "Superclass": abs("./em1.js;get/entities"),
  "constructor": User,
  "Description": abs("./em1_aux.js;get/usersDesc"),
};



// Class of all texts. Texts can be defined in many ways.
export const texts = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Texts",
  "Superclass": abs("./em1.js;get/entities"),
  "Common attributes": ["Name", "Path", "URL", "Content"],
  "Member type(s": ["string", "jsx"],
  "Description": abs("./em1_aux.js;get/textsDesc"),
};



// A 'quality' in this system refers to a property of an entity that can be
// described by floating-point number within some range. One can think of the
// well-known "tags" that you normally see on the web, but where each tag is
// rated on a floating-point scale. For example, a movie  might be rated with
// respect to a quality of "Scary," and the rating scale of the quality would
// thus represent how scary the movie is.
// The scores given to the qualities can then to be aggregated into e.g. mean
// or median estimators over larger user groups. Such user groups do not need
// to include all users of the system, but can also be a limited list of users.
// (And the users in the group might even have different weights, meaning that
// the scores of some users might count for more than others.)
// Qualities have a "Label" attribute, which should be as brief as possible:
// Instead of writing "Is scary," write "Scary." And instead of writing "Has
// good acting," write "Good acting." Then for elaboration on these labels,
// qualities also have an "Elaboration" attribute, which is a short text that
// can be shown e.g. when hovering over a display/reference of the quality. For
// these texts, one can use the word 'Subject,' always with a capital 'S,' to
// refer to the subject that the quality is about, such as e.g. in a sentence
// like "Subject is scary." And then for further elaboration on the quality,
// we of course also have the "Description" attribute. 
// Apart from that, semantic qualities also each have a "Domain," which is a
// class to which the subjects are supposed to belong. (It can also be a
// quality, in which case it is implicitly understood to mean that set of all
// entities with a positive score for that quality). They also have a "Metric,"
// which defines the semantics of the range of the floating-point score, and
// they can have a (default) "Area of concern" attribute, which, as described
// below, helps the app choose the right user group to query for score
// aggregates for the given quality.
// Some qualities might also have the "Area of concern" attribute replaced with
// a "Formula" attribute. In this case, we might refer to the quality as a
// 'derived quality.' The "Formula" attribute takes the value of a function,
// whose only argument is a so-called 'score handler' (see below), which in
// short is an object that handles fetching (and posting) scores for the given
// user, allowing the results to be dependent on the user's own preferences.
// The returned value of the "Formula" function is then an object with the same
// API (in terms of its methods) as the so-called "scored lists," which are
// also introduced below.
export const qualities = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Qualities",
  "Superclass": abs("./em1.js;get/entities"),
  "Common attributes": [
    "Name",
    "Elaboration", "Domain", "Metric", "Area of concern",
    "Formula", "Description",
  ],
  "Description": abs("./em1_aux.js;get/qualitiesDesc"),
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
  "Description": abs("./em1_aux.js;get/metricsDesc"),
};


// The so-called 'areas of concern' (AoC) are used for determining with user
// group to query when looking for the scores of a given quality. Different
// users might trust different user groups to deliver the best scores. But
// rather than voting on the best user group to query for every single quality,
// we can instead group qualities into 'areas of concern,' as we might call it,
// such as e.g. "Taste in fictional media," "Science," "UI," "URL safety,"
// "Sensitive user safety" etc., and then the users only need to pick one user
// group to use for each of these areas. Note that areas can change in time,
// such as "Science" here, which might be split into several subareas.
// Like all attributes of entities, the "Area of concern" attribute of quality
// entities are only guiding; it is not set in stone.
export const areasOfConcern = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Areas of concern",
  "Superclass": abs("./em1.js;get/entities"),
  "Common attributes": ["Name", "Description"],
  "Description": abs("./em1_aux.js;get/areasOfConcernDesc"),
};


/* An inserted note about using AoCs to achieve anonymity for users: */
// Areas of concern can furthermore also be used as a way to achieve almost
// perfect user anonymity, while at the same time being able to assign trust to
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
// sensitive things like pornography and sexual matters. Or you might want a
// private account to share and discuss secrets and/or private experiences with
// others. Or you even just might not want, say, your boss and your coworkers,
// and everyone else that you know, to know all your tastes in movies, free
// time activities, and all other things.
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
// can't read the data, namely by using client-side encryption keys to encrypt
// the data.)





// 'Relations' in this system are entities that when combined with a relational
// object yields a predicate. In practical terms, this is done by using
// the constructor if the 'Relational predicates' class below, RP(), giving it
// the object and the relation as its arguments.
// Like qualities, relations also have a "getElaboration" attribute, but in this
// case, the function takes both an object and a subject as its second argument.
// For instance, we could have (obj, subj) => subj + " is a subclass of " + obj,
// which will indeed be the getElaboration() function of the "Subclasses"
// relation below.
// And like qualities, relations also have a "Label attribute, where we in this
// case prefer the labels to be nouns (including compound ones). This could for
// example be "Subclasses" in the case that we just saw. When a relational
// quality is created from an object and a relation, we can then give it a
// short label of the form "<Object> → <Relation>". So for instance, the
// quality of being a subclass of the "Texts" class will get the label of:
// "Texts → Subclasses." (By the way, plural nouns are often preferred for
// relation labels, unless they are expected to only have one subject, such as
// e.g. the the capital of a country, in which case the label ought to be
// "Capitol".)
// Relations also define the "Metric" and "Area of concern" of the relational
// qualities that they produce, as well as the domain, only this is referred to
// to as the "Subject domain" here, as we also similarly have an "Object
// domain" for the intended objects of the relation. The can also be 'derived'
// and use a "Formula" attribute rather than an "Area of concern." The only
// difference is that these "Formula" functions, as opposed the those of
// qualities, also take the object as their first argument, before the score
// handler argument.
export const relations = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Relations",
  "Superclass": abs("./em1.js;get/entities"),
  "Common attributes": [
    "Label", "getElaboration", "Object domain", "Subject domain",
    "Metric", "Area of concern", "Description"
  ],
  "Description": abs("./em1_aux.js;get/relationsDesc"),
};


// Relational predicates are always constructed from the constructor below,
// which we have abbreviated to just 'RP()' rather than 'RelationalPredicate()'
// (as it will be used very frequently).
export const RP = (objID, relID) => ({
  "Class": abs("./em1.js;get/relationalPredicates"),
  "Object": "#" + objID,
  "Relation": "#" + relID,
  "Label": "Relevant w.r.t. #" + objID + " → " + "#" + relID,
});
export const relationalPredicates = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Relational predicates",
  "Superclass": abs("./em1.js;get/qualities"),
  "constructor": RP,
  "Description": abs("./em1_aux.js;get/relationalPredicatesDesc"),
};


export const getElaborationOfStdSingularRelation = (objID, subj) => (
  "#" + subj + " is relevant as the " + "#" + relID + " of #" + objID
);
export const getElaborationOfStdPluralRelation = (objID, subj) => (
  "#" + subj + " is relevant as one of the " + "#" + relID + " of #" + objID
);






// 'Parameters' in the context of the semantic system refers to the floating-
// point number scales that are scored by the users, and/or aggregated
// algorithmically. If ever needing to disambiguate from other kinds of
// 'parameters,' we can refer to them as 'Quality parameters,' but let's use
// the abbreviated form, 'Parameters,' as much as possible.
export const Parameter = (qualID, subjID) => ({
  "Class": abs("./em1.js;get/qualityVariables"),
  "Quality": "#" + qualID,
  "Subject": "#" + subjID,
  "Label": "#" + subjID + " ⇒ " + "#" + qualID,
});
export const parameters = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Parameters",
  "Superclass": abs("./em1.js;get/entities"),
  "constructor": Parameter,
  "Description": abs("./em1_aux.js;get/qualityVariablesDesc"),
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
// only exist for a moment, the entity-defined scored lists often have their
// data stored separately in the database, which is why these entities do not
// only have methods to fetch data from the list, but also methods to update it.
export const scoredLists = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Scored lists",
  "Superclass": abs("./em1.js;get/entities"),
  "Common attributes": [
    // fetchScoreData(subjKey fetches the score data for the given "subject,"
    // i.e. the given entity on the list. "Score data" refers here to a [score,
    // weight, auxData?] array, as described above. Note that an "key" here can
    // be either an absolute entity path, a user ID prefixed by "@", an entity
    // ID prefixed with "#", or can also just be the entity ID without the
    // leading "#".
    "fetchScoreData",

    // fetchList(loHex, hiHex, maxNum, offset, isAscending) fetches a section
    // of the scored list as a 2-dimensional array. The arguments 'lo', 'hi',
    // 'maxNum', 'offset', and 'isAscending' specifies which section of the
    // list should be returned. (And and all these arguments should have default
    // values and thus be optional.) Each row of the returned 2-dimensional
    // array should be of the form [entID, score, weight?, auxData?], but note
    // that auxData in particular does not need to be included here even if it
    // exists (and can also just contain only a subset of the full auxData
    // objects properties). (You generally don't want to include any data that
    // is stored in the "payload" column of the BBT table.)
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
  "Description": abs("./em1_aux.js;get/scoredListsDesc"),
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
  "Description": abs("./em1_aux.js;get/userGroupsDesc"),
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
    // fetchScoreData(qualKey, subjKey, options) is similar to
    // fetchScoreData() of the scored lists, except that you need to specify
    // the quality that the scores concern.
    // Furthermore, the 'options' argument can contain auxiliary parameters
    // such as a 'userGroup' option, which overrides whatever user group the
    // score handler would choose by default for the quality, and for the given
    // user. And speaking of the given user, the user (entity) ID should also
    // generally be passed via the 'user' option when the score handler is used
    // client-side.
    // Another important option is a boolean 'queryUser' option, which if set
    // as true, means the score handler should only return the user's own
    // score(s) (possibly undefined), instead of choosing a user group and
    // querying that.
    "fetchScoreData",

    // fetchList(qualKey, options) is similar to the fetchList() method of
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

    // fetchTopEntry(qualKey, options) fetches and returns only the top entity
    // of the list. This is useful for fetching e.g. "scored properties" of an
    // entity (not all properties of an entity is defined by its attributes; in
    // principle an entity has infinitely many properties, which can be defined
    // via relations, scored by the users). 
    "fetchTopEntry",

    // postScore(qualKey, subjKey, userKey, score, options) posts a new user
    // score, and will generally call updateScoreForUser() immediately after.
    // If auxiliary data is posted along with the score itself, perhaps to be
    // stored at the "payload" column of the score table, this data should be
    // passed as part of the options argument.
    "postScore",

    // deleteScore(qualKey, subjKey, userKey, options) is similar to postScore()
    // above, but deletes the existing user score instead.
    "deleteScore",

    // updateScoreForUser(qualKey, subjKey, userKey, options): When a user
    // submits a score for a quality, this method should generally be called.
    // And the method can also be called at any subsequent point.
    "updateScoreForUser",

    // updateScoreForGroup(qualKey, subjKey, options): When viewing a score
    // from a user group, the app might afford a button to "refresh"/"update"
    // the score for the given subject. If the user clicks that button, this
    // methods should then be called.
    "updateScoreForGroup",

    // updateList(qualKey, options) is similar to updateScoreForGroup() but
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

    // fetchDefaultOptions(qualKey) returns a promise to the default options
    // chosen by the score handler for a given quality. This allows the app to
    // inform the user of these choices should they inspect the score in more
    // detail. Thus, if the user open a menu to adjust the search options, e.g.
    // when viewing a list, the appropriate initial values of the various input
    // fields can be gotten from this method.
    "fetchDefaultOptions",

    // getSettingsMenu() returns a component, or possibly a promise to one,
    // that can be used by a user to change their preference settings for the
    // score handler. (This component is also responsible for fetching and
    // posting these settings itself.) 
    "getSettingsMenu",

    // Documentation describing the given score handler works and its usage.
    "Documentation",
  ],
  "Description": abs("./em1_aux.js;get/scoreHandlersDesc"),
};



// Component entities (short for 'JSX components' or 'App components) represent
// internal JSX components in the database/network, that can be imported into
// scripts. A defining attribute is obviously the path (or "route," if you will)
// to the given component's module. And then there are some optional metadata
// attributes, including an URL to the GitHub repo from which the module stems,
// and also not least an "Example component path", which leads to another,
// props-independent component that showcases the given component (either by
// "decorating" it with specific properties, or by showing different examples
// on a page, possibly with accompanying text that explains each example, and
// the intended usage of the component in general). If the component is a self-
// contained app, simply omit the "Example component path" attribute, which
// means that the component itself will be rendered. And if it is almost self-
// contained, but only need to example props to showcase, define the "Example 
// props" attribute instead.
export const components = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "App components",
  "Superclass": abs("./em1.js;get/entities"),
  "Common attributes": [
    "Name", "Component path", "Example component path", "Example props",
    // (These attributes obviously have to been checked by the user community,
    // and the entity ought to be down-rated as a member of this class if they
    // are not true:)
    "GitHub repository", "Author(s)",
    // Let's remove these two, and expect them to be purely "scored properties"
    // instead:
    // "Is free to use", "Is free to modify",
    "Description"
  ],
  "Description": abs("./em1_aux.js;get/componentsDesc"),
};





// Some useful metrics for qualities.

export const percentageMetric = {
  "Class": abs("./em1.js;get/metrics"),
  "Name": "Percentage metric",
  "Unit": "%",
  "Lower limit": 0,
  "Upper limit": 100,
  "Description": abs("./em1_aux.js;get/percentageMetricsDesc"),
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
  "Description": abs("./em1_aux.js;get/predicateMetricsDesc"),
};

export const dimensionlessMetric = {
  "Class": abs("./em1.js;get/metrics"),
  "Name": "Dimensionless metric",
  "Description": abs("./em1_aux.js;get/dimensionlessDesc"),
};

export const positiveDimensionlessMetric = {
  "Class": abs("./em1.js;get/metrics"),
  "Name": "Positive dimensionless metric",
  "Lower limit": 0,
  "Description": abs("./em1_aux.js;get/positiveDimensionlessMetricDesc"),
};

export const priceInUSDMetric = {
  "Class": abs("./em1.js;get/metrics"),
  "Name": "Prince metric (USD)",
  "Unit": "$",
  "Prepend unit": true,
  "Description": abs("./em1_aux.js;get/priceInUSDMetricDesc"),
};

export const timeInYearsMetric = {
  "Class": abs("./em1.js;get/metrics"),
  "Name": "Time metric (years)",
  "Unit": "yr",
  "Lower limit": 0,
  "Description": abs("./em1_aux.js;get/timeInYearsMetricDesc"),
};
export const timeInDaysMetric = {
  "Class": abs("./em1.js;get/metrics"),
  "Name": "Time metric (days)",
  "Unit": "days",
  "Lower limit": 0,
  "Description": abs("./em1_aux.js;get/timeInDaysMetricDesc"),
};
export const timeInSecondsMetric = {
  "Class": abs("./em1.js;get/metrics"),
  "Name": "Time metric (seconds)",
  "Unit": "s",
  "Lower limit": 0,
  "Description": abs("./em1_aux.js;get/timeInSecondsMetricDesc"),
};



// Some useful qualities.

export const probability = {
  "Class": abs("./em1.js;get/qualities"),
  "Label": "Probability",
  "getElaboration": subj => "The probability that #" + subj + " is fully true.",
  "Domain": abs("./em1.js;get/texts"),
  "Metric": abs("./em1.js;get/percentageMetric"),
  "Description": abs("./em1_aux.js;get/probabilityDesc"),
};

// "Truthfulness" is here taken as a measure, not of the probability that the
// whole texts, as a combined statement, is true, but instead more of a sort of 
// average of probability of each individual statement made by the text, but
// where more important statements might get more weight in this average. How
// to divide the text up into individual statements and how to weight each one
// is up to the users to decide. (So 'Truthfulness' is not a purely objective
// quality.) In short, this quality is meant to give a measure of how much of
// this combined text is truthful and reliable.
export const truthfulness = {
  "Class": abs("./em1.js;get/qualities"),
  "Label": "Truthfulness",
  "getElaboration": subj => "The average probability that any given " +
    "statement contained in #" + subj + " is true (where each " +
    "statement is weighted after its perceived importance)",
  "Domain": abs("./em1.js;get/texts"),
  "Metric": abs("./em1.js;get/percentageMetric"),
  "Description": abs("./em1_aux.js;get/truthfulnessDesc"),
};

// 'Agreement' is not an objective quality: Qualities can depend on the user
// scoring them. This quality is a measure of how much the user agrees with the
// statement, and/or the sentiment of the statement (and the "or" here is
// actually important, as some statements are made hyperbolic).
export const agreement = {
  "Class": abs("./em1.js;get/qualities"),
  "Label": "Agreement",
  "getElaboration": subj => "How much the scoring user(s) agrees on average " +
    "with the statement contained in #" + subj + " (where each " +
    "statement is weighted after its perceived importance)",
  "Domain": abs("./em1.js;get/texts"),
  "Metric": abs("./em1.js;get/percentageMetric"),
  "Description": abs("./em1_aux.js;get/agreementDesc"),
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
  "getElaboration": subj => "How much #" + subj +" can be trusted to give " +
    "honest and helpful scores and comments, etc., in this network",
  "Domain": abs("./em1.js;get/users"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/trustedDesc"),
};


// Some simple predicates that doesn't need much explaining (and their
// "Descriptions" should thus also be brief).
export const good = {
  "Class": abs("./em1.js;get/qualities"),
  "Label": "Good",
  "Domain": abs("./em1.js;get/entities"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/goodDesc"),
};
export const funny = {
  "Class": abs("./em1.js;get/qualities"),
  "Label": "Funny",
  "Domain": abs("./em1.js;get/entities"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/funnyDesc"),
};
export const scary = {
  "Class": abs("./em1.js;get/qualities"),
  "Label": "Scary",
  "Domain": abs("./em1.js;get/entities"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/scaryDesc"),
};




export const price = {
  "Class": abs("./em1.js;get/qualities"),
  "Label": "price",
  // TODO: Give this quality a "getElaboration" method.
  // The class of valuable things is so large and varied that we might as well
  // make All entities the domain:
  "Domain": abs("./em1.js;get/entities"),
  "Metric": abs("./em1.js;get/priceInUSDMetric"),
  // No description required for this quality.
};

export const durability = {
  "Class": abs("./em1.js;get/qualities"),
  "Label": "durability",
  // TODO: Give this quality a "getElaboration" method.
  // The class is too wide and varied to try to use a more narrow domain.
  "Domain": abs("./em1.js;get/entities"),
  "Metric": abs("./em1.js;get/timeInYearsMetric"),
  // No description required for this quality.
};






// Some useful relations.

// The useful members to see when browsing a class.
export const members = {
  "Class": abs("./em1.js;get/relations"),
  "Label": "Members",
  "getElaboration": getElaborationOfStdPluralRelation,
  "Object domain": abs("./em1.js;get/classes"),
  "Subject domain": abs("./em1.js;get/entities"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/membersDesc"),
};

// The useful subclasses when browsing a class and wanting to look for one or
// more subcategories of it (or to see which subcategories there are).
export const subclasses = {
  "Class": abs("./em1.js;get/relations"),
  "Label": "Subclasses",
  "getElaboration": getElaborationOfStdPluralRelation,
  "Object domain": abs("./em1.js;get/classes"),
  "Subject domain": abs("./em1.js;get/classes"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/subclassesDesc"),
};

// The relevant relations of a given entity, i.e. all the relations (obviously
// not counting this one), that are relevant to have as tabs when viewing the
// entity's page, and/or the relevant section Labels you would want to see in
// an information article about the entity, and/or relevant labels to see in an
// information table about the entity.
export const relevantRelations = {
  "Class": abs("./em1.js;get/relations"),
  "Label": "Relations",
  "getElaboration": getElaborationOfStdPluralRelation,
  "Object domain": abs("./em1.js;get/entities"),
  "Subject domain": abs("./em1.js;get/relations"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/relevantRelationsDesc"),
};

// Same as the above, but where the object of the relation is not the entity
// itself but its class. This is very useful as it allows you to define useful
// relations for a whole class at once.
export const relationsForMembers = {
  "Class": abs("./em1.js;get/relations"),
  "Label": "Relations for members",
  "getElaboration": getElaborationOfStdPluralRelation,
  "Object domain": abs("./em1.js;get/classes"),
  "Subject domain": abs("./em1.js;get/relations"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/relationsForMembersDesc"),
};

// This class is useful primarily if you want to have a tab menu where
// selecting a tab (based on a given relation) will spawn "sub-tabs" of that
// tab (which are then "sub-relations" of that relation).
export const subRelations = {
  "Class": abs("./em1.js;get/relations"),
  "Label": "Sub-relations",
  "getElaboration": getElaborationOfStdPluralRelation,
  "Object domain": abs("./em1.js;get/relations"),
  "Subject domain": abs("./em1.js;get/relations"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/subRelationsDesc"),
};

// Relevant qualities for users to see, score, and search on for a given entity.
export const relevantQualities = {
  "Class": abs("./em1.js;get/relations"),
  "Label": "Qualities",
  "getElaboration": getElaborationOfStdPluralRelation,
  "Object domain": abs("./em1.js;get/entities"),
  "Subject domain": abs("./em1.js;get/qualities"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/relevantQualitiesDesc"),
};

// Relevant qualities for users to see, score, and search on in general for
// entities of a given class.
export const qualitiesForMembers = {
  "Class": abs("./em1.js;get/relations"),
  "Label": "Qualities for members",
  "getElaboration": getElaborationOfStdPluralRelation,
  "Object domain": abs("./em1.js;get/classes"),
  "Subject domain": abs("./em1.js;get/qualities"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/qualitiesForMembersDesc"),
};

// "Sub-qualities" are essentially to qualities what subclasses are to classes.
// A good example: 'witty' is a sub-quality of 'funny'. This relation can also
// be used in a multi-layer tab menu where you want quality tabs to spawn sub-
// quality tabs, but they can also be used in any case when a user browses a
// quality and wants to look for more specific qualities. (Come to think of it,
// you can also say the same thing about the "sub-relations" above.)
export const subQualities = {
  "Class": abs("./em1.js;get/relations"),
  "Label": "Sub-qualities",
  "getElaboration": getElaborationOfStdPluralRelation,
  "Object domain": abs("./em1.js;get/qualities"),
  "Subject domain": abs("./em1.js;get/qualities"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/subQualitiesDesc"),
};



// A relation that points to the best entity page component for the given class
// (as scored by the users).
export const entityPage = {
  "Class": abs("./em1.js;get/relations"),
  "Label": "Entity page",
  "getElaboration": getElaborationOfStdSingularRelation,
  "Object domain": abs("./em1.js;get/classes"),
  "Subject domain": abs("./em1.js;get/components"),
  "Area of concern": "./em1.js;get/uiAoC",
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/entityPageDesc"),
};

// Similar to the "Entity page" relation, but for entity components that is
// supposed to be shown in a list. (Obviously, the ideal component here might
// very well depend on the list and on the context, which is why users might
// want to add sub-relations to this one, but this "Entity element" relation
// is supposed to point to components that can be used in general cases, and
// in particular when viewing the members of a class.)
export const entityElement = {
  "Class": abs("./em1.js;get/relations"),
  "Label": "Entity element",
  "getElaboration": getElaborationOfStdSingularRelation,
  "Object domain": abs("./em1.js;get/classes"),
  "Subject domain": abs("./em1.js;get/components"),
  "Area of concern": "./em1.js;get/uiAoC",
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/entityElementDesc"),
};


export const uiAoC = {
  "Class": abs("./em1.js;get/areasOfConcern"),
  "Name": "UI",
  "Description": abs("./em1_aux.js;get/uiAoCDesc"),
};


// TODO: Continue.