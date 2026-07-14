// header 로드
fetch('common/header.html')
.then(res => res.text())
.then(data => {
    document.getElementById('include-header').innerHTML = data;
});

// header 로드
fetch('common/headerSub.html')
.then(res => res.text())
.then(data => {
    document.getElementById('include-headerSub').innerHTML = data;
});

// footer 로드
fetch('common/footer.html')
.then(res => res.text())
.then(data => {
    document.getElementById('include-footer').innerHTML = data;
});