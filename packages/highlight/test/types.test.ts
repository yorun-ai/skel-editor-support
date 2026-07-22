import { createHighlighter } from "shiki";
import skel, { skel as namedSkel } from "@yorun-ai/skel-highlight/shiki";
import { skel as skelCodeMirror, skelLanguage } from "@yorun-ai/skel-highlight/codemirror";
import skelHighlightJs from "@yorun-ai/skel-highlight/highlightjs";
import { registerSkelMonaco, skelMonarch } from "@yorun-ai/skel-highlight/monaco";
import skelPrism, { registerSkelPrism } from "@yorun-ai/skel-highlight/prism";
import skelStarryNight from "@yorun-ai/skel-highlight/starry-night";

const highlighter = await createHighlighter({
  langs: [skel, namedSkel],
  themes: ["github-dark"]
});

highlighter.dispose();

void skelCodeMirror();
void skelLanguage;
void skelHighlightJs;
void registerSkelMonaco;
void skelMonarch;
void skelPrism;
void registerSkelPrism;
void skelStarryNight;
