/* world.jsx — shared world map renderer for the Limelight style explorations.
   Loads world-atlas 110m topojson once, projects via d3-geo, exposes a
   <WorldMap/> component that takes per-style colors + label rules. */

const { useState, useEffect, useMemo } = React;

// Hand-picked news-intensity scores by country name (matches feature.properties.name
// in world-atlas/countries-110m). Captures the "what's loud in the world right now"
// distribution from the mock-articles seed.
const COUNTRIES = {
  "Ukraine":               { score: 95, iso: "UKR" },
  "Russia":                { score: 92, iso: "RUS" },
  "Israel":                { score: 90, iso: "ISR" },
  "Palestine":             { score: 88, iso: "PSE" },
  "Iran":                  { score: 85, iso: "IRN" },
  "United States of America": { score: 78, iso: "USA" },
  "China":                 { score: 75, iso: "CHN" },
  "India":                 { score: 72, iso: "IND" },
  "Sudan":                 { score: 70, iso: "SDN" },
  "Yemen":                 { score: 65, iso: "YEM" },
  "Lebanon":               { score: 62, iso: "LBN" },
  "Syria":                 { score: 60, iso: "SYR" },
  "Iraq":                  { score: 55, iso: "IRQ" },
  "Afghanistan":           { score: 52, iso: "AFG" },
  "Haiti":                 { score: 50, iso: "HTI" },
  "Pakistan":              { score: 48, iso: "PAK" },
  "Turkey":                { score: 45, iso: "TUR" },
  "Egypt":                 { score: 42, iso: "EGY" },
  "Myanmar":               { score: 38, iso: "MMR" },
  "Saudi Arabia":          { score: 38, iso: "SAU" },
  "United Kingdom":        { score: 35, iso: "GBR" },
  "Taiwan":                { score: 35, iso: "TWN" },
  "North Korea":           { score: 35, iso: "PRK" },
  "France":                { score: 33, iso: "FRA" },
  "Germany":               { score: 30, iso: "DEU" },
  "Venezuela":             { score: 30, iso: "VEN" },
  "Belarus":               { score: 30, iso: "BLR" },
  "Somalia":               { score: 30, iso: "SOM" },
  "Mexico":                { score: 28, iso: "MEX" },
  "Brazil":                { score: 28, iso: "BRA" },
  "Ethiopia":              { score: 25, iso: "ETH" },
  "Libya":                 { score: 25, iso: "LBY" },
  "Colombia":              { score: 25, iso: "COL" },
  "Japan":                 { score: 22, iso: "JPN" },
  "South Korea":           { score: 22, iso: "KOR" },
  "Armenia":               { score: 22, iso: "ARM" },
  "Poland":                { score: 22, iso: "POL" },
  "Canada":                { score: 18, iso: "CAN" },
  "Indonesia":             { score: 18, iso: "IDN" },
  "Philippines":           { score: 18, iso: "PHL" },
  "Italy":                 { score: 18, iso: "ITA" },
  "Georgia":               { score: 18, iso: "GEO" },
  "Azerbaijan":            { score: 18, iso: "AZE" },
  "Australia":             { score: 15, iso: "AUS" },
  "Spain":                 { score: 15, iso: "ESP" },
  "Nigeria":               { score: 15, iso: "NGA" },
  "Argentina":             { score: 15, iso: "ARG" },
  "Moldova":               { score: 15, iso: "MDA" },
  "South Africa":          { score: 12, iso: "ZAF" },
  "Greece":                { score: 12, iso: "GRC" },
  "Kazakhstan":            { score: 12, iso: "KAZ" },
  "Algeria":               { score: 12, iso: "DZA" },
  "Ecuador":               { score: 12, iso: "ECU" },
  "Cuba":                  { score: 12, iso: "CUB" },
  "Hungary":               { score: 10, iso: "HUN" },
  "Netherlands":           { score: 10, iso: "NLD" },
  "Thailand":              { score: 10, iso: "THA" },
  "Morocco":               { score: 10, iso: "MAR" },
  "Peru":                  { score: 10, iso: "PER" },
  "Belgium":               { score:  8, iso: "BEL" },
  "Romania":               { score:  8, iso: "ROU" },
  "Czechia":               { score:  8, iso: "CZE" },
  "Sweden":                { score:  8, iso: "SWE" },
  "Vietnam":               { score:  8, iso: "VNM" },
  "Uzbekistan":            { score:  8, iso: "UZB" },
  "Sri Lanka":             { score:  8, iso: "LKA" },
  "Kenya":                 { score:  8, iso: "KEN" },
  "Chile":                 { score:  8, iso: "CHL" },
  "Finland":               { score:  8, iso: "FIN" },
  "Austria":               { score:  6, iso: "AUT" },
  "Bangladesh":            { score:  6, iso: "BGD" },
  "Nepal":                 { score:  6, iso: "NPL" },
  "Bolivia":               { score:  6, iso: "BOL" },
  "Switzerland":           { score:  5, iso: "CHE" },
  "Norway":                { score:  5, iso: "NOR" },
  "Bulgaria":              { score:  5, iso: "BGR" },
  "New Zealand":           { score:  5, iso: "NZL" },
  "Mongolia":              { score:  4, iso: "MNG" },
  "Papua New Guinea":      { score:  4, iso: "PNG" },
  "Paraguay":              { score:  3, iso: "PRY" },
  "Uruguay":               { score:  4, iso: "URY" },
};

const TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

let _worldPromise = null;
function loadWorld() {
  if (!_worldPromise) {
    _worldPromise = fetch(TOPOJSON_URL)
      .then((r) => r.json())
      .then((topo) => topojson.feature(topo, topo.objects.countries).features);
  }
  return _worldPromise;
}

function useWorld() {
  const [features, setFeatures] = useState(null);
  useEffect(() => { loadWorld().then(setFeatures); }, []);
  return features;
}

function scoreFor(feature) {
  const c = COUNTRIES[feature.properties.name];
  return c ? c.score : 0;
}

function isoFor(feature) {
  const c = COUNTRIES[feature.properties.name];
  return c ? c.iso : "";
}

function makeProjection(name, width, height, rotate) {
  let p;
  switch (name) {
    case "natural":       p = d3.geoNaturalEarth1(); break;
    case "equal-earth":   p = d3.geoEqualEarth(); break;
    case "robinson":      p = d3.geoNaturalEarth1(); break;
    case "mercator":      p = d3.geoMercator(); break;
    case "orthographic":  p = d3.geoOrthographic().clipAngle(90); break;
    default:              p = d3.geoEquirectangular();
  }
  if (rotate && p.rotate) p.rotate(rotate);
  p.fitExtent([[10, 10], [width - 10, height - 10]], { type: "Sphere" });
  return p;
}

