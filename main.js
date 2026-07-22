(function () {
  "use strict";

  /* ★★★ 운영 설정 — 여기만 수정하면 됨 ★★★ */
  // 시라노 상세페이지 전용 예약 링크 (버전B 예약 플로우 유지)
  var BOOKING_URL = "https://change-me.real-me.co.kr/realme-booking-B.html";

  // 남은 쿠폰 연출: 시작값에서 보는 동안 실시간으로 1~2장씩 감소 (재방문 시 이어짐, 바닥값에서 정지)
  var SEATS_TOTAL = 100;
  var SEATS_START = 63;             // ★ 시작 장수 — 캠페인 리셋 시 여기만 조정
  var SEATS_FLOOR = 21;             // ★ 이 밑으로는 안 내려감

  // 실시간 시청자 연출 (플로팅 배지)
  var VIEWERS_MIN = 3600;
  var VIEWERS_MAX = 4800;

  /* 통합 이벤트: GA4(gtag) + 메타픽셀(fbq) */
  function trackEvent(name, params) {
    params = params || {};
    try { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: name }, params)); } catch (e) {}
    try { if (typeof window.gtag === "function") window.gtag("event", name, params); } catch (e) {}
    try {
      if (typeof window.fbq === "function") {
        var map = { form_submit: "Lead" };
        if (map[name]) window.fbq("track", map[name], params);
        else window.fbq("trackCustom", name, params);
      }
    } catch (e) {}
  }
  window.trackEvent = trackEvent;

  /* 스크롤 리빌 */
  var reveal = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveal.forEach(function (el) { io.observe(el); });
  } else { reveal.forEach(function (el) { el.classList.add("is-visible"); }); }

  /* ===== 남은 쿠폰 실시간 감소 연출 =====
     - 시작값(SEATS_START)에서 12~35초 간격으로 1~2장씩 감소
     - localStorage로 재방문 시 이어짐 (숫자가 다시 늘어나 보이는 일 없음)
     - SEATS_FLOOR에서 정지 */
  (function () {
    var els = document.querySelectorAll(".seats-left-text");
    if (!els.length) return;
    var KEY = "d50_seats";
    var val = parseInt(localStorage.getItem(KEY) || "0", 10);
    if (!val || val > SEATS_START || val < SEATS_FLOOR) val = SEATS_START;

    function render(flash) {
      els.forEach(function (el) {
        el.textContent = val;
        if (flash) {
          el.classList.remove("seat-drop");
          void el.offsetWidth; // 애니메이션 재시작
          el.classList.add("seat-drop");
        }
      });
      document.querySelectorAll(".seats-fill").forEach(function (f) {
        // 게이지 = "남은" 비율 — 쿠폰이 줄면 바도 같이 줄어듦
        f.style.width = Math.round(val / SEATS_TOTAL * 100) + "%";
        if (flash) {
          f.classList.remove("bar-flash");
          void f.offsetWidth;
          f.classList.add("bar-flash");
        }
      });
    }
    function save() { try { localStorage.setItem(KEY, String(val)); } catch (e) {} }
    function schedule() { setTimeout(tick, 9000 + Math.random() * 14000); } // 9~23초 간격
    function tick() {
      if (val > SEATS_FLOOR) {
        val -= (Math.random() < 0.25 ? 2 : 1);
        if (val < SEATS_FLOOR) val = SEATS_FLOOR;
        save();
        render(true);
      }
      schedule();
    }
    render(false);
    save();
    // 첫 감소는 진입 5초 이내 — 들어오자마자 "방금 누가 받아갔다"는 인상
    setTimeout(tick, 2500 + Math.random() * 2000);
  })();

  /* ===== 실시간 시청자 플로팅 배지 (숫자 랜덤워크) ===== */
  (function () {
    var el = document.getElementById("viewerCount");
    if (!el) return;
    var v = 3950 + Math.floor(Math.random() * 320);
    function render() { el.textContent = v.toLocaleString("ko-KR"); }
    function tick() {
      var delta = Math.floor(Math.random() * 29) - 13; // -13 ~ +15 (살짝 증가 편향)
      v = Math.max(VIEWERS_MIN, Math.min(VIEWERS_MAX, v + delta));
      render();
      setTimeout(tick, 3500 + Math.random() * 5000);
    }
    render();
    setTimeout(tick, 2500);
  })();

  /* 모든 CTA(.js-book) → 예약 페이지 이동 + 퍼널용 cta_click + 메타 Lead 발사 (버전B 방식) */
  (function () {
    document.querySelectorAll(".js-book").forEach(function (a) {
      var href = a.getAttribute("href");
      if (!href || href === "#") a.setAttribute("href", BOOKING_URL);
      a.addEventListener("click", function () {
        trackEvent("cta_click", { location: a.getAttribute("data-cta") || "cta", label: (a.textContent || "").trim() });
        try { if (typeof window.fbq === "function") window.fbq("track", "Lead"); } catch (e) {}
      });
    });
  })();

  /* 마퀴 카드 16장 생성 후 2배 복제(무한 루프) */
  (function () {
    var track = document.getElementById("lookTrack");
    if (!track) return;
    var REVIEWS = [
      ["김*준", "소개팅 나가면 애프터가 오기 시작했어요."],
      ["이*호", "첫인상이 달라지니 대화 분위기부터 편해졌어요."],
      ["박*우", "컬러 하나 바꿨을 뿐인데 '느낌 있다'는 말을 들어요."],
      ["정*민", "만난 지 3주 만에 여자친구가 생겼습니다 ㅎㅎ"],
      ["최*석", "소개팅 자리에서 자신감이 완전히 달라졌어요."],
      ["강*현", "프로필 사진부터 바꾸니 매칭률이 확 올랐어요."],
      ["윤*탁", "상대가 먼저 다음 약속을 잡자고 하더라고요."],
      ["임*규", "헤어까지 봐주셔서 데이트룩 고민이 사라졌어요."],
      ["한*결", "결혼 상대를 진지하게 만나기 시작했습니다."],
      ["오*진", "데이트 사진 찍는 게 더는 부담스럽지 않아요."],
      ["서*빈", "소개팅 성공률이 이렇게 달라질 줄 몰랐어요."],
      ["남*철", "상견례 자리 코디까지 챙겨주셔서 든든했어요."],
      ["조*영", "여자친구가 스타일 좋아졌다고 먼저 칭찬해요."],
      ["배*훈", "어색할까 걱정했는데 연애 상담까지 받은 기분이에요."],
      ["문*기", "퍼스널컬러 알고 나서 데이트룩이 쉬워졌어요."],
      ["신*우", "한 번의 디렉팅으로 연애 준비가 끝났습니다."]
    ];
    function set() {
      var s = "";
      for (var i = 1; i <= 16; i++) {
        var rv = REVIEWS[i - 1];
        s += '<div class="look-card">' +
               '<div class="imgslot" data-label="look-' + i + '.jpg">' +
               '<img src="images/look-' + i + '.jpg" alt="스타일 ' + i + '" onerror="this.style.display=\'none\'"></div>' +
               '<div class="look-cap"><div class="lc-top"><span class="lc-name">' + rv[0] + '</span>' +
               '<span class="lc-stars">★★★★★</span></div><p>' + rv[1] + '</p></div>' +
             '</div>';
      }
      return s;
    }
    track.innerHTML = set() + set();
  })();

  /* 비포/애프터 슬라이더 */
  (function () {
    var track = document.getElementById("baTrack");
    if (!track) return;
    var n = track.children.length, cur = 0, timer = null;
    var dotsWrap = document.getElementById("baDots");
    for (var i = 0; i < n; i++) { var d = document.createElement("div"); d.className = "dot" + (i === 0 ? " active" : ""); d.dataset.i = i; dotsWrap.appendChild(d); }
    var dots = dotsWrap.children;
    function go(k) { cur = (k + n) % n; track.style.transform = "translateX(-" + (cur * 100) + "%)"; for (var i = 0; i < dots.length; i++) dots[i].classList.toggle("active", i === cur); }
    function next() { go(cur + 1); }
    function start() { stop(); timer = setInterval(next, 3500); }
    function stop() { if (timer) clearInterval(timer); }
    document.getElementById("baNext").onclick = function () { next(); start(); };
    document.getElementById("baPrev").onclick = function () { go(cur - 1); start(); };
    for (var j = 0; j < dots.length; j++) dots[j].onclick = function () { go(+this.dataset.i); start(); };
    var x0 = null;
    track.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; stop(); }, { passive: true });
    track.addEventListener("touchend", function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) { dx < 0 ? next() : go(cur - 1); } x0 = null; start(); }, { passive: true });
    start();
  })();

  /* ===== 스크롤 뎁스별 sticky CTA 등장 (2026-07-21 개편) =====
     히어로에서 스크롤 두어 번 하면(히어로 문구가 화면 위로 지나가면) 하단 CTA가 나타난다.
     (원본 index/style은 style.css에 초기 숨김 규칙이 없어 항상 표시, 영향 없음) */
  (function () {
    var sticky = document.getElementById("stickyCta");
    if (!sticky) return;
    var target = document.querySelector(".hero-sub") || document.querySelector(".hero");
    if (!target || !("IntersectionObserver" in window)) { sticky.classList.add("is-shown"); return; }
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (en) { sticky.classList.toggle("is-shown", !en.isIntersecting); });
    }, { threshold: 0, rootMargin: "-200px 0px -10% 0px" });
    so.observe(target);
  })();

  /* ===== 서비스 단계 이미지 캐러셀 (STEP 1·2·3) 클릭/점/스와이프 (자동 슬라이드 없음) ===== */
  (function () {
    var cars = document.querySelectorAll(".svc-carousel");
    if (!cars.length) return;
    Array.prototype.forEach.call(cars, function (car) {
      var track = car.querySelector(".svc-ctrack");
      if (!track) return;
      var n = track.children.length;
      var dotsWrap = car.querySelector(".svc-dots");
      var cur = 0, timer = null;
      // 슬라이드 1장이면 컨트롤 숨기고 종료
      if (n <= 1) {
        var pv0 = car.querySelector(".svc-nav.prev"), nx0 = car.querySelector(".svc-nav.next");
        if (pv0) pv0.style.display = "none";
        if (nx0) nx0.style.display = "none";
        return;
      }
      for (var i = 0; i < n; i++) {
        var d = document.createElement("span");
        d.className = "d" + (i === 0 ? " active" : "");
        d.setAttribute("data-i", i);
        dotsWrap.appendChild(d);
      }
      var dots = dotsWrap.children;
      function go(k) {
        cur = (k + n) % n;
        track.style.transform = "translateX(-" + (cur * 100) + "%)";
        for (var i = 0; i < dots.length; i++) dots[i].classList.toggle("active", i === cur);
      }
      function next() { go(cur + 1); }
      // 자동 슬라이드 없음: 클릭·점·스와이프로만 이동 (2026-07-21 사용자 요청)
      var prev = car.querySelector(".svc-nav.prev"), nx = car.querySelector(".svc-nav.next");
      if (prev) prev.onclick = function () { go(cur - 1); };
      if (nx) nx.onclick = function () { next(); };
      for (var j = 0; j < dots.length; j++) dots[j].onclick = function () { go(+this.getAttribute("data-i")); };
      var x0 = null;
      track.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      track.addEventListener("touchend", function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) { dx < 0 ? next() : go(cur - 1); } x0 = null; }, { passive: true });
    });
  })();

  /* ===== 쇼룸 갤러리 마퀴: 트랙을 복제해 끊김 없이 흐르게 ===== */
  (function () {
    var track = document.getElementById("shroomTrack");
    if (!track) return;
    track.innerHTML += track.innerHTML; // 2배 복제 → CSS translateX(-50%) 루프가 seamless
  })();
})();
