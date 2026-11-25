# Astro Starter Kit: Minimal

## Newsletter signup on Cloudflare Pages

The footer posts to `functions/api/newsletter.js`. This Pages Function uses Brevo's contacts API to add subscribers directly to **list 3**, without a confirmation email. Existing contacts are updated to include list 3; the request does not change email blocklist settings. The site still builds as static Astro; no Astro server adapter is required.

Newsletter signup has two steps: enter an email address and select **Sign up**, then enter first and last name and select **Complete signup**. The first step makes no signup request and does not create a Brevo contact. Both names are required (up to 100 characters each); the final request sends the email and names together, mapping names to Brevo’s `FIRSTNAME` and `LASTNAME` text attributes. Ensure those attributes exist in the Brevo account. Errors retain the entered details for retry; success clears the form and returns to the email step.

In Cloudflare, select **Workers & Pages → tender-of-the-soul → Settings → Variables and Secrets** and add `BREVO_API_KEY` as a **secret**, containing your Brevo API key with permission to create and update contacts. No email template is required; `BREVO_DOI_TEMPLATE_ID` is no longer used and can be removed.

Signup also requires Cloudflare Turnstile. In **Cloudflare → Turnstile**, create a **Managed** widget for `tender-of-the-soul.pages.dev`, `tenderofthesoul.com`, and `www.tenderofthesoul.com` (include only the domains you use). Add these settings to the Pages project's Production environment:

| Setting | Type | Value |
| --- | --- | --- |
| `PUBLIC_TURNSTILE_SITEKEY` | Optional plain text override; available during the build | Defaults to the public Site Key `0x4AAAAAAGRvXLKyAKNqo4sB` configured in the footer |
| `TURNSTILE_SECRET` | Secret; available to the Function | The widget's Secret Key; never prefix this with `PUBLIC_` |
| `TURNSTILE_HOSTNAMES` | Plain text; available to the Function | `tender-of-the-soul.pages.dev,tenderofthesoul.com,www.tenderofthesoul.com` |

Rebuild and deploy after adding the settings: Astro embeds the public Site Key at build time. The endpoint refuses signup when server configuration is missing. Preview deployments need their own exact hostname in both the widget and their environment's `TURNSTILE_HOSTNAMES`; do not add arbitrary preview domains or localhost to the Production allowlist.

The Function verifies every token with Cloudflare before contacting Brevo, requiring a successful result, action `signup`, and a hostname that matches both the request and the configured allowlist. The form refreshes its challenge after each submission because tokens are single-use; expired or failed checks disable submission. The existing honeypot remains in place. See [Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

`astro dev` automatically uses Cloudflare's [always-pass test widget](https://developers.cloudflare.com/turnstile/troubleshooting/testing/), which works on localhost without changing the production widget's domains. Production builds use the real Site Key. Local Astro serves the frontend only; it does not run the Pages signup Function. Use the mocked tests below to exercise that endpoint locally. Testing real signup through a local Pages runtime requires a real widget registered for the local hostname and the matching server settings in ignored `.dev.vars`; a dummy secret does not return the hostname/action required by our server checks. Never add local hostnames to the Production allowlist. Production validation still requires a fresh real token, a successful signup, and a replay rejection after deployment.

Configure each deployment environment you use (Production for the main `tender-of-the-soul.pages.dev` URL; Preview for branch deployments). Redeploy after setting these values. Keep the existing build command `npm run build` and output directory `dist`. Cloudflare must deploy the root `functions/` directory along with the site through its Git integration or Wrangler; uploading only `dist` through the dashboard will not deploy the Function. See [Brevo's contacts API reference](https://developers.brevo.com/reference/create-contact) and [Cloudflare Pages secrets](https://developers.cloudflare.com/pages/functions/bindings/#secrets).

Missing configuration returns an unavailable message without subscribing anyone. Successful submissions display a thank-you message immediately. Local `astro dev` serves the site only; testing the Function requires Cloudflare's Pages runtime. Run the mocked endpoint and form lifecycle tests with `node --test tests/newsletter*.test.mjs`; these never send real email.

For signup failures, open the deployment's **View details → Functions** logs before retrying. A browser 502 can represent a rejection from Brevo; the server log records its status, recognized error code, list ID, and a filtered `reason`, without raw provider messages or subscriber details. `api_key_permissions` means check the key's contact permissions; `subscriber_list` means check list 3 exists; `ip_authorization` means review Brevo's authorized IP settings. These categories are hints inferred from Brevo's message. `unknown` means the message could not be classified. See [Brevo error responses](https://developers.brevo.com/docs/how-it-works).

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
