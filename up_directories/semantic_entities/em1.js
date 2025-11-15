
// First entity module (EM) with some initial entities, not least the
// 'Entities' class and the 'Classes' class which are fundamental to the
// whole semantic system.

import {fetchEntityProperty} from "./entities.js";



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
// when it result is what should substitute the attribute. And if it returns a
// function, then the whole process is repeated recursively. Below can be seen
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
    // "Class" is a required attribute for all referential entities.
    "Class",

    // The "Name" attribute is understood in a very broad sense of the word.
    // It is a string, preferably as brief as possibly, that is used to label
    // the given entity when it is referred to. So in a sense, "Name" here is
    // used synonymously with a "label."
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
    // A superclass (i.e. the opposite of "subclass") that helps define the
    // class.
    "Superclass",

    // An array of names of the potential attributes and methods you might
    // expect the members of this class to be defined by. (This list is only
    // guiding). Note that any subclass of the given class generally does not
    // have to use the same set of "Common attributes" (even though this is
    // sometimes preferred). Generally, a subclass thus ought to repeat all the
    // "Common attributes" it has in common with its superclass. An exception
    // to this rule, however, is the set of attributes: "Class", "Name",
    // "Elaboration", and "Description", which all might be relevant for any
    // given type of of entity, and which can therefore always be omitted from
    // a class's "Common attributes".
    "Common attributes",

    // Rather than a "Common attributes" attribute, a class might also have a
    // "constructor" method instead which is generally used to define its
    // members. This is particularly useful for compound entities that you want
    // to be able to search for given its constituents. (For an example, see
    // the "Users" class or the "Relational qualities" class below.)
    "constructor",

    // And as a third alternative, a class have a "Member value type(s)" in
    // case its members are 'value entities' (see above). Examples of this
    // attribute are: "string", "jsx", "function", and "integer unsigned", etc.,
    // using the same convention as verifyType() (in ScriptInterpreter.js). Or
    // the value can also be an array of such type strings, which means the
    // type is a disjunction of all the contained types. A class might also
    // have both a "Common attributes" and a "Member value type(s)" attribute
    // in case its members can be both value entities as well as referential
    // entities.
    "Member value type(s)",

  // A class might also include an "Area of concern" attribute (see below
  // for more details), but as mentioned below, such properties will often be
  // defined as "scored properties" instead, namely by scoring an 'Area of
  // concern' relation for the given class.
  "Area of concern",
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



// Class of all texts. Texts can be defined in many ways; they can be defined
// by a path or an external URL, and/or by a "Content" string or reference. Or
// the text entity can be a so-called "value entity", either in the form of a
// string or a JSX element.
export const texts = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Texts",
  "Superclass": abs("./em1.js;get/entities"),
  "Common attributes": ["Path", "URL", "Content"],
  "Member value type(s": ["string", "jsx"],
  "Description": abs("./em1_aux.js;get/textsDesc"),
};

// 'Comments' is a subclass of text entities whose members generally have a
// user-written "Content," and who generally is about a specific "Target
// entity". And comments also generally have a specific user attached, which is
// the "Author" of the comment.
export const commentClass = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Comments",
  "Superclass": abs("./em1.js;get/texts"),
  "Common attributes": ["Target entity", "Author", "Content"],
  "Description": abs("./em1_aux.js;get/commentClassDesc"),
};



