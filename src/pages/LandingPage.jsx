import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const PROGRAM_GROUPS = [
  {
    title: 'AP 已上线',
    items: ['科学', '数学与计算机', '经济与社会科学'],
  },
  {
    title: '规划扩展',
    items: ['IB', 'A-Level', '国际竞赛'],
  },
]

const ACCESS_LEVELS = [
  {
    title: '开放练习',
    text: '无需账号即可体验单元 Quiz，适合先快速了解训练方式。',
  },
  {
    title: '注册会员',
    text: '登录后可保留做题记录与错题记录，方便持续复盘。',
  },
  {
    title: '翎英学员',
    text: '可使用搜题、题单、相似题训练，以及 Quiz 和 Mock PDF 下载等完整训练工具。',
  },
]

const FLOW = ['选择课程与科目', '按单元训练', '查看作答结果', '复盘错题', '生成模考', '持续记录进度']

function LandingPage() {
  const { isLoggedIn } = useAuth()

  return (
    <div className="bg-bg">
      <section className="border-b border-border bg-white">
        <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-[1fr_0.92fr] lg:py-16">
          <div>
            <p className="mb-4 text-sm font-semibold tracking-wide text-accent">翎英教育 LynkEdu</p>
            <h1 className="max-w-3xl text-3xl font-bold leading-tight text-brand sm:text-5xl">
              国际课程备考训练平台
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-text-muted sm:text-lg">
              围绕 AP 题库训练场景，提供按单元练习、模考、错题复盘与学习记录工具。平台结构面向更多课程体系扩展，后续可逐步接入 IB、A-Level 与国际竞赛内容。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/quiz"
                className="rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-light"
              >
                开始开放练习
              </Link>
              <Link
                to={isLoggedIn ? '/dashboard' : '/login'}
                className="rounded-md border border-border bg-white px-5 py-3 text-sm font-semibold text-brand hover:border-brand"
              >
                {isLoggedIn ? '进入我的学习' : '登录 / 注册'}
              </Link>
            </div>
            <p className="mt-5 max-w-xl text-xs leading-6 text-text-muted">
              本平台用于课程学习与训练管理。相关考试与课程名称仅用于说明学习方向，不代表与第三方考试机构存在授权、赞助或隶属关系。
            </p>
          </div>

          <div className="rounded-md border border-border bg-bg p-4 shadow-sm">
            <div className="rounded-md bg-white p-5">
              <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-sm font-semibold text-brand">AP 计算机科学 A</p>
                  <p className="mt-1 text-xs text-text-muted">单元训练 · 模考 · 错题复盘</p>
                </div>
                <span className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-brand">学习中</span>
              </div>
              <div className="space-y-3">
                {['按单元生成 Quiz', '在线完成作答', '查看结果并记录错题', '按需生成 Mock Exam'].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-md border border-border bg-white px-3 py-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded bg-bg text-xs font-semibold text-brand">
                      {index + 1}
                    </span>
                    <span className="text-sm text-text">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center text-xs">
                <Metric value="多科目" label="当前上线" />
                <Metric value="持续扩展" label="题库内容" />
                <Metric value="3" label="账号层级" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <SectionHeader
          title="开放功能"
          text="先完成一次真实训练，再根据学习需要登录或使用翎英学员工具。"
        />
        <div className="grid gap-4 md:grid-cols-3">
          {ACCESS_LEVELS.map(item => (
            <div key={item.title} className="rounded-md border border-border bg-white p-5">
              <h3 className="text-base font-semibold text-brand">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-text-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-white">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <SectionHeader
            title="课程体系覆盖"
            text="当前以 AP 训练题库为主，底层结构预留课程体系扩展能力，不把平台锁定在单一考试体系。"
          />
          <div className="grid gap-4 md:grid-cols-2">
            {PROGRAM_GROUPS.map(group => (
              <div key={group.title} className="rounded-md border border-border bg-bg p-5">
                <h3 className="text-base font-semibold text-brand">{group.title}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.items.map(item => (
                    <span key={item} className="rounded border border-border bg-white px-3 py-2 text-sm text-text">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <SectionHeader
          title="学习流程"
          text="从单元训练到模考复盘，核心路径保持清晰，减少学生在工具之间切换的成本。"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FLOW.map((item, index) => (
            <div key={item} className="flex items-center gap-3 rounded-md border border-border bg-white p-4">
              <span className="text-sm font-semibold text-accent">{String(index + 1).padStart(2, '0')}</span>
              <span className="text-sm font-medium text-text">{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-12 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-brand">开始一次开放练习</h2>
            <p className="mt-2 text-sm text-text-muted">先选择科目与单元，完成一组 Quiz 后再决定是否登录保存记录。</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/quiz" className="rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-light">
              进入题库
            </Link>
            <Link to="/register" className="rounded-md border border-border px-5 py-3 text-sm font-semibold text-brand hover:border-brand">
              创建账号
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function Metric({ value, label }) {
  return (
    <div className="rounded-md bg-bg px-3 py-3">
      <div className="text-lg font-bold text-brand">{value}</div>
      <div className="mt-1 text-text-muted">{label}</div>
    </div>
  )
}

function SectionHeader({ title, text }) {
  return (
    <div className="mb-7 max-w-2xl">
      <h2 className="text-2xl font-bold text-brand">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-text-muted">{text}</p>
    </div>
  )
}

export default LandingPage
