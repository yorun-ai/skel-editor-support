import grammar from "./skel.tmLanguage.json" with { type: "json" };

const skel = Object.freeze({
  ...grammar,
  name: "skel",
  fileTypes: ["skel"]
});

export { skel };
export default skel;
