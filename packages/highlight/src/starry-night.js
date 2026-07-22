import grammar from "./skel.tmLanguage.json" with { type: "json" };

const skelStarryNight = Object.freeze({
  ...grammar,
  names: ["skel"],
  extensions: [".skel"]
});

export { skelStarryNight };
export default skelStarryNight;
