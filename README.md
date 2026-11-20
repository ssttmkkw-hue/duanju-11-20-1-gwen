# 格温申请 Bin 冠军皮肤

「剪一段心动」第一集：20 秒中文配音同人动态漫画。

Bin 坐在电竞休息室，格温提着剪刀走近。冠军皮肤的名额，她想亲自争取。

## 播放

点击「播放短剧」开始有声播放。支持暂停、重播、拖动进度、镜头跳转、静音、字幕开关、全屏，以及完整剧本中的台词跳转。空格播放/暂停，左右方向键跳转两秒。手机可直接打开观看。

这是粉丝创作。剧情及 S16 百分百胜率、决赛和冠军皮肤设定均为用户提供的虚构剧本，不代表实际赛事结果、选手言论或官方安排。声音是普通合成音色，没有克隆 Bin 本人或游戏角色配音演员的声音。

## 本地运行

无需安装前端依赖。需要 Python 3 和 Node.js（测试与构建）。

```sh
npm run dev
# 打开 http://localhost:5715
npm test
npm run build
```

源目录可直接静态托管，构建也会复制运行文件到 `dist/`。路径全部相对，兼容 GitHub Pages 仓库子路径。播放不依赖浏览器 speechSynthesis 或外部 API。

运行 `npm run export` 会生成自包含的 `dist/gwen-short.html`，可以下载后直接用浏览器打开，无需服务器与网络。

GitHub Pages：仓库 Settings → Pages → Source 选择 Deploy from a branch，Branch 选择 `main`，目录选择 `/ (root)`，保存即可。网页入口为 `https://ssttmkkw-hue.github.io/duanju-11-20-1-gwen/`。

## 演出结构

| 时间 | 镜头 | 内容 |
| --- | --- | --- |
| 0–5 秒 | 电竞休息室近景 | 格温走近，请求冠军皮肤 |
| 5–12 秒 | 中景 | 格温转圈，Bin 微笑回应 |
| 12–17 秒 | 双人特写 | 格温拽袖撒娇，Bin 无奈笑 |
| 17–20 秒 | 格温近景 | 歪头、剪刀比心、片尾标题 |

`story.json` 是可替换的剧情数据，包含镜头与六句对白的时间。`timeline.js` 是无副作用的时间轴采样函数。`app.js` 以音频当前时间为唯一时钟驱动画面、字幕和运镜，暂停与跳转不会引入独立计时器漂移。

画面采用四幅新绘制的连续分镜，共用一张 2×2 插画图集，CSS 选择各象限，加入推拉、横移、轻微旋转、魔法光点和比心效果。转圈、走近、拽袖以对应分镜姿态表现，当前版本没有连续骨骼动作、逐音素口型或生成式视频。减少动态效果偏好会关闭运镜及粒子动画。

## 重新生成配音

依赖 `sherpa-onnx`、`numpy`、FFmpeg，以及解压后的 [AISHELL-3 VITS 模型](https://huggingface.co/csukuangfj/icefall-tts-aishell3-vits-low-2024-04-06)。

```sh
python tools/prepare-voice.py /path/to/vits-icefall-zh-aishell3
```

女声音色编号 6，男声编号 10，`noise_scale=0.43`、`noise_scale_w=0.45`。先按正常语速合成，再用 FFmpeg `atempo` 在不改变音高的情况下适配分镜槽位；语速放慢设下限，避免把短句硬拉到整个镜头时长。输出 24 kHz、96 kbps、单声道 MP3，整条音轨 20 秒（MP3 编码容器有少量 padding）。

字幕保留 `Bin` 与 `S16` 原文；合成输入用「彬哥」「艾斯十六」处理模型不支持的英文。

## 验证

- `npm test`：精确切镜边界、对白空隙、片尾静音、向后跳转及越界时间。
- Chromium 实际音频播放、暂停、重播、进度跳转、字幕、静音、分镜跳转、片尾和减少动态效果。
- 桌面 1440px 与手机 390px 截图检查，手机无横向溢出。

加 `?capture` 启用调试 API `window.__drama`，包含 `seek(seconds)`、`sample()`、`audio`、`story`。

参见 [素材与参考来源](docs/CREDITS.md)。
