



// Apps are components that are meant to work in a self-contained way, outside
// of any specific surrounding context, as opposed to components that are
// supposed to be used within a given app.
export const apps = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Apps",
  "Superclass": abs("./em1.js;get/entities"),
  "Common properties": [

    // The "parent class" of an app is a class of apps that implement the same
    // thing, so to speak. These implementations will typically share the same
    // app name as the root of their names, possibly followed by version
    // identifiers. And this means that the name of the given app class should
    // often just be that same root. For instance, if you have a new idea for
    // e.g. a SoMe app, call it "FriendBook," then the parent class of all the
    // 'App' entities that implements this "FriendBook" app ought to be called
    // simply "FriendBook," whereas the 'App' entities themselves should all be
    // called "FriendBook" followed by some version identifier(s).
    // The parent class of an App should always either have this 'Apps' class
    // as its "Superclass" property, or a class that has this 'Apps' class as a
    // superclass ancestor.
    // When a user views an 'App' entity, they should be given the option to
    // "pin" the app to its "parent class," as well as any superclass ancestors
    // of that class that the user desires.
    "Parent class",

    // The JSX component that implements the app.
    "Component",
  ],
  "Description": "The class of all user-programmed apps.",
};


// Features *can* be specific components with a specific purpose that appears
// inside of an app, but they can also be more general things, such as a
// specific algorithm, or a layout/style of an app, or a new button/option that
// is added to existing components.    
export const features = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Features",
  "Superclass": abs("./em1.js;get/entities"),
  "Common properties": [

    // Features also have a "parent class" property, which is specifically used
    // in order for the users to be able to "pin" a feature to its parent class
    // (and potentially superclasses of that class as well). And this can
    // potentially be used by the apps that implements the given class of
    // feature to make the app better tailored specifically to the user, namely
    // by selecting the specific feature that the user has "pinned" to a given
    // class with the highest priority. (You should also be able to choose a
    // "priority" whenever you "pin" an app or a feature.)
    "Parent class",

    // A route to the implementation of the feature. This might for instance be
    // a JS module or a JSX module that implements it, but it could also be a
    // route to a specific function, or something else. That depends on the
    // kind of feature.
    "Implementation", 

    // A JSX component that showcases the the feature.
    "Example component",
  ],
  "Description": "A class of all \"features\" that an app might use.",
};





export const socialMedia = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Social media",
  "Superclass": abs("./em3.js;get/apps"),
  "Description": "All apps related to social media.",
};

export const blogging = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Blogging",
  "Superclass": abs("./em3.js;get/apps"),
  "Description": "All apps related to blogging, both specific " +
    "blogs as well as apps that serves as indexes for blogs.",
};

export const startApps = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Start apps",
  "Superclass": abs("./em3.js;get/apps"),
  "Description": "All apps that can be used as the start app for " +
    "the website, serving as an index page for it.",
};



// An app idea consists of a text and potentially an example component that
// showcases the idea.
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
    "that showcases the idea. Note that the example component can also " +
    "be a whole web page that showcases several different examples within it.",
};



export const appIdeasRel = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "App ideas",
  "getQualityName": objKey => "Is a relevant idea for ${" + objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is a relevant " +
    "idea for ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/entities"),
  "Subject domain": abs("./em3.js;get/appIdeas"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/membersDesc"),
};




// These two following relations might potentially be used in the future, but
// we'll see.
export const supportingApps = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Supporting apps",
  "getQualityName": objKey => "Supports ${" + objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} supports " +
    "${" + objKey + "}",
  "Object domain": abs("./em3.js;get/features"),
  "Subject domain": abs("./em3.js;get/apps"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/membersDesc"),
};
export const supportedFeatures = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Supported features",
  "getQualityName": objKey => "Is supported by ${" + objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is supported by " +
    "${" + objKey + "}",
  "Object domain": abs("./em3.js;get/apps"),
  "Subject domain": abs("./em3.js;get/features"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/membersDesc"),
};