// A 'quality' in this system refers to a property of an entity that can be
// described by floating-point number within some range. One can think of the
// well-known "tags" that you normally see on the Web, but where each tag is
// rated on a floating-point scale. For example, a movie  might be rated with
// respect to a quality of "Scary," and the rating scale of the quality would
// thus represent how scary the movie is.
// The scores given to the qualities can then to be aggregated into e.g. mean
// or median estimators over larger user groups. Such user groups do not need
// to include all users of the system, but can also be a limited list of users.
// (And the users in the group might even have different weights, meaning that
// the scores of some users might count for more than others.)
// We will tend to refer to the entities that the quality is about as the
// "subjects" of the quality. And when a quality and a subject is put together,
// they form what we will refer to as a 'scored parameter,' or simply
// 'parameter,' whenever it is clear from context what we are talking about
// (which is most of the time).
export const qualities = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Qualities",
  "Superclass": abs("./em1.js;get/entities"),
  "Common attributes": [
  // The "Name" attribute of qualities should be as brief as possible: Instead
  // of writing "Is scary", write "Scary." And instead of writing "Has good
  // acting", write "Good acting". And instead of writing "Is a fantasy movie",
  // write "Fantasy movie", or preferably even just "Fantasy" if the "Domain"
  // (see below) of the quality is already a 'Movies' class.

  // The "getParameterName()" method is used to generate the "Name" attribute
  // whenever the quality is combined with a subject to form a 'parameter' (see
  // below).
  "getParameterName",

  // The "Domain" of a quality is a class to which the subjects are supposed to
  // belong. Or it can also be a quality, in which case it is implicitly
  // understood to mean that set of all entities with a positive score for that
  // quality.
  "Domain",

  // The "Metric" of a quality defines the semantics of the range of the
  // floating-point score, can also help to define the unit of the quality, if
  // any, and to give labels to the intervals of the range. Since most
  // qualities is expected to be "predicates," i.e. a quality measuring the
  // correctness of a statement (either a subjective or an objective one), we
  // will take the 'Predicate metric' introduced below to be the default metric
  // whenever the "Metric" attribute is undefined.
  "Metric",

  // Some qualities might also have a "getScoredList()" method. In such cases,
  // we might refer to the quality as being a 'derived quality.' And to make it
  // even more clear, we also include an "Is derived" quality that should be
  // set as true in such cases.
  // The "getScoredList()" method takes a so-called 'score handler' (see below)
  // as its argument, which in short is an object that handles fetching (and
  // posting) scores for the given user, allowing the results to be dependent
  // on the user's own preferences. The returned value of the "getScoredList()"
  // method is then an object with the same API (in terms of its methods) as
  // the so-called 'scored list' entities, which are introduced below. Note
  // that 'derived qualities' are thus not meant to be scored directly by the
  // users, as is the case for their counterparts, which we might refer to as
  // 'user-scored qualities.'
  "Is derived",
  "getScoredList",

  // A quality might also include an "Area of concern" attribute (see below
  // for more details), but as mentioned below, such properties will often be
  // defined as "scored properties" instead, namely by scoring an 'Area of
  // concern' relation for the given quality.
  "Area of concern",
  ],
  "Description": abs("./em1_aux.js;get/qualitiesDesc"),
};




// Relations in this system are entities that when combined with a relational
// object yields a quality (and most often a predicate in particular). In
// practical terms, this is done by using the constructor of the 'Relational
// qualities' class below, RG(), giving it the object and the relation as its
// arguments.
export const relations = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Relations",
  "Superclass": abs("./em1.js;get/entities"),
  "Common attributes": [
    // For the "Name" attribute of relations, try if at all possible to select
    // a noun (possibly a compound one) that labels the subjects of the
    // relations. For instance, the relation that connects a class (object) to
    // its subclasses (subjects) ought to be called simply "Subclasses" (which
    // we indeed do below). Also, please use plural nouns whenever you might
    // often expect relation to be one-to-many (such as e.g. is the case for
    // 'Subclasses,' as a class can have several of those), and select singular
    // nouns only when expect only one subject per object most of the time for
    // the relation. One can also choose parenthesize the pluralization in such
    // cases, especially when having more than one member isn't that rare, like
    // we have done above for the "Member value type(s)" attribute (and indeed,
    // the convention used for attributes is the same as the one for relation
    // "Names").

    // The "getParameterName()" method of relations is different from the one
    // for qualities, namely since it here takes two arguments, objKey and
    // subjKey, instead of just the subjKey. Thus, the getParameterName()
    // method for relational qualities is constructed the way you see here
    // below.
    "getParameterName",

    // And the "getQualityName()" similarly takes an objKey argument and
    // generates the name of the relational quality.
    "getQualityName",

    // A relation doesn't just have a "Domain" attribute, but both an "Object
    // domain" and a "Subject domain".
    "Object domain",
    "Subject domain",

    // The "Metric" of a relation is copied onto all the qualities that are
    // generated from it.
    "Metric",
  
    // Like qualities, relations can also potentially be 'derived' and use a
    // "getScoredList()" method. The only difference is that this
    // "getScoredList()" method, as opposed the that of qualities, also takes
    // the object as its first argument, before the score handler argument.
    "Is derived",
    "getScoredList",

    // If a relation has an "Area of concern" attribute (or scored property),
    // all the relational qualities formed from it will adopt that "Area of
    // concern." (See below for more on these so-called 'areas of concern.')
    "Area of concern",
  ],
  "Description": abs("./em1_aux.js;get/relationsDesc"),
};


