const REVIEW_EMAIL = "juanbrito0828@gmail.com";

const MAX_PHOTOS = 6;
const MAX_DIMENSION = 1600; // resize photos to this before upload — smaller, faster, fits well under Vercel's request size limit
const JPEG_QUALITY = 0.75;

const categorySelect = document.getElementById("apCategory");
const otherWrap = document.getElementById("apOtherCategoryWrap");
const otherInput = document.getElementById("apOtherCategory");

categorySelect.addEventListener("change", () => {
  const isOther = categorySelect.value === "Something else (describe below)";
  otherWrap.hidden = !isOther;
  otherInput.required = isOther;
});

// ===== Photo picker =====
const photoInput = document.getElementById("apPhotoInput");
const photoGrid = document.getElementById("apPhotoGrid");
const photoLabel = document.getElementById("apPhotoLabel");
let selectedFiles = [];

function renderPhotos() {
  photoGrid.innerHTML = "";
  selectedFiles.forEach((file, i) => {
    const url = URL.createObjectURL(file);
    const div = document.createElement("div");
    div.className = "photo-thumb";
    div.innerHTML = `<img src="${url}" alt="">
      <button type="button" aria-label="Remove this photo" data-i="${i}">&times;</button>`;
    photoGrid.appendChild(div);
  });
  photoLabel.textContent = selectedFiles.length
    ? `${selectedFiles.length} photo${selectedFiles.length === 1 ? "" : "s"} selected — add more or continue`
    : "Choose photos…";
  syncInputFiles();
}

function syncInputFiles() {
  const dt = new DataTransfer();
  selectedFiles.forEach(f => dt.items.add(f));
  photoInput.files = dt.files;
}

photoInput.addEventListener("change", () => {
  const incoming = Array.from(photoInput.files || []);
  selectedFiles = [...selectedFiles, ...incoming].slice(0, MAX_PHOTOS);
  renderPhotos();
});

photoGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-i]");
  if (!btn) return;
  selectedFiles.splice(Number(btn.dataset.i), 1);
  renderPhotos();
});

// ===== Submit =====
function showError(msg) {
  const el = document.getElementById("apError");
  el.textContent = msg;
  el.hidden = false;
}
function clearError() {
  document.getElementById("apError").hidden = true;
}

function collectFields() {
  const category = categorySelect.value === "Something else (describe below)"
    ? otherInput.value
    : categorySelect.value;
  const days = [...document.querySelectorAll("#apDays input:checked")].map(i => i.value);
  return {
    name: document.getElementById("apName").value,
    neighborhood: document.getElementById("apNeighborhood").value,
    category,
    dishes: document.getElementById("apDishes").value,
    price: document.getElementById("apPrice").value,
    desc: document.getElementById("apDesc").value,
    days,
    blackout: document.getElementById("apBlackout").value,
    contactName: document.getElementById("apContactName").value,
    email: document.getElementById("apEmail").value,
    phone: document.getElementById("apPhone").value,
  };
}

// Resize + re-encode a photo in the browser before upload: smaller files upload
// faster and comfortably fit under Vercel's 4.5MB per-request limit.
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const scale = MAX_DIMENSION / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve({
          filename: file.name.replace(/\.[^.]+$/, "") + ".jpg",
          dataUrl: canvas.toDataURL("image/jpeg", JPEG_QUALITY),
        });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadPhoto(file) {
  const { filename, dataUrl } = await compressImage(file);
  const res = await fetch("/api/upload-photo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, dataUrl }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) throw new Error(data.error || "Upload failed");
  return data.url;
}

function buildFieldLines(f) {
  return [
    `Business name: ${f.name}`,
    `Neighborhood: ${f.neighborhood}`,
    `Cuisine: ${f.category}`,
    `Dishes: ${f.dishes}`,
    `Starting price per guest: $${f.price}`,
    `Description: ${f.desc}`,
    `Available days: ${f.days.join(", ")}`,
    `Already booked / closed dates: ${f.blackout || "None given"}`,
    ``,
    `Contact name: ${f.contactName}`,
    `Contact email: ${f.email}`,
    `Contact phone: ${f.phone}`,
  ];
}

function openMailto(subjectText, lines) {
  const subject = encodeURIComponent(subjectText);
  const body = encodeURIComponent(lines.join("\n"));
  window.location.href = `mailto:${REVIEW_EMAIL}?subject=${subject}&body=${body}`;
}

// Try to upload every selected photo to Blob storage and email real links to them.
// Returns true only if every photo made it up successfully.
async function submitWithPhotos(f) {
  try {
    const urls = [];
    for (const file of selectedFiles) {
      urls.push(await uploadPhoto(file));
    }
    const lines = buildFieldLines(f).concat(
      [``, `Photos:`],
      urls.map((url, i) => `${i + 1}. ${url}`)
    );
    openMailto(`New vendor application: ${f.name}`, lines);
    return true;
  } catch (err) {
    return false;
  }
}

function sendTextOnlyFallback(f) {
  const lines = buildFieldLines(f).concat([
    ``,
    selectedFiles.length
      ? `(Automatic photo upload didn't go through — please attach your ${selectedFiles.length} selected photo(s) to this email before sending!)`
      : `(No photos were attached.)`,
  ]);
  openMailto(`New vendor application: ${f.name}`, lines);
}

document.getElementById("applyForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  if (!form.reportValidity()) return;

  const f = collectFields();

  if (f.days.length === 0) {
    showError("Pick at least one day you're available to cater.");
    return;
  }
  if (selectedFiles.length === 0) {
    showError("Add at least one photo of your food.");
    return;
  }
  clearError();

  const submitBtn = document.getElementById("apSubmit");
  submitBtn.disabled = true;
  submitBtn.textContent = "Sending…";

  const sentWithPhotos = await submitWithPhotos(f);

  if (sentWithPhotos) {
    form.hidden = true;
    document.getElementById("apSuccess").hidden = false;
  } else {
    sendTextOnlyFallback(f);
    submitBtn.disabled = false;
    submitBtn.textContent = "Send application";
  }
});
