package com.tukfit.order;

/** 택배사와 배송 조회 링크 */
public enum Carrier {
	CJ("CJ대한통운", "https://trace.cjlogistics.com/next/tracking.html?wblNo="),
	HANJIN("한진택배", "https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2="),
	LOTTE("롯데택배", "https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo="),
	POST("우체국택배", "https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1="),
	LOGEN("로젠택배", "https://www.ilogen.com/web/personal/trace/");

	private final String displayName;
	private final String trackingUrlPrefix;

	Carrier(String displayName, String trackingUrlPrefix) {
		this.displayName = displayName;
		this.trackingUrlPrefix = trackingUrlPrefix;
	}

	public String displayName() {
		return displayName;
	}

	public String trackingUrl(String trackingNumber) {
		return trackingUrlPrefix + trackingNumber;
	}
}
