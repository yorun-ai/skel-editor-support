import { builtinTypes, keywords } from "./language.js";

const skelLanguageConfiguration = Object.freeze({
  comments: { lineComment: "//", blockComment: ["/*", "*/"] },
  brackets: [["{", "}"], ["[", "]"], ["(", ")"], ["<", ">"]],
  autoClosingPairs: [
    { open: "{", close: "}" }, { open: "[", close: "]" }, { open: "(", close: ")" },
    { open: "<", close: ">" }, { open: "\"", close: "\"" }
  ],
  surroundingPairs: [
    { open: "{", close: "}" }, { open: "[", close: "]" }, { open: "(", close: ")" },
    { open: "<", close: ">" }, { open: "\"", close: "\"" }
  ]
});

// Monaco's Monarch compiler adds internal fields to the language definition.
// Keep this object mutable even though consumers should treat it as read-only.
const skelMonarch = {
  defaultToken: "",
  tokenPostfix: ".skel",
  keywords,
  builtinTypes,
  tokenizer: {
    root: [
      [/\s+/, "white"],
      [/\/\//, "comment", "@lineComment"],
      [/\/\*/, "comment", "@blockComment"],
      [/"""/, "string", "@tripleString"],
      [/"(?:\\.|[^"\\])*"/, "string"],
      [/@[A-Za-z_][A-Za-z0-9_]*/, "annotation"],
      [/[A-Za-z_][A-Za-z0-9_]*/, { cases: { "@keywords": "keyword", "@builtinTypes": "type", "@default": "identifier" } }],
      [/\d+(?:\.\d+)?/, "number"],
      [/[?=*]/, "operator"],
      [/[{}()[\]<>]/, "@brackets"],
      [/[.,:;]/, "delimiter"]
    ],
    lineComment: [[/.*$/, "comment", "@pop"]],
    blockComment: [[/[^*]+/, "comment"], [/\*\//, "comment", "@pop"], [/\*/, "comment"]],
    tripleString: [[/[^\"]+/, "string"], [/"""/, "string", "@pop"], [/\"/, "string"]]
  }
};

function registerSkelMonaco(monaco) {
  monaco.languages.register({ id: "skel", extensions: [".skel"], aliases: ["Skel", "skel"] });
  monaco.languages.setLanguageConfiguration("skel", skelLanguageConfiguration);
  monaco.languages.setMonarchTokensProvider("skel", skelMonarch);
}

export { registerSkelMonaco, skelLanguageConfiguration, skelMonarch };
export default skelMonarch;
