const entryKeywords = Object.freeze([
  "enum", "data", "config", "actor", "resource", "service", "web", "event", "task"
]);

const declarationKeywords = Object.freeze(["domain", "import", ...entryKeywords]);

const controlKeywords = Object.freeze([
  "pub", "as", "via", "for", "auth", "noauth", "permission", "credential", "info", "method", "require",
  "trigger", "input", "output", "payload", "action", "check", "all", "any", "client", "agent", "openapi",
  "eternal", "instant"
]);

const builtinTypes = Object.freeze([
  "int", "float", "bool", "string", "decimal", "binary", "timestamp", "duration", "localdate", "localtime",
  "localdatetime", "uuid", "json", "PermissionCode", "list", "map"
]);

const keywords = Object.freeze([...declarationKeywords, ...controlKeywords]);
const keywordSet = new Set(keywords);
const builtinTypeSet = new Set(builtinTypes);
const identifierPattern = "[A-Za-z_][A-Za-z0-9_]*";

export {
  builtinTypes,
  builtinTypeSet,
  controlKeywords,
  declarationKeywords,
  entryKeywords,
  identifierPattern,
  keywords,
  keywordSet
};
