import { defineConfig } from "vite";
import UniPlugin from "@dcloudio/vite-plugin-uni";
import UnoCSS from "unocss/vite";

// DCloud 当前发布的是 CommonJS，在 ESM Vite 配置中需要兼容其双层 default 导出。
const Uni =
  (UniPlugin as unknown as { default?: typeof UniPlugin }).default ?? UniPlugin;

export default defineConfig({
  plugins: [
    UnoCSS({
      hmrTopLevelAwait: false,
    }),
    Uni(),
  ],
});
