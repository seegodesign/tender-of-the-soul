// tina/config.ts
import { defineConfig } from "tinacms";
var branch = process.env.HEAD || process.env.VERCEL_GIT_COMMIT_REF || process.env.TINA_BRANCH || "main";
var seoFields = [
  { type: "string", name: "title", label: "SEO title", required: true },
  {
    type: "string",
    name: "description",
    label: "SEO description",
    required: true,
    ui: { component: "textarea" }
  }
];
var heroFields = [
  { type: "string", name: "eyebrow", label: "Eyebrow", required: true },
  { type: "string", name: "title", label: "Title", required: true },
  {
    type: "string",
    name: "introduction",
    label: "Introduction",
    required: true,
    ui: { component: "textarea" }
  }
];
var config_default = defineConfig({
  branch,
  clientId: process.env.TINA_CLIENT_ID || "local-client-id",
  token: process.env.TINA_TOKEN || "local-token",
  build: {
    outputFolder: "admin",
    publicFolder: "public"
  },
  media: {
    tina: {
      mediaRoot: "images/uploads",
      publicFolder: "public"
    }
  },
  schema: {
    collections: [
      {
        name: "blog",
        label: "Blog posts",
        path: "src/content/blog",
        format: "md",
        ui: {
          router: ({ document }) => `/blog/${document._sys.filename}`
        },
        fields: [
          { type: "string", name: "title", label: "Title", required: true },
          { type: "string", name: "slug", label: "Slug", required: false },
          {
            type: "datetime",
            name: "publishDate",
            label: "Publish date",
            required: true
          },
          {
            type: "datetime",
            name: "updatedDate",
            label: "Updated date",
            required: false
          },
          {
            type: "string",
            name: "author",
            label: "Author",
            required: true
          },
          {
            type: "string",
            name: "excerpt",
            label: "Excerpt",
            required: true,
            ui: { component: "textarea" }
          },
          {
            type: "image",
            name: "featuredImage",
            label: "Featured image",
            required: false
          },
          {
            type: "string",
            name: "featuredImageAlt",
            label: "Featured image alt text",
            required: false
          },
          {
            type: "string",
            name: "category",
            label: "Category",
            required: true
          },
          {
            type: "string",
            name: "tags",
            label: "Tags",
            list: true,
            required: false
          },
          {
            type: "string",
            name: "seoTitle",
            label: "SEO title",
            required: false
          },
          {
            type: "string",
            name: "metaDescription",
            label: "Meta description",
            required: false,
            ui: { component: "textarea" }
          },
          {
            type: "image",
            name: "socialImage",
            label: "Social sharing image",
            required: false
          },
          {
            type: "boolean",
            name: "draft",
            label: "Draft",
            required: true
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body content",
            isBody: true
          }
        ]
      },
      {
        name: "faqs",
        label: "FAQs",
        path: "src/content/faqs",
        format: "md",
        ui: {
          router: () => "/faqs"
        },
        fields: [
          {
            type: "string",
            name: "question",
            label: "Question",
            required: true
          },
          {
            type: "string",
            name: "category",
            label: "Category",
            required: true,
            options: ["Hakomi", "Sessions", "Practice", "General"]
          },
          {
            type: "number",
            name: "order",
            label: "Display order",
            required: true
          },
          {
            type: "rich-text",
            name: "body",
            label: "Answer",
            isBody: true
          }
        ]
      },
      {
        name: "testimonials",
        label: "Testimonials",
        path: "src/content/testimonials",
        format: "md",
        fields: [
          {
            type: "string",
            name: "clientName",
            label: "Client first name or initials",
            required: true
          },
          {
            type: "string",
            name: "descriptor",
            label: "Client descriptor",
            required: false
          },
          {
            type: "boolean",
            name: "featured",
            label: "Featured",
            required: true
          },
          {
            type: "number",
            name: "order",
            label: "Display order",
            required: true
          },
          {
            type: "boolean",
            name: "placeholder",
            label: "Placeholder",
            required: true
          },
          {
            type: "rich-text",
            name: "body",
            label: "Testimonial",
            isBody: true
          }
        ]
      },
      {
        name: "legal",
        label: "Legal pages",
        path: "src/content/legal",
        format: "md",
        ui: {
          allowedActions: {
            create: false,
            delete: false
          },
          router: ({ document }) => document._sys.filename === "privacy" ? "/privacy" : "/disclaimer"
        },
        fields: [
          { type: "string", name: "title", label: "Page heading", required: true },
          { type: "string", name: "seoTitle", label: "SEO title", required: true },
          { type: "string", name: "eyebrow", label: "Kicker", required: true },
          {
            type: "string",
            name: "introduction",
            label: "Introduction",
            required: true,
            ui: { component: "textarea" }
          },
          {
            type: "string",
            name: "updatedLabel",
            label: "Updated label",
            required: false
          },
          {
            type: "number",
            name: "order",
            label: "Display order",
            required: true
          },
          {
            type: "rich-text",
            name: "body",
            label: "Page content",
            isBody: true
          }
        ]
      },
      {
        name: "homePage",
        label: "Home",
        path: "src/data",
        format: "json",
        match: { include: "home" },
        ui: {
          allowedActions: { create: false, delete: false },
          router: () => "/"
        },
        fields: [
          {
            type: "object",
            name: "hero",
            label: "Hero",
            fields: [
              { type: "string", name: "eyebrow", label: "Eyebrow", required: true },
              { type: "string", name: "headline", label: "Headline", required: true },
              {
                type: "string",
                name: "introduction",
                label: "Introduction",
                required: true,
                ui: { component: "textarea" }
              },
              {
                type: "string",
                name: "primaryCta",
                label: "Primary button label",
                required: true
              },
              {
                type: "string",
                name: "secondaryCta",
                label: "Secondary button label",
                required: true
              },
              {
                type: "string",
                name: "locationLine",
                label: "Location line",
                required: true
              },
              {
                type: "string",
                name: "imageAlt",
                label: "Hero image alt text",
                required: true
              }
            ]
          },
          {
            type: "object",
            name: "welcome",
            label: "Welcome",
            fields: [
              { type: "string", name: "eyebrow", label: "Eyebrow", required: true },
              { type: "string", name: "heading", label: "Heading", required: true },
              {
                type: "string",
                name: "statement",
                label: "Core statement",
                required: true,
                ui: { component: "textarea" }
              },
              {
                type: "string",
                name: "body",
                label: "Body",
                required: true,
                ui: { component: "textarea" }
              },
              { type: "string", name: "linkLabel", label: "Link label", required: true }
            ]
          },
          {
            type: "object",
            name: "insight",
            label: "Beyond understanding",
            fields: [
              { type: "string", name: "eyebrow", label: "Eyebrow", required: true },
              { type: "string", name: "heading", label: "Heading", required: true },
              {
                type: "string",
                name: "lead",
                label: "Lead",
                required: true,
                ui: { component: "textarea" }
              },
              {
                type: "string",
                name: "paragraphOne",
                label: "First paragraph",
                required: true,
                ui: { component: "textarea" }
              },
              {
                type: "string",
                name: "paragraphTwo",
                label: "Second paragraph",
                required: true,
                ui: { component: "textarea" }
              },
              { type: "string", name: "linkLabel", label: "Link label", required: true },
              {
                type: "string",
                name: "diagramLabelOne",
                label: "Diagram first label",
                required: true
              },
              {
                type: "string",
                name: "diagramLabelTwo",
                label: "Diagram second label",
                required: true
              }
            ]
          },
          {
            type: "object",
            name: "approach",
            label: "Approach",
            fields: [
              { type: "string", name: "eyebrow", label: "Eyebrow", required: true },
              { type: "string", name: "heading", label: "Heading", required: true },
              {
                type: "string",
                name: "introduction",
                label: "Introduction",
                required: true,
                ui: { component: "textarea" }
              },
              {
                type: "object",
                name: "principles",
                label: "Principles",
                list: true,
                fields: [
                  { type: "string", name: "number", label: "Number", required: true },
                  { type: "string", name: "title", label: "Title", required: true },
                  {
                    type: "string",
                    name: "description",
                    label: "Description",
                    required: true,
                    ui: { component: "textarea" }
                  }
                ]
              }
            ]
          },
          {
            type: "object",
            name: "permission",
            label: "Permission structure",
            fields: [
              { type: "string", name: "eyebrow", label: "Eyebrow", required: true },
              { type: "string", name: "heading", label: "Heading", required: true },
              {
                type: "string",
                name: "paragraphOne",
                label: "First paragraph",
                required: true,
                ui: { component: "textarea" }
              },
              {
                type: "string",
                name: "paragraphTwo",
                label: "Second paragraph",
                required: true,
                ui: { component: "textarea" }
              },
              {
                type: "string",
                name: "quote",
                label: "Quote",
                required: true,
                ui: { component: "textarea" }
              },
              {
                type: "string",
                name: "attribution",
                label: "Attribution",
                required: true
              }
            ]
          },
          {
            type: "object",
            name: "possibility",
            label: "Possibilities",
            fields: [
              { type: "string", name: "eyebrow", label: "Eyebrow", required: true },
              { type: "string", name: "heading", label: "Heading", required: true },
              {
                type: "string",
                name: "items",
                label: "Possibility statements",
                list: true,
                required: true
              }
            ]
          },
          {
            type: "object",
            name: "sessions",
            label: "Sessions preview",
            fields: [
              { type: "string", name: "eyebrow", label: "Eyebrow", required: true },
              { type: "string", name: "heading", label: "Heading", required: true },
              {
                type: "string",
                name: "introduction",
                label: "Introduction",
                required: true,
                ui: { component: "textarea" }
              },
              {
                type: "string",
                name: "buttonLabel",
                label: "Button label",
                required: true
              },
              {
                type: "string",
                name: "cardHeading",
                label: "Card heading",
                required: true
              },
              {
                type: "string",
                name: "items",
                label: "Session details",
                list: true,
                required: true
              }
            ]
          }
        ]
      },
      {
        name: "aboutPage",
        label: "About",
        path: "src/data",
        format: "json",
        match: { include: "about" },
        ui: {
          allowedActions: { create: false, delete: false },
          router: () => "/about"
        },
        fields: [
          { type: "object", name: "seo", label: "SEO", fields: [...seoFields] },
          { type: "object", name: "hero", label: "Page introduction", fields: [...heroFields] },
          {
            type: "object",
            name: "portrait",
            label: "Practitioner portrait",
            fields: [
              { type: "image", name: "image", label: "Portrait image", required: false },
              { type: "string", name: "altText", label: "Image alt text", required: true },
              {
                type: "string",
                name: "placeholderHeading",
                label: "Placeholder heading",
                required: true
              },
              {
                type: "string",
                name: "placeholderNote",
                label: "Placeholder note",
                required: true
              }
            ]
          },
          {
            type: "object",
            name: "introduction",
            label: "About Elana",
            fields: [
              { type: "string", name: "eyebrow", label: "Eyebrow", required: true },
              { type: "string", name: "heading", label: "Heading", required: true },
              {
                type: "string",
                name: "statement",
                label: "Practitioner statement",
                required: true,
                ui: { component: "textarea" }
              },
              {
                type: "string",
                name: "paragraphOne",
                label: "First paragraph",
                required: true,
                ui: { component: "textarea" }
              },
              {
                type: "string",
                name: "paragraphTwo",
                label: "Second paragraph",
                required: true,
                ui: { component: "textarea" }
              }
            ]
          },
          {
            type: "object",
            name: "orientation",
            label: "Orientation",
            fields: [
              { type: "string", name: "eyebrow", label: "Eyebrow", required: true },
              { type: "string", name: "heading", label: "Heading", required: true },
              {
                type: "string",
                name: "statement",
                label: "Lead statement",
                required: true,
                ui: { component: "textarea" }
              },
              {
                type: "string",
                name: "body",
                label: "Body",
                required: true,
                ui: { component: "textarea" }
              }
            ]
          },
          {
            type: "object",
            name: "credentials",
            label: "Training and background",
            fields: [
              { type: "string", name: "eyebrow", label: "Eyebrow", required: true },
              { type: "string", name: "heading", label: "Heading", required: true },
              {
                type: "string",
                name: "introduction",
                label: "Introduction",
                required: true,
                ui: { component: "textarea" }
              },
              {
                type: "object",
                name: "items",
                label: "Practice details",
                list: true,
                fields: [
                  { type: "string", name: "label", label: "Label", required: true },
                  {
                    type: "string",
                    name: "description",
                    label: "Description",
                    required: true,
                    ui: { component: "textarea" }
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        name: "contactPage",
        label: "Contact",
        path: "src/data",
        format: "json",
        match: { include: "contact" },
        ui: {
          allowedActions: { create: false, delete: false },
          router: () => "/contact"
        },
        fields: [
          { type: "object", name: "seo", label: "SEO", fields: [...seoFields] },
          { type: "object", name: "hero", label: "Page introduction", fields: [...heroFields] },
          {
            type: "object",
            name: "introduction",
            label: "Discovery call introduction",
            fields: [
              { type: "string", name: "eyebrow", label: "Eyebrow", required: true },
              { type: "string", name: "heading", label: "Heading", required: true },
              {
                type: "string",
                name: "body",
                label: "Body",
                required: true,
                ui: { component: "textarea" }
              }
            ]
          },
          {
            type: "object",
            name: "details",
            label: "Practice details",
            list: true,
            fields: [
              { type: "string", name: "label", label: "Label", required: true },
              { type: "string", name: "value", label: "Value", required: true }
            ]
          },
          {
            type: "object",
            name: "urgentNotice",
            label: "Urgent-support notice",
            fields: [
              { type: "string", name: "heading", label: "Heading", required: true },
              {
                type: "string",
                name: "body",
                label: "Body",
                required: true,
                ui: { component: "textarea" }
              }
            ]
          },
          {
            type: "object",
            name: "form",
            label: "Contact form",
            fields: [
              {
                type: "string",
                name: "firstNameLabel",
                label: "First-name label",
                required: true
              },
              {
                type: "string",
                name: "lastNameLabel",
                label: "Last-name label",
                required: true
              },
              {
                type: "string",
                name: "emailLabel",
                label: "Email label",
                required: true
              },
              {
                type: "string",
                name: "phoneLabel",
                label: "Phone label",
                required: true
              },
              {
                type: "string",
                name: "optionalLabel",
                label: "Optional-field label",
                required: true
              },
              {
                type: "string",
                name: "meetingLegend",
                label: "Meeting preference question",
                required: true
              },
              {
                type: "object",
                name: "meetingOptions",
                label: "Meeting options",
                list: true,
                fields: [
                  { type: "string", name: "label", label: "Label", required: true },
                  { type: "string", name: "value", label: "Value", required: true }
                ]
              },
              {
                type: "string",
                name: "messageLabel",
                label: "Message label",
                required: true
              },
              {
                type: "string",
                name: "messageGuidance",
                label: "Message guidance",
                required: true,
                ui: { component: "textarea" }
              },
              {
                type: "string",
                name: "consentLabel",
                label: "Consent label",
                required: true
              },
              {
                type: "string",
                name: "buttonLabel",
                label: "Button label",
                required: true
              },
              {
                type: "string",
                name: "privacyPrefix",
                label: "Privacy copy prefix",
                required: true
              },
              {
                type: "string",
                name: "privacyLinkLabel",
                label: "Privacy link label",
                required: true
              }
            ]
          }
        ]
      },
      {
        name: "faqsPage",
        label: "FAQs page",
        path: "src/data",
        format: "json",
        match: { include: "faqsPage" },
        ui: {
          allowedActions: { create: false, delete: false },
          router: () => "/faqs"
        },
        fields: [
          { type: "object", name: "seo", label: "SEO", fields: [...seoFields] },
          { type: "object", name: "hero", label: "Hero", fields: [...heroFields] }
        ]
      },
      {
        name: "hakomiPage",
        label: "Hakomi page",
        path: "src/data",
        format: "json",
        match: { include: "hakomi" },
        ui: {
          allowedActions: { create: false, delete: false },
          router: () => "/hakomi"
        },
        fields: [
          { type: "object", name: "seo", label: "SEO", fields: [...seoFields] },
          { type: "object", name: "hero", label: "Hero", fields: [...heroFields] },
          {
            type: "object",
            name: "overview",
            label: "Overview",
            fields: [
              {
                type: "string",
                name: "lead",
                label: "Lead",
                required: true,
                ui: { component: "textarea" }
              },
              {
                type: "string",
                name: "paragraphOne",
                label: "First paragraph",
                required: true,
                ui: { component: "textarea" }
              },
              {
                type: "string",
                name: "paragraphTwo",
                label: "Second paragraph",
                required: true,
                ui: { component: "textarea" }
              }
            ]
          },
          {
            type: "object",
            name: "foundations",
            label: "Foundations",
            fields: [
              { type: "string", name: "eyebrow", label: "Eyebrow", required: true },
              { type: "string", name: "heading", label: "Heading", required: true },
              {
                type: "object",
                name: "items",
                label: "Foundation items",
                list: true,
                fields: [
                  { type: "string", name: "number", label: "Number", required: true },
                  { type: "string", name: "title", label: "Title", required: true },
                  {
                    type: "string",
                    name: "description",
                    label: "Description",
                    required: true,
                    ui: { component: "textarea" }
                  }
                ]
              }
            ]
          },
          {
            type: "object",
            name: "signals",
            label: "Body signals",
            fields: [
              { type: "string", name: "eyebrow", label: "Eyebrow", required: true },
              { type: "string", name: "heading", label: "Heading", required: true },
              {
                type: "string",
                name: "items",
                label: "Signal items",
                list: true,
                required: true
              }
            ]
          },
          {
            type: "object",
            name: "process",
            label: "Process",
            fields: [
              { type: "string", name: "eyebrow", label: "Eyebrow", required: true },
              { type: "string", name: "heading", label: "Heading", required: true },
              {
                type: "string",
                name: "paragraphOne",
                label: "First paragraph",
                required: true,
                ui: { component: "textarea" }
              },
              {
                type: "string",
                name: "paragraphTwo",
                label: "Second paragraph",
                required: true,
                ui: { component: "textarea" }
              },
              {
                type: "string",
                name: "statement",
                label: "Statement",
                required: true,
                ui: { component: "textarea" }
              }
            ]
          },
          {
            type: "object",
            name: "related",
            label: "Related ways of working",
            fields: [
              { type: "string", name: "heading", label: "Heading", required: true },
              {
                type: "string",
                name: "paragraphOne",
                label: "First paragraph",
                required: true,
                ui: { component: "textarea" }
              },
              {
                type: "string",
                name: "paragraphTwo",
                label: "Second paragraph",
                required: true,
                ui: { component: "textarea" }
              }
            ]
          },
          {
            type: "object",
            name: "fit",
            label: "Is Hakomi right for me?",
            fields: [
              { type: "string", name: "heading", label: "Heading", required: true },
              {
                type: "string",
                name: "body",
                label: "Body",
                required: true,
                ui: { component: "textarea" }
              },
              { type: "string", name: "buttonLabel", label: "Button label", required: true }
            ]
          }
        ]
      },
      {
        name: "journalPage",
        label: "Journal page",
        path: "src/data",
        format: "json",
        match: { include: "journal" },
        ui: {
          allowedActions: { create: false, delete: false },
          router: () => "/blog"
        },
        fields: [
          { type: "object", name: "seo", label: "SEO", fields: [...seoFields] },
          { type: "object", name: "hero", label: "Hero", fields: [...heroFields] },
          { type: "string", name: "readLabel", label: "Read label", required: true },
          { type: "string", name: "backLabel", label: "Back label", required: true },
          {
            type: "string",
            name: "authorPrefix",
            label: "Author prefix",
            required: true
          }
        ]
      },
      {
        name: "notFoundPage",
        label: "404 page",
        path: "src/data",
        format: "json",
        match: { include: "notFound" },
        ui: {
          allowedActions: { create: false, delete: false },
          router: () => "/404"
        },
        fields: [
          { type: "string", name: "seoTitle", label: "SEO title", required: true },
          { type: "string", name: "eyebrow", label: "Eyebrow", required: true },
          { type: "string", name: "heading", label: "Heading", required: true },
          {
            type: "string",
            name: "body",
            label: "Body",
            required: true,
            ui: { component: "textarea" }
          },
          { type: "string", name: "homeButton", label: "Home button label", required: true },
          {
            type: "string",
            name: "contactButton",
            label: "Contact button label",
            required: true
          }
        ]
      },
      {
        name: "sessionsPage",
        label: "Sessions page",
        path: "src/data",
        format: "json",
        match: { include: "sessions" },
        ui: {
          allowedActions: { create: false, delete: false },
          router: () => "/sessions"
        },
        fields: [
          { type: "object", name: "seo", label: "SEO", fields: [...seoFields] },
          { type: "object", name: "hero", label: "Hero", fields: [...heroFields] },
          {
            type: "object",
            name: "details",
            label: "Session details",
            list: true,
            fields: [
              { type: "string", name: "number", label: "Number", required: true },
              { type: "string", name: "heading", label: "Heading", required: true },
              {
                type: "string",
                name: "body",
                label: "Body",
                required: true,
                ui: { component: "textarea" }
              }
            ]
          },
          {
            type: "object",
            name: "expect",
            label: "What to expect",
            fields: [
              { type: "string", name: "eyebrow", label: "Eyebrow", required: true },
              { type: "string", name: "heading", label: "Heading", required: true },
              {
                type: "string",
                name: "paragraphOne",
                label: "First paragraph",
                required: true,
                ui: { component: "textarea" }
              },
              {
                type: "string",
                name: "paragraphTwo",
                label: "Second paragraph",
                required: true,
                ui: { component: "textarea" }
              },
              {
                type: "object",
                name: "steps",
                label: "Process steps",
                list: true,
                fields: [
                  { type: "string", name: "heading", label: "Heading", required: true },
                  {
                    type: "string",
                    name: "body",
                    label: "Body",
                    required: true,
                    ui: { component: "textarea" }
                  }
                ]
              }
            ]
          },
          {
            type: "object",
            name: "choice",
            label: "Choice remains with you",
            fields: [
              {
                type: "string",
                name: "quote",
                label: "Quote",
                required: true,
                ui: { component: "textarea" }
              },
              { type: "string", name: "eyebrow", label: "Eyebrow", required: true },
              { type: "string", name: "heading", label: "Heading", required: true },
              {
                type: "string",
                name: "paragraphOne",
                label: "First paragraph",
                required: true,
                ui: { component: "textarea" }
              },
              {
                type: "string",
                name: "paragraphTwo",
                label: "Second paragraph",
                required: true,
                ui: { component: "textarea" }
              }
            ]
          },
          {
            type: "object",
            name: "firstSession",
            label: "First session",
            fields: [
              { type: "string", name: "eyebrow", label: "Eyebrow", required: true },
              { type: "string", name: "heading", label: "Heading", required: true },
              {
                type: "string",
                name: "statement",
                label: "Statement",
                required: true,
                ui: { component: "textarea" }
              },
              {
                type: "string",
                name: "body",
                label: "Body",
                required: true,
                ui: { component: "textarea" }
              },
              { type: "string", name: "buttonLabel", label: "Button label", required: true }
            ]
          }
        ]
      },
      {
        name: "siteSettings",
        label: "Site settings",
        path: "src/data",
        format: "json",
        match: { include: "site" },
        ui: {
          allowedActions: { create: false, delete: false }
        },
        fields: [
          {
            type: "string",
            name: "practiceName",
            label: "Practice name",
            required: true
          },
          {
            type: "string",
            name: "practitionerName",
            label: "Practitioner name",
            required: true
          },
          { type: "string", name: "email", label: "Email", required: true },
          { type: "string", name: "phone", label: "Phone", required: false },
          { type: "string", name: "location", label: "Location", required: true },
          {
            type: "string",
            name: "socialLinks",
            label: "Social links",
            list: true,
            required: false
          },
          {
            type: "string",
            name: "discoveryCallLabel",
            label: "Discovery call label",
            required: true
          },
          {
            type: "string",
            name: "contactFormHeading",
            label: "Contact form heading",
            required: true
          },
          {
            type: "string",
            name: "contactFormIntroduction",
            label: "Contact form introduction",
            required: true,
            ui: { component: "textarea" }
          },
          {
            type: "string",
            name: "defaultSeoTitle",
            label: "Default SEO title",
            required: true
          },
          {
            type: "string",
            name: "defaultMetaDescription",
            label: "Default meta description",
            required: true,
            ui: { component: "textarea" }
          },
          {
            type: "image",
            name: "defaultSocialImage",
            label: "Default social image",
            required: true
          },
          {
            type: "string",
            name: "footerDisclaimer",
            label: "Footer disclaimer",
            required: true
          },
          {
            type: "string",
            name: "crisisDisclaimer",
            label: "Crisis disclaimer",
            required: true
          },
          {
            type: "object",
            name: "navigation",
            label: "Navigation",
            fields: [
              { type: "string", name: "about", label: "About label", required: true },
              { type: "string", name: "hakomi", label: "Hakomi label", required: true },
              {
                type: "string",
                name: "sessions",
                label: "Sessions label",
                required: true
              },
              { type: "string", name: "faqs", label: "FAQs label", required: true },
              {
                type: "string",
                name: "journal",
                label: "Journal label",
                required: true
              },
              {
                type: "string",
                name: "contact",
                label: "Contact label",
                required: true
              },
              {
                type: "string",
                name: "menuLabel",
                label: "Menu button label",
                required: true
              },
              {
                type: "string",
                name: "ariaLabel",
                label: "Navigation aria label",
                required: true
              }
            ]
          },
          {
            type: "object",
            name: "footer",
            label: "Footer",
            fields: [
              { type: "string", name: "ctaEyebrow", label: "CTA eyebrow", required: true },
              { type: "string", name: "ctaHeading", label: "CTA heading", required: true },
              {
                type: "string",
                name: "ctaBody",
                label: "CTA body",
                required: true,
                ui: { component: "textarea" }
              },
              {
                type: "string",
                name: "ctaButton",
                label: "CTA button",
                required: true
              },
              {
                type: "string",
                name: "practiceDescription",
                label: "Practice description",
                required: true
              },
              {
                type: "string",
                name: "locationLine",
                label: "Location line",
                required: true
              },
              {
                type: "string",
                name: "importantLabel",
                label: "Important label",
                required: true
              },
              {
                type: "string",
                name: "privacyLabel",
                label: "Privacy link label",
                required: true
              },
              {
                type: "string",
                name: "disclaimerLabel",
                label: "Disclaimer link label",
                required: true
              },
              {
                type: "string",
                name: "creditPrefix",
                label: "Credit prefix",
                required: true
              },
              {
                type: "string",
                name: "creditLabel",
                label: "Credit label",
                required: true
              },
              {
                type: "string",
                name: "creditUrl",
                label: "Credit URL",
                required: true
              }
            ]
          }
        ]
      }
    ]
  }
});
export {
  config_default as default
};
