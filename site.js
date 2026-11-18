(() => {
  'use strict';
  const one = selector => document.querySelector(selector);
  const all = selector => [...document.querySelectorAll(selector)];
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${({plus:'M12 5v14M5 12h14',minus:'M5 12h14',close:'m6 6 12 12M18 6 6 18',check:'m5 12 4 4L19 6'})[name]}"/></svg>`;
  const key = 'carta-e-dintorni-list-v1';
  let storageAvailable = true;
  let list = [];
  let toastTimer;
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    if(Array.isArray(data)) list = data.slice(0,100).filter(item=>item && typeof item.id==='string' && typeof item.title==='string').map(item=>({id:item.id.slice(0,200),title:item.title.slice(0,160),quantity:Math.min(99,Math.max(1,Number.parseInt(item.quantity,10)||1)),notes:typeof item.notes==='string'?item.notes.slice(0,350):''}));
  } catch { storageAvailable = false; }
  const notify = message => {
    const toast = one('[data-toast]');
    if(!toast) return;
    clearTimeout(toastTimer);
    toast.querySelector('span').textContent = message;
    toast.hidden = false;
    toastTimer = setTimeout(()=>{toast.hidden=true;},6500);
  };
  function feedback(text) {
    const target = one('[data-list-feedback]');
    if(target) target.textContent = text;
  }
  function persist() {
    try { localStorage.setItem(key,JSON.stringify(list)); storageAvailable = true; }
    catch { storageAvailable=false; feedback('Il browser non può salvare la lista. Copiala o scaricala prima di chiudere la pagina.'); }
    updateCounters();
  }
  function updateCounters() {
    all('[data-list-count]').forEach(node=>{node.textContent=String(list.length);node.setAttribute('aria-label',`${list.length} voci nella lista`);});
    all('[data-list-total]').forEach(node=>node.textContent=String(list.length));
    all('[data-list-download],[data-list-copy],[data-list-print],[data-list-clear]').forEach(button=>button.disabled=!list.length);
  }
  function addItem(item) {
    const existing = list.find(value=>value.id===item.id);
    if(existing) existing.quantity=Math.min(99,existing.quantity+(item.quantity||1));
    else if(list.length<100) list.push({id:item.id,title:item.title.slice(0,160),quantity:item.quantity||1,notes:item.notes||''});
    else {notify('La lista contiene già 100 voci. Rimuovine una per aggiungere altro.');return false;}
    persist();
    return true;
  }
  function renderList() {
    const target=one('[data-shopping-list]');
    updateCounters();
    if(!target) return;
    target.innerHTML=list.map(item=>`<article class="shopping-item" data-item-id="${escape(item.id)}"><div class="shopping-item-top"><h2>${escape(item.title)}</h2><button class="icon-button remove-item" type="button" data-remove aria-label="Rimuovi ${escape(item.title)}">${icon('close')}</button></div><div class="shopping-item-details"><label class="item-notes">Dettagli<input data-item-notes type="text" maxlength="350" value="${escape(item.notes)}" placeholder="Colore, formato, modello…" aria-label="Dettagli per ${escape(item.title)}"></label><div class="quantity"><button type="button" data-quantity-minus aria-label="Riduci quantità di ${escape(item.title)}" ${item.quantity===1?'disabled':''}>${icon('minus')}</button><input data-item-quantity type="number" min="1" max="99" value="${item.quantity}" aria-label="Quantità di ${escape(item.title)}"><button type="button" data-quantity-plus aria-label="Aumenta quantità di ${escape(item.title)}" ${item.quantity===99?'disabled':''}>${icon('plus')}</button></div></div></article>`).join('');
    one('[data-list-empty]').hidden=list.length>0;
    if(!storageAvailable) feedback('Salvataggio locale non disponibile. Scarica o copia la lista prima di chiudere la pagina.');
  }
  const menuButton=one('.menu-button');
  const navigation=one('#main-nav');
  function closeMenu(){menuButton?.setAttribute('aria-expanded','false');menuButton?.setAttribute('aria-label','Apri menu');navigation?.classList.remove('is-open');}
  menuButton?.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Chiudi menu':'Apri menu');navigation.classList.toggle('is-open',open);});
  navigation?.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
  document.addEventListener('click',event=>{if(!event.target.closest('.header-inner'))closeMenu();});
  matchMedia('(min-width: 1101px)').addEventListener('change',event=>{if(event.matches)closeMenu();});

  const catalogParams = new URLSearchParams(location.search);
  let filter = all('[data-filter]').some(button=>button.dataset.filter===catalogParams.get('categoria')) ? catalogParams.get('categoria') : 'all';
  const brandSelect = one('[data-brand-filter]');
  if(brandSelect && [...brandSelect.options].some(option=>option.value===catalogParams.get('marca'))) brandSelect.value=catalogParams.get('marca');
  if(one('[data-catalog-search]')) one('[data-catalog-search]').value=(catalogParams.get('q')||'').slice(0,160);
  const normalizeSearch = value => String(value).toLocaleLowerCase('it').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,' ');
  function filterCatalog(){
    const search=normalizeSearch(one('[data-catalog-search]')?.value.trim() || '');
    const words=search.split(/\s+/).filter(Boolean);
    const brand=brandSelect?.value || 'all';
    let visible=0;
    all('[data-catalog-card]').forEach(card=>{const show=(filter==='all'||card.dataset.category===filter)&&(brand==='all'||card.dataset.brand===brand)&&words.every(word=>normalizeSearch(card.dataset.search).includes(word));card.hidden=!show;if(show)visible++;});
    const counter=one('[data-catalog-count]');
    if(counter)counter.textContent=`${visible} ${visible===1?'articolo o tipologia':'articoli e tipologie'}`;
    const empty=one('[data-catalog-empty]');if(empty)empty.hidden=visible>0;
    all('[data-filter]').forEach(button=>{const active=button.dataset.filter===filter;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
    all('.catalog-results [data-clear-filters]').forEach(button=>button.hidden=filter==='all'&&brand==='all'&&!search);
    if(counter){
      const url=new URL(location.href);
      for(const [key,value] of [['categoria',filter==='all'?'':filter],['marca',brand==='all'?'':brand],['q',one('[data-catalog-search]')?.value.trim()||'']]){if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);}
      try{history.replaceState(null,'',url);}catch{/* I filtri funzionano anche senza accesso alla cronologia. */}
    }
  }
  all('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;all('[data-filter]').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});filterCatalog();}));
  one('[data-catalog-search]')?.addEventListener('input',filterCatalog);
  brandSelect?.addEventListener('change',filterCatalog);
  all('[data-clear-filters]').forEach(button=>button.addEventListener('click',()=>{filter='all';one('[data-catalog-search]').value='';if(brandSelect)brandSelect.value='all';filterCatalog();one('[data-catalog-search]').focus();}));
  all('[data-product-option]').forEach(select=>select.addEventListener('change',()=>{select.closest('article').querySelector('[data-add]').innerHTML=`Aggiungi alla lista ${icon('plus')}`;}));
  all('[data-add]').forEach(button=>button.addEventListener('click',()=>{const article=button.closest('article');const title=button.dataset.addTitle||article.querySelector('h3').textContent;const option=article.querySelector('[data-product-option]')?.value||'';const id=button.dataset.add+(option?`:${option}`:'');if(addItem({id,title,quantity:1,notes:option?`Preferenza: ${option}`:''})){button.innerHTML=`Aggiungi ancora ${icon('check')}`;notify(`${title}${option?' · '+option:''}: aggiunto alla tua lista.${storageAvailable?'':' Salvataggio non disponibile: scaricala prima di chiudere.'}`);}}));
  filterCatalog();
  const presets={scrivania:['Penne e matite','Blocchi per appunti','Note adesive','Fermagli e accessori'],archivio:['Raccoglitori','Cartelline','Separatori','Etichette'],riunione:['Blocchi per appunti','Penne','Evidenziatori','Cartelline portadocumenti']};
  all('[data-preset]').forEach(button=>button.addEventListener('click',()=>{const items=presets[button.dataset.preset];if(!items)return;let added=0;items.forEach(title=>{if(addItem({id:`preset-${title.toLowerCase().replaceAll(' ','-')}`,title,quantity:1,notes:''}))added++;});notify(`${added} voci aggiunte. Puoi modificarle nella tua lista.`);}));
  one('[data-school-form]')?.addEventListener('submit',event=>{event.preventDefault();const data=new FormData(event.currentTarget);const school=String(data.get('school')||'').trim();const classroom=String(data.get('classroom')||'').trim();const message=String(data.get('message')||'').trim();if(!school||!classroom)return;const title=`Libri: ${school} — ${classroom}`;const notes=message.slice(0,350);if(addItem({id:`school-${school}-${classroom}`.toLowerCase().slice(0,200),title,quantity:1,notes})){one('[data-school-status]').textContent='Promemoria aggiunto alla tua lista. Non è stato inviato al negozio.';notify('Promemoria scolastico aggiunto alla lista.');}});
  one('[data-custom-form]')?.addEventListener('submit',event=>{event.preventDefault();const data=new FormData(event.currentTarget);const title=String(data.get('item')||'').trim();const quantity=Number(data.get('quantity'));if(!title||!Number.isInteger(quantity)||quantity<1||quantity>99)return;const id=`custom-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;if(addItem({id,title,quantity,notes:String(data.get('notes')||'').trim().slice(0,350)})){event.currentTarget.reset();renderList();feedback('Voce aggiunta alla lista.');}});
  one('[data-shopping-list]')?.addEventListener('click',event=>{
    const row=event.target.closest('[data-item-id]');if(!row)return;
    const item=list.find(value=>value.id===row.dataset.itemId);if(!item)return;
    if(event.target.closest('[data-remove]')){list=list.filter(value=>value.id!==item.id);persist();renderList();feedback(`${item.title}: rimosso dalla lista.`);}
    if(event.target.closest('[data-quantity-plus]')||event.target.closest('[data-quantity-minus]')){const direction=event.target.closest('[data-quantity-plus]')?1:-1;item.quantity=Math.max(1,Math.min(99,item.quantity+direction));persist();const input=row.querySelector('[data-item-quantity]');input.value=item.quantity;row.querySelector('[data-quantity-minus]').disabled=item.quantity===1;row.querySelector('[data-quantity-plus]').disabled=item.quantity===99;}
  });
  one('[data-shopping-list]')?.addEventListener('change',event=>{const row=event.target.closest('[data-item-id]');if(!row)return;const item=list.find(value=>value.id===row.dataset.itemId);if(!item)return;if(event.target.matches('[data-item-notes]'))item.notes=event.target.value.slice(0,350);if(event.target.matches('[data-item-quantity]')){item.quantity=Math.max(1,Math.min(99,Number.parseInt(event.target.value,10)||1));event.target.value=item.quantity;row.querySelector('[data-quantity-minus]').disabled=item.quantity===1;row.querySelector('[data-quantity-plus]').disabled=item.quantity===99;}persist();});
  function listText(){return `CARTA E DINTORNI\nLa mia lista per la visita\n\n${list.map(item=>`- ${item.quantity} x ${item.title}${item.notes?'\n  '+item.notes:''}`).join('\n\n')}\n\nPromemoria personale: non e un ordine. Disponibilita e prezzi da verificare in negozio.\nVia Croce Malloni, Nocera Superiore.\n`;}
  one('[data-list-download]')?.addEventListener('click',()=>{if(!list.length)return;const file=new Blob([listText()],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(file);const link=document.createElement('a');link.href=url;link.download='la-mia-lista-carta-e-dintorni.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);feedback('Lista scaricata. Portala con te in negozio.');});
  one('[data-list-copy]')?.addEventListener('click',async()=>{if(!list.length)return;try{await navigator.clipboard.writeText(listText());feedback('Testo copiato. Puoi incollarlo nelle tue note.');}catch{feedback('Il browser non consente la copia. Usa «Scarica la lista» oppure «Stampa la lista».');}});
  one('[data-list-print]')?.addEventListener('click',()=>window.print());
  one('[data-list-clear]')?.addEventListener('click',()=>{one('[data-clear-confirm]').hidden=false;one('[data-clear-no]').focus();});
  one('[data-clear-no]')?.addEventListener('click',()=>{one('[data-clear-confirm]').hidden=true;one('[data-list-clear]').focus();});
  one('[data-clear-yes]')?.addEventListener('click',()=>{list=[];persist();renderList();one('[data-clear-confirm]').hidden=true;feedback('Lista svuotata.');});
  window.addEventListener('storage',event=>{if(event.key===key){try{const values=JSON.parse(event.newValue||'[]');if(Array.isArray(values))location.reload();}catch{/* Un valore non valido non modifica la lista corrente. */}}});

  let stamps=3;
  function renderStamps(){const target=one('[data-stamps]');if(!target)return;target.innerHTML=Array.from({length:8},(_,i)=>`<span class="stamp${i<stamps?' filled':''}">${i<stamps?icon('check'):i+1}</span>`).join('');target.setAttribute('aria-label',`Tessera dimostrativa: ${stamps} timbri su 8`);one('[data-stamp-count]').textContent=`${stamps} / 8`;one('[data-stamp-add]').disabled=stamps===8;one('[data-stamp-status]').textContent=stamps===8?'Tessera demo completata. Il premio reale è ancora da definire.':`${stamps} timbri su 8 nella tessera dimostrativa.`;}
  one('[data-stamp-add]')?.addEventListener('click',()=>{if(stamps<8){stamps++;renderStamps();}});
  one('[data-stamp-reset]')?.addEventListener('click',()=>{stamps=0;renderStamps();});
  const today=one('[data-today-hours]');
  if(today){const date=new Date();const day=new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Rome',weekday:'short'}).format(date);today.textContent=day==='Sun'?'Oggi è domenica: giorno di riposo.':`Orario ordinario di oggi: ${day==='Sat'?'08:00–13:00':'08:00–13:30'}. Eventuali variazioni festive da verificare.`;}
  renderList();renderStamps();
})();
