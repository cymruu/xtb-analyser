import { examplePortfolio } from "./examplePortfolio";
import { Renderer } from "./renderer";

export const createLoadExampleHandler = (renderer: Renderer) => {
  const loadExampleHref = document.getElementById("load-example");

  if (loadExampleHref) {
    loadExampleHref.addEventListener("click", () => {
      renderer.setRenderContext({
        root: examplePortfolio,
        render: examplePortfolio,
      });
      renderer.render();
    });
  }
};
