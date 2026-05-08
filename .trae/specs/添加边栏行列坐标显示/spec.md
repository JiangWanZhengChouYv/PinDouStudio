# 添加边栏行列坐标显示 - 产品需求文档

## Why
用户在设计拼豆作品时，需要知道当前像素的精确位置（列号和行号），以便准确计数和对齐设计。目前画布没有显示行列坐标。

## What Changes
- 在画布顶部添加列号显示（1, 2, 3...）
- 在画布左侧添加行号显示（1, 2, 3...）
- 坐标原点在左上角（1, 1）

## Impact
- Affected specs: 画布渲染系统
- Affected code: CanvasEngine.js, editor.css

## ADDED Requirements
### Requirement: 行列坐标显示
系统应在画布边框外显示行列坐标标签

#### Scenario: 坐标显示
- **WHEN** 用户进入编辑器页面
- **THEN** 画布左上角应为(1,1)，向右递增列号，向下递增行号

### Requirement: 坐标样式
坐标标签应清晰可读，与画布内容不重叠

#### Scenario: 样式要求
- **WHEN** 坐标标签渲染
- **THEN** 标签字体大小适中，颜色与背景对比明显，不遮挡画布内容