import { createHighlighter } from "shiki";
import skel, { skel as namedSkel } from "@yorun-ai/skel-highlight/shiki";

const highlighter = await createHighlighter({
  langs: [skel, namedSkel],
  themes: ["github-dark"]
});

highlighter.dispose();
