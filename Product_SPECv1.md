# Chrome Learning Quest Planner · Product SPEC v1

## 1. Problem Statement（问题陈述）

用户每天会在多个网页之间学习或处理信息，例如 YouTube 视频、微信读书、工具官网文档、GitHub Trending、TrustMRR 产品页、课程页面等。

当前问题不是“找不到网页”，而是：

用户想学习某个具体内容时，经常需要重新打开平台、翻找收藏夹、搜索历史记录或进入平台主页。这一过程中，用户容易被推荐流、首页内容、相关视频、其他链接分散注意力，导致原本的学习计划偏离。

浏览器自带收藏夹只能保存链接，不能帮助用户回答：

```txt
今天到底要学什么？
哪个内容最重要？
为什么要学这个？
学完算什么完成？
我是否真的从计划入口直达并开始学习？
我今天推进了多少？
```

因此，本产品要解决的核心问题是：

> 帮助用户把“待学习 / 待处理网页”转化成有明确意图、可规划、可直达、可完成追踪的每日学习关卡，减少从平台主页和推荐流开始学习带来的分心。

---

## 2. Proposed Solution（方案描述）

产品形态为一个 Chrome 插件。

它不是普通网页收藏夹，而是一个 **基于网页的每日学习关卡规划器**。

核心闭环：

```txt
当前网页
→ 一键保存
→ 写下为什么学和完成标准
→ 默认进入 Inbox
→ 用户手动拖入 Today
→ 按 Boss / Main / Side 规划今日关卡
→ 点击 Start 直达目标网页
→ 插件记录 active 停留时长
→ 用户回 Dashboard 手动标记 Done
```

### 2.1 产品定位

产品更接近：

```txt
反分心学习入口
网页任务化工具
个人学习课程表
每日 Quest Board
轻量 Time Blocker
```

而不是：

```txt
RSS 阅读器
网页收藏夹
Notion Web Clipper
稍后读工具
知识库
AI 摘要工具
内容推荐工具
```

---

## 3. Core User Flows（核心用户流程）

### 3.1 保存当前网页

用户在浏览器里看到一个适合学习或处理的网页时，可以通过：

```txt
1. 点击 Chrome 插件图标
2. 使用快捷键
```

打开保存 Popup。

Popup 采用极简结构：

```txt
顶部：当前网页预览
- 标题，可编辑
- 来源域名
- URL，小字显示或折叠显示

中间：学习意图表单
- 为什么要学 / 为什么要处理？必填
- 完成标准 / 预期效果是什么？必填

底部：保存动作
- 主按钮：Save to Inbox
- 次按钮：Add to Today
```

默认保存到 **Inbox**。
只有用户主动点击 **Add to Today**，任务才进入 Today。

这个设计的原则是：

> 保存不是无脑收藏，而是一次轻量承诺。用户必须写下为什么学和学完标准，防止工具变成新的收藏垃圾堆。

---

### 3.2 Inbox

Inbox 是临时收集箱。

含义：

```txt
这个网页可能有价值，但我还没决定今天是否处理。
```

Inbox 不作为默认主页面。

在 Dashboard 中，用户点击 Inbox 图标后，左侧 Sidebar 展开，显示所有 Inbox 任务。

用户可以把 Inbox 中的任务拖入 Today。
从 Inbox 拖入 Today 后，任务默认进入 **Main**。

---

### 3.3 Today Dashboard

Dashboard 默认展示 Today，而不是 Inbox。

Dashboard 是产品核心页面，结构为：

```txt
左侧：Inbox Sidebar，可折叠
主区域上方：Vertical Time Blocks，占位
主区域下方：Today Quest Board
```

主区域上方是纵向 Time Blocks，占位显示：

```txt
Morning
Noon
Afternoon
Evening
```

MVP 中 Time Blocks 只作为方向展示，暂不支持拖拽任务进去，也不生成真实时间线。

主区域下方是横向三列：

```txt
Boss | Main | Side
```

其中：

```txt
Boss = 今日最重要关卡
Main = 今日主要任务
Side = 今日支线任务
```

用户可以在 Boss / Main / Side 之间拖拽任务，调整重要性。

---

### 3.4 Start 直达学习

用户在 Today Dashboard 中点击某个任务的 **Start**。

系统行为：

```txt
1. 新建一个 Chrome tab 打开目标网页
2. Dashboard 原 tab 保留
3. 任务状态变为 In Progress
4. 插件记录目标 tab 的 tabId
5. 只有目标 tab 处于 active 状态时，累计 active 学习时长
```

这个设计的核心价值是：

> 用户不再从 YouTube 首页、GitHub 首页、微信读书首页或收藏夹重新寻找内容，而是从自己的 Today 计划中一键直达具体网页。

---

### 3.5 In Progress

任务点击 Start 后，不会从原位置移动。

