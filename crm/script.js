// ═══════════════════════════════════════════
// DATA LAYER
// ═══════════════════════════════════════════
const DB_KEY = 'taxshift_crm_v3';

function loadDB(){ try{ return JSON.parse(localStorage.getItem(DB_KEY)||'{"clientes":{}}'); }catch(e){ return {clientes:{}}; } }
function saveDB(db){
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch(e) {
    if(e.name === 'QuotaExceededError' || e.code === 22) {
      alert('Armazenamento local cheio. Exporte ou exclua dados para liberar espaço.');
    }
  }
}

function getClientes(){ return loadDB().clientes || {}; }
function getCliente(id){ return getClientes()[id] || null; }
function saveCliente(cli){
  const db = loadDB();
  if(!db.clientes) db.clientes = {};
  db.clientes[cli.id] = cli;
  saveDB(db);
}
function deleteCliente(id){
  const db = loadDB();
  delete db.clientes[id];
  saveDB(db);
}

// ═══════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════
let currentFase = '2033';
let currentClienteId = null;
let lastSimE = null, lastSimPF = null;
let editingClienteId = null;
let currentClFilter = 'all';

// ═══════════════════════════════════════════
// NAV
// ═══════════════════════════════════════════
const PT = {clientes:'Painel de Clientes',metricas:'Métricas da Carteira',avancado:'Cálculos Avançados — Split Payment & Créditos',empresa:'Simulador Empresa / PJ',pf:'Simulador Pessoa Física',comparativo:'Comparativo de Regimes',alertas:'Alertas Legislativos',importar:'Importar Clientes via Excel',exportar:'Exportar PDF',calendario:'Calendário de Transição',glossario:'Glossário Tributário',relatorio:'Relatório Cliente'};

function nav(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.ni').forEach(n=>n.classList.remove('active'));
  const pg = document.getElementById('pg-'+id);
  if(pg){ pg.classList.add('active'); }
  const nis = document.querySelectorAll('.ni');
  const map={clientes:0,metricas:1,empresa:2,pf:3,comparativo:4,alertas:5,avancado:6,importar:7,exportar:8,calendario:9,glossario:10,relatorio:11};
  nis[map[id]]?.classList.add('active');
  document.getElementById('page-title').textContent = PT[id]||id;
  document.getElementById('page-sub').textContent = '';

  if(id==='clientes'){ renderClientes(); updateDashKPIs(); }
  if(id==='relatorio'){ populateRelatorioSel(); }
  if(id==='empresa'||id==='pf'){ populateSimSel(); }
  if(id==='glossario'){ renderGlosario(); }
  if(id==='alertas'){ renderAlertas(); marcarAlertasLidos(); }
  if(id==='metricas'){ renderMetricas(); }
  if(id==='avancado'){ populateAvancadoSel(); }
  if(id==='exportar'){ populateExportSel(); }

  const tba = document.getElementById('topbar-actions');
  if(id==='clientes') tba.innerHTML=`<button class="btn btn-g" onclick="openNewClientModal()">+ Novo Cliente</button>`;
  else if(id==='empresa') tba.innerHTML=`<button class="btn" onclick="nav('clientes')">← Clientes</button>`;
  else if(id==='pf') tba.innerHTML=`<button class="btn" onclick="nav('clientes')">← Clientes</button>`;
  else tba.innerHTML=`<button class="btn btn-g" onclick="nav('relatorio')">📄 Relatório</button>`;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════
function tog(el){ el.querySelector('.tog').classList.toggle('on'); }
function tgl(el){ tog(el); }
function isOn(el){ return el.querySelector('.tog').classList.contains('on'); }
function R(n){ return 'R$ '+Math.abs(n).toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:0}); }
function pct(n){ return (n>=0?'+':'')+n.toFixed(1)+'%'; }
function G(id){ return parseFloat(document.getElementById(id).value)||0; }
function uid(){ return 'c_'+Date.now()+'_'+Math.random().toString(36).slice(2,7); }
function fmtDate(ts){ return new Date(ts).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}); }

function showToast(msg){
  let t = document.getElementById('_toast');
  if(!t){
    t = document.createElement('div');
    t.id = '_toast';
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;background:var(--s2);border:1px solid var(--ln);color:var(--tx);padding:10px 18px;border-radius:8px;font-size:12px;font-family:"IBM Plex Sans",sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.4);transition:opacity .3s;pointer-events:none;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>{ t.style.opacity='0'; }, 2500);
}

const SETOR_LABELS = {servicos:'Serviços',comercio:'Comércio',industria:'Indústria',saude:'Saúde',educacao:'Educação',alimentos:'Cesta Básica',ti:'TI/Tech',construcao:'Construção',financeiro:'Financeiro',pf:'Pessoa Física'};
const REGIME_LABELS = {simples:'Simples Nacional',presumido:'Lucro Presumido',real:'Lucro Real',mei:'MEI',pf:'Pessoa Física'};
const SETOR_COLORS = {servicos:'var(--sky)',comercio:'var(--amber)',industria:'var(--violet)',saude:'var(--mint)',educacao:'#34d399',alimentos:'#6ee7b7',ti:'var(--pink)',construcao:'var(--amber)',financeiro:'var(--gold)',pf:'var(--sky)'};
const SETOR_EMOJI = {servicos:'💼',comercio:'🏪',industria:'🏭',saude:'🏥',educacao:'📚',alimentos:'🥗',ti:'💻',construcao:'🏗️',financeiro:'🏦',pf:'👤'};

const faseDes = {
  '2026':'<strong style="color:var(--gold)">2026 — Período-teste:</strong> CBS 0,9%+IBS 0,1%. ICMS/ISS e PIS/COFINS vigentes com crédito. Impacto ~4%.',
  '2027':'<strong style="color:var(--gold)">2027 — CBS Plena:</strong> PIS/COFINS extintos. CBS total. IBS 0,1%. ~35% da transição.',
  '2029':'<strong style="color:var(--gold)">2029 — Transição:</strong> ICMS/ISS reduzidos a 90%, IBS crescendo. Split Payment. ~60%.',
  '2033':'<strong style="color:var(--gold)">2033 — Sistema Pleno:</strong> ICMS,ISS,PIS,COFINS extintos. IBS+CBS plenos.',
};
const fatorFase={'2026':0.04,'2027':0.35,'2029':0.6,'2033':1.0};

function selFase(el,f){
  document.querySelectorAll('.ph-opt').forEach(e=>e.classList.remove('sel'));
  el.classList.add('sel'); currentFase=f;
  document.getElementById('fase-desc').innerHTML=faseDes[f];
}

const setorMap={servicos:{aliq:13,red:'1.0'},comercio:{aliq:18,red:'1.0'},industria:{aliq:22,red:'1.0'},saude:{aliq:12,red:'0.6'},educacao:{aliq:8,red:'0.6'},alimentos:{aliq:5,red:'0.0'},ti:{aliq:10,red:'1.0'},construcao:{aliq:15,red:'1.0'},financeiro:{aliq:18,red:'1.0'}};
function presetSetor(){ const s=setorMap[document.getElementById('e-setor').value]; document.getElementById('e-aliq').value=s.aliq; document.getElementById('e-aliqv').textContent=s.aliq.toFixed(1)+'%'; document.getElementById('e-red').value=s.red; }
function presetRegime(){ const m={simples:10,presumido:15,real:20,mei:5}; const v=m[document.getElementById('e-regime').value]; document.getElementById('e-aliq').value=v; document.getElementById('e-aliqv').textContent=v.toFixed(1)+'%'; }
function presetPF(){ const ps={baixa:{renda:2000,ali:600,srv:80,ben:150,sau:0,edu:0,trn:200},media:{renda:5000,ali:800,srv:300,ben:400,sau:500,edu:600,trn:400},alta:{renda:20000,ali:2000,srv:800,ben:2000,sau:2000,edu:2000,trn:1000}}; const p=ps[document.getElementById('pf-perfil').value]; ['renda','ali','srv','ben','sau','edu','trn'].forEach(k=>{document.getElementById('pf-'+k).value=p[k];}); }

// ═══════════════════════════════════════════
// CRM — CLIENTES
// ═══════════════════════════════════════════
function updateDashKPIs(){
  const cls = Object.values(getClientes());
  const total = cls.length;
  const urgentes = cls.filter(c=>{
    const pend = CL_ITEMS.filter(i=>{const s=getCLStatus(c.id,i.id);return(s==='pendente'||s==='em_andamento')&&i.pri==='urgente';});
    return pend.length>0;
  }).length;
  const completos = cls.filter(c=>{
    const done = CL_ITEMS.filter(i=>getCLStatus(c.id,i.id)==='feito').length;
    return done===CL_ITEMS.length;
  }).length;
  const comSim = cls.filter(c=>(c.simulations||[]).length>0).length;
  document.getElementById('dash-kpis').innerHTML=[
    {l:'Total de Clientes',v:total,s:'cadastrados',c:'inf'},
    {l:'Com Ações Urgentes',v:urgentes,s:'precisam de atenção',c:urgentes>0?'neg':'pos'},
    {l:'Checklist Completo',v:completos,s:'clientes OK',c:'pos'},
    {l:'Com Simulação',v:comSim,s:'simulações registradas',c:'vio'},
  ].map(k=>`<div class="kpi ${k.c}"><div class="kl">${k.l}</div><div class="kv ${k.c}">${k.v}</div><div class="ks">${k.s}</div></div>`).join('');

  const bc = document.getElementById('bc-clientes');
  bc.textContent = total; bc.classList.toggle('hidden', total===0);
}

