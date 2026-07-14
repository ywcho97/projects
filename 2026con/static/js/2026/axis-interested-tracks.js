/**
 * AXIS 2026 관심 트랙 표시 (일차별 트랙명)
 */
(function (global) {
	const DAY_KEYS = ["DAY1", "DAY2", "DAY3"];
	const DAY_LABEL = { DAY1: "1일차", DAY2: "2일차", DAY3: "3일차" };

	const TRACK_LABELS = {
		DAY1: {
			1: "CX Strategy",
			2: "CX Operation",
			3: "AX Strategy",
			4: "People & Organization",
			5: "CX ROI & Profitability"
		},
		DAY2: {
			1: "AICC Innovation",
			2: "Experience Innovation",
			3: "Risk Operation",
			4: "AX Execution",
			5: "AI-Driven CX & Quality Innovation"
		},
		DAY3: {
			1: "넷제로와 에너지전환",
			2: "지속가능 인프라",
			3: "대전환시대의 산업혁신",
			4: "고용위기와 사회안전망",
			5: "금융안전과 재무관리체계",
			6: "기능변화에 따른 혁신체계",
			7: "공공정책 대응전략",
			8: "AX기반 업무혁신",
			9: "노동정책 변화 대응",
			10: "사업추진에 따른 리스크관리"
		}
	};

	const DAY_BLOCK_SEPARATOR_RE = /\s*\/\s*(?=(?:DAY[123]|[123]일차)\s*:)/g;

	function isInterestedTracksDayObject(value) {
		if (!value || typeof value !== "object" || Array.isArray(value)) {
			return false;
		}
		return DAY_KEYS.some((key) => Object.prototype.hasOwnProperty.call(value, key));
	}

	function tryParseInterestedTracksJson(text) {
		if (typeof text !== "string") {
			return null;
		}
		const trimmed = text.trim();
		if (!trimmed.startsWith("{")) {
			return null;
		}
		try {
			const parsed = JSON.parse(trimmed);
			return isInterestedTracksDayObject(parsed) ? parsed : null;
		} catch (e) {
			return null;
		}
	}

	function trackNameForDay(dayKey, trackNo) {
		const dayMap = TRACK_LABELS[dayKey];
		if (!dayMap) {
			return null;
		}
		const n = Number(trackNo);
		return dayMap[n] || null;
	}

	function resolveTrackLabel(dayKey, item) {
		if (item == null) {
			return "";
		}
		if (typeof item === "object") {
			const name = (item.name || "").trim();
			if (name) {
				return name;
			}
			const no = item.track_no != null ? item.track_no : item.no;
			if (no != null) {
				return trackNameForDay(dayKey, no) || `트랙 ${no}`;
			}
			return "";
		}
		if (typeof item === "number" || (typeof item === "string" && /^\d+$/.test(item.trim()))) {
			return trackNameForDay(dayKey, item) || `트랙 ${item}`;
		}
		return String(item).trim();
	}

	function normalizeInterestedTracksNewlines(text) {
		if (typeof text !== "string" || !text.trim()) {
			return text;
		}
		return text
			.replace(DAY_BLOCK_SEPARATOR_RE, "\n")
			.replace(/\bDAY([123])\s*:/g, (_, n) => `${n}일차 :`)
			.trim();
	}

	function formatDayObject(raw, options) {
		const separator = options && options.separator != null ? options.separator : "\n";
		const emptyValue = options && options.emptyValue != null ? options.emptyValue : "";
		if (!raw || typeof raw !== "object") {
			return emptyValue;
		}
		const parts = [];
		DAY_KEYS.forEach((dayKey) => {
			const arr = raw[dayKey];
			if (!Array.isArray(arr) || !arr.length) {
				return;
			}
			const labels = arr.map((item) => resolveTrackLabel(dayKey, item)).filter(Boolean).join(", ");
			if (labels) {
				parts.push(`${DAY_LABEL[dayKey]} : ${labels}`);
			}
		});
		return parts.length ? parts.join(separator) : emptyValue;
	}

	function formatWithMeta(payload, options) {
		const meta = payload && payload.interested_tracks_meta;
		if (meta && typeof meta === "object") {
			return formatDayObject(meta, options);
		}
		return formatDayObject(payload && payload.interested_tracks, options);
	}

	function formatFromApi(raw, options) {
		const emptyValue = options && options.emptyValue != null ? options.emptyValue : "";
		if (raw == null) {
			return emptyValue;
		}
		if (typeof raw === "string") {
			const parsed = tryParseInterestedTracksJson(raw);
			if (parsed) {
				return formatDayObject(parsed, options);
			}
			return normalizeInterestedTracksNewlines(raw.trim()) || emptyValue;
		}
		if (Array.isArray(raw)) {
			if (!raw.length) {
				return emptyValue;
			}
			return raw
				.map((item) => {
					if (typeof item === "object" && item !== null) {
						return resolveTrackLabel("DAY1", item);
					}
					return String(item);
				})
				.filter(Boolean)
				.join(", ");
		}
		if (typeof raw === "object") {
			return formatDayObject(raw, options);
		}
		return String(raw);
	}

	function formatForProfile(payload, options) {
		const profileOptions = Object.assign({ separator: "\n", emptyValue: "" }, options || {});
		const display = payload && payload.interested_tracks_display;
		if (typeof display === "string" && display.trim() !== "") {
			const parsed = tryParseInterestedTracksJson(display);
			if (parsed) {
				return formatDayObject(parsed, profileOptions);
			}
			return normalizeInterestedTracksNewlines(display.trim()) || profileOptions.emptyValue;
		}
		const summary = payload && payload.interested_tracks_summary;
		if (typeof summary === "string" && summary.trim() !== "") {
			const parsed = tryParseInterestedTracksJson(summary);
			if (parsed) {
				return formatDayObject(parsed, profileOptions);
			}
			return normalizeInterestedTracksNewlines(summary.trim()) || profileOptions.emptyValue;
		}
		const withMeta = formatWithMeta(payload, profileOptions);
		if (withMeta) {
			return withMeta;
		}
		return formatFromApi(payload && payload.interested_tracks, profileOptions);
	}

	function formatForPay(payload) {
		return formatForProfile(payload, { separator: " / ", emptyValue: "없음" });
	}

	global.AxisInterestedTracks = {
		DAY_KEYS,
		DAY_LABEL,
		TRACK_LABELS,
		isInterestedTracksDayObject,
		tryParseInterestedTracksJson,
		trackNameForDay,
		resolveTrackLabel,
		normalizeInterestedTracksNewlines,
		formatDayObject,
		formatWithMeta,
		formatFromApi,
		formatForProfile,
		formatForPay
	};
})(typeof window !== "undefined" ? window : this);
