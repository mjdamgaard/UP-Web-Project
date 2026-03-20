


// Categories are a looser type of classes, which first of all aren't used by
// entity definitions like classes are, and whose members do not have to be
// instances of the category exactly, but can just anything that's relevant to
// see when interested in that category. Categories are also only defined by
// their Name and Description properties, which means that users can very
// easily add their own ones. And the category names don't have to be plural
// nouns like is generally the case for classes. So for instance, a sub-category
// of the 'Apps' category below might be called 'Blogging,' and thus contain
// not only specific blogs, but also other apps related to blogging.
export const categories = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Categories",
  "Superclass": abs("./em1.js;get/entities"),
  "Common properties": [],
  "Description": "Categories are defined only by their name and " +
    "description. Their members do not necessarily have to be of the same" +
    "class, but can be anything that is relevant to see under the given " +
    "category.",
};


export const members = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Members",
  "getQualityName": objKey => "Belongs to ${" + objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} belongs to " +
    "the category of ${" + objKey + "}",
  "Object domain": abs("./em3.js;get/categories"),
  "Subject domain": abs("./em3.js;get/categories"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/membersDesc"),
};

export const subcategories = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Subcategories",
  "getQualityName": objKey => "Is a subcategory of ${" + objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is a subcategory " +
    "of ${" + objKey + "}",
  "Object domain": abs("./em3.js;get/categories"),
  "Subject domain": abs("./em3.js;get/categories"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/subclassesDesc"),
};


// 'Apps' is a category, where users are meant to be able to easily upload
// their own subcategories, such as 'Social media,' 'Blogging,' 'Tools,'
// 'Knowledge sharing,' etc.
export const appsCat = {
  "Class": abs("./em3.js;get/categories"),
  "Name": "Apps",
  "Description": "All user-programmed apps.",
};

export const socialMedia = {
  "Class": abs("./em3.js;get/categories"),
  "Name": "Social media",
  "Description": "All apps related to social media.",
};

export const blogging = {
  "Class": abs("./em3.js;get/categories"),
  "Name": "Blogging",
  "Description": "All apps related to blogging, both specific " +
    "blogs as well as apps that serves as indexes for blogs.",
};


// Topics is a category that can be used very broadly. It might serve as a good
// entry into the whole semantic graph, as nearly all things can be grouped
// under topics. 
export const topics = {
  "Class": abs("./em3.js;get/categories"),
  "Name": "Topics",
  "Description": "All topics in the world.",
};



// The members of this 'Apps' class are not specific JSX components, but rather
// a set of all JSX components that implements the overall vision for the given
// app. So the main defining property of an 'App' entity is thus its
// description, really, along with its name. The entity might also have an
// "Initial implementation" property in the form of a JSX component, but as the
// name suggests, this is only meant as a help to showcase an initial prototype
// of what the vision for the app is.
// Note that 'Apps' are also meant to be stand-alone apps, and not modules/
// widgets inside other apps. At some point we might thus introduce a similar
// class, maybe called 'Widgets' or 'App modules,' which is similar to this
// class, but instead for all components that are *not* stand-alone apps.
export const apps = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Apps",
  "Superclass": abs("./em1.js;get/entities"),
  "Common properties": [
    // Along with the app name, the app entity might also include some
    // identifier for the version of the app. Note that a 'version' of an app
    // here does not mean an implementation, but rather an 'App' entity that is
    // related to the initial 'App' entity of the same name, but has a vision/
    // description that is altered in some way. Thus, each "version" of an app
    // might thus also have several implementations.
    "Version identifier",

    // An optional property pointing to the parent version of the given app.
    "Parent version",

    // An initial JSX component that showcases the vision for the app.
    "Initial implementation",
  ],
  "Description": "A class of apps where each member might have more than " +
    "one implementation. These 'App' entities are thus defined mainly by " +
    "their name and description, which defines the vision for the given app.",
};


export const versions = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Versions",
  "getQualityName": objKey => "Is a version of ${" + objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is a version " +
    "of ${" + objKey + "}",
  "Object domain": abs("./em3.js;get/apps"),
  "Subject domain": abs("./em3.js;get/apps"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/membersDesc"),
};

export const implementations = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Implementations",
  "getQualityName": objKey => "Is an implementation of ${" + objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is an " +
    "implementation of ${" + objKey + "}",
  "Object domain": abs("./em3.js;get/apps"),
  "Subject domain": abs("./em1.js;get/components"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/membersDesc"),
};

export const ideas = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Members",
  "getQualityName": objKey => "Belongs to ${" + objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} belongs to " +
    "the category of ${" + objKey + "}",
  "Object domain": abs("./em3.js;get/apps"),
  "Subject domain": abs("./em3.js;get/appIdeas"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/membersDesc"),
};


// An app idea consists of a text and potentially an example component that
// showcases the idea (while not fully implementing it yet; otherwise it could
// just be added as an implementation straightaway).
export const appIdeas = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "App ideas",
  "Superclass": abs("./em1.js;get/entities"),
  "Common properties": [
    // A text describing the idea.
    "Text",
    // A component that showcases the idea in some way. 
    "Example component",
  ],
  "Description": "A class of app ideas, which consist first and foremost of " +
    "a text describing the idea, and potentially also an example component " +
    "that can showcase the idea (but does not have to be a full " +
    "implementation of the idea). Note that the example component can also " +
    "be a whole web page that showcases several different examples within it.",
};