
// First entity module (EM) with some initial entities, not least the
// 'Entities' class and the 'Classes' class which are fundamental to the
// whole semantic system.

import {fetchEntityProperty} from "./entities.js";
import {fetchUserTag, fetchUserBio} from "./users/profiles.js";



// 'Semantic entities,' or just 'entities' for short, are objects with a human-
// understandable meaning attached to them. They most often take the form of
// JS objects, which we will refer to as the entities' 'definitions,' whose
// properties combine to describe the thing in question. These objects alway
// starts with a "Class" property that determines the type of the thing that
// the entity references. And this is then typically followed by a "Name"
// property, which labels the entity. For instance, if the entity is the movie,
// Pulp Fiction, the object in question would have a reference to a "Movies"
// class as its "Class" property, followed by a "Name" property of "Pulp
// Fiction". These two initial properties can then potentially be followed by
// other defining properties if needed, and lastly, there's always the
// potential to include a "Description" property with a reference to text that
// describes the thing in question in however great detail that one wants,
// clearing up any unintended ambiguities.
//
// The properties of entities be self-explanatory string like "Pulp Fiction",
// but they will also often be references to other entities. This is achieved
// by using strings that consists purely of a single absolute path, starting
// with "/", to the given entity. For instance, if we look at the first entity
// introduced below, namely the 'All entities' class entity, we see that it's
// "Class" property is abs("./em1.js;get/classes"), which is an absolute path
// to the second entity introduced below, namely the 'Classes' class entity.
// And this is of course meant to say that the 'Classes' entity is the class of
// the 'All entities' entity. The entity properties can furthermore also
// include entity references within a string. And this is done formally by
// wrapping the reference in the '${...}' syntax, known e.g. from the template
// literals or regular JS. (Examples of this can also be seen below, e.g. down
// towards the end of this module.) More precisely, the syntax for these
// 'internal references,' as we might call them, is '${<entity key>}', where
// <entity key> can be either an absolute path to the entity, like before, or
// a hexadecimal number representing the ID of the entity, which we will
// introduce in a moment. And if wanting to escape any of these two reference
// syntaxes, simply use a backslash before the "/" or the "$".
//
// The properties of entities can also use functions as their values. And here
// the format of the property name actually matters. If the property name is
// the ones we have talked about so far, namely with a capital first letter
// (and also with spaces between each word), the function is actually
// interpreted to only be a placeholder for the actual property value. In such
// cases, the actual property value is obtained from calling the function (with
// no arguments), and taking the return value of that function, and if the
// return value is a promise, then that promise is also waited for, and the
// result of the promise is what substitutes the property. That is unless the
// promise itself returns a function (or another promise), in which case the
// same procedure is called recursively until a non-function, non-promise value
// is reached. (See substituteIfGetterProperty() in ./entities.js for the
// exact substitution process.)
// 
// Entities can also have function-valued properties that are 'methods,'
// however, which should not be substituted. So in order to prevent this
// substitution, make sure to always use lower camel case (such as in e.g.
// "fetchScoreData()") for the property names of methods. For without the
// capital first letter, the property will not be substituted automatically,
// even if it's a function.
//
// With the convention described above, we are able to define entities
// representing anything in the world. However, if you want to talk about
// something like a simple JS string, a JSX element, or a function, it is
// somewhat redundant to wrap that in a whole object, with a "Class" property
// and "Name," etc., when the thing at hand really describes itself. And that's
// why entities can also just be what we might refer to as 'value entities,'
// which can any kind of JS value that you want, also including JSX elements,
// and whish thus simply "refers" to themselves. And thus whenever an entity's
// definition is not an object that includes a "Class" property, the entity
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
// Lastly, let's discuss the fact that all the so-called 'defining properties,'
// which are the ones introduced in 'definition' object of the entity, are of
// course only a subset of all the properties of an entity, of which there
// generally are infinitely many. For instance, a movie might also have an
// "Editor(s)" property, even though "Editor(s)" was not part of the defining
// properties. Such properties are instead defined via the "Relations" that can
// be read about below. And in fact, these 'scored properties,' as we will call
// them, might even be used to overwrite some of the defining properties. This
// could e.g. happen if the facts simply change over time. For instance, a
// person or an organization might change their name. So properties of entities
// should thus never be considered final. Furthermore, properties might even
// be made to depend on the user viewing them. This is possible since the
// 'scored properties' can actually be made to be user-dependent. And this
// means that we can even do things like change the language of the entire
// entity to a user's preferred one, meaning that different users will
// ultimately be able to see entities in their own preferred languages.
//
// That covers the basics of the 'semantic entities,' and in this module below,
// we introduce some of the most important entities that are used in this whole
// semantic system, starting of course with some of the most important class
// entities, and in particular the class of all entities, as well as the class
// of all class entities (both of which have themselves as part of their
// members). 



