import { Header } from "@/components/header"
import { HeroBanner } from "@/components/hero-banner"
import { MarathonList } from "@/components/marathon-list"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroBanner />
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              전국 마라톤 일정
            </h2>
            <p className="mt-2 text-muted-foreground">
              지역별로 다가오는 마라톤 대회를 확인해보세요
            </p>
          </div>
          <MarathonList />
        </section>
      </main>
      <Footer />
    </div>
  )
}
