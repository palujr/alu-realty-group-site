const listings = [
  {
    id: 1,
    badge: "NEW",
    location: "McCormick Ranch · Scottsdale",
    price: 1275000,
    address: "8421 E. San Miguel Avenue",
    beds: 4,
    baths: 3,
    sqft: 2842,
    status: "For sale",
    imagePosition: "center 53%"
  },
  {
    id: 2,
    badge: "OPEN SAT 11–2",
    location: "Arcadia Lite · Phoenix",
    price: 895000,
    address: "3927 N. 41st Place",
    beds: 3,
    baths: 2,
    sqft: 2135,
    status: "For sale",
    imagePosition: "center 67%"
  },
  {
    id: 3,
    badge: "PRICE IMPROVED",
    location: "Kierland · Scottsdale",
    price: 1549000,
    address: "6502 E. Helena Drive",
    beds: 4,
    baths: 4,
    sqft: 3268,
    status: "For sale",
    imagePosition: "center 45%"
  },
  {
    id: 4,
    badge: "FOR LEASE",
    location: "Old Town · Scottsdale",
    price: 4850,
    address: "7147 E. Rancho Vista Drive",
    beds: 2,
    baths: 2,
    sqft: 1375,
    status: "For lease",
    imagePosition: "center 58%"
  },
  {
    id: 5,
    badge: "NEW",
    location: "Paradise Valley",
    price: 2325000,
    address: "6840 E. Hummingbird Lane",
    beds: 5,
    baths: 4,
    sqft: 4150,
    status: "For sale",
    imagePosition: "center 38%"
  },
  {
    id: 6,
    badge: "RECENTLY SOLD",
    location: "North Scottsdale",
    price: 1140000,
    address: "10218 E. Desert Cove Avenue",
    beds: 3,
    baths: 3,
    sqft: 2690,
    status: "Sold",
    imagePosition: "center 72%"
  }
];

const state = {
  mode: "buy",
  visibleCount: 3,
  location: "",
  maxPrice: 0,
  minBeds: 0,
  sort: "featured",
  saved: new Set(JSON.parse(localStorage.getItem("haven-saved") || "[]"))
};

const propertyGrid = document.querySelector("#propertyGrid");
const emptyState = document.querySelector("#emptyState");
const resultsBar = document.querySelector("#resultsBar");
const resultsText = document.querySelector("#resultsText");
const viewAllButton = document.querySelector("#viewAllButton");

const money = (value, status) => {
  if (status === "For lease") return `$${value.toLocaleString()}/mo`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
};

function getFilteredListings() {
  let filtered = listings.filter((listing) => {
    const modeMatch =
      state.mode === "rent" ? listing.status === "For lease" :
      state.mode === "sold" ? listing.status === "Sold" :
      listing.status === "For sale";
    const locationMatch = !state.location ||
      `${listing.location} ${listing.address}`.toLowerCase().includes(state.location.toLowerCase());
    const priceMatch = !state.maxPrice || listing.price <= state.maxPrice;
    return modeMatch && locationMatch && priceMatch && listing.beds >= state.minBeds;
  });

  if (state.sort === "price-asc") filtered.sort((a, b) => a.price - b.price);
  if (state.sort === "price-desc") filtered.sort((a, b) => b.price - a.price);
  return filtered;
}

function renderListings() {
  const filtered = getFilteredListings();
  const visible = filtered.slice(0, state.visibleCount);
  const heroImage = "assets/desert-home-hero.png";

  propertyGrid.innerHTML = visible.map((listing, index) => `
    <article class="property-card">
      <div class="property-image" style="background-image:
        linear-gradient(${index % 2 ? "135deg" : "25deg"}, rgba(46,61,55,.12), rgba(217,120,79,.08)),
        url('${heroImage}'); background-position:${listing.imagePosition}">
        <span class="property-badge ${listing.badge === "NEW" ? "new" : ""}">${listing.badge}</span>
        <button class="save-button ${state.saved.has(listing.id) ? "saved" : ""}" data-save="${listing.id}" aria-label="${state.saved.has(listing.id) ? "Remove from" : "Save to"} favorites">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5 1.1-1.1a5.5 5.5 0 0 0 0-7.8Z"/></svg>
        </button>
      </div>
      <div class="property-info">
        <p class="property-location">${listing.location}</p>
        <p class="property-price">${money(listing.price, listing.status)}</p>
        <p class="property-address">${listing.address}</p>
        <div class="property-facts">
          <span><strong>${listing.beds}</strong> beds</span>
          <span><strong>${listing.baths}</strong> baths</span>
          <span><strong>${listing.sqft.toLocaleString()}</strong> sq ft</span>
        </div>
        <div class="property-footer">
          <span>${listing.status}</span>
          <span>MLS #68${String(listing.id).padStart(4, "0")}</span>
        </div>
      </div>
    </article>
  `).join("");

  emptyState.hidden = filtered.length > 0;
  propertyGrid.hidden = filtered.length === 0;
  viewAllButton.hidden = filtered.length <= state.visibleCount;

  const hasFilters = state.location || state.maxPrice || state.minBeds || state.mode !== "buy";
  resultsBar.hidden = !hasFilters;
  const modeLabel = state.mode === "rent" ? "lease" : state.mode === "sold" ? "sold" : "sale";
  resultsText.textContent = `${filtered.length} ${filtered.length === 1 ? "property" : "properties"} found for ${modeLabel}`;
}

function showToast(message, options = {}) {
  const toast = document.querySelector("#toast");
  const title = options.title;
  const duration = options.duration || (options.variant === "success" ? 10000 : 2600);

  toast.className = `toast${options.variant ? ` toast-${options.variant}` : ""}`;
  toast.innerHTML = title
    ? `<strong>${title}</strong><span>${message}</span>`
    : `<span>${message}</span>`;
  toast.classList.add("show");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove("show"), duration);
}

