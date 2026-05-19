/** 등록 폼·API region enum 공통 라벨 */
export const REGION_LABELS: Record<string, string> = {
  SEOUL: "서울",
  GYEONGGI: "경기",
  INCHEON: "인천",
  BUSAN: "부산",
  DAEGU: "대구",
  DAEJEON: "대전",
  GWANGJU: "광주",
  ULSAN: "울산",
  SEJONG: "세종",
  GANGWON: "강원",
  CHUNGBUK: "충북",
  CHUNGNAM: "충남",
  JEONBUK: "전북",
  JEONNAM: "전남",
  GYEONGBUK: "경북",
  GYEONGNAM: "경남",
  JEJU: "제주",
}

export const COURSE_DISTANCE_LABELS: Record<string, string> = {
  "5KM": "5km",
  "10KM": "10km",
  HALF: "하프 (21.0975km)",
  FULL: "풀코스 (42.195km)",
}

export function formatRegion(region: string): string {
  return REGION_LABELS[region] ?? region
}

export function formatCourseDistance(distance: string): string {
  return COURSE_DISTANCE_LABELS[distance] ?? distance
}

export type MarathonUiStatus = "접수중" | "접수예정" | "접수마감"

/**
 * 백엔드 `MarathonStatus` enum 직렬화 이름과 맞추세요.
 * (이름이 다르면 여기에 case만 추가하면 됩니다.)
 */
export function marathonStatusToUi(status: string): MarathonUiStatus {
  switch (status) {
    case "REGISTRATION_OPEN":
    case "OPEN":
      return "접수중"
    case "REGISTRATION_UPCOMING":
    case "REGISTRATION_NOT_STARTED":
    case "UPCOMING":
      return "접수예정"
    case "REGISTRATION_CLOSED":
    case "EVENT_ENDED":
    case "CLOSED":
      return "접수마감"
    default:
      return "접수마감"
  }
}
