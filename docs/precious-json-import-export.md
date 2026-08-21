# 贵重资源 JSON 导入导出说明

本文档说明贵重资源页的 JSON 格式。该格式用于页面顶部的“上传 JSON”“下载模板”“导出当前数据”功能。

## 适用范围

- 页面：`index-precious.html`
- 数据类型：`dataType: "precious-resources"`
- 当前格式：`schemaVersion: 2`
- 模板文件名：`precious-resources.schema-v2.template.json`
- 当前数据文件名：`precious-resources.YYMMDD.json`

页面仍可导入 `schemaVersion: 1`，导入时会自动迁移到版本 2。

## 顶层结构

```json
{
  "dataType": "precious-resources",
  "schemaVersion": 2,
  "materials": {
    "sanctifyingUnction": {},
    "sanctifyingEssence": {}
  }
}
```

版本 2 不再包含顶层 `versions`。版本名称、顺序和日期统一由网页内置的 `assets/js/version-info.js` 提供，收入和支出只保存稳定的 `versionId`。

导入时必须满足：

- JSON 根节点是对象。
- `dataType` 缺失时按旧文件兼容；存在时必须为 `precious-resources`。
- `schemaVersion` 为 `1` 或 `2`。
- `materials` 是对象，并包含对象类型的 `sanctifyingUnction` 和 `sanctifyingEssence`。
- 版本 1 还必须包含 `versions` 数组，用于迁移旧 `versionId`。

## 材料类型

| 材料 key | 页面名称 |
| --- | --- |
| `sanctifyingUnction` | 祝圣之霜 |
| `sanctifyingEssence` | 启圣之尘 |

两种材料使用相同结构：

