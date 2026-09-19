// ===== Booking result notice (after returning from Stripe Checkout) =====
(function showBookingNotice() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("booking");
  if (status !== "success" && status !== "cancelled") return;

  const vendorName = params.get("vendor") || "the vendor";
  const notice = document.getElementById("bookingNotice");
  const text = document.getElementById("bookingNoticeText");

  if (status === "success") {
    notice.classList.add("notice--success");
    text.textContent = `You're booked! Payment received — ${vendorName} will be in touch to confirm details.`;
  } else {
    notice.classList.add("notice--cancelled");
    text.textContent = `Checkout with ${vendorName} was cancelled — no charge was made.`;
  }

  notice.hidden = false;
  document.getElementById("bookingNoticeClose").addEventListener("click", () => {
    notice.hidden = true;
  });

  const url = new URL(window.location.href);
  url.searchParams.delete("booking");
  url.searchParams.delete("vendor");
  window.history.replaceState({}, "", url);
})();

// ===== Category definitions (color + stamp icon) =====
const CATEGORIES = [
  { value: "mexican",   label: "Mexican & Oaxacan",       color: "#E8792A", icon: "citrus" },
  { value: "salvadoran",label: "Salvadoran",              color: "#C13B2A", icon: "grain" },
  { value: "filipino",  label: "Filipino",                color: "#E8A93B", icon: "skewer" },
  { value: "ethiopian", label: "Ethiopian",                color: "#526E3F", icon: "herb" },
  { value: "persian",   label: "Persian",                  color: "#8B4A62", icon: "grain" },
  { value: "korean",    label: "Korean BBQ",               color: "#2F5D62", icon: "skewer" },
  { value: "thai",      label: "Thai",                     color: "#7C8C3E", icon: "chili" },
  { value: "deli",      label: "Jewish Deli",              color: "#6B4226", icon: "bowl" },
  { value: "vietnamese",label: "Vietnamese",               color: "#3C6E91", icon: "bowl" },
  { value: "jamaican",  label: "Jamaican",                 color: "#B4521E", icon: "chili" },
  { value: "soul",      label: "Vegan Soul Food",          color: "#3F6B3A", icon: "herb" },
  { value: "armenian",  label: "Armenian",                 color: "#7A3B57", icon: "grain" },
  { value: "levant",    label: "Lebanese & North African", color: "#C68A2E", icon: "citrus" },
];

const CAT_BY_VALUE = Object.fromEntries(CATEGORIES.map(c => [c.value, c]));

// ===== Dish subcategories, by cuisine =====
const SUBCATEGORIES = {
  mexican: ["Tacos", "Enchiladas", "Mole", "Barbacoa", "Tamales", "Ceviche"],
  salvadoran: ["Pupusas", "Tamales", "Yuca Frita", "Curtido Salad"],
  filipino: ["Lechon", "Lumpia", "Pancit", "Adobo", "Sisig"],
  ethiopian: ["Doro Wat", "Injera Platters", "Misir Wot", "Tibs"],
  persian: ["Kebab", "Saffron Rice", "Tahdig", "Ash Soup"],
  korean: ["Bulgogi", "Galbi", "Banchan Spread", "Japchae"],
  thai: ["Pad See Ew", "Green Curry", "Tom Yum", "Pad Thai"],
  deli: ["Brisket", "Bagel Spread", "Matzo Ball Soup", "Pastrami"],
  vietnamese: ["Pho", "Banh Mi", "Spring Rolls", "Bun Cha"],
  jamaican: ["Jerk Chicken", "Oxtail", "Rice and Peas", "Curry Goat"],
  soul: ["Fried \"Chicken\"", "Mac and Cheese", "Collard Greens", "Cornbread"],
  armenian: ["Kebab", "Lavash", "Dolma", "Pilaf"],
  levant: ["Tagine", "Couscous", "Mezze Spread", "Kibbeh"],
};

