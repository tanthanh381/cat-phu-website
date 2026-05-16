const loginView = document.getElementById("login-view");
const adminView = document.getElementById("admin-view");
const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");
const tabsEl = document.getElementById("tabs");
const editor = document.getElementById("editor");
const notice = document.getElementById("notice");
const panelTitle = document.getElementById("panel-title");
const saveBtn = document.getElementById("save-btn");
const refreshBtn = document.getElementById("refresh-btn");
const logoutBtn = document.getElementById("logout-btn");

localStorage.removeItem("catPhuAdminToken");
let site = null;
let activeTab = "brand";

const sections = [
  {
    id: "brand",
    label: "Thương hiệu",
    title: "Thương hiệu & SEO",
    panels: [
      {
        title: "Thông tin website",
        fields: [
          ["meta.siteTitle", "Tiêu đề trình duyệt"],
          ["meta.description", "Mô tả SEO", "textarea"],
          ["meta.fanpage", "Link fanpage", "url"],
          ["company.name", "Tên công ty"],
          ["company.tagline", "Khẩu hiệu"],
          ["company.phone", "Số điện thoại"],
          ["company.email", "Email"],
          ["company.address", "Địa chỉ / khu vực", "textarea"],
          ["company.logo", "Đường dẫn logo", "url"],
        ],
      },
    ],
  },
  {
    id: "hero",
    label: "Hero",
    title: "Khối mở đầu",
    panels: [
      {
        title: "Nội dung hero",
        fields: [
          ["hero.eyebrow", "Dòng nhấn"],
          ["hero.title", "Tiêu đề lớn", "textarea"],
          ["hero.description", "Mô tả", "textarea"],
          ["hero.primaryCta", "Nút chính"],
          ["hero.secondaryCta", "Nút phụ"],
          ["hero.image", "Ảnh nền", "url"],
        ],
      },
      {
        title: "Chỉ số nổi bật",
        repeater: {
          path: "hero.stats",
          itemLabel: "Chỉ số",
          emptyItem: { value: "", label: "" },
          fields: [
            ["value", "Giá trị"],
            ["label", "Nhãn"],
          ],
        },
      },
    ],
  },
  {
    id: "story",
    label: "Nội dung chính",
    title: "Nỗi đau & giới thiệu",
    panels: [
      {
        title: "Nỗi đau khách hàng",
        fields: [
          ["problems.title", "Tiêu đề", "textarea"],
          ["problems.subtitle", "Mô tả", "textarea"],
        ],
        repeater: {
          path: "problems.items",
          itemLabel: "Vấn đề",
          emptyItem: { title: "", text: "" },
          fields: [
            ["title", "Tiêu đề"],
            ["text", "Mô tả", "textarea"],
          ],
        },
      },
      {
        title: "Giới thiệu giải pháp",
        fields: [
          ["about.eyebrow", "Dòng nhấn"],
          ["about.title", "Tiêu đề", "textarea"],
          ["about.text", "Nội dung", "textarea"],
          ["about.image", "Ảnh minh họa", "url"],
          ["about.highlights", "Các ý nổi bật, mỗi dòng một ý", "list"],
        ],
      },
    ],
  },
  {
    id: "services",
    label: "Dịch vụ",
    title: "Quản lý dịch vụ",
    panels: [
      {
        title: "Danh sách dịch vụ",
        repeater: {
          path: "services",
          itemLabel: "Dịch vụ",
          emptyItem: { title: "", text: "", image: "", features: [] },
          fields: [
            ["title", "Tên dịch vụ"],
            ["text", "Mô tả", "textarea"],
            ["image", "Ảnh", "url"],
            ["features", "Nhãn, mỗi dòng một nhãn", "list"],
          ],
        },
      },
    ],
  },
  {
    id: "projects",
    label: "Dự án",
    title: "Quản lý dự án",
    panels: [
      {
        title: "Danh sách dự án",
        repeater: {
          path: "projects",
          itemLabel: "Dự án",
          emptyItem: {
            title: "",
            location: "",
            area: "",
            floors: "",
            type: "",
            status: "",
            image: "",
            description: "",
          },
          fields: [
            ["title", "Tên dự án"],
            ["location", "Địa điểm"],
            ["area", "Diện tích"],
            ["floors", "Số tầng"],
            ["type", "Loại công trình"],
            ["status", "Trạng thái"],
            ["image", "Ảnh", "url"],
            ["description", "Mô tả", "textarea"],
          ],
        },
      },
    ],
  },
  {
    id: "sales",
    label: "Lý do & giá",
    title: "Lý do chọn và bảng giá",
    panels: [
      {
        title: "Lý do chọn Cát Phú",
        fields: [["reasons.title", "Tiêu đề", "textarea"]],
        repeater: {
          path: "reasons.items",
          itemLabel: "Lý do",
          emptyItem: { title: "", text: "" },
          fields: [
            ["title", "Tiêu đề"],
            ["text", "Mô tả", "textarea"],
          ],
        },
      },
      {
        title: "Bảng giá",
        repeater: {
          path: "pricing",
          itemLabel: "Gói giá",
          emptyItem: { name: "", price: "", summary: "", features: [] },
          fields: [
            ["name", "Tên gói"],
            ["price", "Giá"],
            ["summary", "Mô tả", "textarea"],
            ["features", "Hạng mục, mỗi dòng một hạng mục", "list"],
          ],
        },
      },
    ],
  },
  {
    id: "process",
    label: "Quy trình",
    title: "Quy trình & cam kết",
    panels: [
      {
        title: "Quy trình",
        repeater: {
          path: "process",
          itemLabel: "Bước",
          emptyItem: { step: "", title: "", text: "" },
          fields: [
            ["step", "Số bước"],
            ["title", "Tiêu đề"],
            ["text", "Mô tả", "textarea"],
          ],
        },
      },
      {
        title: "Cam kết",
        repeater: {
          path: "commitments",
          itemLabel: "Cam kết",
          emptyItem: { title: "", text: "" },
          fields: [
            ["title", "Tiêu đề"],
            ["text", "Mô tả", "textarea"],
          ],
        },
      },
    ],
  },
  {
    id: "posts",
    label: "Bài viết",
    title: "Bài viết & liên hệ",
    panels: [
      {
        title: "Bài viết / cập nhật từ fanpage",
        repeater: {
          path: "posts",
          itemLabel: "Bài viết",
          emptyItem: { title: "", date: "", tag: "", excerpt: "", image: "", url: "" },
          fields: [
            ["title", "Tiêu đề"],
            ["date", "Ngày đăng", "date"],
            ["tag", "Nhãn"],
            ["excerpt", "Tóm tắt", "textarea"],
            ["image", "Ảnh", "url"],
            ["url", "Link bài viết / fanpage", "url"],
          ],
        },
      },
      {
        title: "Form liên hệ",
        fields: [
          ["contact.title", "Tiêu đề form"],
          ["contact.subtitle", "Mô tả form", "textarea"],
          ["contact.serviceOptions", "Loại công trình, mỗi dòng một lựa chọn", "list"],
          ["contact.budgetOptions", "Mức đầu tư, mỗi dòng một lựa chọn", "list"],
        ],
      },
    ],
  },
  {
    id: "footer",
    label: "Footer",
    title: "Quản lý footer",
    panels: [
      {
        title: "Thông tin footer",
        fields: [
          ["footer.logo", "Logo footer", "url"],
          ["footer.aboutTitle", "Tiêu đề cột giới thiệu"],
          ["footer.companyName", "Tên pháp lý / tên công ty", "textarea"],
          ["footer.aboutLines", "Các dòng thông tin, mỗi dòng một mục", "list"],
          ["footer.servicesTitle", "Tiêu đề cột dịch vụ"],
          ["footer.fanpageTitle", "Tiêu đề cột fanpage"],
          ["footer.fanpageName", "Tên fanpage"],
          ["footer.fanpageStats", "Mô tả / số liệu fanpage", "textarea"],
          ["footer.fanpageImage", "Ảnh fanpage", "url"],
          ["footer.fanpageUrl", "Link fanpage", "url"],
          ["footer.copyright", "Copyright", "textarea"],
        ],
      },
      {
        title: "Dịch vụ trong footer",
        repeater: {
          path: "footer.services",
          itemLabel: "Dịch vụ",
          emptyItem: { label: "", url: "" },
          fields: [
            ["label", "Tên dịch vụ"],
            ["url", "Liên kết"],
          ],
        },
      },
      {
        title: "Nút liên hệ trong footer",
        repeater: {
          path: "footer.socialLinks",
          itemLabel: "Nút",
          emptyItem: { label: "", title: "", url: "" },
          fields: [
            ["label", "Nhãn ngắn"],
            ["title", "Tên nút"],
            ["url", "Liên kết"],
          ],
        },
      },
    ],
  },
  {
    id: "leads",
    label: "Khách tư vấn",
    title: "Thông tin khách gửi",
    custom: "leads",
  },
  {
    id: "json",
    label: "JSON",
    title: "Chỉnh sửa JSON",
    custom: "json",
  },
];

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getPath(object, path) {
  return path.split(".").reduce((current, key) => (current == null ? undefined : current[key]), object);
}

