// Vendor HAVYN's offline map stack (runs in GitHub Actions: node tools/maps_vendor.mjs):
//   src/vendor/maplibre/  MapLibre GL JS 5, CSP build (its worker is a real file, no blob: workers), CSS, licence
//   src/vendor/pmtiles/   pmtiles (reads the map packs), licence
//   src/maps/style.json   the HAVYN Night style, generated with @protomaps/basemaps (dark flavour in HAVYN colours)
//   src/maps/fonts/       Noto Sans glyphs for the scripts the labels here use; src/maps/sprites/ the dark symbol sheet
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const T = "/tmp/mapsv";
fs.mkdirSync(T, { recursive: true });
execSync("npm init -y >/dev/null && npm install --no-audit --no-fund maplibre-gl@5 pmtiles@4 @protomaps/basemaps@5", { cwd: T, stdio: "inherit" });
const nm = (...p) => path.join(T, "node_modules", ...p);
const ver = (p) => JSON.parse(fs.readFileSync(nm(p, "package.json"), "utf8")).version;
const put = (dir, files) => { fs.mkdirSync(dir, { recursive: true }); for (const [from, to] of files) { if (!fs.existsSync(from)) throw new Error("missing " + from); fs.copyFileSync(from, path.join(dir, to)); } };
// The licence file, or (when a package ships none) a note naming the licence its package.json declares.
const lic = (p) => {
  const f = fs.readdirSync(nm(p)).find((x) => /^licen[cs]e/i.test(x));
  if (f) return nm(p, f);
  const pj = JSON.parse(fs.readFileSync(nm(p, "package.json"), "utf8")), out = path.join(T, p.replace(/\W+/g, "-") + "-LICENSE.txt");
  fs.writeFileSync(out, p + " " + pj.version + " is licensed " + (pj.license || "see its repository") + ". " + (pj.repository && (pj.repository.url || pj.repository) || "") + "\n");
  return out;
};

const V = path.join(ROOT, "src", "vendor");
put(path.join(V, "maplibre"), [[nm("maplibre-gl", "dist", "maplibre-gl-csp.js"), "maplibre-gl-csp.js"], [nm("maplibre-gl", "dist", "maplibre-gl-csp-worker.js"), "maplibre-gl-csp-worker.js"],
  [nm("maplibre-gl", "dist", "maplibre-gl.css"), "maplibre-gl.css"], [lic("maplibre-gl"), "LICENSE.txt"]]);
const pmDist = ["pmtiles.js", "index.js"].map((f) => nm("pmtiles", "dist", f)).find((f) => fs.existsSync(f));
console.log("pmtiles dist files:", fs.readdirSync(nm("pmtiles", "dist")).join(" "));
put(path.join(V, "pmtiles"), [[pmDist, "pmtiles.js"], [lic("pmtiles"), "LICENSE.txt"]]);
fs.writeFileSync(path.join(V, "versions.json"), JSON.stringify({ "maplibre-gl": ver("maplibre-gl"), pmtiles: ver("pmtiles"), "@protomaps/basemaps": ver("@protomaps/basemaps") }, null, 1));

