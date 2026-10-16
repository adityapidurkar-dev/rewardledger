(() => {
  "use strict";
  const STORAGE_KEY = "rewardledger.items.v1";
  const CURRENCY_KEY = "rewardledger.currency.v1";
  const currencies = {
    INR: { locale: "en-IN", symbol: "₹" }, USD: { locale: "en-US", symbol: "$" },
    EUR: { locale: "de-DE", symbol: "€" }, GBP: { locale: "en-GB", symbol: "£" },
    AED: { locale: "en-AE", symbol: "د.إ" }, CAD: { locale: "en-CA", symbol: "CA$" },
    AUD: { locale: "en-AU", symbol: "A$" }, SGD: { locale: "en-SG", symbol: "S$" },
    JPY: { locale: "ja-JP", symbol: "¥" }, CHF: { locale: "de-CH", symbol: "CHF" }
  };
  const $ = id => document.getElementById(id);
  const form = $("reward-form"), rows = $("reward-rows"), emptyState = $("empty-state");
  const currencySelect = $("currency"), toast = $("toast"), deleteDialog = $("delete-dialog");
  let items = loadItems(), editingId = null, pendingDeleteId = null, toastTimeout = null;
  let currency = loadCurrency();
  currencySelect.value = currency;
  render();

  function loadItems() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(stored)) return [];
      return stored.filter(x => x && typeof x.id === "string" && typeof x.name === "string" && Number.isFinite(Number(x.cost)) && Number.isFinite(Number(x.quantity)))
        .map(x => ({ id:x.id, name:x.name.slice(0,120), type:String(x.type||"Other"), cost:Math.max(0,Number(x.cost)), quantity:Math.max(1,Math.floor(Number(x.quantity))) }));
    } catch { return []; }
  }
  function loadCurrency() {
    try { const saved=localStorage.getItem(CURRENCY_KEY); return Object.hasOwn(currencies,saved)?saved:"INR"; }
    catch { return "INR"; }
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY,JSON.stringify(items)); localStorage.setItem(CURRENCY_KEY,currency); return true; }
    catch { showToast("Browser storage is unavailable. Export your list to keep a copy."); return false; }
  }
  function formatMoney(amount) {
    try { return new Intl.NumberFormat(currencies[currency].locale,{style:"currency",currency,minimumFractionDigits:currency==="JPY"?0:2,maximumFractionDigits:currency==="JPY"?0:2}).format(amount); }
    catch { return currencies[currency].symbol+Number(amount).toFixed(2); }
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function iconFor(type) { return ({Voucher:"V",Course:"C",License:"L",Subscription:"S",Merchandise:"M",Other:"O"})[type]||"O"; }
  function render() {
    rows.innerHTML=items.map(item=>`<tr>
      <td><div class="item-main"><div class="item-icon" aria-hidden="true">${iconFor(item.type)}</div><div><div class="item-name">${escapeHtml(item.name)}</div><span class="item-type">${escapeHtml(item.type)}</span></div></div></td>
      <td class="unit-cost">${formatMoney(item.cost)}</td><td class="qty-cell">${item.quantity.toLocaleString()}</td>
      <td class="line-total">${formatMoney(item.cost*item.quantity)}</td>
      <td><div class="row-actions"><button class="icon-button" type="button" data-action="edit" data-id="${escapeHtml(item.id)}" aria-label="Edit ${escapeHtml(item.name)}" title="Edit">✎</button><button class="icon-button delete" type="button" data-action="delete" data-id="${escapeHtml(item.id)}" aria-label="Delete ${escapeHtml(item.name)}" title="Delete">×</button></div></td>
    </tr>`).join("");
    const total=items.reduce((s,x)=>s+x.cost*x.quantity,0), quantity=items.reduce((s,x)=>s+x.quantity,0);
    $("grand-total").textContent=formatMoney(total); $("bottom-total").textContent=formatMoney(total);
    $("entry-count").textContent=items.length.toLocaleString(); $("total-quantity").textContent=quantity.toLocaleString();
    $("list-caption").textContent=items.length===0?"No items added yet":`${items.length} ${items.length===1?"entry":"entries"} · ${quantity.toLocaleString()} total units`;
    emptyState.classList.toggle("hidden",items.length>0);
    $("currency-symbol").textContent=currencies[currency].symbol;
  }
  function resetForm() {
    editingId=null; form.reset(); $("editing-id").value=""; $("quantity").value="1";
    $("form-heading").textContent="Add a reward"; $("save-item").textContent="Add to list →"; $("cancel-edit").classList.add("hidden");
  }
  function startEdit(id) {
    const item=items.find(x=>x.id===id); if(!item)return;
    editingId=id; $("editing-id").value=id; $("reward-name").value=item.name; $("reward-type").value=item.type;
    $("unit-cost").value=item.cost; $("quantity").value=item.quantity;
    $("form-heading").textContent="Edit reward"; $("save-item").textContent="Save changes →"; $("cancel-edit").classList.remove("hidden");
    form.scrollIntoView({behavior:"smooth",block:"center"}); $("reward-name").focus({preventScroll:true});
  }
  function showToast(message) {
    toast.textContent=message; toast.classList.add("show"); clearTimeout(toastTimeout);
    toastTimeout=setTimeout(()=>toast.classList.remove("show"),2600);
  }
  form.addEventListener("submit",event=>{
    event.preventDefault(); if(!form.reportValidity())return;
    const name=$("reward-name").value.trim(), type=$("reward-type").value, cost=Number($("unit-cost").value), quantity=Number($("quantity").value);
    if(!name){$("reward-name").setCustomValidity("Please enter a reward name.");$("reward-name").reportValidity();$("reward-name").setCustomValidity("");return;}
    if(!Number.isFinite(cost)||cost<0||!Number.isFinite(quantity)||quantity<1||!Number.isInteger(quantity)){showToast("Enter a valid cost and whole-number quantity.");return;}
    if(editingId){items=items.map(x=>x.id===editingId?{...x,name,type,cost,quantity}:x);showToast("Reward updated.");}
    else {items.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2),name,type,cost,quantity});showToast("Reward added to your list.");}
    persist();render();resetForm();
  });
  rows.addEventListener("click",event=>{
    const button=event.target.closest("button[data-action]");if(!button)return;
    const {action,id}=button.dataset;
    if(action==="edit")startEdit(id);
    if(action==="delete"){pendingDeleteId=id;if(deleteDialog.showModal)deleteDialog.showModal();else if(confirm("Delete this reward?"))deleteItem(id);}
  });
  function deleteItem(id){items=items.filter(x=>x.id!==id);if(editingId===id)resetForm();persist();render();showToast("Reward removed.");}
  $("confirm-delete").addEventListener("click",event=>{event.preventDefault();if(pendingDeleteId)deleteItem(pendingDeleteId);pendingDeleteId=null;deleteDialog.close();});
  deleteDialog.addEventListener("close",()=>pendingDeleteId=null);
  $("cancel-edit").addEventListener("click",resetForm);
  function focusForm(){ $("reward-name").focus();form.scrollIntoView({behavior:"smooth",block:"center"}); }
  $("add-item-top").addEventListener("click",focusForm); $("empty-add").addEventListener("click",focusForm);
  currencySelect.addEventListener("change",()=>{currency=Object.hasOwn(currencies,currencySelect.value)?currencySelect.value:"INR";persist();render();showToast(`Display currency set to ${currency}. Prices were not converted.`);});
  $("export-csv").addEventListener("click",()=>{
    if(!items.length){showToast("Add at least one reward before exporting.");return;}
    const data=[["Reward name","Category","Unit cost","Quantity","Line total","Display currency"],...items.map(x=>[x.name,x.type,x.cost.toFixed(2),x.quantity,(x.cost*x.quantity).toFixed(2),currency])];
    const csv=data.map(row=>row.map(csvCell).join(",")).join("\r\n");
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),link=document.createElement("a");
    link.href=url;link.download="rewardledger-items.csv";document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);showToast("CSV export downloaded.");
  });
  function csvCell(value){const s=String(value).replace(/"/g,'""');return /[",\r\n]/.test(s)?`"${s}"`:s;}
})();