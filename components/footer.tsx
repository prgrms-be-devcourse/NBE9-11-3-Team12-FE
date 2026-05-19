import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* 브랜드 */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">M</span>
              </div>
              <span className="text-lg font-bold text-foreground">달려라 마라톤</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              전국 마라톤 대회 정보를 한곳에서 확인하고 간편하게 접수하세요.
            </p>
          </div>

          {/* 서비스 */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">서비스</h3>
            <ul className="mt-4 flex flex-col gap-2">
              <li>
                <Link
                  href="/marathons"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  마라톤 일정
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  대회 등록
                </Link>
              </li>
              <li>
                <Link
                  href="/results"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  대회 결과
                </Link>
              </li>
            </ul>
          </div>

          {/* 고객지원 */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">고객지원</h3>
            <ul className="mt-4 flex flex-col gap-2">
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  자주 묻는 질문
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  문의하기
                </Link>
              </li>
              <li>
                <Link
                  href="/notice"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  공지사항
                </Link>
              </li>
            </ul>
          </div>

          {/* 법적 정보 */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">법적 정보</h3>
            <ul className="mt-4 flex flex-col gap-2">
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  이용약관
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} 달려라 마라톤. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
