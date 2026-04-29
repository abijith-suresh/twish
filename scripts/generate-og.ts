/* eslint-disable no-console */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

const FRAME_WIDTH = 1200;
const FRAME_HEIGHT = 630;
const CONTENT_OFFSET_Y = 80;
const ACCENT_STRIP_WIDTH = 4;
const BOTTOM_BAR_HEIGHT = 8;
const FONT_FAMILY = "JetBrains Mono";

const COLORS = {
  page: "#1e1e2e",
  sidebar: "#181825",
  accent: "#cba6f7",
  text: "#cdd6f4",
  muted: "#6c7086",
  pill: "#313244",
} as const;

const CATEGORY_PILLS = ["security", "encoding", "data", "generators", "time"];
const FILES = [
  { name: "jwt-decoder.ts", active: false },
  { name: "json-formatter.ts", active: false },
  { name: "diff-tool.ts", active: true },
  { name: "hash-generator.ts", active: false },
  { name: "regex-tester.ts", active: false },
] as const;

const fontPath = join(
  import.meta.dir,
  "../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff"
);
const outPath = join(import.meta.dir, "../public/og-image.png");
const fontData = readFileSync(fontPath);

interface SatoriElement {
  type: string;
  props: {
    style?: Record<string, unknown>;
    children?: unknown;
  };
}

function createSpacer(height: number): SatoriElement {
  return {
    type: "div",
    props: {
      style: { display: "flex", height },
      children: "",
    },
  };
}

function createPill(label: string): SatoriElement {
  return {
    type: "div",
    props: {
      style: {
        backgroundColor: COLORS.pill,
        borderRadius: 4,
        padding: "4px 10px",
        fontSize: 12,
        color: COLORS.muted,
        display: "flex",
      },
      children: label,
    },
  };
}

function createFileRow(file: { name: string; active: boolean }): SatoriElement {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "row" as const,
        alignItems: "center",
        marginBottom: 12,
        fontSize: 13,
        fontFamily: FONT_FAMILY,
      },
      children: [
        {
          type: "span",
          props: {
            style: {
              color: file.active ? COLORS.accent : "transparent",
              marginRight: 8,
              display: "flex",
            },
            children: "●",
          },
        },
        {
          type: "span",
          props: {
            style: {
              color: file.active ? COLORS.text : COLORS.muted,
              display: "flex",
            },
            children: file.name,
          },
        },
      ],
    },
  };
}

const tree: SatoriElement = {
  type: "div",
  props: {
    style: {
      display: "flex",
      width: `${FRAME_WIDTH}px`,
      height: `${FRAME_HEIGHT}px`,
      backgroundColor: COLORS.page,
      position: "relative" as const,
      fontFamily: FONT_FAMILY,
    },
    children: [
      {
        type: "div",
        props: {
          style: {
            display: "flex",
            flexDirection: "column" as const,
            width: 720,
            padding: 60,
          },
          children: [
            createSpacer(CONTENT_OFFSET_Y),
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  fontSize: 48,
                  fontWeight: 700,
                  color: COLORS.text,
                  lineHeight: 1.1,
                },
                children: "unwrapped.tools",
              },
            },
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  fontSize: 18,
                  color: COLORS.muted,
                  marginTop: 20,
                },
                children: "Fast, local-first developer tools.",
              },
            },
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  flexDirection: "row" as const,
                  flexWrap: "wrap" as const,
                  gap: 8,
                  marginTop: 30,
                },
                children: CATEGORY_PILLS.map(createPill),
              },
            },
          ],
        },
      },
      {
        type: "div",
        props: {
          style: {
            display: "flex",
            flexDirection: "row" as const,
            width: 480,
            height: FRAME_HEIGHT,
          },
          children: [
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  width: ACCENT_STRIP_WIDTH,
                  height: FRAME_HEIGHT,
                  backgroundColor: COLORS.accent,
                },
                children: "",
              },
            },
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  flexDirection: "column" as const,
                  flex: 1,
                  backgroundColor: COLORS.sidebar,
                  padding: "60px 40px",
                },
                children: [createSpacer(CONTENT_OFFSET_Y), ...FILES.map(createFileRow)],
              },
            },
          ],
        },
      },
      {
        type: "div",
        props: {
          style: {
            position: "absolute" as const,
            bottom: 0,
            left: 0,
            width: FRAME_WIDTH,
            height: BOTTOM_BAR_HEIGHT,
            backgroundColor: COLORS.accent,
            display: "flex",
          },
          children: "",
        },
      },
    ],
  },
};

const svg = await satori(tree as Parameters<typeof satori>[0], {
  width: FRAME_WIDTH,
  height: FRAME_HEIGHT,
  fonts: [
    {
      name: FONT_FAMILY,
      data: fontData,
      weight: 700,
      style: "normal",
    },
  ],
});

const resvg = new Resvg(svg, { fitTo: { mode: "width", value: FRAME_WIDTH } });
const pngBuffer = resvg.render().asPng();

writeFileSync(outPath, pngBuffer);
console.log("Generated public/og-image.png");
console.log(`File size: ${(pngBuffer.byteLength / 1024).toFixed(1)} KB`);