// Relational qualities are always constructed from the constructor below,
// which we have abbreviated to just 'RQ()' rather than 'RelationalQuality()'
// (as it will be used very frequently).
export const RQ = (objID, relID) => ({
  "Class": abs("./em1.js;get/relationalQualities"),
  "Object": "${" + objID + "}",
  "Relation": "${" + relID + "}",
  "Name": () => new Promise(resolve => {
    fetchEntityProperty(relID, "getQualityName").then(
      getQualityName => resolve(getQualityName(objID))
    );
  }),
  "getParameterName": subjKey => new Promise(resolve => {
    fetchEntityProperty(relID, "getParameterName").then(
      getParameterName => resolve(getParameterName(objID, subjKey))
    );
  }),
  "Domain": () => new Promise(resolve => {
    fetchEntityProperty(relID, "Subject domain").then(
      domain => resolve(domain)
    );
  }),
  "Metric": () => new Promise(resolve => {
    fetchEntityProperty(relID, "Metric").then(
      metric => resolve(metric)
    );
  }),
  "Is derived": () => new Promise(resolve => {
    fetchEntityProperty(relID, "Is derived").then(
      isDerived => resolve(isDerived)
    );
  }),
  "getScoredList": scoreHandler => new Promise(resolve => {
    fetchEntityProperty(relID, "getScoredList").then(
      getScoredList => getScoredList ?
        resolve(getScoredList(objID, scoreHandler)) : undefined
    );
  }),
});
export const relationalQualities = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Relational qualities",
  "Superclass": abs("./em1.js;get/qualities"),
  "constructor": RQ,
  "Description": abs("./em1_aux.js;get/relationalQualitiesDesc"),
};





// 'Parameters' in the context of the semantic system refers to the floating-
// point number scales that are scored by the users, and/or aggregated
// algorithmically. If ever needing to disambiguate from other kinds of
// 'parameters,' we can refer to them as 'Quality parameters,' but let's use
// the abbreviated form, 'parameters,' whenever such disambiguation isn't
// needed.
export const Parameter = (qualID, subjID) => ({
  "Class": abs("./em1.js;get/qualityVariables"),
  "Quality": "${" + qualID + "}",
  "Subject": "${" + subjID + "}",
  "Name": () => new Promise(resolve => {
    fetchEntityProperty(qualID, "getParameterName").then(
      getParameterName => resolve(getParameterName(subjID))
    );
  }),
  "Metric": () => new Promise(resolve => {
    fetchEntityProperty(qualID, "Metric").then(
      metric => resolve(metric)
    );
  }),
  "Is derived": () => new Promise(resolve => {
    fetchEntityProperty(relID, "Is derived").then(
      isDerived => resolve(isDerived)
    );
  }),
  "getScoreData": scoreHandler => new Promise(resolve => {
    fetchEntityProperty(qualID, "getScoredList").then(getScoredList => {
      if (!getScoredList) return resolve(undefined);
      getScoredList(scoreHandler).then(scoredList => {
        scoredList.getScoreData().then(
          scoreData => resolve(scoreData)
        );
      });
    });
  }),
});
export const parameters = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Parameters",
  "Superclass": abs("./em1.js;get/entities"),
  "constructor": Parameter,
  "Description": abs("./em1_aux.js;get/parametersDesc"),
};





