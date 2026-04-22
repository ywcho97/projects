// form 요소 json 변환
function formToJsonString(formId,multiYN){ // form ID
	var formSerializeArray = $(formId).serializeArray();
	var object = {};
	console.log(formSerializeArray)
	for (var i = 0; i < formSerializeArray.length; i++){
		// 같은 name 있는경우 배열로 치환
		console.log(formSerializeArray[i])
		
		if (formSerializeArray[i]['name'] in object) {
			var arr = [];
			var beforeValue = object[formSerializeArray[i]['name']]
			if(Array.isArray(beforeValue)){
				for(var j=0;j<beforeValue.length;j++){
					arr.push(beforeValue[j]);
				}
			}else{
				arr.push(beforeValue);
			}
			arr.push(formSerializeArray[i]['value']);
			object[formSerializeArray[i]['name']] = arr;
		}else{
			if(multiYN == 'Y'){
				object[formSerializeArray[i]['name']] = [formSerializeArray[i]['value']];
			}else{
				object[formSerializeArray[i]['name']] = formSerializeArray[i]['value'];
			}
		}
		
	}
 
	var json = JSON.stringify(object);
	return json;	
}
// PMS 공통함수 객체
var PMSCommon = {
	// 숫자  -> 금액 변환
	priceToString: function(price){ // 금액
		return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	}
	// 과거년도 조회 
	,getYearList: function(cnt,year,addCnt=0){ // 가져올 년도 수
		var yearList = [];
		for(var i=cnt;i>=0;i--){
			yearList.push(year-i);
		}
		
		for(var i=1;i<=addCnt;i++) {
			yearList.push(year+i);
		}
		return yearList;
	}
	// 과거년도 조회  -> select 생성
	,makeYearSelect: function(cnt,defaultSelect,addCnt){ // 가져올 년도 수
		var date = new Date();
		var year = date.getFullYear();
		var yearList = PMSCommon.getYearList(cnt,year,addCnt);
		var html = "";
		if(defaultSelect && defaultSelect != ''){
			for(var i=0;i<yearList.length;i++){
				html += `<option value="${yearList[i]}" ${yearList[i]==defaultSelect?'selected': ''}>${yearList[i]}</option>`
			}
		}else{
			for(var i=0;i<yearList.length;i++){
				html += `<option value="${yearList[i]}" ${year==yearList[i]?'selected': ''}>${yearList[i]}</option>`
			}
		}
		$("select[name=year]").html(html)
	}
	// 표 rowspan 돌적 병합
	,mergeRowspan: function(objectId,tdNum,tdNumArr){ // 병합요소 부모 ID, 기준 td 번호,병합하는 td들의 번호배열
		var mergeItem = "";
		var mergeCount = 0;
		var mergeRowNum = 0;
		var standardNum = tdNum;
		
		
		$('#'+objectId).find('tr').each(function(data,row){ 
			var Thistr = $(this);
			var item = $(Thistr).find("td").eq(standardNum).html()
			
			if(mergeItem != item){ // 행 구분 바뀌는 경우
				mergeRowNum = Number(data);
				mergeItem = item;
				mergeCount = 1;
			}else{ 
				mergeCount = Number(mergeCount) + 1;
				tdNumArr.slice(0).reverse().map((item) => {
					$('#'+objectId).find('tr').eq(mergeRowNum).find("td:eq("+item+")").attr("rowspan",mergeCount);
					console.log(item)
					console.log($('#'+objectId).find('tr').eq(mergeRowNum).find("td:eq("+item+")"))
					$("td:eq("+item+")",Thistr).remove();
				})
				
			}
		})
	}
	// input 숫자만 입력 제한
	, limitValue : function (input,limit) { //  this,최대입력숫자
		input.value = input.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
		if (limit && parseFloat(input.value) > limit) {
			input.value = limit;
		}
	}
	//input 동적 생성 
	,createInput : function (type, name, value, style){ //input type, name,value, style,class 
		return $("<input>", { type: type, name: name, value: value, style: style, class:name });
	}
	//공통코드 조회
	,getCodeList : function (TABLE_NAME,KEY_1,KEY_2,KEY_3) {//테이블 명, 기준키 데이터 1,기준키 데이터 2,기준키 데이터 3
		var jsonData;
		jQuery.ajax({
			type : 'post',
			url : '/_new/common/getCodeList',
			data : JSON.stringify({TABLE_NAME:TABLE_NAME,KEY_1:KEY_1,KEY_2:KEY_2,KEY_3:KEY_3}),
			dataType : 'json',
			async: false, 
			contentType: 'application/json',
			error: function(xhr, status, error){				
				alert("getCodeList 조회할 수 없습니다.");
			},
			success : function(json){
				jsonData = json;
			}
		});
		return jsonData;
	}
	//파일 업로드 
	,onFileUpload : function (t){ // input 객체
				if(t.files.length == 0){
			        if ($(t).parent().find('.progress-bar').length != 0) {
				        $(t).parent().find('.progress-bar').text('')	// 파일 선택 취소시 progress-bar 초기화
				    }
				}
				var files = t.files;
				if(files == null) files = t;
				for (var i = 0; i < files.length; i++) 
					{
						var fd = new FormData();
						fd.append('userfile', files[i]);
						this.createProgressBar(t);
						this.sendFileToServer(fd,t);
					}
				
		}
	//파일 업로드 ,  파일정보 리턴
	,onReturnFileUpload : function (t){ // input 객체
				var files = t.files;
				if(files == null) files = t;
				//var fileData = ""
				var fileData = [];
				for (var i = 0; i < files.length; i++) 
					{
						var fd = new FormData();
						fd.append('userfile', files[i]);
						//fileData = this.sendFileToServerReturn(fd,t);
						var file = this.sendFileToServerReturn(fd,t);
						fileData.push(file);
						
					}
				return fileData;
				
		}	
	//비디오 파일 업로드
	,onVideoFileUpload : function (t){
				var files = t.files;
				for (var i = 0; i < files.length; i++) 
					{
						var fd = new FormData();
						fd.append('userfile', files[i]);
						const videoFile = fd.get('userfile');
						const videoURL = URL.createObjectURL(videoFile);
						const videoElement = document.createElement('video');
						videoElement.src = videoURL;
						
						// 메타데이터 로드 이벤트 리스너
						videoElement.addEventListener('loadedmetadata', () => {
							const videoDuration = videoElement.duration; // 비디오 재생 길이(초 단위)
							$("#videoTime").val(videoDuration);
							// Blob URL 해제
							URL.revokeObjectURL(videoURL);
						});
						
						
						this.sendFileToServer(fd,t);
					}
				
		}

	,createProgressBar: function (t) {
	    // progress bar div 요소를 동적으로 생성
	    var progressWrapper = $('<div class="progress-wrapper" style="display: inline-block; margin-left: 10px;"></div>');
	    var progressBar = $('<div class="progress" style="width: 100%;"><div class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div></div>');
	    $(t).css('display', 'inline-block'); //file 태그 progressbar 옆으로 배치하기 위해

		

        if ($(t).parent().find('.progress-bar').length === 0) {
	        $(t).next().after(progressWrapper.append(progressBar));	//t.next() -> fileId 들어가는 태그
	    }
	}
	//파일 서버전송
	,sendFileToServer : function (formData,t){ // form data,input 객체
				//var uploadURL = '/_conference/file/fileUpload' //Upload URL
				var uploadURL = 'http://kmacfile.kmac.co.kr:82/pmsFile/fileUploadConference'
				var extraData ={}; //Extra Data.
				var jqXHR= $.ajax({
					url: uploadURL,
					type: "POST",
					enctype: 'multipart/form-data',
					timeout: 600000,
					contentType:false,
					processData: false,
					cache: false,
					data: formData,
			        xhr: function() {
			            var xhr = new window.XMLHttpRequest();
			            // 업로드 진행률을 추적
			            xhr.upload.addEventListener('progress', function(e) {
			                if (e.lengthComputable) {
			                    var percent = (e.loaded / e.total) * 100;
			                    // progress bar 업데이트
			                    var progressBar = $(t).parent().find('.progress-bar');
								progressBar.css('color', 'black');
			                    progressBar.css('width', percent + '%').attr('aria-valuenow', percent);
			                    progressBar.text(Math.round(percent) + '%'); // 텍스트로 진행률 표시
			                }
			            }, false);
			            return xhr;
			        },
					complete: function() {
					   	var progressBar = $(t).parent().find('.progress-bar');
					    progressBar.css('width', '100%').attr('aria-valuenow', '100');
					    progressBar.text('완료');
	 					progressBar.css('color', 'green');
					},
					success: function(data){
						$(t).next().val(data.fileId);
						console.log($(t).next().val())
						var imageTag = $("label[for="+$(t).attr('id')+"]").find("img")
						console.log(imageTag)
						if(imageTag.length > 0){
							imageTag.attr("src","/_new/file/photoDownload?fileId="+data.fileId)
						}else{
							$("label[for="+$(t).attr('id')+"]").html(data.originalFileName);
						}
						
					}
				}); 
		}
	//파일 서버 전송 후 값 리턴	
	,sendFileToServerReturn : function (formData,t){ // form data,input 객체
				var uploadURL = '/_conference/file/fileUpload' //Upload URL
				//var uploadURL = 'http://kmacfile.kmac.co.kr:82/pmsFile/fileUpload'
				var extraData ={}; //Extra Data.
				var fileData = ""
				var jqXHR= $.ajax({
					url: uploadURL,
					type: "POST",
					enctype: 'multipart/form-data',
					timeout: 600000,
					contentType:false,
					processData: false,
					async: false, 
					cache: false,
					data: formData,
					success: function(data){
						fileData = data;
						console.log(fileData)
					}
				}); 
				return fileData;
		}
	//input 체크된 값들의 value 합치기
	,joinValues : function (className, joinStr) { // class 명, 합치는 문자열
		const inputs = document.getElementsByClassName(className);
		const checkedValues = [];
		
		for (let i = 0; i < inputs.length; i++) {
			if (inputs[i].checked) {
				checkedValues.push(inputs[i].value);
			}
		}
		
		const joinedValues = checkedValues.join(joinStr);
		if(joinedValues == "") joinStr = "";
		return  joinStr + joinedValues;
	}
	, makeForm : function (divId){
			// div의 id를 사용하여 div 요소를 찾습니다.
		var divElement = document.getElementById(divId);
		if (!divElement) { //divElement 없으면 return
			return;
		}
		// form 요소를 생성합니다.
		var formElement = document.createElement('form');
		formElement.id = 'form_'+divId;
		formElement.style.display = 'none'; // Add this line to hide the form.

		// div의 모든 자식 요소를 순회합니다.
		function appendInputsAndSelectsToForm(element) {
		 if (element.classList.contains('clone')) {
			return;
		}
		for (var i = 0; i < element.children.length; i++) {
			var child = element.children[i];
			// If child is INPUT or SELECT, clone it and append to the form.
			if (child.tagName === 'INPUT' || child.tagName === 'SELECT' || child.tagName === 'TEXTAREA') {
				var clonedChild = child.cloneNode(true);

			// If child is a SELECT element, iterate its options and set selected state.
			if (child.tagName === 'SELECT') {
				for (var j = 0; j < child.options.length; j++) {
					if (child.options[j].selected) {
						clonedChild.options[j].selected = true;
					}
				}
			}
		formElement.appendChild(clonedChild);
		}
		appendInputsAndSelectsToForm(child);
		}
	}
		appendInputsAndSelectsToForm(divElement);
		document.body.appendChild(formElement);
	}
	
	, fileDownload : function (fileId){
		location.href = "/_new/file/photoDownload?fileId=" + fileId;
	}
	, addRow : function (bodyId){ //행추가,제거할 테이블 tbody id 부여(bodyId파라미터)
		//복제할 tr에는 class='cloneRow', 데이터용 tr에는 class='dataRow' 부여 *** user/tab/CareerInfo.html 사용방식 참고
		var table = document.querySelector('#'+bodyId); // 테이블 선택자에 맞게 수정
		var rowsCount = table.rows.length;
		var cRow = table.querySelector('.cloneRow'); //cloneRow 행 선택
		var clone = cRow.cloneNode(true); //첫번째 행 복제
		
		clone.id = ''; // 기존 id값이 있다면 제거
		clone.style.display = ''; // display 속성을 빈 문자열로 설정하여 display: none을 제거
		clone.classList.remove('cloneRow'); // 기존 class "cloneRow" 제거
		clone.classList.add('dataRow'); // class로 "dataRow" 추가
		
		// 복제된 행에서 id와 for 속성을 한 번에 수정
		var allElements = clone.querySelectorAll('[id], [for]'); // id 속성이 있는 요소와 for 속성이 있는 모든 요소 선택
		for (var i = 0; i < allElements.length; i++) {
			var element = allElements[i];
			// id가 있는 경우
			if (element.id) {
				element.id = element.id.replace('_empty', '_' + rowsCount); // '_empty'를 행 번호로 대체
			}
			// for 속성이 있는 경우
			if (element.hasAttribute('for')) {
				element.setAttribute('for', element.getAttribute('for').replace('_empty', '_' + rowsCount)); // for 속성을 수정
			}
		}
		// 복제된 행에 대해 자바스크립트 코드 수정
		var script = clone.querySelector('script'); // 복제된 행의 script 태그 선택
		if (script) {
			// 기존 스크립트 내용을 가져오기
			var scriptContent = script.innerHTML;
			
			// script 내용에서 _empty를 행 번호로 치환
			scriptContent = scriptContent.replace(/_empty/g, '_' + rowsCount); // _empty -> 행 번호로 변경
			
			// 수정된 스크립트 내용을 다시 삽입
			script.innerHTML = scriptContent;
		}
		
		// 복제된 행을 테이블의 마지막으로 추가
		table.appendChild(clone);
		
		//datepicker 초기화(세팅)
		$(clone).find(".ui-datepicker-trigger").remove();
		$(clone).find('.input_date input').removeClass('hasDatepicker').datepicker({ dateFormat: 'yy-mm-dd' });
	}
	, deleteRows: function (bodyId,targetName,deleteClear) { // 기준 tbody Id, 체크박스 name, 데이터 완전 삭제여부 (없으면 display : none 처리)
		//복제할 tr에는 class='cloneRow', 데이터용 tr에는 class='dataRow' 부여 *** user/tab/CareerInfo.html 사용방식 참고
		//DB에 저장된 데이터 / 신규데이터는 seq로 구분(seq 0 : 신규, seq > 0 : 이미 저장된 데이터)
		
		var table = document.querySelector('#' + bodyId); // 테이블 선택자
		if (!table) {
			console.error(`Table with ID "${bodyId}" not found.`);
			return;
		}

		// 테이블에서 .dataRow 클래스를 가진 행만 선택
		var rows = table.querySelectorAll('.dataRow');
		var dataRows = rows.length;
		var checkedRows = 0;
	
		// .dataRow 클래스가 있는 행만 순회하면서 체크된 행 세기
		for (var i = 0; i < rows.length; i++) {
			var row = rows[i];
			var checkbox = row.querySelector('input[type="checkbox"]'); // 체크박스를 하나만 찾음
			if (checkbox && checkbox.checked) {
				checkedRows++;
			}
		}
	
		// 삭제할 행의 인덱스를 저장할 배열(아직 DB에 저장되지 않은 데이터)
		var rowsToDelete = [];
	
		// 체크된 행만 순회하면서 처리 (숨기기 또는 삭제)
		for (var i = 0; i < rows.length; i++) {
			var row = rows[i];
			var checkbox = row.querySelector('input[type="checkbox"]'); // 체크박스 선택
	
			if (checkbox && checkbox.checked) {  // 체크된 행만 처리
				// 해당 행에 있는 seq 값 확인
				
				var seqInput = row.querySelector('input[name="seq"]');
				console.log(targetName)
				if(targetName) seqInput = row.querySelector(`input[name="${targetName}"]`);
				if (seqInput) {
					var seqValue = seqInput.value;
					if (seqValue === '0') {
						// seq 값이 0인 경우, 해당 행 삭제 (아직 DB에 저장되지 않은 데이터는 해당 row 제거)
						rowsToDelete.push(i); // 삭제할 행 인덱스를 배열에 저장
					} else {
						if(deleteClear != 'Y'){
							// seq 값이 0이 아닌 경우, deleteYN = Y로 설정하고 숨기기 (DB에 저장된 데이터일 경우 delete를 위해 seq 넘기는 용으로 해당 row display:none; 처리함)
							var deleteYNInput = row.querySelector('input[name="deleteYN"]');
							if (deleteYNInput) {
								deleteYNInput.value = 'Y';
							}
							// 해당 행 숨기기
							row.style.display = 'none';
						}else{
							row.remove();
						}
						
					}
				}
			}
		}
	
		// 삭제할 행들을 한 번에 삭제(index 꼬임 방지)
		for (var j = rowsToDelete.length - 1; j >= 0; j--) {
			var rowIndex = rowsToDelete[j];
			var row = rows[rowIndex];
			row.remove(); // 저장된 인덱스를 기준으로 행 삭제
		}
		
	}
	, mobileNoInput : function(t){ // 핸드폰번호 유효성 체크
		t.value = t.value
			.replace(/[^0-9]/g, '') // 숫자를 제외한 모든 문자 제거
			.replace(/^02(\d{3,4})(\d{4})$/, '02-$1-$2') //02 지역번호일 경우 예외
			.replace(/^(\d{2,3})(\d{3,4})(\d{4,})$/, `$1-$2-$3`); //전화번호 양식으로 변환
		if(t.value.length > 13) t.value = ''
	}
	, validationCheck(formId,displayYN) { // form 내부 input validation체크 -> input validation='true', explain='설명' 추가 필요
		/*var form = document.querySelector('#'+formId); // 특정 form 선택자로 변경해주세요
		var elements = form.querySelectorAll('input, select');
		
		// 요소 또는 상위 요소가 숨겨져 있는지 확인하는 함수
		function isHidden(el) {
			while (el) {
				if (el === document) break; // document에 도달하면 중단
				if (getComputedStyle(el).display === 'none') return true; // display: none 확인
				el = el.parentElement; // 상위 요소로 이동
			}
			return false; // 숨겨지지 않음
		}
		
		for (var i = 0; i < elements.length; i++) {
			var validationAttr = elements[i].getAttribute('validation');
			var disabledCheck = elements[i].getAttribute('disabled');
			
 			if (validationAttr == 'true' && disabledCheck != 'disabled' && (!displayYN || !isHidden(elements[i])))  { // 해당 필드의 유효성 검사
 				// displayYN이 true이고 요소가 숨겨져 있는 경우, 검사에서 제외
				if (displayYN && isHidden) {
					continue;
				}
				if (elements[i].value.trim() === '') { // 값이 빈 문자열인지 확인
					alert(elements[i].getAttribute('explain')+' 항목이 입력되지 않았습니다.');
					return false; // 함수를 종료하고 false 반환
				}
			}
		}*/
		  var form = document.querySelector('#' + formId);
		var elements = form.querySelectorAll('input[validation="true"], select[validation="true"]');

	// 요소 및 상위 요소가 시각적으로 숨겨졌는지 확인하는 함수
		function isHidden(el) {
			if (el.type === "hidden" || el.style.display === "none") {
				return true;
		}
		while (el) {
			if (getComputedStyle(el).display === "none") {
				return true;
			}
			el = el.parentNode;
			if (el === document) {
				break;
			}
		}
			return false;
		}

		for (var i = 0; i < elements.length; i++) {
			var element = elements[i];
			if (!displayYN && isHidden(element)) {
				// displayYN이 false이고 요소가 숨겨져 있으면 검사에서 제외
				continue;
			}
			if (element.value.trim() === '') {
				alert(element.getAttribute('explain') + ' 항목이 입력되지 않았습니다.');
				element.focus();
				return false;
			}
		}
		return true;
	}
	//날짜 당월, 당해 구하기
	, getThatDate: function(){
		var date = new Date();
		var firstDay = new Date(date.getFullYear(), date.getMonth(), 1); //당월시작날짜
		var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0); //당월마지막날짜
		var firstDayOfYear = new Date(date.getFullYear(), 0, 1); //당해년도시작날짜
		var lastDayOfYear = new Date(date.getFullYear(), 12, 0); //당해년도마지막날짜
		var DateList = [];
		DateList.push(firstDay.getFullYear()+'-'+('0' + (firstDay.getMonth()+1)).slice(-2) + '-' + ('0' + firstDay.getDate()).slice(-2));
		DateList.push(lastDay.getFullYear()+'-'+('0' + (lastDay.getMonth()+1)).slice(-2) + '-' + ('0' + lastDay.getDate()).slice(-2));
		DateList.push(firstDayOfYear.getFullYear()+'-'+('0' + (firstDayOfYear.getMonth()+1)).slice(-2) + '-' + ('0' + firstDayOfYear.getDate()).slice(-2));
		DateList.push(lastDayOfYear.getFullYear()+'-'+('0' + (lastDayOfYear.getMonth()+1)).slice(-2) + '-' + ('0' + lastDayOfYear.getDate()).slice(-2));
		return DateList;
	}
	//날짜 분기 구하기
	, getQuarterDate: function(i){ // 4분기, 상/하반기 날짜 구하기
		var date = new Date();
		var startDate = '';
		var endDate = '';
		if(i == 1){ //1분기
			startDate = new Date(date.getFullYear(), 0, 1);
			endDate = new Date(date.getFullYear(), 3, 0);
		} else if(i == 2){ //2분기
			startDate = new Date(date.getFullYear(), 3, 1);
			endDate = new Date(date.getFullYear(), 6, 0);
		} else if(i == 3){ //3분기
			startDate = new Date(date.getFullYear(), 6, 1);
			endDate = new Date(date.getFullYear(), 9, 0);
		} else if(i == 4){ //4분기
			startDate = new Date(date.getFullYear(), 9, 1);
			endDate = new Date(date.getFullYear(), 12, 0);
		} else if(i == 50){ //상반기
			startDate = new Date(date.getFullYear(), 0, 1);
			endDate = new Date(date.getFullYear(), 6, 0);
		} else if(i == 100){ //하반기
			startDate = new Date(date.getFullYear(), 6, 1);
			endDate = new Date(date.getFullYear(), 12, 0);
		}
		var DateList = [];
		DateList.push(startDate.getFullYear()+'-'+('0' + (startDate.getMonth()+1)).slice(-2) + '-' + ('0' + startDate.getDate()).slice(-2));
		DateList.push(endDate.getFullYear()+'-'+('0' + (endDate.getMonth()+1)).slice(-2) + '-' + ('0' + endDate.getDate()).slice(-2));
		
		return DateList;
	}
	//날짜 n년전 구하기
	, getYearBefore: function(i, date) {
		// 기본값으로 현재 날짜 사용
		if (!date) {
			date = new Date();
		}

		var resultDate = new Date(date);
		resultDate.setFullYear(resultDate.getFullYear() - i); // 파라미터 i만큼 년도를 빼기
		
		var yearBefore = resultDate.getFullYear();
		var monthBefore = ('0' + (resultDate.getMonth() + 1)).slice(-2); // 월은 0부터 시작하므로 +1 해줌
		var dayBefore = ('0' + resultDate.getDate()).slice(-2);

		// 'YYYY-MM-DD' 형태로 날짜 반환
		return `${yearBefore}-${monthBefore}-${dayBefore}`;
	}
	//숫자 콤마찍기
	,comma: function(str) {
		str = String(str);
		return str.replace(/(\d)(?=(?:\d{3})+(?!\d))/g, '$1,');
	}
	//숫자 콤마없애기
	,uncomma: function(str) {
		str = String(str);
		return str.replace(/[^\d]+/g, '');
	}
	,  filePreview: function(fileId,ssn){
	window.open("https://kmacfile.kmac.co.kr:82/pmsFile/preview?fileId="+fileId+'&ssn='+ssn, 'filePreview', 'width=' + screen.width + ','+'height=' + screen.height + ',fullscreen=yes');
	}
	, getFileExtension : function(filename) {
		var lastDotIndex = filename.lastIndexOf('.');
		if (lastDotIndex === -1) {
			return ""; // 확장자가 없는 경우 빈 문자열 반환
		}
		return filename.slice(lastDotIndex + 1).toLowerCase();
	}
	
	, resetElementsById: function(id) { // 팡업 초기화
			const container = document.getElementById(id);
			if (!container) {
				console.error("The specified ID does not exist.");
				return;
			}

			// Reset all input fields within the container
			const inputs = container.querySelectorAll('input');
			inputs.forEach(input => {
				if (input.type === 'text' || input.type === 'number' || input.type === 'password' || input.type === 'email') {
					input.value = '';
				} else if (input.type === 'checkbox' || input.type === 'radio') {
					input.checked = false;
				}
			});

			// Clear all tbody contents within the container
			const tbodies = container.querySelectorAll('tbody');
			tbodies.forEach(tbody => {
				tbody.innerHTML = '';
			});
		}
	//체크박스 전체 선택 및 해제 (id 값 있으면 영역 내 체크박스 대상, 없으면 페이지 전체 대상)
	, selectAllCheckBox(containerId) {
		// 체크박스를 가져올 대상 설정
		var checkboxes;
		
		if (containerId) {
			// 특정 컨테이너 ID가 주어진 경우
			var container = document.getElementById(containerId);
			if (!container) {
				console.error(`Container with ID "${containerId}" not found.`);
				return;
			}
			checkboxes = container.querySelectorAll('input[type="checkbox"]');
		} else {
			// 컨테이너 ID가 없으면 페이지 전체 체크박스 선택
			checkboxes = document.querySelectorAll('input[type="checkbox"]');
		}
	
		if (checkboxes.length === 0) {
			console.warn("No checkboxes found.");
			return;
		}
	
		// 체크된 체크박스가 있는지 검사
		var anyChecked = Array.from(checkboxes).some(checkbox => checkbox.checked);
	
		// 조건에 따라 전체 선택 또는 전체 해제
		checkboxes.forEach(checkbox => {
			checkbox.checked = !anyChecked; // 선택된 것이 있으면 전체 해제, 없으면 전체 선택
		});
	}
}


