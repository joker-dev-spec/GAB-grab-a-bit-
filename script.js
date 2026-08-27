/* ============================================================
   GRAB A BITE — Ordering logic
   ============================================================
   ⚠️ SETUP — edit the CONFIG block below before you launch:

   1. ownerPhoneWhatsApp — your WhatsApp number in international
      format, digits only, NO plus sign and NO leading zero.
      e.g. Nigerian number 0803 123 4567 -> "2348031234567"
      Orders open as WhatsApp messages to this number — this is
      the only channel that receives the ticket itself.

   2. ownerEmail — shown in the Contact section as an email link
      (customers can also reach you directly by mail). Orders are
      NOT sent by email any more — that path was removed to keep
      the checkout to one step.

   3. opayQrImage / opayAccountName — your OPay "Receive Money" QR
      code (already dropped in as opay-qr.jpg) and the account name
      it belongs to, so customers can confirm they're paying the
      right person before scanning.

   Why a QR code and not a popup: OPay's checkout API is server-to-
   server (signed requests with your private key + a webhook
   callback) — it has no client-side "just add a public key" option
   like some gateways do, and a shareable payment *link* needs an
   OPay Business/Merchant account, not the personal app. This site
   has no backend, so instead of faking that, "Pay with OPay" shows
   your QR code right in the checkout modal. The customer scans it
   with their own OPay app, pays, comes back, and confirms — then
   their order sends to you same as before.

   Want payments verified automatically instead of by the customer
   confirming? That needs a small backend + an OPay Business account
   calling their Checkout API and handling the payment webhook — a
   separate build, ask if you want help with it.

   4. minOrderAmount — smallest subtotal (before delivery) you'll
      accept as an order. Set to 0 to disable.

   5. openingHours — one open/close time per day of the week, 24hr
      "HH:MM" format. Set a day to null to mark it fully closed.
      Times are checked against the CUSTOMER'S device clock, so if
      you expect orders from outside Lagos, keep that in mind.

   6. orderLog — logs every completed order to your Google Sheet in
      the background (silent, customer never sees the form). Uses
      the Google Form you set up + its field IDs. If you ever rebuild
      the form, you'll need to update formActionUrl and the entry IDs
      below to match (find them via "Get pre-filled link" again).

   7. deliveryZones — pick your area names and set your own fee for
      each. Customers choose their area at checkout instead of a flat
      fee. Set a zone's fee to null (no quotes) for "far/uncertain"
      areas — the site will require them to pay on delivery instead
      of online, since the amount isn't fixed yet, and you can agree
      a fee by phone before you cook.
   ============================================================ */

const CONFIG = {
  restaurantName: "GRAB A BITE",
  ownerPhoneWhatsApp: "2347043930307",   // <-- put your real WhatsApp number here
  ownerEmail: "kolawoletaiwo415@gmail.com",     // <-- put your real email here
  restaurantAddress: "Along badagry exp way, iyana itoja, num 20 ogunjobi street", // <-- shown in the Contact section + used for the map
  opayQrImage: "opay-qr.jpg",
  opayAccountNumber: "7043930307", // shown as a fallback if the customer can't scan the QR
  opayAccountName: "Taiwo Rapheal Kolawole",
  currency: "NGN",
  minOrderAmount: 2500,
  deliveryZones: [
    { name: "Badagry (within town)", fee: 600},
    { name: "Muwo", fee: 900},
    { name: "Ajara (market area)", fee: 700 },
    { name: "Outside Lagos", fee: null } // null = "we'll call to confirm", pay-on-delivery only
  ],
  // Optional review links — leave blank and the corresponding link in the
  // Reviews section will be hidden. Set to a full https:// URL.
  reviewsGoogleUrl: "", // e.g. "https://maps.google.com/?cid=1234567890"
  reviewsInstagramUrl: "",
  reviewsFacebookUrl: "",
  openingHours: {
    0: null,                          // Sunday — closed
    1: { open:"08:00", close:"22:00" }, // Monday
    2: { open:"08:00", close:"22:00" }, // Tuesday
    3: { open:"08:00", close:"22:00" }, // Wednesday
    4: { open:"08:00", close:"22:00" }, // Thursday
    5: { open:"08:00", close:"23:00" }, // Friday
    6: { open:"08:00", close:"23:00" }  // Saturday
  },
  orderLog: {
    formActionUrl: "https://docs.google.com/forms/d/e/1FAIpQLSdukrIRns6ERya0fBaB4fXws3f1-aN7ruEVvY39ch1cetTHOw/formResponse",
    fields: {
      name: "entry.1013762934",
      phone: "entry.1985593731",
      address: "entry.1931612398",
      payment: "entry.363362537",
      notes: "entry.1102665474",
      items: "entry.1914389403",
      delivery: "entry.1960188780",
      total: "entry.224798525"
    }
  }
};

