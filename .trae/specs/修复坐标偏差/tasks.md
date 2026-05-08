# 修复坐标偏差 - 任务清单

## 修复任务

### [x] 任务 1: 修复画布坐标计算
- **Priority**: P0
- **Depends On**: 无
- **Description**: 
  修复 getCanvasPosition() 方法的坐标计算偏差
- **Test Requirements**:
  - `human-judgment` TR-1.1: 点击画布某位置，绘制准确在该格子
- **Notes**: ✅ 已完成修复

### [x] 任务 2: 验证删除功能
- **Priority**: P1
- **Depends On**: 无
- **Description**: 
  确认删除功能代码正确，用户可通过三个点菜单删除项目
- **Test Requirements**:
  - `human-judgment` TR-2.1: 点击三个点 → 删除，项目被移除
- **Notes**: ✅ 功能已存在，无需修改代码
