const ENHANCEMENTS_URL = "data/enhancements.json";

function eEsc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function eSectionHeading(section) {
  return `
    <div class="section__heading">
      <div>
        <p class="eyebrow">${eEsc(section.eyebrow)}</p>
        <h2>${eEsc(section.title)}</h2>
      </div>
      ${section.description ? `<p>${eEsc(section.description)}</p>` : ""}
    </div>
  `;
}

function renderCapability(data) {
  const cards = (data.items || [])
    .map(
      (item) => `
        <article class="enhancement-card">
          <h3>${eEsc(item.title)}</h3>
          <p>${eEsc(item.text)}</p>
        </article>
      `
    )
    .join("");
  const stats = (data.stats || [])
    .map(
      (item) => `
        <div class="capability-stat">
          <strong>${eEsc(item.value)}</strong>
          <span>${eEsc(item.label)}</span>
        </div>
      `
    )
    .join("");

  return `
    <section class="section enhancement-section" id="capability">
      <div class="container">
        ${eSectionHeading(data)}
        <div class="capability-stats">${stats}</div>
        <div class="grid grid--4">${cards}</div>
      </div>
    </section>
  `;
}

function renderCaseStudies(data) {
  const items = (data.items || [])
    .map(
      (item) => `
        <article class="case-card">
          <img src="${eEsc(item.image)}" alt="${eEsc(item.title)}">
          <div class="case-card__body">
            <h3>${eEsc(item.title)}</h3>
            <dl>
              <div>
                <dt>Bối cảnh</dt>
                <dd>${eEsc(item.context)}</dd>
              </div>
              <div>
                <dt>Giải pháp</dt>
                <dd>${eEsc(item.solution)}</dd>
              </div>
              <div>
                <dt>Kết quả</dt>
                <dd>${eEsc(item.result)}</dd>
              </div>
            </dl>
          </div>
        </article>
      `
    )
    .join("");

  return `
    <section class="section section--stone enhancement-section" id="case-studies">
      <div class="container">
        ${eSectionHeading(data)}
        <div class="case-grid">${items}</div>
      </div>
    </section>
  `;
}

function renderPricingNotes(data) {
  const items = (data.items || []).map((item) => `<li>${eEsc(item)}</li>`).join("");
  return `
    <section class="section pricing-note-section" id="pricing-notes">
      <div class="container pricing-note">
        <div>
          <p class="eyebrow">${eEsc(data.eyebrow)}</p>
          <h2>${eEsc(data.title)}</h2>
        </div>
        <ul>${items}</ul>
      </div>
    </section>
  `;
}

function renderTestimonials(data) {
  const items = (data.items || [])
    .map(
      (item) => `
        <article class="testimonial-card">
          <p>“${eEsc(item.quote)}”</p>
          <strong>${eEsc(item.name)}</strong>
          <span>${eEsc(item.project)} · ${eEsc(item.location)}</span>
        </article>
      `
    )
    .join("");

  return `
    <section class="section section--blue enhancement-section" id="testimonials">
      <div class="container">
        ${eSectionHeading(data)}
        <div class="grid grid--3">${items}</div>
      </div>
    </section>
  `;
}

function renderSeoArticles(data) {
  const items = (data.items || [])
    .map(
      (item) => `
        <article class="seo-card">
          <span>${eEsc(item.tag)}</span>
          <h3>${eEsc(item.title)}</h3>
          <p>${eEsc(item.excerpt)}</p>
        </article>
      `
    )
    .join("");

  return `
    <section class="section section--stone enhancement-section" id="knowledge">
      <div class="container">
        ${eSectionHeading(data)}
        <div class="grid grid--4">${items}</div>
      </div>
    </section>
  `;
}

function renderFaq(data) {
  const items = (data.items || [])
    .map(
      (item) => `
        <details class="faq-item">
          <summary>${eEsc(item.question)}</summary>
          <p>${eEsc(item.answer)}</p>
        </details>
      `
    )
    .join("");

  return `
    <section class="section enhancement-section" id="faq">
      <div class="container faq-layout">
        <div>
          <p class="eyebrow">${eEsc(data.eyebrow)}</p>
          <h2>${eEsc(data.title)}</h2>
        </div>
        <div class="faq-list">${items}</div>
      </div>
    </section>
  `;
}

function enhanceContactForm(data) {
  const form = document.getElementById("contact-form");
  const grid = form?.querySelector(".form-grid");
  if (!form || !grid || form.dataset.enhanced === "true") return;
  const startOptions = (data.contactEnhancement?.startOptions || []).map((value) => `<option value="${eEsc(value)}">${eEsc(value)}</option>`).join("");
  const methodOptions = (data.contactEnhancement?.contactMethodOptions || []).map((value) => `<option value="${eEsc(value)}">${eEsc(value)}</option>`).join("");

  const fields = document.createElement("template");
  fields.innerHTML = `
    <label class="field">
      <span>Diện tích dự kiến</span>
      <input name="buildArea" placeholder="Ví dụ: 5m x 18m, 180m2 sàn">
    </label>
    <label class="field">
      <span>Số tầng dự kiến</span>
      <input name="floors" placeholder="Ví dụ: 1 trệt 2 lầu">
    </label>
    <label class="field">
      <span>Thời gian khởi công</span>
      <select name="startTime">${startOptions}</select>
    </label>
    <label class="field">
      <span>Hình thức liên hệ</span>
      <select name="preferredContact">${methodOptions}</select>
    </label>
  `;

  const messageField = grid.querySelector("textarea[name='message']")?.closest("label");
  if (messageField) {
    grid.insertBefore(fields.content, messageField);
  } else {
    grid.appendChild(fields.content);
  }
  form.dataset.enhanced = "true";
}

function insertEnhancements(data) {
  const contact = document.getElementById("contact");
  if (!contact || document.getElementById("capability")) return;
  contact.insertAdjacentHTML(
    "beforebegin",
    [
      renderCapability(data.capability || {}),
      renderCaseStudies(data.caseStudies || {}),
      renderPricingNotes(data.pricingNotes || {}),
      renderTestimonials(data.testimonials || {}),
      renderSeoArticles(data.seoArticles || {}),
      renderFaq(data.faq || {}),
    ].join("")
  );
  enhanceContactForm(data);
}

async function loadEnhancements() {
  const response = await fetch(ENHANCEMENTS_URL, { cache: "no-store" });
  if (!response.ok) throw new Error("Không tải được nội dung mở rộng.");
  return response.json();
}

function waitForContactThenEnhance(data, attempt = 0) {
  if (document.getElementById("contact")) {
    insertEnhancements(data);
    return;
  }
  if (attempt > 40) return;
  window.setTimeout(() => waitForContactThenEnhance(data, attempt + 1), 150);
}

loadEnhancements()
  .then((data) => waitForContactThenEnhance(data))
  .catch(() => {});
