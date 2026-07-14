# 贵重资源 JSON 导入导出说明

本文档说明贵重资源页的 JSON 格式。该格式用于页面顶部的“上传 JSON”“下载模板”“导出当前数据”功能。

## 适用页面

- 页面文件：`index-precious.html`
- 脚本目录：`assets/js/precious/`（数据逻辑位于 `core.js`）
- 当前支持格式版本：`schemaVersion: 1`
- 模板导出文件名：`precious-resources.schema-v1.template.json`
- 当前数据导出文件名：`precious-resources.schema-v1.export.json`

## 使用流程

1. 打开 `index-precious.html`。
2. 点击“下载模板”获取空白模板，或点击“上传 JSON”导入已有数据。
3. 在页面中维护版本、收入、支出记录。
4. 页面提示“当前数据已修改，尚未导出”时，点击“导出当前数据”保存为 JSON 文件。

导入成功后，页面会把数据写入浏览器 `localStorage`。导出才会生成可备份、可迁移的 JSON 文件。

## 顶层结构

```json
{
  "schemaVersion": 1,
  "versions": [],
  "materials": {
    "sanctifyingUnction": {},
    "sanctifyingEssence": {}
  }
}
```

导入时必须满足：

- JSON 根节点必须是对象。
- `schemaVersion` 必须等于 `1`。
- `versions` 缺失或不是数组时，页面会使用内置默认版本列表。
- `materials` 中缺失的材料会按空模板补齐。

## 材料类型

| 材料 key | 页面名称 |
| --- | --- |
| `sanctifyingUnction` | 祝圣之霜 |
| `sanctifyingEssence` | 启圣之尘 |

每种材料使用同一套结构：

```json
{
  "versionIncomeSources": [],
  "versionIncomeRecords": [],
  "otherIncomes": [],
  "expenses": [],
  "expenseSetOptions": []
}
```

字段说明：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `versionIncomeSources` | array | 按版本录入的收入来源选项。 |
| `versionIncomeRecords` | array | 按版本记录数量的收入记录。 |
| `otherIncomes` | array | 非版本维度的一次性或周期性收入记录。 |
| `expenses` | array | 消耗记录。 |
| `expenseSetOptions` | string[] | 圣遗物套装候选项。导入时也会从 `expenses[].setName` 自动补齐。 |

## 版本字段