/* ---------------- MENU DATA ---------------- */
const MENU = [
  { id:"jollof",   cat:"mains", img:"images/jollofrice.jpeg", name:"Jollof Rice & Chicken", desc:"Smoky party-style jollof, grilled chicken thigh, side of fried plantain.", price:4200, tag:"popular" },
  { id:"friedrice",cat:"mains", img:"images/friedrice.jpeg", name:"Fried Rice & Beef", desc:"Vegetable fried rice with mixed peppers and grilled beef strips.", price:4000 },
  { id:"eguisi",   cat:"mains", img:"images/egusi.jpeg", name:"Egusi Soup & Pounded Yam", desc:"Melon-seed soup, assorted meat, smooth pounded yam.", price:4800, tag:"spicy" },
  { id:"asun",     cat:"mains", img:"images/asun.jpeg", name:"Asun (Spicy Goat Meat)", desc:"Chargrilled goat meat tossed in pepper sauce, onions and scotch bonnet.", price:5200, tag:"spicy" },
  { id:"shawarma", cat:"mains", img:"images/chicken.jpeg", name:"Chicken Shawarma", desc:"Grilled shredded chicken, garlic sauce, pickles, wrapped tight.", price:3500 },
  { id:"suya",     cat:"mains", img:"images/beef.jpeg", name:"Beef Suya Wrap", desc:"Yaji-spiced beef skewers rolled with onions, cabbage and suya pepper.", price:3800, tag:"spicy" },
  { id:"veg-rice", cat:"mains", img:"images/vegetable.jpeg", name:"Vegetable Coconut Rice", desc:"Coconut-milk rice with garden vegetables. Fully plant-based.", price:3600, tag:"veg" },

  { id:"puffpuff", cat:"small-chops", img:"images/puffpuff.jpeg", name:"Puff-Puff (6 pcs)", desc:"Deep-fried, sugar-dusted dough balls, straight off the fire.", price:1500, tag:"popular" },
  { id:"meatpie",  cat:"small-chops", img:"images/meatpie.jpeg", name:"Meat Pie (2 pcs)", desc:"Flaky pastry, spiced minced beef and potato filling.", price:1800 },
  { id:"chinchin", cat:"small-chops", img:"images/chinchin.jpeg", name:"Chin Chin (box)", desc:"Crunchy fried pastry snack, lightly sweetened.", price:1200 },
  { id:"plantain", cat:"small-chops", img:"images/plantain.jpeg", name:"Plantain Chips", desc:"Thin-cut, crisp-fried, lightly salted.", price:1000, tag:"veg" },
  { id:"samosa",   cat:"small-chops", img:"images/samosa.jpeg", name:"Beef Samosa (4 pcs)", desc:"Crisp pastry triangles filled with spiced minced beef.", price:1600 },

  { id:"zobo",     cat:"drinks", img:"images/zobo.jpeg", name:"Zobo, Chilled", desc:"Hibiscus drink with ginger, ice-cold.", price:1000, tag:"veg" },
  { id:"chapman",  cat:"drinks", img:"images/chapman.jpeg", name:"Chapman", desc:"Nigeria's classic mocktail, fruity and fizzy.", price:1800 },
  { id:"water",    cat:"drinks", img:"images/water.jpeg", name:"Bottled Water", desc:"75cl, chilled.", price:500, tag:"veg" },
  { id:"smoothie", cat:"drinks", img:"images/smoothie.jpeg", name:"Mango & Pineapple Smoothie", desc:"Blended fresh, no added sugar.", price:2200, tag:"veg" },
];

/* ---------------- STATE ---------------- */
// Defensive parse: if localStorage ever throws (private mode, quota, corrupted
// JSON, etc.) fall back to an empty cart instead of halting the whole script.
let cart = {};
try {
  cart = JSON.parse(localStorage.getItem("gab_cart") || "{}") || {};
} catch(err){
  console.warn("[GAB] Couldn't read saved cart, starting fresh:", err);
  cart = {};
}
// Safety: drop any cart items saved before the menu was populated, or whose id
// no longer exists. (Image is looked up live from MENU on render — no need to
// store it in the cart, which kept stale paths when image files were renamed.)
Object.keys(cart).forEach(id => {
  const entry = cart[id];
  if(!MENU.find(d => d.id === id) || !entry || typeof entry !== "object") { delete cart[id]; return; }
  // Strip legacy fields that are no longer used.
  if(entry.img) delete entry.img;
});
let activeCat = "mains";
let lastOrderUrl = ""; // keeps the wa.me link so customers can retry if the popup was blocked

/* ---------------- HELPERS ---------------- */
const naira = n => "₦" + n.toLocaleString("en-NG");
const saveCart = () => localStorage.setItem("gab_cart", JSON.stringify(cart));

function cartCount(){
  return Object.values(cart).reduce((sum,i)=>sum+i.qty,0);
}
function cartSubtotal(){
  return Object.values(cart).reduce((sum,i)=>sum+i.qty*i.price,0);
}

