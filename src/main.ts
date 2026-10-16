import { App, Plugin, MarkdownPostProcessorContext, Component, MarkdownRenderChild, MarkdownRenderer } from "obsidian";
import { parseInfoboxYaml, type InfoboxData, type InfoboxRow } from "./infobox-parser";

// ── Renderer ─────────────────────────────────────────────────────────────────

async function renderMarkdownValue(
  el: HTMLElement,
  markdown: string,
  app: App,
  sourcePath: string,
  component: Component
): Promise<void> {
  await MarkdownRenderer.render(app, markdown, el, sourcePath, component);
}

async function renderInfobox(
  data: InfoboxData,
  el: HTMLElement,
  app: App,
  sourcePath: string,
  component: Component
): Promise<void> {
  const classes = ["infobox-container"];
  if (data.type) classes.push(`infobox--${data.type.toLowerCase()}`);
  const box = el.createEl("div", { cls: classes.join(" ") });

  if (data.title) {
    box.createEl("div", { cls: "infobox-title", text: data.title });
  }

  if (data.image) {
    const imageFile = app.metadataCache.getFirstLinkpathDest(data.image, sourcePath);
    if (imageFile) {
      const resourcePath = app.vault.getResourcePath(imageFile);
      const imgWrapper = box.createEl("div", { cls: "infobox-image-wrapper" });
      imgWrapper.createEl("img", {
        cls: "infobox-image",
        attr: { src: resourcePath, alt: data.caption ?? data.title ?? "" },
      });
      if (data.caption) {
        imgWrapper.createEl("div", { cls: "infobox-caption", text: data.caption });
      }
    } else {
      const missing = box.createEl("div", { cls: "infobox-image-missing" });
      missing.createEl("span", { text: `Image not found: ${data.image}` });
    }
  }

  if (data.rows.length > 0) {
    type Section = { header?: string; dataRows: InfoboxRow[] };
    const sections: Section[] = [];
    let current: Section = { dataRows: [] };

    for (const row of data.rows) {
      if (row.header !== undefined) {
        if (current.header !== undefined || current.dataRows.length > 0) {
          sections.push(current);
        }
        current = { header: row.header, dataRows: [] };
      } else {
        current.dataRows.push(row);
      }
    }
    sections.push(current);

    for (const section of sections) {
      if (section.header !== undefined) {
        box.createEl("div", { cls: "infobox-section-header", text: section.header });
      }
      if (section.dataRows.length > 0) {
        const table = box.createEl("table", { cls: "infobox-table" });
        const tbody = table.createEl("tbody");
        for (const row of section.dataRows) {
          if (row.label !== undefined || row.value !== undefined || row.mvalue !== undefined) {
            const tr = tbody.createEl("tr", { cls: "infobox-data-row" });
            tr.createEl("th", { cls: "infobox-label", text: row.label ?? "" });
            if (row.mvalue) {
              const td = tr.createEl("td", { cls: "infobox-value" });
              await renderMarkdownValue(td, row.mvalue, app, sourcePath, component);
            }
            else if (row.value) {
              tr.createEl("td", { cls: "infobox-value", text: row.value ?? "" });
            }
          }
        }
      }
    }
  }
}

// ── Plugin ───────────────────────────────────────────────────────────────────

export default class InfoboxPlugin extends Plugin {
  onload(): void {
    this.registerMarkdownCodeBlockProcessor(
      "infobox",
      async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
        try {
          const data = parseInfoboxYaml(source);
          const component = new MarkdownRenderChild(el);
          ctx.addChild(component);
          await renderInfobox(data, el, this.app, ctx.sourcePath, component);
        } catch (err) {
          const errorEl = el.createEl("div", { cls: "infobox-error" });
          errorEl.createEl("strong", { text: "Infobox error: " });
          errorEl.createEl("span", { text: String(err) });
        }
      }
    );
  }

  onunload(): void {
    // Plugin base class handles deregistering the processor automatically
  }
}