function priceToString(price) { // 금액
		return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	}

function textCheck(type,name,alerttxt){
    if(type=='text'){
        if(empty($('input:text[name='+name+']').val())){
            alert(alerttxt);
			$('input:text[name='+name+']').focus();
            return true;
        }
    }
    if(type=='textarea'){
        if(empty($('textarea[name='+name+']').val())){
            alert(alerttxt);
			$('textarea[name='+name+']').focus();
            return true;
        }
    }
    else if(type == 'password'){
        if(!$('input:password[name='+name+']').val()){
            alert(alerttxt);
            $('input:password[name='+name+']').focus();
            return true;
        }
    }
    else if(type == 'radio'){
        if(!$('input:radio[name='+name+']').is(':checked')){
            alert(alerttxt);
            $('input:radio[name='+name+']:eq(0)').focus();
            return true;
        }
    }
    else if(type == 'checkbox'){
	    var chkLen = $('input:checkbox[name='+name+']:checked').length;
        if(chkLen < 1){
            alert(alerttxt);
            $('input:checkbox[name='+name+']:eq(0)').focus();
            return true;
        }
    }
    else if(type == 'select'){
        if(empty($('select[name='+name+'] > option:checked').val())){
            alert(alerttxt);
            return true;
        }
    }
    else if(type == 'file'){
        if(!$('input[name='+name+']').val()){
            alert(alerttxt);
            return true;
        }
    }
    return false;
}
function empty(text){
    if(text==null || text==undefined || text==''){
        return true;
    }
    return false;
}