/* ---------------- OPENING HOURS ---------------- */
function isOpenNow(){
  const now = new Date();
  const today = CONFIG.openingHours[now.getDay()];
  if(!today) return false;
  const [oh,om] = today.open.split(":").map(Number);
  const [ch,cm] = today.close.split(":").map(Number);
  const openMins = oh*60+om;
  const closeMins = ch*60+cm;
  const nowMins = now.getHours()*60+now.getMinutes();
  return nowMins >= openMins && nowMins < closeMins;
}

function todayHoursText(){
  const today = CONFIG.openingHours[new Date().getDay()];
  if(!today) return "closed today";
  return `open ${formatTime(today.open)}–${formatTime(today.close)}`;
}

function formatTime(hhmm){
  const [h,m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${period}` : `${h12}:${String(m).padStart(2,"0")}${period}`;
}

function renderStatusBanner(){
  const banner = document.getElementById("statusBanner");
  if(isOpenNow()){
    banner.textContent = `We're open — ${todayHoursText()}`;
    banner.className = "status-banner open";
  } else {
    banner.textContent = `We're closed right now — ${todayHoursText()}. You can browse, but ordering opens back up when we do.`;
    banner.className = "status-banner closed";
  }
  updateTicketStamp();
}

function updateTicketStamp(){
  const stamp = document.getElementById("ticketStamp");
  if(!stamp) return;
  if(isOpenNow()){
    stamp.textContent = "FIRING NOW 🔥";
    stamp.style.color = "var(--chili)";
  } else {
    stamp.textContent = "KITCHEN CLOSED";
    stamp.style.color = "var(--ink-soft)";
  }
}

/* ---------------- ABOUT / CONTACT ---------------- */
const DAY_ORDER = [1,2,3,4,5,6,0]; // Monday first
const DAY_NAMES = { 0:"Sunday",1:"Monday",2:"Tuesday",3:"Wednesday",4:"Thursday",5:"Friday",6:"Saturday" };

function renderAboutSection(){
  document.getElementById("aboutAddress").textContent = CONFIG.restaurantAddress;
  const phoneRaw = CONFIG.ownerPhoneWhatsApp; // e.g. "2348031234567" — last 10 digits are the local number
  const phoneLocal = phoneRaw.replace(/^234/, "0");
  const phoneIntl = "+" + phoneRaw;
  const phoneTel = phoneRaw; // tel: links accept digits with the country code, no +
  document.getElementById("aboutPhone").innerHTML =
    `<a href="tel:${phoneTel}">${phoneLocal}</a>` +
    ` <span style="color:rgba(255,248,237,0.4);">·</span> ` +
    `<a href="https://wa.me/${phoneRaw}" target="_blank" rel="noopener">WhatsApp</a>` +
    `<span style="color:rgba(255,248,237,0.55);font-size:0.82rem;display:block;margin-top:2px;">International: ${phoneIntl}</span>`;

  document.getElementById("aboutEmail").innerHTML =
    `<a href="mailto:${CONFIG.ownerEmail}">${CONFIG.ownerEmail}</a>`;

  const hoursList = document.getElementById("aboutHoursList");
  hoursList.innerHTML = "";
  DAY_ORDER.forEach(dayIdx=>{
    const hours = CONFIG.openingHours[dayIdx];
    const li = document.createElement("li");
    li.innerHTML = `<span>${DAY_NAMES[dayIdx]}</span><span>${hours ? `${formatTime(hours.open)} – ${formatTime(hours.close)}` : "Closed"}</span>`;
    hoursList.appendChild(li);
  });

  const mapFrame = document.querySelector(".about-map iframe");
  if(mapFrame){
    mapFrame.src = `https://www.google.com/maps?q=${encodeURIComponent(CONFIG.restaurantAddress)}&output=embed`;
  }

  // Social / reviews links — only show if a URL is configured.
  const socialMap = {
    instagram: CONFIG.reviewsInstagramUrl,
    facebook:  CONFIG.reviewsFacebookUrl,
    google:    CONFIG.reviewsGoogleUrl
  };
  document.querySelectorAll("#aboutSocials a[data-social]").forEach(a => {
    const url = socialMap[a.dataset.social];
    if(url){
      a.href = url;
      a.style.display = "";
    } else {
      a.removeAttribute("href");
      a.style.display = "none";
    }
  });

  // "Leave a review" link after the reviews grid.
  const disclaimer = document.getElementById("reviewDisclaimer");
  const reviewLink = document.getElementById("reviewLink");
  if(disclaimer && reviewLink){
    if(CONFIG.reviewsGoogleUrl){
      reviewLink.href = CONFIG.reviewsGoogleUrl;
      disclaimer.style.display = "";
    } else {
      disclaimer.style.display = "none";
    }
  }
}