// The so-called 'areas of concern' (AoC) are used for determining with user
// group to query when looking for the scores of a given quality. Different
// users might trust different user groups to deliver the best scores. But
// rather than voting on the best user group to query for every single quality,
// we can instead group qualities into 'areas of concern,' as we might call it,
// such as e.g. "Taste in fictional media," "Science," "UI," "URL safety,"
// "Sensitive user safety" etc. Then, users only need to pick one user group to
// use for each of these areas. Note that areas can change in time, such as
// "Science" here, which might be split into several subareas.
// Note that even though "Area of concern" is mentioned above part of the
// "Common attributes" of the quality class, AoCs will likely be determined by
// scored properties instead most of the time, as they are often highly
// dependent on user opinions, and will also very likely change a lot over
// time.
// Qualities are furthermore not the only class of entities for which the
// "Area of concern" property might be relevant. Another good example is text
// entities, where an AoC can help determine which users are more qualified
// than others for estimating the correctness or probability of the given text.
// And class entities are another obvious example, where they might help
// determine which users or more qualified to score qualities regarding the
// entities of that class (including what its members are).
// Note that this means that when it comes to aggregating the scores for a
// given parameter, there might be several AoC properties involved, such as
// from the quality involved, and from the subject, and/or from its class. And
// when several different AoCs are present in this way, the natural thing to do
// is try to look the "conjunction" of all these areas, meaning to take the
// subset of things that belong to all the given AoCs at the same time.  
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






// Scored lists are similar to qualities in that they each associate a set of
// subjects to a set of scores for those subject. But while the list for the
// qualities might depend on the user viewing them, as different users might
// choose different user groups to query, and/or different algorithms to
// aggregate the scores, the scored lists are supposed to be objectively
// defined and thus independent of the user viewing or accessing the list.
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
    // fetchScoreData(subjKey) fetches the score data for the given "subject,"
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
  ],
  "Description": abs("./em1_aux.js;get/componentsDesc"),
};







// A metric is used to describe the semantics of the range of the floating-
// point parameters returned by qualities.
export const metrics = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Metrics",
  "Superclass": abs("./em1.js;get/entities"),
  "Common attributes": [
    "Unit", "Prepend unit", "Lower limit", "Upper limit",
    "Interval labels",
  ],
  "Description": abs("./em1_aux.js;get/metricsDesc"),
};


// Some useful metrics for qualities.

// The 'Predicate metric' is the default metric if the "Metric" attribute is
// undefined for a quality (or a relation).
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

