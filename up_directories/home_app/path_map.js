

export default {
  maps: {"/": {
    "/{{this}}/semantic_entities":  "/{{this}/{semantic_entities}}",
    "/{{this}}/home_app":           "/{{this}/{home_app}}",
    "/{{this}}/file_browser":       "/{{this}/{file_browser}}",
    "/{{this}}/app_browser":        "/{{this}/{app_browser}}",
    "/{{this}}/utilities":          "/{{this}/{utilities}}",
    "/{{this}}/home_app_01":        "/{{this}/{home_app_01}}",
    "/{{this}}/flip_game":          "/{{this}/{flip_game}}",
    "/{{this}}/flip_game_01":       "/{{this}/{flip_game_01}}",
    "/{{this}}/untrusted_example":  "/{{this}/{untrusted_example}}",
    "/{{this}}/mastermind":         "/{{this}/{mastermind}}",
    "/{{this}}/mastermind_01":      "/{{this}/{mastermind_01}}",
    "/{{this}}/examples":           "/{{this}/{examples}}",
  }},
}

export const nodeID = "{{this}}";

export const directories = {
  "semantic_entities":  "{{this}{semantic_entities}}",
  "home_app":           "{{this}{home_app}}",
  "file_browser":       "{{this}{file_browser}}",
  "app_browser":        "{{this}{app_browser}}",
  "utilities":          "{{this}{utilities}}",
  "home_app_01":        "{{this}{home_app_01}}",
  "flip_game":          "{{this}{flip_game}}",
  "flip_game_01":       "{{this}{flip_game_01}}",
  "untrusted_example":  "{{this}{untrusted_example}}",
  "mastermind":         "{{this}{mastermind}}",
  "mastermind_01":      "{{this}{mastermind_01}}",
  "examples":           "{{this}{examples}}",
};
