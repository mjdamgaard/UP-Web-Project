

// A class of apps, where each app can have several implementations/versions
// of itself. The app entities thus only defines the overall goal of the app,
// in their Description property. And they might also come with an initial
// prototype component.
export const apps = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Apps",
  "Superclass": abs("./em1.js;get/entities"),
  "Common properties": [
    // (Optional) A prototype component showcasing the idea and the purpose
    // behind the app. This property ought to reference a component entity
    // rather than a JSX component directly.
    "Prototype",
  ],
  "Description": "The class of all user-programmed apps.",
};


// Some app subclasses:
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



// The 'versions' of an app are the component entities that implements the
// app (following the overall vision defined by the app's description and
// possibly its prototype).
export const versions = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Versions",
  "getQualityName": objKey => "Is a version of ${" + objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is a version " +
    "of ${" + objKey + "}",
  "getClassName": objKey => "Versions of ${" + objKey + "}",
  "Object domain": abs("./em3.js;get/apps"),
  "Subject domain": abs("./em1.js;get/components"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/membersDesc"),
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
    // A route to the implementation of the feature. This might for instance be
    // a JS module or a JSX module that implements it, but it could also be a
    // route to a specific function, or something else. That depends on the
    // kind of feature.
    "Implementation", 

    // A component (entity) that showcases the the feature.
    "Example component",
  ],
  "Description": "A class of all \"features\" that an app might use.",
};


// When browsing an app, you should be able to explore what features other
// users have suggested for the given app. These 'features' should come with a
// prototype, in the form of the "Example component," such that users can
// immediately try them out and rate them. And when you browse a feature, you
// should be able to go to a tab of 'Support' to see what app versions already
// support the given feature at the current moment (together with an
// explanation of how to access the feature in the given version).
export const featuresRel = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Features",
  "getQualityName": objKey => "Is a possible feature for ${" + objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is a possible " +
    "feature for ${" + objKey + "}",
  "getClassName": objKey => "Features for ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/entities"),
  "Subject domain": abs("./em3.js;get/features"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/membersDesc"),
};


export const supportingAppVersions = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Supporting app versions",
  "getQualityName": objKey => "Supports ${" + objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} supports " +
    "${" + objKey + "}",
  "getClassName": objKey => "Supporting apps for ${" + objKey + "}",
  "Object domain": abs("./em3.js;get/features"),
  "Subject domain": abs("./em1.js;get/components"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/membersDesc"),
};

export const supportedFeatures = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Supported features",
  "getQualityName": objKey => "Is supported by ${" + objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is supported by " +
    "${" + objKey + "}",
  "getClassName": objKey => "Supported features by ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/components"),
  "Subject domain": abs("./em3.js;get/features"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/membersDesc"),
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
    // A component (entity) that showcases the idea in some way. 
    "Example component",
  ],
  "Description": "A class of app ideas, which each first of all consist of " +
    "a text describing the idea, and potentially also an example component " +
    "that showcases the idea.",
};



export const appIdeasRel = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "App ideas",
  "getQualityName": objKey => "Is a relevant idea about ${" + objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is a relevant " +
    "idea about ${" + objKey + "}",
  "getClassName": objKey => "Ideas about ${" + objKey + "}",
  "Object domain": abs("./em1.js;get/entities"),
  "Subject domain": abs("./em3.js;get/appIdeas"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/membersDesc"),
};




