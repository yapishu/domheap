import { readFile } from "node:fs/promises";
/** Read a curl cookie jar without logging authentication tokens. */
export async function cookie(path) {
  const text = await readFile(path, "utf8");
  return text
    .split("\n")
    .filter(
      (line) =>
        line &&
        !line.startsWith("# ") &&
        (!line.startsWith("#") || line.startsWith("#HttpOnly_")),
    )
    .map((line) => line.replace(/^#HttpOnly_/, "").split("\t"))
    .filter((fields) => fields.length === 7)
    .map((fields) => `${fields[5]}=${fields[6]}`)
    .join("; ");
}
