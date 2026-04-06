const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

// --- Config ---
const VARIANTS_DIR = path.join(__dirname, "data", "variants");
const CSS_FILE = path.join(__dirname, "css", "styles.css");
const APP_JS_FILE = path.join(__dirname, "js", "app.js");
const OUTPUT_FILE = path.join(__dirname, "index.html");

// --- Load base files ---
function loadBase(name) {
  const file = path.join(__dirname, "data", `${name}.yaml`);
  return yaml.load(fs.readFileSync(file, "utf-8"));
}

// --- Merge variant onto base (shallow per top-level key) ---
function mergeVariant(base, variant) {
  const merged = { ...base };
  for (const key of Object.keys(variant)) {
    if (key === "base" || key === "label" || key === "order") continue;
    merged[key] = variant[key];
  }
  return merged;
}

// --- HTML helpers ---
function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// --- Render: Header ---
function renderHeader(data) {
  const contact = data.contact;
  const parts = [];
  if (contact.phone) {
    parts.push(`<span><i class="fas fa-phone"></i> <a href="${esc(contact.phone_link)}">${esc(contact.phone)}</a></span>`);
  }
  if (contact.email) {
    parts.push(`<span><i class="fas fa-envelope"></i> <a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></span>`);
  }
  if (contact.linkedin) {
    parts.push(`<span><i class="fab fa-linkedin"></i> <a href="${esc(contact.linkedin.url)}">${esc(contact.linkedin.label)}</a></span>`);
  }
  if (contact.github) {
    parts.push(`<span><i class="fab fa-github"></i> <a href="${esc(contact.github.url)}">${esc(contact.github.label)}</a></span>`);
  }

  return `
    <header>
      <h1>${esc(data.name)}</h1>
      <div class="contact-info">
        ${parts.join("\n        ")}
      </div>
    </header>`;
}

// --- Icon helper ---
function icon(cls) {
  return `<i class="${cls}"></i> `;
}

// --- Render: Summary ---
function renderSummary(summary, lang) {
  const heading = lang === "he" ? "תקציר מקצועי" : "Professional Summary";
  return `
      <section>
        <h2>${icon("fas fa-user-tie")}${heading}</h2>
        <p>${esc(summary)}</p>
      </section>`;
}

// --- Render: Projects ---
function renderProjects(projects, lang) {
  if (!projects || projects === false) return "";
  let html = "";

  for (const cat of projects.categories) {
    html += `
      <section>
        <h2>${icon("fas fa-code")}${esc(cat.heading)}</h2>`;

    // Condensed category with description + links
    if (cat.description && !cat.items) {
      html += `
        <div class="project-item">
          <p>${esc(cat.description)}</p>`;
      if (cat.links) {
        const linkHtml = cat.links
          .map((l) => `<a href="${esc(l.url)}" style="font-size:8.5pt;color:var(--accent)">${esc(l.label)} <i class="fas fa-external-link-alt"></i></a>`)
          .join(" &middot; ");
        html += `<p>${linkHtml}</p>`;
      }
      if (cat.tech) {
        html += `<div class="tech-stack">${esc(cat.tech)}</div>`;
      }
      html += `</div>`;
    }

    // Items list
    if (cat.items) {
      for (const item of cat.items) {
        const titleText = item.url
          ? `<a href="${esc(item.url)}">${esc(item.title)}${item.subtitle ? " - " + esc(item.subtitle) : ""} <i class="fas fa-external-link-alt"></i></a>`
          : `${esc(item.title)}${item.subtitle ? " - " + esc(item.subtitle) : ""}`;

        html += `
        <div class="project-item">
          <h3>${titleText}</h3>`;
        if (item.description) {
          html += `<p>${esc(item.description)}</p>`;
        }
        if (item.tech) {
          html += `<div class="tech-stack">${esc(item.tech)}</div>`;
        }
        html += `</div>`;
      }
    }

    html += `
      </section>`;
  }
  return html;
}

// --- Render: Experience ---
function renderExperience(experience, lang) {
  if (!experience) return "";
  const heading = lang === "he" ? "ניסיון מקצועי" : "Experience";
  let html = `
      <section>
        <h2>${icon("fas fa-briefcase")}${heading}</h2>`;

  for (const job of experience) {
    let titleText = esc(job.title);
    if (job.role) titleText += ` | ${esc(job.role)}`;
    if (job.org) titleText += ` | ${esc(job.org)}`;

    html += `
        <div class="experience-item">
          <div class="item-header">
            <h3>${titleText}</h3>
            <span class="date">${esc(job.period)}</span>
          </div>`;

    if (job.description) {
      html += `<p>${esc(job.description)}</p>`;
    }
    if (job.note) {
      html += `<div class="tech-stack">${esc(job.note)}</div>`;
    }
    if (job.bullets) {
      html += "<ul>";
      for (const b of job.bullets) {
        html += `<li>${esc(b)}</li>`;
      }
      html += "</ul>";
    }
    html += `</div>`;
  }

  html += `
      </section>`;
  return html;
}

// --- Render: Sidebar sections ---
function renderSkillsSidebar(skills) {
  if (!skills) return "";
  const label = skills.label || "Skills";
  let html = `
        <section class="sidebar-section">
          <h2>${icon("fas fa-tools")}${esc(label)}</h2>
          <div class="badge-container">`;
  for (const s of skills.items) {
    html += `<span class="badge">${esc(s)}</span>`;
  }
  html += `
          </div>
        </section>`;
  return html;
}

