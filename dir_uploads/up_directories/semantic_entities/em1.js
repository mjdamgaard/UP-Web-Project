
// First entity module (EM) with some initial entities, not least the
// 'Entities' class and the 'Classes' class which are fundamental to the
// whole semantic system.


export const entities = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "All entities",
  "Superclass": undefined,
  "Description": abs("./em1_aux.js;get/entitiesDesc")
};

export const classes = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Classes",
  "Superclass": abs("./em1.js;get/entities"),
  "Variable attributes" : {
    "Name": "string",
    ["Superclass=" + abs("./em1.js;get/entities")]: abs("./em1.js;get/classes"),
    "Description": "text",
  },
  "Description": abs("./em1_aux.js;get/classesDesc")
};