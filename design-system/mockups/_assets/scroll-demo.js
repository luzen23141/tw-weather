/**
 * 設計稿的捲動行為驅動器。
 *
 * 示範三個 scroll-driven 行為，實作端對應 react-native-reanimated 的
 * useAnimatedScrollHandler + useAnimatedStyle：
 *
 *  1. 內容位移      —— translateY(-scrollY)
 *  2. 頂部精簡標題  —— scrollY 在 [FADE_FROM, FADE_TO] 間補間 opacity
 *  3. 導航欄收合    —— 依捲動「方向」而非位置切換，帶 DIR_THRESHOLD 防抖
 *
 * 方向判斷需要保存前一幀的 y。實作時這個值必須放在 shared value，
 * 不能用 useState —— 否則每幀都會觸發 re-render。
 */
(function (global) {
  var FADE_FROM = 115; // px，開始淡入精簡標題
  var FADE_TO = 170; // px，完全不透明
  var DIR_THRESHOLD = 0.6; // px，小於此位移不視為方向改變（防手指微顫閃爍）
  var COLLAPSE_AFTER = 50; // px，此距離內不收合，避免頂部輕觸就縮
  var CYCLE_MS = 4600; // 自動播放單程秒數

  function init(opts) {
    var device = document.querySelector(opts.device);
    var content = document.querySelector(opts.content);
    var header = document.querySelector(opts.header);
    var tabFull = document.querySelector(opts.tabFull);
    var tabMini = document.querySelector(opts.tabMini);
    var slider = document.querySelector(opts.slider);
    var toggle = document.querySelector(opts.toggle);

    if (!device || !content) return;

    var max = Math.max(1, content.scrollHeight - device.clientHeight);
    var y = 0;
    var prev = 0;
    var collapsed = false;
    var playing = true;
    var dir = 1;
    var t0 = null;

    function render(next) {
      y = next;
      content.style.transform = 'translateY(' + -Math.round(y) + 'px)';

      if (header) {
        var t = (y - FADE_FROM) / (FADE_TO - FADE_FROM);
        header.style.opacity = Math.max(0, Math.min(1, t)).toFixed(2);
      }

      var delta = y - prev;
      if (y <= 6) collapsed = false;
      else if (delta > DIR_THRESHOLD && y > COLLAPSE_AFTER) collapsed = true;
      else if (delta < -DIR_THRESHOLD) collapsed = false;
      prev = y;

      if (tabFull && tabMini) {
        tabFull.style.opacity = collapsed ? '0' : '1';
        tabFull.style.transform = collapsed
          ? 'translateX(-50%) scale(0.88)'
          : 'translateX(-50%) scale(1)';
        tabMini.style.opacity = collapsed ? '1' : '0';
        tabMini.style.transform = collapsed
          ? 'translateX(-50%) scale(1)'
          : 'translateX(-50%) scale(0.86)';
      }

      if (slider) slider.value = ((y / max) * 100).toFixed(1);
    }

    function setPlaying(next) {
      playing = next;
      t0 = null;
      if (toggle) toggle.textContent = playing ? '暫停' : '播放';
    }

    function frame(ts) {
      requestAnimationFrame(frame);
      if (!playing) {
        t0 = null;
        return;
      }
      if (t0 === null) {
        t0 = ts;
        return;
      }
      var dt = Math.min(64, ts - t0);
      t0 = ts;
      var next = y + dir * (max / CYCLE_MS) * dt;
      if (next >= max) {
        next = max;
        dir = -1;
      }
      if (next <= 0) {
        next = 0;
        dir = 1;
      }
      render(next);
    }

    if (slider) {
      slider.addEventListener('input', function () {
        setPlaying(false);
        render((Number(slider.value) / 100) * max);
      });
    }
    if (toggle) {
      toggle.addEventListener('click', function () {
        setPlaying(!playing);
      });
    }

    render(0);
    setPlaying(true);
    requestAnimationFrame(frame);
  }

  global.ScrollDemo = { init: init };
})(window);
