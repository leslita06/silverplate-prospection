(function(){
const D = window.DATA, $ = s => document.querySelector(s);
const TODAY = '2026-11-18';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MOIS = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
const fd = d => d ? `${+d.slice(8,10)} ${MOIS[+d.slice(5,7)-1]} ${d.slice(0,4)}` : 'Non publiée';
const host = u => { try { return new URL(u).hostname.replace('www.',''); } catch(e) { return 'source'; } };
const src = (u, l) => u ? `<a class="lien" href="${esc(u)}" target="_blank" rel="noopener">${esc(l || host(u))} ↗</a>` : '';
const jours = d => Math.round((new Date(d) - new Date(TODAY)) / 864e5);
$('#maj').textContent = D.maj;

/* Chiffres clés */
const ouverts = D.ao.filter(a => a.statut === 'Ouvert');
const avecMail = D.ev.filter(e => e.email);
const RANG = {Fort: 0, Moyen: 1, Faible: 2};
const dossiers = D.ev.filter(e => e.interet).sort((a, b) => RANG[a.interet] - RANG[b.interet] || ((a.debut || '9') < (b.debut || '9') ? -1 : 1));
$('#kpis').innerHTML = [
  [ouverts.length, "appels d'offres ouverts", true],
  [D.ao.length, 'avis événementiels relevés depuis août'],
  [D.ev.length, "grands événements à Abidjan jusqu'à fin 2027"],
  [avecMail.length, 'salons avec un e-mail public pour le stand'],
].map(([v, l, h]) => `<div class="kpi${h ? ' hot' : ''}"><div class="v">${v}</div><div class="l">${l}</div></div>`).join('');

/* Filtres génériques */
function chips(box, opts, cur, cb){
  box.innerHTML = opts.map(([k, l, n]) => `<button class="chip${k === cur ? ' on' : ''}" data-k="${esc(k)}">${esc(l)}${n != null ? `<span class="n">${n}</span>` : ''}</button>`).join('');
  box.onclick = e => { const b = e.target.closest('.chip'); if (!b) return; cb(b.dataset.k); };
}

/* 1. Appels d'offres */
let fAo = 'Ouvert';
function rAo(){
  const ci = D.ao.filter(a => a.pays === "Côte d'Ivoire").length;
  chips($('#f-ao'), [['Ouvert','Ouverts',ouverts.length],['CI',"Côte d'Ivoire",ci],['Tous','Tous',D.ao.length]], fAo, k => { fAo = k; rAo(); });
  const L = D.ao.filter(a => fAo === 'Tous' || (fAo === 'CI' ? a.pays === "Côte d'Ivoire" : a.statut === fAo));
  $('#ao-list').innerHTML = L.map(a => {
    const o = a.statut === 'Ouvert', j = a.date_limite ? jours(a.date_limite) : null;
    const st = o ? `<span class="tag t-or">Ouvert${j != null ? (j <= 0 ? ", clôture aujourd'hui" : j === 1 ? ', clôture demain' : `, ${j} jours`) : ''}</span>` : `<span class="tag t-ko">${esc(a.statut)}</span>`;
    return `<article class="card${o ? ' ouvert' : ''} reveal">
      <div class="row">${st}<span class="tag t-nav">${esc(a.pays)}</span></div>
      <h3>${esc(a.intitule)}</h3>
      <div class="meta"><span>Donneur d'ordre <b>${esc(a.donneur_ordre)}</b></span></div>
      <div class="meta"><span>Date limite <b class="dl">${fd(a.date_limite)}</b></span>${a.reference ? `<span>Réf. ${esc(a.reference)}</span>` : ''}</div>
      ${a.note ? `<p class="note">${esc(a.note)}</p>` : ''}
      <div class="row">${src(a.lien, "Lire l'avis officiel")}<span class="note">${esc(a.type)}</span></div>
    </article>`; }).join('') || '<p class="vide">Aucun appel dans ce filtre.</p>';
  obs();
}

/* 2. Calendrier */
let fCal = 'trim';
function rCal(){
  const conf = D.ev.filter(e => e.agence_ok).length;
  chips($('#f-cal'), [['trim','Par trimestre'],['sem','Par semestre'],['ag','Agence connue',conf]], fCal, k => { fCal = k; rCal(); });
  let L = D.ev; if (fCal === 'ag') L = L.filter(e => e.agence_ok);
  const key = fCal === 'sem' ? 'sem' : 'trim', G = {};
  L.forEach(e => (G[e[key]] = G[e[key]] || []).push(e));
  const ord = Object.keys(G).sort((a, b) => a === 'À dater' || a === 'Dates à confirmer' ? 1 : b === 'À dater' || b === 'Dates à confirmer' ? -1 : (a.slice(-4) + a) < (b.slice(-4) + b) ? -1 : 1);
  const lab = k => k.startsWith('T') ? `${k.slice(1,2)}${k[1]==='1'?'er':'e'} trimestre ${k.slice(-4)}` : k.startsWith('S') ? `${k[1]==='1'?'1er':'2e'} semestre ${k.slice(-4)}` : 'Dates 2027 pas encore publiées';
  $('#cal-list').innerHTML = ord.map(k => `<div class="periode"><div class="periode-h"><h3>${lab(k)}</h3><span>${G[k].length} événement${G[k].length > 1 ? 's' : ''}</span></div><div class="tl">${
    G[k].map(e => {
      const d = e.debut ? `<div class="date"><div class="j">${+e.debut.slice(8,10)}</div><div class="m">${MOIS[+e.debut.slice(5,7)-1]}</div></div>` : `<div class="date na"><div class="j">?</div><div class="m">2027</div></div>`;
      const ag = e.agence_ok ? `<span class="tag t-ok">Agence confirmée</span><b>${esc(e.agence)}</b> ${src(e.src_agence, 'source')}` : `<span class="tag t-ko">Agence non connue</span>`;
      return `<article class="ev reveal">${d}<div><h4>${esc(e.court)}</h4>
        <div class="meta"><span>${esc(e.dates)}</span>${e.lieu ? `<span>${esc(e.lieu)}</span>` : ''}</div>
        <div class="meta"><span>${esc(e.type)}</span><span>Organisateur <b>${esc(e.org)}</b></span></div>
        ${!e.debut && e.note ? `<p class="note">${esc(e.note)}</p>` : ''}
        <div class="agence">${ag}</div>
        <div class="agence">${src(e.src_dates, 'Source des dates')}${e.fiab !== 'officielles' ? `<span class="tag t-am">Dates ${esc(e.fiab)}</span>` : ''}</div></div></article>`; }).join('')}</div></div>`).join('');
  obs();
}

/* 3. Contacts */
const CO = D.ev.filter(e => e.contact || e.email || e.tel || e.src_contact).concat(D.parc.map(p => ({court: 'Parc des Expositions d\'Abidjan', nom: p.evenement, org: p.organisateur, dates: 'Location des halls et esplanades', contact: p.contact, email: p.email, tel: p.telephone, src_contact: p.contact_source_url, note_contact: p.note})));
function rCo(){
  const q = ($('#q').value || '').toLowerCase();
  const L = CO.filter(e => !q || (e.nom + ' ' + e.org + ' ' + (e.contact || '')).toLowerCase().includes(q));
  $('#co-list').innerHTML = L.map(e => {
    const m = e.email ? e.email.split(/;\s*/).map(x => x.replace(/\s*\(.*\)$/, '')).filter(x => x.includes('@')) : [];
    return `<article class="card reveal">
      <div class="row"><span class="tag ${m.length ? 't-ok' : 't-ko'}">${m.length ? 'E-mail publié' : 'Pas d\'e-mail public'}</span><span class="note">${esc(e.dates)}</span></div>
      <h3>${esc(e.court)}</h3>
      <div class="meta"><span>Organisateur <b>${esc(e.org)}</b></span></div>
      ${e.contact ? `<div class="meta"><span>Qui approcher <b>${esc(e.contact)}</b></span></div>` : ''}
      <div class="mails">${m.length ? m.map(x => `<a class="mail" href="mailto:${esc(x)}">${esc(x)}</a>`).join('') : '<span class="vide">Passer par le formulaire ou le téléphone de l\'organisateur.</span>'}</div>
      ${e.tel ? `<div class="meta"><span>Téléphone <b>${esc(e.tel)}</b></span></div>` : ''}
      ${e.note_contact ? `<p class="note">${esc(e.note_contact)}</p>` : ''}
      <div class="row">${src(e.src_contact, 'Page où figure le contact')}</div>
    </article>`; }).join('') || '<p class="vide">Aucun résultat.</p>';
  obs();
}
$('#q').addEventListener('input', rCo);

/* 4. Dossiers de stand */
const DEC = JSON.parse(localStorage.getItem('sp-decisions') || '{}');
let fDo = 'Tous';
function rDo(){
  const n = k => dossiers.filter(e => e.interet === k).length;
  chips($('#f-do'), [['Tous','Tous',dossiers.length],['Fort','Intérêt fort',n('Fort')],['Moyen','Moyen',n('Moyen')],['Faible','Faible',n('Faible')]], fDo, k => { fDo = k; rDo(); });
  const L = dossiers.filter(e => fDo === 'Tous' || e.interet === fDo);
  $('#do-list').innerHTML = L.map(e => {
    const id = e.nom, d = DEC[id] || '';
    const pub = [e.exposants && `Exposants : ${e.exposants}`, (e.visiteurs || e.public) && `Visiteurs : ${e.visiteurs || e.public}`].filter(Boolean).join('. ');
    const passe = e.fin && e.fin < TODAY;
    return `<article class="dos reveal">
      <div class="dos-h"><span class="tag niv n-${e.interet}">Intérêt ${e.interet.toLowerCase()}</span>
        <p class="eyebrow">${esc(e.dates)}</p><h3>${esc(e.court)}</h3>
        <div class="meta"><span>${esc(e.lieu || 'Lieu non publié')}</span><span>Organisateur <b>${esc(e.org)}</b></span></div></div>
      <div class="grille">
        <div><div class="k">Surface</div><div class="v">${esc(e.surface || 'Non publiée')}</div></div>
        <div><div class="k">Coût indicatif</div><div class="v">${esc(e.prix || 'Non publié : à demander')}</div></div>
        <div><div class="k">Public</div><div class="v">${esc(pub || 'Non publié')}</div></div>
        <div><div class="k">Contact</div><div class="v">${e.email ? esc(e.email.split(/;\s*/)[0]) : 'Formulaire ou téléphone'}</div></div>
      </div>
      <p class="pourquoi"><b>Pourquoi y aller.</b> ${esc(e.pourquoi)}${passe ? ' Édition passée.' : ''}</p>
      <div class="decide" data-id="${esc(id)}"><span>Décision</span>${['Y aller','À creuser','Pas pour nous'].map(x => `<button class="chip${d === x ? ' on' : ''}" data-d="${x}">${x}</button>`).join('')}</div>
      <div class="sources">${src(e.src_dates, 'Dates')}${src(e.src_prix, 'Prix')}${src(e.src_chiffres, 'Chiffres')}${src(e.src_contact, 'Contact')}</div>
    </article>`; }).join('');
  obs();
}
$('#do-list').addEventListener('click', ev => {
  const b = ev.target.closest('.decide .chip'); if (!b) return;
  const id = b.parentElement.dataset.id; DEC[id] = DEC[id] === b.dataset.d ? '' : b.dataset.d;
  localStorage.setItem('sp-decisions', JSON.stringify(DEC)); rDo();
});

/* Apparition douce et menu actif */
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('vu'); io.unobserve(x.target); } }), {rootMargin: '0px 0px -40px 0px'}) : null;
function obs(){ document.querySelectorAll('.reveal:not(.vu)').forEach(el => io ? io.observe(el) : el.classList.add('vu')); }
function montre(t, scroll){
  if (!document.getElementById(t)) t = 'ao';
  document.querySelectorAll('.onglet').forEach(s => s.classList.toggle('actif', s.id === t));
  document.querySelectorAll('.tab,#nav a').forEach(a => a.classList.toggle('on', a.dataset.t === t));
  obs(); if (scroll) document.getElementById('tabs').scrollIntoView({behavior: 'smooth'});
}
document.getElementById('tabs').onclick = e => { const b = e.target.closest('.tab'); if (b) { history.replaceState(null, '', '#' + b.dataset.t); montre(b.dataset.t, true); } };
document.querySelectorAll('#nav a').forEach(a => a.onclick = e => { e.preventDefault(); history.replaceState(null, '', '#' + a.dataset.t); montre(a.dataset.t, true); });
rAo(); rCal(); rCo(); rDo();
$('#n-ao').textContent = ouverts.length; $('#n-cal').textContent = D.ev.length; $('#n-co').textContent = CO.length; $('#n-do').textContent = dossiers.length;
montre((location.hash || '#ao').slice(1), false);
})();
