document.addEventListener(
  "submit",
  (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.id !== "contact-form") return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const message = document.getElementById("form-message");
    const payload = Object.fromEntries(new FormData(form).entries());
    const phone = String(payload.phone || "").trim();
    const normalizedPhone = phone.replace(/[\s.-]/g, "");
    const isValidVietnamPhone = /^(0|\+84)\d{9,10}$/.test(normalizedPhone);

    if (!isValidVietnamPhone) {
      if (message) {
        message.textContent = "Vui lòng nhập số điện thoại hợp lệ, ví dụ: 0356441838 hoặc +84356441838.";
      }
      form.querySelector('[name="phone"]')?.focus();
      return;
    }

    const email = document.getElementById("top-email")?.textContent?.trim() || "lienhe@catphu.vn";
    const companyName = document.getElementById("brand-name")?.textContent?.trim() || "Cát Phú";
    const subject = encodeURIComponent(`Yêu cầu tư vấn từ website ${companyName}`);
    const body = encodeURIComponent(
      [
        "Khách hàng gửi yêu cầu tư vấn từ website:",
        "",
        `Họ tên: ${payload.name || ""}`,
        `Số điện thoại: ${phone}`,
        `Khu vực: ${payload.area || ""}`,
        `Loại công trình: ${payload.service || ""}`,
        `Mức đầu tư: ${payload.budget || ""}`,
        "",
        `Yêu cầu cụ thể: ${payload.message || ""}`,
      ].join("\n")
    );

    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    if (message) {
      message.textContent =
        "Thông tin đã được chuẩn bị để gửi qua email. Vui lòng bấm Gửi trong ứng dụng email vừa mở, hoặc liên hệ hotline/Fanpage nếu cần tư vấn ngay.";
    }
  },
  true
);
