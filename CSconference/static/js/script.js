/* =======================================================================
   공통: 반응형 GNB / 스크롤 효과 (flicker-free)
   ======================================================================= */
$(function () {
    const $win = $(window);
    const $gnb = $('.gnb');
    const $twoD = $('.twoD');
    let isMobileView = window.innerWidth <= 799;
    let hideT;

    function offAll() {
        $gnb.off('mouseenter mouseleave focusin');
        $gnb.off('mouseenter', 'nav, .twoD');
        clearTimeout(hideT);
    }

    function openMenu() {
        clearTimeout(hideT);
        $gnb.addClass('open');          // CSS 전환으로 열기
    }

    function scheduleClose() {
        clearTimeout(hideT);
        hideT = setTimeout(() => $gnb.removeClass('open'), 140); // 짧은 딜레이로 오동작 방지
    }

    function setNavInteraction() {
        const isTouchLike =
            window.matchMedia('(hover: none), (pointer: coarse)').matches ||
            window.innerWidth <= 799;

        offAll();
        $gnb.removeClass('open');
        $twoD.stop(true, true).css({ display: '' }); // jQuery 애니메이션 흔적 제거

        if (!isTouchLike) {
            // 데스크톱: 컨테이너 기준 진입/이탈만으로 제어 (li 단위 토글 금지)
            $gnb.on('mouseenter focusin', openMenu);
            $gnb.on('mouseleave', scheduleClose);
            $gnb.on('mouseenter', 'nav, .twoD', openMenu); // 드롭다운 위 이동 중 닫힘 방지
        }
        // 모바일은 햄버거(side_open)로 제어 (아래 IIFE 유지)
    }

    setNavInteraction();

    $win.on('resize', function () {
        const newIsMobile = window.innerWidth <= 799;
        if (newIsMobile !== isMobileView) {
            isMobileView = newIsMobile;
            setNavInteraction();
        }
    });

    // 스크롤 노출(페이드업)
    if (typeof revealOnScroll === 'function') {
        revealOnScroll();
    }
});

// 스크롤 시 gnb에 .scrolled 클래스 토글
window.addEventListener(
    'scroll',
    function () {
        const gnb = document.querySelector('.gnb');
        if (!gnb) return;
        if (window.scrollY > 50) gnb.classList.add('scrolled');
        else gnb.classList.remove('scrolled');
    },
    { passive: true }
);

/* 햄버거 메뉴 (모바일 사이드) */
(function () {
    const hamber = document.querySelector('.hamber');
    if (!hamber) return;
    hamber.addEventListener('click', function () {
        this.classList.toggle('active');
        this.classList.toggle('act');
        const gnb = document.querySelector('.gnb');
        const menu_on = document.querySelector('.menu_on');
        const menu_off = document.querySelector('.menu_off');
        if (gnb) {
            gnb.classList.toggle('side_open');
            menu_on.classList.toggle('hide');
            menu_off.classList.toggle('hide');
           
            document.body.classList.toggle(
                'no_scroll',
                gnb.classList.contains('side_open')
            );
        }
    });
})();



/* 컨텐츠 위로 스르륵(페이드업) */
function revealOnScroll() {
    const contents = document.querySelectorAll('.content');
    const triggerPoint = window.innerHeight * 0.85;
    contents.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < triggerPoint && r.bottom > 0) el.classList.add('show');
        else el.classList.remove('show');
    });
}
window.addEventListener('scroll', revealOnScroll, { passive: true });
window.addEventListener('load', revealOnScroll);

/* =======================================================================
   D-DAY
   ======================================================================= */
const eventDate = new Date('2025-11-04T00:00:00+09:00');
function setDDay() {
    const d1 = document.getElementById('dday');
    const d2 = document.getElementById('dday_m');
    const now = new Date();
    const diff = Math.ceil((eventDate - now) / 86400000);
    const text = diff > 0 ? `D-${diff}` : diff === 0 ? 'D-DAY' : `D+${Math.abs(diff)}`;
    if (d1) d1.textContent = text;
    if (d2) d2.textContent = text;
}
setDDay();
setInterval(setDDay, 3600000);

/* =======================================================================
   일반 숫자 카운트 (.num[data-target]) 전용
   - .metric 내부 숫자와 충돌 방지
   ======================================================================= */