// ===== Icon paths (simple original line glyphs, 24x24, stroke=currentColor) =====
const ICONS = {
  citrus: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16M6.3 6.3l11.4 11.4M17.7 6.3L6.3 17.7"/>',
  chili: '<path d="M8 5c2 0 3 1.5 3 3 3-1 6 1 6 5 0 4-3.5 7-7 7s-6-2-6-5c0-2 1-3 2-3.5C5 10 5 6.5 8 5z"/><path d="M8 5c0-1 .8-2 2-2"/>',
  skewer: '<path d="M3 21L21 3"/><rect x="7" y="7" width="4" height="4" rx="1" transform="rotate(45 9 9)"/><rect x="12" y="12" width="4" height="4" rx="1" transform="rotate(45 14 14)"/><rect x="15" y="3" width="4" height="4" rx="1" transform="rotate(45 17 5)"/>',
  herb: '<path d="M12 21V6"/><path d="M12 8c0-3 2-5 5-5-0.5 3-2 5-5 5z"/><path d="M12 12c0-3-2-5-5-5 0.5 3 2 5 5 5z"/><path d="M12 16c0-3 2-5 5-5-0.5 3-2 5-5 5z"/>',
  grain: '<path d="M12 21V5"/><path d="M12 6c-1 0-3-1-3-3 2 0 3 1 3 3z"/><path d="M12 6c1 0 3-1 3-3-2 0-3 1-3 3z"/><path d="M12 10c-1 0-3-1-3-3 2 0 3 1 3 3z"/><path d="M12 10c1 0 3-1 3-3-2 0-3 1-3 3z"/><path d="M12 14c-1 0-3-1-3-3 2 0 3 1 3 3z"/><path d="M12 14c1 0 3-1 3-3-2 0-3 1-3 3z"/>',
  bowl: '<path d="M4 12c0 4 3.5 7 8 7s8-3 8-7"/><path d="M3 12h18"/><path d="M8 8c1-2 2-3 4-3M12 6c1 0 2 1 2.5 2"/>',
};

