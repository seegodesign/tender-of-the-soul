# Astro Starter Kit: Minimal

## Newsletter signup on Cloudflare Pages

The footer posts to `functions/api/newsletter.js`. This Pages Function uses Brevo's double opt-in API to add subscribers to **list 3 only after email confirmation**. The site still builds as static Astro; no Astro server adapter is required.

In Cloudflare, select **Workers & Pages → tender-of-the-soul → Settings → Variables and Secrets** and add:

- `BREVO_API_KEY`: a **secret**, containing your Brevo API key.
- `BREVO_DOI_TEMPLATE_ID`: the numeric ID of an active Brevo double opt-in email template, with its confirmation link configured for the Brevo DOI API.

Configure each deployment environment you use (Production for the main `tender-of-the-soul.pages.dev` URL; Preview for branch deployments). Redeploy after setting these values. Keep the existing build command `npm run build` and output directory `dist`. Cloudflare must deploy the root `functions/` directory along with the site through its Git integration or Wrangler; uploading only `dist` through the dashboard will not deploy the Function.

In Brevo, look under **Marketing → Templates → Email** for the double opt-in confirmation template. Verify its sender and confirmation button before using its ID. See [Brevo's DOI API reference](https://developers.brevo.com/reference/create-doi-contact) and [Cloudflare Pages secrets](https://developers.cloudflare.com/pages/functions/bindings/#secrets).

Missing configuration returns an unavailable message without subscribing anyone. Successful submissions prompt visitors to check their inbox; the confirmation email returns them to the current site's homepage with a thank-you message. Local `astro dev` serves the site only; testing the Function requires Cloudflare's Pages runtime. Run the mocked endpoint tests with `node --test tests/newsletter.test.mjs`; these never send real email.

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
