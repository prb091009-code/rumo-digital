/* Go Experts — scripts do site. Nenhuma chave secreta fica aqui: o site é público. */
(() => {
  'use strict';
  document.documentElement.classList.remove('no-js');

  // ===== Configuração pública =====
  const CFG = {
    GA_ID: '',  // ID do Google Analytics 4 (G-XXXX). Vazio = não carrega nada.
    ENDPOINT: 'https://script.google.com/macros/s/AKfycbx2aU2V3wkFM6_wodKZBwkGOioRxiGF-3lnjzavrTGsbSUrYNA1nOseVGlr8KK3YCQzAA/exec',
    // Links de assinatura criados no painel do Mercado Pago (Assinaturas > Criar plano). Vazio = abre o cadastro.
    PAGAMENTO: { presenca: '' }
  };
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===== Cookies (LGPD): Analytics só depois do aceite =====
  const CH = 'goexperts_consent_v2';
  const ler = () => { try { return localStorage.getItem(CH); } catch (e) { return null; } };
  const gravar = v => { try { localStorage.setItem(CH, v); } catch (e) {} };
  const carregarGA = () => {
    if (!CFG.GA_ID || window.__ga) return;
    window.__ga = true;
    const s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CFG.GA_ID);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date()); window.gtag('config', CFG.GA_ID, { anonymize_ip: true });
  };
  const evento = (n, d) => { if (window.gtag) window.gtag('event', n, d || {}); };
  const banner = $('#cookie');
  if (ler() === 'aceito') carregarGA();
  if (banner && !ler() && CFG.GA_ID) setTimeout(() => banner.classList.add('on'), 1200);
  $$('[data-cookie]').forEach(b => b.addEventListener('click', () => {
    gravar(b.dataset.cookie); banner.classList.remove('on');
    if (b.dataset.cookie === 'aceito') carregarGA();
  }));
  $$('[data-abrir-cookies]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); banner && banner.classList.add('on'); }));
  $$('[data-ano]').forEach(e => { e.textContent = new Date().getFullYear(); });

  // ===== Revelação suave na rolagem =====
  const rvs = $$('.rv');
  if ('IntersectionObserver' in window && !reduz) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px', threshold: .08 });
    rvs.forEach(el => io.observe(el));
  } else rvs.forEach(el => el.classList.add('vis'));

  // Barra de navegação escura sobre seções escuras
  const nav = $('.nav');
  const escuras = $$('[data-escura]');
  if (nav && escuras.length && 'IntersectionObserver' in window) {
    const vis = new Set();
    const io2 = new IntersectionObserver(es => {
      es.forEach(e => e.isIntersecting ? vis.add(e.target) : vis.delete(e.target));
      nav.classList.toggle('escura', vis.size > 0);
    }, { rootMargin: '-52px 0px -92% 0px' });
    escuras.forEach(s => io2.observe(s));
  }

  // Carrossel de categorias
  const carro = $('#carro');
  $$('[data-rolar]').forEach(b => b.addEventListener('click', () => {
    if (carro) carro.scrollBy({ left: (b.dataset.rolar === '1' ? 1 : -1) * Math.min(carro.clientWidth * .8, 720), behavior: reduz ? 'auto' : 'smooth' });
  }));

  // Números que contam
  $$('[data-contar]').forEach(el => {
    const alvo = +el.dataset.contar, suf = el.dataset.suf || '';
    if (reduz || !('IntersectionObserver' in window)) { el.textContent = alvo + suf; return; }
    const io3 = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return; io3.disconnect();
      const t0 = performance.now(), dur = 1400;
      const passo = t => { const k = Math.min(1, (t - t0) / dur), v = Math.round(alvo * (1 - Math.pow(1 - k, 3))); el.textContent = v + suf; if (k < 1) requestAnimationFrame(passo); };
      requestAnimationFrame(passo);
    });
    io3.observe(el);
  });

  // ===== Catálogo (471 serviços) =====
  let CAT = null, INDICE = [];
  const carregarCatalogo = () => CAT ? Promise.resolve(CAT) : fetch('catalogo.json').then(r => r.json()).then(j => {
    CAT = j;
    INDICE = j.s.map(s => ({ nome: s[0], cat: s[1], ag: s[2], rec: s[3], chaves: [norm(s[0])].concat((s[4] || []).map(norm)) }));
    return j;
  });
  const buscar = q => {
    const n = norm(q); if (!n) return [];
    const termos = n.split(' ');
    const res = [];
    for (const it of INDICE) {
      let melhor = 0;
      for (const k of it.chaves) {
        let p = 0;
        if (k === n) p = 100; else if (k.startsWith(n)) p = 80; else if ((' ' + k).includes(' ' + n)) p = 60;
        else if (termos.every(t => k.includes(t))) p = 40;
        if (p) p -= k.length / 100;
        if (p > melhor) melhor = p;
      }
      if (!melhor && norm(it.cat).includes(n)) melhor = 20;
      if (melhor) res.push([melhor, it]);
    }
    return res.sort((a, b) => b[0] - a[0]).slice(0, 8).map(r => r[1]);
  };

  // ===== Busca com sugestões =====
  const inp = $('#q'), lista = $('#sug');
  let itens = [], ativo = -1;
  const fecharSug = () => { if (!lista) return; lista.classList.remove('on'); inp.setAttribute('aria-expanded', 'false'); ativo = -1; };
  const marcar = i => { ativo = i; $$('li', lista).forEach((li, k) => li.setAttribute('aria-selected', k === i ? 'true' : 'false')); if (i >= 0) inp.setAttribute('aria-activedescendant', 'op' + i); };
  const desenhar = () => {
    itens = buscar(inp.value);
    if (!inp.value.trim()) { fecharSug(); return; }
    lista.innerHTML = itens.length
      ? itens.map((it, i) => '<li role="option" id="op' + i + '" aria-selected="false" data-i="' + i + '">' + esc(it.nome) + '<small>' + esc(it.cat) + '</small></li>').join('')
      : '<li class="vazio" role="option" aria-disabled="true">Não achamos esse nome. Toque em “Buscar” e descreva com suas palavras.</li>';
    lista.classList.add('on'); inp.setAttribute('aria-expanded', 'true'); ativo = -1;
  };
  if (inp && lista) {
    inp.addEventListener('focus', () => carregarCatalogo().then(() => inp.value && desenhar()), { once: false });
    inp.addEventListener('input', () => carregarCatalogo().then(desenhar));
    inp.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' && itens.length) { e.preventDefault(); marcar(Math.min(itens.length - 1, ativo + 1)); }
      else if (e.key === 'ArrowUp' && itens.length) { e.preventDefault(); marcar(Math.max(0, ativo - 1)); }
      else if (e.key === 'Escape') fecharSug();
    });
    lista.addEventListener('mousedown', e => e.preventDefault());
    lista.addEventListener('click', e => { const li = e.target.closest('li[data-i]'); if (li) { fecharSug(); abrirPedido(itens[+li.dataset.i]); } });
    document.addEventListener('click', e => { if (!e.target.closest('.busca')) fecharSug(); });
    $('#form-busca').addEventListener('submit', e => {
      e.preventDefault();
      carregarCatalogo().then(() => {
        const sel = ativo >= 0 ? itens[ativo] : null;
        fecharSug();
        abrirPedido(sel, inp.value.trim());
      });
    });
    // placeholder que se escreve sozinho
    const exemplos = ['eletricista para trocar o chuveiro', 'fotógrafo para casamento', 'aula de inglês online', 'limpeza pós-obra', 'contador para MEI', 'conserto de geladeira'];
    if (!reduz) {
      let ei = 0, ci = 0, apagando = false;
      const tick = () => {
        if (document.activeElement === inp || inp.value) { setTimeout(tick, 1500); return; }
        const ex = exemplos[ei];
        ci += apagando ? -1 : 1;
        inp.placeholder = 'Ex.: ' + ex.slice(0, ci);
        let d = apagando ? 28 : 55;
        if (!apagando && ci === ex.length) { apagando = true; d = 1800; }
        else if (apagando && ci === 0) { apagando = false; ei = (ei + 1) % exemplos.length; d = 300; }
        setTimeout(tick, d);
      };
      setTimeout(tick, 1200);
    }
  }
  $$('[data-servico]').forEach(b => b.addEventListener('click', () => carregarCatalogo().then(() => {
    const it = INDICE.find(x => x.nome === b.dataset.servico) || buscar(b.dataset.servico)[0];
    abrirPedido(it, b.dataset.servico);
  })));
  $$('[data-categoria]').forEach(b => b.addEventListener('click', () => carregarCatalogo().then(() => {
    const c = b.dataset.categoria;
    abrirCategoria(c);
  })));
  $$('[data-pro]').forEach(b => b.addEventListener('click', e => {
    const plano = b.dataset.pro;
    const link = CFG.PAGAMENTO[plano];
    if (link) { evento('assinar', { plano }); return; }  // o href já aponta para o Mercado Pago
    e.preventDefault(); abrirProfissional(plano);
  }));
  $$('[data-pro]').forEach(b => { const l = CFG.PAGAMENTO[b.dataset.pro]; if (l && /^https:\/\/(www\.)?mercadopago\.com\.br\//.test(l)) { b.href = l; b.target = '_blank'; b.rel = 'noopener'; } });
  $$('[data-pedido]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); carregarCatalogo().then(() => abrirPedido(null, '')); }));

  // ===== Painel de pedido (perguntas uma de cada vez) =====
  const folha = $('#folha'), caixa = $('#caixa');
  let ultimoFoco = null, estado = null;
  const SENSIVEIS = ['Saúde', 'Jurídico'];
  const abrirFolha = () => {
    ultimoFoco = document.activeElement;
    folha.classList.add('on'); document.body.style.overflow = 'hidden';
    setTimeout(() => { const f = $('button:not(.fechar), input, textarea', caixa); f && f.focus(); }, 60);
  };
  const fecharFolha = () => { folha.classList.remove('on'); document.body.style.overflow = ''; estado = null; ultimoFoco && ultimoFoco.focus && ultimoFoco.focus(); };
  if (folha) {
    folha.addEventListener('click', e => { if (e.target === folha || e.target.closest('.fechar')) fecharFolha(); });
    document.addEventListener('keydown', e => {
      if (!folha.classList.contains('on')) return;
      if (e.key === 'Escape') fecharFolha();
      if (e.key === 'Tab') { // mantém o foco dentro do painel
        const fs = $$('button, input, textarea, a[href]', caixa).filter(x => !x.disabled && x.offsetParent);
        if (!fs.length) return;
        if (e.shiftKey && document.activeElement === fs[0]) { e.preventDefault(); fs[fs.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === fs[fs.length - 1]) { e.preventDefault(); fs[0].focus(); }
      }
    });
  }
  const cabecalho = (ag, sub, prog) => '<button class="fechar" type="button" aria-label="Fechar">×</button>' +
    '<div class="assist"><div class="av" aria-hidden="true">' + esc(ag.n[0]) + '</div><div><b>' + esc(ag.n) + '</b><small>' + esc(sub) + '</small></div></div>' +
    '<div class="barra" aria-hidden="true"><i style="width:' + prog + '%"></i></div>';
  const AG_PADRAO = { n: 'Go', r: 'assistente virtual', w: 'Conte o que você precisa com suas palavras. Eu organizo o pedido para os profissionais.' };

  function abrirCategoria(cat) {
    const servs = INDICE.filter(s => s.cat === cat);
    const ag = Object.values(CAT.a).find(a => a.c === cat) || AG_PADRAO;
    caixa.innerHTML = cabecalho(ag, 'Assistente virtual · ' + cat, 6) +
      '<div class="balao">' + esc(ag.w) + '</div><div class="pergunta"><h3>Qual destes serviços você precisa?</h3>' +
      '<div class="opcoes">' + servs.map((s, i) => '<button type="button" data-k="' + i + '">' + esc(s.nome) + '</button>').join('') + '</div></div>';
    $$('.opcoes button', caixa).forEach(b => b.addEventListener('click', () => abrirPedido(servs[+b.dataset.k])));
    abrirFolha();
  }

  function abrirPedido(serv, texto) {
    evento('abrir_pedido', { servico: serv ? serv.nome : 'livre' });
    const ag = serv && CAT && CAT.a[serv.ag] ? CAT.a[serv.ag] : AG_PADRAO;
    let pergs = serv && CAT && CAT.r[serv.rec] ? CAT.r[serv.rec].slice() : [];
    const sensivel = serv && SENSIVEIS.includes(serv.cat);
    if (sensivel) pergs = pergs.slice(0, 1);
    estado = { tipo: 'cliente', serv, ag, sensivel, pergs, resp: {}, passo: 0, texto: texto || '', t0: Date.now() };
    if (!serv) estado.pergs = [{ l: 'O que você precisa resolver?', h: 'Escreva como falaria com um amigo. Ex.: “preciso consertar um vazamento na cozinha amanhã”.', livre: true }, { l: 'Para quando você precisa?', o: ['Hoje ou amanhã', 'Nesta semana', 'Neste mês', 'Sem pressa', 'Não sei ainda'] }];
    else estado.pergs.push({ l: 'Quer contar mais algum detalhe?', h: 'Opcional. ' + (sensivel ? 'Não escreva aqui informações de saúde ou de processos: isso fica para a conversa com o profissional.' : 'Quanto mais claro, melhores as propostas.'), livre: true, opc: true });
    if (!serv && texto) estado.resp[0] = texto;
    abrirFolha(); desenharPasso();
  }

  function abrirProfissional(plano) {
    evento('abrir_profissional', { plano: plano || '' });
    estado = { tipo: 'profissional', plano: plano || 'vitrine', ag: { n: 'Go', r: 'time Go Experts' }, resp: {}, passo: 0, t0: Date.now(),
      pergs: [
        { l: 'Que serviço você presta?', h: 'Ex.: eletricista, fotógrafa de casamento, contador, personal trainer.', livre: true },
        { l: 'Você atende como?', o: ['Pessoa física (autônomo)', 'MEI', 'Empresa (ME ou maior)', 'Ainda não sei'] },
        { l: 'Você já tem site ou perfil profissional?', o: ['Não tenho', 'Só Instagram', 'Tenho site', 'Tenho, mas não funciona bem'] }
      ] };
    abrirFolha(); desenharPasso();
  }

  function desenharPasso() {
    const e = estado, total = e.pergs.length + 1, prog = Math.round((e.passo + 1) / (total + 1) * 100);
    const sub = e.tipo === 'profissional' ? 'Cadastro de profissional' : 'Assistente virtual' + (e.serv ? ' · ' + e.serv.nome : '');
    if (e.passo < e.pergs.length) {
      const q = e.pergs[e.passo], r = e.resp[e.passo] || '';
      const abertura = e.passo === 0 ? '<div class="balao">' + esc(e.tipo === 'profissional' ? 'Que bom ter você aqui. São 4 passos rápidos para montarmos seu perfil.' : (e.ag.w || AG_PADRAO.w)) + '</div>' : '';
      caixa.innerHTML = cabecalho(e.ag, sub, prog) + abertura +
        '<div class="pergunta"><h3 id="pq">' + esc(q.l) + '</h3>' + (q.h ? '<p class="dica">' + esc(q.h) + '</p>' : '') +
        (q.o ? '<div class="opcoes" role="group" aria-labelledby="pq">' + q.o.map(o => '<button type="button" aria-pressed="' + (r === o) + '">' + esc(o) + '</button>').join('') + '</div>'
             : '<textarea id="resp" maxlength="240" aria-labelledby="pq">' + esc(r) + '</textarea>') +
        '</div><p class="erro" id="err" role="alert"></p><div class="navp">' +
        (e.passo > 0 ? '<button class="voltar" type="button">‹ Voltar</button>' : '<span></span>') +
        '<span>' + (q.opc || !q.o && !q.livre ? '<button class="pular" type="button">Pular</button> ' : '') +
        (q.o ? '<button class="pular" type="button">Não sei</button>' : '<button class="pill" type="button" id="seguir">Continuar</button>') + '</span></div>';
      $$('.opcoes button', caixa).forEach(b => b.addEventListener('click', () => { e.resp[e.passo] = b.textContent; e.passo++; desenharPasso(); }));
      const seguir = $('#seguir', caixa);
      seguir && seguir.addEventListener('click', () => {
        const v = ($('#resp', caixa).value || '').trim();
        if (!v && !q.opc) { $('#err', caixa).textContent = 'Escreva uma frase curta para continuar.'; return; }
        e.resp[e.passo] = v; e.passo++; desenharPasso();
      });
      $$('.pular', caixa).forEach(b => b.addEventListener('click', () => { e.resp[e.passo] = q.o ? 'Não sei ainda' : ''; e.passo++; desenharPasso(); }));
      const v = $('.voltar', caixa); v && v.addEventListener('click', () => { e.passo--; desenharPasso(); });
      const f = $('textarea', caixa) || $('.opcoes button', caixa); f && f.focus();
    } else desenharContato(prog, sub);
  }

  function desenharContato(prog, sub) {
    const e = estado;
    const linhas = e.pergs.map((q, i) => e.resp[i] ? '<div><span>' + esc(q.l.replace(/\?$/, '')) + '</span><b>' + esc(e.resp[i]) + '</b></div>' : '').join('');
    caixa.innerHTML = cabecalho(e.ag, sub, prog) +
      '<div class="pergunta"><h3>' + (e.tipo === 'profissional' ? 'Como falamos com você?' : 'Quase lá. Para quem enviamos as propostas?') + '</h3></div>' +
      (linhas ? '<div class="resumo" aria-label="Resumo">' + (e.serv ? '<div><span>Serviço</span><b>' + esc(e.serv.nome) + '</b></div>' : '') + linhas + '</div>' : '') +
      (e.sensivel ? '<p class="aviso">Pedidos de ' + esc(e.serv.cat.toLowerCase()) + ' seguem um fluxo restrito: nada é distribuído em massa e você escolhe com quem falar.</p>' : '') +
      '<form id="fc" novalidate>' +
      '<label class="rot" for="c-nome">Nome</label><input type="text" id="c-nome" autocomplete="name" maxlength="80" required>' +
      '<label class="rot" for="c-zap">WhatsApp com DDD</label><input type="tel" id="c-zap" inputmode="tel" autocomplete="tel" placeholder="(11) 91234-5678" required>' +
      '<label class="rot" for="c-cid">Cidade e bairro</label><input type="text" id="c-cid" autocomplete="address-level2" maxlength="60" placeholder="Ex.: Pinheiros, São Paulo">' +
      '<label class="rot" for="c-mail">E-mail (opcional)</label><input type="email" id="c-mail" autocomplete="email" maxlength="120">' +
      '<div class="isca" aria-hidden="true"><label for="c-site">Não preencha</label><input type="text" id="c-site" tabindex="-1" autocomplete="off"></div>' +
      (e.tipo === 'cliente' ? '<label class="check"><input type="checkbox" id="c-aut" checked> <span>Autorizo enviar este pedido a até 5 profissionais compatíveis.</span></label>' : '') +
      '<label class="check"><input type="checkbox" id="c-of"> <span>Quero receber novidades e ofertas (opcional).</span></label>' +
      '<p class="erro" id="err" role="alert"></p>' +
      '<div class="navp"><button class="voltar" type="button">‹ Voltar</button><button class="pill" type="submit">' + (e.tipo === 'profissional' ? 'Criar meu perfil' : 'Enviar pedido') + '</button></div>' +
      '<p class="legal">Usamos seus dados só para este pedido, conforme a <a href="privacidade.html">política de privacidade</a>. Você pode pedir para apagá-los quando quiser.</p></form>';
    const zap = $('#c-zap', caixa);
    zap.addEventListener('input', () => {
      const d = zap.value.replace(/\D/g, '').slice(0, 11);
      zap.value = d.length > 6 ? '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(-4) : d.length > 2 ? '(' + d.slice(0, 2) + ') ' + d.slice(2) : d;
    });
    $('.voltar', caixa).addEventListener('click', () => { e.passo--; desenharPasso(); });
    $('#c-nome', caixa).focus();
    $('#fc', caixa).addEventListener('submit', ev => { ev.preventDefault(); enviar(); });
  }

  function enviar() {
    const e = estado, err = $('#err', caixa), btn = $('#fc button[type=submit]', caixa);
    const nome = $('#c-nome', caixa).value.trim(), zap = $('#c-zap', caixa).value.replace(/\D/g, ''), mail = $('#c-mail', caixa).value.trim();
    const cid = $('#c-cid', caixa).value.trim();
    if (nome.length < 2) { err.textContent = 'Digite seu nome.'; $('#c-nome', caixa).focus(); return; }
    if (zap.length < 10 || zap.length > 11) { err.textContent = 'Confira o WhatsApp com DDD.'; $('#c-zap', caixa).focus(); return; }
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) { err.textContent = 'Confira o e-mail.'; $('#c-mail', caixa).focus(); return; }
    const aut = $('#c-aut', caixa);
    if (aut && !aut.checked) { err.textContent = 'Precisamos da sua autorização para enviar o pedido aos profissionais.'; return; }
    const partes = e.pergs.map((q, i) => e.resp[i] ? e.resp[i] : '').filter(Boolean);
    const cab = e.tipo === 'profissional' ? '[PROFISSIONAL · ' + e.plano + '] ' : '[PEDIDO] ' + (e.serv ? e.serv.nome + ' · ' : '');
    const interesse = (cab + (cid ? '(' + cid + ') ' : '') + partes.join(' | ')).slice(0, 300);
    const origem = ('Site Go Experts · ' + (e.tipo === 'profissional' ? 'Profissional' : (e.serv ? e.serv.cat : 'Pedido livre'))).slice(0, 60);
    const dados = new URLSearchParams({ acao: 'lead', nome, whatsapp: zap, email: mail, interesse, origem, ofertas: $('#c-of', caixa).checked ? 'sim' : 'nao', site_url: $('#c-site', caixa).value, t: String(Date.now() - e.t0) });
    const utm = new URLSearchParams(location.search).get('utm_source'); if (utm) dados.set('origem', (utm + ' · ' + origem).slice(0, 60));
    btn.disabled = true; btn.textContent = 'Enviando…'; err.textContent = '';
    fetch(CFG.ENDPOINT, { method: 'POST', mode: 'no-cors', body: dados })
      .then(() => {
        evento(e.tipo === 'profissional' ? 'cadastro_profissional' : 'pedido_enviado', { servico: e.serv ? e.serv.nome : '' });
        caixa.innerHTML = '<button class="fechar" type="button" aria-label="Fechar">×</button><div class="ok"><div class="sel" aria-hidden="true">✓</div>' +
          '<h3>' + (e.tipo === 'profissional' ? 'Recebemos seu cadastro.' : 'Pedido recebido.') + '</h3>' +
          '<p>Vamos chamar você no WhatsApp em até 15 minutos em horário comercial (seg a sex, 9h às 18h).</p>' +
          '<p style="margin-top:24px"><button class="pill" type="button" id="ok-f">Fechar</button></p></div>';
        $('#ok-f', caixa).addEventListener('click', fecharFolha); $('#ok-f', caixa).focus();
      })
      .catch(() => { btn.disabled = false; btn.textContent = 'Tentar de novo'; err.textContent = 'Sem conexão agora. Confira sua internet e tente de novo.'; });
  }
})();
