# MealLoop 项目一页纸（产品线 #5）

## 目标
上线 mealloop.zalize.com：家庭协同做饭周计划（菜谱导入 → 周计划 → 实时同步购物清单 → 链接即家庭共享），免费模式攒流量，达到或超越 Plan to Eat / Samsung Food 的核心工作流体验。

## 范围（v1）
- 账号：邮箱魔法码登录（免密码）；家庭空间 + 免注册分享链接（只读/勾选权限）
- 菜谱：URL 导入（schema.org/Recipe 解析）+ 手动录入 + 菜谱库
- 计划：周计划板（早/午/晚），移动端优先响应式
- 清单：按周计划自动聚合配料、分区分组、勾选实时同步
- 增长：pSEO 页面 + sitemap/robots + IndexNow + zalize 站群互链 + 邮箱意向收集 + 第一方无 Cookie 统计
- 付费墙：代码留开关，不启用；不接真实收款

## 非目标（v1）
社区/评论、AI 生成菜谱、原生 App、营养师计划库、真实支付。

## 技术栈
Cloudflare Workers（Hono）+ D1（数据）+ KV（会话/缓存），前端 Tailwind CSS + 现代设计语言，SSR + 轻量交互。

## 里程碑
- M1 建仓+骨架+部署管道（当天）
- M2 核心闭环：导入→计划→清单→分享（1-2 天）
- M3 SEO/统计/互链/邮箱收集 + 四道把关（1 天）
- M4 上线 + benchmark-round-1 对标迭代（持续循环）

## 组队（子会话按需串行创建，注入 CHARTER + roles/）
ui-designer、ux-researcher、qa-engineer、user-experience-officer、security-auditor（合规与安全审计）。

## 外部资源
- Cloudflare 组织 token（已有 secret）：Workers/D1/KV/DNS ✅
- GitHub 建仓 PAT（已有 secret）✅
- Resend（邮箱魔法码发送，已有 org key）✅
- 无阻塞缺口。
