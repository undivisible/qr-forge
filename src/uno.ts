import { createGenerator } from "@unocss/core";
import { presetWind3 } from "@unocss/preset-wind3";
import type { StudioTheme } from "./theme";

export function installUno(theme: StudioTheme): void {
  void (async () => {
    const uno = await createGenerator({
      presets: [presetWind3()],
      theme: theme.uno,
      rules: theme.rules,
    });

    const style = document.createElement("style");
    document.head.append(style);

    let timer: ReturnType<typeof setTimeout>;

    async function refresh() {
      const tokens = new Set<string>();
      for (const el of Array.from(document.querySelectorAll<HTMLElement>("[class]")))
        for (const c of Array.from(el.classList)) tokens.add(c);
      const css = await uno.generate([...tokens].join(" "), {
        preflights: true,
        minify: true,
      });
      style.textContent = `${theme.preflight}\n${css.css}`;
    }

    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(() => void refresh().catch(console.error), 50);
    }

    new MutationObserver(schedule).observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    schedule();
  })();
}