```json
{
  "versionIncomeSources": [],
  "versionIncomeRecords": [],
  "otherIncomes": [],
  "expenses": [],
  "expenseSetOptions": []
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `versionIncomeSources` | array | 按版本录入的收入来源选项。 |
| `versionIncomeRecords` | array | 按版本记录数量的收入记录。 |
| `otherIncomes` | array | 非版本维度的一次性或周期性收入。 |
| `expenses` | array | 消耗记录。 |
| `expenseSetOptions` | string[] | 圣遗物套装候选项；导入时也会从支出记录补齐。 |

## 内置版本

版本从 5.0 的 2024-08-28 开始，每个版本持续 42 天；前 21 天为上半，后 21 天为下半。表中的日期均包含当天。

| versionId | 展示名 | 开始日期 | 上半结束 | 下半开始 | 结束日期 |
| --- | --- | --- | --- | --- | --- |
| `5.0` | 5.0 | 2024-08-28 | 2024-09-17 | 2024-09-18 | 2024-10-08 |
| `5.1` | 5.1 | 2024-10-09 | 2024-10-29 | 2024-10-30 | 2024-11-19 |
| `5.2` | 5.2 | 2024-11-20 | 2024-12-10 | 2024-12-11 | 2024-12-31 |
| `5.3` | 5.3 | 2025-01-01 | 2025-01-21 | 2025-01-22 | 2025-02-11 |
| `5.4` | 5.4 | 2025-02-12 | 2025-03-04 | 2025-03-05 | 2025-03-25 |
| `5.5` | 5.5 | 2025-03-26 | 2025-04-15 | 2025-04-16 | 2025-05-06 |
| `5.6` | 5.6 | 2025-05-07 | 2025-05-27 | 2025-05-28 | 2025-06-17 |
| `5.7` | 5.7 | 2025-06-18 | 2025-07-08 | 2025-07-09 | 2025-07-29 |
| `5.8` | 5.8 | 2025-07-30 | 2025-08-19 | 2025-08-20 | 2025-09-09 |
| `6.0` | 月之一 | 2025-09-10 | 2025-09-30 | 2025-10-01 | 2025-10-21 |
| `6.1` | 月之二 | 2025-10-22 | 2025-11-11 | 2025-11-12 | 2025-12-02 |
| `6.2` | 月之三 | 2025-12-03 | 2025-12-23 | 2025-12-24 | 2026-01-13 |
| `6.3` | 月之四 | 2026-01-14 | 2026-02-03 | 2026-02-04 | 2026-02-24 |
| `6.4` | 月之五 | 2026-02-25 | 2026-03-17 | 2026-03-18 | 2026-04-07 |
| `6.5` | 月之六 | 2026-04-08 | 2026-04-28 | 2026-04-29 | 2026-05-19 |
| `6.6` | 月之七 | 2026-05-20 | 2026-06-09 | 2026-06-10 | 2026-06-30 |
| `6.7` | 月之八 | 2026-07-01 | 2026-07-21 | 2026-07-22 | 2026-08-11 |
| `7.0` | 7.0 | 2026-08-12 | 2026-09-01 | 2026-09-02 | 2026-09-22 |
| `7.1` | 7.1 | 2026-09-23 | 2026-10-13 | 2026-10-14 | 2026-11-03 |
| `7.2` | 7.2 | 2026-11-04 | 2026-11-24 | 2026-11-25 | 2026-12-15 |
| `7.3` | 7.3 | 2026-12-16 | 2027-01-05 | 2027-01-06 | 2027-01-26 |
| `7.4` | 7.4 | 2027-01-27 | 2027-02-16 | 2027-02-17 | 2027-03-09 |
| `7.5` | 7.5 | 2027-03-10 | 2027-03-30 | 2027-03-31 | 2027-04-20 |
| `7.6` | 7.6 | 2027-04-21 | 2027-05-11 | 2027-05-12 | 2027-06-01 |
| `7.7` | 7.7 | 2027-06-02 | 2027-06-22 | 2027-06-23 | 2027-07-13 |
| `7.8` | 7.8 | 2027-07-14 | 2027-08-03 | 2027-08-04 | 2027-08-24 |

附件中的版本序列在月之八（`6.7`）后进入 `7.0`，因此内置表不包含 `6.8`。

## 版本收入来源

```json
{
  "key": "extraction",
  "label": "萃取"
}
```

内置默认来源：

| 材料 | 默认来源 |
| --- | --- |
| 祝圣之霜 | `extraction` 萃取、`bp` 纪行 |
| 启圣之尘 | `nether` 幽境、`bp` 纪行 |

导入时会合并默认来源和 JSON 中的自定义来源，并按 `key` 去重。

## 版本收入记录

```json
{
  "id": "income-extraction",
  "sourceKey": "extraction",
  "note": "版本周期来源",
  "updateTime": "2026-08-21T01:00:00.000Z",
  "entries": [
    {
      "versionId": "6.6",
      "amount": 2
    }
  ]
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 记录唯一标识。 |
| `sourceKey` | string | 收入来源 key；为空的记录会被过滤。 |
| `note` | string | 备注。 |
| `updateTime` | string/null | 更新时间。 |
| `entries` | array | 各版本数量列表。 |
| `entries[].versionId` | string | 内置版本 ID，例如 `5.6`、`6.6`、`7.0`。 |
| `entries[].amount` | number | 该版本收入数量。 |

## 其他收入记录

```json
{
  "id": "other-income-1",
  "source": "其他",
  "cycleLabel": "一次性获取",
  "amount": 1,
  "note": "补充说明",
  "updateTime": "2026-08-21T01:00:00.000Z"
}
```

祝圣之霜内置候选来源为剧诗、砺行修远、地区探索、庆典、其他；启圣之尘为砺行修远、地区探索、庆典、其他。

## 支出记录

```json
{
  "id": "expense-1",
  "versionId": "7.0",
  "amount": 2,
  "setName": "逐影猎人",
  "slot": "理之冠",
  "mainStat": "暴击",
  "note": "测试示例",
  "updateTime": "2026-08-21T01:00:00.000Z"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 记录唯一标识。 |
| `versionId` | string | 内置版本 ID。 |
| `amount` | number | 消耗数量。 |
| `setName` | string | 圣遗物套装名称。 |
| `slot` | string | 生之花、死之羽、时之沙、空之杯或理之冠。 |
| `mainStat` | string | 对应部位的主属性。 |
| `note` | string | 备注。 |
| `updateTime` | string/null | 更新时间。 |

## 完整最小示例

```json
{
  "dataType": "precious-resources",
  "schemaVersion": 2,
  "materials": {
    "sanctifyingUnction": {
      "versionIncomeSources": [],
      "versionIncomeRecords": [],
      "otherIncomes": [],
      "expenses": [],
      "expenseSetOptions": []
    },
    "sanctifyingEssence": {
      "versionIncomeSources": [],
      "versionIncomeRecords": [],
      "otherIncomes": [],
      "expenses": [],
      "expenseSetOptions": []
    }
  }
}
```

## schemaVersion 1 迁移

旧文件的收入和支出引用自定义的 `versions[].id`。导入时页面按以下顺序寻找对应内置版本：

1. `versions[].sortKey`
2. `versions[].label`
3. 旧 ID 本身

找到后会把引用转换为稳定的 `versionId`。例如附件中的 `precious-version-1779521491969-n9wo30` 会根据 `sortKey: "6.6"` 转换为 `6.6`。导出结果固定为 schema 2，不再包含 `versions`。

如果仍被收入或支出引用的旧版本无法对应内置表，导入会报错并列出相关 ID，不会静默丢弃记录。

## 注意事项

- 页面编辑只更新浏览器中的当前数据；要长期保留需导出 JSON。
- 数量字段导入时会转换为数字。
- `expenseSetOptions` 会与支出记录中的 `setName` 合并、去重和排序。
- 页面内新增支出时会根据材料和部位自动计算消耗数量。
- 启圣之尘按支出版本顺序累计重塑进度，每 6 点完成一个阶段，18 点完成一轮。
