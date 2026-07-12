import { BrandMarkIcon } from "@/components/icons.tsx";
import { define } from "@/utils.ts";

export default define.page(function ErrorPage() {
  return (
    <main class="not-found">
      <span class="brand-mark" aria-hidden="true">
        <BrandMarkIcon />
      </span>
      <p class="eyebrow">404</p>
      <h1>That page is not in this dataset.</h1>
      <p>The editor is waiting back at the workspace.</p>
      <a class="button button-primary" href="/">Return to Dataset Studio</a>
    </main>
  );
});
