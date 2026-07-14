/**
 * 마이페이지 개인정보 수정 — 이메일 인증코드 발송·확인·PATCH /api/user/profile
 */
(function (global) {
	"use strict";

	var PROFILE_VERIFICATION_CODE_KEY = "axis2026_profile_verification_code";

	function parseApiDetail(data) {
		if (!data) {
			return "요청 처리에 실패했습니다.";
		}
		if (typeof data.detail === "string") {
			return data.detail;
		}
		if (Array.isArray(data.detail) && data.detail.length > 0) {
			return data.detail.map(function (item) {
				return item.msg;
			}).join("\n");
		}
		if (data.detail && typeof data.detail === "object" && !Array.isArray(data.detail)) {
			if (data.detail.message) {
				return String(data.detail.message);
			}
		}
		if (data.message && typeof data.message === "string") {
			return data.message;
		}
		return "요청 처리에 실패했습니다.";
	}

	function maskEmail(email) {
		var e = String(email || "").trim();
		if (!e || e.indexOf("@") < 0) {
			return "등록된 이메일";
		}
		var parts = e.split("@");
		var local = parts[0];
		var domain = parts.slice(1).join("@");
		if (local.length <= 1) {
			return "*@" + domain;
		}
		return local.charAt(0) + "***@" + domain;
	}

	function normalizePhone(value) {
		return String(value || "").replace(/\D/g, "");
	}

	function isValidEmail(email) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}

	function validateProfileFields(fields) {
		if (!fields.name || !fields.affiliation || !fields.department || !fields.position || !fields.email || !fields.phone) {
			return "필수 항목을 모두 입력해 주세요.";
		}
		if (!isValidEmail(fields.email)) {
			return "이메일 주소 형식이 올바르지 않습니다.";
		}
		if (normalizePhone(fields.phone).length < 10) {
			return "연락처(휴대폰)를 올바르게 입력해 주세요.";
		}
		return null;
	}

	function getStoredProfileVerificationCode() {
		try {
			var raw = sessionStorage.getItem(PROFILE_VERIFICATION_CODE_KEY);
			return raw ? String(raw).trim() : "";
		} catch (e) {
			return "";
		}
	}

	function setStoredProfileVerificationCode(code) {
		sessionStorage.setItem(PROFILE_VERIFICATION_CODE_KEY, String(code).trim());
	}

	function clearStoredProfileVerificationCode() {
		sessionStorage.removeItem(PROFILE_VERIFICATION_CODE_KEY);
	}

	async function apiFetch(url, token, options) {
		options = options || {};
		var headers = Object.assign({}, options.headers || {});
		if (options.body != null) {
			headers["Content-Type"] = "application/json";
		}
		if (token) {
			headers.Authorization = "Bearer " + token;
		}
		var response = await fetch(url, {
			method: options.method || "GET",
			headers: headers,
			body: options.body != null ? JSON.stringify(options.body) : undefined
		});
		var data = null;
		try {
			data = await response.json();
		} catch (e) {
			data = null;
		}
		return { response: response, data: data };
	}

	/** POST /api/user/profile/verification-code */
	async function sendProfileVerificationCode(apiBase, token) {
		var url = String(apiBase).replace(/\/$/, "") + "/api/user/profile/verification-code";
		var result = await apiFetch(url, token, { method: "POST" });
		if (result.response.status === 401 || result.response.status === 403) {
			return { ok: false, unauthorized: true, message: "로그인이 만료되었습니다." };
		}
		if (!result.response.ok) {
			return { ok: false, message: parseApiDetail(result.data) };
		}
		return {
			ok: true,
			message: result.data && result.data.message ? result.data.message : "인증번호를 발송했습니다.",
			expiresInSeconds: result.data && result.data.expires_in_seconds != null ? result.data.expires_in_seconds : null
		};
	}

	/** POST /api/user/profile/verification-code/verify */
	async function verifyProfileVerificationCode(apiBase, token, verificationCode) {
		var code = String(verificationCode || "").trim();
		if (!code) {
			return { ok: false, message: "인증번호를 입력해 주세요." };
		}
		var url = String(apiBase).replace(/\/$/, "") + "/api/user/profile/verification-code/verify";
		var result = await apiFetch(url, token, {
			method: "POST",
			body: { verification_code: code }
		});
		if (result.response.status === 401 || result.response.status === 403) {
			return { ok: false, unauthorized: true, message: "로그인이 만료되었습니다." };
		}
		if (!result.response.ok) {
			return { ok: false, message: parseApiDetail(result.data) };
		}
		if (result.data && result.data.success === false) {
			return { ok: false, message: result.data.message || "인증번호가 올바르지 않습니다." };
		}
		setStoredProfileVerificationCode(code);
		return { ok: true, message: result.data && result.data.message ? result.data.message : "인증되었습니다." };
	}

	/** PATCH /api/user/profile */
	async function updateMyProfile(apiBase, token, profileBody) {
		var code = getStoredProfileVerificationCode();
		if (!code) {
			return { ok: false, needVerify: true, message: "이메일 인증이 필요합니다." };
		}
		var body = Object.assign({}, profileBody, { verification_code: code });
		var url = String(apiBase).replace(/\/$/, "") + "/api/user/profile";
		var result = await apiFetch(url, token, { method: "PATCH", body: body });
		if (result.response.status === 401 || result.response.status === 403) {
			return { ok: false, unauthorized: true, message: "로그인이 만료되었습니다." };
		}
		if (!result.response.ok) {
			return { ok: false, message: parseApiDetail(result.data) };
		}
		clearStoredProfileVerificationCode();
		return { ok: true, data: result.data };
	}

	global.AxisProfile = {
		PROFILE_VERIFICATION_CODE_KEY: PROFILE_VERIFICATION_CODE_KEY,
		parseApiDetail: parseApiDetail,
		maskEmail: maskEmail,
		normalizePhone: normalizePhone,
		isValidEmail: isValidEmail,
		validateProfileFields: validateProfileFields,
		getStoredProfileVerificationCode: getStoredProfileVerificationCode,
		setStoredProfileVerificationCode: setStoredProfileVerificationCode,
		clearStoredProfileVerificationCode: clearStoredProfileVerificationCode,
		sendProfileVerificationCode: sendProfileVerificationCode,
		verifyProfileVerificationCode: verifyProfileVerificationCode,
		updateMyProfile: updateMyProfile
	};
})(typeof window !== "undefined" ? window : this);