function setPath(object, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const target = keys.reduce((current, key) => {
    if (typeof current[key] !== "object" || current[key] === null) current[key] = {};
    return current[key];
  }, object);
  target[last] = value;
}

function parseValue(value, type) {
  if (type === "list") {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return value;
}

function formatValue(value, type) {
  if (type === "list") return Array.isArray(value) ? value.join("\n") : "";
  return value ?? "";
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function fieldTemplate(path, label, type = "text", itemContext = null) {
  const value = itemContext ? itemContext.value?.[path] : getPath(site, path);
  const className = type === "textarea" || type === "list" ? "field--full" : "";
  const attrs = itemContext
    ? `data-array="${esc(itemContext.arrayPath)}" data-index="${itemContext.index}" data-key="${esc(path)}"`
    : `data-path="${esc(path)}"`;
  const common = `${attrs} data-type="${esc(type)}"`;

  if (type === "textarea" || type === "list") {
    return `
      <label class="${className}">
        <span>${esc(label)}</span>
        <textarea ${common}>${esc(formatValue(value, type))}</textarea>
      </label>
    `;
  }

  return `
    <label class="${className}">
      <span>${esc(label)}</span>
      <input type="${esc(type)}" value="${esc(formatValue(value, type))}" ${common}>
    </label>
  `;
}

function renderFields(fields) {
  if (!fields?.length) return "";
  return `<div class="fields">${fields.map(([path, label, type]) => fieldTemplate(path, label, type)).join("")}</div>`;
}

function renderRepeater(config) {
  const items = getPath(site, config.path) || [];
  const body = items
    .map((item, index) => {
      const fields = config.fields
        .map(([key, label, type]) => fieldTemplate(key, label, type, { arrayPath: config.path, index, value: item }))
        .join("");
      return `
        <div class="repeater__item">
          <div class="repeater__header">
            <strong>${esc(config.itemLabel)} ${index + 1}</strong>
            <button type="button" class="button button--danger" data-remove="${esc(config.path)}" data-index="${index}">Xóa</button>
          </div>
          <div class="fields">${fields}</div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="repeater">
      ${body}
      <button type="button" class="button button--ghost" data-add="${esc(config.path)}">Thêm ${esc(config.itemLabel.toLowerCase())}</button>
    </div>
  `;
}

function renderPanel(panel) {
  return `
    <section class="panel">
      <h2>${esc(panel.title)}</h2>
      ${renderFields(panel.fields)}
      ${panel.repeater ? renderRepeater(panel.repeater) : ""}
    </section>
  `;
}

function renderTabs() {
  tabsEl.innerHTML = sections
    .map(
      (section) => `
        <button type="button" class="${section.id === activeTab ? "is-active" : ""}" data-tab="${esc(section.id)}">
          ${esc(section.label)}
        </button>
      `
    )
    .join("");
}

function renderEditor() {
  const section = sections.find((item) => item.id === activeTab) || sections[0];
  panelTitle.textContent = section.title;
  renderTabs();

  if (section.custom === "leads") {
    renderLeads();
    return;
  }

  if (section.custom === "json") {
    editor.innerHTML = `
      <section class="panel json-tools">
        <h2>Toàn bộ dữ liệu website</h2>
        <textarea id="json-editor">${esc(JSON.stringify(site, null, 2))}</textarea>
        <button type="button" class="button button--ghost" id="apply-json">Áp dụng JSON vào bản nháp</button>
      </section>
    `;
    return;
  }

  editor.innerHTML = (section.panels || []).map(renderPanel).join("");
}

async function renderLeads() {
  editor.innerHTML = `
    <section class="panel">
      <h2>Danh sách khách gửi form</h2>
      <p>Đang tải dữ liệu...</p>
    </section>
  `;
  try {
    const response = await fetch("/api/leads", {
      credentials: "same-origin",
      cache: "no-store",
    });
    const leads = await response.json();
    if (response.status === 401) {
      handleAuthExpired();
      return;
    }
    if (!response.ok) throw new Error(leads.error || "Không tải được danh sách khách.");

    const items = leads.length
      ? leads
          .map(
            (lead) => `
              <article class="lead">
                <strong>${esc(lead.name || "Chưa có tên")} - ${esc(lead.phone || "Chưa có số")}</strong>
                <p>${esc(lead.area)} | ${esc(lead.service)} | ${esc(lead.budget)}</p>
                <p>${esc(lead.message)}</p>
                <p>Thời gian: ${esc(new Date(lead.created_at).toLocaleString("vi-VN"))}</p>
              </article>
            `
          )
          .join("")
      : "<p>Chưa có khách gửi tư vấn.</p>";

    editor.innerHTML = `
      <section class="panel">
        <h2>Danh sách khách gửi form</h2>
        <div class="lead-list">${items}</div>
      </section>
    `;
  } catch (error) {
    showNotice(error.message, true);
  }
}

async function loadSite() {
  const response = await fetch("/api/content", { cache: "no-store" });
  if (!response.ok) throw new Error("Không tải được nội dung website.");
  site = await response.json();
}

async function validateSession() {
  try {
    const response = await fetch("/api/session", {
      credentials: "same-origin",
      cache: "no-store",
    });
    const result = await response.json();
    return Boolean(result.authenticated);
  } catch (error) {
    return false;
  }
}

function showLogin(message = "") {
  loginView.hidden = false;
  adminView.hidden = true;
  loginMessage.textContent = message;
}

function showAdmin() {
  loginView.hidden = true;
  adminView.hidden = false;
  loginMessage.textContent = "";
}

function handleAuthExpired() {
  showLogin("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
}

async function saveSite() {
  if (activeTab === "json") {
    const text = document.getElementById("json-editor")?.value || "{}";
    try {
      site = JSON.parse(text);
    } catch (error) {
      showNotice("JSON chưa hợp lệ, vui lòng kiểm tra lại.", true);
      return;
    }
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "Đang lưu...";
  try {
    const response = await fetch("/api/content", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify(site),
    });
    const result = await response.json();
    if (response.status === 401) {
      handleAuthExpired();
      return;
    }
    if (!response.ok) throw new Error(result.error || "Không lưu được nội dung.");
    showNotice(result.message || "Đã lưu nội dung.");
  } catch (error) {
    showNotice(error.message, true);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Lưu thay đổi";
  }
}

function showNotice(message, isError = false) {
  notice.textContent = message;
  notice.classList.toggle("is-error", isError);
  window.clearTimeout(showNotice.timer);
  showNotice.timer = window.setTimeout(() => {
    notice.textContent = "";
    notice.classList.remove("is-error");
  }, 5000);
}

async function bootAdmin() {
  try {
    const authenticated = await validateSession();
    if (!authenticated) {
      showLogin("");
      return;
    }
    await loadSite();
    showAdmin();
    renderEditor();
  } catch (error) {
    showLogin(error.message);
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "Đang đăng nhập...";
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ password: document.getElementById("password").value.trim() }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Không đăng nhập được.");
    await loadSite();
    showAdmin();
    renderEditor();
  } catch (error) {
    loginMessage.textContent = error.message;
  }
});

tabsEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-tab]");
  if (!button) return;
  activeTab = button.dataset.tab;
  renderEditor();
});

