/* Rumo Digital — scripts do site (sem nenhuma chave secreta aqui) */
{
  // ===== Configuração pública =====
  const GA_ID = 'G-SNCYSRBL9N';  // ID do Google Analytics 4 (ex.: G-ABC123XYZ). Vazio = não carrega nada.
  const ENDPOINT = 'https://script.google.com/macros/s/AKfycbx2aU2V3wkFM6_wodKZBwkGOioRxiGF-3lnjzavrTGsbSUrYNA1nOseVGlr8KK3YCQzAA/exec';

  // ===== Consentimento de cookies (LGPD) + Google Analytics só após aceite =====
  const CHAVE = 'rumo_consent_v1';
  const ler = () => { try { return localStorage.getItem(CHAVE); } catch (e) { return null; } };
  const gravar = v => { try { localStorage.setItem(CHAVE, v); } catch (e) {} };
  const carregarGA = () => {
    if (!GA_ID || window.__ga) return;
    window.__ga = true;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip: true });
  };
  const banner = document.getElementById('cookie');
  const escolha = ler();
  if (escolha === 'aceito') carregarGA();
  if (banner && !escolha) banner.classList.add('on');
  document.querySelectorAll('[data-cookie]').forEach(b => b.addEventListener('click', () => {
    const v = b.dataset.cookie;
    gravar(v);
    banner && banner.classList.remove('on');
    if (v === 'aceito') carregarGA();
  }));
  document.querySelectorAll('[data-abrir-cookies]').forEach(a => a.addEventListener('click', ev => {
    ev.preventDefault();
    banner && banner.classList.add('on');
  }));
  const evento = (nome, dados) => { if (window.gtag) window.gtag('event', nome, dados || {}); };
  document.querySelectorAll('a[href*="wa.me"]').forEach(a => a.addEventListener('click', () => evento('clique_whatsapp')));

  // ===== Mapa da linha do cliente (só na página inicial) =====
  const box = document.getElementById('mapa');
  if (box) {
    const estacoes = ['Captação', 'Atendimento', 'Proposta', 'Contrato', 'Pagamento', 'Pós-venda'];
    const agentes = ['formulário e anúncios', 'IA no WhatsApp', 'Docs em 1 clique', 'gerado ao fechar', 'Pix e baixa', 'avaliação e indicação'];
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    box.appendChild(svg);
    const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let pontos = [];
    let t0 = null;
    let vagao = null;
    const posicionar = f => {
      if (!vagao || pontos.length < 2) return;
      const seg = pontos.length - 1;
      const k = Math.min(seg - 1e-6, f * seg);
      const i = Math.floor(k), r = k - i;
      const a = pontos[i], b = pontos[i + 1];
      vagao.setAttribute('transform', 'translate(' + (a[0] + (b[0] - a[0]) * r) + ' ' + (a[1] + (b[1] - a[1]) * r) + ')');
    };
    const desenhar = () => {
      const W = box.clientWidth, H = box.clientHeight;
      const vertical = W < 520;
      const n = estacoes.length;
      pontos = estacoes.map((_, i) => {
        if (vertical) return [70, 40 + i * ((H - 80) / (n - 1))];
        const m = Math.min(100, W * 0.09);
        return [m + i * ((W - 2 * m) / (n - 1)), H * 0.52 + (i % 2 ? -1 : 1) * H * 0.08];
      });
      const path = pontos.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
      const rotulo = (p, i) => {
        if (vertical) return '<text x="' + (p[0] + 34) + '" y="' + (p[1] - 2) + '" class="n">' + estacoes[i] + '</text><text x="' + (p[0] + 34) + '" y="' + (p[1] + 18) + '" class="s">' + agentes[i] + '</text>';
        const y1 = i % 2 ? p[1] - 42 : p[1] + 46;
        return '<text x="' + p[0] + '" y="' + y1 + '" text-anchor="middle" class="n">' + estacoes[i] + '</text><text x="' + p[0] + '" y="' + (y1 + 20) + '" text-anchor="middle" class="s">' + agentes[i] + '</text>';
      };
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.innerHTML =
        '<style>.n{font:700 16px "Inter Tight",Inter,sans-serif;fill:#f2fbf6}.s{font:500 13px Inter,sans-serif;fill:#9fc4b7}</style>' +
        '<path d="' + path + '" fill="none" stroke="#0f5a4d" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="' + path + '" fill="none" stroke="#c9ec8b" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>' +
        pontos.map((p, i) => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="15" fill="#003129" stroke="#c9ec8b" stroke-width="5"/>' +
          '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" fill="' + (i === n - 1 ? '#ff6f59' : '#e6f5c8') + '"/>' + rotulo(p, i)).join('') +
        '<g id="vagao"><circle r="13" fill="#ff6f59" stroke="#003129" stroke-width="3"/><circle r="4" fill="#003129"/></g>';
      vagao = svg.querySelector('#vagao');
      posicionar(reduz ? 0.999 : 0);
    };
    const animar = ts => {
      if (t0 === null) t0 = ts;
      const f = ((ts - t0) % 9000) / 9000;
      posicionar(f < 0.88 ? f / 0.88 : 0.999);
      requestAnimationFrame(animar);
    };
    const roMapa = new ResizeObserver(desenhar);
    roMapa.observe(box);
    desenhar();
    if (!reduz) requestAnimationFrame(animar);
  }

  // ===== Formulário de contato: validação + anti-spam =====
  const form = document.getElementById('form-lead');
  if (form) {
    const inicio = Date.now();
    const status = document.getElementById('form-status');
    const regras = {
      nome: v => v.trim().length >= 2 || 'Digite seu nome.',
      whatsapp: v => { const d = v.replace(/\D/g, ''); return (d.length >= 10 && d.length <= 13) || 'Digite o WhatsApp com DDD, ex.: (11) 91234-5678.'; },
      email: v => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Este e-mail parece incompleto.'
    };
    const checar = campo => {
      const regra = regras[campo.name];
      if (!regra) return true;
      const r = regra(campo.value);
      const msg = r === true ? '' : r;
      campo.setAttribute('aria-invalid', msg ? 'true' : 'false');
      const alvo = document.getElementById('erro-' + campo.name);
      if (alvo) alvo.textContent = msg;
      return !msg;
    };
    form.querySelectorAll('input').forEach(c => c.addEventListener('blur', () => checar(c)));
    const zap = form.querySelector('[name=whatsapp]');
    zap.addEventListener('input', () => {
      const d = zap.value.replace(/\D/g, '').slice(0, 11);
      zap.value = d.length > 6 ? '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(-4) : d.length > 2 ? '(' + d.slice(0, 2) + ') ' + d.slice(2) : d;
    });
    form.addEventListener('submit', ev => {
      ev.preventDefault();
      const campos = [...form.querySelectorAll('input[name=nome],input[name=whatsapp],input[name=email]')];
      const validos = campos.map(checar).every(Boolean);
      if (!validos) { const p = campos.find(c => c.getAttribute('aria-invalid') === 'true'); p && p.focus(); status.textContent = 'Confira os campos marcados.'; return; }
      const dados = new URLSearchParams(new FormData(form));
      dados.set('acao', 'lead');
      dados.set('t', String(Date.now() - inicio));
      dados.set('ofertas', form.querySelector('[name=ofertas_chk]').checked ? 'sim' : 'nao');
      const params = new URLSearchParams(location.search);
      dados.set('origem', params.get('utm_source') || 'Site');
      const botao = form.querySelector('button[type=submit]');
      botao.disabled = true;
      status.textContent = 'Enviando…';
      fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: dados })
        .then(() => { evento('generate_lead'); location.href = 'obrigado.html'; })
        .catch(() => { botao.disabled = false; status.textContent = 'Não conseguimos enviar agora. Chame no WhatsApp: (11) 95555-0100.'; });
    });
  }

  document.querySelectorAll('[data-ano]').forEach(el => { el.textContent = new Date().getFullYear(); });
}
