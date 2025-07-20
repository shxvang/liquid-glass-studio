# 🔮 Liquid Glass Studio

![frontPhoto](./.github/assets/title.png)

[English](README.md) | [简体中文](README-zh.md)

Apple Liquid Glass UI 在 Web 平台上的高保真还原，基于 WebGL2 和 Shader实现。力求涵盖尽可能多的 Liquid Glass 特性，并提供细致的参数控制。

## 在线演示

https://liquid-glass-studio.vercel.app/

中国大陆用户请访问:  
https://liquid-glass.iyinchao.cn/

## 截图预览

<table align="center">
  <tr>
    <td><img src="./.github/assets/title-video.gif" width="240" ></td>
    <td><img src="./.github/assets/screen-shot-1.png" width="240" /></td>
    <td><img src="./.github/assets/screen-shot-2.png" width="240" /></td>
  </tr>
  <tr>
    <td><img src="./.github/assets/screen-shot-3.png" width="240" /></td>
    <td><img src="./.github/assets/screen-shot-4.png" width="240" /></td>
  </tr>
</table>

## 功能特性

**✨ 完整复现 Apple Liquid Glass 效果，包括**：

- 折射
- 色散
- 菲涅尔反射
- 超椭圆形状（SuperEllipse）
- Blob 效果（形状融合）
- 高光眩光
- 高斯模糊遮罩
- 阴影
- 抗锯齿处理

**⚙️ 交互控制面板**：

- 通过直观 UI 实时调整参数

**🖼 背景选项**：

- 支持多种背景类型，包括图片和视频

**🎞 动画**：

- 基于 Spring 动画机制，可配置参数

## 技术

- 基于 WebGL 的高性能图形渲染
- 使用多 Pass 渲染，实现高质量高性能的高斯模糊
- 使用 SDF 定义的形状和平滑合并函数
- 自定义 Shader 实现真实玻璃质感
- 使用自定义 Leva UI 控件，实现参数可视化控制

## 快速开始

### 环境要求

- Node.js（建议使用最新 LTS 版本）
- pnpm 包管理器

### 安装与运行

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

## TODO

- [x] 更丰富的高光控制选项（硬度 / 颜色 / 大小等）
- [x] 支持自定义背景
- [ ] 自发光效果实现
- [ ] HDR 发光
- [ ] 玻璃效果预设
- [ ] 控制参数的导入 / 导出功能
- [x] 渲染步骤查看（展示中间处理结果）
- [ ] 在玻璃形状中嵌入 UI 内容

## 感谢

感谢以下资源和灵感来源：

- [SDF 函数](https://iquilezles.org/articles/distfunctions2d/) 和 [平滑合并函数](https://iquilezles.org/articles/smin/) 来自 [Inigo Quilez](https://iquilezles.org/)
- 样例图片（Buildings）由 Adrian Newell 在 [Unsplash](https://unsplash.com/photos/a-row-of-multicolored-houses-on-a-street-UtfxJZ-uy5Q) 上提供
- 样例视频（Fish / Traffic）由 Tom Fisk 在 [Pexels](https://www.pexels.com/video/light-city-road-traffic-4062991/) 上提供
- 样例视频（Flower）由 Pixabay 在 [Pexels](https://www.pexels.com/video/orange-flowers-856383/) 上提供
- 样例图片由 Apple 和 Tim Cook 提供

## 开源协议

[MIT License](LICENSE)
