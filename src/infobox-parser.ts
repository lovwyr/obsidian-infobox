export interface InfoboxRow {
  header?: string;
  label?: string;
  value?: string;
  mvalue?: string;
}

export interface InfoboxData {
  title?: string;
  image?: string;
  caption?: string;
  type?: string;
  rows: InfoboxRow[];
}

function stripQuotes(s: string): string {
  return s.replace(/^["']|["']$/g, "");
}

export function parseInfoboxYaml(source: string): InfoboxData {
  const lines = source.split("\n");
  const data: InfoboxData = { rows: [] };
  let inRows = false;
  let currentRow: InfoboxRow | null = null;

  for (const rawLine of lines) {
    if (rawLine.trim() === "") continue;

    const indent = rawLine.length - rawLine.trimStart().length;
    const line = rawLine.trim();

    if (!inRows) {
      if (line === "rows:") {
        inRows = true;
        continue;
      }
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim();
      const value = stripQuotes(line.slice(colonIdx + 1).trim());
      if (key === "title")   data.title   = value;
      if (key === "image")   data.image   = value;
      if (key === "caption") data.caption = value;
      if (key === "type")    data.type    = value;
    } else {
      if (indent === 0 && !line.startsWith("-")) {
        inRows = false;
        continue;
      }

      if (line.startsWith("- ")) {
        if (currentRow !== null) data.rows.push(currentRow);
        currentRow = {};
        const rest = line.slice(2).trim();
        if (rest !== "") {
          const colonIdx = rest.indexOf(":");
          if (colonIdx !== -1) {
            const key = rest.slice(0, colonIdx).trim();
            const val = stripQuotes(rest.slice(colonIdx + 1).trim());
            if (key === "header") currentRow.header = val;
            if (key === "label")  currentRow.label  = val;
            if (key === "value")  currentRow.value  = val;
            if (key === "mvalue") currentRow.mvalue = val;
          }
        }
      } else if (currentRow !== null) {
        const colonIdx = line.indexOf(":");
        if (colonIdx !== -1) {
          const key = line.slice(0, colonIdx).trim();
          const val = stripQuotes(line.slice(colonIdx + 1).trim());
          if (key === "header") currentRow.header = val;
          if (key === "label")  currentRow.label  = val;
          if (key === "value")  currentRow.value  = val;
          if (key === "mvalue") currentRow.mvalue = val;
        }
      }
    }
  }

  if (currentRow !== null) data.rows.push(currentRow);

  return data;
}