import assert from "node:assert/strict";
import test from "node:test";
import { parseInfoboxYaml } from "../src/infobox-parser.ts";

test("parses infobox metadata and all row variants", () => {
  const data = parseInfoboxYaml(`title: "The Beatles"
image: beatles.png
caption: "Four members"
type: band
rows:
- header: Background
- label: Origin
  value: Liverpool
- label: Members
  mvalue: "**Four** [[people]]"
`);

  assert.deepEqual(data, {
    title: "The Beatles",
    image: "beatles.png",
    caption: "Four members",
    type: "band",
    rows: [
      { header: "Background" },
      { label: "Origin", value: "Liverpool" },
      { label: "Members", mvalue: "**Four** [[people]]" },
    ],
  });
});

test("parses empty and partial input", () => {
  assert.deepEqual(parseInfoboxYaml(""), { rows: [] });
  assert.deepEqual(parseInfoboxYaml("title: Example"), {
    title: "Example",
    rows: [],
  });
});