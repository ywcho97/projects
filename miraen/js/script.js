document.addEventListener('DOMContentLoaded', () => {
    /* 우측 네비 */
    const sections = document.querySelectorAll('section[id]'); 
    const navLinks = document.querySelectorAll('.rightNav ul li a'); 

    window.addEventListener('scroll', () => {
        let currentId = ''; 
        const scrollPosition = window.scrollY + window.innerHeight / 3; 

        sections.forEach(section => {
        const sectionTop = section.offsetTop; 
        const sectionHeight = section.offsetHeight; 

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            currentId = section.getAttribute('id'); 
        } 
        }); 

        navLinks.forEach(link => {
        link.classList.remove('active'); 
        if (link.getAttribute('href') === `#${currentId}`) {
            link.classList.add('active'); 
        } 
        }); 
    }); 

    /* 비디오 */
    const videoWrap = document.querySelector('.sec03_box .video_wrap'); 
    const video = document.getElementById('sec03Video'); 
    const playBtn = document.querySelector('.sec03_box .playBtn'); 

    playBtn.addEventListener('click', () => {
        video.play(); 
    }); 

    video.addEventListener('play', () => {
        video.controls = true; 
        videoWrap.classList.add('is-playing'); 
    }); 

    video.addEventListener('pause', () => {
        videoWrap.classList.remove('is-playing'); 
    }); 

    video.addEventListener('ended', () => {
        videoWrap.classList.remove('is-playing'); 
    }); 
});

/* textarea 글자수 */
const textarea = document.getElementById('textarea');
const charCount = document.getElementById('charCount');

function updateCharCount() {
    charCount.textContent = textarea.value.length;
}

textarea.addEventListener('input', updateCharCount);
updateCharCount();

/* 탭메뉴 */
function openTab(event, tabName) {
    const tabContents = document.querySelectorAll('.tab_detail');
    tabContents.forEach(tabContent => tabContent.classList.remove('active'));

    const tabLinks = document.querySelectorAll('.tab-btn');
    tabLinks.forEach(tabLink => tabLink.classList.remove('active'));

    const tabTops = document.querySelectorAll('.tabTop');
    tabTops.forEach(tabTop => tabTop.style.display = 'none');

    const tabEl = document.getElementById(tabName);
    if (tabEl) {
        tabEl.classList.add('active');
    }

    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

/* 탭메뉴 이동 */
function moveTab(direction) {
    const tabBtns = Array.from(document.querySelectorAll('.tab-btn'));
    let activeIndex = tabBtns.findIndex(btn => btn.classList.contains('active'));

    if (activeIndex === -1) activeIndex = 0;

    let newIndex = activeIndex + direction;

    if (newIndex < 0) {
        newIndex = tabBtns.length - 1;
    } else if (newIndex >= tabBtns.length) {
        newIndex = 0;
    }

    const targetBtn = tabBtns[newIndex];
    targetBtn.click();
}


/* 컨텐츠 위로 스르륵(페이드업) */
function revealOnScroll() {
    const fadeUp = document.querySelectorAll('.fadeUp');
    const triggerPoint = window.innerHeight * 0.85;
    fadeUp.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < triggerPoint && r.bottom > 0) el.classList.add('show');
        else el.classList.remove('show');
    });
}
window.addEventListener('scroll', revealOnScroll, { passive: true });
window.addEventListener('load', revealOnScroll);