import { createElement } from "react";
import { createRoot } from "react-dom/client";
import Studio from "../components/Studio";
import { installUno } from "../uno";
import { theme } from "../theme";

if (typeof document !== "undefined") installUno(theme);

export default function Home() {
  return <Studio />;
}

if (typeof document !== "undefined") {
  document.title = "qr-forge";
  document.head.insertAdjacentHTML(
    "beforeend",
    '<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2216%22 fill=%22%23282a36%22/><rect x=%2218%22 y=%2218%22 width=%2224%22 height=%2224%22 fill=%22%23bd93f9%22/><rect x=%2258%22 y=%2218%22 width=%2224%22 height=%2224%22 fill=%22%23ff79c6%22/><rect x=%2218%22 y=%2258%22 width=%2224%22 height=%2224%22 fill=%22%2350fa7b%22/><rect x=%2258%22 y=%2258%22 width=%2224%22 height=%2224%22 fill=%22%238be9fd%22/></svg>',
  );
  const el = document.getElementById("moonshine-app");
  if (el) createRoot(el).render(createElement(Home));
}