任务仍然保留在 Boss / Main / Side 原来的位置，只是视觉上变成进行中状态。

MVP 中可以用简单样式表达：

```txt
状态 badge：In Progress
卡片轻微突出
显示已累计 active 时长
按钮变为 Mark Done / Open Again
```

不做复杂动画或浮层。

---

### 3.6 Done

用户学习或处理完后，回到 Dashboard，手动点击 **Mark Done**。

完成标记只在 Dashboard 里完成。

MVP 不做：

```txt
Popup 快速完成
目标网页浮层完成按钮
自动判断是否完成
强制填写复盘
```

原因：

> 本产品最重要的低摩擦发生在开始阶段，而不是结束阶段。用户可以之后再回 Dashboard 标记完成。

---

## 4. Task Model（任务模型，产品层）

每个任务代表一个网页转化成的学习 / 处理关卡。

MVP 中任务至少包含：

```txt
标题
URL
来源域名
网页描述，可选
favicon / og:image，可选
为什么学 / 为什么处理
完成标准 / 预期效果
状态
关卡分类：Boss / Main / Side
active 学习时长
创建时间
更新时间
```

### 4.1 任务状态

MVP 状态机只保留四个状态：

```txt
Inbox
Today
In Progress
Done
```

状态含义：

```txt
Inbox：
已保存，但还未安排进今日关卡。

Today：
今天计划学习或处理。

In Progress：
用户已经点击 Start，打开过目标网页，但尚未标记完成。

Done：
用户手动标记已完成。
```

不设置：

```txt
Partial
Skipped
Review
```

原因：

```txt
部分完成 = In Progress
今天不想做 = 移回 Inbox 或删除
完成了 = Done
```

---

## 5. UI Direction（界面方向）

### 5.1 整体风格

MVP 先使用系统默认风 / 极简可用风格。

暂不追求精致视觉。

MVP UI 原则：

```txt
布局清楚
功能可用
信息层级明确
不做复杂动效
不做深色模式
不做复杂游戏化视觉
不做重卡片阴影和配色设计
```

后续可以单独迭代 Notion 风和微游戏化 badge。

---

### 5.2 Dashboard 布局

Dashboard 结构：

```txt
Header
- Today Chapter
- Inbox icon

Left Sidebar
- 点击 Inbox icon 后展开
- 显示 Inbox 任务
- 可拖拽任务进入 Today

Main Area
- 上方：Vertical Time Blocks，占位
  - Morning
  - Noon
  - Afternoon
  - Evening

- 下方：Today Quest Board，横向三列
  - Boss
  - Main
  - Side
```

MVP 中 Time Blocks 是空白占位。

未来版本中，任务可以拖入 Morning / Noon / Afternoon / Evening，并根据实际 Start / Done 生成真实学习时间线。

---

### 5.3 任务卡片

任务卡片采用 Notion 任务块风。

默认显示：

```txt
标题
来源 + 状态 badge
为什么学：一行截断
完成标准：一行截断
```

Hover 或点击后显示操作：

```txt
Start
Mark Done
Edit
Delete
```

MVP 支持编辑：

```txt
标题
为什么学 / 为什么处理
完成标准 / 预期效果
删除任务
```

MVP 不支持编辑：

```txt
URL
来源网站
favicon / 缩略图
复杂标签
详细备注
历史 session 记录
```

---

## 6. Technical Constraints（技术约束）

### 6.1 Chrome 插件优先

MVP 形态为 Chrome Extension。

暂不做：

```txt
macOS App
Web SaaS
移动端 App
浏览器外全局应用
```

原因：

用户发现和保存学习网页的场景本来就发生在浏览器内。Chrome 插件可以直接读取当前页面标题、URL 和基础 metadata，比外部 link preview API 更贴近真实场景。

---

### 6.2 本地优先

MVP 数据本地保存。

不做账号系统，不做云同步。

原则：

```txt
本地优先
无登录
无服务器
先验证个人使用闭环
```

后续验证有效后，再考虑：

```txt
Chrome Sync
Supabase
自建后端
跨设备同步
```

---

### 6.3 通用网页提取

MVP 只做通用当前页提取。

自动读取：

```txt
当前 URL
document.title
favicon
meta description
og:title
og:image
```

MVP 不做特定网站深度适配：

```txt
不做 YouTube 特殊适配
不做 YouTube 时长读取
不做微信读书书名特殊提取
不做生财课程页特殊提取
不做 GitHub Trending 特殊适配
不做 TrustMRR 特殊适配
```

原因：

当前 MVP 的关键不是网页解析准确率，而是验证“网页任务化 + 今日直达 + active 时长 + Done”这个学习闭环是否成立。

如果标题读取不准，用户可以在 Popup 或 Dashboard 手动修正。

---

### 6.4 Active 时长记录

MVP 只记录从任务点击 Start 后的 active tab 停留时长。

规则：