//숫자 입력 (마이너스, 소수점, 콤마)
function numberFormat(val, isMinus, isFloat, isComma){
	var str = val;
	//일단 마이너스, 소수점을 제외한 문자열 모두 제거
	str = str.replace(/[^-\.0-9]/g, '');

	//마이너스
	if(isMinus){
		str = chgMinusFormat(str);   
	} else {
		str = str.replace('-','');
	}

	//소수점
	if(isFloat){
		str = chgFloatFormat(str); 
	} else {
		if(!isMinus ){
			str = str.replace('-','');
		}
		str = str.replace('.','');
		if(str.length>1){
			str = Math.floor(str);
			str = String(str);
		}
	}
	
	//콤마처리
	if(isComma){
		var parts = str.toString().split('.');
		if(str.substring(str.length - 1, str.length)=='.'){
			str = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,",") +".";
		} else {
			str = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,",") + (parts[1] ? "." + parts[1] : "");
		}
	}
	
	return str;
}


function chgFloatFormat(str){
	var idx = str.indexOf('.');
	if(idx<0){
		return str;
	} else if(idx>0){
		var tmpStr = str.substr(idx+1);
		if(tmpStr.length>1){ 
			if(tmpStr.indexOf('.')>=0){
				tmpStr =tmpStr.replace(/[^\d]+/g, '');
				str = str.substr(0,idx+1) + tmpStr;
			}
		}
	} else if(idx==0){
		str = '0'+str;
	}
	return str;
}