export const percentageMetric = {
  "Class": abs("./em1.js;get/metrics"),
  "Name": "Percentage metric",
  "Unit": "%",
  "Lower limit": 0,
  "Upper limit": 100,
  "Description": abs("./em1_aux.js;get/percentageMetricsDesc"),
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



/* Some useful qualities */

// The 'Correct' quality is meant to be used for text entities (which is a
// very broad class; "texts" can be a lot of things) to describe the overall
// "correctness" of a text. And if the statements in the text are fully or
// partly subjective, then the "correctness" is just taken to subjective as
// well, meaning that the quality depends on the user scoring it. "Correctness"
// is not meant as measuring the probability of the text being true, in its
// entirety, but more a statement about the overall correctness of the text
// on average, you might say. And the quality therefore also used the predicate
// metric rather than the percentage metric. Then if wanting to talk about the
// probability of a particular statement being true, use the 'Probability'
// quality just below instead.
// The fact that we have both a 'Probability' and a 'Correctness' quality also
// means that we allow the 'Correctness' quality to reflect the scoring users'
// immediate opinions about the text. And then for the 'Probability' we can be
// more strict about how and whose scores are aggregated, such that the
// 'Probability' quality ends up reflecting a more thorough analysis of the
// statement, looking at its whole discussion graph and propagating the
// probabilities from bottom to top.
// Lastly, note also that when it comes to single-statement texts, whether that
// statement is phrases as a question or not should not matter, neither in
// terms of the 'Correct' quality nor the 'Probability' quality. This thus
// gives users a good way for a user to comment an argument for a discussing
// without claiming this argument to be true themselves. 
export const correct = {
  "Class": abs("./em1.js;get/qualities"),
  "Name": "Correct",
  "getParameterName": subjKey => "${" + subjKey + "} is correct",
  "Domain": abs("./em1.js;get/texts"),
  "Metric": abs("./em1.js;get/predicateMetric"), // (This is also the default
  // value when the "Metric" attribute is undefined.)
  "Description": abs("./em1_aux.js;get/correctDesc"),
};

// See the comment for the 'Correct' quality just above for details about this
// 'Probability' quality.
export const probability = {
  "Class": abs("./em1.js;get/qualities"),
  "Name": "Probability",
  "getParameterName": subjKey => "probability of ${" + subjKey + "} being true",
  "Domain": abs("./em1.js;get/texts"),
  "Metric": abs("./em1.js;get/percentageMetric"),
  "Description": abs("./em1_aux.js;get/probabilityDesc"),
};



// This 'Trusted' quality is meant as a standard way to obtain the weighted
// user lists that are used for user groups, namely by having a "moderator
// group" that scores other users, and themselves, with respect to this
// 'Trusted' quality. The quality uses the predicate metric, with the range
// from -10 to 10, and how this range is converted to a (non-negative) weight
// is up to whoever defines the user list.
// Now, as things progress, it is likely that users will create more specific
// sub-qualities of this one, which will define the sought-for qualities of
// the new user group in more detail. (For instance, one might make sub-
// qualities of "Trusted w.r.t. URL safety" or "Trusted w.r.t. (the field of)
// Chemistry", etc.) But initially, this more vague "Trusted" quality will
// probably do.
export const trusted = {
  "Class": abs("./em1.js;get/qualities"),
  "Name": "Trusted",
  "Elaboration": "User can be trusted to give honest and helpful scores " +
    "and comments, etc., in this network",
  "getParameterName": subjKey => "${" + subjKey +"} can be trusted",
  "Domain": abs("./em1.js;get/users"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/trustedDesc"),
};


// Some simple predicates that don't need much explaining (and their
// "Descriptions" should thus also be brief). These are included here mostly
// to give some examples of some non-relational qualities, and both a few
// predicates and a few non-predicate qualities.
export const good = {
  "Class": abs("./em1.js;get/qualities"),
  "Name": "Good",
  "getParameterName": subjKey => "${" + subjKey + "} is good",
  "Domain": abs("./em1.js;get/entities"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/goodDesc"),
};
export const funny = {
  "Class": abs("./em1.js;get/qualities"),
  "Name": "Funny",
  "getParameterName": subjKey => "${" + subjKey + "} is funny",
  "Domain": abs("./em1.js;get/entities"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/funnyDesc"),
};
export const scary = {
  "Class": abs("./em1.js;get/qualities"),
  "Name": "Scary",
  "getParameterName": subjKey => "${" + subjKey + "} is scary",
  "Domain": abs("./em1.js;get/entities"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/scaryDesc"),
};


export const price = {
  "Class": abs("./em1.js;get/qualities"),
  "Name": "Price",
  "Elaboration": "Price (in USD)",
  "getParameterName": subjKey => "The price of ${" + subjKey + "} (in USD)",
  // The class of valuable things is so large and varied that we might as well
  // take the 'All entities' class as the domain:
  "Domain": abs("./em1.js;get/entities"),
  "Metric": abs("./em1.js;get/priceInUSDMetric"),
  "Description": abs("./em1_aux.js;get/priceDesc"),
};

export const durability = {
  "Class": abs("./em1.js;get/qualities"),
  "Name": "Durability",
  "Elaboration": "Durability (in years)",
  "getParameterName": subjKey => "The durability of ${" + subjKey + "} " +
    "(in years)",
  // The domain here is also too wide and varied to try narrow it down.
  "Domain": abs("./em1.js;get/entities"),
  "Metric": abs("./em1.js;get/timeInYearsMetric"),
  "Description": abs("./em1_aux.js;get/durabilityDesc"),
};






/* Some useful one-to-many relations */


// The useful members to see when browsing a class.
export const members = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Members",
  "getQualityName": objKey => "Belongs to ${" + objKey + "}",
  "getParameterName": (objKey, subjKey) => "${" + subjKey + "} belongs to " +
    "the class of ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/classes"),
  "Subject domain": abs("./em1.js;get/entities"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/membersDesc"),
};

// The useful subclasses when browsing a class and wanting to look for one or
// more subcategories of it (or to see which subcategories there are).
export const subclasses = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Subclasses",
  "getQualityName": objKey => "Subclass of ${" + objKey + "}",
  "getParameterName": (objKey, subjKey) => "${" + subjKey + "} is a subclass " +
    "of ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/classes"),
  "Subject domain": abs("./em1.js;get/classes"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/subclassesDesc"),
};

// The relevant relations of a given entity, i.e. all the relations (obviously
// not counting this one), that are relevant to have as tabs when viewing the
// entity's page, and/or the relevant section headers you would want to see in
// an information article about the entity, and/or relevant labels to see in an
// information table about the entity.
export const relevantRelations = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Relations",
  "getQualityName": objKey => "Relevant relation for ${" + objKey + "}",
  "getParameterName": (objKey, subjKey) => "${" + subjKey + "} is a relevant " +
    "relation for ${" + objKey + "}",
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
  "Name": "Relations for members",
  "getQualityName": objKey => "Relevant relation for members of ${" + objKey +
    "}",
  "getParameterName": (objKey, subjKey) => "${" + subjKey + "} is a relevant " +
    "relation for the members of ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/classes"),
  "Subject domain": abs("./em1.js;get/relations"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/relationsForMembersDesc"),
};

// This class is useful e.g. if you want to have a tab menu where selecting a
// tab (based on a given relation) will spawn "sub-tabs" of that tab (which are
// then "sub-relations" of that relation).
export const subRelations = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Sub-relations",
  "getQualityName": objKey => "Relevant sub-relation of ${" + objKey +
    "}",
  "getParameterName": (objKey, subjKey) => "${" + subjKey + "} is a relevant " +
    "sub-relation of ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/relations"),
  "Subject domain": abs("./em1.js;get/relations"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/subRelationsDesc"),
};

// Relevant qualities for users to see, score, and search on for a given entity.
export const relevantQualities = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Qualities",
  "getQualityName": objKey => "Relevant quality for ${" + objKey + "}",
  "getParameterName": (objKey, subjKey) => "${" + subjKey + "} is a relevant " +
    "quality for ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/entities"),
  "Subject domain": abs("./em1.js;get/qualities"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/relevantQualitiesDesc"),
};