function iconSvg(key) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${ICONS[key] || ICONS.citrus}</svg>`;
}

// ===== Vendor data (fetched at runtime so the booking backend reads the same source) =====
let VENDORS = [];
let VENDOR_BY_ID = {};

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function priceTier(price) {
  if (price < 25) return "low";
  if (price <= 40) return "mid";
  return "high";
}

function compressDays(days) {
  const sorted = DAY_ORDER.filter(d => days.includes(d));
  if (sorted.length === 7) return "Every day";
  const runs = [];
  let run = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const prevIdx = DAY_ORDER.indexOf(run[run.length - 1]);
    const curIdx = DAY_ORDER.indexOf(sorted[i]);
    if (curIdx === prevIdx + 1) {
      run.push(sorted[i]);
    } else {
      runs.push(run);
      run = [sorted[i]];
    }
  }
  runs.push(run);
  return runs
    .map(r => (r.length >= 3 ? `${r[0]}–${r[r.length - 1]}` : r.join(", ")))
    .join(", ");
}

// ===== Hero collage: scattered stamp icons around the medallion =====
const COLLAGE = [
  { icon: "chili",  color: "#C13B2A", top: "2%",  left: "4%",  size: 88,  rot: -9 },
  { icon: "bowl",   color: "#526E3F", top: "0%",  left: "78%", size: 100, rot: 8 },
  { icon: "grain",  color: "#E8A93B", top: "40%", left: "1%",  size: 82,  rot: 6 },
  { icon: "herb",   color: "#E8792A", top: "36%", left: "80%", size: 86,  rot: -10 },
  { icon: "skewer", color: "#8B4A62", top: "62%", left: "15%", size: 78,  rot: 4 },
  { icon: "citrus", color: "#2F5D62", top: "58%", left: "66%", size: 92,  rot: -6 },
];

const heroVisual = document.getElementById("heroVisual");
COLLAGE.forEach((s, i) => {
  const el = document.createElement("div");
  el.className = "stamp";
  el.setAttribute("aria-hidden", "true");
  el.style.setProperty("--stamp-color", s.color);
  el.style.setProperty("--stamp-rot", `${s.rot}deg`);
  el.style.setProperty("--stamp-delay", `${150 + i * 90}ms`);
  el.style.top = s.top;
  el.style.left = s.left;
  el.style.width = `${s.size}px`;
  el.style.height = `${s.size}px`;
  el.innerHTML = `<div class="stamp__pin"></div>${iconSvg(s.icon)}`;
  heroVisual.appendChild(el);
});

// ===== Populate category select =====
const categorySelect = document.getElementById("fCategory");
CATEGORIES.forEach(cat => {
  const opt = document.createElement("option");
  opt.value = cat.value;
  opt.textContent = cat.label;
  categorySelect.appendChild(opt);
});

// ===== Dish select: depends on chosen cuisine =====
const dishSelect = document.getElementById("fDish");

function updateDishOptions() {
  const cat = categorySelect.value;
  dishSelect.innerHTML = "";

  if (!cat) {
    dishSelect.disabled = true;
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Choose a cuisine first";
    dishSelect.appendChild(opt);
    return;
  }

  dishSelect.disabled = false;
  const allOpt = document.createElement("option");
  allOpt.value = "";
  allOpt.textContent = "All dishes";
  dishSelect.appendChild(allOpt);

  (SUBCATEGORIES[cat] || []).forEach(dish => {
    const opt = document.createElement("option");
    opt.value = dish;
    opt.textContent = dish;
    dishSelect.appendChild(opt);
  });
}
updateDishOptions();

// Set date min to today
const dateInput = document.getElementById("fDate");
const todayISO = new Date().toISOString().slice(0, 10);
dateInput.min = todayISO;

// ===== Render =====
const ledger = document.getElementById("ledger");
const resultCount = document.getElementById("resultCount");
const emptyState = document.getElementById("emptyState");

function buildRow(vendor) {
  const cat = CAT_BY_VALUE[vendor.category];
  const row = document.createElement("div");
  row.className = "row";
  row.style.setProperty("--stripe", cat.color);
  row.setAttribute("role", "listitem");

  const selectedDate = dateInput.value;
  let availHtml;
  if (selectedDate) {
    const weekday = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" });
    const isBlackout = vendor.blackout.includes(selectedDate);
    const isOpen = vendor.days.includes(weekday) && !isBlackout;
    availHtml = isOpen
      ? `<span class="row__avail is-open">Open that date</span>`
      : `<span class="row__avail is-closed">Not available then</span>`;
  } else {
    availHtml = `<span class="row__avail">Books ${compressDays(vendor.days)}</span>`;
  }

  const selectedDish = dishSelect.value;
  const dishChips = vendor.dishes
    .map(d => `<span class="dish-chip${d === selectedDish ? " is-match" : ""}">${d}</span>`)
    .join("");

  const stampInner = vendor.photo
    ? `<img src="${vendor.photo}" alt="" class="row__stamp-photo">`
    : iconSvg(cat.icon);

  row.innerHTML = `
    <div class="row__stripe"></div>
    <div class="row__stamp">${stampInner}</div>
    <div class="row__id">
      <div class="row__name">${vendor.name}</div>
      <div class="row__meta"><span class="cat">${cat.label}</span> &middot; ${vendor.neighborhood}</div>
    </div>
    <div class="row__desc">
      ${vendor.desc}
      <div class="row__dishes">${dishChips}</div>
    </div>
    <div class="row__side">
      <div class="row__price">from $${vendor.price} / guest</div>
      ${availHtml}
      <a class="row__contact" href="mailto:${vendor.email}">${vendor.email}</a>
      <button type="button" class="row__book" data-vendor-id="${vendor.id}">Book this caterer</button>
    </div>
  `;
  return row;
}

function applyFilters() {
  const category = categorySelect.value;
  const dish = dishSelect.value;
  const price = document.getElementById("fPrice").value;
  const selectedDate = dateInput.value;

  return VENDORS.filter(v => {
    if (category && v.category !== category) return false;
    if (dish && !v.dishes.includes(dish)) return false;
    if (price && priceTier(v.price) !== price) return false;
    if (selectedDate) {
      const weekday = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" });
      const isBlackout = v.blackout.includes(selectedDate);
      if (!v.days.includes(weekday) || isBlackout) return false;
    }
    return true;
  });
}

function render() {
  const filtered = applyFilters();
  ledger.innerHTML = "";
  filtered.forEach(v => ledger.appendChild(buildRow(v)));

  const n = filtered.length;
  resultCount.textContent = n === VENDORS.length
    ? `${n} caterers listed`
    : `${n} of ${VENDORS.length} caterers`;

  const noResults = n === 0;
  emptyState.hidden = !noResults;
  ledger.style.display = noResults ? "none" : "";
}

document.getElementById("filterForm").addEventListener("input", (e) => {
  if (e.target === categorySelect) {
    updateDishOptions();
  }
  render();
});

function resetFilters() {
  categorySelect.value = "";
  updateDishOptions();
  document.getElementById("fPrice").value = "";
  dateInput.value = "";
  render();
}
document.getElementById("resetBtn").addEventListener("click", resetFilters);
document.getElementById("emptyReset").addEventListener("click", resetFilters);

// ===== Booking wizard =====
const bookingModal = document.getElementById("bookingModal");
const bookingForm = document.getElementById("bookingForm");
const bkVendorName = document.getElementById("bkVendorName");
const bkGuests = document.getElementById("bkGuests");
const bkDate = document.getElementById("bkDate");
const bkDishesWrap = document.getElementById("bkDishes");
const bkName = document.getElementById("bkName");
const bkEmail = document.getElementById("bkEmail");
const bkPhone = document.getElementById("bkPhone");
const bkSummary = document.getElementById("bkSummary");
const bkError = document.getElementById("bkError");
const bkBack = document.getElementById("bkBack");
const bkNext = document.getElementById("bkNext");
const bkPay = document.getElementById("bkPay");
const stepper = document.getElementById("stepper");
const FULL_SERVICE_FEE = 250;
const TOTAL_STEPS = 5;

let currentVendor = null;
let currentStep = 1;

function showError(msg) {
  bkError.innerHTML = msg;
  bkError.hidden = false;
}
function clearError() {
  bkError.hidden = true;
  bkError.innerHTML = "";
}

function buildDishChecklist() {
  bkDishesWrap.innerHTML = currentVendor.dishes
    .map(d => `
      <label class="dish-check">
        <input type="checkbox" name="dish" value="${d}">
        ${d}
      </label>
    `)
    .join("");
}

function goToStep(step) {
  currentStep = step;
  clearError();
  bookingForm.querySelectorAll(".booking__step").forEach(el => {
    el.hidden = Number(el.dataset.step) !== step;
  });
  stepper.querySelectorAll(".stepper__item").forEach(el => {
    const n = Number(el.dataset.step);
    el.classList.toggle("is-active", n === step);
    el.classList.toggle("is-done", n < step);
  });
  bkBack.hidden = step === 1;
  bkNext.hidden = step === TOTAL_STEPS;
  bkPay.hidden = step !== TOTAL_STEPS;
  if (step === TOTAL_STEPS) renderSummary();
}

function validateStep(step) {
  if (step === 1) {
    return bkGuests.reportValidity() && bkDate.reportValidity();
  }
  if (step === 2) {
    const checked = bkDishesWrap.querySelectorAll("input:checked").length;
    if (checked === 0) {
      showError("Pick at least one dish to continue.");
      return false;
    }
    return true;
  }
  if (step === 4) {
    return bkName.reportValidity() && bkEmail.reportValidity() && bkPhone.reportValidity();
  }
  return true;
}

function computeTotal() {
  const guests = Math.max(1, parseInt(bkGuests.value, 10) || 0);
  const serviceStyle = bookingForm.querySelector('input[name="serviceStyle"]:checked').value;
  const subtotal = guests * currentVendor.price;
  const fee = serviceStyle === "fullservice" ? FULL_SERVICE_FEE : 0;
  return { guests, serviceStyle, subtotal, fee, total: subtotal + fee };
}

function renderSummary() {
  const dishes = [...bkDishesWrap.querySelectorAll("input:checked")].map(i => i.value);
  const { guests, serviceStyle, subtotal, fee, total } = computeTotal();
  const serviceLabel = serviceStyle === "fullservice" ? "Full service" : "Drop-off buffet";
  bkSummary.innerHTML = `
    <div><dt>Guests</dt><dd>${guests}</dd></div>
    <div><dt>Event date</dt><dd>${bkDate.value || "—"}</dd></div>
    <div><dt>Dishes</dt><dd>${dishes.join(", ") || "—"}</dd></div>
    <div><dt>Service</dt><dd>${serviceLabel}</dd></div>
    <div><dt>Per-guest subtotal</dt><dd>$${subtotal.toLocaleString()}</dd></div>
    ${fee ? `<div><dt>Staffing fee</dt><dd>$${fee.toLocaleString()}</dd></div>` : ""}
    <div class="total"><dt>Estimated total</dt><dd>$${total.toLocaleString()}</dd></div>
  `;
}

function openBooking(vendorId) {
  currentVendor = VENDOR_BY_ID[vendorId];
  if (!currentVendor) return;
  bookingForm.reset();
  bkVendorName.textContent = currentVendor.name;
  bkGuests.value = 50;
  bkDate.min = todayISO;
  bkDate.value = dateInput.value || "";
  buildDishChecklist();
  goToStep(1);
  bookingModal.showModal();
}

function offerEmailFallback(payload) {
  const { total } = computeTotal();
  const subject = encodeURIComponent(`Catering request: ${currentVendor.name}`);
  const body = encodeURIComponent(
    `Hi ${currentVendor.name},\n\n` +
    `I'd like to book catering through SERVZA.\n\n` +
    `Guests: ${payload.guests}\n` +
    `Event date: ${payload.date}\n` +
    `Dishes: ${payload.dishes.join(", ")}\n` +
    `Service style: ${payload.serviceStyle === "fullservice" ? "Full service" : "Drop-off buffet"}\n` +
    `Estimated total: $${total.toLocaleString()}\n\n` +
    `Contact me at:\n${payload.name}\n${payload.email}\n${payload.phone}\n`
  );
  const mailto = `mailto:${currentVendor.email}?subject=${subject}&body=${body}`;
  showError(`Online payment isn't connected yet on this site. <a href="${mailto}">Send this request to ${currentVendor.name} by email instead</a>.`);
}

