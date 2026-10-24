/*! Shared TTS + answer sounds for Eshan/Joshua learning apps (not used on silent Read pages). */
(function (w) {
  if (w.LearnAudio) return;
  var actx = null;
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
  function pickVoice(lang) {
    try {
      var voices = w.speechSynthesis.getVoices() || [];
      var pref = (lang || 'en').slice(0, 2).toLowerCase();
      return voices.find(function (v) { return v.lang && v.lang.toLowerCase().indexOf(pref) === 0; })
        || voices.find(function (v) { return v.lang && v.lang.toLowerCase().indexOf(pref) >= 0; })
        || null;
    } catch (e) { return null; }
  }
  var LearnAudio = {
    ding: function () { tone([660, 880, 1175], 0.1, 'sine', 0.32); },
    buzz: function () { tone([220, 165], 0.16, 'triangle', 0.28); },
    stop: function () { try { w.speechSynthesis.cancel(); } catch (e) {} },
    speak: function (text, lang, rate) {
      if (!text) return;
      try {
        this.stop();
        var u = new SpeechSynthesisUtterance(String(text));
        u.lang = lang || 'en-IN';
        u.rate = rate || 0.92;
        var v = pickVoice(u.lang);
        if (v) u.voice = v;
        w.speechSynthesis.speak(u);
      } catch (e) {}
    },
    /** Escape text for use inside HTML attribute onclick strings */
    escAttr: function (s) {
      return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ');
    },
    btn: function (text, lang) {
      var t = this.escAttr(text || '');
      var l = this.escAttr(lang || 'en-IN');
      return '<button type="button" class="la-say" title="Listen" aria-label="Listen" onclick="LearnAudio.speak(\'' + t + '\',\'' + l + '\')">🔊</button>';
    },
    result: function (ok) { if (ok) this.ding(); else this.buzz(); }
  };
  // Warm voices list on some browsers
  try { if (w.speechSynthesis) w.speechSynthesis.getVoices(); } catch (e) {}
  try { w.speechSynthesis.onvoiceschanged = function () {}; } catch (e) {}
  w.LearnAudio = LearnAudio;
  // Optional globals used by older pages
  if (!w.ding) w.ding = function () { LearnAudio.ding(); };
  if (!w.buzz) w.buzz = function () { LearnAudio.buzz(); };
})(window);