/* ---------------- FORM VALIDATION ---------------- */
function validateName(value){
  if(value.length < 2) return "Enter your full name.";
  return "";
}
function validatePhone(value){
  const digits = value.replace(/[\s-]/g,"");
  // Nigerian mobile numbers start 07, 08 or 09 (10 digits total) — the
  // third digit varies by network (0805/0806/0809/0905 etc.), so accept
  // anything in 070–099 rather than a fixed prefix list.
  const okLocal = /^0[789]\d{9}$/.test(digits);
  const okIntl = /^\+?234[789]\d{9}$/.test(digits);
  if(!okLocal && !okIntl) return "Enter a valid Nigerian phone number, e.g. 0803 000 0000.";
  return "";
}
function validateAddress(value){
  if(value.length < 8) return "Add a fuller address so we can find you — street + area.";
  return "";
}
function validateZone(value){
  if(!value) return "Pick your delivery area.";
  return "";
}

function showFieldError(inputId, errorId, message){
  const input = document.getElementById(inputId);
  const err = document.getElementById(errorId);
  if(message){
    input.classList.add("invalid");
    err.textContent = message;
    err.classList.add("show");
  } else {
    input.classList.remove("invalid");
    err.classList.remove("show");
  }
  return !message;
}

function validateForm(){
  const nameOk = showFieldError("custName","errName", validateName(document.getElementById("custName").value.trim()));
  const phoneOk = showFieldError("custPhone","errPhone", validatePhone(document.getElementById("custPhone").value.trim()));
  const addressOk = showFieldError("custAddress","errAddress", validateAddress(document.getElementById("custAddress").value.trim()));
  const zoneOk = showFieldError("custZone","errZone", validateZone(document.getElementById("custZone").value));
  if(!(nameOk && phoneOk && addressOk && zoneOk)){
    // Scroll the first invalid field into view so the customer actually sees
    // the error on mobile (modals can be taller than the viewport).
    const firstInvalid = document.querySelector(".field input.invalid, .field textarea.invalid, .field select.invalid");
    if(firstInvalid){
      firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      firstInvalid.focus({ preventScroll: true });
    }
    return false;
  }
  return true;
}

// Clear a field's error as soon as the person starts fixing it
["custName","custPhone","custAddress"].forEach(id=>{
  document.getElementById(id).addEventListener("input", ()=>{
    document.getElementById(id).classList.remove("invalid");
    document.getElementById("err"+id.replace("cust","")).classList.remove("show");
  });
});
document.getElementById("custZone").addEventListener("change", ()=>{
  document.getElementById("custZone").classList.remove("invalid");
  document.getElementById("errZone").classList.remove("show");
  updateZoneUI();
});

/* ---------------- RENDER MENU ---------------- */
const menuGrid = document.getElementById("menuGrid");

function renderMenu(){
  menuGrid.innerHTML = "";
  MENU.filter(d => d.cat === activeCat).forEach(dish=>{
    const card = document.createElement("div");
    card.className = "dish-card";
    const tagHTML = dish.tag
      ? `<span class="dish-tag tag-${dish.tag}">${dish.tag === "veg" ? "VEG" : dish.tag === "spicy" ? "SPICY" : "POPULAR"}</span>`
      : "";
    card.innerHTML = `
      <div class="dish-photo">
        <img src="${dish.img}" alt="${dish.name}" loading="lazy">
        ${tagHTML}
      </div>
      <div class="dish-name">${dish.name}</div>
      <div class="dish-desc">${dish.desc}</div>
      <div class="dish-bottom">
        <span class="dish-price">${naira(dish.price)}</span>
        <button class="dish-add" data-id="${dish.id}" aria-label="Add ${dish.name}">+</button>
      </div>
    `;
    menuGrid.appendChild(card);
  });
}

document.getElementById("menuTabs").addEventListener("click", e=>{
  const tab = e.target.closest(".menu-tab");
  if(!tab) return;
  document.querySelectorAll(".menu-tab").forEach(t=>t.classList.remove("active"));
  tab.classList.add("active");
  activeCat = tab.dataset.cat;
  renderMenu();
});

menuGrid.addEventListener("click", e=>{
  const btn = e.target.closest(".dish-add");
  if(!btn) return;
  addToCart(btn.dataset.id);
  btn.classList.add("just-added");
  btn.textContent = "✓";
  setTimeout(()=>{ btn.classList.remove("just-added"); btn.textContent="+"; }, 700);
});

/* ---------------- CART LOGIC ---------------- */
function addToCart(id){
  const dish = MENU.find(d=>d.id===id);
  if(!dish) return;
  if(!cart[id]) cart[id] = { name:dish.name, price:dish.price, qty:0 };
  cart[id].qty++;
  saveCart();
  renderCart();
  showToast(`${dish.name} added to your ticket`);
}

