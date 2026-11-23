const fs = require("node:fs");
const path = require("node:path");

const dirs = [
  "assets/icons/feedback",
  "assets/icons/utility",
  "assets/icons/nav",
];
const result = {};

for (const dir of dirs) {
  const fullDir = path.resolve(__dirname, "..", dir);
  if (!fs.existsSync(fullDir)) continue;
  const files = fs.readdirSync(fullDir).filter((f) => f.endsWith(".svg"));
  for (const file of files) {
    const content = fs.readFileSync(path.join(fullDir, file), "utf8");
    const key = path.basename(file, ".svg");
    const widthMatch = content.match(/width="([^"]+)"/);
    const heightMatch = content.match(/height="([^"]+)"/);
    const viewBoxMatch = content.match(/viewBox="([^"]+)"/);

    // Extract paths
    const paths = [];
    const pathRegex = /<path([^>]+)\/>/g;
    let match = pathRegex.exec(content);
    while (match !== null) {
      const attrs = match[1];
      const dMatch = attrs.match(/\bd="([^"]+)"/);
      const strokeMatch = attrs.match(/\bstroke="([^"]+)"/);
      const fillMatch = attrs.match(/\bfill="([^"]+)"/);
      const strokeWidthMatch = attrs.match(/\bstroke-width="([^"]+)"/);
      const strokeLinecapMatch = attrs.match(/\bstroke-linecap="([^"]+)"/);
      const strokeLinejoinMatch = attrs.match(/\bstroke-linejoin="([^"]+)"/);
      paths.push({
        d: dMatch ? dMatch[1] : "",
        stroke: strokeMatch ? strokeMatch[1] : undefined,
        fill: fillMatch ? fillMatch[1] : undefined,
        strokeWidth: strokeWidthMatch ? Number(strokeWidthMatch[1]) : undefined,
        strokeLinecap: strokeLinecapMatch ? strokeLinecapMatch[1] : undefined,
        strokeLinejoin: strokeLinejoinMatch
          ? strokeLinejoinMatch[1]
          : undefined,
      });
      match = pathRegex.exec(content);
    }
    result[`${path.basename(dir)}/${key}`] = {
      width: widthMatch ? Number(widthMatch[1]) : 24,
      height: heightMatch ? Number(heightMatch[1]) : 24,
      viewBox: viewBoxMatch ? viewBoxMatch[1] : "0 0 24 24",
      paths,
    };
  }
}

fs.writeFileSync(
  path.resolve(__dirname, "../src/components/ui/icons/icon-data.json"),
  JSON.stringify(result, null, 2),
);
console.log(
  "Successfully generated icon-data.json with",
  Object.keys(result).length,
  "icons",
);
