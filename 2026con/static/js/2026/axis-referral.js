/**
 * AXIS 2026 추천코드(초대코드)
 * GET {apiBase}/api/user/referral-codes/validate?code=...
 * ReferralDiscountType: RATE | AMOUNT | PER_PLAN_RATE | PER_PLAN_AMOUNT | PER_PLAN_FIXED
 */
(function (global) {
	const REFERRAL_SESSION_KEY = "axis2026_referral";

	const TICKET_SELECT_VALUE = { DAY1: "1", DAY2: "2", DAY3: "3" };
	const TICKET_FROM_SELECT = { "1": "DAY1", "2": "DAY2", "3": "DAY3" };
	const DAY_KEY_FROM_TICKET = { DAY1: "day1", DAY2: "day2", DAY3: "day3" };
	const TICKET_LABEL_KO = { DAY1: "1일권", DAY2: "2일권", DAY3: "3일권" };

	const PER_PLAN_TYPES = ["PER_PLAN_RATE", "PER_PLAN_AMOUNT", "PER_PLAN_FIXED"];

	function readReferralSession() {
		try {
			const raw = sessionStorage.getItem(REFERRAL_SESSION_KEY);
			if (!raw) {
				return null;
			}
			return JSON.parse(raw);
		} catch (e) {
			return null;
		}
	}

	function writeReferralSession(obj) {
		if (!obj) {
			sessionStorage.removeItem(REFERRAL_SESSION_KEY);
			return;
		}
		sessionStorage.setItem(REFERRAL_SESSION_KEY, JSON.stringify(obj));
	}

	function pickReferralCodeFromUrl() {
		const params = new URLSearchParams(window.location.search);
		const keys = ["code", "referral_code", "invite_code", "ref"];
		for (let i = 0; i < keys.length; i++) {
			const v = params.get(keys[i]);
			if (v != null && String(v).trim() !== "") {
				return String(v).trim();
			}
		}
		return null;
	}

	function normalizeDiscountRate(rate) {
		const n = Number(rate);
		if (!Number.isFinite(n) || n <= 0) {
			return 0;
		}
		if (n > 100) {
			return 100;
		}
		return n;
	}

	function formatAmountWon(n) {
		const num = Number(n);
		if (!Number.isFinite(num)) {
			return "";
		}
		return Math.round(num).toLocaleString("ko-KR") + "원";
	}

	function applyReferralDiscountWon(baseWon, discountRate) {
		const base = Number(baseWon) || 0;
		if (base <= 0) {
			return 0;
		}
		const rate = normalizeDiscountRate(discountRate);
		if (rate <= 0) {
			return Math.round(base);
		}
		return Math.round((base * (100 - rate)) / 100);
	}

	function formatDiscountRateLabel(rate) {
		const r = normalizeDiscountRate(rate);
		if (r <= 0) {
			return "";
		}
		if (Math.abs(r - Math.round(r)) < 0.001) {
			return Math.round(r) + "%";
		}
		return r + "%";
	}

	function isPerPlanReferralType(type) {
		return PER_PLAN_TYPES.indexOf(String(type || "").toUpperCase()) >= 0;
	}

	function getPricingPhaseKey(axisPricing) {
		const ph = String(axisPricing && axisPricing.phase != null ? axisPricing.phase : "EARLY_BIRD").toUpperCase();
		return ph === "REGULAR" ? "regular" : "early_bird";
	}

	function selectValueToTicketType(val) {
		return TICKET_FROM_SELECT[String(val)] || null;
	}

	function ticketTypeToSelectValue(ticketType) {
		return TICKET_SELECT_VALUE[String(ticketType).toUpperCase()] || null;
	}

	function ticketTierLabelKo(ticketType) {
		return TICKET_LABEL_KO[String(ticketType).toUpperCase()] || ticketType || "";
	}

	function normalizeValidateSuccess(data, code) {
		const cfg =
			data.discount_config && typeof data.discount_config === "object" ? data.discount_config : null;
		let discountType = cfg && cfg.type != null ? String(cfg.type).toUpperCase() : null;
		if (!discountType && data.discount_rate != null && Number(data.discount_rate) > 0) {
			discountType = "RATE";
		}
		let discountRate = 0;
		if (discountType === "RATE" && cfg) {
			discountRate = normalizeDiscountRate(cfg.rate != null ? cfg.rate : data.discount_rate);
		} else if (data.discount_rate != null) {
			discountRate = normalizeDiscountRate(data.discount_rate);
		}
		return {
			valid: true,
			code: code,
			company_name: data.company_name != null ? String(data.company_name).trim() : "",
			discount_config: cfg,
			discount_type: discountType,
			discount_rate: discountRate
		};
	}

	function getPlanSlot(ref, phaseKey, ticketType) {
		const cfg = ref && ref.discount_config;
		if (!cfg || !cfg.plans || !phaseKey || !ticketType) {
			return null;
		}
		const dayKey = DAY_KEY_FROM_TICKET[String(ticketType).toUpperCase()];
		if (!dayKey) {
			return null;
		}
		const group = cfg.plans[phaseKey];
		if (!group || typeof group !== "object") {
			return null;
		}
		const slot = group[dayKey];
		if (!slot || typeof slot !== "object") {
			return null;
		}
		return slot;
	}

	/** PER_PLAN_* 일 때 신청 가능한 DAY1|DAY2|DAY3 목록. 그 외 타입이면 null(제한 없음). */
	function getEnabledTicketTypesForPhase(ref, phaseKey) {
		if (!ref || !ref.valid || !isPerPlanReferralType(ref.discount_type)) {
			return null;
		}
		const cfg = ref.discount_config;
		if (!cfg || !cfg.plans) {
			return [];
		}
		const group = cfg.plans[phaseKey];
		if (!group || typeof group !== "object") {
			return [];
		}
		const enabled = [];
		["day1", "day2", "day3"].forEach(function (dayKey) {
			const slot = group[dayKey];
			if (slot && slot.enabled !== false) {
				if (dayKey === "day1") {
					enabled.push("DAY1");
				} else if (dayKey === "day2") {
					enabled.push("DAY2");
				} else {
					enabled.push("DAY3");
				}
			}
		});
		return enabled;
	}

	function isTicketAllowedForReferral(ref, ticketType, phaseKey) {
		const allowed = getEnabledTicketTypesForPhase(ref, phaseKey);
		if (!allowed) {
			return true;
		}
		if (!allowed.length) {
			return false;
		}
		return allowed.indexOf(String(ticketType).toUpperCase()) >= 0;
	}

	function getTicketRestrictionMessage(ref, phaseKey) {
		const allowed = getEnabledTicketTypesForPhase(ref, phaseKey);
		if (!allowed || !allowed.length) {
			return "이 초대코드로 신청 가능한 참가권이 없습니다.";
		}
		const labels = allowed.map(ticketTierLabelKo).join(", ");
		return "이 초대코드는 " + labels + "만 선택할 수 있습니다.";
	}

	/**
	 * 추천코드 적용 후 결제 금액(원). ticketType 필수(PER_PLAN_*), RATE/AMOUNT는 ticketType 없어도 됨.
	 */
	function computeReferralPriceWon(baseWon, ref, ticketType, phaseKey) {
		const base = Number(baseWon) || 0;
		if (!ref || !ref.valid || base <= 0) {
			return Math.round(base);
		}
		const type = ref.discount_type ? String(ref.discount_type).toUpperCase() : "";
		const cfg = ref.discount_config;

		if (type === "RATE") {
			const rate = cfg && cfg.rate != null ? cfg.rate : ref.discount_rate;
			return applyReferralDiscountWon(base, rate);
		}
		if (type === "AMOUNT") {
			const off = Number(cfg && cfg.amount);
			if (Number.isFinite(off) && off > 0) {
				return Math.max(0, Math.round(base - off));
			}
			return Math.round(base);
		}
		if (!ticketType) {
			if (ref.discount_rate > 0) {
				return applyReferralDiscountWon(base, ref.discount_rate);
			}
			return Math.round(base);
		}
		const slot = getPlanSlot(ref, phaseKey, ticketType);
		if (!slot || slot.enabled === false) {
			return Math.round(base);
		}
		if (type === "PER_PLAN_FIXED") {
			const fixed = Number(slot.value);
			if (Number.isFinite(fixed) && fixed >= 0) {
				return Math.round(fixed);
			}
			return Math.round(base);
		}
		if (type === "PER_PLAN_RATE") {
			if (slot.value != null) {
				return applyReferralDiscountWon(base, slot.value);
			}
			return Math.round(base);
		}
		if (type === "PER_PLAN_AMOUNT") {
			const off = Number(slot.value);
			if (Number.isFinite(off) && off > 0) {
				return Math.max(0, Math.round(base - off));
			}
			return Math.round(base);
		}
		if (ref.discount_rate > 0) {
			return applyReferralDiscountWon(base, ref.discount_rate);
		}
		return Math.round(base);
	}

	function hasReferralPricingEffect(ref) {
		if (!ref || !ref.valid) {
			return false;
		}
		const type = ref.discount_type ? String(ref.discount_type).toUpperCase() : "";
		const cfg = ref.discount_config;
		if (type === "RATE") {
			return normalizeDiscountRate(cfg && cfg.rate != null ? cfg.rate : ref.discount_rate) > 0;
		}
		if (type === "AMOUNT") {
			return Number(cfg && cfg.amount) > 0;
		}
		if (isPerPlanReferralType(type)) {
			return true;
		}
		return ref.discount_rate > 0;
	}

	function formatReferralSummaryLine(companyName, ref, ticketType, phaseKey) {
		const company = companyName != null ? String(companyName).trim() : "";
		if (!ref || !ref.valid) {
			return company;
		}
		const parts = [];
		if (company) {
			parts.push(company);
		}
		const type = ref.discount_type ? String(ref.discount_type).toUpperCase() : "";
		const cfg = ref.discount_config;

		if (type === "RATE" || (!type && ref.discount_rate > 0)) {
			const rateLabel = formatDiscountRateLabel(cfg && cfg.rate != null ? cfg.rate : ref.discount_rate);
			if (rateLabel) {
				parts.push("할인 " + rateLabel);
			}
		} else if (type === "AMOUNT" && cfg && cfg.amount != null) {
			parts.push("정액 할인 " + formatAmountWon(cfg.amount));
		} else if (isPerPlanReferralType(type)) {
			const allowed = getEnabledTicketTypesForPhase(ref, phaseKey);
			if (allowed && allowed.length) {
				parts.push("신청 가능: " + allowed.map(ticketTierLabelKo).join(", "));
			}
			if (type === "PER_PLAN_FIXED" && ticketType && phaseKey) {
				const slot = getPlanSlot(ref, phaseKey, ticketType);
				if (slot && slot.value != null) {
					parts.push("고정가 " + formatAmountWon(slot.value));
				}
			}
		}
		return parts.join(" · ");
	}

	function formatPriceComparisonLine(baseWon, finalWon, ref, ticketType, phaseKey) {
		const base = Number(baseWon) || 0;
		const finalAmt = Number(finalWon) || 0;
		if (!ref || !ref.valid || finalAmt <= 0) {
			return finalAmt.toLocaleString("ko-KR") + "원";
		}
		const type = ref.discount_type ? String(ref.discount_type).toUpperCase() : "";

		if (type === "PER_PLAN_FIXED") {
			if (base > 0 && base !== finalAmt) {
				return (
					base.toLocaleString("ko-KR") +
					"원 → " +
					finalAmt.toLocaleString("ko-KR") +
					"원 (고정가)"
				);
			}
			return finalAmt.toLocaleString("ko-KR") + "원 (고정가)";
		}
		if (type === "AMOUNT" && base > finalAmt) {
			const off = ref.discount_config && ref.discount_config.amount;
			return (
				base.toLocaleString("ko-KR") +
				"원 → " +
				finalAmt.toLocaleString("ko-KR") +
				"원 (정액 할인 " +
				formatAmountWon(off) +
				")"
			);
		}
		if (base > finalAmt) {
			let rateLabel = "";
			if (type === "PER_PLAN_RATE" && ticketType && phaseKey) {
				const slot = getPlanSlot(ref, phaseKey, ticketType);
				if (slot && slot.value != null) {
					rateLabel = formatDiscountRateLabel(slot.value);
				}
			}
			if (!rateLabel) {
				rateLabel = formatDiscountRateLabel(
					ref.discount_config && ref.discount_config.rate != null
						? ref.discount_config.rate
						: ref.discount_rate
				);
			}
			if (rateLabel) {
				return (
					base.toLocaleString("ko-KR") +
					"원 → " +
					finalAmt.toLocaleString("ko-KR") +
					"원 (" +
					rateLabel +
					" 할인)"
				);
			}
			return (
				base.toLocaleString("ko-KR") + "원 → " + finalAmt.toLocaleString("ko-KR") + "원"
			);
		}
		return finalAmt.toLocaleString("ko-KR") + "원";
	}

	function pricingPhaseLabelKo(phaseKey) {
		return phaseKey === "regular" ? "정가(일반)" : "얼리버드";
	}

	/** 신청 폼 안내 박스 2행째 이후 — 참가권: 금액/할인만 (간략) */
	function formatReferralBenefitDetailLines(ref, phaseKey) {
		if (!ref || !ref.valid) {
			return [];
		}
		const lines = [];
		const type = ref.discount_type ? String(ref.discount_type).toUpperCase() : "";
		const cfg = ref.discount_config;

		if (isPerPlanReferralType(type) && cfg && cfg.plans) {
			const group = cfg.plans[phaseKey];
			if (group && typeof group === "object") {
				["day1", "day2", "day3"].forEach(function (dayKey) {
					const slot = group[dayKey];
					if (!slot || slot.enabled === false || slot.value == null) {
						return;
					}
					const ticket =
						dayKey === "day1" ? "DAY1" : dayKey === "day2" ? "DAY2" : "DAY3";
					const tlabel = ticketTierLabelKo(ticket);
					if (type === "PER_PLAN_FIXED") {
						lines.push(tlabel + ": " + formatAmountWon(slot.value));
					} else if (type === "PER_PLAN_RATE") {
						lines.push(tlabel + ": " + formatDiscountRateLabel(slot.value) + " 할인");
					} else if (type === "PER_PLAN_AMOUNT") {
						lines.push(tlabel + ": " + formatAmountWon(slot.value) + " 할인");
					}
				});
			}
			return lines;
		}

		if (type === "RATE") {
			const rateLabel = formatDiscountRateLabel(
				cfg && cfg.rate != null ? cfg.rate : ref.discount_rate
			);
			if (rateLabel) {
				lines.push(rateLabel + " 할인");
			}
		} else if (type === "AMOUNT" && cfg && cfg.amount != null) {
			lines.push(formatAmountWon(cfg.amount) + " 할인");
		} else if (ref.discount_rate > 0) {
			lines.push(formatDiscountRateLabel(ref.discount_rate) + " 할인");
		}

		return lines;
	}

	/**
	 * 신청 폼 추천코드 안내 — 간략 2~3줄. CSS white-space: pre-line 필요.
	 * 예) "○○ 추천코드 적용되었습니다.\n3일권: 500,000원"
	 */
	function formatReferralNoticeText(ref, phaseKey) {
		if (!ref || !ref.valid) {
			return "";
		}
		const lines = [];
		const company = ref.company_name ? String(ref.company_name).trim() : "";
		if (company) {
			lines.push(company + " 추천코드가 적용되었습니다.");
		} else {
			lines.push("추천코드가 적용되었습니다.");
		}

		const benefits = formatReferralBenefitDetailLines(ref, phaseKey);
		benefits.forEach(function (line) {
			if (line) {
				lines.push(line);
			}
		});

		return lines.join("\n");
	}

	/**
	 * 개인 참가권 select: PER_PLAN_* 시 활성 슬롯만 선택 가능(1개면 select 잠금).
	 */
	function applyPersonalTicketReferralLock(ticketSelectEl, ref, phaseKey) {
		if (!ticketSelectEl) {
			return;
		}
		const allowed = getEnabledTicketTypesForPhase(ref, phaseKey);
		if (!allowed) {
			Array.from(ticketSelectEl.options).forEach(function (opt) {
				if (opt.value) {
					opt.disabled = false;
					opt.hidden = false;
				}
			});
			ticketSelectEl.disabled = false;
			return;
		}
		Array.from(ticketSelectEl.options).forEach(function (opt) {
			if (!opt.value) {
				return;
			}
			const tt = selectValueToTicketType(opt.value);
			const ok = allowed.indexOf(tt) >= 0;
			opt.disabled = !ok;
			opt.hidden = !ok;
		});
		const current = selectValueToTicketType(ticketSelectEl.value);
		if (!current || allowed.indexOf(current) < 0) {
			const first = allowed[0];
			const selVal = ticketTypeToSelectValue(first);
			if (selVal) {
				ticketSelectEl.value = selVal;
				try {
					ticketSelectEl.dispatchEvent(new Event("change", { bubbles: true }));
				} catch (e) {
					/* IE fallback omitted */
				}
			}
		}
		ticketSelectEl.disabled = allowed.length === 1;
	}

	async function validateReferralCode(apiBase, code) {
		const base = String(apiBase || "").replace(/\/$/, "");
		const c = String(code || "").trim();
		if (!base || !c) {
			return { valid: false, message: "추천코드가 없습니다." };
		}
		const url = base + "/api/user/referral-codes/validate?code=" + encodeURIComponent(c);
		let res;
		try {
			res = await fetch(url, {
				method: "GET",
				headers: { Accept: "application/json" },
				cache: "no-store"
			});
		} catch (e) {
			return { valid: false, message: "추천코드 확인 중 네트워크 오류가 발생했습니다." };
		}
		let data = null;
		try {
			data = await res.json();
		} catch (e) {
			data = null;
		}
		if (!res.ok) {
			const msg =
				data && typeof data.detail === "string"
					? data.detail
					: "추천코드 확인에 실패했습니다.";
			return { valid: false, code: c, message: msg };
		}
		if (!data || data.valid !== true) {
			return {
				valid: false,
				code: c,
				message: (data && data.message) || "유효하지 않은 추천코드입니다."
			};
		}
		return normalizeValidateSuccess(data, c);
	}

	/**
	 * 추천코드 적용: URL ?code= 우선, 결제 단계는 신청 draft의 referral_code만 재검증.
	 * URL·draft 모두 없으면 세션을 비우고 미적용(null). (이전 방문 세션 자동 복원 없음)
	 */
	async function resolveReferralOnPageLoad(apiBase, options) {
		options = options || {};
		const fromUrl = pickReferralCodeFromUrl();
		const draftCode =
			options.draftReferralCode != null && String(options.draftReferralCode).trim() !== ""
				? String(options.draftReferralCode).trim()
				: null;

		if (fromUrl) {
			const result = await validateReferralCode(apiBase, fromUrl);
			if (result.valid) {
				writeReferralSession(result);
				return result;
			}
			writeReferralSession({
				valid: false,
				code: fromUrl,
				message: result.message || "유효하지 않은 추천코드입니다."
			});
			return result;
		}

		if (draftCode) {
			const result = await validateReferralCode(apiBase, draftCode);
			if (result.valid) {
				writeReferralSession(result);
				return result;
			}
			writeReferralSession(null);
			return result;
		}

		writeReferralSession(null);
		return null;
	}

	/** URL에 code 없이 신청 폼 진입 시 — 저장된 추천코드·draft referral_code 제거 */
	function clearStoredReferral(options) {
		options = options || {};
		writeReferralSession(null);
		const draftKey = options.draftStorageKey;
		if (!draftKey) {
			return;
		}
		try {
			const raw = sessionStorage.getItem(draftKey);
			if (!raw) {
				return;
			}
			const d = JSON.parse(raw);
			if (!d || typeof d !== "object" || !("referral_code" in d)) {
				return;
			}
			delete d.referral_code;
			sessionStorage.setItem(draftKey, JSON.stringify(d));
		} catch (e) {
			/* ignore */
		}
	}

	function getActiveReferral() {
		const ref = readReferralSession();
		return ref && ref.valid === true && ref.code ? ref : null;
	}

	function mergeReferralIntoPayload(payload) {
		if (!payload || typeof payload !== "object") {
			return payload;
		}
		const ref = getActiveReferral();
		if (ref && ref.code) {
			payload.referral_code = ref.code;
		}
		return payload;
	}

	/** GET /api/user/me — 추천코드(초대코드) 적용 여부 */
	function hasApplicationReferralInfo(d) {
		if (!d || typeof d !== "object") {
			return false;
		}
		if (d.company_name != null && String(d.company_name).trim() !== "") {
			return true;
		}
		if (d.invite_code != null && String(d.invite_code).trim() !== "") {
			return true;
		}
		if (d.discount_rate != null && Number(d.discount_rate) > 0) {
			return true;
		}
		const product = Number(d.product_amount);
		const purchase = Number(
			d.purchase_amount != null ? d.purchase_amount : d.discounted_amount != null ? d.discounted_amount : NaN
		);
		return Number.isFinite(product) && Number.isFinite(purchase) && product > purchase;
	}

	function getApplicationReferralCompanyLabel(d) {
		if (!d) {
			return "";
		}
		const name = d.company_name != null ? String(d.company_name).trim() : "";
		if (name) {
			return name;
		}
		const code = d.invite_code != null ? String(d.invite_code).trim() : "";
		if (code) {
			return "추천코드 (" + code + ")";
		}
		return "";
	}

	/** 할인율·정가→할인가 등 (결제 금액 행과 구분) */
	function formatApplicationReferralDiscountText(d) {
		if (!d) {
			return "";
		}
		const rate = d.discount_rate;
		if (rate != null && Number.isFinite(Number(rate)) && Number(rate) > 0) {
			const label = formatDiscountRateLabel(rate);
			return label ? label + " 할인" : "";
		}
		const product = Number(d.product_amount);
		const purchase = Number(
			d.purchase_amount != null ? d.purchase_amount : d.discounted_amount != null ? d.discounted_amount : NaN
		);
		if (Number.isFinite(product) && Number.isFinite(purchase) && product > purchase) {
			return formatAmountWon(product) + " → " + formatAmountWon(purchase);
		}
		return "";
	}

	/** 실제 결제(또는 결제 예정) 금액 */
	function formatApplicationReferralPaymentText(d) {
		if (!d) {
			return "";
		}
		const paid = Number(d.payment_amount);
		const purchase = Number(
			d.purchase_amount != null ? d.purchase_amount : d.discounted_amount != null ? d.discounted_amount : NaN
		);

		if (d.payment_completed && Number.isFinite(paid) && paid > 0) {
			return formatAmountWon(paid);
		}
		if (Number.isFinite(purchase) && purchase > 0) {
			return formatAmountWon(purchase) + " (결제 예정)";
		}
		if (Number.isFinite(paid) && paid > 0) {
			return formatAmountWon(paid);
		}
		return "";
	}

	function setReferralDlRow(rowEl, ddEl, text, show) {
		if (!rowEl || !ddEl) {
			return;
		}
		if (show && text) {
			rowEl.style.display = "";
			ddEl.textContent = text;
			ddEl.style.whiteSpace = text.indexOf("\n") >= 0 ? "pre-line" : "";
		} else {
			rowEl.style.display = "none";
			ddEl.textContent = "—";
			ddEl.style.whiteSpace = "";
		}
	}

	/**
	 * 신청 완료·마이페이지 공통: 추천코드 기업 / 할인 정보 / 결제 금액
	 * ids: { companyRow, companyDd, discountRow, discountDd, amountRow, amountDd } — element id 문자열
	 */
	/** 초대코드 PER_PLAN_* 단체: 엑셀 참가권 열과 무관하게 적용할 참가권 목록 */
	function getGroupReferralBillingTicketTypes(ref, phaseKey) {
		if (!ref || !ref.valid || !isPerPlanReferralType(ref.discount_type)) {
			return null;
		}
		const allowed = getEnabledTicketTypesForPhase(ref, phaseKey);
		return allowed && allowed.length ? allowed : null;
	}

	/**
	 * 단체 + 초대코드(PER_PLAN_*): 명단 인원 전원을 추천코드 참가권 단가로 집계 (엑셀 참가권 값 무시)
	 */
	function computeGroupReferralFlatTotals(headcount, unitBaseForTicket, ref, phaseKey) {
		const hc = Number(headcount) || 0;
		if (hc < 1 || !ref || !ref.valid || !hasReferralPricingEffect(ref)) {
			return null;
		}
		const billingTypes = getGroupReferralBillingTicketTypes(ref, phaseKey);
		if (!billingTypes || !billingTypes.length) {
			return { ok: false, message: "이 초대코드로 신청 가능한 참가권이 없습니다." };
		}
		const billingTicket = billingTypes[0];
		const unitBase =
			typeof unitBaseForTicket === "function" ? Number(unitBaseForTicket(billingTicket)) || 0 : 0;
		const unitFinal = computeReferralPriceWon(unitBase, ref, billingTicket, phaseKey);
		const counts = { DAY1: 0, DAY2: 0, DAY3: 0 };
		counts[billingTicket] = hc;
		return {
			ok: true,
			totalBaseWon: Math.round(unitBase * hc),
			totalWon: Math.round(unitFinal * hc),
			billingTicketType: billingTicket,
			counts: counts,
			totalTickets: hc
		};
	}

	/**
	 * 단체 명단 집계(counts)가 추천코드 PER_PLAN_* 허용 참가권과 맞는지 검사. 문제 시 메시지 문자열, 통과 시 null.
	 * (엑셀 참가권 열 기준 집계 시에만 사용 — flat 집계 모드에서는 미사용)
	 */
	function validateGroupTicketCountsForReferral(counts, ref, phaseKey) {
		if (!ref || !ref.valid || !isPerPlanReferralType(ref.discount_type)) {
			return null;
		}
		const allowed = getEnabledTicketTypesForPhase(ref, phaseKey);
		if (!allowed || !allowed.length) {
			return "이 초대코드로 신청 가능한 참가권이 없습니다.";
		}
		const invalid = [];
		["DAY1", "DAY2", "DAY3"].forEach(function (key) {
			const n = Number(counts && counts[key]) || 0;
			if (n > 0 && allowed.indexOf(key) < 0) {
				invalid.push(ticketTierLabelKo(key));
			}
		});
		if (!invalid.length) {
			return null;
		}
		return (
			"명단에 " +
			invalid.join(", ") +
			" 참가자가 있습니다. 이 초대코드는 " +
			allowed.map(ticketTierLabelKo).join(", ") +
			"만 신청할 수 있습니다."
		);
	}

	/**
	 * 단체: DAY1/2/3 인원별 합계 — unitBaseForTicket(ticketType) → 정가(단체 단가)
	 */
	function computeGroupCountsTotals(counts, unitBaseForTicket, ref, phaseKey) {
		let totalBaseWon = 0;
		let totalWon = 0;
		["DAY1", "DAY2", "DAY3"].forEach(function (key) {
			const n = Number(counts && counts[key]) || 0;
			if (n > 0) {
				const unitBase =
					typeof unitBaseForTicket === "function" ? Number(unitBaseForTicket(key)) || 0 : 0;
				const unitFinal =
					ref && hasReferralPricingEffect(ref)
						? computeReferralPriceWon(unitBase, ref, key, phaseKey)
						: unitBase;
				totalBaseWon += unitBase * n;
				totalWon += unitFinal * n;
			}
		});
		return { totalBaseWon: Math.round(totalBaseWon), totalWon: Math.round(totalWon) };
	}

	var BANK_TRANSFER_DEPOSIT_NOTICE =
		"참가 신청이 완료되었습니다.<br>현장 카드 결제를 선택하신 경우, 행사 당일 결제하실 카드를 반드시 지참해 주시기 바랍니다.<br>세금계산서는 행사 종료 이후 순차적으로 발행될 예정입니다.";
	var ONSITE_CARD_PAYMENT_NOTICE =
		"현장 카드결제는 행사 당일 리셉션에서 진행됩니다.<br>결제 시 신청 완료 페이지를 제시해 주세요.";
	var COMPLETION_PAYMENT_CONTEXT_KEY = "axis2026_completion_payment_context";

	function normalizePaymentMethod(method) {
		if (method == null || method === "") {
			return "";
		}
		var s = String(method).trim().toUpperCase();
		if (s === "BANK_TRANSFER" || s === "ONSITE_CARD" || s === "ONLINE_CARD") {
			return s;
		}
		if (s.indexOf("계좌") >= 0 || s.indexOf("세금") >= 0) {
			return "BANK_TRANSFER";
		}
		if (s.indexOf("현장") >= 0) {
			return "ONSITE_CARD";
		}
		if (s.indexOf("카드") >= 0 || s.indexOf("ONLINE") >= 0) {
			return "ONLINE_CARD";
		}
		return s;
	}

	function isDeferredPaymentMethod(method) {
		return method === "BANK_TRANSFER" || method === "ONSITE_CARD";
	}

	function hasApplicationQrCode(d) {
		return d && d.qr_code_number != null && String(d.qr_code_number).trim() !== "";
	}

	/**
	 * 계좌이체·현장카드: 신청 직후 API가 payment_completed=true를 내려도 미완료로 처리.
	 * - 계좌이체: 입금 확인·QR 발급 후 완료
	 * - 현장카드: 현장 결제 확인(payment_completed_at) 후 완료
	 */
	function isDeferredPaymentSettled(d, method) {
		if (!d || !isDeferredPaymentMethod(method)) {
			return false;
		}
		if (d.payment_completed_at) {
			return true;
		}
		if (d.payment_completed !== true) {
			return false;
		}
		if (method === "BANK_TRANSFER") {
			return hasApplicationQrCode(d);
		}
		return false;
	}

	function readCompletionPaymentContext() {
		try {
			var raw = sessionStorage.getItem(COMPLETION_PAYMENT_CONTEXT_KEY);
			if (!raw) {
				return null;
			}
			return JSON.parse(raw);
		} catch (e) {
			return null;
		}
	}

	function writeCompletionPaymentContext(payload) {
		if (!payload || !payload.payment_method) {
			return;
		}
		var method = normalizePaymentMethod(payload.payment_method);
		if (!isDeferredPaymentMethod(method)) {
			return;
		}
		sessionStorage.setItem(
			COMPLETION_PAYMENT_CONTEXT_KEY,
			JSON.stringify({
				payment_method: method,
				saved_at: Date.now()
			})
		);
	}

	function clearCompletionPaymentContext() {
		sessionStorage.removeItem(COMPLETION_PAYMENT_CONTEXT_KEY);
	}

	/** /api/user/me 응답 + 신청 직후 session 보정(결제수단 누락·payment_completed 오표기) */
	function enrichApplicationPaymentDisplay(profile) {
		var merged = Object.assign({}, profile || {});
		var ctx = readCompletionPaymentContext();
		var method = normalizePaymentMethod(merged.payment_method);
		if (!method && ctx && ctx.payment_method) {
			method = normalizePaymentMethod(ctx.payment_method);
			merged.payment_method = method;
		} else if (method) {
			merged.payment_method = method;
		}
		if (isDeferredPaymentMethod(method) && !isDeferredPaymentSettled(merged, method)) {
			merged.payment_completed = false;
		} else if (isDeferredPaymentMethod(method) && isDeferredPaymentSettled(merged, method)) {
			clearCompletionPaymentContext();
		}
		return merged;
	}

	function setApplicationPaymentFooterNotice(footerNoticeId, html) {
		if (!footerNoticeId) {
			return;
		}
		var el = document.getElementById(footerNoticeId);
		if (!el) {
			return;
		}
		if (html) {
			el.style.display = "block";
			el.innerHTML = html;
		} else {
			el.style.display = "none";
			el.innerHTML = "";
		}
	}

	/**
	 * 신청 완료·마이페이지 결제 현황 문구 + 하단 안내
	 * options: { footerNoticeId: "footerOnsiteNotice", includeAmountInCompleted: false }
	 */
	function formatApplicationPaymentStatusLine(d, options) {
		options = options || {};
		var footerId = options.footerNoticeId || "footerOnsiteNotice";
		var method = normalizePaymentMethod(d && d.payment_method);

		if (method === "BANK_TRANSFER") {
			if (isDeferredPaymentSettled(d, method)) {
				setApplicationPaymentFooterNotice(footerId, null);
				return "결제 완료";
			}
			setApplicationPaymentFooterNotice(footerId, BANK_TRANSFER_DEPOSIT_NOTICE);
			return "입금 대기";
		}

		if (method === "ONSITE_CARD") {
			if (isDeferredPaymentSettled(d, method)) {
				setApplicationPaymentFooterNotice(footerId, null);
				return "결제 완료";
			}
			setApplicationPaymentFooterNotice(footerId, ONSITE_CARD_PAYMENT_NOTICE);
			return "현장 결제";
		}

		if (d && d.payment_completed === true) {
			setApplicationPaymentFooterNotice(footerId, null);
			if (options.includeAmountInCompleted) {
				if (
					hasApplicationReferralInfo(d) &&
					formatApplicationReferralPaymentText(d)
				) {
					return "결제 완료";
				}
				var paidText = formatAmountWon(d.payment_amount);
				if (paidText) {
					return "결제 완료 (" + paidText + ")";
				}
			}
			return "결제 완료";
		}

		setApplicationPaymentFooterNotice(footerId, null);
		if (method === "ONLINE_CARD") {
			return "카드 결제 진행 또는 확인 중입니다.";
		}
		return "결제 대기";
	}

	function renderApplicationReferralFields(d, ids) {
		if (!ids) {
			return;
		}
		const companyRow = document.getElementById(ids.companyRow);
		const companyDd = document.getElementById(ids.companyDd);
		const discountRow = document.getElementById(ids.discountRow);
		const discountDd = document.getElementById(ids.discountDd);
		const amountRow = document.getElementById(ids.amountRow);
		const amountDd = document.getElementById(ids.amountDd);

		if (!hasApplicationReferralInfo(d)) {
			setReferralDlRow(companyRow, companyDd, "", false);
			setReferralDlRow(discountRow, discountDd, "", false);
			setReferralDlRow(amountRow, amountDd, "", false);
			return;
		}

		const companyText = getApplicationReferralCompanyLabel(d);
		const discountText = formatApplicationReferralDiscountText(d);
		const paymentText = formatApplicationReferralPaymentText(d);

		setReferralDlRow(companyRow, companyDd, companyText, !!companyText);
		setReferralDlRow(discountRow, discountDd, discountText, !!discountText);
		setReferralDlRow(amountRow, amountDd, paymentText, !!paymentText);
	}

	global.AxisReferral = {
		REFERRAL_SESSION_KEY: REFERRAL_SESSION_KEY,
		readReferralSession: readReferralSession,
		writeReferralSession: writeReferralSession,
		pickReferralCodeFromUrl: pickReferralCodeFromUrl,
		normalizeDiscountRate: normalizeDiscountRate,
		applyReferralDiscountWon: applyReferralDiscountWon,
		formatDiscountRateLabel: formatDiscountRateLabel,
		formatAmountWon: formatAmountWon,
		isPerPlanReferralType: isPerPlanReferralType,
		getPricingPhaseKey: getPricingPhaseKey,
		selectValueToTicketType: selectValueToTicketType,
		ticketTypeToSelectValue: ticketTypeToSelectValue,
		ticketTierLabelKo: ticketTierLabelKo,
		getEnabledTicketTypesForPhase: getEnabledTicketTypesForPhase,
		isTicketAllowedForReferral: isTicketAllowedForReferral,
		getTicketRestrictionMessage: getTicketRestrictionMessage,
		computeReferralPriceWon: computeReferralPriceWon,
		hasReferralPricingEffect: hasReferralPricingEffect,
		formatReferralSummaryLine: formatReferralSummaryLine,
		formatPriceComparisonLine: formatPriceComparisonLine,
		formatReferralNoticeText: formatReferralNoticeText,
		formatReferralBenefitDetailLines: formatReferralBenefitDetailLines,
		pricingPhaseLabelKo: pricingPhaseLabelKo,
		applyPersonalTicketReferralLock: applyPersonalTicketReferralLock,
		validateReferralCode: validateReferralCode,
		pickReferralCodeFromUrl: pickReferralCodeFromUrl,
		clearStoredReferral: clearStoredReferral,
		resolveReferralOnPageLoad: resolveReferralOnPageLoad,
		getActiveReferral: getActiveReferral,
		mergeReferralIntoPayload: mergeReferralIntoPayload,
		hasApplicationReferralInfo: hasApplicationReferralInfo,
		getApplicationReferralCompanyLabel: getApplicationReferralCompanyLabel,
		formatApplicationReferralDiscountText: formatApplicationReferralDiscountText,
		formatApplicationReferralPaymentText: formatApplicationReferralPaymentText,
		BANK_TRANSFER_DEPOSIT_NOTICE: BANK_TRANSFER_DEPOSIT_NOTICE,
		ONSITE_CARD_PAYMENT_NOTICE: ONSITE_CARD_PAYMENT_NOTICE,
		COMPLETION_PAYMENT_CONTEXT_KEY: COMPLETION_PAYMENT_CONTEXT_KEY,
		normalizePaymentMethod: normalizePaymentMethod,
		isDeferredPaymentMethod: isDeferredPaymentMethod,
		isDeferredPaymentSettled: isDeferredPaymentSettled,
		writeCompletionPaymentContext: writeCompletionPaymentContext,
		enrichApplicationPaymentDisplay: enrichApplicationPaymentDisplay,
		formatApplicationPaymentStatusLine: formatApplicationPaymentStatusLine,
		setApplicationPaymentFooterNotice: setApplicationPaymentFooterNotice,
		renderApplicationReferralFields: renderApplicationReferralFields,
		validateGroupTicketCountsForReferral: validateGroupTicketCountsForReferral,
		computeGroupCountsTotals: computeGroupCountsTotals,
		getGroupReferralBillingTicketTypes: getGroupReferralBillingTicketTypes,
		computeGroupReferralFlatTotals: computeGroupReferralFlatTotals
	};
})(typeof window !== "undefined" ? window : this);
