import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { keywords, builtinTypes } from "../../../packages/highlight/src/language.js";

const output = resolve(process.argv[2], "skel");
await mkdir(output, { recursive: true });
const compatibility = JSON.parse(await readFile(new URL("../../vscode/skelc-compatibility.json", import.meta.url), "utf8"));
await writeFile(resolve(output, "language.properties"), [
  `keywords=${keywords.join(",")}`,
  `builtinTypes=${builtinTypes.join(",")}`,
  `minimumVersion=${compatibility.minimumVersion}`,
  ""
].join("\n"));
