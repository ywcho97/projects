/**
 * AXIS 2026 사용자 로그인 세션 (24h access_token)
 * - localStorage + sessionStorage 동시 저장 (모바일 sessionStorage 유실 대비)
 * - 이름/연락처 힌트로 silent re-login
 */
(function (global) {
	"use strict";

	var AUTH_TOKEN_KEY = "axis2026_user_access_token";
	var AUTH_SESSION_HINT_KEY = "axis2026_user_session_hint";
	var LEGACY_AUTOLOGIN_HINT_KEY = "axis2026_autologin_hint";
	var LOGIN_PATH = "/_conference/program/login";
	var MYPAGE_PATH = "/_conference/program/mypage";

	function parseApiDetail(data) {
		if (!data) {
			return "로그인에 실패했습니다.";
		}
		if (typeof data.detail === "string") {
			return data.detail;
		}
		if (Array.isArray(data.detail) && data.detail.length > 0) {
			return data.detail.map(function (item) {
				return item.msg;
			}).join("\n");
		}
		if (data.message && typeof data.message === "string") {
			return data.message;
		}
		return "로그인에 실패했습니다.";
	}

	function normalizePhone(value) {
		return String(value || "").replace(/\D/g, "");
	}

	function readStorage(storage, key) {
		if (!storage) {
			return "";
		}
		try {
			var value = storage.getItem(key);
			return value && String(value).trim() ? String(value).trim() : "";
		} catch (e) {
			return "";
		}
	}

	function writeStorage(storage, key, value) {
		if (!storage) {
			return;
		}
		try {
			storage.setItem(key, value);
		} catch (e) {
			/* ignore quota / private mode */
		}
	}

	function removeStorage(storage, key) {
		if (!storage) {
			return;
		}
		try {
			storage.removeItem(key);
		} catch (e) {
			/* ignore */
		}
	}

	function migrateLegacyToken() {
		var localToken = readStorage(global.localStorage, AUTH_TOKEN_KEY);
		var sessionToken = readStorage(global.sessionStorage, AUTH_TOKEN_KEY);
		if (localToken && !sessionToken) {
			writeStorage(global.sessionStorage, AUTH_TOKEN_KEY, localToken);
		} else if (sessionToken && !localToken) {
			writeStorage(global.localStorage, AUTH_TOKEN_KEY, sessionToken);
		}
	}

	function migrateLegacyHint() {
		var hint = getSessionHint();
		if (hint) {
			return;
		}
		var raw = readStorage(global.sessionStorage, LEGACY_AUTOLOGIN_HINT_KEY);
		if (!raw) {
			raw = readStorage(global.localStorage, LEGACY_AUTOLOGIN_HINT_KEY);
		}
		if (!raw) {
			return;
		}
		try {
			var parsed = JSON.parse(raw);
			if (parsed && parsed.name && parsed.mobile) {
				saveSessionHint(parsed);
			}
		} catch (e) {
			/* ignore */
		}
	}

	function getAccessToken() {
		migrateLegacyToken();
		return readStorage(global.localStorage, AUTH_TOKEN_KEY) || readStorage(global.sessionStorage, AUTH_TOKEN_KEY);
	}

	function setAccessToken(token) {
		var value = String(token || "").trim();
		if (!value) {
			return;
		}
		writeStorage(global.localStorage, AUTH_TOKEN_KEY, value);
		writeStorage(global.sessionStorage, AUTH_TOKEN_KEY, value);
		updateHeaderAuthNav();
	}

	function clearAccessToken() {
		removeStorage(global.localStorage, AUTH_TOKEN_KEY);
		removeStorage(global.sessionStorage, AUTH_TOKEN_KEY);
		updateHeaderAuthNav();
	}

	function updateHeaderAuthNav(loggedIn) {
		if (loggedIn === undefined) {
			loggedIn = !!getAccessToken();
		}
		var guestNav = global.document.getElementById("headerGuestNav");
		var userNav = global.document.getElementById("headerUserNav");
		var navLink = global.document.getElementById("headerNavAuthLink");
		var gnb = global.document.querySelector(".gnb");

		if (guestNav) {
			guestNav.hidden = loggedIn;
		}
		if (userNav) {
			userNav.hidden = !loggedIn;
		}
		if (navLink) {
			navLink.textContent = loggedIn ? "MY PAGE" : "LOGIN";
			navLink.setAttribute("href", loggedIn ? MYPAGE_PATH : LOGIN_PATH);
		}
		if (gnb) {
			gnb.classList.toggle("is-logged-in", loggedIn);
		}
	}

	function resolveApiBase(explicitBase) {
		if (explicitBase) {
			return apiBaseUrl(explicitBase);
		}
		if (global.AXIS_PUBLIC_API_BASE) {
			return apiBaseUrl(global.AXIS_PUBLIC_API_BASE);
		}
		return "";
	}

	var headerSyncPromise = null;
	var headerSyncTimer = null;

	async function syncHeaderAuthNav(apiBase) {
		if (headerSyncPromise) {
			return headerSyncPromise;
		}
		headerSyncPromise = (async function () {
			var token = getAccessToken();
			if (!token) {
				updateHeaderAuthNav(false);
				return false;
			}
			var base = resolveApiBase(apiBase);
			if (!base) {
				updateHeaderAuthNav(true);
				return true;
			}
			try {
				var response = await fetch(base + "/api/user/me", {
					method: "GET",
					headers: { Authorization: "Bearer " + token },
					cache: "no-store"
				});
				if (isUnauthorizedStatus(response.status)) {
					clearAccessToken();
					return false;
				}
				updateHeaderAuthNav(true);
				return true;
			} catch (e) {
				updateHeaderAuthNav(!!getAccessToken());
				return !!getAccessToken();
			}
		})();
		try {
			return await headerSyncPromise;
		} finally {
			headerSyncPromise = null;
		}
	}

	function scheduleHeaderAuthSync(apiBase, delayMs) {
		if (headerSyncTimer) {
			global.clearTimeout(headerSyncTimer);
		}
		headerSyncTimer = global.setTimeout(function () {
			headerSyncTimer = null;
			syncHeaderAuthNav(apiBase);
		}, delayMs != null ? delayMs : 300);
	}

	function saveSessionHint(hint) {
		if (!hint || !hint.name || !hint.mobile) {
			return;
		}
		var payload = JSON.stringify({
			name: String(hint.name).trim(),
			mobile: normalizePhone(hint.mobile)
		});
		writeStorage(global.localStorage, AUTH_SESSION_HINT_KEY, payload);
		writeStorage(global.sessionStorage, AUTH_SESSION_HINT_KEY, payload);
	}

	function getSessionHint() {
		migrateLegacyHint();
		var raw =
			readStorage(global.localStorage, AUTH_SESSION_HINT_KEY) ||
			readStorage(global.sessionStorage, AUTH_SESSION_HINT_KEY);
		if (!raw) {
			return null;
		}
		try {
			var parsed = JSON.parse(raw);
			if (!parsed || !parsed.name || !parsed.mobile) {
				return null;
			}
			return {
				name: String(parsed.name).trim(),
				mobile: normalizePhone(parsed.mobile)
			};
		} catch (e) {
			return null;
		}
	}

	function clearSessionHint() {
		removeStorage(global.localStorage, AUTH_SESSION_HINT_KEY);
		removeStorage(global.sessionStorage, AUTH_SESSION_HINT_KEY);
		removeStorage(global.sessionStorage, LEGACY_AUTOLOGIN_HINT_KEY);
		removeStorage(global.localStorage, LEGACY_AUTOLOGIN_HINT_KEY);
	}

	function apiBaseUrl(apiBase) {
		return String(apiBase || "").replace(/\/$/, "");
	}

	async function login(apiBase, credentials) {
		var name = credentials && credentials.name ? String(credentials.name).trim() : "";
		var mobile = normalizePhone(credentials && credentials.mobile);
		if (!name || !mobile) {
			return { ok: false, message: "이름과 연락처를 입력해 주세요." };
		}
		var url = apiBaseUrl(apiBase) + "/api/user/login";
		var response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: name, mobile: mobile })
		});
		var data = null;
		try {
			data = await response.json();
		} catch (e) {
			data = null;
		}
		if (!response.ok) {
			return { ok: false, message: parseApiDetail(data) };
		}
		if (!data || !data.access_token) {
			return { ok: false, message: "인증 토큰을 받지 못했습니다." };
		}
		setAccessToken(data.access_token);
		saveSessionHint({ name: name, mobile: mobile });
		return { ok: true, token: data.access_token, data: data };
	}

	async function silentRelogin(apiBase) {
		var hint = getSessionHint();
		if (!hint) {
			return "";
		}
		var result = await login(apiBase, hint);
		return result.ok ? result.token : "";
	}

	async function ensureAccessToken(apiBase, options) {
		options = options || {};
		var token = getAccessToken();
		if (token) {
			return token;
		}
		if (options.skipSilentRelogin) {
			return "";
		}
		return await silentRelogin(apiBase);
	}

	function isUnauthorizedStatus(status) {
		return status === 401 || status === 403;
	}

	function redirectToLogin(message) {
		if (message) {
			alert(message);
		}
		global.location.href = LOGIN_PATH;
	}

	async function requireAccessToken(apiBase, options) {
		var token = await ensureAccessToken(apiBase, options);
		if (!token) {
			redirectToLogin("로그인이 필요합니다.");
			return "";
		}
		return token;
	}

	async function reloginOrRedirect(apiBase, message) {
		clearAccessToken();
		var token = await silentRelogin(apiBase);
		if (token) {
			return token;
		}
		redirectToLogin(message || "로그인이 만료되었습니다. 다시 로그인해 주세요.");
		return "";
	}

	global.AxisAuth = {
		AUTH_TOKEN_KEY: AUTH_TOKEN_KEY,
		AUTH_SESSION_HINT_KEY: AUTH_SESSION_HINT_KEY,
		LOGIN_PATH: LOGIN_PATH,
		MYPAGE_PATH: MYPAGE_PATH,
		getAccessToken: getAccessToken,
		setAccessToken: setAccessToken,
		clearAccessToken: clearAccessToken,
		saveSessionHint: saveSessionHint,
		getSessionHint: getSessionHint,
		clearSessionHint: clearSessionHint,
		login: login,
		silentRelogin: silentRelogin,
		ensureAccessToken: ensureAccessToken,
		requireAccessToken: requireAccessToken,
		reloginOrRedirect: reloginOrRedirect,
		isUnauthorizedStatus: isUnauthorizedStatus,
		redirectToLogin: redirectToLogin,
		parseApiDetail: parseApiDetail,
		normalizePhone: normalizePhone,
		updateHeaderAuthNav: updateHeaderAuthNav,
		syncHeaderAuthNav: syncHeaderAuthNav
	};

	function initHeaderAuthSync() {
		updateHeaderAuthNav(!!getAccessToken());
		syncHeaderAuthNav();
		global.addEventListener("visibilitychange", function () {
			if (global.document.visibilityState === "visible") {
				scheduleHeaderAuthSync();
			}
		});
		global.addEventListener("focus", function () {
			scheduleHeaderAuthSync();
		});
		global.addEventListener("pageshow", function () {
			scheduleHeaderAuthSync();
		});
		global.addEventListener("storage", function (event) {
			if (event && event.key === AUTH_TOKEN_KEY) {
				scheduleHeaderAuthSync(null, 0);
			}
		});
	}

	if (global.document) {
		if (global.document.readyState === "loading") {
			global.document.addEventListener("DOMContentLoaded", initHeaderAuthSync);
		} else {
			initHeaderAuthSync();
		}
	}
})(typeof window !== "undefined" ? window : this);
