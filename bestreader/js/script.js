$(document).ready(function(){
    var currentPosition = parseInt($(".menu").css("top"));
    $(window).scroll(function() {
      var position = $(window).scrollTop(); 
      $(".menu").stop().animate({"top":position+currentPosition+"px"}, 1000);
    });
  });


  document.addEventListener('DOMContentLoaded', function () {
    const menuItems = document.querySelectorAll('.quickmenu_wrap ul li a');
    const sections = document.querySelectorAll('.sub_content');

    // 부드러운 스크롤 이동 설정
    // menuItems.forEach(item => {
    //     item.addEventListener('click', function (e) {
    //         e.preventDefault();
    //         const targetId = this.getAttribute('href').substring(1);
    //         const targetElement = document.getElementById(targetId);
    //         targetElement.scrollIntoView({ behavior: 'smooth' });
    //     });
    // });

    function onScroll() {
        let currentSection = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= sectionTop - sectionHeight / 3) {
                currentSection = section.getAttribute('id');
            }
        });

        menuItems.forEach(item => {
            item.classList.remove('quickmenu_active');
            if (item.getAttribute('data-target') === currentSection) {
                item.classList.add('quickmenu_active');
            }
        });
    }

    window.addEventListener('scroll', onScroll);
    onScroll();  // 초기 상태 설정

});





/* swiper 슬라이드 설정 */
var swiper = new Swiper('.main_slide .swiper-container', {
    // Optional parameters
    // direction: 'horizontal',
    effect: 'fade',
    fadeEffect: {
        crossFade: true
    },
    loop: true,
    loopAdditionalSlides : 1,
    speed: 1000,
    pagination: {
        el: '.swiper-pagination',
        type: 'bullets',
        clickable: true,
    },
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
    autoplay:{
        delay: 5000,
        disableOnInteraction: false, // false-스와이프 후 자동 재생
    },
    
});




jQuery(document).ready(function () {
	// 윈도우 로드 후 부드럽게 보여주기
	jQuery(window).load(function () {
		fadeSlider();
		fadeTo();
		return false;
	});


 // data-aos="fade-up" data-aos-duration="800"
});

$(function(){
	$('.type').typed({
		//strings:["오늘은 월요일","한주의 시작이다","기분좋게 공부하고<br>주말까지 힘내자"],   // 입력될 내용 삽입하기
		
		strings:["Web Showcase"],   // 여러줄 삽입하기
		typeSpeed: 100, // type 속도
		backDelay: 5000,
		loop: true //false는 한번만 실행
	});
});


window.addEventListener("load", () => {
    const intro = document.querySelector(".intro-section");
    const main = document.querySelector(".content");
    const body = document.querySelector('body');
    // 인트로 등장
    intro.classList.add("show");

    // 1초 뒤 사라짐 처리
    setTimeout(() => {
        intro.classList.remove("show");
        intro.classList.add("hide");
        body.classList.remove("no-scroll");
    }, 1000);

    // 인트로가 완전히 사라진 후 메인 콘텐츠 표시
    setTimeout(() => {
        main.classList.add("visible");
    }, 2000); // 인트로 transition: 1s 이므로 1초 + 여유 1초

        const introImg = document.getElementById("introImg");

    // 사용할 이미지 목록 (파일명만 바꾸면 쉽게 추가 가능)
    const images = [
        "./img/intro01.png",
        "./img/intro02.png",
        "./img/intro03.png",
        "./img/intro04.png"
    ];

    // 랜덤으로 하나 선택
    const randomIndex = Math.floor(Math.random() * images.length);
    const selectedImage = images[randomIndex];

    // 이미지 설정
    introImg.src = selectedImage;
});

document.addEventListener('DOMContentLoaded', () => {
    const fadeUps = document.querySelectorAll('.fade-up');

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    fadeUps.forEach(el => observer.observe(el));
});
