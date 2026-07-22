import type * as Monaco from "monaco-editor";

export declare const skelLanguageConfiguration: Monaco.languages.LanguageConfiguration;
export declare const skelMonarch: Monaco.languages.IMonarchLanguage;
export declare function registerSkelMonaco(monaco: typeof Monaco): void;
export default skelMonarch;
