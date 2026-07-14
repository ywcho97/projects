/**
 * AXIS 2026 결제 금액 — 공급가액 + 부가세(10%) 별도 합산
 */
(function (global) {
	const VAT_RATE = 0.1;

	function roundWon(n) {
		return Math.round(Number(n) || 0);
	}

	/** 공급가액 기준 부가세(원) */
	function computeVatWon(supplyWon) {
		const supply = roundWon(supplyWon);
		if (supply <= 0) {
			return 0;
		}
		return Math.round(supply * VAT_RATE);
	}

	/** 실제 결제 금액 = 공급가액 + 부가세 */
	function computePaymentTotalWon(supplyWon) {
		const supply = roundWon(supplyWon);
		if (supply <= 0) {
			return 0;
		}
		return supply + computeVatWon(supply);
	}

	function formatWon(n) {
		return roundWon(n).toLocaleString("ko-KR") + "원";
	}

	/**
	 * 결제 금액 표시(HTML) — 할인 시 원금 취소선 + 최종 금액 한 줄
	 * @param {number} supplyWon 할인 적용 후 공급가액
	 * @param {number} baseSupplyWon 할인 전 공급가액(선택)
	 * @param {{ includeDetail?: boolean }} opts includeDetail 기본 true — 공급가·부가세 안내 줄
	 */
	function formatPaymentTotalHtml(supplyWon, baseSupplyWon, opts) {
		opts = opts || {};
		const includeDetail = opts.includeDetail !== false;
		const supply = roundWon(supplyWon);
		const baseSupply = roundWon(baseSupplyWon);
		const vat = computeVatWon(supply);
		const total = supply + vat;
		if (total <= 0) {
			return "";
		}
		const baseTotal = computePaymentTotalWon(baseSupply);
		let main = "";
		if (baseSupply > supply && baseTotal > total) {
			main =
				'<s class="payAmountStrike">' +
				formatWon(baseTotal) +
				'</s><span class="payAmountArrow"> → </span><span class="payAmountFinal">' +
				formatWon(total) +
				"</span>";
		} else {
			main = '<span class="payAmountFinal">' + formatWon(total) + "</span>";
		}
		if (!includeDetail) {
			return main;
		}
		const detail =
			"공급가액 " + formatWon(supply) + " + 부가세(10%) " + formatWon(vat);
		return (
			'<span class="payAmountMain">' +
			main +
			'</span><span class="payAmountDetail">' +
			detail +
			"</span>"
		);
	}

	/** 결제 금액 표시(텍스트, 요약 등) */
	function formatPaymentTotalMultiline(supplyWon, baseSupplyWon) {
		const html = formatPaymentTotalHtml(supplyWon, baseSupplyWon, { includeDetail: true });
		if (!html) {
			return "";
		}
		return html
			.replace(/<s class="payAmountStrike">/g, "")
			.replace(/<\/s>/g, "")
			.replace(/<span class="payAmountFinal">/g, "")
			.replace(/<\/span>/g, "")
			.replace(/<span class="payAmountMain">/g, "")
			.replace(/<span class="payAmountDetail">/g, "\n")
			.replace(/\s+/g, " ")
			.trim();
	}

	global.AxisPayment = {
		VAT_RATE: VAT_RATE,
		computeVatWon: computeVatWon,
		computePaymentTotalWon: computePaymentTotalWon,
		formatPaymentTotalHtml: formatPaymentTotalHtml,
		formatPaymentTotalMultiline: formatPaymentTotalMultiline,
		formatWon: formatWon
	};
})(typeof window !== "undefined" ? window : this);