function dishImage(id){
  const dish = MENU.find(d=>d.id===id);
  return dish ? dish.img : "";
}
function changeQty(id, delta){
  if(!cart[id]) return;
  cart[id].qty += delta;
  if(cart[id].qty <= 0) delete cart[id];
  saveCart();
  renderCart();
}
function removeItem(id){
  delete cart[id];
  saveCart();
  renderCart();
}

const cartItemsEl = document.getElementById("cartItems");
const cartEmptyEl = document.getElementById("cartEmpty");
const cartCountEl = document.getElementById("cartCount");
const cartSubtotalEl = document.getElementById("cartSubtotal");
const cartDeliveryEl = document.getElementById("cartDelivery");
const cartTotalEl = document.getElementById("cartTotal");
const cartMinNoticeEl = document.getElementById("cartMinNotice");
const checkoutBtn = document.getElementById("checkoutBtn");
const modalTotalEl = document.getElementById("modalTotal");

function renderCart(){
  const ids = Object.keys(cart);
  const count = cartCount();
  cartCountEl.textContent = count;
  cartCountEl.classList.toggle("is-zero", count === 0);

  cartItemsEl.querySelectorAll(".cart-item").forEach(el=>el.remove());
  cartEmptyEl.style.display = ids.length ? "none" : "block";

  ids.forEach(id=>{
    const item = cart[id];
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <img class="cart-item-img" src="${dishImage(id)}" alt="${item.name}" onerror="this.style.visibility='hidden'">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${naira(item.price)} each</div>
        <div class="cart-item-qty">
          <button class="qty-btn" data-action="dec" data-id="${id}">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" data-action="inc" data-id="${id}">+</button>
          <button class="cart-item-remove" data-id="${id}">Remove</button>
        </div>
      </div>
    `;
    cartItemsEl.appendChild(row);
  });

  const subtotal = cartSubtotal();
  const belowMin = ids.length > 0 && subtotal < CONFIG.minOrderAmount;

  cartSubtotalEl.textContent = naira(subtotal);
  cartDeliveryEl.textContent = ids.length ? "Chosen at checkout" : naira(0);
  cartTotalEl.textContent = naira(subtotal) + " +delivery";
  modalTotalEl.textContent = naira(subtotal) + " +delivery";

  if(belowMin){
    cartMinNoticeEl.textContent = `Add ${naira(CONFIG.minOrderAmount - subtotal)} more to reach our ${naira(CONFIG.minOrderAmount)} minimum order.`;
    cartMinNoticeEl.classList.add("show");
  } else {
    cartMinNoticeEl.classList.remove("show");
  }

  checkoutBtn.disabled = ids.length === 0 || belowMin;
}

cartItemsEl.addEventListener("click", e=>{
  const qtyBtn = e.target.closest(".qty-btn");
  const removeBtn = e.target.closest(".cart-item-remove");
  if(qtyBtn){
    changeQty(qtyBtn.dataset.id, qtyBtn.dataset.action === "inc" ? 1 : -1);
  } else if(removeBtn){
    removeItem(removeBtn.dataset.id);
  }
});

/* ---------------- CART DRAWER OPEN/CLOSE ---------------- */
const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");

function openCart(){
  cartDrawer.classList.add("open");
  cartOverlay.classList.add("open");
  trapFocus(cartDrawer);
}
function closeCart(){
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("open");
  releaseFocus();
}
document.getElementById("cartToggle").addEventListener("click", openCart);
document.getElementById("cartClose").addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);

/* ---------------- CHECKOUT MODAL ---------------- */
const checkoutOverlay = document.getElementById("checkoutOverlay");

document.getElementById("checkoutBtn").addEventListener("click", ()=>{
  if(!isOpenNow()){
    showToast(`We're closed right now — ${todayHoursText()}. Come back when we're open!`);
    return;
  }
  closeCart();
  checkoutOverlay.classList.add("open");
  trapFocus(checkoutOverlay.querySelector(".modal"));
});

function closeCheckout(){
  checkoutOverlay.classList.remove("open");
  releaseFocus();
  resetCheckoutModal();
}
document.getElementById("checkoutClose").addEventListener("click", closeCheckout);

document.getElementById("detailsForm").addEventListener("submit", e=>{
  e.preventDefault();

  if(!isOpenNow()){
    showToast(`We're closed right now — ${todayHoursText()}.`);
    return;
  }
  if(!validateForm()) return;

  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const address = document.getElementById("custAddress").value.trim();
  const notes = document.getElementById("custNotes").value.trim();
  const zoneIndex = document.getElementById("custZone").value;
  const zone = CONFIG.deliveryZones[zoneIndex];
  let payMethod = document.querySelector('input[name="payMethod"]:checked').value;

  // Zones with no fixed fee (fee: null) can't be charged online yet —
  // force pay-on-delivery so the amount can be confirmed by phone first.
  if(zone.fee === null) payMethod = "delivery";

  const ref = "GAB-" + Math.random().toString(36).slice(2,7).toUpperCase();
  const order = { name, phone, address, notes, payMethod, zoneName: zone.name, deliveryFee: zone.fee, ref };

  if(payMethod === "online"){
    payWithOpay(order);
  } else {
    finalizeOrder(order, "Pay on delivery");
  }
});