// Relevant qualities for users to see, score, and search on in general for
// entities of a given class.
export const qualitiesForMembers = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Qualities for members",
  "getQualityName": objKey => "Relevant quality for members of ${" + objKey +
    "}",
  "getParameterName": (objKey, subjKey) => "${" + subjKey + "} is a relevant " +
    "quality for the members of ${" + objKey + "}",
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
  "Name": "Sub-qualities",
  "getQualityName": objKey => "Relevant sub-quality of ${" + objKey +
    "}",
  "getParameterName": (objKey, subjKey) => "${" + subjKey + "} is a relevant " +
    "sub-quality of ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/qualities"),
  "Subject domain": abs("./em1.js;get/qualities"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/subQualitiesDesc"),
};



/* Some comment and discussion-related relations */

// All entities can be commented on by users, at least in principle, including
// not least text entities. And since comments are themselves text entities,
// it means that each comment can get its own set of comments, on so on. 
export const commentsRelation = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Comments",
  "getQualityName": objKey => "Relevant comment about ${" + objKey + "}",
  "getParameterName": (objKey, subjKey) => "${" + subjKey + "} is a relevant " +
    "comment about ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/entities"),
  "Subject domain": abs("./em1.js;get/comments"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/commentsRelationDesc"),
};

// 'Questions and facts,' or 'Q&F' for short, is meant to include texts (not
// just comments targeted at the specific object in question) that contain
// either a relevant fact or a relevant question about the object. 
export const questionsAndFacts = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Q&F",
  "Elaboration": "Questions and facts",
  "getQualityName": objKey => "Relevant question or fact relating to ${" +
    objKey + "}",
  "getParameterName": (objKey, subjKey) => "${" + subjKey + "} is a " +
    "relevant question or fact relating to ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/entities"),
  "Subject domain": abs("./em1.js;get/texts"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/questionsAndFactsDesc"),
};