ledger.addEventListener("click", (e) => {
  const btn = e.target.closest(".row__book");
  if (!btn) return;
  openBooking(btn.dataset.vendorId);
});

document.getElementById("bookingClose").addEventListener("click", () => bookingModal.close());
bookingModal.addEventListener("click", (e) => {
  if (e.target === bookingModal) bookingModal.close();
});
bookingModal.addEventListener("close", () => {
  currentVendor = null;
});

bkNext.addEventListener("click", () => {
  if (!validateStep(currentStep)) return;
  goToStep(currentStep + 1);
});
bkBack.addEventListener("click", () => {
  goToStep(currentStep - 1);
});

bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validateStep(1) || !validateStep(2) || !validateStep(4)) return;

  clearError();
  bkPay.disabled = true;
  const originalLabel = bkPay.textContent;
  bkPay.textContent = "Connecting to payment…";

  const payload = {
    vendorId: currentVendor.id,
    guests: bkGuests.value,
    date: bkDate.value,
    dishes: [...bkDishesWrap.querySelectorAll("input:checked")].map(i => i.value),
    serviceStyle: bookingForm.querySelector('input[name="serviceStyle"]:checked').value,
    name: bkName.value,
    email: bkEmail.value,
    phone: bkPhone.value,
  };

  try {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) throw new Error(data.error || "Checkout unavailable");
    window.location.href = data.url;
    return;
  } catch (err) {
    offerEmailFallback(payload);
  }

  bkPay.disabled = false;
  bkPay.textContent = originalLabel;
});

// ===== Load vendor data, then render =====
async function init() {
  const res = await fetch("data/vendors.json");
  VENDORS = await res.json();
  VENDOR_BY_ID = Object.fromEntries(VENDORS.map(v => [v.id, v]));
  render();
}
init();