function renderEducationSidebar(education, lang) {
  if (!education) return "";
  const heading = lang === "he" ? "השכלה" : "Education";
  let html = `
        <section class="sidebar-section">
          <h2>${icon("fas fa-graduation-cap")}${heading}</h2>`;

  for (const edu of education) {
    html += `<p><strong>${esc(edu.degree)}</strong><br>${esc(edu.institution)} | ${esc(edu.period)}`;
    if (edu.description) {
      html += `<br><em>${esc(edu.description)}</em>`;
    }
    html += `</p>`;
  }

  html += `
        </section>`;
  return html;
}

function renderMilitarySidebar(military, lang) {
  if (!military) return "";
  const heading = lang === "he" ? "שירות צבאי" : "Military";
  let html = `
        <section class="sidebar-section">
          <h2>${icon("fas fa-medal")}${heading}</h2>`;

  for (const m of military) {
    html += `<p><strong>${esc(m.role)}</strong><br>${esc(m.unit)} | ${esc(m.period)}`;
    if (m.description) {
      html += `<br><em>${esc(m.description)}</em>`;
    }
    html += `</p>`;
  }

  html += `
        </section>`;
  return html;
}

function renderLanguagesSidebar(languages, lang) {
  if (!languages) return "";
  const heading = lang === "he" ? "שפות" : "Languages";
  let html = `
        <section class="sidebar-section">
          <h2>${icon("fas fa-language")}${heading}</h2>
          <p>`;
  const lines = languages.map(
    (l) => `<strong>${esc(l.name)}:</strong> ${esc(l.level)}`
  );
  html += lines.join("<br>");
  html += `</p>
        </section>`;
  return html;
}

// --- Render a single page ---
function renderPage(data) {
  const lang = data.lang || "en";

  const mainCol = [
    renderSummary(data.summary, lang),
    renderProjects(data.projects, lang),
    renderExperience(data.experience, lang),
  ]
    .filter(Boolean)
    .join("");

  const sideCol = [
    renderSkillsSidebar(data.skills),
    renderEducationSidebar(data.education, lang),
    renderMilitarySidebar(data.military, lang),
    renderLanguagesSidebar(data.languages, lang),
  ]
    .filter(Boolean)
    .join("");

  const headerHtml = renderHeader(data);
  const rtlClass = lang === "he" ? " rtl" : "";
  const simpleClass = data.layout === "simple" ? " simple" : "";

  return `
    <div class="page${rtlClass}${simpleClass}">
      ${headerHtml}
      <div class="cv-body">
        <div class="main-col">
          ${mainCol}
        </div>
        <div class="side-col">
          ${sideCol}
        </div>
      </div>
    </div>`;
}

// --- Build full tab HTML (supports multiple pages) ---
function renderTab(data, extraPages) {
  const lang = data.lang || "en";
  let pageHtml = renderPage(data);

  if (extraPages) {
    for (const pageConfig of extraPages) {
      pageHtml += renderPage(pageConfig);
    }
  }

  return { pageHtml, lang };
}

// --- Main build ---
function build() {
  const css = fs.readFileSync(CSS_FILE, "utf-8");
  const appJs = fs.readFileSync(APP_JS_FILE, "utf-8");

  const variantFiles = fs
    .readdirSync(VARIANTS_DIR)
    .filter((f) => f.endsWith(".yaml"))
    .sort();

  const tabs = [];

  for (const file of variantFiles) {
    const variant = yaml.load(
      fs.readFileSync(path.join(VARIANTS_DIR, file), "utf-8")
    );
    const baseName = variant.base || "base-en";
    const base = loadBase(baseName);
    const merged = mergeVariant(base, variant);

    // Build extra pages if defined
    let extraPages = null;
    if (variant.pages) {
      extraPages = variant.pages.map((pageDef) => {
        const pageBase = loadBase(pageDef.base || baseName);
        return mergeVariant(pageBase, pageDef);
      });
    }

    const slug = file.replace(".yaml", "");
    const id = slug.endsWith("-view") ? slug : slug + "-view";
    const label = variant.label || file.replace(".yaml", "");
    const order = variant.order || 999;
    const { pageHtml, lang } = renderTab(merged, extraPages);
    tabs.push({ id, label, lang, pageHtml, order });
  }

  tabs.sort((a, b) => a.order - b.order);

  const tabButtons = tabs
    .map(
      (tab, i) =>
        `<button class="tab-btn${i === 0 ? " active" : ""}" data-tab="${tab.id}">${tab.label}</button>`
    )
    .join("\n          ");

  const tabContents = tabs
    .map((tab, i) => {
      const activeClass = i === 0 ? " active" : "";
      return `
    <div class="cv-content${activeClass}" id="${tab.id}">
      ${tab.pageHtml}
    </div>`;
    })
    .join("\n");

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Yonatan Vasilevski - CV</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
    <style>
${css}
    </style>
  </head>
  <body>
    <div class="tab-bar">
      <div class="view-tabs">
        ${tabButtons}
      </div>
      <button class="download-btn" onclick="window.print()">Download PDF</button>
    </div>
    ${tabContents}
    <script>
${appJs}
    </script>
  </body>
</html>
`;

  fs.writeFileSync(OUTPUT_FILE, html);
  console.log(`Built index.html with ${tabs.length} tabs`);
}

build();
