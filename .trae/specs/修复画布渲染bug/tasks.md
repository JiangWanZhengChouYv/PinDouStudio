# 修复画布渲染 Bug - 任务清单

## 修复任务

### [x] 任务 1: 诊断并修复画布不显示问题
- **Priority**: P0
- **Depends On**: 无
- **Description**: 
  诊断 CanvasEngine 渲染逻辑，找出为什么画布网格完全不显示
- **Test Requirements**:
  - `human-judgment` TR-1.1: 进入编辑器页面，画布区域显示清晰的像素网格
  - `human-judgment` TR-1.2: 每个格子边界清晰可见
- **Notes**: 
  ✅ 已完成修复：
  - 重写 performRender() 使用 pixelSize 而非 zoom
  - 正确提取 palette 中的颜色对象的 .hex 属性
  - 添加 canvas.style.width/height 设置

### [x] 任务 2: 修复颜色显示和选择功能
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**: 
  修复颜色系统的显示和选择逻辑
- **Test Requirements**:
  - `human-judgment` TR-2.1: 点击颜色列表中的颜色，右侧预览区显示对应颜色
  - `human-judgment` TR-2.2: 颜色名称和色码正确显示
- **Notes**: 
  ✅ 已完成修复：
  - 修复 setPalette() 传入正确的颜色数组
  - 修复 selectColor() 正确调用 toolManager.setCurrentColor()

### [x] 任务 3: 修复画笔绘制功能
- **Priority**: P0
- **Depends On**: 任务 2
- **Description**: 
  修复画笔工具在画布上绘制颜色的功能
- **Test Requirements**:
  - `human-judgment` TR-3.1: 选择颜色后，点击画布格子，格子显示对应颜色
  - `human-judgment` TR-3.2: 拖动鼠标可以连续绘制多个格子
- **Notes**: 
  ✅ 已完成修复：
  - 重写 ToolManager.setCurrentColor() 正确存储颜色
  - 重写 executePencil() 正确获取颜色并调用 canvasEngine.setPixel()
  - 添加 toolManager.setCanvasEngine() 调用

### [ ] 任务 4: 修复导出功能
- **Priority**: P1
- **Depends On**: 任务 3
- **Description**: 
  修复 PNG/PDF 导出功能
- **Test Requirements**:
  - `programmatic` TR-4.1: 点击导出 PNG，浏览器下载 PNG 文件
  - `programmatic` TR-4.2: 点击导出 PDF，浏览器下载 PDF 文件

### [x] 任务 5: 修复项目列表刷新
- **Priority**: P1
- **Depends On**: 无
- **Description**: 
  修复返回首页时项目列表不刷新问题
- **Test Requirements**:
  - `human-judgment` TR-5.1: 编辑项目后返回首页，项目列表显示最新状态
- **Notes**: 
  ✅ 已完成修复：
  - 在 handleRouteChange() 返回首页时调用 this.homeController.loadProjects()

### [ ] 任务 6: 验证所有功能
- **Priority**: P0
- **Depends On**: 任务 1-5
- **Description**: 
  全面测试所有功能是否正常工作
- **Test Requirements**:
  - `human-judgment` TR-6.1: 所有绘图工具正常工作
  - `human-judgment` TR-6.2: 导出功能正常
  - `human-judgment` TR-6.3: 项目管理功能正常
