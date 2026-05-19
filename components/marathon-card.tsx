import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Users } from "lucide-react"
import Image from "next/image"

function getStatusLabel(status: MarathonData["status"]) {
  switch (status) {
    case "OPEN":
      return "접수중"
    case "TEMP":
      return "접수예정"
    case "FULL":
    case "CLOSED":
      return "접수마감"
    case "CANCELED":
      return "취소됨"
    default:
      return "접수예정"
  }
}
function formatDateTime(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value

  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")} ${String(
    d.getHours()
  ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}
export interface MarathonData {
  id: string
  title: string
  date: string
  location: string
  region: string
  distance: string[]
  participants: number
  maxParticipants: number
  status: "OPEN" | "TEMP" | "FULL" | "CLOSED" | "CANCELED"
  registrationStartAt: string
  registrationEndAt: string
  imageUrl?: string | null
}

interface MarathonCardProps {
  marathon: MarathonData
}

export function MarathonCard({ marathon }: MarathonCardProps) {
  const statusColor = {
    OPEN: "bg-primary text-primary-foreground",
    TEMP: "bg-accent text-accent-foreground",
    FULL: "bg-muted text-muted-foreground",
    CLOSED: "bg-muted text-muted-foreground",
    CANCELED: "bg-destructive text-destructive-foreground",
  }
  const participants = marathon.participants ?? 0
  const maxParticipants = marathon.maxParticipants ?? 0
  const remainingSpots = maxParticipants - participants
  const isClosed =
    marathon.status === "FULL" ||
    marathon.status === "CLOSED" ||
    marathon.status === "CANCELED"

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="relative p-0">
        <div className="relative h-40 overflow-hidden bg-secondary">
          {marathon.imageUrl ? (
            <Image
              src={marathon.imageUrl}
              alt={marathon.title}
              fill
              unoptimized
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
              <span className="text-4xl font-bold text-primary/30">
                {marathon.distance[0] ?? "RUN"}
              </span>
            </div>
          )}

    <Badge
      className={`absolute right-3 top-3 ${statusColor[marathon.status]}`}
    >
      {getStatusLabel(marathon.status)}
    </Badge>
  </div>
</CardHeader>

      <CardContent className="p-4">
        <div className="mb-2 flex flex-wrap gap-1">
          {marathon.distance.map((dist) => (
            <Badge key={dist} variant="outline" className="text-xs">
              {dist}
            </Badge>
          ))}
        </div>

        <h3 className="mb-3 line-clamp-2 text-lg font-semibold text-foreground group-hover:text-primary">
          {marathon.title}
        </h3>

        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" />
              <span>{marathon.date}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              접수기간 {formatDateTime(marathon.registrationStartAt)} ~ {formatDateTime(marathon.registrationEndAt)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{marathon.location}</span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0" />
            <span>
              {marathon.participants.toLocaleString()} /{" "}
              {marathon.maxParticipants.toLocaleString()}명
              {!isClosed && (
                <span className="ml-1 text-primary">
                  (잔여 {remainingSpots.toLocaleString()}명)
                </span>
              )}
            </span>
          </div>
        </div>
      </CardContent>
        <CardFooter className="p-4 pt-0">
            {isClosed ? (
            <Button className="w-full" disabled variant="secondary">
              마감됨
            </Button>
          ) : (
            <Button
              className="w-full"
              variant={marathon.status === "OPEN" ? "default" : "secondary"}
              asChild
            >
              <Link href={`/marathons/${marathon.id}`}>
                {marathon.status === "OPEN" ? "접수하기" : "상세보기"}
              </Link>
            </Button>
          )}
        </CardFooter>
    </Card>
  )
}