function chgMinusFormat(str){
	var idx = str.indexOf('-');
	if(idx==0){
		var tmpStr = str.substr(idx+1);
		//뒤에 마이너스가 또 있는지 확인
		if(tmpStr.indexOf('-')>=0){
			tmpStr = tmpStr.replace('-','');
			str = str.substr(0,idx+1) + tmpStr;
		}
	} else if(idx>0){
		str = str.replace('-','');
	} else if(idx<0){
		return str;
	}
	return str;
}

// 전문가 찾기
function orgFinder_Open(callBackFunc){
    var companyWin;
    var sURL = "/_new/common/orgFinder";
    sURL += "?callbackFunc=" + callBackFunc;
    var sFeather = "top=120,left=120,width=500,height=650,scrollbars=no,toolbar=no,status=no,directories=no,menubar=no";
    companyWin = window.open(sURL, "companyWin", sFeather);
    companyWin.focus();
	return companyWin;
}


//특수문자 입력 방지
function characterCheck(obj){
	var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\_+┼<>@\#$%&\'\"\\\(\=]/gi; //허용할 특수문자는 여기서 삭제
	if( regExp.test(obj.value) ){
		alert("특수문자는 입력하실 수 없습니다.");
		obj.value = obj.value.substring( 0 , obj.value.length - 1 ); //입력한 특수문자 한자리 지움
	}
}

