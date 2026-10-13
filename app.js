/* Aprova: sem dependências, funciona inclusive via file://. */
(() => {
  'use strict';
  const BANK_VERSION = 'aprova-2026-10-v1';
  const KEY = `${BANK_VERSION}:progress`, THEME_KEY = 'aprova:theme';
  const bank = window.QUESTION_BANK;
  const byId = new Map(bank.map(q => [q.id, q]));
  function shuffle(values) {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function selectRound(seen, amount = 20) {
    const excluded = new Set(seen);
    const available = shuffle(bank.filter(q => !excluded.has(q.id)));
    const chosen = [], concepts = new Set();
    // Espalha conceitos na rodada, quando o restante do banco permite.
    for (const q of available) {
      if (chosen.length === amount) break;
      if (q.concepts.every(c => !concepts.has(c))) {
        chosen.push(q); q.concepts.forEach(c => concepts.add(c));
      }
    }
    for (const q of available) {
      if (chosen.length === amount) break;
      if (!chosen.includes(q)) chosen.push(q);
    }
    return chosen.map(q => ({ id: q.id, order: shuffle([0, 1, 2, 3, 4]) }));
  }
  function score(current, answers) {
    return current.reduce((total, q) => {
      const selected = answers[q.id];
      if (Number.isInteger(selected)) {
        total.answered++;
        if (byId.get(q.id).options[selected].correct) total.correct++;
        else total.wrong++;
      }
      return total;
    }, { correct: 0, wrong: 0, answered: 0 });
  }
  function validState(s) {
    if (!s || !Array.isArray(s.seen) || new Set(s.seen).size !== s.seen.length || !s.seen.every(id => byId.has(id))) return false;
    if (!Array.isArray(s.current) || s.current.length < 1 || s.current.length > 20 || new Set(s.current.map(q => q.id)).size !== s.current.length) return false;
    if (!Number.isInteger(s.index) || s.index < 0 || s.index >= s.current.length || !Number.isInteger(s.round) || s.round < 1 || typeof s.done !== 'boolean') return false;
    if (!s.answers || typeof s.answers !== 'object' || Array.isArray(s.answers)) return false;
    if (!s.current.every(q => byId.has(q.id) && Array.isArray(q.order) && q.order.length === 5 && new Set(q.order).size === 5 && q.order.every(x => Number.isInteger(x) && x >= 0 && x < 5))) return false;
    if (!Object.entries(s.answers).every(([id, a]) => s.current.some(q => q.id === id) && Number.isInteger(a) && a >= 0 && a < 5 && s.seen.includes(id))) return false;
    if (!s.current.slice(0, s.index).every(q => Number.isInteger(s.answers[q.id]))) return false;
    if (s.current.slice(s.index + 1).some(q => Number.isInteger(s.answers[q.id]))) return false;
    return !s.done || score(s.current, s.answers).answered === s.current.length;
  }
  window.QuizCore = { shuffle, selectRound, score, validState };
  document.addEventListener('DOMContentLoaded', () => {
    const $ = id => document.getElementById(id);
    let state, storageAvailable = true;
    const storage = {
      get(key) { try { return localStorage.getItem(key); } catch { storageAvailable = false; return null; } },
      set(key, value) { try { localStorage.setItem(key, value); } catch { storageAvailable = false; } }
    };
    function persist() {
      storage.set(KEY, JSON.stringify(state));
      $('storage-warning').hidden = storageAvailable;
      if (!storageAvailable) document.querySelector('.local-label').textContent = 'Progresso nesta sessão';
    }
    function makeState(seen = [], round = 1) {
      return { seen, round, current: selectRound(seen), answers: {}, index: 0, done: false, celebrated: false };
    }
    try { const parsed = JSON.parse(storage.get(KEY)); if (validState(parsed)) state = parsed; } catch { /* Histórico inválido: inicia estado íntegro. */ }
    if (!state) state = makeState();
    function setTheme(theme) {
      document.documentElement.dataset.theme = theme;
      $('theme').textContent = theme === 'dark' ? '☀' : '☾';
      $('theme').setAttribute('aria-label', theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro');
      document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#101522' : '#f5f6fa';
      storage.set(THEME_KEY, theme);
      $('storage-warning').hidden = storageAvailable;
    }
    const savedTheme = storage.get(THEME_KEY);
    setTheme(savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
    $('theme').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
    document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $(button.dataset.close).close()));
    $('sources').addEventListener('click', () => $('about').showModal());
    $('clear').addEventListener('click', () => $('clear-confirm').showModal());
    $('confirm-clear').addEventListener('click', () => {
      $('clear-confirm').close(); state = makeState(); persist(); render(); $('question-title').focus();
    });
    function updateBank() {
      const pct = state.seen.length / bank.length * 100;
      $('bank-percent').textContent = `${Math.floor(pct)}%`;
      $('bank-count').textContent = state.seen.length.toLocaleString('pt-BR');
      $('bank-bar').style.width = `${pct}%`;
      $('round-number').textContent = `RODADA ${String(state.round).padStart(2, '0')}`;
    }
    function render() {
      updateBank();
      $('quiz').hidden = state.done; $('results').hidden = !state.done;
      document.querySelector('.session-header>span:first-child').textContent = state.done ? '✓ TREINO CONCLUÍDO' : '● TREINO EM ANDAMENTO';
      if (state.done) { renderResults(); return; }
      const entry = state.current[state.index], q = byId.get(entry.id), selected = state.answers[q.id];
      const answered = Number.isInteger(selected);
      $('question-topic').textContent = q.topic;
      $('question-number').textContent = String(state.index + 1).padStart(2, '0');
      document.querySelector('.question-number>span').textContent = ` / ${state.current.length}`;
      $('question-kind').textContent = `${q.type} • ${q.id}`;
      $('question-title').textContent = q.prompt;
      $('round-bar').style.width = `${(state.index + (answered ? 1 : 0)) / state.current.length * 100}%`;
      $('options').replaceChildren();
      entry.order.forEach((optionIndex, position) => {
        const option = q.options[optionIndex];
        const button = document.createElement('button'); button.className = 'option';
        button.disabled = answered;
        const letter = document.createElement('span'); letter.className = 'option-letter'; letter.textContent = 'ABCDE'[position];
        const label = document.createElement('span'); label.className = 'option-text'; label.textContent = option.text;
        const indicator = document.createElement('span'); indicator.className = 'option-indicator'; indicator.setAttribute('aria-hidden', 'true');
        if (answered && option.correct) { button.classList.add('correct'); indicator.textContent = '✓'; }
        if (answered && optionIndex === selected && !option.correct) { button.classList.add('wrong'); indicator.textContent = '✕'; }
        button.setAttribute('aria-label', `${'ABCDE'[position]}. ${option.text}${answered && option.correct ? '. Resposta correta' : answered && optionIndex === selected ? '. Sua resposta incorreta' : ''}`);
        button.append(letter, label, indicator); button.addEventListener('click', () => answer(optionIndex)); $('options').append(button);
      });
      $('feedback').hidden = !answered;
      if (answered) {
        const chosen = q.options[selected], ok = chosen.correct;
        $('feedback').className = `feedback ${ok ? 'is-correct' : 'is-wrong'}`;
        $('feedback-emoji').textContent = ok ? '😄' : '😢';
        $('feedback-title').textContent = ok ? 'Resposta correta! Muito bem.' : 'Resposta incorreta. Vamos aprender?';
        $('option-feedback').textContent = chosen.explanation;
        $('explanation').textContent = q.explanation;
        $('reference').textContent = q.reference;
        const sources = q.sources || [q.source];
        $('source-link').href = sources[0];
        $('source-link-extra').hidden = sources.length < 2;
        if (sources.length > 1) $('source-link-extra').href = sources[1];
      }
      const tally = score(state.current, state.answers);
      $('live-score').textContent = `✓ ${tally.correct} ${tally.correct === 1 ? 'acerto' : 'acertos'} / ${tally.wrong} ${tally.wrong === 1 ? 'erro' : 'erros'}`;
      $('next').disabled = !answered;
      $('next').textContent = state.index === state.current.length - 1 ? 'Ver meu resultado →' : 'Próxima questão →';
    }
    function answer(optionIndex) {
      const q = byId.get(state.current[state.index].id);
      if (Number.isInteger(state.answers[q.id])) return;
      state.answers[q.id] = optionIndex;
      if (!state.seen.includes(q.id)) state.seen.push(q.id);
      persist(); render(); $('next').focus({ preventScroll: true });
      if (state.seen.length === bank.length && !state.celebrated) {
        state.celebrated = true; persist(); confetti(); $('celebrate').showModal();
      }
    }
    $('next').addEventListener('click', () => {
      if (!Number.isInteger(state.answers[state.current[state.index].id])) return;
      if (state.index < state.current.length - 1) state.index++;
      else state.done = true;
      persist(); render();
      if (state.done) { $('results').setAttribute('tabindex', '-1'); $('results').focus(); }
      else $('question-title').focus();
    });
    function renderResults() {
      const tally = score(state.current, state.answers), pct = Math.round(tally.correct / state.current.length * 100);
      $('accuracy').textContent = `${pct}%`; $('chart').style.setProperty('--percent', pct);
      $('chart').setAttribute('aria-label', `${pct}% de acertos e ${100 - pct}% de erros. ${tally.correct} acertos e ${tally.wrong} erros em ${state.current.length} questões.`);
      $('correct-total').textContent = `${tally.correct} de ${state.current.length} questões`;
      $('wrong-total').textContent = `${tally.wrong} de ${state.current.length} questões`;
      $('correct-percent').textContent = `${pct}%`; $('wrong-percent').textContent = `${100 - pct}%`;
      const performance = pct >= 80 ? ['🥳', 'Você está no caminho!', 'Excelente desempenho. Continue construindo sua aprovação.'] : pct >= 50 ? ['🙂', 'Cada treino faz diferença.', 'Você já conquistou uma boa base. Revise os erros e siga em frente.'] : ['😢', 'Seu próximo passo é aprender.', 'Não desanime. As explicações mostram exatamente o que revisar.'];
      $('result-emoji').textContent = performance[0]; $('result-title').textContent = performance[1]; $('result-message').textContent = performance[2];
      $('reset').textContent = state.seen.length === bank.length ? '↻ Novo ciclo · 20 questões' : '↻ Novo quiz · 20 questões';
      $('results').querySelector('.result-note').textContent = state.seen.length === bank.length ? 'Banco completo! A próxima rodada iniciará um novo ciclo.' : 'Uma nova rodada traz questões ainda não respondidas.';
      const topics = new Map();
      state.current.forEach(({ id }) => {
        const q = byId.get(id), stats = topics.get(q.topic) || { correct: 0, total: 0 };
        stats.total++; if (q.options[state.answers[id]].correct) stats.correct++;
        topics.set(q.topic, stats);
      });
      $('topic-results').replaceChildren();
      topics.forEach((stats, topic) => {
        const row = document.createElement('div'); row.className = 'topic-row';
        const label = document.createElement('span'); label.textContent = topic;
        const value = document.createElement('span'); value.textContent = `${stats.correct}/${stats.total} acertos`;
        row.append(label, value); $('topic-results').append(row);
      });
      $('review-list').hidden = true; $('review').textContent = 'Revisar respostas'; $('review').setAttribute('aria-expanded', 'false');
      $('review-list').replaceChildren();
      state.current.forEach(({ id }, i) => {
        const q = byId.get(id), selected = q.options[state.answers[id]], correct = q.options.find(o => o.correct);
        const details = document.createElement('details'), summary = document.createElement('summary');
        summary.textContent = `${selected.correct ? '✅' : '❌'} ${i + 1}. ${q.prompt}`;
        const answerText = document.createElement('p'); answerText.className = 'review-answer'; answerText.textContent = `Sua resposta: ${selected.text}\nGabarito: ${correct.text}`;
        const explanation = document.createElement('p'); explanation.textContent = `${q.explanation}\n\n${q.reference}`;
        details.append(summary, answerText, explanation); $('review-list').append(details);
      });
    }
    $('review').setAttribute('aria-controls', 'review-list');
    $('review').addEventListener('click', () => {
      $('review-list').hidden = !$('review-list').hidden;
      $('review').textContent = $('review-list').hidden ? 'Revisar respostas' : 'Ocultar revisão';
      $('review').setAttribute('aria-expanded', String(!$('review-list').hidden));
    });
    $('reset').addEventListener('click', () => {
      const seen = state.seen.length === bank.length ? [] : state.seen;
      state = makeState(seen, state.round + 1); persist(); render(); $('question-title').focus();
    });
    function confetti() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const container = $('confetti'); container.replaceChildren();
      for (let i = 0; i < 110; i++) {
        const piece = document.createElement('span'); piece.className = 'confetti-piece';
        piece.style.left = `${Math.random() * 100}%`; piece.style.background = ['#8b70ed', '#39bd96', '#f5c45d', '#ed789c', '#72b9f2'][i % 5];
        piece.style.animationDelay = `${Math.random() * 1.5}s`; piece.style.setProperty('--drift', `${Math.random() * 220 - 110}px`);
        container.append(piece);
      }
      setTimeout(() => container.replaceChildren(), 5500);
    }
    persist(); render(); $('welcome').showModal();
  });
})();
