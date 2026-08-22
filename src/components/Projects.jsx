import Reveal from './Reveal'
import Arrow from './Arrow'
import TiltCard from './TiltCard'
import SplitText from './SplitText'

const PROJECTS = [
  {
    index: '01',
    title: 'cmchen-blog-starter',
    kind: '博客脚手架',
    year: '2026',
    desc: 'cmchen-blog 的开源初始化模板：功能齐全、内容为空，克隆即可搭建博客。内置 GitHub 在线后台、数学公式、全文搜索与暗色主题。',
    tags: ['Astro', 'Tailwind CSS', 'TypeScript'],
    theme: 'blue',
    link: 'https://github.com/shi-tou1234/cmchen-blog-starter',
  },
  {
    index: '02',
    title: 'cmchen-skill',
    kind: 'AI Agent',
    year: '2026',
    desc: '个人 AI agent 技能集：风格写作、回合制教学、安全审计等七套开箱即用的技能包。',
    tags: ['Markdown', 'Python', 'Skills'],
    theme: 'teal',
    link: 'https://github.com/shi-tou1234/cmchen-skill',
  },
  {
    index: '03',
    title: '词汇助手',
    kind: 'Web App',
    year: '2025',
    desc: '毛玻璃风格的英语单词学习工具：科学记忆挑战、错题驱动的每日复习计划。',
    tags: ['JavaScript', 'Tailwind CSS', 'Express'],
    theme: 'ice',
    link: 'https://github.com/shi-tou1234/word',
  },
  {
    index: '04',
    title: '老年应急信息卡',
    kind: '微信小程序',
    year: '2026',
    desc: '为银发群体设计的应急信息卡微信小程序：把老人的健康与联系方式编码为离线二维码，突发情况扫码即可一键联系家属，数据全程本地存储。',
    tags: ['WeChat', 'MiniProgram', 'QRCode'],
    theme: 'ember',
    link: 'https://github.com/shi-tou1234/card',
  },
]

export default function Projects() {
  return (
    <section className="section" id="projects">
      <div className="container">
        <Reveal>
          <div className="section-head">
            <div>
              <div className="sec-no">03</div>
              <p className="eyebrow">Projects</p>
              <h2 className="section-title">
                <SplitText text="精选项目" />
              </h2>
            </div>
            <span className="sec-rule" aria-hidden="true" />
            <a
              className="view-all"
              href="https://github.com/shi-tou1234?tab=repositories"
              target="_blank"
              rel="noreferrer"
            >
              查看全部
              <span className="arrow">
                <Arrow />
              </span>
            </a>
          </div>
        </Reveal>
        <div className="projects-grid">
          {PROJECTS.map((p, i) => (
            <Reveal key={p.index} delay={i * 110} variant={i % 2 ? 'right' : 'left'}>
              <TiltCard>
                <a
                  className="project-card"
                  href={p.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="project-thumb" data-theme={p.theme}>
                    <span className="thumb-grid" aria-hidden="true" />
                    <span className="thumb-orb" aria-hidden="true" />
                    <span className="project-index" aria-hidden="true">
                      {p.index}
                    </span>
                  </div>
                  <div className="project-body">
                    <div className="project-meta">
                      <span>{p.year}</span>
                      <i />
                      <span>{p.kind}</span>
                    </div>
                    <h3 className="project-title">{p.title}</h3>
                    <p className="project-desc">{p.desc}</p>
                    <div className="project-foot">
                      <ul className="tags">
                        {p.tags.map((t) => (
                          <li key={t} className="tag">
                            {t}
                          </li>
                        ))}
                      </ul>
                      <span className="project-go">
                        <Arrow />
                      </span>
                    </div>
                  </div>
                </a>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
