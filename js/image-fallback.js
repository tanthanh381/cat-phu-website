const CAT_PHU_IMAGE_FALLBACK = "assets/logo-cat-phu.svg";

function applyImageFallback(image) {
  if (!(image instanceof HTMLImageElement)) return;
  if (image.dataset.fallbackApplied === "true") return;

  image.dataset.fallbackApplied = "true";
  image.src = CAT_PHU_IMAGE_FALLBACK;
  image.classList.add("image-fallback");
  image.alt = image.alt || "Cát Phú";
}

document.addEventListener(
  "error",
  (event) => {
    applyImageFallback(event.target);
  },
  true
);

window.addEventListener("load", () => {
  document.querySelectorAll("img").forEach((image) => {
    if (image.complete && image.naturalWidth === 0) {
      applyImageFallback(image);
    }
  });
});
