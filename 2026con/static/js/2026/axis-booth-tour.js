/**
 * AXIS 2026 부스 스탬프 투어
 * GET  /api/user/booth-tour/visits
 * POST /api/user/booth-tour/scan
 */
(function (global) {
	"use strict";

	var THEME_KEYS = ["A", "B", "C", "D", "E"];
	var BOOTH_STAMP_SLOT_COUNT = 10;
	var STAMP_LABEL_MAX = 12;
	var THEME_STAMP_CLASS = {
		A: "stampA",
		B: "stampB",
		C: "stampC",
		D: "stampD",
		E: "stampE"
	};

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
		if (data.message && typeof data.message === "string") {
			return data.message;
		}
		return "요청 처리에 실패했습니다.";
	}

	function apiBaseUrl(apiBase) {
		return String(apiBase || "").replace(/\/$/, "");
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

	function getTestDateFromUrl() {
		try {
			var value = new URLSearchParams(global.location.search).get("test_date");
			return value && String(value).trim() ? String(value).trim() : null;
		} catch (e) {
			return null;
		}
	}

	function normalizeBoothName(value) {
		return String(value || "")
			.trim()
			.toUpperCase()
			.replace(/[\s_-]+/g, "");
	}

	function extractBoothCode(value) {
		var raw = String(value || "").trim().toUpperCase();
		var match = raw.match(/[ABCDE]\d{1,2}/);
		if (match) {
			return match[0];
		}
		return "";
	}

	function isShortBoothCode(value) {
		return /^[A-E]\d{1,2}$/i.test(String(value || "").trim());
	}

	function formatStampCircleLabel(themeKey, label) {
		var raw = String(label || "").trim();
		if (!raw) {
			var key = normalizeThemeKey(themeKey);
			return THEME_KEYS.indexOf(key) >= 0 ? key : "";
		}
		var code = extractBoothCode(raw);
		if (isShortBoothCode(code) && normalizeBoothName(raw) === normalizeBoothName(code)) {
			return code.toUpperCase();
		}
		if (raw.length <= STAMP_LABEL_MAX) {
			return raw;
		}
		return raw.slice(0, STAMP_LABEL_MAX);
	}

	function stampLabelLength(label) {
		return String(label || "").replace(/\s+/g, "").length;
	}

	function syncStampLabelSize(textEl, displayLabel) {
		if (!textEl) {
			return;
		}
		textEl.classList.remove("is-compact", "is-tiny", "len-long", "len-xlong");
		var len = stampLabelLength(displayLabel);
		if (len > 10) {
			textEl.classList.add("len-xlong");
		} else if (len > 7) {
			textEl.classList.add("len-long");
		} else if (len > 4) {
			textEl.classList.add("is-tiny");
		} else if (len > 1) {
			textEl.classList.add("is-compact");
		}
	}

	function normalizeBoothItem(booth) {
		if (!booth) {
			return null;
		}
		if (typeof booth === "string") {
			return { name: booth, visited: true };
		}
		if (typeof booth !== "object") {
			return null;
		}
		var name =
			booth.name ||
			booth.booth_name ||
			booth.gate_name ||
			booth.label ||
			booth.code ||
			"";
		return Object.assign({}, booth, { name: String(name || "").trim() });
	}

	function boothNamesToItems(names) {
		if (!Array.isArray(names)) {
			return [];
		}
		return names
			.map(function (name) {
				return normalizeBoothItem({ name: name, visited: true });
			})
			.filter(Boolean);
	}

	function coerceBoothsList(booths, status) {
		if (Array.isArray(booths)) {
			return booths.map(normalizeBoothItem).filter(Boolean);
		}
		if (booths && typeof booths === "object") {
			if (Array.isArray(booths.items)) {
				return booths.items.map(normalizeBoothItem).filter(Boolean);
			}
			if (Array.isArray(booths.booth_names)) {
				return boothNamesToItems(booths.booth_names);
			}
			if (Array.isArray(booths.visited_booths)) {
				return booths.visited_booths.map(normalizeBoothItem).filter(Boolean);
			}
			if (Array.isArray(booths.visited)) {
				return booths.visited.map(normalizeBoothItem).filter(Boolean);
			}
		}
		if (status && typeof status === "object") {
			if (Array.isArray(status.booth_names)) {
				return boothNamesToItems(status.booth_names);
			}
			if (Array.isArray(status.visited_booths)) {
				return status.visited_booths.map(normalizeBoothItem).filter(Boolean);
			}
		}
		return [];
	}

	function isBoothVisited(booth) {
		if (!booth) {
			return false;
		}
		if (
			booth.visited === true ||
			booth.visited === 1 ||
			booth.visited === "true" ||
			booth.visited === "1" ||
			booth.is_visited === true ||
			booth.is_visited === 1 ||
			booth.entry_visited === true
		) {
			return true;
		}
		return booth.visited_at != null && String(booth.visited_at).trim() !== "";
	}

	function resolveBoothThemeKey(booth) {
		var fromTheme = normalizeThemeKey(booth && booth.theme);
		if (THEME_KEYS.indexOf(fromTheme) >= 0) {
			return fromTheme;
		}
		var code = extractBoothCode(booth && booth.name);
		if (code) {
			var first = code.charAt(0);
			if (THEME_KEYS.indexOf(first) >= 0) {
				return first;
			}
		}
		var name = normalizeBoothName(booth && booth.name);
		if (name) {
			var letterMatch = name.match(/[ABCDE]/);
			if (letterMatch) {
				return letterMatch[0];
			}
		}
		var svgRoot = getStampTourMapElement();
		if (svgRoot && booth && booth.name) {
			var mapIndex = getMapBoothIndex(svgRoot);
			var lookupCode = extractBoothCode(booth.name);
			var lookupLabel = normalizeMapLabel(booth.name);
			if (lookupCode && mapIndex.byCode[lookupCode.toUpperCase()]) {
				var fromCode = resolveThemeFromMapEntry(mapIndex.byCode[lookupCode.toUpperCase()]);
				if (THEME_KEYS.indexOf(fromCode) >= 0) {
					return fromCode;
				}
			}
			if (lookupLabel && mapIndex.byLabel[lookupLabel]) {
				var fromLabel = resolveThemeFromMapEntry(mapIndex.byLabel[lookupLabel]);
				if (THEME_KEYS.indexOf(fromLabel) >= 0) {
					return fromLabel;
				}
			}
		}
		return fromTheme;
	}

	function normalizeVisitPayload(data) {
		if (!data || typeof data !== "object") {
			return { booths: [], status: {} };
		}
		var root = data;
		if (root.data && typeof root.data === "object" && (root.data.status || root.data.booths)) {
			root = root.data;
		}
		var status = root.status && typeof root.status === "object" ? root.status : {};
		var booths = coerceBoothsList(root.booths, status);
		if (!booths.length && status.visited_booth_count > 0) {
			booths = coerceBoothsList(null, status);
		}
		return { booths: booths, status: status };
	}

	function mergeVisitPayloads() {
		var merged = { booths: [], status: {} };
		for (var i = 0; i < arguments.length; i++) {
			var payload = normalizeVisitPayload(arguments[i]);
			if (payload.status && typeof payload.status === "object") {
				merged.status = Object.assign({}, merged.status, payload.status);
			}
			if (Array.isArray(payload.booths)) {
				merged.booths = merged.booths.concat(payload.booths);
			}
		}
		merged.booths = dedupeBoothItems(merged.booths);
		return merged;
	}

	function boothItemKey(booth) {
		if (!booth) {
			return "";
		}
		if (booth.gate_id != null) {
			return "id:" + booth.gate_id;
		}
		var code = extractBoothCode(booth.name);
		if (code) {
			return "code:" + code;
		}
		return "name:" + normalizeBoothName(booth.name);
	}

	function dedupeBoothItems(booths) {
		var map = {};
		(booths || []).forEach(function (booth) {
			var item = normalizeBoothItem(booth);
			if (!item) {
				return;
			}
			var key = boothItemKey(item);
			if (!key) {
				return;
			}
			var prev = map[key];
			if (!prev || (isBoothVisited(item) && !isBoothVisited(prev))) {
				map[key] = item;
			} else if (prev && isBoothVisited(item) === isBoothVisited(prev)) {
				map[key] = Object.assign({}, prev, item);
			}
		});
		return Object.keys(map).map(function (key) {
			return map[key];
		});
	}

	function normalizeThemeKey(theme) {
		var raw = String(theme || "").trim().toUpperCase();
		if (!raw) {
			return "";
		}
		if (THEME_KEYS.indexOf(raw) >= 0) {
			return raw;
		}
		for (var i = 0; i < THEME_KEYS.length; i++) {
			if (raw.indexOf(THEME_KEYS[i]) >= 0) {
				return THEME_KEYS[i];
			}
		}
		var first = raw.charAt(0);
		return THEME_KEYS.indexOf(first) >= 0 ? first : first;
	}

	function parseGateCodeFromScan(raw) {
		var text = String(raw || "").trim();
		if (!text) {
			return "";
		}
		try {
			var url = new URL(text);
			var keys = ["gate_code", "code", "gate", "g"];
			for (var i = 0; i < keys.length; i++) {
				var param = url.searchParams.get(keys[i]);
				if (param && String(param).trim()) {
					return String(param).trim();
				}
			}
			var parts = url.pathname.split("/").filter(Boolean);
			if (parts.length) {
				return parts[parts.length - 1];
			}
		} catch (e) {
			/* plain text gate code */
		}
		return text;
	}

	function isAlreadyVisitedMessage(message) {
		var msg = String(message || "");
		return /이미|중복|duplicate|already/i.test(msg);
	}

	function buildVisitsUrl(apiBase, testDate) {
		var url = apiBaseUrl(apiBase) + "/api/user/booth-tour/visits";
		if (testDate) {
			url += "?test_date=" + encodeURIComponent(testDate);
		}
		return url;
	}

	/** GET /api/user/booth-tour/visits */
	async function fetchBoothTourVisits(apiBase, token, testDate) {
		var dateParam = testDate != null ? testDate : getTestDateFromUrl();
		var result = await apiFetch(buildVisitsUrl(apiBase, dateParam), token);
		if (result.response.status === 401) {
			return { ok: false, unauthorized: true, message: "로그인이 만료되었습니다." };
		}
		if (result.response.status === 403) {
			return { ok: false, forbidden: true, message: parseApiDetail(result.data) || "조회가 거부되었습니다. (403)" };
		}
		if (!result.response.ok) {
			return { ok: false, message: parseApiDetail(result.data) };
		}
		return { ok: true, data: result.data };
	}

	/** POST /api/user/booth-tour/scan */
	async function scanBoothTourGate(apiBase, token, gateCode, testDate) {
		var code = String(gateCode || "").trim();
		if (!code) {
			return { ok: false, message: "QR 코드를 인식하지 못했습니다." };
		}
		var body = { gate_code: code };
		var dateParam = testDate != null ? testDate : getTestDateFromUrl();
		if (dateParam) {
			body.test_date = dateParam;
		}
		var url = apiBaseUrl(apiBase) + "/api/user/booth-tour/scan";
		var result = await apiFetch(url, token, { method: "POST", body: body });
		if (result.response.status === 401) {
			return { ok: false, unauthorized: true, message: "로그인이 만료되었습니다." };
		}
		if (result.response.status === 403) {
			return { ok: false, forbidden: true, message: parseApiDetail(result.data) || "스캔이 거부되었습니다. (403)" };
		}
		if (!result.response.ok) {
			var errMsg = parseApiDetail(result.data);
			return {
				ok: false,
				message: errMsg,
				alreadyVisited: isAlreadyVisitedMessage(errMsg)
			};
		}
		var data = result.data || {};
		if (data.success === false) {
			var failMsg = data.message || "스캔에 실패했습니다.";
			return {
				ok: false,
				message: failMsg,
				alreadyVisited: isAlreadyVisitedMessage(failMsg),
				data: data
			};
		}
		return { ok: true, data: data };
	}

	function resetStampCircle(el) {
		if (!el) {
			return;
		}
		el.classList.remove("stamped", "clear", "A", "B", "C", "D", "E", "visited");
		var label = el.querySelector("p");
		if (label) {
			label.textContent = "";
			label.classList.remove("is-compact", "is-tiny", "len-long", "len-xlong");
			label.removeAttribute("title");
		}
	}

	function applyStampCircle(el, themeKey, label) {
		if (!el) {
			return;
		}
		var key = normalizeThemeKey(themeKey);
		if (THEME_KEYS.indexOf(key) < 0) {
			key = normalizeThemeKey(label);
		}
		if (THEME_KEYS.indexOf(key) < 0 && label) {
			var letter = String(label).trim().toUpperCase().charAt(0);
			if (THEME_KEYS.indexOf(letter) >= 0) {
				key = letter;
			}
		}
		if (THEME_KEYS.indexOf(key) < 0) {
			return;
		}
		resetStampCircle(el);
		el.classList.add("stamped", "clear", key);
		var textEl = el.querySelector("p");
		if (textEl) {
			var rawLabel = label != null && String(label).trim() !== "" ? String(label).trim() : key;
			var displayLabel = formatStampCircleLabel(key, rawLabel);
			textEl.textContent = displayLabel;
			syncStampLabelSize(textEl, displayLabel);
			if (rawLabel.length > STAMP_LABEL_MAX) {
				textEl.setAttribute("title", rawLabel);
			} else {
				textEl.removeAttribute("title");
			}
		}
	}

	function getVisitedBooths(booths, status) {
		var list = Array.isArray(booths) ? booths.map(normalizeBoothItem).filter(Boolean) : [];
		var visited = list.filter(function (booth) {
			return isBoothVisited(booth);
		});
		if (!visited.length && list.length && status && Number(status.visited_booth_count) > 0) {
			var implicitVisited = list.filter(function (booth) {
				return booth && booth.name;
			});
			if (
				implicitVisited.length &&
				implicitVisited.length <= Number(status.visited_booth_count) &&
				implicitVisited.every(function (booth) {
					return booth.visited == null && !booth.visited_at;
				})
			) {
				visited = implicitVisited.map(function (booth) {
					return Object.assign({}, booth, { visited: true });
				});
			}
		}
		return visited.sort(function (a, b) {
			var ta = a.visited_at ? Date.parse(a.visited_at) : 0;
			var tb = b.visited_at ? Date.parse(b.visited_at) : 0;
			if (ta !== tb) {
				return ta - tb;
			}
			return String(a.name || "").localeCompare(String(b.name || ""));
		});
	}

	function boothStampLabel(booth) {
		var rawName = String(booth && booth.name || "").trim();
		var code = extractBoothCode(rawName);
		if (isShortBoothCode(code) && normalizeBoothName(rawName) === normalizeBoothName(code)) {
			return code.toUpperCase();
		}
		return formatStampCircleLabel("", rawName);
	}

	function renderBoothSlots(booths, status) {
		var visitedBooths = getVisitedBooths(booths, status);
		var slotCount = BOOTH_STAMP_SLOT_COUNT;
		if (status && status.required_booth_count != null) {
			slotCount = Math.min(BOOTH_STAMP_SLOT_COUNT, Math.max(1, Number(status.required_booth_count) || BOOTH_STAMP_SLOT_COUNT));
		}
		for (var i = 1; i <= BOOTH_STAMP_SLOT_COUNT; i++) {
			var slot = document.getElementById("stampBooth" + i);
			if (!slot) {
				continue;
			}
			slot.style.display = i <= slotCount ? "" : "none";
			resetStampCircle(slot);
			var booth = visitedBooths[i - 1];
			if (booth) {
				applyStampCircle(slot, resolveBoothThemeKey(booth), boothStampLabel(booth));
			}
		}
	}

	function renderClosingStamp(status) {
		var el = document.getElementById("stampClosing");
		if (!el) {
			return;
		}
		el.classList.toggle("clear", !!(status && status.closing_visited));
	}

	function renderLotteryGift(status) {
		var wrap = document.getElementById("stampGift");
		if (!wrap) {
			return;
		}
		var lotteryCode = status && status.lottery_code != null ? String(status.lottery_code) : "";
		var show = !!(status && status.tour_completed && lotteryCode);
		wrap.style.display = show ? "" : "none";
		if (!show) {
			return;
		}
		var digits = lotteryCode.replace(/\D/g, "").padStart(4, "0").slice(-4).split("");
		var nums = wrap.querySelectorAll(".giftNum .num");
		nums.forEach(function (node, idx) {
			node.textContent = digits[idx] != null ? digits[idx] : "0";
		});
	}

	function renderProgressText(status) {
		var el = document.getElementById("stampTourProgressText");
		if (!el) {
			return;
		}
		var visited = status && status.visited_booth_count != null ? Number(status.visited_booth_count) : 0;
		var required = status && status.required_booth_count != null ? Number(status.required_booth_count) : 10;
		var countSuffix = status && status.closing_visited ? ", 폐회식 완료" : "";
		el.style.whiteSpace = "pre-line";
		el.textContent =
			"10개 이상의 부스를 방문하고 폐회식 QR 인증까지 완료하시면 경품 추첨 참여의 기회가 주어집니다!\n" +
			"(현재 " +
			visited +
			" / " +
			required +
			"부스" +
			countSuffix +
			")";
	}

	var MAP_VISITED_CLASS = "boothVisited";
	var MAP_ZONE_LABEL_RE = /(SOLUTION|OFFICE|INSIGHT|EXPERIENCE|HUB|FUN\s*존|LOUNGE|ENTRANCE|EXIT|카페테리아|헬프데스크)/i;
	var mapBoothIndexCache = null;

	function normalizeMapLabel(value) {
		return String(value || "")
			.trim()
			.toUpperCase()
			.replace(/\s+/g, "")
			.replace(/[^\w가-힣&+]/g, "");
	}

	function isMapZoneLabel(label) {
		var text = String(label || "").trim();
		if (!text) {
			return true;
		}
		return MAP_ZONE_LABEL_RE.test(text);
	}

	function collectMapNodeLabel(node) {
		if (!node) {
			return "";
		}
		var parts = [];
		node.querySelectorAll("text tspan").forEach(function (tspan) {
			var text = String(tspan.textContent || "").trim();
			if (text) {
				parts.push(text);
			}
		});
		return parts.join("");
	}

	function getMapHighlightNode(node) {
		if (!node) {
			return null;
		}
		if (node.closest) {
			var anchor = node.closest('a[href^="#explain"]');
			if (anchor) {
				return anchor;
			}
		}
		return node.closest ? node.closest("g") || node : node;
	}

	function registerMapIndexEntry(index, node, code, label) {
		var highlightNode = getMapHighlightNode(node);
		if (!highlightNode) {
			return;
		}
		var entry = {
			node: highlightNode,
			code: String(code || "").trim(),
			label: String(label || "").trim()
		};
		var codeKey = entry.code ? entry.code.toUpperCase() : "";
		var labelKey = normalizeMapLabel(entry.label);
		if (codeKey) {
			if (!index.byCode[codeKey]) {
				index.byCode[codeKey] = entry;
			}
			var baseCode = codeKey.replace(/_\d+$/, "");
			if (baseCode && !index.byCode[baseCode]) {
				index.byCode[baseCode] = entry;
			}
			var extracted = extractBoothCode(codeKey);
			if (extracted && !index.byCode[extracted]) {
				index.byCode[extracted] = entry;
			}
		}
		if (labelKey && !isMapZoneLabel(entry.label) && !index.byLabel[labelKey]) {
			index.byLabel[labelKey] = entry;
		}
	}

	function buildMapBoothIndex(svgRoot) {
		var index = { byCode: {}, byLabel: {} };
		if (!svgRoot) {
			return index;
		}
		svgRoot.querySelectorAll('a[href^="#explain"]').forEach(function (anchor) {
			var textEl = anchor.querySelector("text[id]");
			var code = textEl && textEl.id ? textEl.id : "";
			var label = collectMapNodeLabel(anchor);
			if (isMapZoneLabel(label)) {
				return;
			}
			registerMapIndexEntry(index, anchor, code, label);
		});
		svgRoot.querySelectorAll("g > text[id], g text[id]").forEach(function (textEl) {
			if (textEl.closest('a[href^="#explain"]')) {
				return;
			}
			var parent = textEl.closest("g");
			if (!parent) {
				return;
			}
			var label = collectMapNodeLabel(parent);
			if (isMapZoneLabel(label)) {
				return;
			}
			registerMapIndexEntry(index, parent, textEl.id, label);
		});
		return index;
	}

	function getMapBoothIndex(svgRoot) {
		if (!svgRoot) {
			return { byCode: {}, byLabel: {} };
		}
		if (!mapBoothIndexCache || mapBoothIndexCache.root !== svgRoot) {
			mapBoothIndexCache = {
				root: svgRoot,
				index: buildMapBoothIndex(svgRoot)
			};
		}
		return mapBoothIndexCache.index;
	}

	function resetMapBoothIndexCache() {
		mapBoothIndexCache = null;
	}

	function getStampTourMapElement() {
		return document.getElementById("stampTourMap") || document.querySelector("#stampSec .map svg");
	}

	function pushMapTarget(targets, node) {
		var highlightNode = getMapHighlightNode(node);
		if (!highlightNode || targets.indexOf(highlightNode) >= 0) {
			return;
		}
		targets.push(highlightNode);
	}

	function findSvgBoothTargets(svgRoot, boothName) {
		if (!svgRoot) {
			return [];
		}
		var rawName = String(boothName || "").trim();
		if (!rawName) {
			return [];
		}
		var index = getMapBoothIndex(svgRoot);
		var targets = [];
		var code = extractBoothCode(rawName);
		var normalizedName = normalizeMapLabel(rawName);
		var normalizedCode = code ? normalizeMapLabel(code) : "";

		[code, code ? code.replace(/_\d+$/, "") : "", normalizedCode].forEach(function (candidate) {
			if (candidate && index.byCode[candidate.toUpperCase()]) {
				pushMapTarget(targets, index.byCode[candidate.toUpperCase()].node);
			}
		});
		if (normalizedName && index.byLabel[normalizedName]) {
			pushMapTarget(targets, index.byLabel[normalizedName].node);
		}
		if (!targets.length && normalizedName) {
			Object.keys(index.byLabel).forEach(function (key) {
				if (key === normalizedName || key.indexOf(normalizedName) >= 0 || normalizedName.indexOf(key) >= 0) {
					pushMapTarget(targets, index.byLabel[key].node);
				}
			});
		}
		if (!targets.length) {
			svgRoot.querySelectorAll("text tspan").forEach(function (tspan) {
				var label = normalizeMapLabel(collectMapNodeLabel(tspan.parentNode));
				if (label && (label === normalizedName || label.indexOf(normalizedName) >= 0 || normalizedName.indexOf(label) >= 0)) {
					pushMapTarget(targets, tspan);
				}
			});
		}
		return targets;
	}

	function resolveThemeFromMapEntry(entry) {
		if (!entry || !entry.code) {
			return "";
		}
		return normalizeThemeKey(entry.code.charAt(0));
	}

	function clearSvgMapHighlights(svgRoot) {
		if (!svgRoot) {
			return;
		}
		svgRoot.querySelectorAll("." + MAP_VISITED_CLASS).forEach(function (node) {
			node.classList.remove(MAP_VISITED_CLASS);
		});
		THEME_KEYS.forEach(function (key) {
			var stampClass = THEME_STAMP_CLASS[key];
			svgRoot.querySelectorAll("." + stampClass).forEach(function (node) {
				node.classList.remove(stampClass);
			});
		});
	}

	function highlightSvgBooth(booth) {
		if (!isBoothVisited(booth)) {
			return;
		}
		var name = String(booth.name || "").trim();
		if (!name) {
			return;
		}
		var svgRoot = getStampTourMapElement();
		if (!svgRoot) {
			return;
		}
		var index = getMapBoothIndex(svgRoot);
		var targets = findSvgBoothTargets(svgRoot, name);
		if (!targets.length) {
			return;
		}
		var themeKey = resolveBoothThemeKey(booth);
		if (THEME_KEYS.indexOf(themeKey) < 0) {
			var code = extractBoothCode(name);
			if (code && index.byCode[code.toUpperCase()]) {
				themeKey = resolveThemeFromMapEntry(index.byCode[code.toUpperCase()]);
			} else if (index.byLabel[normalizeMapLabel(name)]) {
				themeKey = resolveThemeFromMapEntry(index.byLabel[normalizeMapLabel(name)]);
			}
		}
		var stampClass = THEME_STAMP_CLASS[themeKey];
		targets.forEach(function (target) {
			THEME_KEYS.forEach(function (key) {
				target.classList.remove(THEME_STAMP_CLASS[key]);
			});
			target.classList.add(MAP_VISITED_CLASS);
			if (stampClass) {
				target.classList.add(stampClass);
			}
		});
	}

	function renderSvgMap(booths) {
		var svgRoot = getStampTourMapElement();
		resetMapBoothIndexCache();
		clearSvgMapHighlights(svgRoot);
		if (!svgRoot || !Array.isArray(booths)) {
			return;
		}
		booths.forEach(highlightSvgBooth);
	}

	function renderVisitStatus(data) {
		var payload = normalizeVisitPayload(data);
		var status = payload.status || {};
		renderBoothSlots(payload.booths, status);
		renderClosingStamp(status);
		renderLotteryGift(status);
		renderProgressText(status);
		renderSvgMap(payload.booths);
	}

	function getVisitStatusCounts(data) {
		var payload = normalizeVisitPayload(data);
		var status = payload.status || {};
		return {
			visitedCount: status.visited_booth_count != null ? Number(status.visited_booth_count) : 0,
			closingVisited: !!status.closing_visited,
			lotteryIssued: !!status.lottery_code_issued,
			tourCompleted: !!status.tour_completed
		};
	}

	/**
	 * 스캔 결과에 따른 팝업 ID 결정.
	 * prevState: { visitedCount, closingVisited } — 스캔 직전 상태(있으면 방문 수 증가 여부로 중복 판정)
	 */
	function resolveScanPopupId(result, prevState) {
		if (!result || !result.ok || !result.data) {
			return null;
		}
		var data = result.data;
		if (data.success === false) {
			return isAlreadyVisitedMessage(data.message) ? "already" : null;
		}
		if (
			data.already_visited === true ||
			data.duplicate === true ||
			data.is_duplicate === true ||
			data.newly_visited === false
		) {
			return "already";
		}
		if (isAlreadyVisitedMessage(data.message)) {
			return "already";
		}
		var counts = getVisitStatusCounts(data);
		if (prevState) {
			var gainedClosing = counts.closingVisited && !prevState.closingVisited;
			var gainedBooth = counts.visitedCount > (Number(prevState.visitedCount) || 0);
			if (!gainedClosing && !gainedBooth) {
				return "already";
			}
		}
		if (counts.lotteryIssued) {
			return "cong";
		}
		return "stamp";
	}

	function detectMobilePlatform() {
		var ua = String(global.navigator && global.navigator.userAgent ? global.navigator.userAgent : "");
		if (/iPad|iPhone|iPod/i.test(ua) || (global.navigator.platform === "MacIntel" && global.navigator.maxTouchPoints > 1)) {
			return "ios";
		}
		if (/Android/i.test(ua)) {
			return "android";
		}
		return "other";
	}

	function isSecureCameraContext() {
		if (!global.isSecureContext) {
			return global.location && (global.location.protocol === "https:" || global.location.hostname === "localhost" || global.location.hostname === "127.0.0.1");
		}
		return true;
	}

	function classifyCameraError(err) {
		var name = err && err.name ? String(err.name) : "";
		var msg = String(err && err.message ? err.message : err || "").toLowerCase();
		if (name === "NotAllowedError" || name === "PermissionDeniedError" || /permission|denied|not allowed|dismissed/i.test(msg)) {
			return "denied";
		}
		if (name === "NotFoundError" || name === "DevicesNotFoundError" || /not found|no camera|device not found/i.test(msg)) {
			return "notfound";
		}
		if (name === "NotReadableError" || name === "TrackStartError" || /not readable|in use|could not start/i.test(msg)) {
			return "inuse";
		}
		if (
			name === "OverconstrainedError" ||
			name === "ConstraintNotSatisfiedError" ||
			/overconstrained|constraint|no suitable device/i.test(msg)
		) {
			return "overconstrained";
		}
		if (name === "NotSupportedError" || /not supported|unsupported/i.test(msg)) {
			return "notsupported";
		}
		if (!isSecureCameraContext()) {
			return "insecure";
		}
		return "unknown";
	}

	function getCameraPermissionHelpSteps(errorKind) {
		var platform = detectMobilePlatform();
		var kind = errorKind || "denied";
		if (kind === "insecure") {
			return ["보안 연결(HTTPS)에서만 카메라를 사용할 수 있습니다.", "공식 사이트 주소로 다시 접속해 주세요."];
		}
		if (kind === "notfound") {
			return ["기기에 사용 가능한 카메라가 없거나 카메라를 사용할 수 없는 상태입니다.", "다른 기기에서 시도하거나 브라우저를 다시 실행해 주세요."];
		}
		if (platform === "ios") {
			return [
				"Safari/Chrome 하단 또는 상단에 표시되는 카메라 허용 팝업에서 [허용]을 선택해 주세요.",
				"팝업이 보이지 않으면 iPhone [설정] > [Safari] > [카메라]에서 [묻기] 또는 [허용]으로 변경해 주세요.",
				"Chrome을 사용 중이라면 [설정] > [Chrome] > [카메라]에서 허용해 주세요.",
				"권한 변경 후 이 화면에서 [다시 시도]를 눌러 주세요."
			];
		}
		if (platform === "android") {
			return [
				"주소창 옆 자물쇠(또는 사이트 정보) 아이콘을 눌러 [권한] 또는 [사이트 설정]으로 이동해 주세요.",
				"[카메라] 권한을 [허용]으로 변경해 주세요.",
				"권한 팝업이 뜨면 [허용] 또는 [앱 사용 중에만 허용]을 선택해 주세요.",
				"변경 후 [다시 시도]를 눌러 주세요."
			];
		}
		return [
			"브라우저 주소창 근처의 사이트 설정에서 카메라 권한을 [허용]으로 변경해 주세요.",
			"권한 팝업이 표시되면 [허용]을 선택해 주세요.",
			"변경 후 [다시 시도]를 눌러 주세요."
		];
	}

	async function queryCameraPermission() {
		if (!global.navigator || !global.navigator.permissions || !global.navigator.permissions.query) {
			return "unknown";
		}
		try {
			var result = await global.navigator.permissions.query({ name: "camera" });
			return result && result.state ? result.state : "unknown";
		} catch (e) {
			return "unknown";
		}
	}

	async function requestCameraAccess() {
		if (!global.navigator || !global.navigator.mediaDevices || !global.navigator.mediaDevices.getUserMedia) {
			throw new Error("unsupported");
		}
		var stream = await global.navigator.mediaDevices.getUserMedia({
			video: {
				facingMode: { ideal: "environment" },
				width: { ideal: 1280 },
				height: { ideal: 720 }
			},
			audio: false
		});
		stream.getTracks().forEach(function (track) {
			track.stop();
		});
		return true;
	}

	async function pickBackCameraId() {
		if (typeof global.Html5Qrcode === "undefined" || !global.Html5Qrcode.getCameras) {
			return null;
		}
		var cameras = await global.Html5Qrcode.getCameras();
		if (!cameras || !cameras.length) {
			return null;
		}
		var backCamera = null;
		for (var i = 0; i < cameras.length; i++) {
			var label = String(cameras[i].label || "").toLowerCase();
			if (/back|rear|environment|후면|trás/i.test(label)) {
				backCamera = cameras[i];
				break;
			}
		}
		var selected = backCamera || cameras[cameras.length - 1];
		return selected && selected.id ? selected.id : null;
	}

	function buildHtml5QrcodeScanConfig() {
		return {
			fps: 10,
			qrbox: function (viewfinderWidth, viewfinderHeight) {
				var edge = Math.min(viewfinderWidth, viewfinderHeight);
				if (!edge || edge < 1) {
					edge = 220;
				}
				var size = Math.max(120, Math.min(260, Math.floor(edge * 0.72)));
				return { width: size, height: size };
			}
		};
	}

	async function listCameraStartCandidates() {
		var candidates = [];
		var seen = {};

		function pushCandidate(candidate) {
			if (candidate == null) {
				return;
			}
			var key = typeof candidate === "string" ? candidate : JSON.stringify(candidate);
			if (seen[key]) {
				return;
			}
			seen[key] = true;
			candidates.push(candidate);
		}

		if (typeof global.Html5Qrcode !== "undefined" && global.Html5Qrcode.getCameras) {
			try {
				var cameras = await global.Html5Qrcode.getCameras();
				if (cameras && cameras.length) {
					var backId = null;
					for (var i = 0; i < cameras.length; i++) {
						var label = String(cameras[i].label || "").toLowerCase();
						if (/back|rear|environment|후면|trás/i.test(label) && cameras[i].id) {
							backId = cameras[i].id;
							break;
						}
					}
					if (backId) {
						pushCandidate(backId);
					}
					for (var j = 0; j < cameras.length; j++) {
						pushCandidate(cameras[j].id);
					}
				}
			} catch (e) {
				/* getCameras may fail before permission */
			}
		}

		pushCandidate({ facingMode: "environment" });
		pushCandidate({ facingMode: "user" });

		return candidates;
	}

	async function startHtml5QrcodeCamera(scanner, onSuccess, onScanError) {
		if (!scanner || typeof scanner.start !== "function") {
			return { ok: false, error: new Error("scanner_unavailable") };
		}

		var config = buildHtml5QrcodeScanConfig();
		var candidates = await listCameraStartCandidates();
		var lastError = null;
		var noop = onScanError || function () {};

		for (var i = 0; i < candidates.length; i++) {
			try {
				if (scanner.isScanning) {
					await scanner.stop();
				}
			} catch (stopErr) {
				/* ignore */
			}
			try {
				if (typeof scanner.clear === "function") {
					scanner.clear();
				}
			} catch (clearErr) {
				/* ignore */
			}

			try {
				await scanner.start(candidates[i], config, onSuccess, noop);
				return { ok: true, camera: candidates[i] };
			} catch (e) {
				lastError = e;
			}
		}

		return { ok: false, error: lastError || new Error("camera_start_failed") };
	}

	async function waitForElementLayout(el, timeoutMs) {
		if (!el) {
			return false;
		}
		var deadline = Date.now() + (timeoutMs || 2000);
		while (Date.now() < deadline) {
			if (el.offsetWidth > 40 && el.offsetHeight > 40) {
				return true;
			}
			await new Promise(function (resolve) {
				setTimeout(resolve, 40);
			});
		}
		return el.offsetWidth > 0 && el.offsetHeight > 0;
	}

	global.AxisBoothTour = {
		THEME_KEYS: THEME_KEYS,
		BOOTH_STAMP_SLOT_COUNT: BOOTH_STAMP_SLOT_COUNT,
		parseApiDetail: parseApiDetail,
		parseGateCodeFromScan: parseGateCodeFromScan,
		getTestDateFromUrl: getTestDateFromUrl,
		fetchBoothTourVisits: fetchBoothTourVisits,
		scanBoothTourGate: scanBoothTourGate,
		normalizeVisitPayload: normalizeVisitPayload,
		mergeVisitPayloads: mergeVisitPayloads,
		renderVisitStatus: renderVisitStatus,
		getVisitStatusCounts: getVisitStatusCounts,
		resolveScanPopupId: resolveScanPopupId,
		isSecureCameraContext: isSecureCameraContext,
		classifyCameraError: classifyCameraError,
		getCameraPermissionHelpSteps: getCameraPermissionHelpSteps,
		queryCameraPermission: queryCameraPermission,
		requestCameraAccess: requestCameraAccess,
		pickBackCameraId: pickBackCameraId,
		buildHtml5QrcodeScanConfig: buildHtml5QrcodeScanConfig,
		listCameraStartCandidates: listCameraStartCandidates,
		startHtml5QrcodeCamera: startHtml5QrcodeCamera,
		waitForElementLayout: waitForElementLayout
	};
})(typeof window !== "undefined" ? window : this);
