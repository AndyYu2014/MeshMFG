# MeshMFG H5 页面范围（MVP）

## 1. 页面结构
- 首页 `index.html`
- 工单管理主界面 `work-orders.html`
- 工单新建界面 `work-order-new.html`

## 2. 交互范围（仅前端原型）
- 首页展示制造班长常用入口和待处理问题磁贴
- 工单管理支持按日期切换并展示状态色块（未开工/进行中/暂停）
- 工单新建使用 tab 分区：基础信息、仓库信息、工艺路线
- 提供保存/提交按钮样式和交互占位

## 3. 后续对接点（下一阶段）
- 工单列表数据 -> ERPNext Work Order 查询接口
- 物料/BOM 自动带出 -> Item/BOM 接口
- 保存/提交 -> 自定义 whitelisted method

## 4. 访问方式
- `/assets/meshapp/h5/index.html`
- `/assets/meshapp/h5/work-orders.html`
- `/assets/meshapp/h5/work-order-new.html`
