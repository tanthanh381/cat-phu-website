const REPOSITORY = "tanthanh381/cat-phu-website";
const BRANCH = "gh-pages";
const CONTENT_PATH = "data/site.json";
const API_URL = `https://api.github.com/repos/${REPOSITORY}/contents/${CONTENT_PATH}`;
const TOKEN_KEY = "catPhuGithubPagesToken";

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

let site = null;
let activeTab = "brand";
let githubToken = sessionStorage.getItem(TOKEN_KEY) || "";
let currentSha = "";

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

function decodeBase64(value) {
  const clean = String(value || "").replace(/\n/g, "");
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new TextDecoder().decode(bytes);
}

function encodeBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

async function githubRequest(url, options = {}) {
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${githubToken}`,
    "X-GitHub-Api-Version": "2022-11-28",
    ...(options.headers || {}),
  };
  const response = await fetch(url, { ...options, headers });
  let result = null;
  try {
    result = await response.json();
  } catch (error) {
    result = null;
  }
  if (!response.ok) {
    const message = result?.message || `GitHub API lỗi ${response.status}`;
    throw new Error(message);
  }
  return result;
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

async function loadSite() {
  const result = await githubRequest(`${API_URL}?ref=${encodeURIComponent(BRANCH)}`);
  currentSha = result.sha;
  site = JSON.parse(decodeBase64(result.content));
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

function showNotice(message, isError = false) {
  notice.textContent = message;
  notice.classList.toggle("is-error", isError);
  window.clearTimeout(showNotice.timer);
  showNotice.timer = window.setTimeout(() => {
    notice.textContent = "";
    notice.classList.remove("is-error");
  }, 7000);
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
    const content = `${JSON.stringify(site, null, 2)}\n`;
    const result = await githubRequest(API_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Update website content from GitHub Pages admin",
        content: encodeBase64(content),
        sha: currentSha,
        branch: BRANCH,
      }),
    });
    currentSha = result.content?.sha || currentSha;
    showNotice("Đã lưu lên GitHub. Website có thể cần khoảng 1-2 phút để cập nhật cache.");
  } catch (error) {
    showNotice(error.message, true);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Lưu thay đổi";
  }
}

async function bootAdmin() {
  if (!githubToken) {
    showLogin("");
    return;
  }

  try {
    loginMessage.textContent = "Đang tải dữ liệu từ GitHub...";
    await loadSite();
    showAdmin();
    renderEditor();
  } catch (error) {
    sessionStorage.removeItem(TOKEN_KEY);
    githubToken = "";
    showLogin(`Không mở được admin: ${error.message}`);
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  githubToken = document.getElementById("github-token").value.trim();
  sessionStorage.setItem(TOKEN_KEY, githubToken);
  await bootAdmin();
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
    if (!config) return;
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
      showNotice("Đã áp dụng JSON vào bản nháp. Bấm Lưu thay đổi để ghi lên GitHub.");
    } catch (error) {
      showNotice("JSON chưa hợp lệ, vui lòng kiểm tra lại.", true);
    }
  }
});

saveBtn.addEventListener("click", saveSite);

refreshBtn.addEventListener("click", async () => {
  try {
    await loadSite();
    renderEditor();
    showNotice("Đã tải lại nội dung mới nhất từ GitHub.");
  } catch (error) {
    showNotice(error.message, true);
  }
});

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem(TOKEN_KEY);
  githubToken = "";
  site = null;
  currentSha = "";
  showLogin("Đã đăng xuất.");
});

bootAdmin();