// Class of all things, or of all "entities," as we will call it here.
export const entities = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "All entities",
  "Superclass": undefined,
  "Common properties": [
    // "Class" is a required property for all referential entities.
    "Class",

    // The "Name" property is understood in a very broad sense of the word.
    // It is a string, preferably as brief as possibly, that is used to label
    // the given entity when it is referred to. So in a sense, "Name" here is
    // used synonymously with a "label."
    "Name",

    // The "Elaboration" is a slightly longer string that can be shown
    // underneath the "Name," either as a kind of subtitle, or as a mouseover
    // text, etc., elaborating on the generally very brief "Name" property. 
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
  "Common properties": [
    // A superclass (i.e. the opposite of "subclass") that helps define the
    // class.
    "Superclass",

    // An array of names of the potential properties and methods you might
    // expect the members of this class to be defined by. (This list is only
    // guiding). Note that any subclass of the given class generally does not
    // have to use the same set of "Common properties" (even though this is
    // sometimes preferred). Generally, a subclass thus ought to repeat all the
    // "Common properties" it has in common with its superclass. An exception
    // to this rule, however, is the set of properties: "Class", "Name",
    // "Elaboration", and "Description", which all might be relevant for any
    // given type of of entity, and which can therefore always be omitted from
    // a class's "Common properties".
    "Common properties",

    // Rather than a "Common properties" property, a class might also have a
    // "constructor" method instead which is generally used to define its
    // members. This is particularly useful for compound entities that you want
    // to be able to search for given its constituents. (For an example, see
    // the "Users" class or the "Relational qualities" class below.)
    "constructor",

    // And as a third alternative, a class have a "Member value type(s)" in
    // case its members are 'value entities' (see above). Examples of this
    // property are: "string", "JSXElement", "integer unsigned", "function",
    // etc., using the same convention as verifyType() in ScriptInterpreter.js.
    // Or the value can also be an array of such type strings, which means that
    // the type is a disjunction of all the contained types. A class might also
    // have both a "Common properties" and a "Member value type(s)" property
    // in case its members can be both value entities as well as referential
    // entities.
    "Member value type(s)",

  // A class might also include an "Area of concern" property (see below
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
  "Name": () => new Promise(resolve => {
    fetchUserTag(userID).then(
      userTag => resolve(userTag ?? "User " + userID)
    );
  }),
  "Bio": () => fetchUserBio(userID),
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
// via a "Content" text, or an external URL. Or the text entity can be a so-
// called "value entity", either in the form of a string or a JSX element.
export const texts = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Texts",
  "Superclass": abs("./em1.js;get/entities"),
  "Common properties": [
    // The "Content" of the text. Note that this property might to the form of
    // an absolute path to the text which references the text, rather than
    // letting the property hold the text directly.
    "Content",

    // If the text is an external text on the internet, with an associated URL,
    // use the URL. (And if it doesn't have an URL but still has some URI of
    // another kind, you can also reference it via that, although this is not
    // as desired as a URL)
    "URL",
    "URI",

    // The "Is a singular statement" property tells if the text is a singular
    // statement that can be assigned a probability in a meaningful and
    // straightforward way. The default value of this property is false (as is
    // generally the case unless otherwise specified). The property is meant
    // primarily as as way to help the app decide whether to direct to the
    // 'Is correct' quality or the 'Probability' quality (see below) when a
    // user wants to score the text, and/or see its arguments (pros and cons).
    // If the statement is not singular (but is compound of several statements,
    // explicitly and/or implicitly), the 'Is correct' quality should always
    // be used rather than the 'Probability' quality.
    "Is a singular statement"
  ],
  "Member value type(s": ["string", "JSXElement"],
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
  "Common properties": ["Target entity", "Author", "Content"],
  "Description": abs("./em1_aux.js;get/commentClassDesc"),
};



// A 'quality' in this system refers to a scalar predicate, i.e. a property of
// an entity that can be described by floating-point number within some range.
// One can think of the well-known "tags" that you normally see on the Web, but
// where each tag is rated on a floating-point scale. For example, a movie
// might be rated with respect to a quality of 'Scary,' and the rating scale of
// the quality would thus represent *how* scary the movie is.
// The scores given to the qualities can then to be aggregated into e.g. mean
// or median estimators over larger user groups. Such user groups do not need
// to include all users of the system, but can also be a limited list of users.
// (And the users in the group might even have different weights, meaning that
// the scores of some users might count for more than others.)
// We will tend to refer to the entities that the quality is about as the
// "subjects" of the quality. And when a quality and a subject is put together,
// they form what can be called a 'scalar proposition,' or simply just 'scalar'
// (see below).
export const qualities = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Qualities",
  "Elaboration": "Scalar predicates, a.k.a. qualities",
  "Superclass": abs("./em1.js;get/entities"),
  "Common properties": [
  // The "Name" property of qualities should either be a (compound) verb or
  // a (compound) noun, depending of whether it is a 'gradable predicate' or
  // not. A so-called 'gradable predicate' is when a scalar predicate, a.k.a.
  // a quality, is formed from a seemingly constant predicate, such as e.g.
  // 'Is funny' or 'Is scary,' which is however meant to be graded on a scale
  // (see the 'Grading metric' below). 
  // For gradable predicates, the convention here is to use a (compound) verb
  // for the "Name" property, as in for instance "Is funny," or "Has good
  // acting," or "Belongs to the class of Movies," etc. And for other kinds of
  // qualities, which typically measure some sort of quantity, such as
  // 'Probability' or 'Price' (which are both qualities that are introduced
  // below), these should indeed preferably be named using (compound) nouns
  // instead.

  // The "getScalarName()" method is used to generate the "Name" property
  // whenever the quality is combined with a subject to form a 'scalar' (see
  // below).
  "getScalarName",

  // The "Domain" of a quality is a class to which the subjects are supposed to
  // belong. Or it can also be a quality, in which case it is implicitly
  // understood to mean that set of all entities with a positive score for that
  // quality.
  "Domain",

  // The "Metric" of a quality defines the semantics of the range of the
  // floating-point score, as well as unit of the scale, if it has one. It can
  // also specify some appropriate labels for the intervals of the range, as
  // can be seen for the 'Grading metric' below.
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
  // Derived qualities also ought to define a "Dependencies" property with an
  // array of all the non-derived, user-scored qualities on which it depends.
  // This allows the app to link to these if the user wants to give their own
  // scores to them.
  "Is derived",
  "getScoredList",
  "Dependencies",

  // A quality might also include an "Area of concern" property (see below
  // for more details), but as mentioned below, such properties will often be
  // defined as "scored properties" instead, namely by scoring an 'Area of
  // concern' relation for the given quality.
  "Area of concern",
  ],
  "Description": abs("./em1_aux.js;get/qualitiesDesc"),
};




