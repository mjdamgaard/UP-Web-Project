

// A class of apps, where each app can have several implementations/versions
// of itself. The app entities thus only defines the overall goal of the app,
// in their Description property. And they might also come with an initial
// prototype component.
export const apps = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Apps",
  "Superclass": abs("./em1.js;get/entities"),
  "Common properties": [
    // (Optional) A prototype component entity showcasing the idea and the
    // purpose behind the app. Note that this component might also be a text
    // page, either with embedded examples showcasing the visions, or with
    // links to such examples.
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



// Features can be anything regarding the UI or the functions of an app. It can
// for instance be a specific component with a specific purpose, or a specific
// algorithm, or a layout/style of an app, or a new button/option that is
// added to existing components. A feature can also be having the option to
// adjust and personalize the settings of an app, possibly in order to choose
// between a set of other features.
// Similarly to the 'App' entities above, 'Feature' entities only describes the
// vision of the feature, through their "Description" property, and possibly a
// "Prototype" property. And then similarly to the 'Versions' relation for
// apps, the feature entities have an 'Implementations' relation where users
// can post their implementations of the given feature. 
export const features = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Features",
  "Superclass": abs("./em1.js;get/entities"),
  "Common properties": [
    // (Optional) Similar to the "Prototype" property for 'Apps' above.
    "Prototype",
  ],
  "Description": "A class of all \"features\" that an app might use.",
};


// When browsing an app, you should be able to explore what features other
// users have suggested for the given app.
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


// The 'implementations' of a given feature are a list of components that
// showcases a specific implementation of the given feature. (These components
// can include (or link to) their own documentation for how the implemented
// feature cna be installed in an app.)
export const implementations = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Implementations",
  "getQualityName": objKey => "Is an implementation of ${" + objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is an " +
  "implementation of ${" + objKey + "}",
  "getClassName": objKey => "Implementations of ${" + objKey + "}",
  "Object domain": abs("./em3.js;get/features"),
  "Subject domain": abs("./em1.js;get/components"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": abs("./em1_aux.js;get/membersDesc"),
};



// When you browse a feature, you should be able to go to a tab of 'Support' to
// see what app versions already support the given feature at the current
// moment (together with an explanation of how to access the feature in the
// given version).
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




