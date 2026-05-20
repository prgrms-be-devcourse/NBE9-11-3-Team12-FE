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
  "5K": "5km",
  "5KM": "5km",
  "10K": "10km",
  "10KM": "10km",
  HALF: "하프 (21.0975km)",
  FULL: "풀코스 (42.195km)",
}

export function formatRegion(region: string): string {
  return REGION_LABELS[region] ?? region
}

export function formatCourseDistance(distance?: string | null): string {
  if (!distance) return "코스 미정"
  return COURSE_DISTANCE_LABELS[distance] ?? distance
}

export type MarathonUiStatus = "접수중" | "접수예정" | "접수마감" | "취소됨"

export function marathonStatusToUi(status?: string | null): MarathonUiStatus {
  switch (status) {
    case "OPEN":
    case "REGISTRATION_OPEN":
      return "접수중"
    case "TEMP":
    case "UPCOMING":
    case "REGISTRATION_UPCOMING":
    case "REGISTRATION_NOT_STARTED":
      return "접수예정"
    case "CANCELING":
    case "CANCELED":
      return "취소됨"
    case "FULL":
    case "CLOSED":
    case "REGISTRATION_CLOSED":
    case "EVENT_ENDED":
    default:
      return "접수마감"
  }
}

export function normalizeCourseType(courseType?: string | null): string {
  if (!courseType) return ""
  const normalized = courseType.trim().toUpperCase()

  switch (normalized) {
    case "5KM":
      return "5K"
    case "10KM":
      return "10K"
    case "HALF_MARATHON":
      return "HALF"
    case "MARATHON":
    case "FULL_MARATHON":
      return "FULL"
    default:
      return normalized
  }
}