// A relation for relevant discussions relating to the specific entity in
// question some way of another. (If the object is a text, 'Discussions' don't
// have to be limited to arguments *specifically* about that text, but any
// relevant relation to the text is allowed.) The subjects of this relation,
// i.e. the "discussions," are meant to come in the form of a text which states
// the topic of the discussion, possibly phrased as a direct statement, but
// it can also be phrased as a question, of course.
export const discussions = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Discussions",
  "getQualityName": objKey => "Relevant discussion relating to ${" +
    objKey + "}",
  "getParameterName": (objKey, subjKey) => "${" + subjKey + "} is a " +
    "relevant discussion relating to ${" + objKey + "} in some way",
  "Object domain": abs("./em1.js;get/entities"),
  "Subject domain": abs("./em1.js;get/texts"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/commentsRelationDesc"),
};

// 'Reactions' are a subclass of comments that expresses some immediate
// reaction by the author to the object of the relation. This is the type of
// comments that often dominates the comments sections that is normally found
// on the Web. And although abundance of these kinds of comments can sometimes
// be a hindrance if you are e.g. looking for a specific question/discussion,
// often times, reaction comments are exactly what you look for when you go to
// a comment section. So this relation is definitely a relevant and useful one.
// And if you are instead looking for a specific question or discussion, well,
// that is exactly what the 'Discussion' and 'Q&F' tabs are for. (Relations
// will often be used to define tabs in the app.)
// By the way, note that 'Reactions' is a perfect example of a "sub-relation"
// (see above), namely of the 'Comments' relation. And although we won't
// introduce them here, some potentially relevant sub-relations of the
// 'Reactions' relation could further be: 'Positive reactions' and 'Negative
// reactions,' allowing the users easily select which ones there are interested
// in, and filter out all others.
export const reactions = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Reactions",
  "getQualityName": objKey => "Relevant reaction comment for ${" + objKey + "}",
  "getParameterName": (objKey, subjKey) => "${" + subjKey + "} is a " +
    "relevant reaction comment for ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/entities"),
  "Subject domain": abs("./em1.js;get/comments"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/reactionsDesc"),
};

