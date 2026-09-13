const REVIEW_EMAIL = "juanbrito0828@gmail.com";

// Set this after creating a free form-backend account (e.g. https://formspree.io) so
// photos actually reach you. Until it's set, the form falls back to a text-only email
// and asks the vendor to attach photos by hand (mailto links can't carry attachments).
const FORM_ENDPOINT = "";

const MAX_PHOTOS = 6;

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

async function submitWithPhotos(f) {
  if (!FORM_ENDPOINT) return false;

  const fd = new FormData();
  fd.append("Business name", f.name);
  fd.append("Neighborhood", f.neighborhood);
  fd.append("Cuisine", f.category);
  fd.append("Dishes", f.dishes);
  fd.append("Starting price per guest", `$${f.price}`);
  fd.append("Description", f.desc);
  fd.append("Available days", f.days.join(", "));
  fd.append("Already booked / closed dates", f.blackout || "None given");
  fd.append("Contact name", f.contactName);
  fd.append("Contact email", f.email);
  fd.append("Contact phone", f.phone);
  selectedFiles.forEach(file => fd.append("photos", file));

  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: "POST",
      body: fd,
      headers: { Accept: "application/json" },
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

function sendTextOnlyFallback(f) {
  const lines = [
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
    ``,
    selectedFiles.length
      ? `(Automatic photo upload isn't turned on yet — please attach your ${selectedFiles.length} selected photo(s) to this email before sending!)`
      : `(No photos were attached.)`,
  ];
  const subject = encodeURIComponent(`New vendor application: ${f.name}`);
  const body = encodeURIComponent(lines.join("\n"));
  window.location.href = `mailto:${REVIEW_EMAIL}?subject=${subject}&body=${body}`;
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
