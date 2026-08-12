# 氪金历史 JSON 导入导出说明

氪金历史页使用独立的 JSON 文件保存数据，当前格式版本为 `schemaVersion: 1`。

## 完整结构

```json
{
  "schemaVersion": 1,
  "fixedCounts": {
    "welkinMoon": 0,
    "gnosticHymn": 0,
    "gnosticChorus": 0,
    "firstTopUp": 0
  },
  "otherItems": [],
  "incentiveItems": []
}
```

## 固定项计数

`fixedCounts` 保存四种固定项目的购买次数：

| 字段 | 项目 | 固定单价 |
| --- | --- | ---: |
| `welkinMoon` | 空月祝福 | 30 元 |
| `gnosticHymn` | 珍珠纪行 | 68 元 |
| `gnosticChorus` | 珍珠之歌 | 128 元 |
| `firstTopUp` | 首充 | 1308 元 |

所有计数都应为大于或等于 0 的整数。

## 其他计数

`otherItems` 中的每条记录结构如下：

```json
{
  "id": "spending-other-唯一标识",
  "name": "创世结晶补充",
  "amount": 198,
  "primogems": 1980,
  "updateTime": "2026-08-12T00:00:00.000Z"
}
```

- `id`：记录唯一标识。手写 JSON 时可以省略，导入时会自动补齐。
- `name`：项目名称，不能为空。
- `amount`：金额，必须大于或等于 0。
- `primogems`：该项目的氪金所得，单位为原石，必须为大于或等于 0 的整数。旧数据省略该字段时按 0 处理。
- `updateTime`：最后更新时间，可省略。

## 激励计数

`incentiveItems` 中的每条记录结构如下：

```json
{
  "id": "spending-incentive-唯一标识",
  "name": "平台活动返利",
  "primogems": 3280,
  "cost": 100,
  "updateTime": "2026-08-12T00:00:00.000Z"
}
```

- `id`：记录唯一标识。手写 JSON 时可以省略，导入时会自动补齐。
- `name`：项目名称，不能为空。
- `primogems`：激励值，单位为原石，必须为大于或等于 0 的整数。
- `cost`：获得该激励产生的成本，可以填写负数表示现金激励。
- `updateTime`：最后更新时间，可省略。

## 页面计算规则

总氪金金额：

```text
固定项金额 + 其他计数金额
```

激励成本不计入总氪金金额。

额外盈亏：

```text
(氪金所得 + 激励值) / 20 - 其他计数金额 - 激励成本
```

原石参考值：

```text
额外盈亏 × 20
```

## 本地暂存与备份

页面编辑后会把当前数据暂存在浏览器 `localStorage` 中。长期保存仍建议使用“导出当前数据”生成 JSON 文件；清除浏览器数据可能会移除尚未导出的本地记录。