function countUp(el, target, dur = 1200) {
    const t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    function step(now) {
        const p = Math.min(1, (now - t0) / dur);
        el.textContent = Math.floor(target * ease(p));
        if (p < 1 && el.dataset.run === '1') requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(
        (entries) => {
            entries.forEach((e) => {
                const el = e.target;

                // .metric 내부 숫자는 제외
                if (el.closest('.metric')) return;

                const target = Number(el.dataset.target || 0);
                if (e.isIntersecting) {
                    // 처음 들어올 때 실행
                    if (el.dataset.run !== '1') {
                        el.dataset.run = '1';
                        countUp(el, target);
                    }

                    // 5초마다 반복 실행
                    if (!el.dataset.interval) {
                        const intervalId = setInterval(() => {
                            // 여전히 보이는 상태일 때만 실행
                            if (el.dataset.run === '1') {
                                countUp(el, target);
                            }
                        }, 5000);
                        el.dataset.interval = intervalId; // id 저장
                    }
                } else {
                    el.dataset.run = '';
                    el.textContent = '0';

                    // 화면에서 벗어나면 반복 제거
                    if (el.dataset.interval) {
                        clearInterval(el.dataset.interval);
                        delete el.dataset.interval;
                    }
                }
            });
        },
        { threshold: 0.5 }
    );

    document.querySelectorAll('.num[data-target]').forEach((n) => obs.observe(n));
}
/* =======================================================================
    스폰서 롤링(무한 롤링)
   ======================================================================= */
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.sponsor-row').forEach((row) => {
        const marquee = row.querySelector('.marquee');
        if (!marquee) return;
        const list = marquee.querySelector('.logos');
        if (!list) return;
        const clone = list.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        marquee.appendChild(clone);
    });
    
    const roller = document.querySelector('.global-roller');
    document.querySelectorAll('.global-row').forEach((row) => {
        const marquee = row.querySelector('.marquee');
        if (!marquee) return;
        if (marquee.dataset.cloned === '1') return;

        const list = marquee.querySelector('.global_img');
        if (!list) return;
        const clone = list.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        marquee.appendChild(clone);
        marquee.dataset.cloned = '1';
    });

    roller?.classList.add('is-ready');
});


/* =======================================================================
   개최실적(Bar + 숫자) : 재진입마다 다시 애니메이션(스크롤 감지)
   ======================================================================= */
(function () {
    function animateNumber(el, target, dur = 1200, done) {
        const t0 = performance.now();
        const ease = t => 1 - Math.pow(1 - t, 3);
        function step(now) {
            const p = Math.min(1, (now - t0) / dur);
            const v = Math.round(target * ease(p));
            el.textContent = v.toLocaleString();
            if (p < 1) requestAnimationFrame(step);
            else if (done) done();
        }
        requestAnimationFrame(step);
    }

    function runMetric(m) {
        if (!m || m.dataset._running === '1') return;
        m.dataset._running = '1';   // 실행 중 플래그
        m.dataset._armed = '1';   // 이번 진입에서 이미 실행했음(중복 방지)

        const value = Number(m.dataset.value || 0);
        const per = Math.max(0, Math.min(100, Number(m.dataset.per || 0)));

        const fill = m.querySelector('.fill');
        if (fill) fill.style.width = per + '%';

        const numEl = m.querySelector('.num');
        if (numEl) animateNumber(numEl, value, 1200, () => { m.dataset._running = ''; });
    }

    function resetMetric(m) {
        // 뷰포트에서 벗어나면 다음 진입 때 다시 실행되도록 초기화
        m.dataset._armed = '';      // 다음 진입에 다시 트리거
        if (m.dataset._running === '1') m.dataset._running = '';
        const fill = m.querySelector('.fill');
        const numEl = m.querySelector('.num');
        if (fill) fill.style.width = '0%';
        if (numEl) numEl.textContent = '0';
    }

    function isInView(el, headerSafe = 80) {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        return (r.top < vh - headerSafe) && (r.bottom > headerSafe);
    }

    function bootChart() {
        const chart = document.querySelector('.chart');
        if (!chart) return;
        const metrics = Array.from(chart.querySelectorAll('.metric'));
        if (!metrics.length) return;

        // 스크롤/리사이즈 감지 (재진입마다 재생)
        let ticking = false;
        function onScroll() {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const chartIn = isInView(chart);
                if (!chartIn) {
                    // 섹션 통째로 벗어나면 전부 초기화
                    metrics.forEach(resetMetric);
                } else {
                    // 섹션이 보이면, 아직 이번 진입에서 실행 안 한 항목만 실행
                    metrics.forEach(m => {
                        if (m.dataset._armed !== '1') runMetric(m);
                    });
                }
                ticking = false;
            });
        }

        // 초기 상태 판단 + 리스너
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        // 초기 1회, 이미지/폰트 로드 후 레이아웃 변동 대비
        requestAnimationFrame(onScroll);
        window.addEventListener('load', onScroll);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootChart);
    } else {
        bootChart();
    }
})();