function copyToClipboard(element) {
	const urlText = element.previousElementSibling.innerText;
	
	const tempInput = document.createElement("input");
	document.body.appendChild(tempInput);
	tempInput.value = urlText;
	tempInput.select();
	document.execCommand("copy");
	document.body.removeChild(tempInput);
	
	alert("클립보드에 복사되었습니다");
}

// 키 입력을 숫자만 받게끔 제어 하는 함수
function Number_Only(obj, max, min){
	// 입력값에서 콤마 제거
	obj.value = obj.value.replace(/,/g, '');
	
	var regExp = /^[\d]*$/g;
	if(!regExp.test(obj.value)){
		obj.value = obj.value.replace(/[^\d]/g, ''); //숫자 외 제거
		obj.focus(); //포커스
		alert("숫자만 입력이 가능합니다.");
		return;
	}else{
		if(max != -1){
			if(obj.value > max){
				obj.value = "";
				alert(max+" 이하 값을 입력하세요.");
				obj.focus(); //포커스
				return;
			}
		}
		if(min != -1){
			if(obj.value < min){
				obj.value = "";
				alert(min+" 이상 값을 입력하세요");
				obj.focus(); //포커스
				return;
			}
		}
	}
}

// id에서 _ 뒤의 값을 추출
function getIdSuffix(id) {
	const idSuffix = id.indexOf('_') !== -1 ? '_' + id.split('_')[1] : '';
	return idSuffix;
}

//스크롤 맨 위로 이동
function goTop() {
	window.scrollTo({
		top: 0, left: 0, //스크롤 맨 위로 이동
		behavior: 'smooth' //부드럽게 스크롤
	});
}

function CheckboxCheck(p,o,m,r){//f:폼이름 o:객체,m:메세지,r:리턴값	
	var f=eval("document."+p); 				
	var v=0				
	for(var i=0;i<eval("f."+o+".length");i++){
		if(eval("f."+o+"["+i+"].checked")){					
			v="1";
			break;
		}
	}									
	if(v=="0"){
		alert(m);
		eval("f."+o+"[0].focus()");
		return true;
	}
}

