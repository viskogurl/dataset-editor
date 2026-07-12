import { define } from "@/utils.ts";

export default define.page(function App({ Component }) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="A focused workspace for reviewing, editing, moderating, and exporting training datasets."
        />
        <meta name="theme-color" content="#5b5ce2" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <title>Dataset Studio</title>
        <script src="/theme.js" />
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
});
