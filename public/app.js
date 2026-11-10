const $ = (s) => document.querySelector(s);
const state = { products: [], videos: [], seasons: [], upcoming: [] };
const esc = (v="") => String(v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const imgFallback = "https://images.unsplash.com/photo-1513883049090-d0b7439799bf?w=700&q=80";
function productCard(p) {
  const serial = p.serial_no ? `#${String(p.serial_no).padStart(3,"0")}` : "FEATURED";
  const link = p.purchase_url ? `<a href="${esc(p.purchase_url)}" target="_blank" rel="noopener sponsored">${p.type === "digital" ? "Get this →" : "View find →"}</a>` : `<span>Details soon</span>`;
  return `<article class="product-card"><div class="product-image"><img loading="lazy" src="${esc(p.image_url || imgFallback)}" alt="${esc(p.name)}" onerror="this.src='${imgFallback}'"><span class="serial">${serial}</span></div><div class="product-info"><div class="product-kicker">${esc(p.category || (p.type==="digital"?"Digital product":"Product find"))}</div><h3>${esc(p.name)}</h3><p>${esc(p.description || p.season || "A discovery from GenieFetch.")}</p><div class="product-meta"><span>${esc(p.price_text || (p.type==="digital"?"Digital download":"Explore product"))}</span>${link}</div></div></article>`;
}
function fillSelect(select, values, first) {
  const current = select.value;
  select.innerHTML = `<option value="">${first}</option>` + [...new Set(values.filter(Boolean))].sort().map(v=>`<option>${esc(v)}</option>`).join("");
  select.value = current;
}
function renderProducts() {
  const term = ($("#searchInput").value || "").toLowerCase().trim(), cat=$("#categoryFilter").value, season=$("#seasonFilter").value;
  const found = state.products.filter(p => p.type !== "digital" && (!cat || p.category===cat) && (!season || p.season===season) && (!term || [p.name,p.description,p.category,p.season,p.serial_no,p.video_number].join(" ").toLowerCase().includes(term)));
  $("#productCount").textContent = `${found.length} ${found.length===1?"product":"products"} found`;
  if (!found.length) { $("#productGrid").innerHTML = `<div class="empty-state">No matching finds yet. Try another search or filter.</div>`; return; }
  const groups = new Map();
  found.forEach(p => { const key = p.video_number ? String(p.video_number) : "unassigned"; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(p); });
  $("#productGrid").innerHTML = [...groups.entries()].map(([video, items]) => {
    const first = items[0], title = first.video_title || state.videos.find(v => String(v.video_number) === video)?.title || "";
    const videoRecord = state.videos.find(v => String(v.video_number) === video);
    const heading = video === "unassigned" ? "Other product finds" : `Video #${String(video).padStart(3,"0")}${title ? " — " + esc(title) : ""}`;
    const link = videoRecord?.video_url ? `<a class="video-watch" href="${esc(videoRecord.video_url)}" target="_blank" rel="noopener">Watch video ↗</a>` : "";
    return `<div class="video-group-heading"><div><span>VIDEO COLLECTION</span><h3>${heading}</h3><small>${items.length} ${items.length===1?"product":"products"} featured</small></div>${link}</div><div class="video-product-grid">${items.map(productCard).join("")}</div>`;
  }).join("");
}
function renderDigital() {
  const found=state.products.filter(p=>p.type==="digital");
  $("#digitalGrid").innerHTML=found.length?found.map(productCard).join(""):`<div class="empty-state">Our first digital creations are on the way. Check back soon.</div>`;
}
function renderSeasons() {
  $("#seasonGrid").innerHTML=state.seasons.length?state.seasons.map(s=>`<article class="season-card"><span class="season-status">${esc(s.status==="upcoming"?"COMING SOON":s.status==="archived"?"PAST COLLECTION":"SEASONAL COLLECTION")}</span><h3>${esc(s.name)}</h3><p>${esc(s.description||"Explore products and videos selected for this occasion.")}</p><a href="#videos" data-season="${esc(s.name)}">Explore collection →</a></article>`).join(""):`<div class="empty-state">Seasonal collections will appear here soon.</div>`;
  $("#seasonGrid").querySelectorAll("[data-season]").forEach(a=>a.addEventListener("click",()=>{ $("#seasonFilter").value=a.dataset.season;renderProducts(); }));
}
function renderUpcoming() {
  $("#upcomingGrid").innerHTML=state.upcoming.length?state.upcoming.map(u=>`<article class="upcoming-card"><span class="status">${esc((u.status||"coming_soon").replace("_"," "))} · ${esc(u.type||"collection")}</span><h3>${esc(u.title)}</h3><p>${esc(u.description||"Something special is in the works.")}</p><small>${u.season?esc(u.season)+" · ":""}${u.expected_date?esc(u.expected_date):"Coming soon"}</small></article>`).join(""):`<div class="empty-state">New videos, categories and collections will be announced here.</div>`;
}
async function load() {
  try {
    const r=await fetch("/api/public"); if(!r.ok) throw new Error("API not ready");
    const d=await r.json(); Object.assign(state,d);
  } catch(e) {
    // A first-visit empty site is normal before the database is configured.
    Object.assign(state,{products:[],videos:[],seasons:[],upcoming:[]});
  }
  fillSelect($("#categoryFilter"),state.products.filter(p=>p.type!=="digital").map(p=>p.category),"All categories");
  fillSelect($("#seasonFilter"),state.seasons.map(s=>s.name).concat(state.products.map(p=>p.season)),"All seasons");
  renderProducts();renderDigital();renderSeasons();renderUpcoming();
}
$("#searchInput").addEventListener("input",renderProducts);$("#categoryFilter").addEventListener("change",renderProducts);$("#seasonFilter").addEventListener("change",renderProducts);
$("#menuToggle").addEventListener("click",()=>$("#mainNav").classList.toggle("open"));
$("#mainNav").querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>$("#mainNav").classList.remove("open")));
$("#year").textContent=new Date().getFullYear();load();
