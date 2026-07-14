/* =======================================================================
   공통: 반응형 GNB / 스크롤 효과 (flicker-free)
   ======================================================================= */
$(function () {
    const $win = $(window);
    const $gnb = $('.gnb');
    const $twoD = $('.twoD');
    const $gnbLi = $('.gnb nav > ul > li');
    let isMobileView = window.innerWidth <= 799;
    let hideT;

    function offAll() {
        $gnb.off('mouseenter mouseleave focusin focusout');
        $gnbLi.off('mouseenter mouseleave focusin focusout');
        clearTimeout(hideT);
    }

    function openMenu() {
        clearTimeout(hideT);
        $gnb.addClass('open');
    }

    function scheduleClose() {
        clearTimeout(hideT);
        hideT = setTimeout(() => {
            $gnb.removeClass('open');
            $gnbLi.removeClass('on');
        }, 150);
    }

    function setNavInteraction() {
        const isTouchLike = window.matchMedia('(hover: none), (pointer: coarse)').matches || window.innerWidth <= 799;
        offAll();
        $gnb.removeClass('open');
        $gnbLi.removeClass('on');

        if (!isTouchLike) {
            // 데스크톱 호버 로직
            $gnbLi.on('mouseenter focusin', function() {
                clearTimeout(hideT);
                // $gnb.addClass('open');
                $gnbLi.removeClass('on');
                $(this).addClass('on');
            });

            $gnb.on('mouseleave', scheduleClose);
        }
    }

    setNavInteraction();

    $win.on('resize', function () {
        const newIsMobile = window.innerWidth <= 799;
        if (newIsMobile !== isMobileView) {
            isMobileView = newIsMobile;
            setNavInteraction();
        }
    });
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
    const gnb = document.querySelector('.gnb');
    if (!hamber || !gnb) return;

    hamber.addEventListener('click', function (e) {
        e.preventDefault(); // a 태그 기본 동작 방지
        this.classList.toggle('active');
        this.classList.toggle('act');
        gnb.classList.toggle('side_open');
        
        // 메뉴 열림 상태에 따라 본문 스크롤 차단
        if (gnb.classList.contains('side_open')) {
            document.body.classList.add('no_scroll');
        } else {
            document.body.classList.remove('no_scroll');
        }
    });

    // 배경(dim) 클릭 시 닫고 싶을 때를 대비한 추가 로직 (선택사항)
    document.addEventListener('click', function (e) {
        if (gnb.classList.contains('side_open') && !gnb.contains(e.target) && !hamber.contains(e.target)) {
            hamber.classList.remove('active', 'act');
            gnb.classList.remove('side_open');
            document.body.classList.remove('no_scroll');
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
const eventDate = new Date('2026-07-14T00:00:00+09:00');
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




window.openTab = function(event, tabId) {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabDetails = document.querySelectorAll('.tab_detail');

    // 1. 버튼 활성화 상태 변경
    tabBtns.forEach(btn => btn.classList.remove('active'));
    if (event) event.currentTarget.classList.add('active');

    // 2. 탭 콘텐츠 노출 제어
    tabDetails.forEach(detail => {
        if (tabId === 'all') {
            // 'all' 버튼을 누르면 무조건 active 추가 (기존 ID 비교 무시)
            detail.classList.add('active');
        } else {
            // 특정 ID 클릭 시 일치하는 것만 남김
            if (detail.id === tabId) {
                detail.classList.add('active');
            } else {
                detail.classList.remove('active');
            }
        }
    });
};

window.tabBtn = function(event, tabId) {
    const tabBtns = document.querySelectorAll('.schTab');
    const tabDetails = document.querySelectorAll('.tabCont');

    // 1. 버튼 활성화 상태 변경
    tabBtns.forEach(btn => btn.classList.remove('active'));
    if (event) event.currentTarget.classList.add('active');

    // 2. 탭 콘텐츠 노출 제어
    tabDetails.forEach(detail => {
        if (tabId === 'all') {
            // 'all' 버튼을 누르면 무조건 active 추가 (기존 ID 비교 무시)
            detail.classList.add('active');
        } else {
            // 특정 ID 클릭 시 일치하는 것만 남김
            if (detail.id === tabId) {
                detail.classList.add('active');
            } else {
                detail.classList.remove('active');
            }
        }
    });
};

// 아코디언 로직 (전체 보기 모드에서도 개별 작동하도록 설정)
document.addEventListener("click", (e) => {
    const btn = e.target.closest(".acc_btn");
    if (!btn) return;

    e.preventDefault();
    const isOpen = btn.getAttribute("aria-expanded") === "true";
    const accWrap = btn.closest(".acc_wrap");

    // 현재 클릭한 그룹 내의 다른 항목만 닫기
    accWrap.querySelectorAll(".acc_btn").forEach(other => {
        if (other !== btn) other.setAttribute("aria-expanded", "false");
    });

    btn.setAttribute("aria-expanded", !isOpen);
});



function togglePopup(popupId) {
    const popup = document.getElementById(popupId);
    const layer = document.getElementById("Modal_layer");
    if (!popup) return;
    const isVisible = popup.style.display === 'block';
    
    if (isVisible) {
        // 팝업 닫기
        popup.style.display = 'none';
        if (layer) layer.classList.remove('show');
        document.body.style.overflow = ''; 
    } else {
        // 팝업 열기
        popup.style.display = 'block';
        if (layer) layer.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}


function closePopup(popupId) {
    const popup = document.getElementById(popupId);
    if (!popup) return;

    popup.style.display = 'none';
    document.body.style.overflow = ''; // 스크롤 잠금 해제
}


/* ios media youtube */
// (function(){
//   if(!('CSS' in window && CSS.supports && CSS.supports('aspect-ratio: 1 / 1'))){
//     function fit(){
//       document.querySelectorAll('.video_wrap iframe').forEach(function(el){
//         el.style.width='100%';
//         el.style.height=(el.clientWidth*9/16)+'px';
//       });
//     }
//     window.addEventListener('load',fit);
//     window.addEventListener('resize',fit);
//   }
// })();






function toggleContent(btn) {
  const currentPanel = btn.nextElementSibling;
  const isActive = currentPanel.classList.contains('active');

  // 모든 패널과 버튼 초기화
  document.querySelectorAll('.contentPanel').forEach((panel) => {
    panel.classList.remove('active');
    panel.previousElementSibling.classList.remove('is-active');
  });

  // 클릭한 요소가 이전에 닫혀있었다면 열기
  if (!isActive) {
    currentPanel.classList.add('active');
    btn.classList.add('is-active');
  }
}

// 모든 신청 영역(.innerForm)을 가져옵니다.
const applyForms = document.querySelectorAll('.innerForm');

applyForms.forEach((form) => {
    // 현재 form(개인 또는 그룹) 안의 요소들만 선택
    const select = form.querySelector('.ticketSelect');
    const checks = form.querySelectorAll('input[type="checkbox"]');

    if (!select) return; // select가 없는 영역은 건너뜁니다.

    // 드롭다운 변경 이벤트
    select.addEventListener('change', function() {
        const val = this.value;
        checks.forEach(cb => {
            cb.checked = false;
            // 3일권이거나 미선택 시 비활성화
            cb.disabled = (val === "3" || val === ""); 
        });
        if (typeof window.syncPersonalInterestedTrackPanels === 'function') {
            window.syncPersonalInterestedTrackPanels();
        }
    });

    // 체크박스 클릭
    checks.forEach(checkbox => {
        checkbox.addEventListener('click', function(e) {
            const val = select.value;

            if (val === "") {
                alert("참가권을 먼저 선택해 주세요.");
                e.preventDefault();
                return;
            }

            // '현재 소속된 form' 내부에서 체크된 개수만 정확히 카운트
            const checkedCount = form.querySelectorAll('input[type="checkbox"]:checked').length;
            const maxLimit = parseInt(val);

            if (checkedCount > maxLimit) {
                alert(`${val}일권은 최대 ${maxLimit}개만 선택 가능합니다.`);
                this.checked = false;
            }
            if (typeof window.syncPersonalInterestedTrackPanels === 'function') {
                window.syncPersonalInterestedTrackPanels();
            }
        });
    });
});

if (typeof window.syncPersonalInterestedTrackPanels === 'function') {
    window.syncPersonalInterestedTrackPanels();
}

const searchBtn = document.getElementById('searchBtn');
const bizInput = document.getElementById('bizNum');

if (bizInput) {
  // 입력할 때 자동 하이픈 — 캡처 단계에서 먼저 실행(자동완성 fetch 이후 값 기준)
  bizInput.addEventListener(
    'input',
    function () {
      let value = this.value.replace(/\D/g, '');

      if (value.length > 10) {
        value = value.slice(0, 10);
      }

      if (value.length > 5) {
        value = value.replace(/(\d{3})(\d{2})(\d{0,5})/, '$1-$2-$3');
      } else if (value.length > 3) {
        value = value.replace(/(\d{3})(\d{0,2})/, '$1-$2');
      }

      this.value = value;
    },
    true
  );

  // 검색 (applyInfoForm 에서 Oracle 자동완성 새로고침 훅이 있으면 우선)
  if (searchBtn) {
    searchBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (typeof window.__bizNumRefreshSuggest === 'function') {
        window.__bizNumRefreshSuggest();
        return;
      }
      var bizNum = bizInput.value.replace(/\D/g, '');
      if (bizNum.length !== 10) {
        alert('사업자등록번호 10자리를 입력해주세요.');
        return;
      }
    });
  }

  bizInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && searchBtn) {
      searchBtn.click();
    }
  });
}


function formatPhoneNum(obj) {
    // 숫자 이외의 문자 제거
    var val = obj.value.replace(/[^0-9]/g, '');
    var formatted = "";

    // 하이픈(-)
    if (val.length < 4) {
        formatted = val;
    } else if (val.length < 8) {
        formatted = val.substring(0, 3) + '-' + val.substring(3);
    } else {
        formatted = val.substring(0, 3) + '-' + val.substring(3, 7) + '-' + val.substring(7);
    }

    // 결과값
    obj.value = formatted;
}

var excelFileEl = document.querySelector('#excelFile');
if (excelFileEl) {
	excelFileEl.addEventListener('change', function(e) {
    const fileName = e.target.files[0] ? e.target.files[0].name : "Add a File";
    const textNode = this.parentElement.querySelector('.upload_text');
    textNode.innerText = fileName;
    
    // 파일이 선택되면 텍스트 변경
    if(e.target.files[0]) {
        this.parentElement.querySelector('.file_label').style.borderColor = '#4a90e2';
    }
});
}

/* 동의 버튼 */
document.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const parent = e.target.closest('.agree');
        const submitBtn = parent.querySelector('.btn_wrap button');
        
        // 현재 영역 내의 모든 라디오 그룹들
        const radioGroups = parent.querySelectorAll('.agreeRadio');
        
        // 모든 그룹이 '동의 되었는지 확인
        const isAllAgreed = Array.from(radioGroups).every(group => {
            const yesRadio = group.querySelector('input[id*="_yes"]');
            return yesRadio && yesRadio.checked;
        });

        if (isAllAgreed) {
            submitBtn.classList.add('active');
        } else {
            submitBtn.classList.remove('active');
        }
    });
});