function openTab(event, tabName) {
    // 모든 탭 콘텐츠를 숨깁니다.
    const tabContents = document.querySelectorAll('.tab_detail');
    tabContents.forEach(tabContent => tabContent.classList.remove('active'));

    // 모든 탭 링크에서 active 클래스를 제거합니다.
    const tabLinks = document.querySelectorAll('.tab-btn');
    tabLinks.forEach(tabLink => tabLink.classList.remove('active'));

    // 모든 tabTop 숨기기
    const tabTops = document.querySelectorAll('.tabTop');
    tabTops.forEach(tabTop => tabTop.style.display = 'none');

    // 선택한 탭 콘텐츠를 표시합니다.
    const tabEl = document.getElementById(tabName);
    if (tabEl) {
        tabEl.classList.add('active');
    }

    // 클릭한 탭 버튼 활성화
    if (event) {
        event.currentTarget.classList.add('active');
    }
}



// 부드러운 높이 전환을 위한 헬퍼
function openPanel(panel) { panel.hidden = false; const h = panel.scrollHeight; panel.style.height = h + "px" }
function closePanel(panel) { const h = panel.scrollHeight; panel.style.height = h + "px"; panel.getBoundingClientRect(); panel.style.height = "0px"; panel.addEventListener("transitionend", () => { panel.hidden = true }, { once: true }) }

const accordions = document.querySelectorAll(".acc")
accordions.forEach(acc => {
    const btn = acc.querySelector(".acc_btn")
    const panel = acc.querySelector(".acc_panel")

    // 초기 열림 상태 동기화
    if (btn.getAttribute("aria-expanded") === "true") { openPanel(panel) }

    btn.addEventListener("click", () => {
        const isOpen = btn.getAttribute("aria-expanded") === "true"

        // 한 번에 하나만 열기
        document.querySelectorAll(".acc_btn[aria-expanded='true']").forEach(openBtn => {
            if (openBtn !== btn) {
                openBtn.setAttribute("aria-expanded", "false")
                closePanel(document.getElementById(openBtn.getAttribute("aria-controls")))
            }
        })

        if (isOpen) {
            btn.setAttribute("aria-expanded", "false")
            closePanel(panel)
        } else {
            btn.setAttribute("aria-expanded", "true")
            openPanel(panel)
        }
    })

    // 전환 후 inline height 제거(자동 높이)
    panel.addEventListener("transitionend", () => {
        if (btn.getAttribute("aria-expanded") === "true") { panel.style.height = "auto" }
    })
})

function togglePopup(popupId) {
    const popup = document.getElementById(popupId);
    const layer = document.getElementById("Modal_layer");
    if (!popup) return; // 요소 없으면 중단

    if (popup.style.display === 'block') {
        popup.style.display = 'none';
        layer.classList.remove('show');
        document.body.style.overflow = ''; // 스크롤 잠금 해제
    } else {
        popup.style.display = 'block';
        layer.classList.add('show');
        
        document.body.style.overflow = 'hidden'; // 스크롤 잠금
    }
}

function toggleModalPopup(popupId) {
    const popup = document.getElementById(popupId);
    if (!popup) return;

    popup.style.display = (popup.style.display === 'block') ? 'none' : 'block';
}

function closePopup(popupId) {
    const popup = document.getElementById(popupId);
    if (!popup) return;

    popup.style.display = 'none';
    document.body.style.overflow = ''; // 스크롤 잠금 해제
}


/* ios media youtube */
(function(){
  if(!('CSS' in window && CSS.supports && CSS.supports('aspect-ratio: 1 / 1'))){
    function fit(){
      document.querySelectorAll('.video_wrap iframe').forEach(function(el){
        el.style.width='100%';
        el.style.height=(el.clientWidth*9/16)+'px';
      });
    }
    window.addEventListener('load',fit);
    window.addEventListener('resize',fit);
  }
})();

/* 퀵메뉴 */
const quickMenu = document.querySelector('.quick_menu');
let isRevealed = false;

// 페이지 로드가 완료되면 즉시 실행
document.addEventListener('DOMContentLoaded', () => {
    
    quickMenu.style.opacity = '1';
    quickMenu.style.visibility = 'visible';
    // quickMenu.style.transform = 'rotate(270deg) translateY(-50%) translateX(0%)';
    quickMenu.style.top = '150px'; 
    
    isRevealed = true;
});


window.addEventListener('scroll', () =>
    document.querySelector('.quick_menu').style.top = `${window.scrollY + window.innerHeight / 2 - 300}px`
);