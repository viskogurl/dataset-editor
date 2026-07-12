import { define } from "@/utils.ts";

export default define.page(function ErrorPage() {
  return (
    <main class="not-found">
      <span class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M5 5.75A2.75 2.75 0 0 1 7.75 3h8.5A2.75 2.75 0 0 1 19 5.75v12.5A2.75 2.75 0 0 1 16.25 21h-8.5A2.75 2.75 0 0 1 5 18.25V5.75Z" />
          <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
        </svg>
      </span>
      <p class="eyebrow">404</p>
      <h1>That page is not in this dataset.</h1>
      <p>The editor is waiting back at the workspace.</p>
      <a class="button button-primary" href="/">Return to Dataset Studio</a>
    </main>
  );
});
