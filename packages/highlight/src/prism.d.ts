import type Prism from "prismjs";

export declare const skelPrism: Prism.Grammar;
export declare const registerSkelPrism: ((prism: typeof Prism) => Prism.Grammar) & {
  displayName: "skel";
  aliases: string[];
};
export default skelPrism;
