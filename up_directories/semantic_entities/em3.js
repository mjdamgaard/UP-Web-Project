

// 'Apps' is a subclass of Components that are meant as standalone
// applications. Rather than being defined by a"Component path," they are
// defined by a home directory, which is supposed to contain a main.jsx module
// defining the app. (This directory is also meant to contain an api.js module
// defining the URL API of the app, by the way.)   
export const apps = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Apps",
  "Superclass": abs("./em1.js;get/components"),
  "Common properties": [
    "App directory ID", "No margins", "No header", "Is a prototype",
    "Public repository", "Creator(s)",
  ],
  "Description": "The class of all user-programmed apps.",
};



// The (successive) 'Versions' of a given app, which we will also sometimes
// refer to as the 'sub-apps,' are apps that extends the given app, or
// implements it more fully (e.g. in case the given app is a prototype). This
// relation can thus be used to form a tree of apps, where each child node is
// an app that extends/implements the app of the parent node. (Actually, we
// should say a 'directional graph' rather than a 'tree,' since an app can
// implement/extend several different parent nodes.) For instance, a SoMe app
// might have a basic prototype app at the root of its "tree"/dir. graph which
// just implements a a post feed from all your connections. The list of
// successive versions might then contain a new app prototype that also
// implements private messages, and another app that implements groups, and yet
// another app that doesn't add any new features but simply improves on the UI
// of the starting prototype. And once you make an app that does all these
// three things at the same time, you might add that as a successor to any and
// all these children (which is how different branches of the "tree" can end
// up pointing to the same node).
// It is important to note that you don't want to just up-rate the newest and
// best implementation of the app directly as a relevant, *successive* version
// to the root app itself, namely since you want the resulting "app tree" to
// essentially branch with only one added feature/concept at a time, such that
// the users can explore different versions of the app, and each be able to
// select their own preferred version.
export const versionsRel = {
  "Class": abs("./em1.js;get/relations"),
  "Name": "Versions",
  "getQualityName": objKey => "Is a relevant successive version of ${" +
    objKey + "}",
  "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is a relevant " +
    "successive version of ${" + objKey + "}",
  "getClassName": objKey => "Versions of ${" + objKey + "}",
  "Object domain": abs("./em3.js;get/apps"),
  "Subject domain": abs("./em3.js;get/apps"),
  "Metric": abs("./em1.js;get/gradingMetric"),
  "Description": "TODO: Write description.",
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
export const appBrowserApps = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "App browsers",
  "Superclass": abs("./em3.js;get/apps"),
  "Description": "Apps used to browse other apps.",
};



// // Features can be anything regarding the UI or the functions of an app. It can
// // for instance be a specific component with a specific purpose, or a specific
// // algorithm, or a layout/style of an app, or a new button/option that is
// // added to existing components. A feature can also be having the option to
// // adjust and personalize the settings of an app, possibly in order to choose
// // between a set of other features.
// // Similarly to the 'App' entities above, 'Feature' entities only describes the
// // vision of the feature, through their "Description" property, and possibly a
// // "Prototype" property.
// export const features = {
//   "Class": abs("./em1.js;get/classes"),
//   "Name": "Features",
//   "Superclass": abs("./em1.js;get/entities"),
//   "Common properties": [
//     // (Optional) Similar to the "Prototype" property for 'Apps' above.
//     "Prototype",
//   ],
//   "Description": "A class of all \"features\" that an app might use.",
// };


// // When browsing an app, you should be able to explore what features other
// // users have suggested for the given app.
// export const featuresRel = {
//   "Class": abs("./em1.js;get/relations"),
//   "Name": "Features",
//   "getQualityName": objKey => "Is a possible feature for ${" + objKey + "}",
//   "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is a possible " +
//     "feature for ${" + objKey + "}",
//   "getClassName": objKey => "Features for ${" + objKey + "}",
//   "Object domain": abs("./em1.js;get/entities"),
//   "Subject domain": abs("./em3.js;get/features"),
//   "Metric": abs("./em1.js;get/gradingMetric"),
//   "Description": abs("./em1_aux.js;get/membersDesc"),
// };



// // 'Feature versions' are specific implementations of a given feature.
// export const featureVersions = {
//   "Class": abs("./em1.js;get/classes"),
//   "Name": "Feature versions",
//   "Superclass": abs("./em1.js;get/entities"),
//   "Common properties": [
//     // The feature entity that this entity is a version of.
//     "Feature",
//     // A component entity that showcases and/or documents the app version.
//     "Example component",
//     // The component entity that actually implements the app.
//     "Implementation",
//   ],
//   "Description": "The class of all user-programmed apps.",
// };


// // The relation to connect an app with its versions.
// export const featureVersionsRel = {
//   "Class": abs("./em1.js;get/relations"),
//   "Name": "Versions",
//   "getQualityName": objKey => "Is a version of ${" + objKey + "}",
//   "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is a version " +
//     "of ${" + objKey + "}",
//   "getClassName": objKey => "Versions of ${" + objKey + "}",
//   "Object domain": abs("./em3.js;get/apps"),
//   "Subject domain": abs("./em3.js;get/featureVersions"),
//   "Metric": abs("./em1.js;get/gradingMetric"),
//   "Description": abs("./em1_aux.js;get/membersDesc"),
// };


// // 'Relevant features' to a feature will typically be "sub-features," i.e.
// // features that are within / part of the given feature. (But they can also be
// // external features, as long as they are still relevant somehow.) 
// export const relevantFeatures = {
//   "Class": abs("./em1.js;get/relations"),
//   "Name": "Relevant features",
//   "getQualityName": objKey => "Is a relevant feature for ${" + objKey + "}",
//   "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is a relevant " +
//     "feature for ${" + objKey + "}",
//   "getClassName": objKey => "Relevant features for ${" + objKey + "}",
//   "Object domain": abs("./em3.js;get/features"),
//   "Subject domain": abs("./em3.js;get/features"),
//   "Metric": abs("./em1.js;get/gradingMetric"),
//   "Description": abs("./em1_aux.js;get/membersDesc"),
// };



// // When you browse a feature, you should be able to go to a tab of 'Support' to
// // see what app versions already support the given feature at the current
// // moment (together with an explanation of how to access the feature in the
// // given version).
// export const supportingAppVersions = {
//   "Class": abs("./em1.js;get/relations"),
//   "Name": "Supporting app versions",
//   "getQualityName": objKey => "Supports ${" + objKey + "}",
//   "getScalarName": (objKey, subjKey) => "${" + subjKey + "} supports " +
//     "${" + objKey + "}",
//   "getClassName": objKey => "Supporting apps for ${" + objKey + "}",
//   "Object domain": abs("./em3.js;get/features"),
//   "Subject domain": abs("./em3.js;get/appVersions"),
//   "Metric": abs("./em1.js;get/gradingMetric"),
//   "Description": abs("./em1_aux.js;get/membersDesc"),
// };

// export const supportedFeatures = {
//   "Class": abs("./em1.js;get/relations"),
//   "Name": "Supported features",
//   "getQualityName": objKey => "Is supported by ${" + objKey + "}",
//   "getScalarName": (objKey, subjKey) => "${" + subjKey + "} is supported by " +
//     "${" + objKey + "}",
//   "getClassName": objKey => "Supported features by ${" + objKey + "}",
//   "Object domain": abs("./em3.js;get/appVersions"),
//   "Subject domain": abs("./em3.js;get/features"),
//   "Metric": abs("./em1.js;get/gradingMetric"),
//   "Description": abs("./em1_aux.js;get/membersDesc"),
// };




