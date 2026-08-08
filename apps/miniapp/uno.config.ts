import { defineConfig } from "unocss";
import presetWeapp from "unocss-preset-weapp";
import { transformerClass } from "unocss-preset-weapp/transformer";

export default defineConfig({
  presets: [
    presetWeapp({
      platform: "uniapp",
      whRpx: true,
    }),
  ],
  shortcuts: {
    "flex-start": "flex items-center",
    "flex-between": "flex items-center justify-between",
    "flex-center": "flex items-center justify-center",
  },
  transformers: [transformerClass()],
});

