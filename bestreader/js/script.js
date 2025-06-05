$(function(){
    
    $(".pc_menu>ul>li").on("mouseenter focusin", function(){
		$(this).find(".sub").addClass("active");
	});
	$(".pc_menu>ul>li").on("mouseleave focusout", function(){
		$(this).find(".sub").removeClass("active");
	});
    $('.main_menu').on("mouseenter focusin", function(){
        $(this).find('#menu div').addClass('circle');
        $(this).find('#menu').addClass('font_active')
    });
    $('.main_menu').on("mouseleave focusout", function(){
        $(this).find('#menu div').removeClass('circle');
        $(this).find('#menu').removeClass('font_active')
    });

    $('.tab1').click(function(){
        $(this).addClass('tab_active');
        $('.tab2').removeClass('tab_active');
        $('.tab_content1').addClass('tab_content_active');
        $('.tab_content2').removeClass('tab_content_active');
    });
    $('.tab2').click(function(){
        $(this).addClass('tab_active');
        $('.tab1').removeClass('tab_active');
        $('.tab_content2').addClass('tab_content_active');
        $('.tab_content1').removeClass('tab_content_active');
    });
    $('.main_menu .tab_active').on('mouseenter', function(){
        $(this).find('#menu div').addClass('circle');
        $(this).addClass('font_active')
    });
    $('.sub_btn1').click(function(){
        $('.final_score').css('display','block');
    });
});
$(function(){
    
});
$(document).ready(function() {
    $(".inputs").keyup(function () {
        if (this.value.length == this.maxLength) {
           $(this).next('.inputs').focus();
        }
    });
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
        delay: 3000,
        disableOnInteraction: false, // false-스와이프 후 자동 재생
    },
    
});

/* $('#check_box:checkbox').on('click',function(){
    if($(this).prop('checked')){
        $('body').css({'overflow-y': 'hidden', 'height': '100%'});
        // $('#side_menu').css('display','block');
    } else {
        $('body').css({'overflow-y': 'auto', 'height': 'auto'});
        // $('#side_menu').css('display','none');
    }
}); */



/* 퀵메뉴 */
// $(function(){
//     // $('.quickmenu').hide();
//     // $(window).scroll(function(){
//     //     if($(this).scrollTop()>1){
//     //         $('.content_quickmenu').css('opacity','1');
//     //     } else {
//     //         $('.content_quickmenu').css('opacity','0');
//     //     }
//     // });
//     $('.content_quickmenu').hover(function(){
//         $('.quickmenu_wrap ul li a p').css('display','block')
//     },function(){
//         $('.quickmenu_wrap ul li a p').css('display','none')
//     });
// });
// $(document).ready(function(){
//     var currentPosition = parseInt($(".content_quickmenu").css("top"));
//     $(window).scroll(function() {
//         var position = $(window).scrollTop(); 
//         $(".content_quickmenu").stop().animate({"top":position-currentPosition+"px"},100);
//     });
// });


function inputNumberFormat(obj) {
    obj.value = comma(uncomma(obj.value));
}

function comma(str) {
    str = String(str);
    return str.replace(/(\d)(?=(?:\d{3})+(?!\d))/g, '$1,');
}

function uncomma(str) {
    str = String(str);
    return str.replace(/[^\d]+/g, '');
}