// The style: Protomaps' dark flavour in HAVYN's colours (only keys the flavour has are changed; the rest log here).
const HAVYN = {
  background: "#03071a", earth: "#060c22", water: "#0a2645", buildings: "#0f1a33",
  park_a: "#0a1d27", park_b: "#0a1d27", wood_a: "#0a1c25", wood_b: "#0a1c25", scrub_a: "#0b1a26", scrub_b: "#0b1a26", sand: "#11152a", beach: "#11152a",
  hospital: "#2a0f22", school: "#121a35", industrial: "#0b1229", aerodrome: "#0d1530", runway: "#1a2747", pedestrian: "#0d1630", military: "#101a2c", zoo: "#0a1d27",
  highway: "#36d6f5", highway_casing_early: "#03071a", highway_casing_late: "#03071a", major: "#2a9cc2", major_casing_early: "#03071a", major_casing_late: "#03071a",
  link: "#2a9cc2", link_casing: "#03071a", minor_a: "#1e3a5c", minor_b: "#183252", minor_casing: "#03071a", minor_service: "#14294a", minor_service_casing: "#03071a", other: "#152b4a",
  railway: "#3a4a6e", boundaries: "#6f5bd6",
  city_label: "#eaf6ff", city_label_halo: "#03071a", subplace_label: "#9fb3d9", subplace_label_halo: "#03071a", state_label: "#8aa0c8", state_label_halo: "#03071a",
  country_label: "#8aa0c8", roads_label_major: "#bdf2ff", roads_label_major_halo: "#03071a", roads_label_minor: "#8ea3c7", roads_label_minor_halo: "#03071a",
  waterway_label: "#5fa8d6", ocean_label: "#5fa8d6", peak_label: "#c9a86a", address_label: "#7c8fb3", address_label_halo: "#03071a"
};
fs.writeFileSync(path.join(T, "gen.mjs"), `
import { layers, namedFlavor } from "@protomaps/basemaps";
import fs from "node:fs";
const base = namedFlavor("dark"), want = ${JSON.stringify(HAVYN)}, flavor = { ...base };
const unknown = [];
for (const k in want) { if (k in base) flavor[k] = want[k]; else unknown.push(k); }
console.log("flavour keys:", Object.keys(base).join(" "));
console.log("not in this flavour (left out):", unknown.join(" ") || "none");
const style = { version: 8, name: "HAVYN Night", glyphs: "GLYPHS", sprite: "SPRITE",
  sources: { protomaps: { type: "vector", url: "pmtiles://PACK", attribution: "© OpenStreetMap contributors · Protomaps" } },
  layers: layers("protomaps", flavor, { lang: "en" }) };
fs.writeFileSync("style.json", JSON.stringify(style));
// text-font can be a plain list or an expression: collect every font name in it (font names have a space; operators don't)
const fonts = new Set(), walk = (v) => { if (Array.isArray(v)) v.forEach(walk); else if (typeof v === "string" && / /.test(v)) fonts.add(v); };
for (const l of style.layers) if (l.layout && l.layout["text-font"]) walk(l.layout["text-font"]);
fs.writeFileSync("fonts.json", JSON.stringify([...fonts]));
console.log(style.layers.length, "layers; fonts:", [...fonts].join(" | "));
`);
execSync("node gen.mjs", { cwd: T, stdio: "inherit" });
const M = path.join(ROOT, "src", "maps");
fs.mkdirSync(M, { recursive: true });
fs.copyFileSync(path.join(T, "style.json"), path.join(M, "style.json"));

// Glyphs (only the ranges these names need: Latin, Latin extended, IPA/modifier letters, Vietnamese, punctuation) and symbols.
const A = "https://protomaps.github.io/basemaps-assets/";
const get = async (u) => { for (let i = 0; i < 4; i++) { const r = await fetch(u); if (r.ok) return Buffer.from(await r.arrayBuffer()); if (r.status === 404) throw new Error("404 " + u); await new Promise((s) => setTimeout(s, 2000 * (i + 1))); } throw new Error("failed " + u); };
const stacks = JSON.parse(fs.readFileSync(path.join(T, "fonts.json"), "utf8"));
const RANGES = ["0-255", "256-511", "512-767", "7680-7935", "8192-8447"];
let n = 0;
for (const f of [...new Set(stacks)]) {
  for (const r of RANGES) {
    const dir = path.join(M, "fonts", f); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, r + ".pbf"), await get(A + "fonts/" + encodeURIComponent(f) + "/" + r + ".pbf")); n++;
  }
}
for (const s of ["dark.json", "dark.png", "dark@2x.json", "dark@2x.png"]) { fs.mkdirSync(path.join(M, "sprites"), { recursive: true }); fs.writeFileSync(path.join(M, "sprites", s), await get(A + "sprites/v4/" + s)); }
for (const l of ["LICENSE", "LICENSE.md", "LICENSE.txt", "fonts/LICENSE.txt", "fonts/OFL.txt", "README.md"]) { try { fs.writeFileSync(path.join(M, "ASSETS-" + l + (l.endsWith(".md") ? "" : ".txt")), await get("https://raw.githubusercontent.com/protomaps/basemaps-assets/main/" + l)); } catch (e) { console.log("no", l); } }
console.log("glyph files:", n, "· style", Math.round(fs.statSync(path.join(M, "style.json")).size / 1024), "KB");