/* ---------------- DELIVERY ZONES ---------------- */
function renderZoneOptions(){
  const select = document.getElementById("custZone");
  // Guard against double-render (e.g. on hot-reload or if init runs twice).
  if(select.dataset.rendered === "1") return;
  select.dataset.rendered = "1";
  CONFIG.deliveryZones.forEach((zone, i)=>{
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = zone.fee === null
      ? `${zone.name} — call to confirm fee`
      : `${zone.name} — ${naira(zone.fee)}`;
    select.appendChild(opt);
  });
}

function updateZoneUI(){
  const zoneIndex = document.getElementById("custZone").value;
  const onlineRadio = document.querySelector('input[name="payMethod"][value="online"]');
  const onlineLabel = onlineRadio.closest(".pay-option");
  const zoneNote = document.getElementById("zoneNote");

  if(zoneIndex === ""){
    modalTotalEl.textContent = naira(cartSubtotal()) + " +delivery";
    onlineRadio.disabled = false;
    onlineLabel.classList.remove("pay-option-disabled");
    zoneNote.classList.remove("show");
    return;
  }

  const zone = CONFIG.deliveryZones[zoneIndex];
  if(zone.fee === null){
    modalTotalEl.textContent = naira(cartSubtotal()) + " + TBC";
    onlineRadio.disabled = true;
    onlineLabel.classList.add("pay-option-disabled");
    document.querySelector('input[name="payMethod"][value="delivery"]').checked = true;
    zoneNote.textContent = "This area needs a quick call to confirm the delivery fee — pay on delivery only.";
    zoneNote.classList.add("show");
  } else {
    modalTotalEl.textContent = naira(cartSubtotal() + zone.fee);
    onlineRadio.disabled = false;
    onlineLabel.classList.remove("pay-option-disabled");
    zoneNote.classList.remove("show");
  }
}

/* ---------------- OPAY (QR code flow) ---------------- */
function payWithOpay(order){
  showOpayQrStep(order);
}

function showOpayQrStep(order){
  const form = document.getElementById("detailsForm");
  const total = cartSubtotal() + order.deliveryFee;
  form.style.display = "none";

  const confirmBox = document.createElement("div");
  confirmBox.id = "opayConfirmBox";
  confirmBox.innerHTML = `
    <p class="modal-sub">Scan this with your OPay app to pay <strong>${naira(total)}</strong>, then confirm below.</p>
    <div class="opay-qr-box">
      <img src="${CONFIG.opayQrImage}" alt="OPay QR code for ${CONFIG.opayAccountName}" class="opay-qr-img"
           onerror="this.style.display='none'; this.nextElementSibling.style.display='block'; this.parentNode.querySelector('.opay-qr-fallback').classList.add('show');">
      <p class="opay-qr-fallback-promo" style="display:none;margin-top:14px;padding:14px;background:var(--paper);border-radius:10px;border:1.5px dashed var(--chili);">
        QR code failed to load. Send payment manually to:<br>
        <strong style="font-size:1.05rem;display:inline-block;margin-top:6px;">${CONFIG.opayAccountNumber}</strong><br>
        <span style="color:var(--ink-soft);font-size:0.85rem;">${CONFIG.opayAccountName}</span>
      </p>
      <p class="opay-qr-name">${CONFIG.opayAccountName}</p>
      <p class="opay-qr-fallback">Can't scan? Send to OPay account <strong>${CONFIG.opayAccountNumber}</strong></p>
    </div>
    <button type="button" class="btn btn-primary btn-block" id="opayConfirmBtn">I've paid — send my order</button>
    <button type="button" class="btn btn-block" id="opayBackBtn" style="margin-top:10px;background:transparent;color:var(--ink-soft);box-shadow:none;">← Back</button>
  `;
  document.getElementById("stepDetails").appendChild(confirmBox);

  document.getElementById("opayConfirmBtn").addEventListener("click", ()=>{
    finalizeOrder(order, "Paid via OPay (customer-confirmed)");
    confirmBox.remove();
    form.style.display = "";
  });
  document.getElementById("opayBackBtn").addEventListener("click", ()=>{
    confirmBox.remove();
    form.style.display = "";
  });
}

