// ══════════════════════════════════════════
// TAXSHIFT LANDING — SCRIPT LIMPO v4
// ══════════════════════════════════════════

// ── DEMO ANIMATION ──
let _demoTimer = null;
let _currentScreen = 1;
const DEMO_SCREENS = 4;

function goScreen(n, navId) {
  // Clear all screens and dots
  for (var i = 1; i <= DEMO_SCREENS; i++) {
    var s = document.getElementById('dscreen-' + i);
    var dot = document.querySelectorAll('.demo-dot')[i - 1];
    if (s) s.classList.remove('active-screen');
    if (dot) dot.classList.remove('active-dot');
  }
  // Clear ALL sidebar nav items (7 total, not just 4)
  document.querySelectorAll('.demo-nav-item').forEach(function(el) {
    el.classList.remove('active-nav');
  });
  // Show target screen
  var target = document.getElementById('dscreen-' + n);
  if (target) target.classList.add('active-screen');
  var activeDot = document.querySelectorAll('.demo-dot')[n - 1];
  if (activeDot) activeDot.classList.add('active-dot');
  // Highlight the correct nav item (navId if passed, otherwise matches screen)
  var nav = document.getElementById('dnav-' + (navId != null ? navId : n));
  if (nav) nav.classList.add('active-nav');
  _currentScreen = n;
}

function startDemoLoop() {
  clearInterval(_demoTimer);
  _demoTimer = setInterval(function () {
    goScreen((_currentScreen % DEMO_SCREENS) + 1);
  }, 3200);
}

function stopDemoLoop() { clearInterval(_demoTimer); }

document.addEventListener('click', function (e) {
  if (e.target.classList.contains('demo-dot') || e.target.classList.contains('demo-nav-item')) {
    stopDemoLoop();
    clearTimeout(window._demoRestartTimer);
    window._demoRestartTimer = setTimeout(startDemoLoop, 6000);
  }
});

// ── PLAN EXPAND ──
function togglePlan(btn) {
  var details = btn.nextElementSibling;
  var isOpen = details.style.display !== 'none';
  details.style.display = isOpen ? 'none' : 'block';
  btn.textContent = isOpen ? 'Ver todos os detalhes ↓' : 'Recolher ↑';
}

// ── BILLING TOGGLE ──
var PRICES = {
  mensal: { basico: 97, pro: 197, ent: 397 },
  anual:  { basico: 78, pro: 158, ent: 318 }
};

function setBilling(type) {
  // Update prices
  var p = PRICES[type];
  var ids = ['price-basico','price-pro','price-ent'];
  var vals = [p.basico, p.pro, p.ent];
  for (var i = 0; i < ids.length; i++) {
    var el = document.getElementById(ids[i]);
    if (el) el.textContent = vals[i];
  }
  var period = type === 'anual' ? 'por mês · cobrado anualmente' : 'por mês · por escritório';
  ['period-basico','period-pro','period-ent'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.textContent = period;
  });
  // Update button visual state (targeting only bg/color to preserve child spans)
  var bM = document.getElementById('toggle-mensal');
  var bA = document.getElementById('toggle-anual');
  if (bM && bA) {
    var activeStyle  = { background: '#0d0e11', color: '#ffffff' };
    var inactiveStyle = { background: 'transparent', color: '#6b7280' };
    var actBtn  = type === 'mensal' ? bM : bA;
    var inactBtn = type === 'mensal' ? bA : bM;
    actBtn.style.background  = activeStyle.background;
    actBtn.style.color       = activeStyle.color;
    inactBtn.style.background = inactiveStyle.background;
    inactBtn.style.color      = inactiveStyle.color;
  }
}

// ── MODAL SYSTEM ──
var _currentModal = null;

function openModal(e, type, plan) {
  if (e && e.preventDefault) e.preventDefault();
  if (_currentModal) closeModal(_currentModal);

  var idMap = {
    login:      'modal-login',
    cadastro:   'modal-cadastro',
    enterprise: 'modal-enterprise',
    demo:       'modal-demo',
    contato:    'modal-contato'
  };
  var id = idMap[type];
  if (!id) return;

  // Plan pill for cadastro
  if (type === 'cadastro' && plan) {
    var pillEl = document.getElementById('cadastro-plan-pill');
    if (pillEl) {
      if (plan === 'free')   { pillEl.textContent = '📋 Plano Gratuito — para sempre'; pillEl.className = 'plan-pill basico'; }
      if (plan === 'basico') { pillEl.textContent = '📋 Plano Básico — 7 dias grátis'; pillEl.className = 'plan-pill basico'; }
      if (plan === 'pro')    { pillEl.textContent = '⭐ Plano Profissional — 7 dias grátis'; pillEl.className = 'plan-pill pro'; }
    }
    goStep(1);
  }

  var overlay = document.getElementById(id);
  if (overlay) {
    overlay.classList.add('show');
    _currentModal = id;
    document.body.style.overflow = 'hidden';
    if (type === 'demo') {
      goScreen(1);
      setTimeout(startDemoLoop, 600);
    }
  }
}

function openPage(e, type) {
  if (e && e.preventDefault) e.preventDefault();
  var idMap = { termos: 'page-termos', privacidade: 'page-privacidade' };
  var id = idMap[type];
  if (!id) return;
  var overlay = document.getElementById(id);
  if (overlay) { overlay.classList.add('show'); _currentModal = id; document.body.style.overflow = 'hidden'; }
}

