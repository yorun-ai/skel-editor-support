import { LanguageSupport, StreamLanguage } from "@codemirror/language";
import { builtinTypeSet, keywordSet } from "./language.js";

function readDelimited(stream, state, delimiter, stateField, tokenType) {
  if (stream.skipTo(delimiter)) {
    stream.match(delimiter);
    state[stateField] = false;
  } else {
    stream.skipToEnd();
  }
  return tokenType;
}

const skelStreamParser = {
  name: "skel",
  startState() {
    return { blockComment: false, tripleString: false };
  },
  token(stream, state) {
    if (state.blockComment) return readDelimited(stream, state, "*/", "blockComment", "comment");
    if (state.tripleString) return readDelimited(stream, state, '"""', "tripleString", "string");
    if (stream.eatSpace()) return null;
    if (stream.match("//")) {
      stream.skipToEnd();
      return "comment";
    }
    if (stream.match("/*")) {
      state.blockComment = true;
      return readDelimited(stream, state, "*/", "blockComment", "comment");
    }
    if (stream.match('"""')) {
      state.tripleString = true;
      return readDelimited(stream, state, '"""', "tripleString", "string");
    }
    if (stream.match(/"(?:\\.|[^"\\])*(?:"|$)/)) return "string";
    if (stream.match(/@[A-Za-z_][A-Za-z0-9_]*/)) return "meta";
    if (stream.match(/\d+(?:\.\d+)?/)) return "number";
    if (stream.match(/[A-Za-z_][A-Za-z0-9_]*/)) {
      const word = stream.current();
      if (keywordSet.has(word)) return "keyword";
      if (builtinTypeSet.has(word)) return "typeName";
      if (/^[A-Z]/.test(word)) return "className";
      return "variableName";
    }
    if (stream.match(/[?=*]/)) return "operator";
    if (stream.match(/[{}()[\]<>.,:;]/)) return "punctuation";
    stream.next();
    return null;
  }
};

const skelLanguage = StreamLanguage.define(skelStreamParser);

function skel() {
  return new LanguageSupport(skelLanguage);
}

export { skel, skelLanguage, skelStreamParser };
export default skel;
