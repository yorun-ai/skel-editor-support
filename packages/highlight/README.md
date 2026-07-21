# Skel Highlight

Syntax highlighting definitions for the Skel contract language. The package currently provides the canonical TextMate grammar and a custom language registration for [Shiki](https://shiki.style/).

## Shiki

```sh
npm install shiki @yorun-ai/skel-highlight
```

Register Skel when creating a highlighter:

```js
import { createHighlighter } from "shiki";
import skel from "@yorun-ai/skel-highlight/shiki";

const highlighter = await createHighlighter({
  langs: [skel],
  themes: ["github-dark"]
});

const html = highlighter.codeToHtml("domain demo.user", {
  lang: "skel",
  theme: "github-dark"
});
```

The raw TextMate grammar is also exported as `@yorun-ai/skel-highlight/textmate`.
