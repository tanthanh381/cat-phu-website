const app = document.getElementById("app");
const footer = document.getElementById("footer");
const floatingActions = document.getElementById("floating-actions");

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function telHref(phone) {
  return `tel:${String(phone || "").replace(/[^\d+]/g, "")}`;
}

function mailHref(email) {
  return `mailto:${String(email || "").trim()}`;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return esc(value);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

async function loadContent() {
  const sources = ["/api/content", "data/site.json"];
  let lastError = null;

  for (const source of sources) {
    try {
      const response = await fetch(source, { cache: "no-store" });
      if (response.ok) return response.json();
      lastError = new Error(`Không tải được ${source}.`);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Không tải được nội dung website.");
}

function updateShell(data) {
  document.title = data.meta?.siteTitle || "Cát Phú";
  const meta = document.querySelector("meta[name='description']");
  if (meta) meta.setAttribute("content", data.meta?.description || "");

  const company = data.company || {};
  document.getElementById("top-address").textContent = company.address || "";
  document.getElementById("top-phone").textContent = company.phone || "";
  document.getElementById("top-phone").href = telHref(company.phone);
  document.getElementById("top-email").textContent = company.email || "";
  document.getElementById("top-email").href = mailHref(company.email);
  document.getElementById("top-fanpage").href = data.meta?.fanpage || "#";
  document.getElementById("brand-logo").src = company.logo || "assets/logo-cat-phu.svg";
  document.getElementById("brand-name").textContent = company.name || "Cát Phú";
  document.getElementById("brand-tagline").textContent = company.tagline || "";
}

function renderHero(hero) {
  const stats = (hero.stats || [])
    .map(
      (item) => `
        <div class="hero__stat">
          <strong>${esc(item.value)}</strong>
          <span>${esc(item.label)}</span>
        </div>
      `
    )
    .join("");

  return `
    <section class="hero">
      <img class="hero__image" src="${esc(hero.image)}" alt="${esc(hero.title)}">
      <div class="container">
        <div class="hero__content">
          <p class="eyebrow">${esc(hero.eyebrow)}</p>
          <h1>${esc(hero.title)}</h1>
          <p>${esc(hero.description)}</p>
          <div class="hero__actions">
            <a class="button" href="#contact">${esc(hero.primaryCta || "Liên hệ")}</a>
            <a class="button button--light" href="#process">${esc(hero.secondaryCta || "Xem thêm")}</a>
          </div>
          <div class="hero__stats">${stats}</div>
        </div>
      </div>
    </section>
  `;
}

function renderProblems(problems) {
  const items = (problems.items || [])
    .map(
      (item, index) => `
        <article class="problem-card">
          <div class="problem-card__index">${String(index + 1).padStart(2, "0")}</div>
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.text)}</p>
        </article>
      `
    )
    .join("");

  return `
    <section class="section section--stone" id="problems">
      <div class="container">
        <div class="section__heading">
          <div>
            <p class="eyebrow">Khởi đầu an tâm</p>
            <h2>${esc(problems.title)}</h2>
          </div>
          <p>${esc(problems.subtitle)}</p>
        </div>
        <div class="grid grid--3">${items}</div>
      </div>
    </section>
  `;
}

function renderAbout(about) {
  const highlights = (about.highlights || [])
    .map((item) => `<li>${esc(item)}</li>`)
    .join("");

  return `
    <section class="section" id="about">
      <div class="container about-layout">
        <div class="about-layout__media">
          <img src="${esc(about.image)}" alt="${esc(about.title)}">
          <div class="about-layout__badge">Một đầu mối chịu trách nhiệm xuyên suốt công trình</div>
        </div>
        <div class="about-layout__content">
          <p class="eyebrow">${esc(about.eyebrow)}</p>
          <h2>${esc(about.title)}</h2>
          <p>${esc(about.text)}</p>
          <ul class="check-list">${highlights}</ul>
          <div class="section__actions">
            <a class="button button--blue" href="#contact">Đặt lịch khảo sát</a>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderServices(services) {
  const cards = (services || [])
    .map(
      (service) => `
        <article class="service-card">
          <img src="${esc(service.image)}" alt="${esc(service.title)}">
          <div class="service-card__body">
            <h3>${esc(service.title)}</h3>
            <p>${esc(service.text)}</p>
            <div class="chips">
              ${(service.features || []).map((feature) => `<span class="chip">${esc(feature)}</span>`).join("")}
            </div>
          </div>
        </article>
      `
    )
    .join("");

  return `
    <section class="section section--stone" id="services">
      <div class="container">
        <div class="section__heading">
          <div>
            <p class="eyebrow">Dịch vụ</p>
            <h2>Trọn gói nhưng vẫn linh hoạt theo nhu cầu của từng gia đình</h2>
          </div>
        </div>
        <div class="grid grid--3">${cards}</div>
      </div>
    </section>
  `;
}

function renderProjects(projects) {
  const cards = (projects || [])
    .map(
      (project) => `
        <article class="project-card">
          <img src="${esc(project.image)}" alt="${esc(project.title)}">
          <div class="project-card__body">
            <span class="chip">${esc(project.status)}</span>
            <h3>${esc(project.title)}</h3>
            <p>${esc(project.description)}</p>
            <div class="project-meta">
              <span>${esc(project.location)}</span>
              <span>${esc(project.area)}</span>
              <span>${esc(project.floors)}</span>
              <span>${esc(project.type)}</span>
            </div>
          </div>
        </article>
      `
    )
    .join("");

  return `
    <section class="section" id="projects">
      <div class="container">
        <div class="section__heading">
          <div>
            <p class="eyebrow">Công trình</p>
            <h2>Dự án Cát Phú đã và đang đồng hành</h2>
          </div>
          <p>Cập nhật các công trình tiêu biểu, trạng thái thi công và thông tin cơ bản để khách hàng dễ tham khảo.</p>
        </div>
        <div class="grid grid--3">${cards}</div>
      </div>
    </section>
  `;
}

function renderReasons(reasons) {
  const items = (reasons.items || [])
    .map(
      (item, index) => `
        <article class="reason-card">
          <div class="reason-card__index">${String(index + 1).padStart(2, "0")}</div>
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.text)}</p>
        </article>
      `
    )
    .join("");

  return `
    <section class="section section--blue" id="reasons">
      <div class="container">
        <div class="section__heading">
          <div>
            <p class="eyebrow">Năng lực</p>
            <h2>${esc(reasons.title)}</h2>
          </div>
          <p>Quy trình rõ ràng giúp gia chủ theo dõi công trình bằng dữ liệu, không chỉ bằng niềm tin.</p>
        </div>
        <div class="grid grid--4">${items}</div>
      </div>
    </section>
  `;
}

function renderPricing(pricing) {
  const cards = (pricing || [])
    .map(
      (plan) => `
        <article class="price-card">
          <h3>${esc(plan.name)}</h3>
          <div class="price-card__price">${esc(plan.price)}</div>
          <p>${esc(plan.summary)}</p>
          <ul>${(plan.features || []).map((feature) => `<li>${esc(feature)}</li>`).join("")}</ul>
          <div class="section__actions">
            <a class="button button--blue" href="#contact">Nhận báo giá</a>
          </div>
        </article>
      `
    )
    .join("");

  return `
    <section class="section section--stone" id="pricing">
      <div class="container">
        <div class="section__heading">
          <div>
            <p class="eyebrow">Bảng giá tham khảo</p>
            <h2>Chọn gói phù hợp ngân sách và mức hoàn thiện mong muốn</h2>
          </div>
          <p>Đơn giá phụ thuộc hiện trạng, diện tích, chủng loại vật tư và yêu cầu thiết kế. Cát Phú sẽ báo giá chi tiết sau khảo sát.</p>
        </div>
        <div class="grid grid--3 pricing-grid">${cards}</div>
      </div>
    </section>
  `;
}

function renderProcess(process) {
  const items = (process || [])
    .map(
      (item) => `
        <article class="process-item">
          <strong>${esc(item.step)}</strong>
          <div>
            <h3>${esc(item.title)}</h3>
            <p>${esc(item.text)}</p>
          </div>
        </article>
      `
    )
    .join("");

  return `
    <section class="section" id="process">
      <div class="container">
        <div class="section__heading">
          <div>
            <p class="eyebrow">Quy trình</p>
            <h2>Từ ý tưởng đầu tiên đến ngày nhận nhà</h2>
          </div>
        </div>
        <div class="process">${items}</div>
      </div>
    </section>
  `;
}

function renderCommitments(commitments) {
  const cards = (commitments || [])
    .map(
      (item, index) => `
        <article class="commit-card">
          <div class="commit-card__index">${String(index + 1).padStart(2, "0")}</div>
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.text)}</p>
        </article>
      `
    )
    .join("");

  return `
    <section class="section section--stone" id="commitments">
      <div class="container">
        <div class="section__heading">
          <div>
            <p class="eyebrow">Cam kết</p>
            <h2>Những nguyên tắc Cát Phú giữ trong quá trình thi công</h2>
          </div>
        </div>
        <div class="grid grid--4">${cards}</div>
      </div>
    </section>
  `;
}

function renderPosts(posts) {
  const cards = (posts || [])
    .map(
      (post) => `
        <a class="post-card" href="${esc(post.url)}" target="_blank" rel="noreferrer">
          <img src="${esc(post.image)}" alt="${esc(post.title)}">
          <div class="post-card__body">
            <time datetime="${esc(post.date)}">${formatDate(post.date)}</time>
            <h3>${esc(post.title)}</h3>
            <p>${esc(post.excerpt)}</p>
            <span class="post-card__tag">${esc(post.tag)}</span>
          </div>
        </a>
      `
    )
    .join("");

  return `
    <section class="section" id="posts">
      <div class="container">
        <div class="section__heading">
          <div>
            <p class="eyebrow">Bài viết</p>
            <h2>Cập nhật từ Cát Phú và fanpage</h2>
          </div>
          <p>Khu vực này được quản lý trong admin để bổ sung bài đăng, hình ảnh công trình và đường dẫn fanpage.</p>
        </div>
        <div class="grid grid--3">${cards}</div>
      </div>
    </section>
  `;
}

function options(values) {
  return (values || []).map((value) => `<option value="${esc(value)}">${esc(value)}</option>`).join("");
}

function linkTargetAttrs(url) {
  const value = String(url || "");
  if (value.startsWith("#") || value.startsWith("/") || value.startsWith("tel:") || value.startsWith("mailto:")) {
    return "";
  }
  return ' target="_blank" rel="noreferrer"';
}

function renderContact(data) {
  const company = data.company || {};
  const contact = data.contact || {};
  const fanpage = data.meta?.fanpage || "#";

  return `
    <section class="section section--stone" id="contact">
      <div class="container contact-layout">
        <div class="contact-info">
          <p class="eyebrow">Liên hệ</p>
          <h2>${esc(contact.title)}</h2>
          <p>${esc(contact.subtitle)}</p>
          <div class="contact-info__list">
            <a href="${telHref(company.phone)}">${esc(company.phone)}</a>
            <a href="${mailHref(company.email)}">${esc(company.email)}</a>
            <span>${esc(company.address)}</span>
            <a href="${esc(fanpage)}" target="_blank" rel="noreferrer">Fanpage Cát Phú</a>
          </div>
        </div>
        <form class="contact-form" id="contact-form">
          <div class="form-grid">
            <label class="field">
              <span>Họ tên</span>
              <input name="name" required autocomplete="name">
            </label>
            <label class="field">
              <span>Số điện thoại</span>
              <input name="phone" required autocomplete="tel">
            </label>
            <label class="field">
              <span>Khu vực</span>
              <input name="area" placeholder="Ví dụ: Bình Dương, TP. Thủ Đức">
            </label>
            <label class="field">
              <span>Loại công trình</span>
              <select name="service">${options(contact.serviceOptions)}</select>
            </label>
            <label class="field">
              <span>Mức đầu tư</span>
              <select name="budget">${options(contact.budgetOptions)}</select>
            </label>
            <label class="field field--full">
              <span>Yêu cầu cụ thể</span>
              <textarea name="message" placeholder="Diện tích, số tầng, thời gian dự kiến khởi công..."></textarea>
            </label>
          </div>
          <button class="button button--blue" type="submit">Gửi yêu cầu</button>
          <div class="form-message" id="form-message" role="status"></div>
        </form>
      </div>
    </section>
  `;
}

function renderFooter(data) {
  const company = data.company || {};
  const footerData = data.footer || {};
  const fanpage = footerData.fanpageUrl || data.meta?.fanpage || "#";
  const logo = footerData.logo || company.logo || "assets/logo-cat-phu.svg";
  const aboutLines = Array.isArray(footerData.aboutLines) ? footerData.aboutLines : [];
  const footerServices = Array.isArray(footerData.services) ? footerData.services : [];
  const socialLinks = Array.isArray(footerData.socialLinks) ? footerData.socialLinks : [];

  footer.innerHTML = `
    <div class="footer__texture" aria-hidden="true"></div>
    <div class="container footer__inner">
      <div class="footer__about">
        <a class="footer__logo" href="#top" aria-label="${esc(company.name || "Cát Phú")}">
          <img src="${esc(logo)}" alt="${esc(company.name || "Cát Phú")}">
        </a>
        <h3>${esc(footerData.aboutTitle || "Về chúng tôi")}</h3>
        <strong>${esc(footerData.companyName || company.name || "Cát Phú")}</strong>
        <div class="footer__lines">
          ${aboutLines.map((line) => `<p>${esc(line)}</p>`).join("")}
        </div>
      </div>
      <div class="footer__services">
        <h4>${esc(footerData.servicesTitle || "Dịch vụ")}</h4>
        <nav aria-label="${esc(footerData.servicesTitle || "Dịch vụ")}">
          ${footerServices
            .map((item) => `<a href="${esc(item.url || "#services")}"${linkTargetAttrs(item.url)}>${esc(item.label)}</a>`)
            .join("")}
        </nav>
      </div>
      <div class="footer__fanpage">
        <h4>${esc(footerData.fanpageTitle || "Fanpage")}</h4>
        <a class="footer__fanpage-card" href="${esc(fanpage)}"${linkTargetAttrs(fanpage)}>
          <img src="${esc(footerData.fanpageImage || data.hero?.image || "")}" alt="${esc(footerData.fanpageName || company.name || "Fanpage")}">
          <span>
            <strong>${esc(footerData.fanpageName || company.name || "Cát Phú")}</strong>
            <small>${esc(footerData.fanpageStats || "Theo dõi fanpage Cát Phú")}</small>
          </span>
        </a>
      </div>
    </div>
    <div class="container footer__bottom">
      <div class="footer__socials">
        ${socialLinks
          .map(
            (item) => `
              <a href="${esc(item.url || "#")}"${linkTargetAttrs(item.url)} aria-label="${esc(item.title || item.label)}">
                <span>${esc(item.label)}</span>
              </a>
            `
          )
          .join("")}
      </div>
      <p>${esc(footerData.copyright || `© ${new Date().getFullYear()} ${company.name || "Cát Phú"}`)}</p>
    </div>
  `;
  floatingActions.innerHTML = "";
}

function wireContactForm() {
  const form = document.getElementById("contact-form");
  const message = document.getElementById("form-message");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "Đang gửi thông tin...";
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const contentType = response.headers.get("Content-Type") || "";
      if (!contentType.includes("application/json")) {
        message.textContent = "Website đang chạy bản tĩnh. Vui lòng gọi hotline, nhắn Zalo hoặc Fanpage để Cát Phú tư vấn nhanh nhất.";
        return;
      }

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không gửi được thông tin.");
      form.reset();
      message.textContent = result.message || "Đã gửi thông tin.";
    } catch (error) {
      message.textContent = error.message;
    }
  });
}

function wireNavigation() {
  const toggle = document.querySelector(".nav__toggle");
  const links = document.getElementById("nav-links");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  links.addEventListener("click", (event) => {
    if (event.target.tagName === "A") {
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

function renderSite(data) {
  updateShell(data);
  app.innerHTML = [
    renderHero(data.hero || {}),
    renderProblems(data.problems || {}),
    renderAbout(data.about || {}),
    renderServices(data.services || []),
    renderProjects(data.projects || []),
    renderReasons(data.reasons || {}),
    renderPricing(data.pricing || []),
    renderProcess(data.process || []),
    renderCommitments(data.commitments || []),
    renderPosts(data.posts || []),
    renderContact(data),
  ].join("");
  renderFooter(data);
  wireContactForm();
  if (location.hash) {
    window.requestAnimationFrame(() => {
      const target = document.querySelector(location.hash);
      if (target) window.scrollTo({ top: target.offsetTop, behavior: "auto" });
    });
  }
}

loadContent()
  .then(renderSite)
  .catch((error) => {
    app.innerHTML = `
      <section class="loading">
        <div class="container">
          <h1>Không tải được nội dung</h1>
          <p>${esc(error.message)}</p>
        </div>
      </section>
    `;
  });

wireNavigation();
