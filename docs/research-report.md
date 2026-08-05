# 产品线 #5 选品调研报告（阶段 A）

日期：2026-08-05 ｜ 调研人：project-lead（Devin）｜ 方法：三捷径框架（低分高需求 / 高付费率 / 供需窗口）+ 头部竞品真实注册深度体验

## 结论（拍板）

**选定方向：Meal planning with family sync（家庭协同做饭周计划）。产品名 MealLoop，域名 mealloop.zalize.com，仓库 wookat/mealloop。**

差异化定位：**Web 优先、免费、零门槛的「家庭共享菜谱库 + 周计划 + 实时同步购物清单」**——
一条分享链接即可让全家人（无需注册 App、无需付费订阅）共同查看/勾选本周吃什么和买什么。
直击竞品最密集的差评点：购物清单跨设备同步慢/清不掉、强制订阅付费、移动端 App-only、上手流程臃肿。

## 三个候选方向逐项评估

### 1) Reading tracker（Goodreads/StoryGraph/Hardcover）——不选

| 维度 | 证据 |
|---|---|
| 低分高需求 | Goodreads 差评集中在过时 UI、Amazon 所有权、社区毒性（公开评论/媒体报道大量存在）；需求确实巨大 |
| 供给 | StoryGraph（数百万用户、Amazon-free、视觉现代）、Hardcover（indie、社交向）、Candl、Shelvd 等新贵已卡位；web 优先赛道已被 StoryGraph 占据 |
| 体验 | Goodreads 首页体验完成（ss_d15ae1a9.png）；StoryGraph 与 Hardcover 注册均被 Cloudflare 人机验证拦截（多次尝试未过，截图存档），依赖公开资料补证 |
| 判定 | 需求真实但**替代品供给已饱和**，一个冷启动 web 产品无书目数据库（需接 OpenLibrary/Google Books，目录质量是 Goodreads 最深护城河）短期难以做出客观优于 StoryGraph 的产品 → 放弃 |

### 2) Meal planning with family sync ——**选定**

真实注册深度体验两个头部竞品：

**Plan to Eat**（$5.95/mo，14 天试用，无免费档）：
- 完整流程走通：注册（邮箱验证码 3669）→ 从 Allrecipes 一键 clip Chicken Parmesan（结构化抽取标题/配料/步骤/营养/图片，ss_878fa599.png）→ 拖拽进月历（ss_8cb939e7.png）→ 购物清单按超市分区自动聚合 12 项配料（ss_bf71ed5b.png）。
- 技术反推：Rails 老栈、表格布局、非响应式设计语言明显过时；功能完备但视觉/交互停留在 2015 年代。
- 关键弱点：**无免费模式**（14 天后必须付费）、无菜谱发现、家庭共享要靠 Friends 机制间接实现、公开差评集中在购物清单陈旧数据清不掉/多设备刷新慢。

**Samsung Food（原 Whisk）**（免费+Food+ 订阅）：
- 完整流程走通：邮箱直接注册（无验证）→ 6 步强制 onboarding 弹窗（目标/饮食/忌口/每周餐数/社区/推荐，ss_272ce2c3.png、ss_25ce8cfa.png 等）→ URL 导入同一菜谱成功（营养/血糖指数齐全，ss_a7b58ddd.png）。
- 关键弱点：**菜谱步骤不直接展示**（只给"View on Allrecipes"外链）、onboarding 冗长、社区/创作者/广告内容喧宾夺主、持续推销 Samsung Food+ 与 App 下载；大公司产品但"家庭每周吃什么"核心工作流被稀释。
- 公开差评佐证：清单同步慢、偏好记忆不一致、订阅取消困难（品类通病）。

| 三捷径 | 判定 |
|---|---|
| 低分高需求 | ✅ 应用商店 30-80 个平庸竞品，评分 2.6-3.5 分密集；需求高频刚需（每周都要决定吃什么/买什么） |
| 高付费率 | ✅ Plan to Eat 无免费档仍存活 15+ 年，Paprika 一次性付费畅销，品类付费意愿已验证；MealLoop 先免费攒流量，付费墙留开关 |
| 供需窗口 | ✅ 头部产品要么过时（Plan to Eat）要么臃肿（Samsung Food）；「免费 + web 链接即分享 + 家庭实时同步」的空位没有被占 |

### 3) Minimalist 密码管理器关停窗口——弃

- 事实：Minimalist 2026-08-01 停止开发与支持；Apple 独占、一次性付费用户群；自带导出功能。
- 判定：**信任门槛过高，按老板预设规则放弃**。密码管理是安全敏感品类，新品牌零审计、零口碑，要求用户把全部凭据交给一个刚上线的 web 产品不现实；且用户群是 Apple-native 偏好者，web 产品错位。窗口虽真实但不适合我们承接。

### 4) 调研中的更优窗口——未发现优于 #2 者

- 复查了近期关停/变动事件（TV Time 窗口已被 WatchDeck 占用，排除）。Mint 关停（记账）竞品已饱和；Google Podcasts 关停窗口已过。无数据支撑的更优窗口，不另立方向。

## 差异化功能清单（MealLoop v1）

1. **链接即家庭**：创建家庭空间生成分享链接，家人免注册即可查看/勾选（竞品全部要求装 App+注册）。
2. **URL 一键导菜谱**：服务端解析 schema.org/Recipe（对标 Plan to Eat 的 clipper、优于 Samsung Food 不展示步骤）。
3. **周计划板**：拖拽/点选把菜谱排进一周早午晚；移动端优先响应式。
4. **实时同步购物清单**：按菜谱聚合配料→按分区分组→勾选即全家实时同步（直击"清单清不掉/同步慢"差评）。
5. **免费**：付费墙代码留开关不启用。
6. pSEO：菜谱解析页/品类页 + sitemap/robots/IndexNow + zalize 站群互链。

## 证据索引

- Plan to Eat：ss_6a126868（注册）、ss_d7131f01（邮箱验证）、ss_34ebb732（菜谱库）、ss_c26cf45c（导入弹窗）、ss_878fa599（clip 成功）、ss_8cb939e7（拖入月历）、ss_bf71ed5b（购物清单聚合）
- Samsung Food：ss_0d0f6eef（首页）、ss_c676456a/ss_9459f562（注册）、ss_272ce2c3~ss_8e68b90c（6 步 onboarding）、ss_a7b58ddd（URL 导入成功，步骤外链）
- Reading tracker：ss_d15ae1a9（Goodreads）、StoryGraph/Hardcover Cloudflare 拦截截图存档
- 调研用临时邮箱：Mail.tm（不入库、不复用于生产）

## 风险与对策

- 冷启动无流量 → pSEO + zalize 站群互链 + 免费模式降低尝试门槛。
- 菜谱解析兼容性 → 优先 schema.org/Recipe JSON-LD（主流菜谱站全覆盖），失败时允许手动录入。
- 实时同步复杂度 → 轮询/短间隔刷新起步（KV/D1 即可），不上 WebSocket 造轮子。