```json
{
  "id": "default-version-1-6",
  "label": "5.5",
  "sortKey": "5.5",
  "group": "5.x"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 版本唯一标识。收入和支出通过 `versionId` 引用它。 |
| `label` | string | 页面展示名称，如 `5.6`、`月之一`。 |
| `sortKey` | string/null | 排序用键，如 `5.6`、`6.0`。缺失时会使用 `label`。 |
| `group` | string | 版本分组，如 `5.x`、`6.x`。缺失时会根据 `sortKey` 或 `label` 推断。 |

内置默认版本包括：

- `5.x`：`5.0` 到 `5.8`
- `6.x`：`月之一` 到 `月之六`，排序键为 `6.0` 到 `6.5`

## 版本收入来源字段

```json
{
  "key": "extraction",
  "label": "萃取"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `key` | string | 来源标识。`versionIncomeRecords[].sourceKey` 会引用它。 |
| `label` | string | 页面展示名称。 |

内置默认版本收入来源：

| 材料 | 默认来源 |
| --- | --- |
| 祝圣之霜 | `extraction` 萃取、`bp` 纪行 |
| 启圣之尘 | `nether` 幽境、`bp` 纪行 |

导入时页面会合并默认来源和 JSON 中的自定义来源，并按 `key` 去重。

## 版本收入记录字段

用于“同一来源按多个版本分别记录数量”的场景。

```json
{
  "id": "income-extraction",
  "sourceKey": "extraction",
  "note": "版本周期来源",
  "updateTime": "2026-05-26T12:00:00.000Z",
  "entries": [
    {
      "versionId": "default-version-1-6",
      "amount": 2
    }
  ]
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 记录唯一标识。缺失时会生成兜底值。 |
| `sourceKey` | string | 收入来源 key。为空的记录会被过滤。 |
| `note` | string | 备注。 |
| `updateTime` | string/null | 更新时间。页面新建或编辑时写入 ISO 时间。 |
| `entries` | array | 各版本数量列表。 |

`entries` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `versionId` | string | 对应 `versions[].id`。为空的条目会被过滤。 |
| `amount` | number | 该版本收入数量。 |

## 其他收入记录字段

用于“剧诗、地区探索、庆典、其他”等不按版本来源管理的收入。

```json
{
  "id": "other-income-1",
  "source": "其他",
  "cycleLabel": "一次性获取",
  "amount": 1,
  "note": "补充说明",
  "updateTime": "2026-05-26T12:00:00.000Z"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 记录唯一标识。缺失时会生成兜底值。 |
| `source` | string | 来源名称。为空的记录会被过滤。 |
| `cycleLabel` | string | 周期或批次说明。 |
| `amount` | number | 收入数量。 |
| `note` | string | 备注。 |
| `updateTime` | string/null | 更新时间。 |

内置其他收入来源：

| 材料 | 来源 |
| --- | --- |
| 祝圣之霜 | 剧诗、砺行修远、地区探索、庆典、其他 |
| 启圣之尘 | 砺行修远、地区探索、庆典、其他 |

## 支出记录字段

```json
{
  "id": "expense-1",
  "versionId": "default-version-1-7",
  "amount": 2,
  "setName": "逐影猎人",
  "slot": "理之冠",
  "mainStat": "暴击",
  "note": "测试示例",
  "updateTime": "2026-05-26T12:00:00.000Z"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 记录唯一标识。缺失时会生成兜底值。 |
| `versionId` | string | 消耗发生的版本。 |
| `amount` | number | 消耗数量。页面内新增支出时会根据材料、部位自动计算。 |
| `setName` | string | 圣遗物套装名称。 |
| `slot` | string | 圣遗物部位。 |
| `mainStat` | string | 主属性。 |
| `note` | string | 备注。 |
| `updateTime` | string/null | 更新时间。 |

页面内新增或编辑支出时会校验部位和属性：

| 部位 | 可选主属性 |
| --- | --- |
| 生之花 | 生命 |
| 死之羽 | 攻击 |
| 时之沙 | 攻击、防御、生命、精通、充能 |
| 空之杯 | 攻击、防御、生命、精通、水伤、火伤、雷伤、冰伤、风伤、岩伤、草伤、物理 |
| 理之冠 | 攻击、防御、生命、精通、暴击、爆伤、治疗 |

页面内新增支出时的默认消耗数量：

| 材料 | 生之花 | 死之羽 | 时之沙 | 空之杯 | 理之冠 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 祝圣之霜 | 1 | 1 | 2 | 4 | 3 |
| 启圣之尘 | 1 | 1 | 2 | 2 | 2 |

## 完整示例

```json
{
  "schemaVersion": 1,
  "versions": [
    {
      "id": "default-version-1-6",
      "label": "5.5",
      "sortKey": "5.5",
      "group": "5.x"
    },
    {
      "id": "default-version-1-7",
      "label": "5.6",
      "sortKey": "5.6",
      "group": "5.x"
    }
  ],
  "materials": {
    "sanctifyingUnction": {
      "versionIncomeSources": [
        {
          "key": "extraction",
          "label": "萃取"
        },
        {
          "key": "bp",
          "label": "纪行"
        }
      ],
      "versionIncomeRecords": [
        {
          "id": "income-extraction",
          "sourceKey": "extraction",
          "note": "版本周期来源",
          "updateTime": "2026-05-26T12:00:00.000Z",
          "entries": [
            {
              "versionId": "default-version-1-6",
              "amount": 2
            },
            {
              "versionId": "default-version-1-7",
              "amount": 2
            }
          ]
        }
      ],
      "otherIncomes": [
        {
          "id": "other-1",
          "source": "其他",
          "cycleLabel": "补发",
          "amount": 1,
          "note": "示例",
          "updateTime": "2026-05-26T12:00:00.000Z"
        }
      ],
      "expenses": [],
      "expenseSetOptions": []
    },
    "sanctifyingEssence": {
      "versionIncomeSources": [
        {
          "key": "nether",
          "label": "幽境"
        },
        {
          "key": "bp",
          "label": "纪行"
        }
      ],
      "versionIncomeRecords": [],
      "otherIncomes": [
        {
          "id": "other-essence-1",
          "source": "其他",
          "cycleLabel": "一次性获取",
          "amount": 2,
          "note": "",
          "updateTime": "2026-05-26T12:00:00.000Z"
        }
      ],
      "expenses": [
        {
          "id": "expense-1",
          "versionId": "default-version-1-7",
          "amount": 2,
          "setName": "逐影猎人",
          "slot": "理之冠",
          "mainStat": "暴击",
          "note": "测试示例",
          "updateTime": "2026-05-26T12:00:00.000Z"
        }
      ],
      "expenseSetOptions": [
        "逐影猎人"
      ]
    }
  }
}
```

## 导入归一化规则

页面导入 JSON 后会做以下归一化：

- `versions` 缺失时使用内置默认版本。
- 版本缺失 `id`、`label`、`sortKey`、`group` 时会生成或推断兜底值。
- 材料缺失时会补为空模板。
- `versionIncomeSources` 会合并默认来源和导入来源，并按 `key` 去重。
- `versionIncomeRecords` 中 `sourceKey` 为空的记录会被过滤。
- `versionIncomeRecords[].entries` 中 `versionId` 为空的条目会被过滤。
- `otherIncomes` 中 `source` 为空的记录会被过滤。
- `expenseSetOptions` 会与支出记录中的 `setName` 合并去重并排序。
- 数量字段会转换为数字。

## 注意事项

- 页面编辑只会更新浏览器中的当前数据，不会自动写回原 JSON 文件。
- 要保留编辑结果，必须点击“导出当前数据”。
- `versionId` 需要能对应到 `versions[].id`，否则页面仍会保留记录，但展示版本名称时可能显示为“未分组”。
- 页面内新增收入会要求数量大于 `0`；直接导入 JSON 时也建议保持正数，避免统计结果失真。
- 页面内新增支出会校验材料、版本、套装、部位和主属性；直接导入 JSON 时建议按同样规则整理数据。
