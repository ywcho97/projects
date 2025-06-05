
function openTab(event, tabName) {
    // 모든 탭 콘텐츠를 숨깁니다.
    var tabContents = document.querySelectorAll('.tab_content');
    tabContents.forEach(function(tabContent) {
        tabContent.classList.remove('active');
    });

    // 모든 탭 링크에서 active 클래스를 제거합니다.
    var tabLinks = document.querySelectorAll('.tab-link');
    tabLinks.forEach(function(tabLink) {
        tabLink.classList.remove('active');
    });

    // 선택한 탭 콘텐츠를 표시하고, 해당 탭 링크에 active 클래스를 추가합니다.
    document.getElementById(tabName).classList.add('active');
    if (event) {
        event.currentTarget.classList.add('active');
        showWriteContent(1);
        taking(1);
    }
}

function refreshPage(event) {
    event.preventDefault();
    var target = event.currentTarget;
    var tabName = target.getAttribute('href').split('#')[1];
    window.location.hash = tabName;
    window.location.reload();
}

function showWriteContent(contentNumber) {
    var writeContent1 = document.querySelector('.write_content1');
    var writeContent2 = document.querySelector('.write_content2');
    var writeContent3 = document.querySelector('.write_content3');

    writeContent1.style.display = 'none';
    writeContent2.style.display = 'none';
    writeContent3.style.display = 'none';

    if (contentNumber === 1) {
        writeContent1.style.display = 'block';
    } else if (contentNumber === 2) {
        writeContent2.style.display = 'block';
    } else if (contentNumber === 3) {
        writeContent3.style.display = 'block';
    } else {
        // console.error('Invalid content number:', contentNumber);
    }
}
function taking(contentNumber) {
    var taking1 = document.querySelector('.taking1');
    var taking2 = document.querySelector('.taking2');

    taking1.style.display = 'none';
    taking2.style.display = 'none';
    

    if (contentNumber === 1) {
        taking1.style.display = 'block';
    } else if (contentNumber === 2) {
        taking2.style.display = 'block';
    } else {
        // console.error('Invalid content number:', contentNumber);
    }

}

// 페이지 로드 시 URL 해시를 읽고 해당 탭을 엽니다.
document.addEventListener('DOMContentLoaded', function() {
    var hash = window.location.hash.substring(1);
    if (hash) {
        openTab(null, hash);
        var tabLink = document.querySelector('.tab-link[onclick="openTab(event, \'' + hash + '\')"]');
        if (tabLink) {
            tabLink.classList.add('active');
        }
    } else {
        // 해시가 없으면 첫 번째 탭을 엽니다.
        openTab(null, 'menu1');
        document.querySelector('.tab-link').classList.add('active');
    }
    
});

// 각 라디오 버튼 요소 가져오기
var yesRadios = document.querySelectorAll('input[type=radio][id^=yes]');
var noRadios = document.querySelectorAll('input[type=radio][id^=no]');

// 라디오 버튼에 이벤트 리스너 추가하기
yesRadios.forEach(function(radio) {
  radio.addEventListener('change', function() {
    var index = radio.id.slice(3); // 끝에서 3번째부터 끝까지의 문자열 추출
    toggleInput(index, true);
  });
});

noRadios.forEach(function(radio) {
  radio.addEventListener('change', function() {
    var index = radio.id.slice(2); // 끝에서 2번째부터 끝까지의 문자열 추출
    toggleInput(index, false);
  });
});

// 입력 필드 제어 함수
function toggleInput(index, show) {
  var inputDiv = document.getElementById(`yes_input${index}`);
  var inputs = inputDiv.querySelectorAll('input[type=text]');
  inputs.forEach(function(input) {
    input.style.display = show ? 'block' : 'none';
  });
}



let alertShown = false;

function setEmailDomain(selectElement) {
    const emailGroup = selectElement.closest('.email_group');
    const emailDomain = emailGroup.querySelector('.email-domain');
    emailDomain.value = selectElement.value;
    validateEmailDomain(emailDomain);
}

function validateEmailDomain(emailDomain) {
    const domainPattern = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (emailDomain.value && !domainPattern.test(emailDomain.value) && !alertShown) {
        alert('유효한 이메일 도메인을 입력하세요.');
        alertShown = true;
        emailDomain.focus();
    } else if (domainPattern.test(emailDomain.value)) {
        alertShown = false;
    }
}

document.addEventListener('DOMContentLoaded', (event) => {
    const telInputs = document.querySelectorAll('.tel');

    telInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            // 숫자만 입력
            input.value = input.value.replace(/[^0-9]/g, '');

            // 최대 길이에 도달하면 다음 입력 필드로 포커스 이동
            if (input.value.length >= input.maxLength) {
                if (index < telInputs.length - 1) {
                    telInputs[index + 1].focus();
                }
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && input.value.length === 0 && index > 0) {
                telInputs[index - 1].focus();
            }
        });
    });
});

function addTeamMember() {
    // teamone 요소를 복사하여 추가
    var container = document.getElementById('team-container');
    var teamOne = container.querySelector('.teamone');
    var newTeamOne = teamOne.cloneNode(true); // 깊은 복사
    // 복사된 요소에 있는 input 필드를 초기화
    var inputs = newTeamOne.querySelectorAll('input');
    inputs.forEach(function(input) {
        input.value = '';
    });
    container.appendChild(newTeamOne);
}

function removeTeamMember() {
    // 마지막 teamone 요소를 삭제
    var container = document.getElementById('team-container');
    var teamOnes = container.querySelectorAll('.teamone');
    if (teamOnes.length > 1) { // 최소 하나는 남겨둠
        container.removeChild(teamOnes[teamOnes.length - 1]);
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const questionBoxes = document.querySelectorAll('.questionBox');

    questionBoxes.forEach(function(questionBox) {
        questionBox.addEventListener('click', function() {
            const parentLi = questionBox.closest('li');
            const currentView = parentLi.querySelector('.view');

            // 모든 .view 요소에서 'open' 클래스 제거
            document.querySelectorAll('.view').forEach(function(view) {
                if (view !== currentView && view.classList.contains('open')) {
                    view.classList.remove('open');
                }
            });

            // 현재 클릭된 .view 요소에 'open' 클래스를 toggle하여 토글
            currentView.classList.toggle('open');
        });
    });

    window.addEventListener("scroll", function() {
        var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        if (scrollTop < 200) {
            scrollTop = 200;
        }
        var quickMenu = document.querySelector(".quick_menu");
        quickMenu.style.top = scrollTop + "px";
    });

    /* var popup = document.getElementById('popup');
    if (popup.style.display === 'block') {
        popup.style.display = 'none';
        document.body.style.overflow = ''; // 스크롤 잠금 해제
    } else {
        popup.style.display = 'block';
        document.body.style.overflow = 'hidden'; // 스크롤 잠금
    } */
});

function scrollToPosition() {
    window.scrollTo({
        top: 0, // 원하는 스크롤 위치 (픽셀 단위)
        behavior: 'smooth' // 부드럽게 스크롤
    });
}
    
function closePopup() {
    var popup = document.getElementById('popup');
    popup.style.display = 'none';
    document.body.style.overflow = ''; // 스크롤 잠금 해제
}
