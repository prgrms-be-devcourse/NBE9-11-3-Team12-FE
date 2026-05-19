import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MarathonList } from "@/components/marathon-list"

export default function MarathonsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              마라톤 일정
            </h1>
            <p className="mt-2 text-muted-foreground">
              전국 마라톤 대회를 지역·검색으로 찾아보세요
            </p>
          </div>
          <MarathonList />
        </section>
      </main>
      <Footer />
    </div>
  )
}