document.querySelectorAll(".search-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".search-tab").forEach((item) => {
      item.classList.remove("active");
      item.setAttribute("aria-selected", "false");
    });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    state.mode = tab.dataset.mode;
    state.visibleCount = 3;
    document.querySelector("#priceInput").querySelectorAll("option").forEach((option, index) => {
      if (state.mode === "rent" && index > 0) {
        option.value = [0, 3000, 5000, 7500, 10000][index];
        option.textContent = ["", "Under $3k/mo", "Under $5k/mo", "Under $7.5k/mo", "Under $10k/mo"][index];
      } else if (state.mode !== "rent" && index > 0) {
        option.value = [0, 750000, 1000000, 1500000, 2500000][index];
        option.textContent = ["", "Under $750k", "Under $1M", "Under $1.5M", "Under $2.5M"][index];
      }
    });
    state.maxPrice = 0;
    document.querySelector("#priceInput").value = "";
    renderListings();
  });
});

document.querySelector("#heroSearch").addEventListener("submit", (event) => {
  event.preventDefault();
  state.location = document.querySelector("#locationInput").value.trim();
  state.maxPrice = Number(document.querySelector("#priceInput").value);
  state.minBeds = Number(document.querySelector("#bedsInput").value);
  state.visibleCount = 6;
  renderListings();
  document.querySelector("#properties").scrollIntoView({ behavior: "smooth" });
});

document.querySelector("#sortListings").addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderListings();
});

propertyGrid.addEventListener("click", (event) => {
  const saveButton = event.target.closest("[data-save]");
  if (!saveButton) return;
  const id = Number(saveButton.dataset.save);
  if (state.saved.has(id)) {
    state.saved.delete(id);
    showToast("Removed from your saved homes.");
  } else {
    state.saved.add(id);
    showToast("Home saved. Sign in to get price-change alerts.");
  }
  localStorage.setItem("haven-saved", JSON.stringify([...state.saved]));
  renderListings();
});

viewAllButton.addEventListener("click", () => {
  state.visibleCount = listings.length;
  renderListings();
});

function resetFilters() {
  state.location = "";
  state.maxPrice = 0;
  state.minBeds = 0;
  state.visibleCount = 3;
  document.querySelector("#locationInput").value = "";
  document.querySelector("#priceInput").value = "";
  document.querySelector("#bedsInput").value = "0";
  renderListings();
}

document.querySelector("#clearFilters").addEventListener("click", resetFilters);
document.querySelector("#resetSearch").addEventListener("click", resetFilters);

document.querySelector("#nextListings").addEventListener("click", () => {
  state.visibleCount = Math.min(state.visibleCount + 3, getFilteredListings().length);
  renderListings();
});
document.querySelector("#prevListings").addEventListener("click", () => {
  state.visibleCount = Math.max(3, state.visibleCount - 3);
  renderListings();
});

const backdrop = document.querySelector("#modalBackdrop");
let modalAutoCloseTimeout;
function openModal(name) {
  clearTimeout(modalAutoCloseTimeout);
  backdrop.hidden = false;
  document.body.style.overflow = "hidden";
  document.querySelectorAll(".modal").forEach((modal) => modal.hidden = true);
  document.querySelector(`#${name}Modal`).hidden = false;
}
function closeModal() {
  clearTimeout(modalAutoCloseTimeout);
  backdrop.hidden = true;
  document.body.style.overflow = "";
  document.querySelectorAll(".modal").forEach((modal) => modal.hidden = true);
}
document.querySelectorAll("[data-open-modal]").forEach((button) => {
  button.addEventListener("click", () => openModal(button.dataset.openModal));
});
document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closeModal));
backdrop.addEventListener("click", (event) => {
  if (event.target === backdrop) closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !backdrop.hidden) closeModal();
});

document.querySelector("#accountForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  localStorage.setItem("haven-account", JSON.stringify({ name: data.get("name"), email: data.get("email") }));
  closeModal();
  showToast("Account created. Your listing alerts are ready.");
  event.currentTarget.reset();
});

document.querySelector("#valuationForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("button[type='submit']");
  const data = new FormData(form);

  button.disabled = true;
  button.textContent = "Sending...";

  try {
    const response = await fetch("/api/valuation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        address: data.get("address"),
        email: data.get("email"),
        phone: data.get("phone"),
        message: data.get("message"),
        sourcePage: window.location.pathname
      })
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || "Unable to send valuation request.");
    }

    form.reset();
    openModal("valuationSuccess");
    modalAutoCloseTimeout = setTimeout(closeModal, 10000);
  } catch (error) {
    showToast(error.message || "Something went wrong. Please try again.");
  } finally {
    button.disabled = false;
    button.textContent = "Request my valuation";
  }
});

function updatePayment() {
  const price = Number(document.querySelector("#calcPrice").value);
  const down = Number(document.querySelector("#calcDown").value);
  const annualRate = Number(document.querySelector("#calcRate").value) / 100;
  const principal = Math.max(0, price - down);
  const monthlyRate = annualRate / 12;
  const months = 360;
  const payment = monthlyRate
    ? principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1)
    : principal / months;
  document.querySelector("#paymentResult").textContent = `${money(Math.round(payment), "sale")}/mo`;
}
document.querySelectorAll("#calculatorForm input").forEach((input) => input.addEventListener("input", updatePayment));
updatePayment();

const menuButton = document.querySelector("#menuButton");
const mobileNav = document.querySelector("#mobileNav");
menuButton.addEventListener("click", () => {
  const open = mobileNav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});
mobileNav.addEventListener("click", () => {
  mobileNav.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
});

renderListings();
