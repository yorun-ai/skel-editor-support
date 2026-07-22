import type { LanguageSupport, StreamLanguage, StreamParser } from "@codemirror/language";

type SkelState = {
  blockComment: boolean;
  tripleString: boolean;
};

export declare const skelStreamParser: StreamParser<SkelState>;
export declare const skelLanguage: StreamLanguage<SkelState>;
export declare function skel(): LanguageSupport;
export default skel;