// The 'Arguments' relation. This is where is gets a bit tricky, so hold on.
// We first of all here take 'Arguments' to refer to both arguments for and
// against the statement that is the object of the relation. In other words,
// a counter-argument is also considered an 'argument' in when it comes to
// the subjects of this relation. That's the first thing to keep in mind about
// this relation.
// Now, the "Subject domain" of this 'Arguments' relation are texts. And these
// texts, typically including only a single statement that is an argument
// either for or against the object statement. And what is the "Object domain"?
// One might also guess that this would be texts, but no. Here we instead use
// parameters. This means that whenever you have a quality and a subject,
// together forming a so-called 'parameter' (also referred to as a 'quality
// parameter' if wanting to be more precise), then parameter will have an
// 'Arguments' tab which shows the arguments for what the parameter should be
// scored as.
// And in particular when it comes to texts that consists of a singular
// statement, such as the subjects of this relation, the 'Correct' quality
// will thus (TODO: Rewrite this when I'm not tired) be a way to get to the
// 'Arguments' of the statement. ...I give up, I'm too tired rn. The last part
// might go something like: "Instead of having two parameters with the same
// meaning, we use the 'Correct' relation as the object of the 'Arguments' tab
// for a given statement text, rather than using the text itself as the object,
// which is the normal thing to do, and is what we do for nearly all other tabs
// in the app"... I'm rambling now, I feel like. So:
// TODO: I should rewrite this whole comment when I'm not tired.  
export const argumentsRelation = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Arguments",
  // TODO: Consider extracting the subject of the parameter for these two
  // attributes. Hm, or some to think of it, maybe I shouldn't do this after
  // all. Maybe I should just use 'Texts' as the "Object domain" after all..
  "getQualityName": objKey => "Relevant argument for ${" + objKey + "}",
  "getParameterName": (objKey, subjKey) => "${" + subjKey + "} is a " +
    "relevant argument for ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/parameters"),
  "Subject domain": abs("./em1.js;get/texts"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/argumentsRelationDesc"),
}; 




/* Some useful one-to-one relations (we we might also refer to as 'property
 * relations'). */


// This is the 'Areas of concern' relation that was mentioned above, which can
// be used to determine the "Area of concern" property of qualities, classes,
// and other entities, instead of relying solely on the corresponding
// attribute (which, as one can clearly see in this document, is not always
// defined).
export const areaOfConcern = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Area of concern",
  "getQualityName": objKey => "A fitting Area of concern for ${" + objKey + "}",
  "getParameterName": (objKey, subjKey) => "${" + subjKey + "} is a fitting " +
    "area of concern for ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/entities"),
  "Subject domain": abs("./em1.js;get/areasOfConcern"),
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/areaOfConcernDesc"),
};


/* Some UI-related relations */

// A relation that points to the best entity page component for the given class
// (as scored by the users).
export const entityPage = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Entity page",
  "getQualityName": objKey => "Good entity page component for members of ${" +
    objKey + "}",
  "getParameterName": (objKey, subjKey) => "${" + subjKey + "} is a good " +
    "entity page component for members of ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/classes"),
  "Subject domain": abs("./em1.js;get/components"),
  "Area of concern": "./em1.js;get/uiAoC",
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/entityPageDesc"),
};

export const uiAoC = {
  "Class": abs("./em1.js;get/areasOfConcern"),
  "Name": "UI",
  "Description": abs("./em1_aux.js;get/uiAoCDesc"),
};

// Similar to the "Entity page" relation, but for entity components that is
// supposed to be shown in a list. (Obviously, the ideal component here might
// very well depend on the list and on the context, which is why users might
// want to add sub-relations to this one, but this "Entity element" relation
// is supposed to point to components that can be used in general cases, such
// as e.g. when viewing the members of a class, etc.)
export const entityElement = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Entity element",
  "getQualityName": objKey => "Good entity element component for members of " +
   "${" + objKey + "}",
  "getParameterName": (objKey, subjKey) => "${" + subjKey + "} is a good " +
    "entity element component for members of ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/classes"),
  "Subject domain": abs("./em1.js;get/components"),
  "Area of concern": "./em1.js;get/uiAoC",
  "Metric": abs("./em1.js;get/predicateMetric"),
  "Description": abs("./em1_aux.js;get/entityElementDesc"),
};