```txt
点击 Start 后开始记录
新建 tab 打开目标网页
目标 tab active 时累计时长
切换到其他 tab 时暂停累计
切回目标 tab 时继续累计
用户 Mark Done 后停止该任务
```

MVP 不做：

```txt
鼠标键盘活跃检测
视频播放状态检测
页面可见性深度判断
AI 判断是否认真学习
偏离网页自动提醒
```

---

## 7. Non-goals（明确不做的事）

MVP 不做以下内容：

### 7.1 不做通用网页解析平台

不追求任意网页都能精准提取标题、缩略图、摘要、时长。

### 7.2 不做 AI 摘要

不自动总结视频、文章、书籍、文档内容。

### 7.3 不做 RSS / 推荐流

不做订阅源，不做内容发现，不做热门推荐。

这个产品是反推荐流的工具。

### 7.4 不做知识库

不做复杂笔记、双链、标签体系、全文保存、知识管理。

### 7.5 不做每日模板

MVP 不做固定任务模板。

例如：

```txt
每天看 TrustMRR
每天读 30 分钟书
每周看 GitHub Trending
```

这些后置到未来版本。

### 7.6 不做完整 Time Blocker

MVP 只显示 Morning / Noon / Afternoon / Evening 的垂直占位。

暂不支持：

```txt
拖拽任务到时间块
具体时间安排
真实时间线生成
日历同步
```

### 7.7 不做任务数量限制

MVP 不做：

```txt
每日最多几个任务
Boss 数量限制
任务过载提醒
智能建议减少任务
```

### 7.8 不做复杂完成机制

MVP 不做：

```txt
Partial 状态
Skipped 状态
Review 状态
强制复盘
自动完成判断
```

### 7.9 不做云同步和账号

MVP 不做登录、账号、服务器、跨设备同步。

---

## 8. Success Criteria（成功标准）

MVP 的成功不以“网页解析准确率”为第一指标，而以是否改善用户学习行为为核心。

### 8.1 7 天个人验证标准

连续使用 7 天后，观察是否满足：

```txt
1. 用户每天会打开 Dashboard 查看 Today。
2. 用户能从 Today 的任务卡片中点击 Start 直达目标网页。
3. 用户减少从平台主页、推荐流、收藏夹重新寻找内容的次数。
4. 用户愿意在保存时写下“为什么学”和“完成标准”。
5. 用户能把 Inbox 中的网页拖入 Today，并按 Boss / Main / Side 做简单规划。
6. 用户能看到 In Progress 任务的 active 停留时长。
7. 用户愿意回到 Dashboard 手动 Mark Done。
```

### 8.2 可量化标准

MVP 7 天内达到以下结果，即可认为方向有效：

```txt
保存至少 20 个网页任务
至少 10 个任务被加入 Today
至少 7 个任务被点击 Start
至少 5 个任务从插件直达，而不是从平台首页开始
至少 5 个任务被标记 Done
保存任务时，用户填写“为什么学”和“完成标准”的完成率接近 100%
```

### 8.3 行为判断标准

产品成功的核心信号是：

```txt
用户开始学习时，优先打开自己的 Today Dashboard，而不是打开 YouTube / GitHub / 微信读书 / 平台首页。
```

也就是说，用户形成新的启动习惯：

```txt
以前：
打开平台 → 被推荐流影响 → 随机浏览

现在：
打开 Dashboard → 看到今日关卡 → Start 直达 → 学完回 Dashboard
```

---

## 9. Future Enhancements（后续方向，非 MVP）

确认 MVP 有用后，可以考虑：

```txt
1. YouTube 特殊适配
   - 视频标题
   - 视频时长
   - 缩略图

2. 微信读书 / 生财 / GitHub / TrustMRR 特定规则

3. 真正的 Time Blocker
   - 拖拽任务到 Morning / Noon / Afternoon / Evening
   - 真实学习时间线
   - 计划时间 vs 实际时间对比

4. 每日固定任务模板
   - 每天读书 30 分钟
   - 每天查看 TrustMRR
   - 每周查看 GitHub Trending

5. UI Polish
   - Notion 风
   - 微游戏化 badge
   - In Progress 高亮
   - Done 状态变淡
   - 更清晰的 Quest Board

6. 数据同步
   - Chrome Sync
   - Supabase
   - 多设备同步

7. 浏览器右键菜单 / Side Panel / 更低摩擦入口
```

---

# 当前产品定义总结

这个插件的第一版不是为了做一个“更好的收藏夹”，而是为了验证一个学习行为闭环：

```txt
保存有意图的网页
→ 进入 Inbox
→ 主动加入 Today
→ 按 Boss / Main / Side 规划
→ Start 直达
→ 记录 active 学习时长
→ Done 完成反馈
```

MVP 的核心价值是：

> 让用户从自己的学习计划出发，而不是从平台信息流出发。

