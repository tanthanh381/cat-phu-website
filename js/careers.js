const CAREERS_URL = "data/careers.json";

function cEsc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function careersHeading(section) {
  return `
    <div class="section__heading">
      <div>
        <p class="eyebrow">${cEsc(section.eyebrow)}</p>
        <h2>${cEsc(section.title)}</h2>
      </div>
      ${section.description ? `<p>${cEsc(section.description)}</p>` : ""}
    </div>
  `;
}

function renderCareers(data) {
  const introCards = (data.intro?.items || [])
    .map(
      (item) => `
        <article class="career-value-card">
          <h3>${cEsc(item.title)}</h3>
          <p>${cEsc(item.text)}</p>
        </article>
      `
    )
    .join("");

  const positions = (data.positions?.items || [])
    .map(
      (item) => `
        <article class="career-position-card">
          <div class="career-position-card__header">
            <div>
              <h3>${cEsc(item.title)}</h3>
              <p>${cEsc(item.summary)}</p>
            </div>
            <a class="button button--blue" href="#career-apply">Ứng tuyển</a>
          </div>
          <div class="career-meta">
            <span>${cEsc(item.type)}</span>
            <span>${cEsc(item.location)}</span>
            <span>${cEsc(item.experience)}</span>
          </div>
          <ul>${(item.requirements || []).map((requirement) => `<li>${cEsc(requirement)}</li>`).join("")}</ul>
        </article>
      `
    )
    .join("");

  const benefits = (data.benefits?.items || []).map((item) => `<li>${cEsc(item)}</li>`).join("");

  const process = (data.process?.items || [])
    .map(
      (item) => `
        <article class="career-step">
          <strong>${cEsc(item.step)}</strong>
          <h3>${cEsc(item.title)}</h3>
          <p>${cEsc(item.text)}</p>
        </article>
      `
    )
    .join("");

  const subject = encodeURIComponent("Ứng tuyển Cát Phú - Vị trí mong muốn");
  const body = encodeURIComponent(
    [
      "Chào Cát Phú,",
      "",
      "Tôi muốn ứng tuyển vào vị trí:",
      "Họ tên:",
      "Số điện thoại:",
      "Kinh nghiệm/portfolio:",
      "Thời gian có thể bắt đầu:",
      "",
      "Tôi gửi kèm CV/portfolio để Cát Phú xem xét.",
    ].join("\n")
  );

  return `
    <section class="section careers-section" id="careers">
      <div class="container">
        <div class="careers-hero">
          <div>
            <p class="eyebrow">${cEsc(data.hero?.eyebrow || "Tuyển dụng")}</p>
            <h2>${cEsc(data.hero?.title || "Gia nhập Cát Phú")}</h2>
            <p>${cEsc(data.hero?.description || "")}</p>
            <div class="hero__actions">
              <a class="button" href="#career-apply">${cEsc(data.hero?.primaryCta || "Ứng tuyển ngay")}</a>
              <a class="button button--light" href="#career-positions">${cEsc(data.hero?.secondaryCta || "Xem vị trí")}</a>
            </div>
          </div>
        </div>

        <div class="career-block">
          <div class="section__heading">
            <div>
              <p class="eyebrow">Môi trường làm việc</p>
              <h2>${cEsc(data.intro?.title || "Vì sao nên làm việc cùng Cát Phú?")}</h2>
            </div>
          </div>
          <div class="grid grid--3">${introCards}</div>
        </div>
      </div>
    </section>

    <section class="section section--stone" id="career-positions">
      <div class="container">
        ${careersHeading(data.positions || {})}
        <div class="career-position-list">${positions}</div>
      </div>
    </section>

    <section class="section careers-benefits-section">
      <div class="container careers-benefits">
        <div>
          <p class="eyebrow">${cEsc(data.benefits?.eyebrow)}</p>
          <h2>${cEsc(data.benefits?.title)}</h2>
        </div>
        <ul>${benefits}</ul>
      </div>
    </section>

    <section class="section section--stone careers-process-section">
      <div class="container">
        ${careersHeading(data.process || {})}
        <div class="career-process-grid">${process}</div>
      </div>
    </section>

    <section class="section careers-apply-section" id="career-apply">
      <div class="container careers-apply">
        <div>
          <p class="eyebrow">Ứng tuyển</p>
          <h2>${cEsc(data.cta?.title)}</h2>
          <p>${cEsc(data.cta?.description)}</p>
        </div>
        <div class="careers-apply__actions">
          <a class="button button--blue" href="mailto:${cEsc(data.cta?.email)}?subject=${subject}&body=${body}">${cEsc(data.cta?.buttonLabel || "Gửi email ứng tuyển")}</a>
          <a class="button" href="tel:${cEsc(data.cta?.phone)}">Gọi ${cEsc(data.cta?.phone)}</a>
        </div>
      </div>
    </section>
  `;
}

function insertCareers(data) {
  const contact = document.getElementById("contact");
  if (!contact || document.getElementById("careers")) return;
  contact.insertAdjacentHTML("beforebegin", renderCareers(data));
}

function waitForCareersTarget(data, attempt = 0) {
  if (document.getElementById("contact")) {
    insertCareers(data);
    return;
  }
  if (attempt > 40) return;
  window.setTimeout(() => waitForCareersTarget(data, attempt + 1), 150);
}

fetch(CAREERS_URL, { cache: "no-store" })
  .then((response) => (response.ok ? response.json() : Promise.reject(new Error("careers"))))
  .then((data) => waitForCareersTarget(data))
  .catch(() => {});
