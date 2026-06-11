import { h, render as preactRender } from "preact";
import { DynamicForm } from "./DynamicForm";
import type { RenderOptions } from "./types";
// `?inline` makes Vite return the CSS as a string instead of emitting a
// sibling .css file — so the embed stays a single drop-in script.
import styles from "./styles.css?inline";

declare const __DEFAULT_API_BASE__: string;

const DEFAULT_API_BASE = __DEFAULT_API_BASE__;
const SCANNED = new WeakSet<Element>();
let stylesInjected = false;

function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const tag = document.createElement("style");
  tag.setAttribute("data-finodex-forms", "");
  tag.textContent = styles;
  document.head.appendChild(tag);
}

function resolveContainer(target: Element | string): Element | null {
  if (typeof target === "string") return document.querySelector(target);
  return target;
}

function render(opts: RenderOptions): () => void {
  const container = resolveContainer(opts.container);
  if (!container) throw new Error("FinodexForms: container not found");

  injectStyles();

  const apiBase = opts.apiBase || DEFAULT_API_BASE;
  if (!opts.slug) throw new Error("FinodexForms: slug is required");
  if (opts.orgId == null) throw new Error("FinodexForms: orgId is required");

  preactRender(
    h(DynamicForm, {
      slug: opts.slug,
      orgId: opts.orgId,
      apiBase,
      lang: opts.lang ?? "fa",
      onSuccess: opts.onSuccess,
      onError: opts.onError,
      submitLabel: opts.submitLabel,
    }),
    container
  );

  return () => preactRender(null, container);
}

function autoInit(root: ParentNode = document) {
  const targets = root.querySelectorAll<HTMLElement>("[data-finodex-form]");
  targets.forEach((el) => {
    if (SCANNED.has(el)) return;
    SCANNED.add(el);
    const slug = el.dataset.finodexForm;
    const orgId = el.dataset.finodexOrg;
    const apiBase = el.dataset.finodexApi;
    const submitLabel = el.dataset.finodexSubmitLabel;
    const lang = el.dataset.finodexLang as "fa" | "en" | undefined;
    if (!slug || !orgId) {
      console.warn("FinodexForms: missing data-finodex-form or data-finodex-org on", el);
      return;
    }
    try {
      render({
        container: el,
        slug,
        orgId,
        apiBase: apiBase || undefined,
        lang: lang || undefined,
        submitLabel: submitLabel || undefined,
      });
    } catch (e) {
      console.error("FinodexForms: render failed", e);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => autoInit(), { once: true });
} else {
  autoInit();
}

// Public global API.
const FinodexForms = {
  render,
  autoInit,
  defaultApiBase: DEFAULT_API_BASE,
};

(window as any).FinodexForms = FinodexForms;

export { render, autoInit };