/* ---------------- ORDER LOG (Google Sheet, silent) ---------------- */
function logOrderToSheet(order, items, delivery, total, paymentNote){
  const itemsText = items.map(i => `${i.qty}x ${i.name}`).join(", ");
  const f = CONFIG.orderLog.fields;
  const deliveryText = delivery === null ? "TBC" : naira(delivery);
  const totalText = delivery === null ? naira(total) + "+" : naira(total);

  const params = new URLSearchParams();
  params.append(f.name, order.name);
  params.append(f.phone, order.phone);
  params.append(f.address, `${order.address} (${order.zoneName})`);
  params.append(f.payment, paymentNote);
  params.append(f.notes, order.notes || "-");
  params.append(f.items, itemsText);
  params.append(f.delivery, deliveryText);
  params.append(f.total, totalText);

  // "no-cors" means we can't read the response, but the submission still
  // goes through — this is the standard way to post to a Google Form
  // from outside its own page. Failures here are logged quietly so a
  // Sheet hiccup never blocks the customer's actual order.
  fetch(CONFIG.orderLog.formActionUrl, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  }).catch(err => console.warn("Order log: failed to reach Google Sheet", err));
}

/* ---------------- BUILD + SEND ORDER ---------------- */
function buildOrderMessage(order, paymentNote){
  const subtotal = cartSubtotal();
  const deliveryText = order.deliveryFee === null ? "To be confirmed by phone" : naira(order.deliveryFee);
  const total = subtotal + (order.deliveryFee || 0);

  let lines = `NEW ORDER — ${CONFIG.restaurantName}\n`;
  lines += `Ref: ${order.ref}\n\n`;
  lines += `Customer: ${order.name}\nPhone: ${order.phone}\nAddress: ${order.address}\nArea: ${order.zoneName}\n`;
  if(order.notes) lines += `Notes: ${order.notes}\n`;
  lines += `\nItems:\n`;
  Object.values(cart).forEach(item=>{
    lines += `${item.qty} × ${item.name} — ${naira(item.price*item.qty)}\n`;
  });
  lines += `\nSubtotal: ${naira(subtotal)}\nDelivery: ${deliveryText}\nTotal: ${order.deliveryFee === null ? naira(subtotal) + " + delivery TBC" : naira(total)}\n`;
  lines += `\nPayment: ${paymentNote}`;
  return lines;
}

function finalizeOrder(order, paymentNote){
  const message = buildOrderMessage(order, paymentNote);
  const subtotal = cartSubtotal();
  const delivery = order.deliveryFee;
  const total = subtotal + (delivery || 0);
  const itemsSnapshot = Object.values(cart);

  const url = `https://wa.me/${CONFIG.ownerPhoneWhatsApp}?text=${encodeURIComponent(message)}`;
  lastOrderUrl = url;
  window.open(url, "_blank");

  afterOrderDispatched(order, itemsSnapshot, subtotal, delivery, total, paymentNote);
}

function afterOrderDispatched(order, itemsSnapshot, subtotal, delivery, total, paymentNote){
  logOrderToSheet(order, itemsSnapshot, delivery, total, paymentNote);
  showConfirmationStep(order, itemsSnapshot, subtotal, delivery, total, paymentNote);
  cart = {};
  saveCart();
  renderCart();
}

function showConfirmationStep(order, items, subtotal, delivery, total, paymentNote){
  const stepDetails = document.getElementById("stepDetails");
  const stepConfirmation = document.getElementById("stepConfirmation");
  const opayBox = document.getElementById("opayConfirmBox");
  if(opayBox) opayBox.remove();
  stepDetails.querySelector("form").style.display = "";
  stepDetails.style.display = "none";
  stepConfirmation.style.display = "block";

  document.getElementById("confirmSub").textContent =
    "Your ticket just opened in WhatsApp — hit send there to reach our kitchen. We'll confirm with you shortly.";

  const now = new Date();
  const ts = now.toLocaleString("en-NG", {
    day:"numeric", month:"short", year:"numeric",
    hour:"numeric", minute:"2-digit", hour12:true, timeZone:"Africa/Lagos"
  });
  const metaEl = document.getElementById("confirmMeta");
  metaEl.textContent = `${order.ref}  ·  ${ts}`;

  const reopenLink = document.getElementById("confirmWhatsAppLink");
  if(reopenLink && lastOrderUrl) reopenLink.href = lastOrderUrl;

  const deliveryText = delivery === null ? "To be confirmed" : naira(delivery);
  const totalText = delivery === null ? naira(subtotal) + " + delivery" : naira(total);

  let html = "";
  items.forEach(item=>{
    html += `<div class="confirm-item"><span>${item.qty} × ${item.name}</span><span>${naira(item.price*item.qty)}</span></div>`;
  });
  html += `<div class="confirm-item"><span>Delivery (${order.zoneName})</span><span>${deliveryText}</span></div>`;
  html += `<div class="confirm-total"><span>Total</span><span>${totalText}</span></div>`;
  html += `<div class="confirm-item" style="margin-top:8px;"><span>Payment</span><span>${paymentNote}</span></div>`;
  document.getElementById("confirmSummary").innerHTML = html;
}