/*
  <WorldMap />
    width, height
    projection: "natural" | "equirectangular" | "mercator" | "equal-earth"
    oceanColor, stroke, strokeWidth, graticule
    fillForScore: (score, feature) => color
    labelForFeature: (info, score) => null | { text, color, halo, weight, size, font, italic, opacity, tracking }
    overlay: function children that get the projection + scale, to draw pins, callouts, tooltips
*/
function WorldMap({
  width, height,
  projection = "natural",
  rotate,
  oceanColor = "transparent",
  stroke = "rgba(255,255,255,0.05)",
  strokeWidth = 0.5,
  graticule = false,
  graticuleStroke = "rgba(255,255,255,0.04)",
  graticuleStep = [15, 15],
  fillForScore,
  labelForFeature,
  filterFeatures,
  overlay,
  globeShading,        // { highlight, shadow } — paints a paper-globe gradient on the sphere
  atmosphereColor,     // outer atmospheric ring color (orthographic only)
  atmosphereWidth = 14,
  defs,                // extra <defs> children
}) {
  const features = useWorld();
  const uid = useMemo(() => "wm" + Math.random().toString(36).slice(2, 8), []);
  const data = useMemo(() => {
    if (!features) return null;
    const proj = makeProjection(projection, width, height, rotate);
    const path = d3.geoPath(proj);
    const sphere = path({ type: "Sphere" });
    const grats = graticule
      ? d3.geoGraticule().step(graticuleStep).lines().map((g) => path(g))
      : [];
    const list = (filterFeatures ? features.filter(filterFeatures) : features).map((f) => ({
      id: f.id,
      name: f.properties.name,
      iso: isoFor(f),
      score: scoreFor(f),
      d: path(f),
      centroid: path.centroid(f),
      feature: f,
    }));
    return { sphere, grats, list, proj, path };
  }, [features, width, height, projection, graticule, filterFeatures]);

  if (!data) {
    return (
      <div
        style={{
          width, height,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#666", fontSize: 11, letterSpacing: 0.1,
          fontFamily: "ui-monospace, monospace",
        }}
      >
        loading geometry…
      </div>
    );
  }

  const labels = labelForFeature
    ? data.list
        .map((p) => {
          const cfg = labelForFeature(p, p.score);
          if (!cfg) return null;
          // orthographic clips back-hemisphere features → centroid is NaN
          if (!Number.isFinite(p.centroid[0]) || !Number.isFinite(p.centroid[1])) return null;
          return { ...p, cfg };
        })
        .filter(Boolean)
    : [];

  // For the orthographic globe we want filled sphere + an atmosphere ring.
  // We compute the sphere's bounding box from the path so we can position the
  // gradients / atmosphere precisely against any width/height/rotation.
  const sphereBBox = (() => {
    if (projection !== "orthographic") return null;
    try {
      const b = d3.geoPath(data.proj).bounds({ type: "Sphere" });
      return {
        x: b[0][0], y: b[0][1],
        w: b[1][0] - b[0][0],
        h: b[1][1] - b[0][1],
        cx: (b[0][0] + b[1][0]) / 2,
        cy: (b[0][1] + b[1][1]) / 2,
        r: Math.min(b[1][0] - b[0][0], b[1][1] - b[0][1]) / 2,
      };
    } catch (e) { return null; }
  })();

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block" }}
    >
      <defs>
        {globeShading && sphereBBox ? (
          <radialGradient id={uid + "-shade"} cx="32%" cy="28%" r="78%">
            <stop offset="0%"  stopColor={globeShading.highlight} stopOpacity="1" />
            <stop offset="55%" stopColor={globeShading.highlight} stopOpacity="0.6" />
            <stop offset="100%" stopColor={globeShading.shadow}    stopOpacity="1" />
          </radialGradient>
        ) : null}
        {atmosphereColor && sphereBBox ? (
          <radialGradient id={uid + "-atm"} cx="50%" cy="50%" r="50%">
            <stop offset="78%" stopColor={atmosphereColor} stopOpacity="0" />
            <stop offset="92%" stopColor={atmosphereColor} stopOpacity="0.55" />
            <stop offset="100%" stopColor={atmosphereColor} stopOpacity="0" />
          </radialGradient>
        ) : null}
        {defs}
      </defs>

      {/* Atmosphere ring: drawn behind everything, only on orthographic */}
      {atmosphereColor && sphereBBox ? (
        <circle
          cx={sphereBBox.cx} cy={sphereBBox.cy} r={sphereBBox.r + atmosphereWidth}
          fill={`url(#${uid}-atm)`}
        />
      ) : null}

      {/* Sphere — flat ocean color OR shaded paper-globe */}
      {globeShading && sphereBBox ? (
        <circle
          cx={sphereBBox.cx} cy={sphereBBox.cy} r={sphereBBox.r}
          fill={`url(#${uid}-shade)`}
        />
      ) : (
        <path d={data.sphere} fill={oceanColor} stroke="none" />
      )}

      {data.grats.filter(Boolean).map((g, i) => (
        <path
          key={"g-" + i}
          d={g}
          fill="none"
          stroke={graticuleStroke}
          strokeWidth={0.4}
        />
      ))}
      {data.list.filter((p) => p.d).map((p, i) => (
        <path
          key={p.id != null ? p.id : "p-" + i}
          d={p.d}
          fill={fillForScore ? fillForScore(p.score, p) : "#1a1f28"}
          stroke={stroke}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {labels.map((l) => (
        <text
          key={"lbl-" + l.id}
          x={l.centroid[0]}
          y={l.centroid[1]}
          textAnchor="middle"
          fontSize={l.cfg.size || 10}
          fontFamily={l.cfg.font || "inherit"}
          fontWeight={l.cfg.weight || 500}
          fontStyle={l.cfg.italic ? "italic" : "normal"}
          fill={l.cfg.color}
          opacity={l.cfg.opacity == null ? 1 : l.cfg.opacity}
          letterSpacing={l.cfg.tracking || 0}
          style={
            l.cfg.halo
              ? {
                  paintOrder: "stroke",
                  stroke: l.cfg.halo,
                  strokeWidth: l.cfg.haloWidth || 2.5,
                  strokeLinejoin: "round",
                }
              : undefined
          }
        >
          {l.cfg.text || l.name}
        </text>
      ))}
      {overlay && overlay({ projection: data.proj, path: data.path, list: data.list, width, height })}
    </svg>
  );
}

// Lookup helpers used by panels/tooltips so they can find a country's projected position.
function findByName(list, name) {
  return list.find((p) => p.name === name);
}

Object.assign(window, {
  WorldMap, useWorld, loadWorld,
  COUNTRIES, scoreFor, isoFor,
  makeProjection, findByName,
});