function closeModal(id) {
  var targetId = id || _currentModal;
  var overlay = document.getElementById(targetId);
  if (overlay) overlay.classList.remove('show');
  if (targetId === 'modal-demo') stopDemoLoop();
  _currentModal = null;
  document.body.style.overflow = '';
}

function closeOnOverlay(e, id) {
  if (e.target === document.getElementById(id)) closeModal(id);
}

function switchModal(from, to) {
  closeModal(from);
  setTimeout(function () {
    var overlay = document.getElementById(to);
    if (overlay) { overlay.classList.add('show'); _currentModal = to; document.body.style.overflow = 'hidden'; }
  }, 200);
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && _currentModal) closeModal(_currentModal);
});

// ── CADASTRO STEPS ──
function goStep(n) {
  [1, 2, 3].forEach(function (i) {
    var el = document.getElementById('cadastro-step-' + i);
    if (el) el.style.display = i === n ? 'block' : 'none';
    var dot = document.getElementById('step' + i);
    if (dot) {
      dot.className = 'step-dot';
      if (i < n) dot.classList.add('done');
      else if (i === n) dot.classList.add('active');
    }
  });
}

// ── ENTERPRISE SUBMIT ──
function submitEnterprise() {
  showToast('✓ Recebemos! Entraremos em contato em até 24h.');
  setTimeout(function () { closeModal('modal-enterprise'); }, 400);
}

// ── OPEN APP (demo) ──
function openApp() {
  closeModal('modal-demo');
  showToast('Abrindo TaxShift PRO... 🚀');
  setTimeout(function () { window.location.href = 'https://app.taxshift.com.br'; }, 300);
}

// ── TOAST ──
var _toastTimer;
function showToast(msg, icon) {
  icon = icon || '✓';
  clearTimeout(_toastTimer);
  var t = document.getElementById('toast');
  if (!t) return;
  document.getElementById('toast-msg').textContent = msg;
  document.getElementById('toast-icon').textContent = icon;
  t.style.background = '#0d0e11';
  t.classList.add('show');
  _toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3500);
}

// ── FAQ ──
function toggleFaq(el) {
  var isOpen = el.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(function (f) { f.classList.remove('open'); });
  if (!isOpen) el.classList.add('open');
}

// ── SCROLL ANIMATIONS ──
var observer = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      var children = entry.target.querySelectorAll('.feat-card,.prob-item,.hiw-step,.plan-card,.testi-card');
      children.forEach(function (child, i) {
        child.style.transitionDelay = (i * 0.07) + 's';
        child.style.opacity = '0';
        child.style.transform = 'translateY(14px)';
        child.style.transition = 'opacity .45s ease, transform .45s ease';
        setTimeout(function () {
          child.style.opacity = '1';
          child.style.transform = 'translateY(0)';
        }, i * 70 + 80);
      });
    }
  });
}, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });

// Add animate class after brief delay so above-fold content shows immediately
setTimeout(function() {
  document.querySelectorAll('.fade-up').forEach(function (el) {
    el.classList.add('animate');
    observer.observe(el);
  });
}, 100);

// ── NAV SCROLL ──
window.addEventListener('scroll', function () {
  var y = window.scrollY;
  var nav = document.querySelector('nav');
  if (nav) nav.style.boxShadow = y > 10 ? '0 1px 0 #e5e7eb,0 4px 20px rgba(13,14,17,.08)' : 'none';
  document.querySelectorAll('section[id]').forEach(function (s) {
    if (y >= s.offsetTop - 90) {
      document.querySelectorAll('.nav-links a').forEach(function (a) { a.style.color = ''; });
      var link = document.querySelector('.nav-links a[href="#' + s.id + '"]');
      if (link) link.style.color = '#0d0e11';
    }
  });
});

// ── SCROLL HELPERS ──
function scrollToTop(e) { if (e) e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function scrollToPlanos(e) { if (e) e.preventDefault(); var el = document.getElementById('planos'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }

// ── HERO NUMBER ANIMATION ──
setTimeout(function () {
  function animNum(el, target) {
    if (!el) return;
    var v = 0; var step = Math.ceil(target / 36);
    var t = setInterval(function () { v = Math.min(v + step, target); el.textContent = v; if (v >= target) clearInterval(t); }, 28);
  }
  var vals = document.querySelectorAll('.dp-kpi-val');
  animNum(vals[0], 47);
  animNum(vals[2], 12);
}, 900);

// ── MOBILE NAV ──
(function () {
  var navEl = document.querySelector('.nav-inner');
  if (!navEl) return;
  var btn = document.createElement('button');
  btn.innerHTML = '☰';
  btn.id = 'nav-mobile-btn';
  btn.style.cssText = 'display:none;background:none;border:1px solid #e5e7eb;color:#6b7280;padding:6px 10px;border-radius:6px;font-size:16px;cursor:pointer;';
  navEl.appendChild(btn);
  var links = document.querySelector('.nav-links');
  var open = false;
  btn.addEventListener('click', function () {
    open = !open;
    links.style.cssText = open ? 'display:flex;flex-direction:column;position:absolute;top:60px;left:0;right:0;background:#fff;border-bottom:1px solid #e5e7eb;padding:12px 24px 16px;gap:12px;z-index:99;box-shadow:0 8px 24px rgba(13,14,17,.08);' : '';
    btn.innerHTML = open ? '✕' : '☰';
  });
  var mq = window.matchMedia('(max-width:900px)');
  function checkMobile() {
    btn.style.display = mq.matches ? 'block' : 'none';
    if (!mq.matches) { links.style.cssText = ''; open = false; btn.innerHTML = '☰'; }
  }
  mq.addEventListener('change', checkMobile);
  checkMobile();
})();
