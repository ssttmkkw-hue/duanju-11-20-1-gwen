# 素材与参考

## 外观调研

- Bin（陈泽彬）：[GameDaily 选手介绍与照片](https://gamedaily.com/features/league-of-legends-first-stand-2026-standout-players-who-shined)，使用其公开选手肖像作为漫画形象的外观参考。参考图不随网页分发。
- 格温：[英雄联盟官方英雄页面](https://www.leagueoflegends.com/en-us/champions/gwen/)，[Riot Data Dragon 原皮原画](https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Gwen_0.jpg)。保留蓝色卷曲双马尾、黑色发饰、蓝黑白洋装和魔法巨剪的识别元素。官方原画不随网页分发。
- 风格方向：[《等风的人》原项目](https://github.com/ssttmkkw-hue/c-c-15-codex-beauty-actor)。本项目重新编写播放器与页面，没有复用原角色、音轨或故事。

## 随项目提供的素材

- `assets/gwen/atlas.png`：本次演员小样新生成的透明部件图集，由 OpenAI ImageGen 依据格温原皮参考绘制。头部、身体、双马尾、上下臂、剪刀与闭眼替换层分别占据独立图集区域。网页使用 SVG 裁切窗口装配部件，不从完整分镜截图切出角色。
- `assets/gwen/lounge.png`：为演员小样新生成的空电竞休息室，独立于人物素材。
- `assets/gwen/take-a.mp3`、`take-b.mp3`：从本仓库已有音轨中复用格温的两句台词，增加演出前后留白，无新增 TTS 调用；对应包络重新从音频计算。相关模型许可同下。
- 分层演员的 SVG 关节绑定、程序嘴型、演出动作、界面与导出工具：本项目新编写。嘴型借鉴原项目的“音量 + 拼音估算”思路，没有直接复制其角色素材。
- `assets/storyboard.png`：通过 OpenAI ImageGen 新生成四镜头插画，再依据 Bin 公开肖像和格温原画校正外观。属同人创作，不是官方素材，也不暗示人物背书。底层人物、游戏角色和相关标识权利归相应权利人所有。
- 剧本：用户提供；分镜标题与网页文案为本项目新编写。
- `assets/dialogue.mp3`：用 Sherpa-ONNX 运行 AISHELL-3 VITS 多说话人模型离线合成。音色 6 与 10 为模型通用音色，无声音克隆。该模型与 AISHELL-3 数据集发布许可证为 Apache-2.0，参见 [模型说明](https://huggingface.co/csukuangfj/icefall-tts-aishell3-vits-low-2024-04-06) 和 [AISHELL-3](https://www.openslr.org/93/)。
- `assets/voice-envelope.json`：由合成音轨计算出的 25ms RMS 音量包络，供说话状态提示使用，不是逐音素对齐。
- 页面、时间轴、CSS 光效：项目原始代码；字体使用系统字体，无第三方字体下载。运行时无外部脚本依赖。

## 工具

- [Sherpa-ONNX](https://github.com/k2-fsa/sherpa-onnx)：Apache-2.0。
- [NumPy](https://numpy.org/): BSD-3-Clause。
- [FFmpeg](https://ffmpeg.org/legal.html)：依构建配置为 LGPL/GPL；[LAME](https://lame.sourceforge.io/): LGPL。
- [Playwright](https://github.com/microsoft/playwright)：Apache-2.0，开发验证使用，不随站点加载。

本网页明确标注同人虚构，S16 胜率与决赛描述仅来自虚构剧本。
