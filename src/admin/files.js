import site from '../data/content/site.json'
import hero from '../data/content/hero.json'
import about from '../data/content/about.json'
import awards from '../data/content/awards.json'
import projects from '../data/content/projects.json'
import stats from '../data/content/stats.json'
import contact from '../data/content/contact.json'
import blog from '../data/content/blog.json'
import marquee from '../data/content/marquee.json'

// 后台可编辑的内容文件注册表：path 是仓库内的提交路径
export const CONTENT_FILES = [
  { key: 'site', label: '导航与页脚', path: 'src/data/content/site.json', data: site },
  { key: 'hero', label: '首页 Hero', path: 'src/data/content/hero.json', data: hero },
  { key: 'about', label: '关于', path: 'src/data/content/about.json', data: about },
  { key: 'awards', label: '竞赛', path: 'src/data/content/awards.json', data: awards },
  { key: 'projects', label: '项目', path: 'src/data/content/projects.json', data: projects },
  { key: 'stats', label: '统计数字', path: 'src/data/content/stats.json', data: stats },
  { key: 'contact', label: '联系', path: 'src/data/content/contact.json', data: contact },
  { key: 'blog', label: '博客区', path: 'src/data/content/blog.json', data: blog },
  { key: 'marquee', label: '技能滚动条', path: 'src/data/content/marquee.json', data: marquee },
]

export const ADMIN_SECURITY_PATH = 'public/admin-security.json'

export function initialDraft() {
  const draft = {}
  for (const f of CONTENT_FILES) draft[f.key] = structuredClone(f.data)
  return draft
}
