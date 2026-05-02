
import * as TextDisplayCSS from "./TextDisplay.css";
import * as mainStyleCSS from "../root_app/style.css";

export const transform = {
  styleSheets: [TextDisplayCSS, mainStyleCSS],
  childRules: [{key: "*", transform: "copy"}],
};