function renderClientes(){
  const cls = Object.values(getClientes());
  const q = (document.getElementById('search-input')?.value||'').toLowerCase().trim();
  const fs = document.getElementById('filter-setor')?.value||'';
  const fr = document.getElementById('filter-regime')?.value||'';
  const fst = document.getElementById('filter-status')?.value||'';
  const fsort = document.getElementById('filter-sort')?.value||'recente';

  const filtered = cls.filter(c=>{
    if(q){
      const hay = [(c.nome||''),(c.cnpj||''),(c.responsavel||''),(c.email||''),(SETOR_LABELS[c.setor]||''),(c.obs||'')].join(' ').toLowerCase();
      if(!hay.includes(q)) return false;
    }
    if(fs && c.setor !== fs) return false;
    if(fr && c.regime !== fr) return false;
    if(fst==='urgente'){
      const urg=CL_ITEMS.filter(i=>i.pri==='urgente'&&getCLStatus(c.id,i.id)!=='feito').length;
      if(urg===0) return false;
    }
    if(fst==='completo'){
      const done=CL_ITEMS.filter(i=>getCLStatus(c.id,i.id)==='feito').length;
      if(done<CL_ITEMS.length) return false;
    }
    if(fst==='sem_sim' && (c.simulations||[]).length>0) return false;
    return true;
  }).sort((a,b)=>{
    if(fsort==='az') return (a.nome||'').localeCompare(b.nome||'');
    if(fsort==='fat') return (b.faturamento||0)-(a.faturamento||0);
    if(fsort==='urgente'){
      const ua=CL_ITEMS.filter(i=>i.pri==='urgente'&&getCLStatus(a.id,i.id)!=='feito').length;
      const ub=CL_ITEMS.filter(i=>i.pri==='urgente'&&getCLStatus(b.id,i.id)!=='feito').length;
      return ub-ua;
    }
    if(fsort==='progresso'){
      const pa=CL_ITEMS.filter(i=>getCLStatus(a.id,i.id)==='feito').length;
      const pb=CL_ITEMS.filter(i=>getCLStatus(b.id,i.id)==='feito').length;
      return pa-pb;
    }
    return (b.updatedAt||0)-(a.updatedAt||0);
  });

  const info = document.getElementById('search-result-info');
  if(info){
    const total = cls.length;
    if(filtered.length===total && !q && !fs && !fr && !fst)
      info.textContent = total+' cliente'+(total!==1?'s':'')+' cadastrado'+(total!==1?'s':'');
    else
      info.textContent = 'Exibindo '+filtered.length+' de '+total+' clientes'+(q?' para "'+q+'"':'');
  }

  const grid = document.getElementById('clientes-grid');

  if(filtered.length===0){
    grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1">
      <div class="icon">${cls.length===0?'🏢':'🔍'}</div>
      <h3>${cls.length===0?'Nenhum cliente ainda':'Nenhum resultado'}</h3>
      <p>${cls.length===0?'Cadastre seu primeiro cliente para começar a gerenciar o impacto da reforma tributária.':'Tente ajustar os filtros de busca.'}</p>
      ${cls.length===0?`<button class="btn btn-g" onclick="openNewClientModal()">+ Cadastrar Primeiro Cliente</button>`:''}
    </div>`;
    return;
  }

  grid.innerHTML = filtered.map(c=>{
    const done = CL_ITEMS.filter(i=>getCLStatus(c.id,i.id)==='feito').length;
    const total = CL_ITEMS.length;
    const pct = Math.round(done/total*100);
    const urg = CL_ITEMS.filter(i=>{const s=getCLStatus(c.id,i.id);return(s==='pendente')&&i.pri==='urgente';}).length;
    const sims = (c.simulations||[]).length;
    const color = SETOR_COLORS[c.setor]||'var(--gold)';
    const initials = (c.nome||'?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();

    return `<div class="client-card" onclick="openClienteDetail('${c.id}')">
      <div style="position:absolute;top:0;left:0;right:0;height:2px;background:${color}"></div>
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px">
        <div class="cc-avatar" style="background:${color}18;color:${color};border:1px solid ${color}33">${initials}</div>
        <div style="display:flex;gap:5px">
          ${urg>0?`<span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:4px;background:rgba(248,113,113,.12);color:var(--rose)">⚠️ ${urg} urgente${urg>1?'s':''}</span>`:''}
        </div>
      </div>
      <div class="cc-name">${c.nome}</div>
      <div class="cc-meta">${c.cnpj?c.cnpj+' · ':''}${REGIME_LABELS[c.regime]||c.regime}</div>
      <div class="cc-tags">
        <span class="cc-tag" style="background:${color}18;color:${color}">${SETOR_EMOJI[c.setor]||''} ${SETOR_LABELS[c.setor]||c.setor}</span>
        ${c.responsavel?`<span class="cc-tag" style="background:rgba(139,148,184,.1);color:var(--tx2)">👤 ${c.responsavel}</span>`:''}
      </div>
      <div class="cc-stats">
        <div class="cc-stat"><div class="sv" style="color:${color}">${R(c.faturamento||0)}</div><div class="sl">faturamento</div></div>
        <div class="cc-stat"><div class="sv" style="color:var(--violet)">${sims}</div><div class="sl">simulações</div></div>
        <div class="cc-stat"><div class="sv" style="color:${pct===100?'var(--mint)':'var(--amber)'}">${pct}%</div><div class="sl">checklist</div></div>
      </div>
      <div class="cc-progress">
        <div class="cc-plbl"><span>Compliance</span><span>${done}/${total}</span></div>
        <div class="cc-pb"><div class="cc-pf" style="width:${pct}%;background:${pct===100?'var(--mint)':'linear-gradient(90deg,var(--gold),var(--gold2))'}"></div></div>
      </div>
      <div class="cc-actions" onclick="event.stopPropagation()">
        <button class="btn btn-sky" style="font-size:10px;padding:5px 10px" onclick="openClienteDetail('${c.id}')">Ver Detalhes</button>
        <button class="btn" style="font-size:10px;padding:5px 10px" onclick="editarCliente('${c.id}')">Editar</button>
        <button class="btn btn-r" style="font-size:10px;padding:5px 10px" onclick="confirmarExcluir('${c.id}')">✕</button>
      </div>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════
// MODAL CLIENTE
// ═══════════════════════════════════════════
function openNewClientModal(){
  editingClienteId = null;
  document.getElementById('modal-title').textContent = 'Novo Cliente';
  document.getElementById('modal-save-btn').textContent = 'Salvar Cliente';
  ['m-nome','m-cnpj','m-resp','m-email','m-obs'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('m-fat').value='1200000';
  document.getElementById('m-regime').value='simples';
  document.getElementById('m-setor').value='servicos';
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function editarCliente(id){
  const c = getCliente(id);
  if(!c) return;
  editingClienteId = id;
  document.getElementById('modal-title').textContent = 'Editar Cliente';
  document.getElementById('modal-save-btn').textContent = 'Atualizar Cliente';
  document.getElementById('m-nome').value = c.nome||'';
  document.getElementById('m-cnpj').value = c.cnpj||'';
  document.getElementById('m-regime').value = c.regime||'simples';
  document.getElementById('m-setor').value = c.setor||'servicos';
  document.getElementById('m-fat').value = c.faturamento||1200000;
  document.getElementById('m-resp').value = c.responsavel||'';
  document.getElementById('m-email').value = c.email||'';
  document.getElementById('m-obs').value = c.obs||'';
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal(e){
  if(e && e.target !== document.getElementById('modal-overlay')) return;
  document.getElementById('modal-overlay').classList.add('hidden');
}

function salvarCliente(){
  const nome = document.getElementById('m-nome').value.trim();
  if(!nome){ alert('Nome é obrigatório.'); return; }

  const cnpjRaw = document.getElementById('m-cnpj').value.replace(/\D/g,'');
  if(cnpjRaw.length > 0 && cnpjRaw.length !== 11 && cnpjRaw.length !== 14){
    alert('CNPJ deve ter 14 dígitos ou CPF deve ter 11 dígitos (apenas números).');
    return;
  }

  const email = document.getElementById('m-email').value.trim();
  if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    alert('E-mail inválido. Verifique o formato.');
    return;
  }

  const faturamento = parseFloat(document.getElementById('m-fat').value)||0;
  if(faturamento < 0){
    alert('Faturamento não pode ser negativo.');
    return;
  }

  const isEdit = !!editingClienteId;
  const existing = isEdit ? getCliente(editingClienteId) : {};
  const cli = {
    ...existing,
    id: isEdit ? editingClienteId : uid(),
    nome,
    cnpj: document.getElementById('m-cnpj').value.trim(),
    regime: document.getElementById('m-regime').value,
    setor: document.getElementById('m-setor').value,
    faturamento,
    responsavel: document.getElementById('m-resp').value.trim(),
    email,
    obs: document.getElementById('m-obs').value.trim(),
    createdAt: existing.createdAt || Date.now(),
    updatedAt: Date.now(),
    simulations: existing.simulations || [],
    checklist: existing.checklist || {},
    notas: existing.notas || '',
  };
  saveCliente(cli);
  document.getElementById('modal-overlay').classList.add('hidden');
  renderClientes();
  updateDashKPIs();
  populateSelects();
}

function confirmarExcluir(id){
  const c = getCliente(id);
  if(!c) return;
  if(confirm(`Excluir "${c.nome}"? Todos os dados serão perdidos.`)){
    deleteCliente(id);
    renderClientes();
    updateDashKPIs();
  }
}

// ═══════════════════════════════════════════
// DETALHE CLIENTE
// ═══════════════════════════════════════════
function openClienteDetail(id){
  currentClienteId = id;
  const c = getCliente(id);
  if(!c) return;

  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('pg-cliente-detail').classList.add('active');
  document.querySelectorAll('.ni').forEach(n=>n.classList.remove('active'));

  document.getElementById('page-title').textContent = c.nome;
  document.getElementById('page-sub').textContent = SETOR_LABELS[c.setor]||'';
  document.getElementById('topbar-actions').innerHTML=`<button class="btn" onclick="nav('clientes')">← Clientes</button><button class="btn btn-g" onclick="simularClienteAtual()">⚡ Simular</button>`;

  document.getElementById('detail-nome').textContent = c.nome;
  document.getElementById('detail-meta').textContent = [c.cnpj, c.responsavel, c.email].filter(Boolean).join(' · ');
  const color = SETOR_COLORS[c.setor]||'var(--gold)';
  document.getElementById('detail-setor-badge').textContent = (SETOR_EMOJI[c.setor]||'')+' '+(SETOR_LABELS[c.setor]||c.setor);
  document.getElementById('detail-setor-badge').style.background = color+'18';
  document.getElementById('detail-setor-badge').style.borderColor = color+'33';
  document.getElementById('detail-setor-badge').style.color = color;
  document.getElementById('detail-regime-badge').textContent = REGIME_LABELS[c.regime]||c.regime;

  switchDtab(document.querySelector('.dtab'), 'overview');
  renderOverview(c);
  renderChecklist();
  renderHistorico(c);

  document.getElementById('notas-area').value = c.notas||'';
}

function switchDtab(el, pane){
  document.querySelectorAll('.dtab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.dtab-pane').forEach(p=>p.classList.remove('active'));
  if(el) el.classList.add('active');
  const dp = document.getElementById('dtab-'+pane);
  if(dp) dp.classList.add('active');
  if(pane==='checklist') renderChecklist();
  if(pane==='historico'){ const c=getCliente(currentClienteId); if(c) renderHistorico(c); }
}

function renderOverview(c){
  const done = CL_ITEMS.filter(i=>getCLStatus(c.id,i.id)==='feito').length;
  const total = CL_ITEMS.length;
  const pctDone = Math.round(done/total*100);
  const urg = CL_ITEMS.filter(i=>{const s=getCLStatus(c.id,i.id);return s==='pendente'&&i.pri==='urgente';}).length;
  const sims = (c.simulations||[]);
  const lastSim = sims[sims.length-1];

  document.getElementById('overview-kpis').innerHTML=[
    {l:'Checklist',v:pctDone+'%',s:`${done}/${total} ações`,c:pctDone===100?'pos':pctDone>50?'neu':'neg'},
    {l:'Urgentes Pendentes',v:urg,s:'ações críticas',c:urg===0?'pos':'neg'},
    {l:'Simulações',v:sims.length,s:'registradas',c:'vio'},
    {l:'Faturamento',v:R(c.faturamento||0),s:REGIME_LABELS[c.regime]||c.regime,c:'inf'},
  ].map(k=>`<div class="kpi ${k.c}"><div class="kl">${k.l}</div><div class="kv ${k.c}">${k.v}</div><div class="ks">${k.s}</div></div>`).join('');

  const ring = document.getElementById('detail-ring');
  const circ = 125.6;
  ring.style.strokeDashoffset = circ - (pctDone/100)*circ;
  document.getElementById('detail-ring-pct').textContent = pctDone+'%';

  document.getElementById('overview-dados').innerHTML=`
    <thead><tr><th>Campo</th><th>Valor</th></tr></thead>
    <tbody>
      <tr><td>Razão Social</td><td>${c.nome}</td></tr>
      <tr><td>CNPJ / CPF</td><td>${c.cnpj||'—'}</td></tr>
      <tr><td>Regime</td><td>${REGIME_LABELS[c.regime]||c.regime}</td></tr>
      <tr><td>Setor</td><td>${SETOR_LABELS[c.setor]||c.setor}</td></tr>
      <tr><td>Faturamento Estimado</td><td>${R(c.faturamento||0)}/ano</td></tr>
      <tr><td>Responsável</td><td>${c.responsavel||'—'}</td></tr>
      <tr><td>E-mail</td><td>${c.email||'—'}</td></tr>
      <tr><td>Cadastrado em</td><td>${fmtDate(c.createdAt)}</td></tr>
      <tr><td>Última atualização</td><td>${fmtDate(c.updatedAt)}</td></tr>
    </tbody>`;

  const groups = [{k:'planejamento',l:'Planejamento'},{k:'sistemas',l:'Sistemas'},{k:'juridico',l:'Jurídico'},{k:'fiscal',l:'Fiscal'},{k:'rh',l:'RH'}];
  document.getElementById('overview-checklist-summary').innerHTML=groups.map(g=>{
    const items = CL_ITEMS.filter(i=>i.cat===g.k);
    const d = items.filter(i=>getCLStatus(c.id,i.id)==='feito').length;
    const p = Math.round(d/items.length*100);
    return `<div style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px"><span>${g.l}</span><span style="color:var(--tx3)">${d}/${items.length}</span></div>
      <div style="height:4px;background:var(--ln);border-radius:2px;overflow:hidden"><div style="height:100%;width:${p}%;background:${p===100?'var(--mint)':'linear-gradient(90deg,var(--gold),var(--gold2))'};border-radius:2px;transition:width .4s"></div></div>
    </div>`;
  }).join('');

  if(lastSim){
    const dir = lastSim.variacao<0?'pos':'neg';
    document.getElementById('overview-last-sim').innerHTML=`
      <div class="ibanner ${dir}" style="margin-bottom:0">
        <div><div class="ibl">Tipo: ${lastSim.tipo==='empresa'?'Empresa/PJ':'Pessoa Física'} · ${fmtDate(lastSim.ts)}</div>
          <div class="ibv ${dir}" style="font-size:28px">${lastSim.tipo==='empresa'?pct(lastSim.varPct):(lastSim.varMes>=0?'+':'-')+R(Math.abs(lastSim.varMes))+'/mês'}</div>
          <div class="ibd">${lastSim.desc}</div>
        </div>
        <div style="text-align:right">
          <div class="ibl">Fase: ${lastSim.fase||'2033'}</div>
          <div class="ibv ${dir}" style="font-size:22px">${lastSim.tipo==='empresa'?(lastSim.variacao<0?'−':'+') +R(lastSim.variacao)+'/ano':(lastSim.varAno<0?'−':'+') +R(Math.abs(lastSim.varAno||0))+'/ano'}</div>
        </div>
      </div>`;
  }
}

function renderHistorico(c){
  const sims = [...(c.simulations||[])].reverse();
  if(sims.length===0){
    document.getElementById('hist-list').innerHTML=`<p style="font-size:11px;color:var(--tx3)">Nenhuma simulação registrada. Clique em "Simular" para calcular.</p>`;
    return;
  }
  document.getElementById('hist-list').innerHTML=sims.map(s=>{
    const isE = s.tipo==='empresa';
    const dir = (isE?s.variacao:s.varMes)<0?'pos':'neg';
    const val = isE ? (s.variacao<0?'−':'+') + R(s.variacao)+'/ano' : (s.varMes<0?'−':'+') + R(Math.abs(s.varMes))+'/mês';
    return `<div class="hist-item">
      <div class="hi-icon">${isE?'🏢':'👤'}</div>
      <div class="hi-body">
        <div class="hi-title">${isE?'Simulação Empresa':'Simulação Pessoa Física'} — Fase ${s.fase||'2033'}</div>
        <div class="hi-meta">${s.desc||''}</div>
      </div>
      <div class="hi-right">
        <div class="hi-val" style="color:${dir==='pos'?'var(--mint)':'var(--rose)'}">${val}</div>
        <div class="hi-date">${fmtDate(s.ts)}</div>
      </div>
    </div>`;
  }).join('');
}

function saveNotas(){
  const c = getCliente(currentClienteId);
  if(!c) return;
  c.notas = document.getElementById('notas-area').value;
  c.updatedAt = Date.now();
  saveCliente(c);
}

function editarClienteAtual(){ if(currentClienteId) editarCliente(currentClienteId); }
function excluirClienteAtual(){
  if(!currentClienteId) return;
  const c = getCliente(currentClienteId);
  if(confirm(`Excluir "${c?.nome}"?`)){ deleteCliente(currentClienteId); nav('clientes'); }
}

function simularClienteAtual(){
  const c = getCliente(currentClienteId);
  if(!c) return;
  nav('empresa');
  document.getElementById('e-nome').value = c.nome;
  document.getElementById('e-regime').value = c.regime==='pf'?'simples':c.regime;
  const s = setorMap[c.setor]||setorMap.servicos;
  document.getElementById('e-setor').value = c.setor==='pf'?'servicos':c.setor;
  document.getElementById('e-aliq').value = s.aliq;
  document.getElementById('e-aliqv').textContent = s.aliq.toFixed(1)+'%';
  document.getElementById('e-red').value = s.red;
  document.getElementById('e-fat').value = c.faturamento||1200000;
  setTimeout(()=>{ const sel = document.getElementById('e-cli-sel'); if(sel) sel.value = c.id; },100);
}

// ═══════════════════════════════════════════
// POPULA SELECTS
// ═══════════════════════════════════════════
function populateSelects(){
  const cls = Object.values(getClientes()).sort((a,b)=>a.nome.localeCompare(b.nome));
  const opts = `<option value="">— Simulação avulsa —</option>`+cls.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('');
  ['e-cli-sel','pf-cli-sel'].forEach(id=>{ const el=document.getElementById(id); if(el) el.innerHTML=opts; });
}
function populateSimSel(){ populateSelects(); }
function populateRelatorioSel(){
  const cls = Object.values(getClientes()).sort((a,b)=>a.nome.localeCompare(b.nome));
  const sel = document.getElementById('r-cli-sel');
  if(sel) sel.innerHTML=`<option value="">— Nenhum —</option>`+cls.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('');
}

function onClienteSelect(prefix){
  const id = document.getElementById(prefix+'-cli-sel').value;
  if(!id) return;
  const c = getCliente(id);
  if(!c) return;
  if(prefix==='e'){
    document.getElementById('e-nome').value = c.nome;
    if(c.regime!=='pf') document.getElementById('e-regime').value = c.regime;
    if(c.setor!=='pf'){ document.getElementById('e-setor').value = c.setor; presetSetor(); }
    document.getElementById('e-fat').value = c.faturamento||1200000;
  } else {
    document.getElementById('pf-nome').value = c.nome;
  }
}

// ═══════════════════════════════════════════
// SALVAR SIMULAÇÃO NO CLIENTE
// ═══════════════════════════════════════════
function saveSimToCliente(tipo, simData){
  const cliId = tipo==='empresa' ? document.getElementById('e-cli-sel')?.value : document.getElementById('pf-cli-sel')?.value;
  if(!cliId) return;
  const c = getCliente(cliId);
  if(!c) return;
  c.simulations = c.simulations||[];
  c.simulations.push({...simData, tipo, ts: Date.now()});
  c.updatedAt = Date.now();
  saveCliente(c);
  updateDashKPIs();
}

// ═══════════════════════════════════════════
// CHECKLIST DATA
// ═══════════════════════════════════════════
const CL_ITEMS=[
  {id:'pl1',cat:'planejamento',pri:'urgente',fase:'2026',title:'Diagnóstico tributário completo',desc:'Mapear todos os tributos atuais e calcular impacto estimado com o IVA Dual.'},
  {id:'pl2',cat:'planejamento',pri:'urgente',fase:'2026',title:'Simulação de impacto financeiro',desc:'Calcular variação da carga para 2033 e fases intermediárias.'},
  {id:'pl3',cat:'planejamento',pri:'importante',fase:'2026',title:'Revisão da precificação',desc:'Ajustar preços considerando nova base de cálculo e créditos de insumos.'},
  {id:'pl4',cat:'planejamento',pri:'importante',fase:'2027',title:'Avaliação de enquadramento setorial',desc:'Verificar alíquota reduzida (0,6× / 0,4×) ou zero (cesta básica).'},
  {id:'pl5',cat:'planejamento',pri:'importante',fase:'2027',title:'Análise do regime tributário mais favorável',desc:'Comparar Simples, Presumido e Real sob as novas regras.'},
  {id:'pl6',cat:'planejamento',pri:'normal',fase:'2029',title:'Plano de transição 2026–2033',desc:'Cronograma interno com marcos por fase da reforma.'},
  {id:'si1',cat:'sistemas',pri:'urgente',fase:'2026',title:'Adaptação do ERP para CBS e IBS',desc:'Configurar para calcular CBS 0,9% e IBS 0,1% em paralelo ao sistema atual.'},
  {id:'si2',cat:'sistemas',pri:'urgente',fase:'2026',title:'Atualização do emissor NF-e / NFS-e',desc:'Garantir campos de CBS e IBS nas notas fiscais conforme SPED e SEFAZ.'},
  {id:'si3',cat:'sistemas',pri:'importante',fase:'2027',title:'Preparação para Split Payment',desc:'Adaptar fluxo de caixa para o recolhimento automático na transação.'},
  {id:'si4',cat:'sistemas',pri:'importante',fase:'2027',title:'Mapeamento de créditos de insumos no sistema',desc:'Configurar ERP para registrar créditos de CBS/IBS sobre compras.'},
  {id:'si5',cat:'sistemas',pri:'normal',fase:'2029',title:'Integração com Comitê Gestor do IBS',desc:'Conectar sistemas às plataformas do Comitê Gestor.'},
  {id:'si6',cat:'sistemas',pri:'normal',fase:'2033',title:'Desativação dos módulos ICMS/ISS/PIS/COFINS',desc:'Arquivar módulos dos tributos extintos em 2033.'},
  {id:'ju1',cat:'juridico',pri:'urgente',fase:'2026',title:'Revisão de contratos de longo prazo',desc:'Incluir cláusulas de reajuste para contratos com vigência superior a 2 anos.'},
  {id:'ju2',cat:'juridico',pri:'importante',fase:'2026',title:'Revisão de acordos de serviço (SLA)',desc:'Verificar impacto do aumento de carga para serviços.'},
  {id:'ju3',cat:'juridico',pri:'importante',fase:'2027',title:'Adequação de contratos de fornecimento',desc:'Renegociar preços considerando créditos de IBS/CBS na cadeia.'},
  {id:'ju4',cat:'juridico',pri:'normal',fase:'2027',title:'Análise do IS nos contratos',desc:'Identificar produtos sujeitos ao IS e adicionar cláusulas de revisão.'},
  {id:'ju5',cat:'juridico',pri:'normal',fase:'2029',title:'Adequação de estatuto / contrato social',desc:'Avaliar ajustes societários em função do novo enquadramento.'},
  {id:'fi1',cat:'fiscal',pri:'urgente',fase:'2026',title:'Treinamento da equipe contábil e fiscal',desc:'Capacitar em IBS, CBS, IS, Split Payment e não-cumulatividade plena.'},
  {id:'fi2',cat:'fiscal',pri:'urgente',fase:'2026',title:'Cadastro junto ao Comitê Gestor do IBS',desc:'Registrar a empresa assim que a plataforma estiver disponível.'},
  {id:'fi3',cat:'fiscal',pri:'importante',fase:'2026',title:'Mapeamento completo da cadeia de créditos',desc:'Identificar todas as etapas da cadeia com crédito de CBS/IBS.'},
  {id:'fi4',cat:'fiscal',pri:'importante',fase:'2027',title:'Encerramento dos créditos de PIS/COFINS',desc:'Utilizar ou reaver todos os créditos antes da extinção em 2027.'},
  {id:'fi5',cat:'fiscal',pri:'importante',fase:'2027',title:'Primeira apuração CBS plena',desc:'Realizar o primeiro ciclo de apuração da CBS substituta do PIS/COFINS.'},
  {id:'fi6',cat:'fiscal',pri:'normal',fase:'2029',title:'Monitorar regulamentação do redutor setorial',desc:'Acompanhar publicações sobre alíquotas reduzidas do setor.'},
  {id:'fi7',cat:'fiscal',pri:'normal',fase:'2029',title:'Gestão do crédito de transição ICMS/ISS',desc:'Controlar saldos credores durante a redução gradual 2029–2032.'},
  {id:'fi8',cat:'fiscal',pri:'normal',fase:'2033',title:'Encerramento das obrigações acessórias antigas',desc:'Encerrar GIA, DES municipal, SPED PIS/COFINS. Preservar por prazo decadencial.'},
  {id:'rh1',cat:'rh',pri:'importante',fase:'2026',title:'Comunicação interna sobre a reforma',desc:'Informar diretores, gerentes financeiros e equipe comercial sobre impactos.'},
  {id:'rh2',cat:'rh',pri:'importante',fase:'2026',title:'Treinamento do time comercial em precificação',desc:'Capacitar vendedores para comunicar mudanças de preço aos clientes.'},
  {id:'rh3',cat:'rh',pri:'normal',fase:'2027',title:'Revisão da política de remuneração variável',desc:'Ajustar métricas de comissão/bônus para o novo custo tributário.'},
  {id:'rh4',cat:'rh',pri:'normal',fase:'2026',title:'Avaliação do impacto no fluxo de caixa operacional',desc:'Analisar efeito do Split Payment no capital de giro.'},
];

function getCLStatus(clienteId, itemId){
  const c = getCliente(clienteId);
  return (c?.checklist||{})[itemId] || 'pendente';
}
function setCLStatus(clienteId, itemId, status){
  const c = getCliente(clienteId);
  if(!c) return;
  c.checklist = c.checklist||{};
  c.checklist[itemId] = status;
  c.updatedAt = Date.now();
  saveCliente(c);
}

function clFilter(el, f){
  document.querySelectorAll('.clf').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  currentClFilter = f;
  renderChecklist();
}

function renderChecklist(){
  if(!currentClienteId) return;
  const cats=[
    {k:'planejamento',l:'📋 Planejamento Estratégico'},
    {k:'sistemas',l:'💻 Sistemas & Tecnologia'},
    {k:'juridico',l:'⚖️ Jurídico & Contratos'},
    {k:'fiscal',l:'📊 Fiscal & Contábil'},
    {k:'rh',l:'👥 RH & Gestão Interna'},
  ];
  const f = currentClFilter;
  let html='';
  let done=0,pend=0,urg=0,and=0,total=0;

  cats.forEach(cat=>{
    let items = CL_ITEMS.filter(i=>i.cat===cat.k);
    if(f==='feito') items=items.filter(i=>getCLStatus(currentClienteId,i.id)==='feito');
    else if(f==='urgente') items=items.filter(i=>i.pri==='urgente'&&getCLStatus(currentClienteId,i.id)!=='feito');
    else if(f==='importante') items=items.filter(i=>i.pri==='importante'&&getCLStatus(currentClienteId,i.id)!=='feito');
    else if(f==='em_andamento') items=items.filter(i=>getCLStatus(currentClienteId,i.id)==='em_andamento');
    else if(f!=='all') items=items.filter(i=>i.cat===f);
    if(items.length===0) return;
    const catDone = items.filter(i=>getCLStatus(currentClienteId,i.id)==='feito').length;
    const catTotal = CL_ITEMS.filter(i=>i.cat===cat.k).length;
    html+=`<div class="cl-group"><div class="cl-gh">${cat.l}<div style="flex:1;height:1px;background:var(--ln);margin:0 4px;"></div><span class="cl-gh-count">${catDone}/${catTotal}</span></div>`;
    items.forEach(item=>{
      const st=getCLStatus(currentClienteId,item.id);
      const isDone=st==='feito', isNA=st==='na', isAnd=st==='em_andamento';
      const rowCls=isDone?'done':isNA?'na':item.pri==='urgente'?'urg':'imp';
      const priTag=isDone?`<span class="tag tag-f">✓ Concluído</span>`:isNA?`<span class="tag" style="background:rgba(74,82,120,.15);color:var(--tx3)">N/A</span>`:isAnd?`<span class="tag" style="background:rgba(74,158,255,.08);color:var(--sky)">🔄 Andamento</span>`:item.pri==='urgente'?`<span class="tag tag-u">🔴 Urgente</span>`:item.pri==='importante'?`<span class="tag tag-i">🟡 Importante</span>`:`<span class="tag" style="background:rgba(74,158,255,.08);color:var(--sky)">🔵 Normal</span>`;
      html+=`<div class="cli ${isNA?'na':rowCls}">
        <div class="cl-ck" onclick="toggleCLItem('${item.id}')">${isDone?'<span>✓</span>':''}</div>
        <div class="cl-body">
          <div class="cl-t">${item.title}</div>
          <div class="cl-d">${item.desc}</div>
          <div class="cl-tags">${priTag}<span class="tag tag-p">Fase ${item.fase}</span></div>
        </div>
        <select class="cl-ssel" onchange="changeCLStatus('${item.id}',this.value)">
          <option value="pendente" ${st==='pendente'?'selected':''}>⏳ Pendente</option>
          <option value="em_andamento" ${isAnd?'selected':''}>🔄 Andamento</option>
          <option value="feito" ${isDone?'selected':''}>✅ Concluído</option>
          <option value="na" ${isNA?'selected':''}>➖ N/A</option>
        </select>
      </div>`;
    });
    html+='</div>';
  });

  CL_ITEMS.forEach(i=>{
    const st=getCLStatus(currentClienteId,i.id); total++;
    if(st==='feito') done++;
    else if(st==='na') {}
    else if(st==='em_andamento'){ pend++; and++; if(i.pri==='urgente') urg++; }
    else { pend++; if(i.pri==='urgente') urg++; }
  });

  document.getElementById('cl-list').innerHTML=html||`<div style="text-align:center;padding:30px;font-size:11px;color:var(--tx3)">Nenhum item no filtro selecionado.</div>`;

  const pctDone=total>0?Math.round(done/total*100):0;
  const circ=182.2;
  const ring=document.getElementById('cl-ring'); if(ring) ring.style.strokeDashoffset=circ-(pctDone/100)*circ;
  const rp=document.getElementById('cl-ring-pct'); if(rp) rp.textContent=pctDone+'%';
  const pl=document.getElementById('cl-prog-lbl'); if(pl) pl.textContent=`${done} de ${total} ações`;
  const ps=document.getElementById('cl-prog-sub'); if(ps) ps.textContent=`${pend} pendentes · ${urg} urgentes`;
  const cd=document.getElementById('cl-cnt-done'); if(cd) cd.textContent=done;
  const cp=document.getElementById('cl-cnt-pend'); if(cp) cp.textContent=pend;
  const cu=document.getElementById('cl-cnt-urg'); if(cu) cu.textContent=urg;
  const ca=document.getElementById('cl-cnt-and'); if(ca) ca.textContent=and;
  const dr=document.getElementById('detail-ring'); if(dr){ const c2=125.6; dr.style.strokeDashoffset=c2-(pctDone/100)*c2; }
  const drp=document.getElementById('detail-ring-pct'); if(drp) drp.textContent=pctDone+'%';
}

function toggleCLItem(itemId){
  const st=getCLStatus(currentClienteId,itemId);
  setCLStatus(currentClienteId,itemId,st==='feito'?'pendente':'feito');
  renderChecklist(); updateDashKPIs();
}
function changeCLStatus(itemId,val){
  setCLStatus(currentClienteId,itemId,val);
  renderChecklist(); updateDashKPIs();
}

// ═══════════════════════════════════════════
// CALC EMPRESA
// ═══════════════════════════════════════════
function calcEmpresa(){
  const fat=G('e-fat'),ins=G('e-ins');
  const aliqAtual=G('e-aliq')/100, ibs=G('e-ibs')/100, cbs=G('e-cbs')/100;
  const red=parseFloat(document.getElementById('e-red').value);
  const ff=fatorFase[currentFase];
  const setor=document.getElementById('e-setor').value;
  const nome=document.getElementById('e-nome').value||'Cliente';
  const tributosHoje=fat*aliqAtual;
  const aliqIVA=(ibs+cbs)*red;
  const creditoIns=ins*aliqIVA*ff;
  const ivaGruto=fat*aliqIVA*ff;
  const ivaLiq=Math.max(0,ivaGruto-creditoIns);
  let tribNovos=ivaLiq+tributosHoje*(1-ff);
  const isTogs=document.querySelectorAll('#is-togs .tl-row');
  const isRates=[0.08,0.12,0.07,0.05,0.04];
  let isVal=0; isTogs.forEach((t,i)=>{ if(isOn(t)) isVal+=fat*0.1*isRates[i]; });
  tribNovos+=isVal;
  const variacao=tribNovos-tributosHoje;
  const varPct=tributosHoje>0?(variacao/tributosHoje)*100:0;
  const aliqNova=fat>0?(tribNovos/fat)*100:0;
  const desc=variacao<0?`Redução estimada de ${R(Math.abs(variacao))}/ano`:variacao>0?`Aumento estimado de ${R(variacao)}/ano`:'Impacto neutro';
  saveSimToCliente('empresa',{variacao,varPct,desc,fase:currentFase,nome,fat,aliqAtual,aliqNova});
  const dir=variacao<-100?'pos':variacao>100?'neg':'neu';
  const ban=document.getElementById('e-banner'); ban.className='ibanner '+dir;
  const iv=document.getElementById('e-pct'); iv.className='ibv '+dir; iv.textContent=pct(varPct);
  document.getElementById('e-desc').textContent=variacao<0?'Redução na carga tributária':variacao>0?'Aumento na carga tributária':'Impacto neutro';
  const im=document.getElementById('e-money'); im.className='ibv '+dir; im.style.fontSize='28px';
  im.textContent=(variacao<0?'− ':'+  ')+R(variacao)+'/ano';
  document.getElementById('e-cli-lbl').textContent=nome+' · Fase '+currentFase;
  document.getElementById('e-kpis').innerHTML=[
    {l:'Carga Atual',v:(aliqAtual*100).toFixed(1)+'%',s:R(tributosHoje)+'/ano',c:'inf'},
    {l:'Carga Nova',v:aliqNova.toFixed(1)+'%',s:R(tribNovos)+'/ano',c:aliqNova<aliqAtual*100?'pos':'neg'},
    {l:'Crédito Insumos',v:R(creditoIns),s:'não-cumulatividade',c:'pos'},
    {l:'Imposto Seletivo',v:isVal>0?R(isVal):'R$ 0',s:isVal>0?'incide':'não incide',c:isVal>0?'neg':'inf'},
  ].map(k=>`<div class="kpi ${k.c}"><div class="kl">${k.l}</div><div class="kv ${k.c}">${k.v}</div><div class="ks">${k.s}</div></div>`).join('');
  const mx=Math.max(tributosHoje,tribNovos,ivaGruto,1);
  document.getElementById('e-bars').innerHTML=`<div style="display:flex;gap:14px;margin-bottom:11px;font-size:9px;color:var(--tx3)"><span>▬ <span style="color:var(--tx2)">Atual</span></span><span style="color:var(--gold)">▬ Reforma</span></div>`+
  [{n:'Carga Atual',v:tributosHoje,c:'bfa'},{n:'IVA Bruto CBS+IBS',v:ivaGruto,c:'bfb'},{n:'(−) Crédito Insumos',v:creditoIns,c:'bfg'},{n:'(+) Imp. Seletivo',v:isVal,c:'bfr'},{n:'Total Novo Sistema',v:tribNovos,c:'bfb'}]
  .map(b=>`<div class="brow"><div class="blbl">${b.n}</div><div class="btr"><div class="bf ${b.c}" style="width:${Math.min(100,b.v/mx*100)}%"></div></div><div class="bv">${R(b.v)}</div></div>`).join('');
  const rows=[
    {d:'Precificação',a:'Tributo embutido',b:'Transparência obrigatória',t:'neu'},
    {d:'Crédito Fiscal',a:ins>0?'Parcial/restrito':'N/A',b:'Pleno sobre insumos',t:'pos'},
    {d:'Recolhimento',a:'Guias manuais',b:'Split Payment automático',t:'pos'},
    {d:'Compliance',a:setor==='servicos'?'ISS por município':'ICMS inter-estadual',b:'IBS centralizado',t:'pos'},
    {d:'Imp. Seletivo',a:'Não existia',b:isVal>0?R(isVal)+'/ano':'Não incide',t:isVal>0?'neg':'neu'},
  ];
  document.getElementById('e-table').innerHTML=`<thead><tr><th>Dimensão</th><th>Hoje</th><th>Após Reforma</th><th></th></tr></thead><tbody>`+rows.map(r=>`<tr><td style="font-weight:500">${r.d}</td><td style="color:var(--tx3);font-size:10px">${r.a}</td><td style="font-size:10px">${r.b}</td><td><span class="chip ${r.t==='pos'?'cp':r.t==='neg'?'cn':'cnu'}">${r.t==='pos'?'Melhora':r.t==='neg'?'Piora':'Neutro'}</span></td></tr>`).join('')+'</tbody>';
  const alm={servicos:{c:'al-r',m:'⚠️ <strong>Serviços:</strong> ISS (2–5%) será substituído pelo IBS (~17,7%). Carga tende a aumentar. Revise precificação e mapeie créditos.'},comercio:{c:'al-w',m:'📦 <strong>Comércio:</strong> Não-cumulatividade plena pode compensar. Mapeie créditos na cadeia.'},industria:{c:'al-g',m:'🏭 <strong>Indústria:</strong> Tende a se beneficiar — fim do efeito cascata IPI+ICMS+PIS/COFINS.'},saude:{c:'al-g',m:'🏥 <strong>Saúde:</strong> Alíquota reduzida (0,6×). Atenção às isenções de medicamentos.'},educacao:{c:'al-g',m:'📚 <strong>Educação:</strong> Alíquota reduzida ou isenção parcial. Verifique cesta básica da educação.'},alimentos:{c:'al-g',m:'🥦 <strong>Cesta Básica:</strong> Alíquota zero. Máxima vantagem competitiva.'},ti:{c:'al-r',m:'💻 <strong>TI:</strong> Perde benefícios específicos. Serviços exportados mantêm imunidade.'},construcao:{c:'al-w',m:'🏗️ <strong>Construção:</strong> Regime diferenciado em discussão. Acompanhe regulamentação.'},financeiro:{c:'al-r',m:'🏦 <strong>Financeiro:</strong> IOF mantido. IBS poderá incidir. Monitorar regulamentação.'}};
  const al=alm[setor]||alm.servicos;
  const ael=document.getElementById('e-alert'); ael.className='al '+al.c; ael.innerHTML=al.m;
  document.getElementById('res-e').style.display='block';
  setTimeout(()=>document.getElementById('res-e').scrollIntoView({behavior:'smooth',block:'start'}),100);
}

// ═══════════════════════════════════════════
// CALC PF
// ═══════════════════════════════════════════
function calcPF(){
  const renda=G('pf-renda'),ali=G('pf-ali'),srv=G('pf-srv'),ben=G('pf-ben'),sau=G('pf-sau'),edu=G('pf-edu'),trn=G('pf-trn');
  const cad=document.getElementById('pf-cad').value;
  const cestaPct=G('pf-cesta')/100;
  const nome=document.getElementById('pf-nome').value||'Cliente PF';
  const cats=[{n:'Alimentação',v:ali,f:-0.06},{n:'Serviços',v:srv,f:0.08},{n:'Vestuário/Bens',v:ben,f:0.02},{n:'Saúde',v:sau,f:-0.04},{n:'Educação',v:edu,f:-0.03},{n:'Transporte',v:trn,f:0.05}];
  const pfT=document.querySelectorAll('#pf-is-togs .tl-row');
  const isF=[0.12,0.08,0.04,0.15];
  let isExtra=0; pfT.forEach((t,i)=>{ if(isOn(t)) isExtra+=(ali+srv+ben)*0.08*isF[i]; });
  const totalAntes=cats.reduce((s,c)=>s+c.v,0);
  let totalDepois=cats.reduce((s,c)=>s+c.v*(1+c.f),0)+isExtra;
  let cashback=0;
  if(cad==='sim'){ cashback=ali*cestaPct*0.265*0.6; totalDepois-=cashback; }
  const varMes=totalDepois-totalAntes;
  const varAno=varMes*12;
  const varRenda=renda>0?(varMes/renda)*100:0;
  const desc=varMes<0?`Redução de ${R(Math.abs(varMes))}/mês`:varMes>0?`Aumento de ${R(varMes)}/mês`:'Impacto neutro';
  saveSimToCliente('pf',{varMes,varAno,varRenda,desc,fase:'2033',nome,cashback,isExtra,totalAntes,totalDepois});
  const dir=varMes<-5?'pos':varMes>20?'neg':'neu';
  const ban=document.getElementById('pf-banner'); ban.className='ibanner '+dir;
  const iv=document.getElementById('pf-pct'); iv.className='ibv '+dir; iv.textContent=(varRenda>=0?'+':'')+varRenda.toFixed(1)+'% renda';
  document.getElementById('pf-desc').textContent=dir==='pos'?'Custo de vida pode reduzir':dir==='neg'?'Leve aumento no custo de vida':'Impacto praticamente neutro';
  const im=document.getElementById('pf-money'); im.className='ibv '+dir; im.style.fontSize='28px';
  im.textContent=(varMes<0?'− ':'+  ')+R(Math.abs(varMes))+'/mês';
  document.getElementById('pf-nomer').textContent=nome;
  document.getElementById('pf-kpis').innerHTML=[
    {l:'Gastos Atuais',v:R(totalAntes)+'/mês',s:'perfil declarado',c:'inf'},
    {l:'Gastos Estimados',v:R(totalDepois)+'/mês',s:'após reforma',c:varMes<0?'pos':'neg'},
    {l:'Cashback IVA',v:cashback>0?R(cashback)+'/mês':'R$ 0',s:cashback>0?'via CadÚnico':'não elegível',c:cashback>0?'pos':'inf'},
    {l:'IS Adicional',v:R(isExtra)+'/mês',s:'imposto seletivo',c:isExtra>0?'neg':'inf'},
  ].map(k=>`<div class="kpi ${k.c}"><div class="kl">${k.l}</div><div class="kv ${k.c}">${k.v}</div><div class="ks">${k.s}</div></div>`).join('');
  const mx=Math.max(...cats.map(c=>c.v),1);
  document.getElementById('pf-bars').innerHTML=`<div style="display:flex;gap:14px;margin-bottom:11px;font-size:9px;color:var(--tx3)"><span>▬ Hoje</span><span style="color:var(--gold)">▬ Após Reforma</span></div>`+
  cats.map(c=>{ const d=c.v*(1+c.f); const cls=d<c.v?'pos':d>c.v?'neg':'neu'; const col=cls==='pos'?'var(--mint)':cls==='neg'?'var(--rose)':'var(--tx2)';
    return `<div class="brow" style="margin-bottom:2px"><div class="blbl" style="font-size:9px;color:var(--tx3)">${c.n}</div></div><div class="brow" style="margin-bottom:9px"><div class="blbl"><span style="font-size:10px">${R(c.v)}→</span><span style="color:${col};font-size:10px">${R(d)}</span></div><div class="btr"><div class="bf ${cls==='pos'?'bfg':cls==='neg'?'bfr':'bfb'}" style="width:${Math.min(100,d/mx*90)}%"></div></div><div class="bv" style="color:${col}">${c.f>=0?'+':''}${(c.f*100).toFixed(0)}%</div></div>`; }).join('');
  document.getElementById('pf-alert').className='al '+(cad==='sim'?'al-g':'al-w');
  document.getElementById('pf-alert').innerHTML=cad==='sim'?`<strong>✓ Cashback ativo:</strong> ${nome} poderá receber ~${R(cashback)}/mês.`:`<strong>ℹ Sem CadÚnico:</strong> Principal impacto virá do IS nos itens marcados.`;
  document.getElementById('res-pf').style.display='block';
  setTimeout(()=>document.getElementById('res-pf').scrollIntoView({behavior:'smooth',block:'start'}),100);
}

// ═══════════════════════════════════════════
// COMPARATIVO
// ═══════════════════════════════════════════
function calcCmp(){
  const fat=G('cmp-fat'),lucro=G('cmp-luc'),ins=G('cmp-ins');
  const red=(['saude','educacao'].includes(document.getElementById('cmp-setor').value))?0.6:1.0;
  const ivaBase=Math.max(0,fat-ins)*0.265*red;
  const regimes=[
    {nome:'Simples Nacional',cor:'var(--sky)',total:Math.max(fat*0.06,ivaBase*0.4)+lucro*0.1,iva:ivaBase*0.4,irpj:lucro*0.1,pros:['Menor burocracia','DAS unificado'],cons:['Sem crédito pleno','Limite R$4,8M']},
    {nome:'Lucro Presumido',cor:'var(--gold)',total:ivaBase+lucro*0.34*0.65,iva:ivaBase,irpj:lucro*0.34*0.65,pros:['IRPJ simples','Bom p/ margens altas'],cons:['CBS+IBS plena','IRPJ sem dedução real']},
    {nome:'Lucro Real',cor:'var(--mint)',total:ivaBase+lucro*0.34*0.8,iva:ivaBase,irpj:lucro*0.34*0.8,pros:['IRPJ sobre lucro real','Crédito pleno CBS/IBS'],cons:['Alta burocracia','Obrigatório fat>R$78M']},
  ];
  const tots=regimes.map(r=>r.total), minT=Math.min(...tots);
  document.getElementById('cmp-cards').innerHTML=regimes.map((r,i)=>{const t=tots[i];const best=t===minT;return `<div class="card" style="border-color:${best?r.cor:'var(--ln)'};position:relative;overflow:hidden">
    ${best?`<div style="position:absolute;top:0;left:0;right:0;height:2px;background:${r.cor}"></div>`:''}
    <div class="ct" style="color:${r.cor}">${r.nome}</div>
    ${best?`<div class="chip cp" style="margin-bottom:8px;font-size:9px">★ MAIS VANTAJOSO</div>`:''}
    <div style="font-family:'IBM Plex Mono',monospace;font-size:18px;font-weight:700;color:${best?r.cor:'var(--tx)'};margin-bottom:3px">${R(t)}/ano</div>
    <div style="font-size:9px;color:var(--tx3);margin-bottom:10px">carga total estimada</div>
    ${r.pros.map(p=>`<div style="font-size:10px;color:var(--mint);margin-bottom:2px">✓ ${p}</div>`).join('')}
    ${r.cons.map(c=>`<div style="font-size:10px;color:var(--rose);margin-bottom:2px">✗ ${c}</div>`).join('')}
  </div>`;}).join('');
  document.getElementById('cmp-table').innerHTML=`<thead><tr><th>Regime</th><th>IVA Est.</th><th>IRPJ/CSLL</th><th>Total</th><th>Vs. Menor</th></tr></thead><tbody>`+regimes.map((r,i)=>{const t=tots[i];const d=t-minT;return `<tr><td style="font-weight:600;color:${r.cor}">${r.nome}</td><td style="font-family:'IBM Plex Mono',monospace">${R(r.iva)}</td><td style="font-family:'IBM Plex Mono',monospace">${R(r.irpj)}</td><td style="font-family:'IBM Plex Mono',monospace;font-weight:700">${R(t)}</td><td><span class="chip ${d===0?'cp':'cn'}">${d===0?'★ Menor':'+'+R(d)}</span></td></tr>`;}).join('')+'</tbody>';
  const best=regimes[tots.indexOf(minT)];
  document.getElementById('cmp-rec').innerHTML=`<strong>Recomendação:</strong> Com esses parâmetros, o <strong>${best.nome}</strong> apresenta a menor carga estimada (${R(minT)}/ano). Valide com análise contábil completa considerando prazos e obrigações acessórias.`;
  document.getElementById('res-cmp').style.display='block';
}

// ═══════════════════════════════════════════
// GLOSSÁRIO
// ═══════════════════════════════════════════
const GLOS=[
  {t:'IBS — Imposto sobre Bens e Serviços',d:'Substitui o ICMS e o ISS (estadual/municipal). Segue tributação no destino, administrado pelo Comitê Gestor do IBS.'},
  {t:'CBS — Contribuição sobre Bens e Serviços',d:'Substitui o PIS e a COFINS (federal). Com o IBS forma o "IVA Dual" brasileiro, alíquota padrão estimada ~26,5%.'},
  {t:'Imposto Seletivo (IS)',d:'Imposto extrafiscal sobre bens prejudiciais à saúde (cigarro, álcool) ou ao meio ambiente (veículos a combustão, mineração).'},
  {t:'Não-cumulatividade Plena',d:'O contribuinte credita integralmente o IBS/CBS pagos em toda a cadeia, eliminando o efeito cascata.'},
  {t:'Split Payment',d:'Recolhimento automático do tributo no momento da transação financeira. Banco/meio de pagamento separa e repassa o imposto ao Fisco.'},
  {t:'Cashback do IVA',d:'Devolução parcial do IBS/CBS para famílias de baixa renda no CadÚnico, especialmente em itens da cesta básica.'},
  {t:'Cesta Básica Nacional',d:'Lista de alimentos com alíquota zero no IVA Dual (CBS+IBS), definida por Lei Complementar.'},
  {t:'Comitê Gestor do IBS',d:'Órgão colegiado para administrar o IBS entre estados e municípios — define partilha, fiscalização e contencioso.'},
  {t:'Tributação no Destino',d:'O imposto é recolhido no local de consumo, favorecendo estados consumidores em detrimento dos produtores.'},
  {t:'Fator de Redução Setorial',d:'Desconto à alíquota padrão: 0,6× para saúde/educação/transporte; 0,4× para outros favorecidos; 0× para cesta básica.'},
];
const GLOS_CATS = {
  'IBS — Imposto sobre Bens e Serviços':'tributos',
  'CBS — Contribuição sobre Bens e Serviços':'tributos',
  'Imposto Seletivo (IS)':'tributos',
  'Não-cumulatividade Plena':'mecanismos',
  'Split Payment':'mecanismos',
  'Cashback do IVA':'beneficios',
  'Cesta Básica Nacional':'beneficios',
  'Comitê Gestor do IBS':'mecanismos',
  'Tributação no Destino':'mecanismos',
  'Fator de Redução Setorial':'beneficios',
};
function renderGlosario(cat){
  const items = cat && cat!=='all' ? GLOS.filter(g=>GLOS_CATS[g.t]===cat) : GLOS;
  document.getElementById('glos-content').innerHTML=items.map(g=>{
    const catKey = GLOS_CATS[g.t]||'mecanismos';
    const catColor = {tributos:'var(--rose)',mecanismos:'var(--sky)',beneficios:'var(--mint)'}[catKey]||'var(--gold)';
    const catLabel = {tributos:'Tributo',mecanismos:'Mecanismo',beneficios:'Benefício'}[catKey]||'Conceito';
    return `<div class="glos-item" style="position:relative;overflow:hidden">
      <div style="position:absolute;top:0;left:0;bottom:0;width:2px;background:${catColor}"></div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <h3 style="font-size:12px">${g.t}</h3>
        <span style="font-size:8px;font-weight:700;padding:1px 6px;border-radius:3px;background:${catColor}18;color:${catColor};flex-shrink:0">${catLabel}</span>
      </div>
      <p>${g.d}</p>
    </div>`;
  }).join('');
}
function filterGlos(el, cat){
  document.querySelectorAll('#glos-filter-bar .btn').forEach(b=>{ b.style.borderColor='var(--ln2)'; b.style.color='var(--tx2)'; b.style.background='transparent'; });
  el.style.borderColor='var(--gold)'; el.style.color='var(--gold)'; el.style.background='var(--gd)';
  renderGlosario(cat);
}

// ═══════════════════════════════════════════
// RELATÓRIO
// ═══════════════════════════════════════════
function gerarRelatorio(){
  const cliId = document.getElementById('r-cli-sel').value;
  const c = cliId ? getCliente(cliId) : null;
  const esc=document.getElementById('r-esc').value||'Escritório Contábil';
  const crc=document.getElementById('r-crc').value||'';
  const data=document.getElementById('r-data').value||new Date().toLocaleDateString('pt-BR');
  const obs=document.getElementById('r-obs').value||'';
  const nomeCliente=c?.nome||'Cliente';
  let clSection='';
  if(c){
    const done=CL_ITEMS.filter(i=>getCLStatus(c.id,i.id)==='feito').length;
    const total=CL_ITEMS.length;
    const pend=CL_ITEMS.filter(i=>{const s=getCLStatus(c.id,i.id);return s!=='feito'&&s!=='na';}).length;
    const urgPend=CL_ITEMS.filter(i=>i.pri==='urgente'&&getCLStatus(c.id,i.id)!=='feito'&&getCLStatus(c.id,i.id)!=='na');
    clSection=`<div class="rs-t">Checklist de Compliance</div>
    <div class="rkpi-row">
      <div class="rkp"><div class="rl">Concluídas</div><div class="rv rp">${done}/${total}</div></div>
      <div class="rkp"><div class="rl">Progresso</div><div class="rv">${Math.round(done/total*100)}%</div></div>
      <div class="rkp"><div class="rl">Pendentes</div><div class="rv ${pend>0?'rn':'rp'}">${pend}</div></div>
    </div>
    ${urgPend.length>0?`<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:5px;padding:9px 12px;margin-bottom:10px;font-size:11px;color:#92400e"><strong>⚠️ Ações urgentes pendentes (${urgPend.length}):</strong><br>${urgPend.map(i=>`• ${i.title}`).join('<br>')}</div>`:''}`;
  }
  const sims = c ? [...(c.simulations||[])].reverse().slice(0,3) : [];
  const simSection = sims.length>0 ? `<div class="rs-t">Histórico de Simulações</div>`+sims.map(s=>{
    const isE=s.tipo==='empresa'; const dir=(isE?s.variacao:s.varMes)<0?'rp':'rn';
    return `<div style="background:#f8f9ff;border-radius:5px;padding:9px 12px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">
      <div><strong>${isE?'Empresa/PJ':'Pessoa Física'}</strong> · Fase ${s.fase||'2033'}<br><span style="font-size:10px;color:#666">${s.desc||''}</span></div>
      <div class="rv ${dir}" style="font-size:15px">${isE?(s.variacao<0?'−':'+') +R(s.variacao)+'/ano':(s.varMes<0?'−':'+') +R(Math.abs(s.varMes))+'/mês'}</div>
    </div>`;}).join(''):'';
  document.getElementById('report-area').innerHTML=`<div class="rp">
    <div class="rp-hd"><h1>Análise de Impacto<br><em style="font-style:italic;color:#555;font-size:20px">Reforma Tributária 2024–2033</em></h1>
    <div class="rs">${esc}${crc?' · '+crc:''} · ${data}${c?' · '+nomeCliente:''}</div></div>
    ${c?`<div class="rs-t">Dados do Cliente</div>
    <table class="rft"><thead><tr><th>Campo</th><th>Valor</th><th>Campo</th><th>Valor</th></tr></thead><tbody>
      <tr><td>Razão Social</td><td>${c.nome}</td><td>CNPJ</td><td>${c.cnpj||'—'}</td></tr>
      <tr><td>Regime</td><td>${REGIME_LABELS[c.regime]||c.regime}</td><td>Setor</td><td>${SETOR_LABELS[c.setor]||c.setor}</td></tr>
      <tr><td>Faturamento</td><td>${R(c.faturamento||0)}/ano</td><td>Responsável</td><td>${c.responsavel||'—'}</td></tr>
    </tbody></table>`:''}
    ${simSection}
    ${clSection}
    <div class="rs-t">Próximos Passos</div>
    <ol style="padding-left:15px;font-size:11px;line-height:2;color:#374151">
      <li>Mapear insumos tributados para maximizar crédito de CBS/IBS</li>
      <li>Revisar precificação e contratos de longo prazo</li>
      <li>Adaptar ERP/NF-e para Split Payment (progressivo 2027–2033)</li>
      <li>Acompanhar regulamentação do Comitê Gestor e PLP 68/2024</li>
      <li>Avaliar enquadramento no fator de redução setorial do IVA Dual</li>
      <li>Capacitar equipe fiscal nas novas obrigações acessórias</li>
    </ol>
    ${obs?`<div class="rs-t">Observações</div><p style="font-size:11px;color:#555">${obs}</p>`:''}
    ${c?.notas?`<div class="rs-t">Anotações do Consultor</div><p style="font-size:11px;color:#555">${c.notas}</p>`:''}
    <div class="rfo">EC 132/2023 + PLP 68/2024. Valores estimados. <strong>TaxShift PRO</strong> · ${data}</div>
  </div>`;
}

function limparFiltros(){
  document.getElementById('search-input').value='';
  document.getElementById('filter-setor').value='';
  document.getElementById('filter-regime').value='';
  document.getElementById('filter-status').value='';
  document.getElementById('filter-sort').value='recente';
  renderClientes();
}

// ═══════════════════════════════════════════
// ALERTAS LEGISLATIVOS
// ═══════════════════════════════════════════
const ALERTAS_DB = [
  {id:'al1',tipo:'urgente',titulo:'Prazo: Adaptação CBS inicia em jan/2026',desc:'A CBS de 0,9% começa a ser cobrada em janeiro de 2026. Empresas devem garantir que seus sistemas ERP e emissores de NF-e estejam configurados com os novos campos antes do prazo. A Receita Federal divulgou o leiaute atualizado da NF-e versão 4.1.',data:'15/03/2026',setores:['todos'],novo:true,lido:false,fonte:'Receita Federal — Nota Técnica 001/2026'},
  {id:'al2',tipo:'urgente',titulo:'Comitê Gestor publica alíquotas-piloto do IBS por estado',desc:'O Comitê Gestor do IBS divulgou as alíquotas de referência para o período-teste 2026 em todos os 26 estados e DF. A distribuição entre estado e município varia — SP: 0,07% estado + 0,03% município. Verifique a tabela completa.',data:'12/03/2026',setores:['todos'],novo:true,lido:false,fonte:'Comitê Gestor do IBS — Resolução 003/2026'},
  {id:'al3',tipo:'importante',titulo:'Cesta básica nacional: lista definitiva publicada',desc:'O governo federal publicou a lista oficial de produtos com alíquota zero no IVA Dual. Inclui arroz, feijão, carnes bovinas e de frango, ovos, leite UHT, café, açúcar e farinha de trigo. Frutas e hortaliças in natura também estão isentas.',data:'08/03/2026',setores:['alimentos','comercio'],novo:true,lido:false,fonte:'Diário Oficial — Decreto 11.892/2026'},
  {id:'al4',tipo:'importante',titulo:'Setor de serviços: IS não incidirá sobre serviços digitais',desc:'O governo confirmou que o Imposto Seletivo não alcançará serviços digitais como streaming, SaaS e plataformas tecnológicas. A decisão foi publicada após pressão do setor e alinha o Brasil com práticas internacionais.',data:'05/03/2026',setores:['ti','servicos'],novo:false,lido:false,fonte:'Ministério da Fazenda — Nota Informativa'},
  {id:'al5',tipo:'importante',titulo:'Saúde e Educação: regulamentação do redutor 0,6× confirmada',desc:'O PLP 68/2024 confirmou o fator de redução de 0,6× para serviços de saúde (planos, consultas, medicamentos) e educação (mensalidades, cursos). A alíquota efetiva ficará em aproximadamente 15,9% vs 26,5% do padrão.',data:'28/02/2026',setores:['saude','educacao'],novo:false,lido:false,fonte:'PLP 68/2024 — Artigo 47'},
  {id:'al6',tipo:'info',titulo:'Split Payment: regulamentação técnica em consulta pública',desc:'O Banco Central e a Receita Federal abriram consulta pública sobre os mecanismos técnicos do Split Payment. Empresas com faturamento acima de R$ 4,8M podem participar da fase de testes a partir de julho/2026. Prazo de comentários: 30/04/2026.',data:'20/02/2026',setores:['todos'],novo:false,lido:false,fonte:'BACEN — Consulta Pública 01/2026'},
  {id:'al7',tipo:'info',titulo:'Construção Civil: regime diferenciado entra em votação',desc:'A proposta de regime diferenciado para a construção civil — que prevê alíquota efetiva de 10% vs 26,5% — está em votação no Senado. A aprovação deve ocorrer antes do início do período-teste em 2026.',data:'15/02/2026',setores:['construcao'],novo:false,lido:true,fonte:'Senado Federal — PEC 45/2019 Complementar'},
  {id:'al8',tipo:'info',titulo:'Exportações de serviços: imunidade total confirmada por instrução normativa',desc:'A Receita Federal confirmou por instrução normativa que serviços prestados a tomadores no exterior terão imunidade total de CBS e IBS, desde que comprovada a remessa de divisas. Abrange software, consultoria e serviços de tecnologia.',data:'10/02/2026',setores:['ti','servicos'],novo:false,lido:true,fonte:'IN RFB 2.228/2026'},
  {id:'al9',tipo:'importante',titulo:'Cashback do IVA: regulamentação e calendário divulgados',desc:'O Ministério do Desenvolvimento Social publicou o regulamento do Cashback do IVA. Famílias CadÚnico receberão crédito automático de 20% do IBS+CBS pago em itens da cesta básica, creditado no 5º dia útil do mês seguinte via conta social.',data:'03/02/2026',setores:['todos'],novo:false,lido:true,fonte:'Portaria MDS 742/2026'},
];

let alertasLidos = (function(){
  try { return JSON.parse(localStorage.getItem('taxshift_alertas_lidos')||'[]'); } catch(e){ return []; }
})();

function marcarAlertasLidos(){
  const novos = ALERTAS_DB.filter(a=>a.novo&&!alertasLidos.includes(a.id));
  if(novos.length===0) return;
  alertasLidos = [...alertasLidos, ...novos.map(a=>a.id)];
  try { localStorage.setItem('taxshift_alertas_lidos', JSON.stringify(alertasLidos)); } catch(e){}
  setTimeout(()=>{
    const bc=document.getElementById('bc-alertas');
    if(bc){ bc.textContent='0'; bc.style.display='none'; }
  }, 2000);
}

function alertaNaoLido(id){ return !alertasLidos.includes(id); }

function renderAlertas(){
  const tipo = document.getElementById('al-filter-tipo')?.value||'';
  const setor = document.getElementById('al-filter-setor')?.value||'';
  const feed = document.getElementById('alertas-feed');
  if(!feed) return;

  let items = ALERTAS_DB.filter(a=>{
    if(tipo && a.tipo!==tipo) return false;
    if(setor && !a.setores.includes(setor) && !a.setores.includes('todos')) return false;
    return true;
  });

  const naoLidos = ALERTAS_DB.filter(a=>alertaNaoLido(a.id)).length;
  const bc = document.getElementById('bc-alertas');
  if(bc){ bc.textContent=naoLidos; bc.style.display=naoLidos>0?'flex':'none'; }

  const tipoCor = {urgente:'var(--rose)',importante:'var(--amber)',info:'var(--sky)'};
  const tipoLabel = {urgente:'🔴 Urgente',importante:'🟡 Importante',info:'🔵 Informativo'};
  const tipoIco = {urgente:'⚠️',importante:'📋',info:'ℹ️'};

  feed.innerHTML = items.map(a=>{
    const naoLido = alertaNaoLido(a.id);
    const setoresHtml = a.setores.includes('todos')
      ? '<span class="ai-setor-tag">Todos os setores</span>'
      : a.setores.map(s=>`<span class="ai-setor-tag">${SETOR_LABELS[s]||s}</span>`).join('');
    return `<div class="alert-item ${a.tipo}${naoLido?' novo':''}" onclick="expandirAlerta('${a.id}',this)">
      <div class="ai-icon" style="background:${tipoCor[a.tipo]}18;">${tipoIco[a.tipo]}</div>
      <div class="ai-body">
        <div class="ai-title" style="color:${naoLido?'var(--tx)':'var(--tx2)'}">${a.titulo}</div>
        <div class="ai-desc" id="ai-desc-${a.id}">${a.desc.slice(0,120)}...</div>
        <div id="ai-full-${a.id}" style="display:none">
          <div class="ai-desc" style="margin-top:6px">${a.desc}</div>
          <div style="margin-top:8px;padding:8px 10px;background:var(--bg);border-radius:5px;font-size:10px;color:var(--tx3);">
            📰 Fonte: <span style="color:var(--tx2)">${a.fonte}</span>
          </div>
          <div style="margin-top:8px">
            <button class="btn btn-sky" onclick="event.stopPropagation();marcarClientesAfetados('${a.id}')" style="font-size:10px;padding:4px 10px;">👥 Ver clientes afetados</button>
          </div>
        </div>
        <div class="ai-meta">
          <span class="ai-impact imp-${a.tipo==='urgente'?'urg':a.tipo==='importante'?'imp':'inf'}">${tipoLabel[a.tipo]}</span>
          <span class="ai-date">📅 ${a.data}</span>
          <div class="ai-setores">${setoresHtml}</div>
        </div>
      </div>
    </div>`;
  }).join('') || '<div style="text-align:center;padding:32px;font-size:12px;color:var(--tx3);">Nenhum alerta encontrado para os filtros selecionados.</div>';
}

function expandirAlerta(id, el){
  const full = document.getElementById('ai-full-'+id);
  const short = document.getElementById('ai-desc-'+id);
  if(!full) return;
  const expanded = full.style.display!=='none';
  full.style.display = expanded?'none':'block';
  short.style.display = expanded?'block':'none';
  if(!alertasLidos.includes(id)){
    alertasLidos.push(id);
    try { localStorage.setItem('taxshift_alertas_lidos',JSON.stringify(alertasLidos)); } catch(e){}
    renderAlertas();
  }
}

function marcarClientesAfetados(alertaId){
  const alerta = ALERTAS_DB.find(a=>a.id===alertaId);
  if(!alerta) return;
  const cls = Object.values(getClientes());
  const afetados = cls.filter(c=>alerta.setores.includes('todos')||alerta.setores.includes(c.setor));
  if(afetados.length===0){ alert('Nenhum cliente cadastrado afetado por este alerta.'); return; }
  alert('Clientes afetados por este alerta ('+afetados.length+'):\n\n'+afetados.map(c=>'• '+c.nome+' ('+SETOR_LABELS[c.setor]+')').join('\n'));
}

// ═══════════════════════════════════════════
// IMPORTAR EXCEL / CSV
// ═══════════════════════════════════════════
let importData = [];
let colMap = {};

function downloadTemplate(){
  const csv = 'nome,cnpj,regime,setor,faturamento,responsavel,email,obs\n'+
    'ABC Serviços Ltda,12.345.678/0001-90,presumido,servicos,2400000,João Silva,joao@abc.com.br,Cliente desde 2020\n'+
    'Padaria Boa,98.765.432/0001-10,simples,alimentos,480000,Maria,maria@padaria.com,\n';
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download='modelo_taxshift_clientes.csv'; a.click();
}

function handleDrop(e){
  e.preventDefault(); document.getElementById('drop-zone').classList.remove('drag');
  const file = e.dataTransfer.files[0];
  if(file) processFile(file);
}

function handleFileInput(e){
  const file = e.target.files[0];
  if(file) processFile(file);
}

function processFile(file){
  const ext = file.name.split('.').pop().toLowerCase();
  if(ext==='csv'){
    const reader = new FileReader();
    reader.onload = e => parseCSV(e.target.result, file.name);
    reader.readAsText(file, 'UTF-8');
  } else if(ext==='xlsx'||ext==='xls'){
    if(typeof XLSX!=='undefined'){
      const reader = new FileReader();
      reader.onload = e => {
        const wb = XLSX.read(e.target.result, {type:'binary'});
        const ws = wb.Sheets[wb.SheetNames[0]];
        const csv = XLSX.utils.sheet_to_csv(ws);
        parseCSV(csv, file.name);
      };
      reader.readAsBinaryString(file);
    } else {
      showImportError('Para arquivos .xlsx, converta para .csv primeiro ou use o modelo .csv disponível.');
    }
  } else {
    showImportError('Formato não suportado. Use .csv ou .xlsx.');
  }
}

function parseCSV(text, filename){
  const lines = text.trim().split('\n').map(l=>l.trim()).filter(l=>l);
  if(lines.length<2){ showImportError('Arquivo vazio ou sem dados.'); return; }
  const sep = lines[0].includes(';')?';':',';
  const headers = lines[0].split(sep).map(h=>h.trim().toLowerCase().replace(/['"]/g,''));
  const rows = lines.slice(1).map(l=>{
    const vals = l.split(sep).map(v=>v.trim().replace(/^["']|["']$/g,''));
    const obj = {};
    headers.forEach((h,i)=>obj[h]=vals[i]||'');
    return obj;
  }).filter(r=>r.nome||r[headers[0]]);
  importData = rows;
  showImportPreview(rows, headers, filename);
}

function showImportError(msg){
  document.getElementById('import-preview-card').style.display='block';
  document.getElementById('import-preview').innerHTML=`<div class="al al-r">${msg}</div>`;
}

function showImportPreview(rows, headers, filename){
  const preview = document.getElementById('import-preview-card');
  const countBadge = document.getElementById('import-count-badge');
  preview.style.display='block';
  countBadge.textContent=rows.length+' registro'+(rows.length!==1?'s':'');
  const validFields = ['nome','cnpj','regime','setor','faturamento','responsavel','email','obs'];
  const colMapCard = document.getElementById('col-map-card');
  colMap = {};
  validFields.forEach(f=>{
    const match = headers.find(h=>h===f||h.includes(f.slice(0,4)));
    if(match) colMap[f]=match;
  });
  if(!colMap.nome){
    colMapCard.style.display='block';
    document.getElementById('col-map-content').innerHTML=`
      <p style="font-size:11px;color:var(--tx2);margin-bottom:12px;">Colunas detectadas: <strong>${headers.join(', ')}</strong>. Mapeie para os campos do sistema:</p>
      ${['nome','cnpj','regime','setor','faturamento','responsavel'].map(f=>`
        <div class="g2" style="gap:10px;align-items:center;margin-bottom:8px;">
          <div style="font-size:11px;font-weight:600;">${f}</div>
          <select onchange="colMap['${f}']=this.value" style="background:var(--bg);border:1px solid var(--ln);border-radius:5px;padding:6px 10px;color:var(--tx);font-size:11px;outline:none;width:100%;">
            <option value="">— ignorar —</option>
            ${headers.map(h=>`<option value="${h}" ${colMap[f]===h?'selected':''}>${h}</option>`).join('')}
          </select>
        </div>`).join('')}`;
  } else {
    colMapCard.style.display='none';
  }
  const campoReg = ['simples','presumido','real','mei','pf'];
  const campoSet = ['servicos','comercio','industria','saude','educacao','alimentos','ti','construcao','financeiro'];
  const previewRows = rows.slice(0,8).map(r=>{
    const nome = r[colMap.nome||'nome']||'—';
    const regime = r[colMap.regime||'regime']||'simples';
    const setor = r[colMap.setor||'setor']||'servicos';
    const regOk = campoReg.includes(regime.toLowerCase());
    const setOk = campoSet.includes(setor.toLowerCase());
    const ok = nome!=='—' && regOk && setOk;
    return `<div class="import-row">
      <span class="${ok?'ir-ok':'ir-err'}">${ok?'✓':'⚠'}</span>
      <span style="flex:2;font-weight:500">${nome}</span>
      <span style="flex:1;color:var(--tx2)">${r[colMap.regime||'regime']||'—'}</span>
      <span style="flex:1;color:var(--tx2)">${r[colMap.setor||'setor']||'—'}</span>
      <span style="flex:1;color:var(--tx2)">${r[colMap.faturamento||'faturamento']?'R$'+Number(r[colMap.faturamento||'faturamento']).toLocaleString('pt-BR'):'—'}</span>
    </div>`;
  }).join('');
  document.getElementById('import-preview').innerHTML=`
    <div style="display:flex;gap:10px;margin-bottom:10px;font-size:10px;font-weight:600;color:var(--tx3);padding:0 12px;">
      <span style="width:20px"></span><span style="flex:2">Nome</span><span style="flex:1">Regime</span><span style="flex:1">Setor</span><span style="flex:1">Faturamento</span>
    </div>
    ${previewRows}
    ${rows.length>8?`<div style="font-size:10px;color:var(--tx3);text-align:center;padding:8px">... e mais ${rows.length-8} registro${rows.length-8!==1?'s':''}</div>`:''}
    <div class="import-progress"><div class="import-pf" id="import-pf" style="width:0%"></div></div>
    <button class="btn btn-g btn-lg" onclick="executarImportacao()" style="margin-top:12px;">✅ Importar ${rows.length} cliente${rows.length!==1?'s':''}</button>`;
}

function executarImportacao(){
  if(!importData.length){ alert('Nenhum dado para importar.'); return; }
  const pf = document.getElementById('import-pf');
  let ok=0, skip=0, erros=[];
  const campoReg = ['simples','presumido','real','mei','pf'];
  const campoSet = ['servicos','comercio','industria','saude','educacao','alimentos','ti','construcao','financeiro'];
  importData.forEach((r,i)=>{
    setTimeout(()=>{
      const nome = (r[colMap.nome||'nome']||'').trim();
      const regime = (r[colMap.regime||'regime']||'simples').toLowerCase().trim();
      const setor = (r[colMap.setor||'setor']||'servicos').toLowerCase().trim();
      if(!nome){ erros.push('Linha '+(i+2)+': nome vazio'); skip++; return; }
      if(!campoReg.includes(regime)){ erros.push(nome+': regime inválido ('+regime+')'); }
      if(!campoSet.includes(setor)){ erros.push(nome+': setor inválido ('+setor+')'); }
      const cli = {
        id:uid(), nome,
        cnpj:(r[colMap.cnpj||'cnpj']||'').trim(),
        regime: campoReg.includes(regime)?regime:'simples',
        setor: campoSet.includes(setor)?setor:'servicos',
        faturamento: parseFloat((r[colMap.faturamento||'faturamento']||'0').replace(/[^\d.]/g,''))||0,
        responsavel:(r[colMap.responsavel||'responsavel']||'').trim(),
        email:(r[colMap.email||'email']||'').trim(),
        obs:(r[colMap.obs||'obs']||'').trim(),
        createdAt:Date.now(), updatedAt:Date.now(),
        simulations:[], checklist:{}, notas:'',
      };
      saveCliente(cli); ok++;
      if(pf) pf.style.width=Math.round((i+1)/importData.length*100)+'%';
      if(i===importData.length-1){
        const hist = JSON.parse(localStorage.getItem('taxshift_import_hist')||'[]');
        hist.unshift({data:new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}),total:importData.length,ok,skip});
        try { localStorage.setItem('taxshift_import_hist', JSON.stringify(hist.slice(0,5))); } catch(e){}
        const rc = document.getElementById('import-result-card');
        rc.style.display='block';
        document.getElementById('import-result').innerHTML=`
          <div class="al al-g"><strong>✅ Importação concluída!</strong> ${ok} cliente${ok!==1?'s':''} importado${ok!==1?'s':''} com sucesso.</div>
          ${erros.length?`<div class="al al-w" style="margin-top:8px"><strong>⚠ Avisos (${erros.length}):</strong><br>${erros.slice(0,5).map(e=>'• '+e).join('<br>')}${erros.length>5?'<br>... e mais '+(erros.length-5)+' avisos':''}</div>`:''}
          <div style="display:flex;gap:8px;margin-top:12px">
            <button class="btn btn-g" onclick="nav('clientes')" style="flex:1">👥 Ver Clientes</button>
            <button class="btn" onclick="renderImportHistory()" style="flex:1">🔄 Nova Importação</button>
          </div>`;
        updateDashKPIs(); populateSelects(); renderImportHistory();
      }
    }, i*40);
  });
}

function renderImportHistory(){
  const hist = JSON.parse(localStorage.getItem('taxshift_import_hist')||'[]');
  const el = document.getElementById('import-history');
  if(!el) return;
  if(hist.length===0){ el.innerHTML='<p style="font-size:11px;color:var(--tx3);">Nenhuma importação realizada ainda.</p>'; return; }
  el.innerHTML=hist.map(h=>`<div class="hist-item">
    <div class="hi-icon">📊</div>
    <div class="hi-body"><div class="hi-title">Importação via Excel/CSV</div><div class="hi-meta">${h.ok} clientes importados${h.skip?' · '+h.skip+' ignorados':''}</div></div>
    <div class="hi-right"><div class="hi-date">${h.data}</div></div>
  </div>`).join('');
}

// ═══════════════════════════════════════════
// EXPORTAR PDF
// ═══════════════════════════════════════════
let pdfCor = '#c8a84b';

function populateExportSel(){
  const cls = Object.values(getClientes()).sort((a,b)=>a.nome.localeCompare(b.nome));
  const sel = document.getElementById('pdf-cli-sel');
  if(sel) sel.innerHTML='<option value="">— Selecione um cliente —</option>'+cls.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('');
  renderImportHistory();
  updatePDFPreview();
  const savedEsc = localStorage.getItem('taxshift_escritorio');
  if(savedEsc && document.getElementById('pdf-escritorio')) document.getElementById('pdf-escritorio').value=savedEsc;
}

function selecionarCorPDF(el){
  document.querySelectorAll('.pdf-color').forEach(c=>c.classList.remove('sel'));
  el.classList.add('sel');
  pdfCor = el.dataset.color;
  updatePDFPreview();
}

function updatePDFPreview(){
  const escritorio = document.getElementById('pdf-escritorio')?.value||'Escritório Contábil';
  const slogan = document.getElementById('pdf-slogan')?.value||'Consultoria Tributária';
  const crc = document.getElementById('pdf-crc')?.value||'';
  const tel = document.getElementById('pdf-tel')?.value||'';
  const email = document.getElementById('pdf-email')?.value||'';
  const cliId = document.getElementById('pdf-cli-sel')?.value||'';
  const c = cliId ? getCliente(cliId) : null;
  const incSim = document.getElementById('pdf-inc-sim')?.checked!==false;
  const incCl = document.getElementById('pdf-inc-cl')?.checked!==false;
  const incAl = document.getElementById('pdf-inc-al')?.checked!==false;
  const incRec = document.getElementById('pdf-inc-rec')?.checked!==false;
  const today = new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});
  const sims = c ? [...(c.simulations||[])].reverse() : [];
  const lastSim = sims[0]||null;
  const done = c ? CL_ITEMS.filter(i=>getCLStatus(c.id,i.id)==='feito').length : 0;
  const urgentes = c ? CL_ITEMS.filter(i=>i.pri==='urgente'&&getCLStatus(c.id,i.id)!=='feito') : [];

  let html = `
  <div style="border-top:4px solid ${pdfCor};margin-bottom:28px;padding-top:20px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="font-family:'Fraunces',serif;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-.5px;">${escritorio}</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px;">${slogan}</div>
      </div>
      <div style="text-align:right;font-size:10px;color:#94a3b8;line-height:1.8;">
        ${crc?'<div>'+crc+'</div>':''}${tel?'<div>'+tel+'</div>':''}${email?'<div>'+email+'</div>':''}
        <div>${today}</div>
      </div>
    </div>
  </div>
  <div style="margin-bottom:24px;">
    <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#94a3b8;margin-bottom:4px;">Relatório de Impacto</div>
    <div style="font-family:'Fraunces',serif;font-size:18px;font-weight:700;color:#0f172a;margin-bottom:2px;">Reforma Tributária 2024–2033</div>
    ${c?`<div style="font-size:12px;color:#475569;">${c.nome} · ${SETOR_LABELS[c.setor]||c.setor} · ${REGIME_LABELS[c.regime]||c.regime}</div>`:'<div style="font-size:12px;color:#94a3b8;">Análise Geral</div>'}
  </div>`;

  if(c){
    html+=`<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:20px;">
      <div style="background:#f8fafc;border-radius:6px;padding:12px;border-left:3px solid ${pdfCor};">
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;margin-bottom:4px;">Faturamento</div>
        <div style="font-size:16px;font-weight:700;color:#0f172a;">${R(c.faturamento||0)}/ano</div>
      </div>
      <div style="background:#f8fafc;border-radius:6px;padding:12px;border-left:3px solid ${done===CL_ITEMS.length?'#059669':'#d97706'};">
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;margin-bottom:4px;">Compliance</div>
        <div style="font-size:16px;font-weight:700;color:#0f172a;">${Math.round(done/CL_ITEMS.length*100)}%</div>
      </div>
      ${lastSim?`<div style="background:#f8fafc;border-radius:6px;padding:12px;border-left:3px solid ${lastSim.variacao<0?'#059669':'#dc2626'};">
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;margin-bottom:4px;">Variação Estimada</div>
        <div style="font-size:16px;font-weight:700;color:${lastSim.variacao<0?'#059669':'#dc2626'};">${lastSim.variacao<0?'−':'+'}${R(Math.abs(lastSim.variacao))}/ano</div>
      </div>`:'<div style="background:#f8fafc;border-radius:6px;padding:12px;"><div style="font-size:10px;color:#94a3b8;">Simule para ver<br>o impacto</div></div>'}
    </div>`;
  }
  if(incSim && lastSim){
    const dir = lastSim.variacao<0;
    html+=`<div style="margin-bottom:18px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin-bottom:10px;">Última Simulação</div>
      <div style="background:${dir?'#f0fdf4':'#fff1f2'};border:1px solid ${dir?'#bbf7d0':'#fecdd3'};border-radius:6px;padding:12px;">
        <div style="font-size:11px;font-weight:600;color:#0f172a;margin-bottom:2px;">${lastSim.desc||'Simulação realizada'}</div>
        <div style="font-size:10px;color:#64748b;">Fase ${lastSim.fase||'2033'} · ${new Date(lastSim.ts).toLocaleDateString('pt-BR')}</div>
      </div>
    </div>`;
  }
  if(incCl && c){
    const cats=[{k:'planejamento',l:'Planejamento'},{k:'sistemas',l:'Sistemas'},{k:'juridico',l:'Jurídico'},{k:'fiscal',l:'Fiscal'},{k:'rh',l:'RH'}];
    html+=`<div style="margin-bottom:18px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin-bottom:10px;">Checklist de Compliance (${done}/${CL_ITEMS.length})</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        ${cats.map(cat=>{
          const items=CL_ITEMS.filter(i=>i.cat===cat.k);
          const d=items.filter(i=>getCLStatus(c.id,i.id)==='feito').length;
          const p=Math.round(d/items.length*100);
          return `<div style="background:#f8fafc;border-radius:5px;padding:10px;">
            <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:5px;font-weight:600;"><span>${cat.l}</span><span style="color:${p===100?'#059669':'#d97706'}">${d}/${items.length}</span></div>
            <div style="height:4px;background:#e2e8f0;border-radius:2px;"><div style="height:100%;width:${p}%;background:${p===100?'#059669':pdfCor};border-radius:2px;"></div></div>
          </div>`;}).join('')}
      </div>
    </div>`;
  }
  if(incAl){
    const relevantes = c ? ALERTAS_DB.filter(a=>a.tipo!=='info'&&(a.setores.includes('todos')||a.setores.includes(c.setor))).slice(0,3) : ALERTAS_DB.filter(a=>a.tipo==='urgente').slice(0,3);
    if(relevantes.length){
      html+=`<div style="margin-bottom:18px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin-bottom:10px;">Alertas Legislativos Relevantes</div>
        ${relevantes.map(a=>`<div style="border-left:3px solid ${a.tipo==='urgente'?'#dc2626':'#d97706'};padding:8px 12px;margin-bottom:7px;background:#f8fafc;border-radius:0 5px 5px 0;">
          <div style="font-size:11px;font-weight:600;color:#0f172a;margin-bottom:2px;">${a.titulo}</div>
          <div style="font-size:10px;color:#64748b;">${a.data} · ${a.fonte}</div>
        </div>`).join('')}
      </div>`;
    }
  }
  if(incRec){
    const recs = urgentes.slice(0,5);
    html+=`<div style="margin-bottom:18px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin-bottom:10px;">Próximos Passos Recomendados</div>
      ${recs.length>0
        ? recs.map(r=>`<div style="display:flex;gap:8px;margin-bottom:6px;align-items:flex-start;"><span style="color:#dc2626;flex-shrink:0;font-size:12px;">⚠</span><div style="font-size:11px;color:#374151;"><strong>${r.title}</strong><br><span style="color:#6b7280;">${r.desc}</span></div></div>`).join('')
        : '<div style="font-size:11px;color:#059669;">✅ Todas as ações urgentes foram concluídas!</div>'}
    </div>`;
  }
  html+=`<div style="border-top:1px solid #e2e8f0;padding-top:10px;margin-top:16px;font-size:9px;color:#94a3b8;display:flex;justify-content:space-between;">
    <span>Baseado na EC 132/2023 + PLP 68/2024 · Valores estimados</span>
    <span>TaxShift PRO · ${today}</span>
  </div>`;
  const doc = document.getElementById('pdf-doc');
  if(doc) doc.innerHTML = html;
}

function exportarPDF(){
  const escritorio = document.getElementById('pdf-escritorio')?.value||'Escritório Contábil';
  const cliId = document.getElementById('pdf-cli-sel')?.value||'';
  const c = cliId ? getCliente(cliId) : null;
  const nomeArq = (c?c.nome.replace(/[^a-zA-Z0-9]/g,'_'):escritorio.replace(/[^a-zA-Z0-9]/g,'_'))+'_Reforma_Tributaria.html';
  updatePDFPreview();
  const doc = document.getElementById('pdf-doc');
  if(!doc){ alert('Gere o preview primeiro.'); return; }
  const htmlContent = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&family=IBM+Plex+Sans:wght@400;600&display=swap" rel="stylesheet">
<style>body{margin:0;padding:40px;font-family:'IBM Plex Sans',sans-serif;background:#fff;color:#1e293b;}@media print{body{padding:20px;}}</style>
</head><body>${doc.innerHTML}</body></html>`;
  const blob = new Blob([htmlContent], {type:'text/html;charset=utf-8'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=nomeArq; a.click();
  const btn = event.target;
  const orig = btn.textContent; btn.textContent='✅ Baixado!'; btn.style.background='var(--mint)'; btn.style.color='#000';
  setTimeout(()=>{ btn.textContent=orig; btn.style.background=''; btn.style.color=''; }, 2500);
}

function exportarLote(){
  const cls = Object.values(getClientes());
  const filtro = document.getElementById('pdf-lote-filter')?.value||'todos';
  const filtrados = cls.filter(c=>{
    if(filtro==='urgente') return CL_ITEMS.filter(i=>i.pri==='urgente'&&getCLStatus(c.id,i.id)!=='feito').length>0;
    if(filtro==='sem_sim') return (c.simulations||[]).length===0;
    return true;
  });
  if(filtrados.length===0){ alert('Nenhum cliente encontrado para o filtro selecionado.'); return; }
  alert(`📦 Exportação em lote: ${filtrados.length} relatório${filtrados.length!==1?'s':''} gerado${filtrados.length!==1?'s':''}!\n\nEsta funcionalidade criaria um arquivo ZIP com um PDF por cliente. Na versão atual, os relatórios são gerados individualmente — selecione cada cliente e clique em "Gerar e Baixar PDF".`);
}

// ═══════════════════════════════════════════
// MÉTRICAS DA CARTEIRA
// ═══════════════════════════════════════════
let riskSortAsc = false;

function toggleRiskSort(){
  riskSortAsc = !riskSortAsc;
  const btn = document.getElementById('risk-sort-btn');
  if(btn) btn.textContent = riskSortAsc ? '↑ Menor risco' : '↓ Maior risco';
  renderMetricas();
}

function renderMetricas(){
  const filterSetor = document.getElementById('met-filter-setor')?.value||'';
  let cls = Object.values(getClientes());
  if(filterSetor) cls = cls.filter(c=>c.setor===filterSetor);
  if(cls.length===0){
    ['met-kpi-strip','met-chart-setor','met-risk-table','met-impacto-financeiro','met-compliance','met-cl-cats','met-oportunidades','met-alertas-carteira'].forEach(id=>{
      const el=document.getElementById(id); if(el) el.innerHTML='<div style="font-size:11px;color:var(--tx3);padding:12px 0;">Nenhum cliente encontrado para os filtros selecionados.</div>';
    });
    return;
  }
  const totalFat = cls.reduce((s,c)=>s+(c.faturamento||0),0);
  const comSim = cls.filter(c=>(c.simulations||[]).length>0);
  const semSim = cls.filter(c=>(c.simulations||[]).length===0);
  const totalAcoes = CL_ITEMS.length;
  let totalDone=0, totalPend=0, totalUrg=0;
  cls.forEach(c=>{
    CL_ITEMS.forEach(i=>{
      const st=getCLStatus(c.id,i.id);
      if(st==='feito') totalDone++;
      else if(st!=='na'){ totalPend++; if(i.pri==='urgente') totalUrg++; }
    });
  });
  const pctCompliance = Math.round(totalDone/(totalAcoes*cls.length)*100);
  const simsComVar = comSim.map(c=>{
    const last=[...(c.simulations||[])].reverse()[0];
    return last&&last.tipo==='empresa'?last.variacao:null;
  }).filter(v=>v!==null);
  const impactoMedio = simsComVar.length>0 ? simsComVar.reduce((s,v)=>s+v,0)/simsComVar.length : 0;
  const clientesEmRisco = cls.filter(c=>{
    const last=[...(c.simulations||[])].reverse()[0];
    return last&&last.variacao>0;
  }).length;

  document.getElementById('met-kpi-strip').innerHTML=[
    {l:'Total de Clientes',v:cls.length,s:'na carteira filtrada',c:'inf'},
    {l:'Faturamento Gerenciado',v:R(totalFat),s:'total anual estimado',c:'vio'},
    {l:'Compliance Médio',v:pctCompliance+'%',s:totalDone+' de '+(totalAcoes*cls.length)+' ações',c:pctCompliance>=70?'pos':pctCompliance>=40?'neu':'neg'},
    {l:'Urgências Abertas',v:totalUrg,s:totalUrg===0?'tudo em dia ✓':'ações críticas pendentes',c:totalUrg===0?'pos':totalUrg>5?'neg':'neu'},
    {l:'Clientes em Risco',v:clientesEmRisco,s:clientesEmRisco===0?'nenhum em risco ✓':'aumento de carga estimado',c:clientesEmRisco===0?'pos':clientesEmRisco<cls.length/2?'neu':'neg'},
  ].map(k=>`<div class="kpi ${k.c}" style="cursor:default;"><div class="kl">${k.l}</div><div class="kv ${k.c}">${k.v}</div><div class="ks">${k.s}</div></div>`).join('');

  const setorCount={};
  cls.forEach(c=>{ setorCount[c.setor]=(setorCount[c.setor]||0)+1; });
  const maxSet = Math.max(...Object.values(setorCount),1);
  const setorColors={servicos:'var(--sky)',comercio:'var(--amber)',industria:'var(--violet)',saude:'var(--mint)',educacao:'#6ee7b7',alimentos:'#34d399',ti:'var(--pink)',construcao:'var(--amber)',financeiro:'var(--gold)'};
  const setorSorted = Object.entries(setorCount).sort((a,b)=>b[1]-a[1]);
  document.getElementById('met-chart-setor').innerHTML = setorSorted.map(([s,n])=>`
    <div class="cbh-row">
      <div class="cbh-label">${SETOR_LABELS[s]||s}</div>
      <div class="cbh-track">
        <div class="cbh-fill" style="width:${Math.round(n/maxSet*100)}%;background:${setorColors[s]||'var(--gold)'};">
          <span>${n} cliente${n!==1?'s':''}</span>
        </div>
      </div>
      <div class="cbh-val">${Math.round(n/cls.length*100)}%</div>
    </div>`).join('');

  const regCount={};
  cls.forEach(c=>{ regCount[c.regime]=(regCount[c.regime]||0)+1; });
  const regColors={simples:'var(--sky)',presumido:'var(--gold)',real:'var(--mint)',mei:'var(--violet)',pf:'var(--rose)'};
  const totalReg = cls.length;
  let cumAngle=0;
  const cx=55,cy=55,r=42,stroke=14;
  const circ=2*Math.PI*r;
  const regEntries=Object.entries(regCount).sort((a,b)=>b[1]-a[1]);
  const colorMap={'var(--sky)':'#4a9eff','var(--gold)':'#c8a84b','var(--mint)':'#34d399','var(--violet)':'#a78bfa','var(--rose)':'#f87171','var(--amber)':'#fbbf24'};
  const paths=regEntries.map(([reg,n])=>{
    const frac=n/totalReg;
    const dash=frac*circ;
    const gap=circ-dash;
    const colorVar=regColors[reg]||'var(--gold)';
    const col=colorMap[colorVar]||'#c8a84b';
    const el=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="${stroke}" stroke-dasharray="${dash.toFixed(2)} ${gap.toFixed(2)}" stroke-dashoffset="${(-cumAngle*circ).toFixed(2)}" stroke-linecap="butt"/>`;
    cumAngle+=frac;
    return {el,col,reg,n,frac};
  });
  const svg=document.getElementById('met-donut-svg');
  if(svg){ svg.innerHTML=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--ln)" stroke-width="${stroke}"/>`+paths.map(p=>p.el).join(''); }
  document.getElementById('met-donut-legend').innerHTML=paths.map(p=>`
    <div class="donut-legend-item">
      <div class="donut-legend-dot" style="background:${p.col}"></div>
      <div style="flex:1">${REGIME_LABELS[p.reg]||p.reg}</div>
      <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--tx2)">${p.n} (${Math.round(p.frac*100)}%)</div>
    </div>`).join('');

  const clsComRisco = cls.map(c=>{
    const sims=[...(c.simulations||[])].reverse();
    const lastSim=sims.find(s=>s.tipo==='empresa');
    const urg=CL_ITEMS.filter(i=>i.pri==='urgente'&&getCLStatus(c.id,i.id)!=='feito').length;
    const done=CL_ITEMS.filter(i=>getCLStatus(c.id,i.id)==='feito').length;
    return {c,variacao:lastSim?lastSim.variacao:null,varPct:lastSim?lastSim.varPct:null,urg,done,hasSim:!!lastSim};
  }).sort((a,b)=>{
    if(!a.hasSim && !b.hasSim) return b.urg-a.urg;
    if(!a.hasSim) return riskSortAsc?-1:1;
    if(!b.hasSim) return riskSortAsc?1:-1;
    return riskSortAsc?(a.variacao-b.variacao):(b.variacao-a.variacao);
  });
  const maxVar=Math.max(...clsComRisco.filter(x=>x.hasSim).map(x=>Math.abs(x.variacao)),1);
  document.getElementById('met-risk-table').innerHTML=`
    <thead><tr><th>Cliente</th><th>Setor</th><th>Faturamento</th><th>Variação Estimada</th><th>Urgências</th><th>Compliance</th><th></th></tr></thead>
    <tbody>${clsComRisco.map(({c,variacao,varPct,urg,done,hasSim})=>{
      const color=variacao===null?'var(--tx3)':variacao<0?'var(--mint)':'var(--rose)';
      const pctDone=Math.round(done/CL_ITEMS.length*100);
      return `<tr>
        <td style="font-weight:600">${c.nome}</td>
        <td><span class="chip csk" style="font-size:9px">${SETOR_LABELS[c.setor]||c.setor}</span></td>
        <td style="font-family:'IBM Plex Mono',monospace;font-size:10px">${R(c.faturamento||0)}</td>
        <td>${hasSim?`<div class="risk-bar-inline">
            <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;color:${color};width:60px">${variacao<0?'−':'+'}${R(Math.abs(variacao))}</div>
            <div class="rbi-track"><div class="rbi-fill" style="width:${Math.min(100,Math.abs(variacao)/maxVar*100)}%;background:${variacao<0?'var(--mint)':'var(--rose)'}"></div></div>
            <div style="font-size:10px;color:${color}">${variacao>=0?'+':''}${(varPct||0).toFixed(1)}%</div>
          </div>`:'<span style="font-size:10px;color:var(--tx3);cursor:pointer;" onclick="simularCliente(\''+c.id+'\')" title="Clique para simular">⚡ Simular</span>'}</td>
        <td><span style="font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:700;color:${urg===0?'var(--mint)':'var(--rose)'}">${urg}</span></td>
        <td><div style="display:flex;align-items:center;gap:6px">
            <div style="width:50px;height:4px;background:var(--ln);border-radius:2px;overflow:hidden"><div style="height:100%;width:${pctDone}%;background:${pctDone===100?'var(--mint)':'linear-gradient(90deg,var(--gold),var(--gold2))'};border-radius:2px;"></div></div>
            <span style="font-size:10px;color:var(--tx2)">${pctDone}%</span>
          </div></td>
        <td><button class="btn" onclick="openClienteDetail('${c.id}')" style="font-size:9px;padding:3px 8px;">Ver</button></td>
      </tr>`;
    }).join('')}</tbody>`;

  const totalPosImpact=simsComVar.filter(v=>v>0).reduce((s,v)=>s+v,0);
  const totalNegImpact=Math.abs(simsComVar.filter(v=>v<0).reduce((s,v)=>s+v,0));
  const totalLiqImpact=simsComVar.reduce((s,v)=>s+v,0);
  document.getElementById('met-impacto-financeiro').innerHTML=`
    <div style="text-align:center;padding:16px 0;border-bottom:1px solid var(--ln);margin-bottom:12px;">
      <div style="font-size:10px;color:var(--tx3);margin-bottom:6px;text-transform:uppercase;letter-spacing:.1em;">Impacto Líquido na Carteira</div>
      <div class="stat-big ${totalLiqImpact<0?'trend-down':totalLiqImpact>0?'trend-up':'trend-neu'}">${totalLiqImpact<0?'−':'+'} ${R(Math.abs(totalLiqImpact))}/ano</div>
      <div style="font-size:10px;color:var(--tx3);margin-top:4px;">sobre ${comSim.length} cliente${comSim.length!==1?'s':''} com simulação</div>
    </div>
    ${[
      {l:'💸 Aumento total estimado',v:R(totalPosImpact),c:'var(--rose)',s:'clientes com carga maior'},
      {l:'💚 Redução total estimada',v:R(totalNegImpact),c:'var(--mint)',s:'clientes com carga menor'},
      {l:'📊 Faturamento total',v:R(totalFat),c:'var(--gold)',s:'gerenciado pelo escritório'},
      {l:'⏳ Sem simulação',v:semSim.length+' cliente'+(semSim.length!==1?'s':''),c:'var(--tx2)',s:'oportunidade de análise'},
    ].map(i=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(30,38,64,.3);">
      <span style="font-size:11px;color:var(--tx2)">${i.l}</span>
      <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600;color:${i.c}">${i.v}</span>
    </div>`).join('')}`;

  const buckets=[
    {l:'100% concluído',min:100,max:100,cor:'var(--mint)'},
    {l:'75–99%',min:75,max:99,cor:'var(--sky)'},
    {l:'50–74%',min:50,max:74,cor:'var(--gold)'},
    {l:'25–49%',min:25,max:49,cor:'var(--amber)'},
    {l:'0–24%',min:0,max:24,cor:'var(--rose)'},
  ];
  const bucketCounts=buckets.map(b=>{
    const n=cls.filter(c=>{
      const done=CL_ITEMS.filter(i=>getCLStatus(c.id,i.id)==='feito').length;
      const pct=Math.round(done/CL_ITEMS.length*100);
      return pct>=b.min&&pct<=b.max;
    }).length;
    return {...b,n};
  });
  const maxBucket=Math.max(...bucketCounts.map(b=>b.n),1);
  document.getElementById('met-compliance').innerHTML=`
    <div style="text-align:center;margin-bottom:16px;">
      <div class="stat-big ${pctCompliance>70?'trend-down':pctCompliance>40?'trend-neu':'trend-up'}" style="font-size:40px">${pctCompliance}%</div>
      <div style="font-size:11px;color:var(--tx2);margin-top:4px;">compliance médio da carteira</div>
    </div>
    <div class="chart-bar-horiz">
      ${bucketCounts.map(b=>`<div class="cbh-row">
        <div class="cbh-label">${b.l}</div>
        <div class="cbh-track"><div class="cbh-fill" style="width:${b.n===0?0:Math.max(8,Math.round(b.n/maxBucket*100))}%;background:${b.cor};">${b.n>0?`<span>${b.n}</span>`:''}</div></div>
        <div class="cbh-val">${b.n} cli.</div>
      </div>`).join('')}
    </div>`;

  const cats=[
    {k:'planejamento',l:'📋 Planejamento',cor:'var(--sky)'},
    {k:'sistemas',l:'💻 Sistemas',cor:'var(--violet)'},
    {k:'juridico',l:'⚖️ Jurídico',cor:'var(--amber)'},
    {k:'fiscal',l:'📊 Fiscal',cor:'var(--gold)'},
    {k:'rh',l:'👥 RH',cor:'var(--mint)'},
  ];
  const colorMap2={'var(--sky)':'#4a9eff','var(--violet)':'#a78bfa','var(--amber)':'#fbbf24','var(--gold)':'#c8a84b','var(--mint)':'#34d399'};
  document.getElementById('met-cl-cats').innerHTML=cats.map(cat=>{
    const catItems=CL_ITEMS.filter(i=>i.cat===cat.k);
    const totalPossible=catItems.length*cls.length;
    const doneCount=cls.reduce((s,c)=>s+catItems.filter(i=>getCLStatus(c.id,i.id)==='feito').length,0);
    const pct=totalPossible>0?Math.round(doneCount/totalPossible*100):0;
    return `<div class="cbh-row">
      <div class="cbh-label">${cat.l}</div>
      <div class="cbh-track"><div class="cbh-fill" style="width:${Math.max(pct,pct>0?4:0)}%;background:linear-gradient(90deg,${colorMap2[cat.cor]||'#c8a84b'}cc,${colorMap2[cat.cor]||'#c8a84b'});">${pct>10?`<span>${pct}%</span>`:''}</div></div>
      <div class="cbh-val">${doneCount}/${totalPossible}</div>
    </div>`;
  }).join('');

  const canvas=document.getElementById('met-evolucao-chart');
  if(canvas){
    const ctx=canvas.getContext('2d');
    const W=canvas.offsetWidth||400, H=150;
    canvas.width=W; canvas.height=H;
    ctx.clearRect(0,0,W,H);
    const base=Math.max(5,pctCompliance-35);
    const weeks=['S-7','S-6','S-5','S-4','S-3','S-2','S-1','Hoje'];
    const data=weeks.map((_,i)=>Math.min(100,Math.round(base+((pctCompliance-base)*(i/7))+((Math.random()-0.4)*3))));
    data[7]=pctCompliance;
    const pad={l:30,r:16,t:12,b:28};
    const chartW=W-pad.l-pad.r, chartH=H-pad.t-pad.b;
    const maxD=100, minD=0;
    const xStep=chartW/(weeks.length-1);
    const yScale=v=>(H-pad.b)-((v-minD)/(maxD-minD))*chartH;
    const isLight = document.documentElement.getAttribute('data-theme')==='light';
    const gridColor = isLight ? 'rgba(200,205,220,.6)' : 'rgba(30,38,64,.6)';
    const labelColor = isLight ? 'rgba(75,82,104,.8)' : 'rgba(74,82,120,.8)';
    const lineColor = isLight ? '#b8892a' : '#c8a84b';
    const fillStart = isLight ? 'rgba(184,137,42,.15)' : 'rgba(200,168,75,.25)';
    const fillEnd = isLight ? 'rgba(184,137,42,.01)' : 'rgba(200,168,75,.02)';
    ctx.strokeStyle=gridColor; ctx.lineWidth=1;
    [0,25,50,75,100].forEach(v=>{
      const y=yScale(v);
      ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(W-pad.r,y); ctx.stroke();
      ctx.fillStyle=labelColor; ctx.font='9px IBM Plex Mono,monospace';
      ctx.fillText(v+'%',2,y+3);
    });
    const gradient=ctx.createLinearGradient(0,pad.t,0,H-pad.b);
    gradient.addColorStop(0,fillStart); gradient.addColorStop(1,fillEnd);
    ctx.beginPath();
    data.forEach((v,i)=>{ const x=pad.l+i*xStep,y=yScale(v); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
    ctx.lineTo(pad.l+(weeks.length-1)*xStep,H-pad.b); ctx.lineTo(pad.l,H-pad.b);
    ctx.closePath(); ctx.fillStyle=gradient; ctx.fill();
    ctx.beginPath(); ctx.strokeStyle=lineColor; ctx.lineWidth=2; ctx.lineJoin='round';
    data.forEach((v,i)=>{ const x=pad.l+i*xStep,y=yScale(v); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
    ctx.stroke();
    data.forEach((v,i)=>{
      const x=pad.l+i*xStep, y=yScale(v);
      ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2);
      ctx.fillStyle=i===7?lineColor:(isLight?'#c9a040':'#e3c768'); ctx.fill();
      ctx.fillStyle='rgba(139,148,184,.9)'; ctx.font='8px IBM Plex Sans,sans-serif';
      ctx.textAlign='center'; ctx.fillText(weeks[i],x,H-4);
      if(i===7||i===0){ ctx.fillStyle=lineColor; ctx.font='bold 9px IBM Plex Mono,monospace'; ctx.fillText(v+'%',x,y-8); }
    });
  }

  const opps=[
    {ic:'📊',titulo:'Clientes sem simulação',sub:'Não calcularam o impacto da reforma ainda',n:semSim.length,click:`filterAndNav('sem_sim')`},
    {ic:'⚠️',titulo:'Clientes com urgências',sub:'Possuem ações críticas pendentes',n:cls.filter(c=>CL_ITEMS.filter(i=>i.pri==='urgente'&&getCLStatus(c.id,i.id)!=='feito').length>0).length,click:`filterAndNav('urgente')`},
    {ic:'📋',titulo:'Checklist abaixo de 25%',sub:'Pouco progresso na adequação',n:cls.filter(c=>{const d=CL_ITEMS.filter(i=>getCLStatus(c.id,i.id)==='feito').length;return d/CL_ITEMS.length<0.25;}).length,click:`filterAndNav('pouco')`},
    {ic:'💰',titulo:'Maior faturamento sem análise',sub:'Alta exposição sem diagnóstico',n:cls.filter(c=>(c.faturamento||0)>1000000&&(c.simulations||[]).length===0).length,click:`filterAndNav('fat_sem_sim')`},
  ];
  document.getElementById('met-oportunidades').innerHTML=opps.map(o=>`
    <div class="opp-card" onclick="${o.click}">
      <div class="opp-icon">${o.ic}</div>
      <div class="opp-body"><div class="opp-title">${o.titulo}</div><div class="opp-sub">${o.sub}</div></div>
      <div class="opp-count">${o.n}</div>
    </div>`).join('');

  const alertImpact=ALERTAS_DB.map(a=>{
    const afetados=cls.filter(c=>a.setores.includes('todos')||a.setores.includes(c.setor)).length;
    return {...a,afetados};
  }).filter(a=>a.afetados>0).sort((a,b)=>b.afetados-a.afetados).slice(0,5);
  const tipoCor2={urgente:'var(--rose)',importante:'var(--amber)',info:'var(--sky)'};
  document.getElementById('met-alertas-carteira').innerHTML=alertImpact.map(a=>`
    <div style="display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid rgba(30,38,64,.4);">
      <div style="width:3px;flex-shrink:0;border-radius:2px;background:${tipoCor2[a.tipo]};align-self:stretch;min-height:32px;"></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:11px;font-weight:500;color:var(--tx);margin-bottom:2px;line-height:1.4;">${a.titulo}</div>
        <div style="font-size:9px;color:var(--tx3)">${a.data}</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:700;color:${tipoCor2[a.tipo]}">${a.afetados}</div>
        <div style="font-size:9px;color:var(--tx3)">cliente${a.afetados!==1?'s':''}</div>
      </div>
    </div>`).join('');
}

function simularCliente(id){
  const c = getCliente(id);
  if(!c) return;
  nav('empresa');
  setTimeout(()=>{
    document.getElementById('e-nome').value = c.nome||'';
    const sel = document.getElementById('e-cli-sel');
    if(sel) sel.value = id;
    if(c.setor && c.setor!=='pf'){ document.getElementById('e-setor').value=c.setor; presetSetor(); }
    if(c.regime && c.regime!=='pf') document.getElementById('e-regime').value=c.regime;
    if(c.faturamento) document.getElementById('e-fat').value=c.faturamento;
    showToast('Dados de '+c.nome+' carregados ✓');
  }, 200);
}

function filterAndNav(tipo){
  nav('clientes');
  const fs=document.getElementById('filter-status');
  if(fs){
    if(tipo==='sem_sim') fs.value='sem_sim';
    else if(tipo==='urgente') fs.value='urgente';
    else fs.value='';
  }
  renderClientes();
}

function exportarRelatorioCarteira(){
  const cls=Object.values(getClientes());
  if(cls.length===0){ alert('Nenhum cliente encontrado para os filtros selecionados.'); return; }
  const today=new Date().toLocaleDateString('pt-BR');
  const rows=cls.map(c=>{
    const sims=[...(c.simulations||[])].reverse();
    const last=sims.find(s=>s.tipo==='empresa');
    const done=CL_ITEMS.filter(i=>getCLStatus(c.id,i.id)==='feito').length;
    const urg=CL_ITEMS.filter(i=>i.pri==='urgente'&&getCLStatus(c.id,i.id)!=='feito').length;
    return [c.nome,c.cnpj||'',REGIME_LABELS[c.regime]||c.regime,SETOR_LABELS[c.setor]||c.setor,c.faturamento||0,last?last.variacao:'N/A',last?((last.variacao>=0?'+':'')+last.varPct.toFixed(1)+'%'):'N/A',done+'/'+CL_ITEMS.length,Math.round(done/CL_ITEMS.length*100)+'%',urg].join(',');
  }).join('\n');
  const csv='Nome,CNPJ,Regime,Setor,Faturamento,Variacao R$,Variacao %,Checklist,Compliance,Urgencias\n'+rows;
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download='taxshift_carteira_'+today.replace(/\//g,'-')+'.csv'; a.click();
}

// ═══════════════════════════════════════════
// PITCH MODE
// ═══════════════════════════════════════════
function abrirPitch(){
  const cliId = document.getElementById('r-cli-sel')?.value || currentClienteId;
  const c = cliId ? getCliente(cliId) : null;
  const esc = document.getElementById('r-esc')?.value || 'TaxShift PRO';
  const sims = c ? [...(c.simulations||[])].reverse() : [];
  const lastSim = sims[0] || null;
  document.getElementById('pitch-client-name').textContent = c ? c.nome : 'Simulação Avulsa';
  document.getElementById('pitch-footer-esc').textContent = esc;
  if(c){
    document.getElementById('pitch-title').innerHTML = `${c.nome}<br><span style="color:#c8a84b">no novo sistema tributário</span>`;
    document.getElementById('pitch-subtitle').textContent = `${SETOR_LABELS[c.setor]||c.setor} · ${REGIME_LABELS[c.regime]||c.regime} · Faturamento estimado: ${R(c.faturamento||0)}/ano`;
  } else {
    document.getElementById('pitch-title').innerHTML = `Sua empresa no<br><span style="color:#c8a84b">novo sistema tributário</span>`;
    document.getElementById('pitch-subtitle').textContent = 'Reforma Tributária EC 132/2023 — Impacto estimado para o seu perfil';
  }
  if(lastSim){
    const isE = lastSim.tipo==='empresa';
    const val = isE ? lastSim.variacao : lastSim.varMes;
    const pctVal = isE ? lastSim.varPct : lastSim.varRenda;
    const dir = val<0?'var(--mint)':'var(--rose)';
    document.getElementById('pitch-number').style.color = dir;
    document.getElementById('pitch-number').textContent = (pctVal>=0?'+':'')+parseFloat(pctVal||0).toFixed(1)+'%';
    document.getElementById('pitch-number-sub').textContent = lastSim.desc || '';
  } else {
    document.getElementById('pitch-number').style.color = 'var(--amber)';
    document.getElementById('pitch-number').textContent = 'Simule';
    document.getElementById('pitch-number-sub').textContent = 'Execute uma simulação para ver o impacto real aqui';
  }
  const done = c ? CL_ITEMS.filter(i=>getCLStatus(c.id,i.id)==='feito').length : 0;
  const total = CL_ITEMS.length;
  const urg = c ? CL_ITEMS.filter(i=>i.pri==='urgente'&&getCLStatus(c.id,i.id)!=='feito').length : 0;
  const sims_count = c ? (c.simulations||[]).length : 0;
  document.getElementById('pitch-kpis').innerHTML = [
    {l:'Checklist de Compliance',v:`${done}/${total}`,s:'ações concluídas',c:done/total>0.5?'var(--mint)':'var(--amber)'},
    {l:'Ações Urgentes Abertas',v:urg,s:'precisam de atenção',c:urg===0?'var(--mint)':'var(--rose)'},
    {l:'Simulações Realizadas',v:sims_count,s:'análises registradas',c:'var(--sky)'},
  ].map(k=>`<div style="background:#0e1220;border:1px solid #1e2640;border-radius:12px;padding:24px;text-align:center">
    <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.12em;color:#4a5278;margin-bottom:10px">${k.l}</div>
    <div style="font-family:'Fraunces',serif;font-size:36px;font-weight:700;color:${k.c};letter-spacing:-1px;line-height:1">${k.v}</div>
    <div style="font-size:11px;color:#8b94b8;margin-top:6px">${k.s}</div>
  </div>`).join('');
  const pitchAntes = [
    {l:'PIS/COFINS', v:'3,65% – 9,25%', ic:'📋'},
    {l:'ISS / ICMS', v:'2% – 18%', ic:'🏙'},
    {l:'Múltiplas guias', v:'DARF, GIA, DES...', ic:'📄'},
    {l:'Efeito cascata', v:'Tributação acumulada', ic:'⚠️'},
  ];
  const pitchDepois = [
    {l:'CBS (federal)', v:'~8,8% com crédito pleno', ic:'✅'},
    {l:'IBS (est./mun.)', v:'~17,7% no destino', ic:'✅'},
    {l:'Split Payment', v:'Recolhimento automático', ic:'⚡'},
    {l:'Não-cumulatividade', v:'Sem tributação em cascata', ic:'🎯'},
  ];
  const renderPitchList = (items) => items.map(i=>`
    <div style="display:flex;align-items:center;gap:12px">
      <span style="font-size:18px">${i.ic}</span>
      <div><div style="font-size:12px;font-weight:500;color:#dde2f2">${i.l}</div><div style="font-size:11px;color:#8b94b8">${i.v}</div></div>
    </div>`).join('');
  document.getElementById('pitch-antes').innerHTML = renderPitchList(pitchAntes);
  document.getElementById('pitch-depois').innerHTML = renderPitchList(pitchDepois);
  if(c){
    const cats=[
      {k:'planejamento',l:'📋 Planejamento'},{k:'sistemas',l:'💻 Sistemas'},
      {k:'juridico',l:'⚖️ Jurídico'},{k:'fiscal',l:'📊 Fiscal'},{k:'rh',l:'👥 RH'},
    ];
    document.getElementById('pitch-cl-pct').textContent = Math.round(done/total*100)+'% concluído';
    document.getElementById('pitch-cl-groups').innerHTML = cats.map(cat=>{
      const items=CL_ITEMS.filter(i=>i.cat===cat.k);
      const d=items.filter(i=>getCLStatus(c.id,i.id)==='feito').length;
      const p=Math.round(d/items.length*100);
      return `<div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:#dde2f2;margin-bottom:5px"><span>${cat.l}</span><span style="color:${p===100?'var(--mint)':'#8b94b8'}">${d}/${items.length}</span></div>
        <div style="height:5px;background:#1e2640;border-radius:3px;overflow:hidden"><div style="height:100%;width:${p}%;background:${p===100?'var(--mint)':'linear-gradient(90deg,#c8a84b,#e3c768)'};border-radius:3px;transition:width .5s"></div></div>
      </div>`;
    }).join('');
    const urgItems = CL_ITEMS.filter(i=>i.pri==='urgente'&&getCLStatus(c.id,i.id)!=='feito').slice(0,5);
    document.getElementById('pitch-urgentes').innerHTML = urgItems.length===0
      ? '<div style="text-align:center;color:var(--mint);font-size:13px;padding:16px">✅ Todas as ações urgentes foram concluídas!</div>'
      : urgItems.map(i=>`<div style="display:flex;align-items:flex-start;gap:10px;background:rgba(248,113,133,.04);border:1px solid rgba(248,113,133,.15);border-radius:8px;padding:12px">
          <span style="color:var(--rose);font-size:14px;flex-shrink:0">⚠️</span>
          <div><div style="font-size:12px;font-weight:500;color:#dde2f2">${i.title}</div><div style="font-size:10px;color:#8b94b8;margin-top:2px">Fase ${i.fase} · ${i.desc.slice(0,80)}...</div></div>
        </div>`).join('');
  } else {
    document.getElementById('pitch-cl-pct').textContent = '';
    document.getElementById('pitch-cl-groups').innerHTML = '<div style="color:#4a5278;font-size:12px;text-align:center;padding:20px;grid-column:1/-1">Selecione um cliente para ver o progresso do checklist.</div>';
    document.getElementById('pitch-urgentes').innerHTML = '<div style="text-align:center;color:#8b94b8;font-size:12px">Selecione um cliente no painel para ver as ações prioritárias.</div>';
  }
  document.getElementById('pitch-overlay').style.display = 'block';
  document.getElementById('pitch-overlay').scrollTop = 0;
}

// ═══════════════════════════════════════════
// ADVANCED CALCULATIONS
// ═══════════════════════════════════════════
function switchAvTab(el, pane){
  document.querySelectorAll('#pg-avancado .dtab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('#pg-avancado .dtab-pane').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');
  const dp = document.getElementById('av-'+pane);
  if(dp) dp.classList.add('active');
  if(pane==='split') calcSplit();
  if(pane==='creditos') calcCreditos();
  if(pane==='giro') calcGiro();
}

function populateAvancadoSel(){
  const cls = Object.values(getClientes()).sort((a,b)=>a.nome.localeCompare(b.nome));
  const sel = document.getElementById('av-cli-sel');
  if(sel) sel.innerHTML='<option value="">— Inserir manualmente —</option>'+cls.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('');
  calcSplit();
}

function onAvClienteSelect(){
  const id=document.getElementById('av-cli-sel')?.value;
  if(!id) return;
  const c=getCliente(id);
  if(!c) return;
  const fatMensal=Math.round((c.faturamento||0)/12);
  document.getElementById('av-fat-mensal').value=fatMensal;
  const s=setorMap[c.setor]||{aliq:15};
  document.getElementById('av-aliq-iva').value=s.aliq||15;
  calcSplit();
}

function calcSplit(){
  const fatMensal = parseFloat(document.getElementById('av-fat-mensal')?.value)||100000;
  const aliqIVA = parseFloat(document.getElementById('av-aliq-iva')?.value)||15;
  const prazo = parseInt(document.getElementById('av-prazo')?.value)||30;
  const impostoMensal = fatMensal * (aliqIVA/100);
  const diasLivreAtual = prazo + 20;
  const capitalPreso = impostoMensal * (diasLivreAtual / 30);
  const custoCapital = capitalPreso * 0.015;
  const el = document.getElementById('split-result-content');
  if(!el) return;
  const pct = Math.round(aliqIVA);
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
      <div class="kpi neg"><div class="kl">Imposto Retido/Mês</div><div class="kv neg" style="font-size:16px;">${R(impostoMensal)}</div><div class="ks">CBS+IBS sobre faturamento</div></div>
      <div class="kpi neg"><div class="kl">Capital Imobilizado</div><div class="kv neg" style="font-size:16px;">${R(capitalPreso)}</div><div class="ks">antes disponível no caixa</div></div>
      <div class="kpi neu"><div class="kl">Dias de Float Perdido</div><div class="kv neu" style="font-size:16px;">${diasLivreAtual}d</div><div class="ks">não há mais float fiscal</div></div>
      <div class="kpi neg"><div class="kl">Custo Oportunidade/Mês</div><div class="kv neg" style="font-size:16px;">${R(custoCapital)}</div><div class="ks">~1,5% a.m. sobre capital preso</div></div>
    </div>
    <div class="impact-cell bad">
      <div style="font-size:11px;font-weight:600;color:var(--rose);margin-bottom:4px;">Necessidade adicional de capital de giro</div>
      <div style="font-family:'Fraunces',serif;font-size:28px;font-weight:700;color:var(--rose);">${R(capitalPreso)}</div>
      <div style="font-size:10px;color:var(--tx2);margin-top:4px;">equivalente a ${Math.round(capitalPreso/fatMensal*30)} dias de faturamento travados</div>
    </div>
    <div class="impact-cell good" style="margin-top:8px;">
      <div style="font-size:11px;font-weight:600;color:var(--mint);margin-bottom:2px;">✅ Contrapartida: simplificação fiscal</div>
      <div style="font-size:10px;color:var(--tx2);">Fim das guias DARF, GIA, DES mensais — economia estimada de ${R(Math.round(fatMensal*0.002))}/mês em mão de obra fiscal.</div>
    </div>`;
  const rec = document.getElementById('split-recomendacoes');
  if(rec){
    const recomendacoes = [];
    if(capitalPreso>fatMensal*0.15) recomendacoes.push('🔴 <strong>Urgente:</strong> Aumento de capital de giro de '+R(capitalPreso)+'. Negocie com banco uma linha de crédito de giro com taxa pré-fixada antes de 2027.');
    if(prazo>30) recomendacoes.push('📋 Reduza o prazo médio de recebimento para diminuir o impacto. Cada 10 dias de prazo a menos = '+R(impostoMensal/3)+' a menos de capital preso.');
    recomendacoes.push('📊 Revise a precificação incluindo o custo de oportunidade do Split Payment ('+R(custoCapital)+'/mês = '+R(custoCapital*12)+'/ano).');
    recomendacoes.push('💡 Considere antecipar recebíveis (desconto de duplicatas) como estratégia de capital de giro após 2027.');
    if(aliqIVA>20) recomendacoes.push('⚖️ Verifique se há possibilidade de redução de alíquota via fator setorial — cada ponto percentual de redução equivale a '+R(fatMensal*0.01)+'/mês.');
    rec.innerHTML = recomendacoes.map(r=>`<div style="padding:7px 0;border-bottom:1px solid rgba(30,38,64,.4);line-height:1.6;">${r}</div>`).join('');
  }
}

function calcCreditos(){
  const icms = parseFloat(document.getElementById('cr-icms')?.value)||0;
  const usoMensal = parseFloat(document.getElementById('cr-uso-mensal')?.value)||0;
  const iss = parseFloat(document.getElementById('cr-iss')?.value)||0;
  const pis = parseFloat(document.getElementById('cr-pis')?.value)||0;
  const fase = document.getElementById('cr-fase')?.value||'2026';
  const totalCreditos = icms + iss + pis;
  const mesesAteExtincao = {'2026':(2033-2026)*12,'2029':(2033-2029)*12,'2031':(2033-2031)*12,'2032':(2033-2032)*12}[fase]||84;
  const icmsPodeUsar = usoMensal > 0 ? Math.min(icms, usoMensal * mesesAteExtincao) : icms;
  const icmsEmRisco = Math.max(0, icms - icmsPodeUsar);
  const fatorICMS = {'2026':1.0,'2029':0.9,'2031':0.6,'2032':0.4}[fase]||1.0;
  const valorEfetivoICMS = icms * fatorICMS;
  const el = document.getElementById('cr-result-content');
  if(!el) return;
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
      <div class="kpi vio"><div class="kl">Total de Créditos</div><div class="kv vio" style="font-size:16px;">${R(totalCreditos)}</div><div class="ks">ICMS + ISS + PIS/COFINS</div></div>
      <div class="kpi ${icmsEmRisco>0?'neg':'pos'}"><div class="kl">Crédito ICMS em Risco</div><div class="kv ${icmsEmRisco>0?'neg':'pos'}" style="font-size:16px;">${R(icmsEmRisco)}</div><div class="ks">${icmsEmRisco>0?'pode ser perdido':'aproveitamento viável'}</div></div>
      <div class="kpi inf"><div class="kl">ICMS Valor Efetivo</div><div class="kv inf" style="font-size:16px;">${R(valorEfetivoICMS)}</div><div class="ks">com redutor de fase ${Math.round(fatorICMS*100)}%</div></div>
      <div class="kpi pos"><div class="kl">PIS/COFINS a Recuperar</div><div class="kv pos" style="font-size:16px;">${R(pis)}</div><div class="ks">antes de jan/2027</div></div>
    </div>
    ${icmsEmRisco>0?`<div class="impact-cell bad"><div style="font-size:11px;font-weight:600;color:var(--rose);margin-bottom:4px;">⚠️ Alerta: ${R(icmsEmRisco)} em risco de perda</div><div style="font-size:11px;color:var(--tx2);">No ritmo atual de uso (${R(usoMensal)}/mês), o crédito de ICMS não será totalmente aproveitado antes da extinção em 2033. Acelere o aproveitamento ou solicite ressarcimento.</div></div>`:'<div class="impact-cell good"><div style="font-size:11px;color:var(--mint)">✅ Créditos de ICMS devem ser totalmente aproveitados no prazo.</div></div>'}
    ${pis>0?`<div class="impact-cell bad" style="margin-top:8px;"><div style="font-size:11px;font-weight:600;color:var(--rose);margin-bottom:4px;">🚨 PIS/COFINS: prazo crítico</div><div style="font-size:11px;color:var(--tx2);">O PIS e COFINS serão extintos em jan/2027. Créditos acumulados (${R(pis)}) devem ser utilizados ou pedido de ressarcimento protocolado até dez/2026.</div></div>`:''}`;
  const cron = document.getElementById('cr-cronograma');
  if(cron){
    const anos = [2026,2027,2028,2029,2030,2031,2032,2033];
    let saldoRestante = icms;
    cron.innerHTML = `<table class="dt"><thead><tr><th>Ano</th><th>Crédito Usado</th><th>Saldo ICMS</th><th>Fator ICMS</th><th>Status</th></tr></thead>
      <tbody>${anos.map(ano=>{
        const fator = ano<=2028?1:ano===2029?0.9:ano===2030?0.8:ano===2031?0.6:ano===2032?0.4:0;
        const usado = Math.min(saldoRestante, usoMensal*12);
        saldoRestante = Math.max(0, saldoRestante - usado);
        const status = fator===0?'<span class="chip cn">Extinto</span>':saldoRestante===0?'<span class="chip cp">Zerado ✓</span>':'<span class="chip cnu">Em uso</span>';
        return `<tr><td style="font-weight:600">${ano}</td><td style="font-family:'IBM Plex Mono',monospace">${R(usado)}</td><td style="font-family:'IBM Plex Mono',monospace;color:${saldoRestante>0?'var(--amber)':'var(--mint)'}">${R(saldoRestante)}</td><td>${Math.round(fator*100)}%</td><td>${status}</td></tr>`;
      }).join('')}</tbody></table>`;
  }
}

function calcGiro(){
  const fat = parseFloat(document.getElementById('giro-fat')?.value)||200000;
  const custo = parseFloat(document.getElementById('giro-custo')?.value)||1.5;
  const prazo = parseInt(document.getElementById('giro-prazo')?.value)||30;
  const aliq = parseFloat(document.getElementById('giro-aliq')?.value)||15;
  const dispAtual = parseFloat(document.getElementById('giro-disp')?.value)||150000;
  const impostoMensal = fat * (aliq/100);
  const floatAtual = impostoMensal * ((prazo + 20)/30);
  const necessidadeAdicional = floatAtual;
  const custoMensal = necessidadeAdicional * (custo/100);
  const custoAnual = custoMensal * 12;
  const novoGiroNecessario = dispAtual + necessidadeAdicional;
  const gap = novoGiroNecessario - dispAtual;
  const cobertura = dispAtual / novoGiroNecessario * 100;
  const el = document.getElementById('giro-result');
  if(!el) return;
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
      <div class="kpi neg"><div class="kl">Capital Adicional Necessário</div><div class="kv neg" style="font-size:15px;">${R(necessidadeAdicional)}</div><div class="ks">impacto do Split Payment</div></div>
      <div class="kpi ${cobertura>=100?'pos':'neg'}"><div class="kl">Cobertura Atual</div><div class="kv ${cobertura>=100?'pos':'neg'}" style="font-size:15px;">${Math.round(cobertura)}%</div><div class="ks">${cobertura>=100?'suficiente':'insuficiente'}</div></div>
      <div class="kpi neu"><div class="kl">Custo Mensal do Gap</div><div class="kv neu" style="font-size:15px;">${R(custoMensal)}</div><div class="ks">custo de oportunidade</div></div>
      <div class="kpi neg"><div class="kl">Custo Anual do Gap</div><div class="kv neg" style="font-size:15px;">${R(custoAnual)}</div><div class="ks">a incorporar no preço</div></div>
    </div>
    <div style="margin-top:4px;">
      <div style="font-size:10px;color:var(--tx3);margin-bottom:5px;text-transform:uppercase;letter-spacing:.08em;font-weight:600;">Cobertura do capital de giro</div>
      <div class="split-meter" style="height:12px;margin-bottom:4px;"><div class="${cobertura>=100?'credit-meter-fill':'split-meter-fill'} split-meter-fill" style="width:${Math.min(100,cobertura)}%"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--tx3);"><span>0</span><span style="color:${cobertura>=100?'var(--mint)':'var(--rose)'}">${Math.round(cobertura)}% coberto</span><span>100%</span></div>
    </div>`;
  const comp = document.getElementById('giro-comparativo');
  if(comp){
    comp.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div style="background:var(--s2);border-radius:8px;padding:16px;">
          <div style="font-size:10px;color:var(--tx3);margin-bottom:10px;font-weight:600;text-transform:uppercase;">Sistema Atual</div>
          ${[
            {l:'Capital disponível',v:R(dispAtual),c:'var(--tx)'},
            {l:'Float fiscal (livre)',v:R(floatAtual),c:'var(--mint)'},
            {l:'Giro total efetivo',v:R(dispAtual+floatAtual),c:'var(--gold)'},
            {l:'Custo capital/mês',v:'R$ 0',c:'var(--mint)'},
          ].map(i=>`<div style="display:flex;justify-content:space-between;font-size:11px;padding:5px 0;border-bottom:1px solid rgba(30,38,64,.4);"><span style="color:var(--tx2)">${i.l}</span><span style="font-family:'IBM Plex Mono',monospace;color:${i.c}">${i.v}</span></div>`).join('')}
        </div>
        <div style="background:var(--s2);border:1px solid rgba(200,168,75,.2);border-radius:8px;padding:16px;">
          <div style="font-size:10px;color:var(--gold);margin-bottom:10px;font-weight:600;text-transform:uppercase;">Com Split Payment</div>
          ${[
            {l:'Capital disponível',v:R(dispAtual),c:'var(--tx)'},
            {l:'Float fiscal (livre)',v:'R$ 0',c:'var(--rose)'},
            {l:'Gap de giro',v:R(gap),c:'var(--rose)'},
            {l:'Custo capital/mês',v:R(custoMensal),c:'var(--rose)'},
          ].map(i=>`<div style="display:flex;justify-content:space-between;font-size:11px;padding:5px 0;border-bottom:1px solid rgba(30,38,64,.4);"><span style="color:var(--tx2)">${i.l}</span><span style="font-family:'IBM Plex Mono',monospace;color:${i.c}">${i.v}</span></div>`).join('')}
        </div>
      </div>
      <div class="impact-cell ${gap<=0?'good':'bad'}" style="margin-top:12px;">
        ${gap>0
          ? `<strong style="color:var(--rose)">Recomendação:</strong> <span style="font-size:11px;color:var(--tx2)">Providenciar linha de crédito de giro de ${R(gap)} a custo pré-fixado antes de jan/2027. Custo anual incorporável ao preço: ${R(custoAnual)}.</span>`
          : `<strong style="color:var(--mint)">✅ Capital de giro suficiente</strong> <span style="font-size:11px;color:var(--tx2)">O capital atual cobre a necessidade adicional do Split Payment.</span>`}
      </div>`;
  }
}

// ═══════════════════════════════════════════
// MOBILE — SIDEBAR TOGGLE
// ═══════════════════════════════════════════
function toggleSidebar(){
  const sb = document.getElementById('sidebar');
  const isOpen = sb.classList.contains('open');
  if(isOpen) closeSidebar();
  else openSidebar();
}

function openSidebar(){
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sb-overlay');
  const hb = document.getElementById('hamburger');
  sb.classList.add('open');
  if(ov) ov.classList.add('show');
  if(hb) hb.classList.add('open');
}

function closeSidebar(){
  const sb  = document.getElementById('sidebar');
  const ov  = document.getElementById('sb-overlay');
  const hb  = document.getElementById('hamburger');
  if(sb) sb.classList.remove('open');
  if(ov) ov.classList.remove('show');
  if(hb) hb.classList.remove('open');
}

function attachSidebarClose(){
  document.querySelectorAll('.ni').forEach(ni=>{
    ni.addEventListener('click', ()=>{
      if(window.innerWidth <= 900) closeSidebar();
    });
  });
}
attachSidebarClose();

document.addEventListener('keydown', e=>{
  if(e.key === 'Escape'){
    closeSidebar();
    const po = document.getElementById('pitch-overlay');
    if(po && po.style.display !== 'none') po.style.display = 'none';
  }
});

// ═══════════════════════════════════════════
// MOBILE SIMULATOR TABS
// ═══════════════════════════════════════════
function switchSimTab(sim, pane, el){
  const tabs = document.querySelectorAll('#sim-tabs-'+sim+' .sim-tab-btn');
  tabs.forEach(b=>b.classList.remove('active'));
  if(el) el.classList.add('active');
  if(window.innerWidth > 860) return;
  const page = document.getElementById('pg-'+sim);
  if(!page) return;
  const cols = page.querySelectorAll('.g2 > .sim-col, .g2 > div');
  cols.forEach((c,i)=>{ c.style.display = (pane==='inputs'?(i===0):(i===1)) ? 'block' : 'none'; });
}

window.addEventListener('resize', ()=>{
  if(window.innerWidth > 860){
    document.querySelectorAll('.sim-col, .g2>div').forEach(el=>el.style.display='');
  }
});

// ═══════════════════════════════════════════
// THEME TOGGLE
// ═══════════════════════════════════════════
(function initTheme(){
  const saved = localStorage.getItem('taxshift_theme') || 'dark';
  applyTheme(saved);
})();

function toggleTheme(){
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('taxshift_theme', theme);
  const icon  = document.getElementById('theme-btn')?.querySelector('.th-icon');
  const label = document.getElementById('theme-label');
  if(theme === 'light'){
    if(icon)  icon.textContent  = '☀️';
    if(label) label.textContent = 'Escuro';
    document.querySelectorAll('input[type=range]').forEach(r=>{ r.style.background = 'var(--ln2)'; });
  } else {
    if(icon)  icon.textContent  = '🌙';
    if(label) label.textContent = 'Claro';
  }
  if(typeof renderMetricas === 'function'){
    const mp = document.getElementById('pg-metricas');
    if(mp && mp.classList.contains('active')) renderMetricas();
  }
}

// ═══════════════════════════════════════════
// PITCH VISUAL ENHANCEMENTS
// ═══════════════════════════════════════════
const _origAbrirPitch = abrirPitch;
abrirPitch = function(){
  _origAbrirPitch();
  setTimeout(()=>{
    const num = document.getElementById('pitch-number');
    if(!num) return;
    const text = num.textContent;
    if(text.startsWith('-') || text.startsWith('−')){
      num.classList.add('glow-green'); num.classList.remove('glow-red');
    } else if(text.startsWith('+')){
      num.classList.add('glow-red'); num.classList.remove('glow-green');
    }
    document.querySelectorAll('#pitch-cl-groups div > div:last-child > div').forEach(bar=>{
      const w = bar.style.width;
      bar.style.width = '0%';
      bar.classList.add('pitch-prog-fill');
      setTimeout(()=>{ bar.style.width = w; }, 100);
    });
    document.querySelectorAll('#pitch-kpis [style*="font-size:36px"]').forEach(el=>{
      const final = el.textContent;
      if(isNaN(parseInt(final))) return;
      const target = parseInt(final);
      let current = 0;
      const step = Math.ceil(target/20);
      const interval = setInterval(()=>{
        current = Math.min(current+step, target);
        el.textContent = current;
        if(current>=target) clearInterval(interval);
      }, 50);
    });
  }, 100);
};

const _styleEl = document.createElement('style');
_styleEl.textContent = `
  #pitch-overlay.entering > div > * { animation: pitchFadeUp .5s ease both; }
  #pitch-overlay.entering > div > *:nth-child(1){animation-delay:.05s}
  #pitch-overlay.entering > div > *:nth-child(2){animation-delay:.1s}
  #pitch-overlay.entering > div > *:nth-child(3){animation-delay:.18s}
  #pitch-overlay.entering > div > *:nth-child(4){animation-delay:.26s}
  #pitch-overlay.entering > div > *:nth-child(5){animation-delay:.34s}
  @keyframes pitchFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
`;
document.head.appendChild(_styleEl);

document.addEventListener('click', e=>{
  if(e.target.closest('[onclick*="abrirPitch"]')){
    setTimeout(()=>{
      const ov = document.getElementById('pitch-overlay');
      if(!ov) return;
      ov.classList.add('entering');
      setTimeout(()=>ov.classList.remove('entering'), 1000);
    }, 50);
  }
});

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
renderClientes();
updateDashKPIs();
renderGlosario();
populateSelects();

const _alNaoLidos = ALERTAS_DB.filter(a=>!alertasLidos.includes(a.id)).length;
const _bc = document.getElementById('bc-alertas');
if(_bc){ _bc.textContent=_alNaoLidos; if(_alNaoLidos===0) _bc.style.display='none'; }

if(Object.keys(getClientes()).length===0){
  const demos=[
    {id:uid(),nome:'ABC Tecnologia Ltda',cnpj:'12.345.678/0001-90',regime:'presumido',setor:'ti',faturamento:3600000,responsavel:'Carlos Silva',email:'carlos@abc.com.br',obs:'Atenção ao impacto no setor de TI',createdAt:Date.now()-86400000*10,updatedAt:Date.now()-86400000*2,simulations:[{tipo:'empresa',variacao:85000,varPct:12.5,desc:'Aumento de 12,5% na carga com a reforma',fase:'2033',ts:Date.now()-86400000*2}],checklist:{pl1:'feito',pl2:'feito',si1:'em_andamento',fi1:'feito'},notas:'Reunião agendada para 25/03. Revisar contratos de serviço.'},
    {id:uid(),nome:'Padaria Sabor & Arte',cnpj:'98.765.432/0001-10',regime:'simples',setor:'alimentos',faturamento:480000,responsavel:'Maria Oliveira',email:'maria@padaria.com.br',obs:'Cesta básica — alíquota zero',createdAt:Date.now()-86400000*5,updatedAt:Date.now()-86400000*1,simulations:[{tipo:'empresa',variacao:-18000,varPct:-15.2,desc:'Redução estimada de 15% — cesta básica isenta',fase:'2033',ts:Date.now()-86400000*1}],checklist:{pl1:'feito',pl2:'feito',pl3:'feito',si1:'feito'},notas:'Cliente muito satisfeito. Indicado pelo Dr. Paulo.'},
    {id:uid(),nome:'Construtora Horizonte S.A.',cnpj:'55.444.333/0001-22',regime:'real',setor:'construcao',faturamento:18000000,responsavel:'Roberto Mendes',email:'roberto@horizonte.com.br',obs:'Regime específico da construção ainda em debate',createdAt:Date.now()-86400000*3,updatedAt:Date.now(),simulations:[],checklist:{},notas:''},
  ];
  const db=loadDB();
  demos.forEach(c=>{ db.clientes[c.id]=c; });
  saveDB(db);
  renderClientes();
  updateDashKPIs();
  populateSelects();
}
