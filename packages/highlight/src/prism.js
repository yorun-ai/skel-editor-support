import { builtinTypes, entryKeywords, identifierPattern, keywords } from "./language.js";

const keywordPattern = new RegExp(`\\b(?:${keywords.join("|")})\\b`);
const builtinPattern = new RegExp(`\\b(?:${builtinTypes.join("|")})\\b`);
const declarationNamePattern = new RegExp(`(\\b(?:${entryKeywords.join("|")})\\s+)${identifierPattern}`);
const functionNamePattern = new RegExp(`(\\b(?:method|action|check)\\s+)${identifierPattern}`);

const skelPrism = Object.freeze({
  comment: [
    { pattern: /\/\*(?:[\s\S]*?\*\/|[\s\S]*)/, greedy: true },
    { pattern: /\/\/.*$/m, greedy: true }
  ],
  string: [
    { pattern: /"""(?:[\s\S]*?"""|[\s\S]*)/, greedy: true },
    { pattern: /"(?:\\.|[^"\\])*(?:"|$)/m, greedy: true }
  ],
  decorator: {
    pattern: /@[A-Za-z_][A-Za-z0-9_]*/,
    alias: "annotation"
  },
  "class-name": {
    pattern: declarationNamePattern,
    lookbehind: true
  },
  function: {
    pattern: functionNamePattern,
    lookbehind: true
  },
  keyword: keywordPattern,
  builtin: builtinPattern,
  number: /\b\d+(?:\.\d+)?\b/,
  "type-reference": {
    pattern: /\b[A-Z][A-Za-z0-9_]*\b/,
    alias: "class-name"
  },
  operator: /[?=*]/,
  punctuation: /[{}()[\]<>.,:;]/
});

function registerSkelPrism(Prism) {
  Prism.languages.skel = skelPrism;
  return skelPrism;
}
registerSkelPrism.displayName = "skel";
registerSkelPrism.aliases = [];

export { registerSkelPrism, skelPrism };
export default skelPrism;
