"use strict";

const executeCommand = "skel.schema.diff";
const showCommand = "skel.showSchemaCompatibility";
const reportDocument = { scheme: "skel-schema-compatibility", path: "/schema-diff.json" };

function settings(configuration) {
  return {
    diagnostics: configuration.get("diagnostics", true),
    includeCompatible: configuration.get("includeCompatible", false),
    codeLens: configuration.get("codeLens", true),
    baseline: configuration.get("baseline", "")
  };
}

function reportContent(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function summary(report) {
  const value = report && report.summary ? report.summary : {};
  return `${value.breaking || 0} breaking, ${value.dangerous || 0} dangerous, ${value.compatible || 0} compatible`;
}

module.exports = { executeCommand, showCommand, reportDocument, settings, reportContent, summary };