// Scalar relations, which we will generally simply refer to as 'relations,'
// are entities that when combined with a relational object yields a scalar
// predicate, a.k.a. a quality. In practical terms, this is done by using the
// constructor of the 'Relational qualities' class below, RG(), giving it the
// object and the relation as its arguments.
export const relations = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Relations",
  "Elaboration": "Scalar relations",
  "Superclass": abs("./em1.js;get/entities"),
  "Common properties": [
    // For the "Name" property of relations, try if at all possible to select
    // a noun (possibly a compound one) that labels the subjects of the
    // relations. For instance, the relation that connects a class (object) to
    // its subclasses (subjects) ought to be called simply "Subclasses" (which
    // we indeed do below). Also, please use plural nouns whenever you might
    // often expect relation to be one-to-many (such as e.g. is the case for
    // 'Subclasses,' as a class can have several of those), and select singular
    // nouns only when expect only one subject per object most of the time for
    // the relation. One can also choose parenthesize the pluralization in such
    // cases, especially when having more than one member isn't that rare, like
    // we have done above for the "Member value type(s)" property (and indeed,
    // the convention used for the so-called 'semantic properties' is the same
    // as the one for the "Name" properties of relations).

    // The "getScalarName()" method of relations is different from the one for
    // qualities, namely since it here takes two arguments, objKey and subjKey,
    // instead of just the subjKey. Thus, the getScalarName() method for
    // relational qualities is constructed the way you see here below.
    "getScalarName",

    // And the "getQualityName()" similarly takes an objKey argument and
    // generates the name of the relational quality.
    "getQualityName",

    // A relation doesn't just have a "Domain" property, but both an "Object
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

    // If a relation has an "Area of concern" property (or scored property),
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
  "getScalarName": subjKey => new Promise(resolve => {
    fetchEntityProperty(relID, "getScalarName").then(
      getScalarName => resolve(getScalarName(objID, subjKey))
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





// 'Scalars' are the scalar propositions formed for combing a scalar predicate,
// a.k.a. a quality, with a subject entity. They thus represent all the the
// floating-point number scales that are scored by the users, and/or aggregated
// algorithmically.
export const Scalar = (subjID, qualID) => ({
  "Class": abs("./em1.js;get/scalars"),
  "Subject": "${" + subjID + "}",
  "Quality": "${" + qualID + "}",
  "Name": () => new Promise(resolve => {
    fetchEntityProperty(qualID, "getScalarName").then(
      getScalarName => resolve(getScalarName(subjID))
    );
  }),
  "Metric": () => new Promise(resolve => {
    fetchEntityProperty(qualID, "Metric").then(
      metric => resolve(metric)
    );
  }),
  "Is derived": () => new Promise(resolve => {
    fetchEntityProperty(qualID, "Is derived").then(
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
export const scalars = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Scalars",
  "Elaboration": "Scalar propositions, a.k.a. scalars",
  "Superclass": abs("./em1.js;get/entities"),
  "constructor": Scalar,
  "Description": abs("./em1_aux.js;get/scalarsDesc"),
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
// "Common properties" of the quality class, AoCs will likely be determined by
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
// given scalar, there might be several AoC properties involved, such as from
// the quality involved, and from the subject, and/or from its class. And when
// several different AoCs are present in this way, the natural thing to do is
// try to look the "conjunction" of all these areas, meaning to take the subset
// of things that belong to all the given AoCs at the same time.  
export const areasOfConcern = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Areas of concern",
  "Superclass": abs("./em1.js;get/entities"),
  "Common properties": ["Name", "Description"],
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
  "Common properties": [
    // fetchScoreData(subjKey) fetches the score data for the given "subject,"
    // i.e. the given entity on the list. "Score data" refers here to a [score,
    // weight, auxData?] array, as described above. Note that an "key" here can
    // be either an absolute entity path or a hexadecimal entity ID.
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
  "Common properties": [
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
  "Common properties": [
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
    // entity (not all properties of an entity is defined by its properties; in
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
// scripts. A defining property is obviously the path (or "route," if you will)
// to the given component's module. And then there are some optional metadata
// properties, including an URL to the GitHub repo from which the module stems,
// and also not least an "Example component path", which leads to another,
// props-independent component that showcases the given component (either by
// "decorating" it with specific properties, or by showing different examples
// on a page, possibly with accompanying text that explains each example, and
// the intended usage of the component in general). If the component is a self-
// contained app, simply omit the "Example component path" property, which
// means that the component itself will be rendered. And if it is almost self-
// contained, but only need to example props to showcase, define the "Example 
// props" property instead.
export const components = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "App components",
  "Superclass": abs("./em1.js;get/entities"),
  "Common properties": [
    "Component path", "Example component path", "Example props",
    "getExampleProps", "Use full screen",
    // (These properties obviously have to been checked by the user community,
    // and the entity ought to be down-rated as a member of this class if they
    // are not true:)
    "GitHub repository", "Author(s)",
  ],
  "Description": abs("./em1_aux.js;get/componentsDesc"),
};







// A metric is used to describe the semantics of the range of the floating-
// point numbers that are used for the scalar propositions, a.k.a. the scalars.
export const metrics = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Metrics",
  "Superclass": abs("./em1.js;get/entities"),
  "Common properties": [
    "Unit", "Prepend unit", "Lower limit", "Upper limit",
    "Interval labels",
  ],
  "Description": abs("./em1_aux.js;get/metricsDesc"),
};


// Some useful metrics for qualities.

// The 'Grading metric' is the standard metric to use for all the so-called
// 'gradable predicates,' which are scalar predicates formed from a constant
// one, such as 'Is scary' or 'Is funny,' etc., which is then re-contextualized
// into a scalar predicate, a.k.a. a quality, by grading that predicate on the
// scale from -10 to 10 that you see below (see the "Interval labels"
// property).
export const gradingMetric = {
  "Class": abs("./em1.js;get/metrics"),
  "Name": "Grading metric",
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
  "Description": abs("./em1_aux.js;get/gradingMetricsDesc"),
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
  "Description": abs("./em1_aux.js;get/dimensionlessMetricDesc"),
};
export const fromMinusToPlusOneMetric = {
  "Class": abs("./em1.js;get/metrics"),
  "Name": "Dimensionless finite metric",
  "Lower limit": -1,
  "Upper limit": 1,
  "Description": abs("./em1_aux.js;get/fromMinusToPlusOneMetricDesc"),
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

// The 'Is correct' quality is meant to be used for text entities (which is a
// very broad class; "texts" can be a lot of things) to describe the overall
// "correctness" of a text. And if the statements in the text are fully or
// partly subjective, then the "correctness" is just taken to subjective as
// well, meaning that the quality depends on the user scoring it. "Correctness"
// is not meant to measure the probability of the text being true, in its
// entirety, but is to represent the overall correctness of the text, "on
// average," you might say. And the quality therefore also uses the 'Grading
// metric' rather than the 'Percentage metric.' Then if wanting to talk about
// the probability of a particular statement being true, use the 'Probability'
// quality just below instead.
// Whether the statement is phrased as a question or as a direct statement
// should not matter when it comes to the 'Is Correct' quality (nor the
// 'Probability' quality below, for that matter). This thus gives users a good
// way for them to contribute a potential argument to a discussion without
// claiming anything about that argument themselves, namely by posing it as a
// question instead of a direct statement.
export const isCorrect = {
  "Class": abs("./em1.js;get/qualities"),
  "Name": "Is correct",
  "getScalarName": subjKey => "${" + subjKey + "} is correct",
  "Domain": abs("./em1.js;get/texts"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/isCorrectDesc"),
};

// Unlike the 'Is Correct' quality above, the 'Probability' quality should
// only be used for "singular" statements that can be assigned a probability
// in a straightforward way (in terms of what that probability means, not in
// terms of *computing* the probability; that might not be straightforward at
// all). 
export const probability = {
  "Class": abs("./em1.js;get/qualities"),
  "Name": "Probability",
  "getScalarName": subjKey => "probability of ${" + subjKey + "} being true",
  "Domain": abs("./em1.js;get/texts"),
  "Metric": abs("./em1.js;get/percentageMetric"),
  "Description": abs("./em1_aux.js;get/probabilityDesc"),
};



// This 'Is trusted' quality is meant as a standard way to obtain the weighted
// user lists that are used for user groups, namely by having a "moderator
// group" that scores other users, and themselves, with respect to this 'Is
// trusted' quality. The quality uses the 'Grading metric,' with its range from
// -10 to 10. And how this range is converted to a (non-negative) weight is up
// to whoever defines the user list.
// Now, as things progress, it is likely that users will create more specific
// sub-qualities of this one, which will define the sought-for qualities of
// the new user group in more detail. For instance, one might make sub-
// qualities of "Is trusted w.r.t. URL safety" or "Is trusted w.r.t. (the field
// of) Chemistry", etc. But initially, this more simple and vague "Is trusted"
// quality will probably do.
export const isTrusted = {
  "Class": abs("./em1.js;get/qualities"),
  "Name": "Is trusted",
  "Elaboration": "User can be trusted to give honest and helpful scores " +
    "and comments, etc., in this network",
  "getScalarName": subjKey => "${" + subjKey +"} can be trusted",
  "Domain": abs("./em1.js;get/users"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/isTrustedDesc"),
};


// Some simple qualities that don't need much explaining (and their
// "Descriptions" should thus also be brief). These are included here mostly
// to give some examples of some non-relational qualities, and including both
// a few "gradable predicates" and a few "quantitative qualities," as we might
// call them.
export const isGood = {
  "Class": abs("./em1.js;get/qualities"),
  "Name": "Is good",
  "getScalarName": subjKey => "${" + subjKey + "} is good",
  "Domain": abs("./em1.js;get/entities"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/isGoodDesc"),
};
export const isFunny = {
  "Class": abs("./em1.js;get/qualities"),
  "Name": "Is funny",
  "getScalarName": subjKey => "${" + subjKey + "} is funny",
  "Domain": abs("./em1.js;get/entities"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/isFunnyDesc"),
};
export const isScary = {
  "Class": abs("./em1.js;get/qualities"),
  "Name": "Is scary",
  "getScalarName": subjKey => "${" + subjKey + "} is scary",
  "Domain": abs("./em1.js;get/entities"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/isScaryDesc"),
};


export const price = {
  "Class": abs("./em1.js;get/qualities"),
  "Name": "Price",
  "Elaboration": "Price (in USD)",
  "getScalarName": subjKey => "The price of ${" + subjKey + "} (in USD)",
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
  "getScalarName": subjKey => "The durability of ${" + subjKey + "} " +
    "(in years)",
  // The domain here is also too wide and varied to try narrow it down.
  "Domain": abs("./em1.js;get/entities"),
  "Metric": abs("./em1.js;get/timeInYearsMetric"),
  "Description": abs("./em1_aux.js;get/durabilityDesc"),
};


// This quality can be used to override the "Is singular statement" property
// of a text, set by the author (or rather the creator of the entity). And
// using qualities like this is indeed the correct way to override (or create
// new) boolean properties of entities, rather than using relations. 
export const isASingularStatement = {
  "Class": abs("./em1.js;get/qualities"),
  "Name": "Is a singular statement",
  "getScalarName": subjKey => "${" + subjKey + "} is a singular statement",
  "Domain": abs("./em1.js;get/texts"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/isASingularStatementDesc"),
};





/* Some useful one-to-many relations */


// The useful members to see when browsing a class.
export const members = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Members",
  "getQualityName": objKey => "Belongs to ${" + objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} belongs to " +
    "the class of ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/classes"),
  "Subject domain": abs("./em1.js;get/entities"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/membersDesc"),
};

// The useful subclasses when browsing a class and wanting to look for one or
// more subcategories of it (or to see which subcategories there are).
export const subclasses = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Subclasses",
  "getQualityName": objKey => "Is a subclass of ${" + objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is a subclass " +
    "of ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/classes"),
  "Subject domain": abs("./em1.js;get/classes"),
  "Metric": abs("./em1.js;get/gradingMetric"),
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
  "getQualityName": objKey => "Is a relevant relation for ${" + objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is a relevant " +
    "relation for ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/entities"),
  "Subject domain": abs("./em1.js;get/relations"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/relevantRelationsDesc"),
};

// Same as the above, but where the object of the relation is not the entity
// itself but its class. This is very useful as it allows you to define useful
// relations for a whole class at once.
export const relationsForMembers = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Relations for members",
  "getQualityName": objKey => "Is a relevant relation for members of ${" +
    objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is a relevant " +
    "relation for the members of ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/classes"),
  "Subject domain": abs("./em1.js;get/relations"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/relationsForMembersDesc"),
};

// This class is useful e.g. if you want to have a tab menu where selecting a
// tab (based on a given relation) will spawn "sub-tabs" of that tab (which are
// then "sub-relations" of that relation).
export const subRelations = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Sub-relations",
  "getQualityName": objKey => "Is a relevant sub-relation of ${" + objKey +
    "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is a relevant " +
    "sub-relation of ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/relations"),
  "Subject domain": abs("./em1.js;get/relations"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/subRelationsDesc"),
};

// Relevant qualities for users to see, score, and search on for a given entity.
export const relevantQualities = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Qualities",
  "getQualityName": objKey => "Is a relevant quality for ${" + objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is a relevant " +
    "quality for ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/entities"),
  "Subject domain": abs("./em1.js;get/qualities"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/relevantQualitiesDesc"),
};

// Relevant qualities for users to see, score, and search on in general for
// entities of a given class.
export const qualitiesForMembers = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Qualities for members",
  "getQualityName": objKey => "Is a relevant quality for members of ${" +
    objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is a relevant " +
    "quality for the members of ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/classes"),
  "Subject domain": abs("./em1.js;get/qualities"),
  "Metric": abs("./em1.js;get/gradingMetric"),
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
  "getQualityName": objKey => "Is a relevant sub-quality of ${" + objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is a relevant " +
    "sub-quality of ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/qualities"),
  "Subject domain": abs("./em1.js;get/qualities"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/subQualitiesDesc"),
};



/* Some comment and discussion-related relations */

// All entities can be commented on by users, at least in principle, including
// not least text entities. And since comments are themselves text entities,
// it means that each comment can get its own set of comments, on so on. 
export const commentsRelation = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Comments",
  "getQualityName": objKey => "Is a relevant comment about ${" + objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is a relevant " +
    "comment about ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/entities"),
  "Subject domain": abs("./em1.js;get/comments"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/commentsRelationDesc"),
};

// 'Questions and facts,' or 'Q&F' for short, is meant to include texts (not
// just comments targeted at the specific object in question) that contain
// either a relevant fact or a relevant question about the object. 
export const questionsAndFacts = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Q&F",
  "Elaboration": "Questions and facts",
  "getQualityName": objKey => "Is a relevant question or fact relating to ${" +
    objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is a " +
    "relevant question or fact relating to ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/entities"),
  "Subject domain": abs("./em1.js;get/texts"),
  "Metric": abs("./em1.js;get/gradingMetric"),
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
  "getQualityName": objKey => "Is a relevant discussion relating to ${" +
    objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is a " +
    "relevant discussion relating to ${" + objKey + "} (somehow)",
  "Object domain": abs("./em1.js;get/entities"),
  "Subject domain": abs("./em1.js;get/texts"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/discussionDesc"),
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
  "getQualityName": objKey => "Is a relevant reaction comment for ${" +
    objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is a " +
    "relevant reaction comment for ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/entities"),
  "Subject domain": abs("./em1.js;get/comments"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/reactionsDesc"),
};




// It will often be worth to be able to argue about either the "correctness" or
// the "probability" of a given text, depending on whether it is a "singular
// statement" or a compound one. Therefore, when an entity is displayed in the
// app, either on its own "entity page," as we call it here, or among other
// entities in a list (displayed as what we here call "entity elements"), it
// might be worthwhile to show a tab of 'Arguments,' which is what the following
// relation is for.
// A possible layout for this "tabbed page" could be to have the "correctness"
// or the "probability" scalar displayed at the top of the page, depending of
// course on whether the text is a "singular statement" or not. The user can
// then see the score of the given scalar here, and potentially submit their
// own score. And underneath this display, we could have the actual section of 
// "Arguments" for this scalar.
// Now, as can be seen below, we actually take 'Scalars' to be the "Subject
// domain" of this 'Arguments' relation, meaning that the relation is purely
// between scalars, namely with the correctness or probability scalar of the
// text entity as the object, and with other scalars as the subjects. But when
// any one of these "arguments" is itself a correctness or probability scalar,
// with another text as the subject of this scalar, we should make sure to show
// that text directly in the list, such that it can be read immediately without
// having to click on it first (or at least the first part can be read, if it's
// a longer text). So while 'Arguments' relation is purely between scalars, it
// can thus also still be used to relate texts to texts.
// The advantage of using 'Scalars' for the domains of the relation instead of
// just 'Texts,' however, is first of all that it means that other kinds of
// qualities can also be used directly as arguments. For instance, if the text
// discusses whether some product is worth buying or not, a relevant argument
// might simply be the 'Price' scalar directly, just to give one example. And
// more importantly, since the "Object domain" consists of all 'Scalars,' it
// means that all scalars can be discussed in the same way. So if we e.g. have
// the 'Is good' quality in relation to some movie, we can also allow the users
// to go to an 'Arguments' tab here, and see what kinds of arguments users have
// proposed for why the movie is good, be it textual arguments or other kinds
// scalars, such as e.g. 'Is funny,' or 'Has good acting,' and so on. 
// It should also be noted that we don't distinguish between pros and cons here
// when it comes to the relevant subjects of the 'Arguments' relation. So a
// counterargument is thus also considered an 'argument' here. So in order to
// distinguish what arguments are pros and what are cons in the list, we will
// instead use a "correlation" relation, which is introduced below. And since
// this correlation relation is a scalar one, like relations in this semantic
// system, it means that we can also use its scores to show *how much* a given
// argument is regarded as impacting the object of the discussion, namely the
// object scalar. For instance, if the correlation has a score that's close to
// 1, it means that an increment in the argument scalar (either due to being
// evaluated by more users, or if a new "sub-argument" has come to light,
// making users change their opinions) should be correlated with a relatively
// large increment in score for the object scalar as well. And if the
// correlation is close -1, an increment in the argument's score should
// correlate with a relatively large decrement in the score of the object
// scalar. You get the picture (hopefully).
// So when showing the list of "arguments" for a given scalar, it is thus
// important to also show these correlation scores as well, along with the
// scores of the argument scalars themselves.
export const argumentsRelation = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Arguments",
  "getQualityName": objKey => "Is a relevant argument for ${" + objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is a " +
    "relevant argument for ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/scalars"),
  "Subject domain": abs("./em1.js;get/scalars"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/argumentsRelationDesc"),
};



// This "correlation" relation was introduced above in the comment for the
// 'Arguments' relation. TODO: Be more precise about the semantics of this
// relation in that comment, and also state that it should only be used between
// scalars with bounded ranges. And also, move the comment down here instead,
// and reference it above rather than the other way around. 
export const correlation = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Correlated scalars",
  "getQualityName": objKey => "Correlation with ${" + objKey + "}",
  "getScalarName": (objKey, subjKey) => "Correlation between ${" + subjKey +
    "} and ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/scalars"),
  "Subject domain": abs("./em1.js;get/scalars"),
  "Metric": abs("./em1.js;get/fromMinusToPlusOneMetric"),
  "Description": abs("./em1_aux.js;get/correlationDesc"),
};




/* Some useful one-to-one relations (we we might also refer to as 'property
 * relations'). */


// This is the 'Areas of concern' relation that was mentioned above, which can
// be used to determine the "Area of concern" property of qualities, classes,
// and other entities, instead of relying solely on the corresponding
// property (which, as one can clearly see in this document, is not always
// defined).
export const areaOfConcern = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Area of concern",
  "getQualityName": objKey => "A fitting Area of concern for ${" + objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is a fitting " +
    "area of concern for ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/entities"),
  "Subject domain": abs("./em1.js;get/areasOfConcern"),
  "Metric": abs("./em1.js;get/gradingMetric"),
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
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is a good " +
    "entity page component for members of ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/classes"),
  "Subject domain": abs("./em1.js;get/components"),
  "Area of concern": "./em1.js;get/uiAoC",
  "Metric": abs("./em1.js;get/gradingMetric"),
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
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is a good " +
    "entity element component for members of ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/classes"),
  "Subject domain": abs("./em1.js;get/components"),
  "Area of concern": "./em1.js;get/uiAoC",
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/entityElementDesc"),
};




