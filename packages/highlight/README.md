# Skel Highlight

Frontend syntax-highlighting definitions for the Skel contract language. The package supports Shiki, PrismJS, Highlight.js, Monaco Editor, Starry Night, and CodeMirror 6. Its TextMate grammar is the canonical lexical definition shared with the VS Code extension.

Install the package with only the highlighter used by your application. All highlighter peer dependencies are optional.

## Shiki

```sh
npm install shiki @yorun-ai/skel-highlight
```

```js
import { createHighlighter } from "shiki";
import skel from "@yorun-ai/skel-highlight/shiki";

const highlighter = await createHighlighter({ langs: [skel], themes: ["github-dark"] });
const html = highlighter.codeToHtml("domain demo.user", { lang: "skel", theme: "github-dark" });
```

## PrismJS

```sh
npm install prismjs @yorun-ai/skel-highlight
```

```js
import Prism from "prismjs";
import skel, { registerSkelPrism } from "@yorun-ai/skel-highlight/prism";

registerSkelPrism(Prism);
const html = Prism.highlight("domain demo.user", skel, "skel");
```

`registerSkelPrism` also carries the metadata expected by Refractor, so it can be passed to `refractor.register`.

## Highlight.js

```sh
npm install highlight.js @yorun-ai/skel-highlight
```

```js
import hljs from "highlight.js/lib/core";
import skel from "@yorun-ai/skel-highlight/highlightjs";

hljs.registerLanguage("skel", skel);
const html = hljs.highlight("domain demo.user", { language: "skel" }).value;
```

The same language function can be registered with Lowlight.

## Monaco Editor

```sh
npm install monaco-editor @yorun-ai/skel-highlight
```

```js
import * as monaco from "monaco-editor";
import { registerSkelMonaco } from "@yorun-ai/skel-highlight/monaco";

registerSkelMonaco(monaco);
monaco.editor.create(element, { language: "skel", value: "domain demo.user" });
```

The Monaco entrypoint also exports `skelMonarch` and `skelLanguageConfiguration` for applications that manage language registration themselves.

## Starry Night

```sh
npm install @wooorm/starry-night @yorun-ai/skel-highlight
```

```js
import { createStarryNight } from "@wooorm/starry-night";
import skel from "@yorun-ai/skel-highlight/starry-night";

const highlighter = await createStarryNight([skel]);
const tree = highlighter.highlight("domain demo.user", "source.skel");
```

## CodeMirror 6

```sh
npm install @codemirror/language @codemirror/view @yorun-ai/skel-highlight
```

```js
import { EditorView } from "@codemirror/view";
import { skel } from "@yorun-ai/skel-highlight/codemirror";

new EditorView({ parent: element, doc: "domain demo.user", extensions: [skel()] });
```

The CodeMirror entrypoint provides stream-based syntax highlighting. Semantic completion, diagnostics, navigation, and rename remain the responsibility of `skelc lsp` integrations.

## TextMate

The raw grammar is available as `@yorun-ai/skel-highlight/textmate` for TextMate-compatible consumers.
