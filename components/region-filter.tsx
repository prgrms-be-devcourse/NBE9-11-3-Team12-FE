"use client"

import { Button } from "@/components/ui/button"

const regions = [
  "전체",
  "서울",
  "경기",
  "인천",
  "강원",
  "충북",
  "충남",
  "대전",
  "세종",
  "경북",
  "경남",
  "대구",
  "울산",
  "부산",
  "전북",
  "전남",
  "광주",
  "제주",
]

interface RegionFilterProps {
  selectedRegion: string
  onRegionChange: (region: string) => void
}

export function RegionFilter({ selectedRegion, onRegionChange }: RegionFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {regions.map((region) => (
        <Button
          key={region}
          variant={selectedRegion === region ? "default" : "outline"}
          size="sm"
          onClick={() => onRegionChange(region)}
          className="min-w-[60px]"
        >
          {region}
        </Button>
      ))}
    </div>
  )
}
