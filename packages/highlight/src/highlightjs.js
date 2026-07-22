import { builtinTypes, keywords } from "./language.js";

function skelHighlightJs(hljs) {
  return {
    name: "Skel",
    aliases: ["skel"],
    keywords: {
      keyword: keywords.join(" "),
      type: builtinTypes.join(" ")
    },
    contains: [
      hljs.COMMENT("//", "$"),
      hljs.COMMENT("/\\*", "\\*/"),
      { scope: "string", begin: /"""/, end: /"""/ },
      { scope: "string", begin: /"/, end: /"/, contains: [hljs.BACKSLASH_ESCAPE] },
      { scope: "meta", begin: /@[A-Za-z_][A-Za-z0-9_]*/ },
      hljs.C_NUMBER_MODE,
      { scope: "title.class", begin: /\b[A-Z][A-Za-z0-9_]*\b/ }
    ]
  };
}

export { skelHighlightJs };
export default skelHighlightJs;
