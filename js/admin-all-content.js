const ALL_CONTENT_FILES = [
  { key: "site", label: "Trang chủ", path: "data/site.json" },
  { key: "enhancements", label: "Nội dung mở rộng", path: "data/enhancements.json" },
  { key: "careers", label: "Tuyển dụng", path: "data/careers.json" },
];

const ALL_CONTENT_REPOSITORY = "tanthanh381/cat-phu-website";
const ALL_CONTENT_BRANCH = "gh-pages";
const ALL_CONTENT_TOKEN_KEY = "catPhuGithubPagesToken";

function adminAllEsc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function adminAllDecodeBase64(value) {
  const binary = atob(String(value || "").replace(/\n/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new TextDecoder().decode(bytes);
}

function adminAllEncodeBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function adminAllApiUrl(file) {
  return `https://api.github.com/repos/${ALL_CONTENT_REPOSITORY}/contents/${file.path}`;
}

async function adminAllGithubRequest(url, options = {}) {
  const token = sessionStorage.getItem(ALL_CONTENT_TOKEN_KEY) || "";
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.message || `GitHub API lỗi ${response.status}`);
  return result;
}

function adminAllShowMessage(text, isError = false) {
  const message = document.getElementById("all-content-message");
  if (!message) return;
  message.textContent = text;
  message.classList.toggle("is-error", isError);
}

function adminAllRenderSkeleton() {
  const editor = document.getElementById("editor");
  const panelTitle = document.getElementById("panel-title");
  if (!editor || !panelTitle) return;
  panelTitle.textContent = "Quản lý toàn bộ nội dung";
  editor.innerHTML = `
    <section class="panel all-content-admin">
      <h2>Toàn bộ dữ liệu trang chủ</h2>
      <p class="all-content-admin__hint">Khu vực này quản lý đủ 3 file dữ liệu đang render website: trang chủ, nội dung mở rộng và tuyển dụng. Chỉnh xong bấm Lưu toàn bộ dữ liệu.</p>
      <div class="all-content-admin__tabs">
        ${ALL_CONTENT_FILES.map((file, index) => `<button type="button" class="${index === 0 ? "is-active" : ""}" data-all-file="${file.key}">${adminAllEsc(file.label)}<small>${adminAllEsc(file.path)}</small></button>`).join("")}
      </div>
      <div class="all-content-admin__toolbar">
        <button type="button" class="button button--ghost" id="all-content-format">Format JSON</button>
        <button type="button" class="button" id="all-content-save">Lưu toàn bộ dữ liệu</button>
      </div>
      <small id="all-content-message" role="status"></small>
      ${ALL_CONTENT_FILES.map((file, index) => `
        <div class="all-content-admin__pane ${index === 0 ? "is-active" : ""}" data-all-pane="${file.key}">
          <label class="field--full">
            <span>${adminAllEsc(file.label)} - ${adminAllEsc(file.path)}</span>
            <textarea class="all-content-admin__textarea" data-all-editor="${file.key}" spellcheck="false">Đang tải...</textarea>
          </label>
        </div>
      `).join("")}
    </section>
  `;
}

async function adminAllLoadFiles() {
  const state = {};
  for (const file of ALL_CONTENT_FILES) {
    const result = await adminAllGithubRequest(`${adminAllApiUrl(file)}?ref=${encodeURIComponent(ALL_CONTENT_BRANCH)}`);
    const text = adminAllDecodeBase64(result.content);
    state[file.key] = { sha: result.sha, text };
    const textarea = document.querySelector(`[data-all-editor="${file.key}"]`);
    if (textarea) textarea.value = JSON.stringify(JSON.parse(text), null, 2);
  }
  window.catPhuAllContentState = state;
  adminAllShowMessage("Đã tải toàn bộ dữ liệu từ GitHub.");
}

function adminAllFormatActive() {
  const activePane = document.querySelector(".all-content-admin__pane.is-active textarea");
  if (!activePane) return;
  try {
    activePane.value = JSON.stringify(JSON.parse(activePane.value), null, 2);
    adminAllShowMessage("JSON đã được format.");
  } catch (error) {
    adminAllShowMessage("JSON chưa hợp lệ, vui lòng kiểm tra dấu phẩy, dấu ngoặc hoặc dấu nháy.", true);
  }
}

async function adminAllSaveFiles() {
  const state = window.catPhuAllContentState || {};
  const payloads = [];
  for (const file of ALL_CONTENT_FILES) {
    const textarea = document.querySelector(`[data-all-editor="${file.key}"]`);
    if (!textarea) continue;
    let parsed;
    try {
      parsed = JSON.parse(textarea.value);
    } catch (error) {
      adminAllShowMessage(`${file.label}: JSON chưa hợp lệ.`, true);
      return;
    }
    payloads.push({ file, text: `${JSON.stringify(parsed, null, 2)}\n` });
  }

  adminAllShowMessage("Đang lưu toàn bộ dữ liệu...");
  const saveButton = document.getElementById("all-content-save");
  if (saveButton) saveButton.disabled = true;
  try {
    for (const item of payloads) {
      const result = await adminAllGithubRequest(adminAllApiUrl(item.file), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Update ${item.file.path} from admin all content manager`,
          content: adminAllEncodeBase64(item.text),
          sha: state[item.file.key]?.sha,
          branch: ALL_CONTENT_BRANCH,
        }),
      });
      state[item.file.key] = { sha: result.content?.sha || state[item.file.key]?.sha, text: item.text };
    }
    window.catPhuAllContentState = state;
    adminAllShowMessage("Đã lưu toàn bộ dữ liệu. GitHub Pages có thể cần 1-2 phút để cập nhật.");
  } catch (error) {
    adminAllShowMessage(error.message, true);
  } finally {
    if (saveButton) saveButton.disabled = false;
  }
}

function adminAllBindEvents() {
  const editor = document.getElementById("editor");
  if (!editor) return;
  editor.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-all-file]");
    if (tab) {
      editor.querySelectorAll("[data-all-file]").forEach((button) => button.classList.toggle("is-active", button === tab));
      editor.querySelectorAll("[data-all-pane]").forEach((pane) => pane.classList.toggle("is-active", pane.dataset.allPane === tab.dataset.allFile));
    }
    if (event.target.closest("#all-content-format")) adminAllFormatActive();
    if (event.target.closest("#all-content-save")) adminAllSaveFiles();
  });
}

function adminAllInstallTab() {
  const tabs = document.getElementById("tabs");
  if (!tabs || document.getElementById("all-content-tab")) return;
  const button = document.createElement("button");
  button.type = "button";
  button.id = "all-content-tab";
  button.innerHTML = "Toàn bộ nội dung<small>3 file dữ liệu</small>";
  button.addEventListener("click", async () => {
    tabs.querySelectorAll("button").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    adminAllRenderSkeleton();
    adminAllBindEvents();
    try {
      await adminAllLoadFiles();
    } catch (error) {
      adminAllShowMessage(error.message, true);
    }
  });
  tabs.appendChild(button);
}

function adminAllWaitForTabs(attempt = 0) {
  const tabs = document.getElementById("tabs");
  if (tabs && tabs.children.length) {
    adminAllInstallTab();
    return;
  }
  if (attempt > 80) return;
  window.setTimeout(() => adminAllWaitForTabs(attempt + 1), 150);
}

adminAllWaitForTabs();
