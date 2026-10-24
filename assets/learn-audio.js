/*! Shared TTS + answer sounds for Eshan/Joshua learning apps (not used on silent Read pages).
 * Uses browser speech when a matching voice exists; otherwise Google Translate TTS
 * (needed for Malayalam on most phones/browsers). */
(function (w) {
  if (w.LearnAudio && w.LearnAudio._v2) return;
  var actx = null;
  var audioEl = null;
  var speakTok = 0;

  function ctx() {
    try {
      actx = actx || new (w.AudioContext || w.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
    } catch (e) {}
    return actx;
  }
  function tone(freqs, step, type, vol) {
    try {
      var c = ctx(); if (!c) return;
      var t0 = c.currentTime;
      freqs.forEach(function (f, k) {
        var o = c.createOscillator(), g = c.createGain();
        o.type = type || 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0 + k * step);
        g.gain.exponentialRampToValueAtTime(vol || 0.28, t0 + k * step + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + (k + 1) * step);
        o.connect(g); g.connect(c.destination);
        o.start(t0 + k * step); o.stop(t0 + (k + 1) * step + 0.04);
      });
    } catch (e) {}
  }
  function langCode(lang) {
    return String(lang || 'en').replace('_', '-').slice(0, 2).toLowerCase();
  }
  function pickVoice(lang) {
    try {
      var voices = w.speechSynthesis.getVoices() || [];
      var pref = langCode(lang);
      return voices.find(function (v) { return v.lang && v.lang.toLowerCase().replace('_', '-').indexOf(pref) === 0; })
        || voices.find(function (v) { return v.lang && v.lang.toLowerCase().indexOf(pref) >= 0; })
        || null;
    } catch (e) { return null; }
  }
  function gttsUrl(text, lang) {
    var tl = langCode(lang);
    // Google translate_tts works well for ml, hi, en
    return 'https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=' + tl
      + '&q=' + encodeURIComponent(String(text).slice(0, 180));
  }
  function playRemote(text, lang, el, mine) {
    return new Promise(function (resolve) {
      try {
        if (audioEl) { try { audioEl.pause(); } catch (e) {} audioEl = null; }
        audioEl = new Audio(gttsUrl(text, lang));
        audioEl.onended = function () {
          if (el && mine === speakTok) el.classList.remove('playing');
          resolve(true);
        };
        audioEl.onerror = function () {
          if (el && mine === speakTok) el.classList.remove('playing');
          resolve(false);
        };
        var p = audioEl.play();
        if (p && p.catch) p.catch(function () {
          if (el && mine === speakTok) el.classList.remove('playing');
          resolve(false);
        });
      } catch (e) {
        if (el && mine === speakTok) el.classList.remove('playing');
        resolve(false);
      }
    });
  }

  var LearnAudio = {
    _v2: true,
    ding: function () { tone([660, 880, 1175], 0.1, 'sine', 0.32); },
    buzz: function () { tone([220, 165], 0.16, 'triangle', 0.28); },
    stop: function () {
      speakTok++;
      try { w.speechSynthesis.cancel(); } catch (e) {}
      if (audioEl) {
        try { audioEl.pause(); audioEl.removeAttribute('src'); audioEl.load(); } catch (e2) {}
        audioEl = null;
      }
      try {
        document.querySelectorAll('.playing').forEach(function (e) { e.classList.remove('playing'); });
      } catch (e3) {}
    },
    /**
     * Speak text. For Malayalam always uses online TTS (phones rarely have ml voices).
     * Other languages: try device voice first, then online TTS fallback.
     */
    speak: function (text, lang, rate, el) {
      if (!text) return Promise.resolve(false);
      this.stop();
      var mine = speakTok;
      var L = lang || 'en-IN';
      var code = langCode(L);
      if (el) el.classList.add('playing');

      // Malayalam: device voices almost never exist — go straight to online TTS
      if (code === 'ml') {
        return playRemote(text, L, el, mine);
      }

      var voice = pickVoice(L);
      if (voice && w.speechSynthesis) {
        return new Promise(function (resolve) {
          try {
            var u = new SpeechSynthesisUtterance(String(text));
            u.lang = L;
            u.rate = rate || 0.92;
            u.voice = voice;
            u.onend = function () {
              if (el && mine === speakTok) el.classList.remove('playing');
              resolve(true);
            };
            u.onerror = function () {
              // fall back to online TTS
              playRemote(text, L, el, mine).then(resolve);
            };
            w.speechSynthesis.speak(u);
          } catch (e) {
            playRemote(text, L, el, mine).then(resolve);
          }
        });
      }
      // No matching voice → online TTS
      return playRemote(text, L, el, mine);
    },
    escAttr: function (s) {
      return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ').replace(/\r/g, '');
    },
    btn: function (text, lang) {
      var t = this.escAttr(text || '');
      var l = this.escAttr(lang || 'en-IN');
      return '<button type="button" class="la-say" title="Listen" aria-label="Listen" onclick="LearnAudio.speak(\'' + t + '\',\'' + l + '\',0.92,this)">🔊</button>';
    },
    result: function (ok) { if (ok) this.ding(); else this.buzz(); }
  };

  try { if (w.speechSynthesis) w.speechSynthesis.getVoices(); } catch (e) {}
  try { w.speechSynthesis.onvoiceschanged = function () {}; } catch (e) {}
  w.LearnAudio = LearnAudio;
  if (!w.ding) w.ding = function () { LearnAudio.ding(); };
  if (!w.buzz) w.buzz = function () { LearnAudio.buzz(); };
})(window);
