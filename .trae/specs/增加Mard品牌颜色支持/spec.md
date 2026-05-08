# 增加Mard品牌颜色支持 - 产品需求文档

## Overview
- **Summary**: 在现有的Artkal和Perler品牌基础上，增加Mard品牌的221个颜色，并将其与Artkal色号并列显示在颜色选择面板中
- **Purpose**: 扩展应用的颜色支持范围，让用户能够使用更多拼豆品牌颜色进行设计
- **Target Users**: 使用拼豆工坊进行像素艺术创作的用户

## Goals
- 创建Mard品牌颜色数据文件，包含221个颜色
- 在颜色选择面板中添加Mard品牌标签页
- 确保Mard颜色与Artkal、Perler品牌并列显示

## Non-Goals (Out of Scope)
- 不修改现有的Artkal和Perler颜色数据
- 不改变颜色选择面板的整体布局（仅添加新品牌标签）

## Background & Context
用户请求添加Mard品牌的颜色支持。Mard是一个拼豆品牌，提供多种颜色选择。已获取Mard品牌完整颜色列表（221个颜色），包含A系列、B系列、C系列、D系列、E系列、F系列、G系列、H系列和M系列。

## Functional Requirements
- **FR-1**: 创建Mard品牌颜色数据文件（js/data/mard-colors.js）
- **FR-2**: 在ColorManager中添加Mard品牌的颜色获取方法
- **FR-3**: 在颜色面板中添加Mard品牌标签页
- **FR-4**: 确保Mard颜色数据格式与Artkal/Perler一致（包含code, name, hex, rgb）

## Non-Functional Requirements
- **NFR-1**: 颜色数据应准确无误，HEX和RGB值正确对应
- **NFR-2**: 颜色切换应流畅无卡顿

## Constraints
- **Technical**: 使用ES6模块化结构，颜色数据存储在独立文件中
- **Data**: Mard颜色共221个，需完整录入

## Assumptions
- Mard颜色数据格式与现有Artkal/Perler保持一致
- 用户主要使用Artkal品牌，Mard作为补充选项

## Acceptance Criteria

### AC-1: Mard品牌颜色数据完整
- **Given**: 用户查看Mard品牌颜色
- **When**: 切换到Mard标签
- **Then**: 应显示所有221个Mard颜色
- **Verification**: `programmatic` - 验证颜色数量

### AC-2: 颜色显示正确
- **Given**: 用户查看Mard颜色网格
- **When**: 切换到Mard标签
- **Then**: 每个颜色按钮应显示正确的颜色
- **Verification**: `human-judgment`

### AC-3: 品牌标签并列显示
- **Given**: 用户在编辑器页面
- **When**: 查看颜色面板
- **Then**: 应显示Artkal、Perler和Mard三个品牌标签
- **Verification**: `human-judgment`

## Open Questions
- 无

## Mard颜色数据摘要
- A系列: A1-A26 (26个颜色)
- B系列: B1-B32 (32个颜色)
- C系列: C1-C29 (29个颜色)
- D系列: D1-D26 (26个颜色)
- E系列: E1-E24 (24个颜色)
- F系列: F1-F25 (25个颜色)
- G系列: G1-G21 (21个颜色)
- H系列: H1-H23 (23个颜色)
- M系列: M1-M15 (15个颜色)
- 总计: 221个颜色