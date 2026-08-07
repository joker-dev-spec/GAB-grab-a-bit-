/* ============================================================
   GRAB A BITE — Ordering logic
   ============================================================
   ⚠️ SETUP — edit the CONFIG block below before you launch:

   1. ownerPhoneWhatsApp — your WhatsApp number in international
      format, digits only, NO plus sign and NO leading zero.
      e.g. Nigerian number 0803 123 4567 -> "2348031234567"

   2. ownerEmail — the email address orders should land in.

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
  openingHours: {
    0: { open:"10:00", close:"22:00" }, // Sunday
    1: { open:"09:00", close:"22:00" }, // Monday
    2: { open:"09:00", close:"22:00" }, // Tuesday
    3: { open:"09:00", close:"22:00" }, // Wednesday
    4: { open:"09:00", close:"22:00" }, // Thursday
    5: { open:"09:00", close:"23:00" }, // Friday
    6: { open:"09:00", close:"23:00" }  // Saturday
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
let cart = JSON.parse(localStorage.getItem("gab_cart") || "{}");
// Safety: drop any cart items saved before photos were added (missing "img")
Object.keys(cart).forEach(id => { if(!cart[id].img) delete cart[id]; });
let activeCat = "mains";

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
}

/* ---------------- ABOUT / CONTACT ---------------- */
const DAY_ORDER = [1,2,3,4,5,6,0]; // Monday first
const DAY_NAMES = { 0:"Sunday",1:"Monday",2:"Tuesday",3:"Wednesday",4:"Thursday",5:"Friday",6:"Saturday" };

function renderAboutSection(){
  document.getElementById("aboutAddress").textContent = CONFIG.restaurantAddress;

  const phoneDisplay = "+" + CONFIG.ownerPhoneWhatsApp;
  document.getElementById("aboutPhone").innerHTML =
    `<a href="https://wa.me/${CONFIG.ownerPhoneWhatsApp}" target="_blank" rel="noopener">${phoneDisplay}</a>`;

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
}

/* ---------------- FORM VALIDATION ---------------- */
function validateName(value){
  if(value.length < 2) return "Enter your full name.";
  return "";
}
function validatePhone(value){
  const digits = value.replace(/[\s-]/g,"");
  const okLocal = /^0[789][01]\d{8}$/.test(digits);
  const okIntl = /^\+?234[789][01]\d{8}$/.test(digits);
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
  return nameOk && phoneOk && addressOk && zoneOk;
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
  if(!cart[id]) cart[id] = { name:dish.name, price:dish.price, img:dish.img, qty:0 };
  cart[id].qty++;
  saveCart();
  renderCart();
  showToast(`${dish.name} added to your ticket`);
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
  cartCountEl.textContent = cartCount();

  cartItemsEl.querySelectorAll(".cart-item").forEach(el=>el.remove());
  cartEmptyEl.style.display = ids.length ? "none" : "block";

  ids.forEach(id=>{
    const item = cart[id];
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <img class="cart-item-img" src="${item.img}" alt="${item.name}">
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

function openCart(){ cartDrawer.classList.add("open"); cartOverlay.classList.add("open"); }
function closeCart(){ cartDrawer.classList.remove("open"); cartOverlay.classList.remove("open"); }

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
});
document.getElementById("checkoutClose").addEventListener("click", ()=>{
  checkoutOverlay.classList.remove("open");
});

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
  const sendMethod = document.querySelector('input[name="sendMethod"]:checked').value;

  // Zones with no fixed fee (fee: null) can't be charged online yet —
  // force pay-on-delivery so the amount can be confirmed by phone first.
  if(zone.fee === null) payMethod = "delivery";

  const order = { name, phone, address, notes, payMethod, sendMethod, zoneName: zone.name, deliveryFee: zone.fee };

  if(payMethod === "online"){
    payWithOpay(order);
  } else {
    finalizeOrder(order, "Pay on delivery");
  }
});

/* ---------------- DELIVERY ZONES ---------------- */
function renderZoneOptions(){
  const select = document.getElementById("custZone");
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
      <img src="${CONFIG.opayQrImage}" alt="OPay QR code for ${CONFIG.opayAccountName}" class="opay-qr-img">
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

  let lines = `NEW ORDER — ${CONFIG.restaurantName}\n\n`;
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

  if(order.sendMethod === "whatsapp"){
    const url = `https://wa.me/${CONFIG.ownerPhoneWhatsApp}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  } else {
    const subject = encodeURIComponent(`New order from ${order.name} — ${CONFIG.restaurantName}`);
    const body = encodeURIComponent(message);
    window.location.href = `mailto:${CONFIG.ownerEmail}?subject=${subject}&body=${body}`;
  }

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
    order.sendMethod === "whatsapp"
      ? "Your ticket just opened in WhatsApp — hit send there to reach our kitchen."
      : "Your ticket just opened in your email app — hit send there to reach our kitchen.";

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

document.getElementById("confirmDoneBtn").addEventListener("click", ()=>{
  checkoutOverlay.classList.remove("open");
  resetCheckoutModal();
});
document.getElementById("checkoutClose").addEventListener("click", resetCheckoutModal);

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

/* ---------------- TOAST ---------------- */
let toastTimer;
function showToast(msg){
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>toast.classList.remove("show"), 2600);
}

/* ---------------- INIT ---------------- */
renderMenu();
renderCart();
renderStatusBanner();
renderAboutSection();
renderZoneOptions();
setInterval(renderStatusBanner, 60000); // recheck every minute in case we cross open/close time