editor.addEventListener("input", (event) => {
  const input = event.target;
  const type = input.dataset.type || "text";
  if (input.dataset.path) {
    setPath(site, input.dataset.path, parseValue(input.value, type));
  }
  if (input.dataset.array) {
    const items = getPath(site, input.dataset.array) || [];
    const item = items[Number(input.dataset.index)];
    if (item) item[input.dataset.key] = parseValue(input.value, type);
  }
});

editor.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  const removeButton = event.target.closest("[data-remove]");
  const applyJson = event.target.closest("#apply-json");

  if (addButton) {
    const section = sections.find((item) => item.id === activeTab);
    const repeaters = (section.panels || []).map((panel) => panel.repeater).filter(Boolean);
    const config = repeaters.find((item) => item.path === addButton.dataset.add);
    const items = getPath(site, config.path) || [];
    items.push(clone(config.emptyItem));
    setPath(site, config.path, items);
    renderEditor();
  }

  if (removeButton) {
    const items = getPath(site, removeButton.dataset.remove) || [];
    items.splice(Number(removeButton.dataset.index), 1);
    setPath(site, removeButton.dataset.remove, items);
    renderEditor();
  }

  if (applyJson) {
    try {
      site = JSON.parse(document.getElementById("json-editor").value);
      showNotice("Đã áp dụng JSON vào bản nháp. Bấm Lưu thay đổi để ghi vào file.");
    } catch (error) {
      showNotice("JSON chưa hợp lệ, vui lòng kiểm tra lại.", true);
    }
  }
});

saveBtn.addEventListener("click", saveSite);

refreshBtn.addEventListener("click", async () => {
  await loadSite();
  renderEditor();
  showNotice("Đã tải lại nội dung mới nhất.");
});

logoutBtn.addEventListener("click", async () => {
  try {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "same-origin",
    });
  } finally {
    showLogin("Đã đăng xuất.");
  }
});

bootAdmin();