var swiper = new Swiper('.class_slideWrap .swiper-container', {
    // Optional parameters
    // direction: 'horizontal',
    spaceBetween: 30, // 슬라이드 사이 여백
    slidesPerView : '5', // 한 슬라이드에 보여줄 갯수
    centeredSlides: true,
    effect: 'slide',
    fadeEffect: {
        crossFade: true
    },
    centeredSlides: false, //센터모드
    loop: true,
    loopAdditionalSlides : 1,
    speed: 1000,
    // pagination: {
    //     el: '.swiper-pagination',
    //     type: 'bullets',
    //     clickable: true,
    // },
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
    autoplay:{
        delay: 5000,
        disableOnInteraction: false, // false-스와이프 후 자동 재생
    },
    breakpoints: {
        0: {
            slidesPerView: 1
        },
        500: {
            slidesPerView: 2
        },
        768: {
            slidesPerView: 3
        },
        1024: {
            slidesPerView: 4
        },
        1440: {
            slidesPerView: 5
        }
    }
    
});

/* 모달 이미지 */
function openModal(src) {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImg");
    modal.style.display = "flex";
    modalImg.src = src;
    document.body.classList.add('noscroll');
}

function closeModal() {
    const modal = document.getElementById("imageModal");
    document.body.classList.remove('noscroll');
    modal.style.display = "none";
}