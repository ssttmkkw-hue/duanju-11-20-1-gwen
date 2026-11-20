# 素材与参考

## 外观调研

- Bin（陈泽彬）：[GameDaily 选手介绍与照片](https://gamedaily.com/features/league-of-legends-first-stand-2026-standout-players-who-shined)，使用其公开选手肖像作为漫画形象的外观参考。参考图不随网页分发。
- 格温：[英雄联盟官方英雄页面](https://www.leagueoflegends.com/en-us/champions/gwen/)，[Riot Data Dragon 原皮原画](https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Gwen_0.jpg)。保留蓝色卷曲双马尾、黑色发饰、蓝黑白洋装和魔法巨剪的识别元素。官方原画不随网页分发。
- 风格方向：[《等风的人》原项目](https://github.com/ssttmkkw-hue/c-c-15-codex-beauty-actor)。本项目重新编写播放器与页面，没有复用原角色、音轨或故事。

## 随项目提供的素材

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