document.getElementById("confirmDoneBtn").addEventListener("click", closeCheckout);

function resetCheckoutModal(){
  document.getElementById("detailsForm").reset();
  document.getElementById("stepDetails").style.display = "";
  document.getElementById("stepConfirmation").style.display = "none";
  ["custName","custPhone","custAddress"].forEach(id=>{
    document.getElementById(id).classList.remove("invalid");
  });
  ["errName","errPhone","errAddress","errZone"].forEach(id=>{
    document.getElementById(id).classList.remove("show");
  });
  document.getElementById("custZone").classList.remove("invalid");
  document.getElementById("zoneNote").classList.remove("show");
  const onlineRadio = document.querySelector('input[name="payMethod"][value="online"]');
  onlineRadio.disabled = false;
  onlineRadio.closest(".pay-option").classList.remove("pay-option-disabled");
  modalTotalEl.textContent = naira(cartSubtotal()) + " +delivery";
  const opayBox = document.getElementById("opayConfirmBox");
  if(opayBox) opayBox.remove();
}

/* ---------------- FOCUS TRAP / ESCAPE KEY ---------------- */
// Lightweight a11y helper: while an overlay is open, Escape closes it and
// Tab/Shift+Tab cycle between its focusable children so keyboard/AT users
// don't tab out into the page behind the modal/drawer.
let trapContainer = null;
let trapPrevFocus = null;

function focusableIn(root){
  return Array.from(root.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )).filter(el => el.offsetParent !== null || el === document.activeElement);
}

function trapFocus(container){
  if(!container) return;
  if(trapContainer){
    releaseFocus();
  }
  trapContainer = container;
  trapPrevFocus = document.activeElement;
  const handleKey = (e) => {
    if(e.key === "Escape"){
      // Find the closest overlay currently open and close it.
      if(cartDrawer.classList.contains("open")) closeCart();
      else if(checkoutOverlay.classList.contains("open")) closeCheckout();
      else releaseFocus();
      return;
    }
    if(e.key !== "Tab" || !trapContainer) return;
    const items = focusableIn(trapContainer);
    if(!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if(e.shiftKey && document.activeElement === first){
      e.preventDefault(); last.focus();
    } else if(!e.shiftKey && document.activeElement === last){
      e.preventDefault(); first.focus();
    }
  };
  container._trapHandler = handleKey;
  document.addEventListener("keydown", handleKey, true);
  // Move focus to the first focusable element so screen readers announce the panel.
  const items = focusableIn(container);
  if(items.length) items[0].focus({ preventScroll: true });
}

function releaseFocus(){
  if(trapContainer && trapContainer._trapHandler){
    document.removeEventListener("keydown", trapContainer._trapHandler, true);
    delete trapContainer._trapHandler;
  }
  trapContainer = null;
  if(trapPrevFocus && typeof trapPrevFocus.focus === "function"){
    trapPrevFocus.focus({ preventScroll: true });
  }
  trapPrevFocus = null;
}

/* ---------------- TOAST ---------------- */
let toastTimer;
function showToast(msg){
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>toast.classList.remove("show"), 2600);
}

/* ---------------- SECTION HASH SYNC ---------------- */
// Update the URL hash as the user scrolls past each section, so the
// back-button / sharing a link with a deep anchor works correctly.
(function initHashSync(){
  const sections = document.querySelectorAll("main section[id]");
  if(!sections.length || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        const id = entry.target.getAttribute("id");
        if(id && location.hash !== "#" + id){
          history.replaceState(null, "", "#" + id);
        }
      }
    });
  }, { rootMargin: "-30% 0px -60% 0px", threshold: 0 });

  sections.forEach(s => observer.observe(s));
})();

/* ---------------- INIT ---------------- */
renderMenu();
renderCart();
renderStatusBanner();
renderAboutSection();
renderZoneOptions();
setInterval(renderStatusBanner, 60000); // recheck every minute in case we cross open/close time

/* ---------------- ORDER LOG SANITY CHECK ---------------- */
// Lightweight startup check that the configured Google Form is reachable.
// We do a GET to the public "viewform" URL (not the POST endpoint) so it
// never creates a blank row. If it's down, the owner sees a console warning
// instead of orders silently disappearing into the void.
(function pingOrderLog(){
  if(!CONFIG.orderLog || !CONFIG.orderLog.formActionUrl) return;
  const viewUrl = CONFIG.orderLog.formActionUrl
    .replace("/formResponse", "/viewform")
    .replace("/formResponse?", "/viewform?");
  fetch(viewUrl, { method: "GET", mode: "no-cors" })
    .then(() => console.info("[GAB] Order log endpoint reachable:", viewUrl))
    .catch(err => console.warn("[GAB] Order log endpoint may be unreachable — orders will still send to the kitchen via WhatsApp, but they won't be saved to your Sheet until this is fixed.", err));
})();