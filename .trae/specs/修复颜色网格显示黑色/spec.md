# 修复颜色网格显示为黑色的问题 - PRD

## Overview
- **Summary**: 颜色网格中的Artkal和Perler颜色按钮显示为黑色条纹，而不是实际颜色
- **Purpose**: 修复颜色选择面板的颜色显示问题，让用户能够正确看到和选择颜色
- **Target Users**: 所有使用拼豆工坊的用户

## Goals
- 修复颜色网格按钮显示为黑色的问题
- 确保颜色按钮正确显示Artkal和Perler品牌的各种颜色
- 确保颜色选择功能正常工作

## Non-Goals (Out of Scope)
- 不修改颜色数据本身
- 不改变颜色选择的交互逻辑

## Background & Context
用户报告颜色搜索栏下方的颜色网格显示为黑色条纹，无法看到实际颜色。截图显示所有颜色按钮都是黑色的。

## Functional Requirements
- **FR-1**: 颜色网格应正确显示Artkal品牌的所有颜色
- **FR-2**: 颜色网格应正确显示Perler品牌的所有颜色
- **FR-3**: 点击颜色按钮应正确触发颜色选择

## Non-Functional Requirements
- **NFR-1**: 颜色显示应准确无误
- **NFR-2**: 颜色切换应流畅

## Constraints
- **Technical**: 使用HTML/CSS/JavaScript，无框架依赖

## Acceptance Criteria

### AC-1: Artkal颜色正确显示
- **Given**: 用户进入编辑器页面
- **When**: 查看Artkal颜色面板
- **Then**: 所有颜色按钮应显示正确的颜色（非黑色）
- **Verification**: `human-judgment`

### AC-2: Perler颜色正确显示
- **Given**: 用户切换到Perler品牌
- **When**: 查看Perler颜色面板
- **Then**: 所有颜色按钮应显示正确的颜色（非黑色）
- **Verification**: `human-judgment`

### AC-3: 颜色选择功能正常
- **Given**: 用户点击颜色按钮
- **When**: 选择一个颜色
- **Then**: 当前颜色预览应更新为所选颜色
- **Verification**: `human-judgment`

## Open Questions
- [ ] 什么CSS规则导致颜色被覆盖为黑色？

## Root Cause Analysis
从截图和代码分析来看，颜色按钮显示为黑色条纹，可能是因为：
1. CSS规则覆盖了内联的backgroundColor样式
2. 按钮元素可能有其他样式问题（如background-image或渐变覆盖）
3. 可能存在CSS冲突或优先级问题

需要检查`.color-item`类的CSS样式是否被其他规则覆盖。