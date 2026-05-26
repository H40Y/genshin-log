# 抽卡记录 JSON 导入导出说明

本文档说明抽卡记录页的原生 JSON 格式。该格式用于页面顶部的“上传 JSON”“下载模板”“导出当前数据”功能。

## 适用页面

- 页面文件：`index-wish.html`
- 脚本文件：`app-wish.js`
- 当前支持格式版本：`schemaVersion: 4`
- 模板导出文件名：`wish-data.schema-v4.template.json`
- 当前数据导出文件名：`wish-data.schema-v4.export.json`

## 使用流程

1. 打开 `index-wish.html`。
2. 点击“下载模板”获取空白模板，或点击“上传 JSON”导入已有数据。
3. 在页面中编辑总抽数、5 星记录等内容。
4. 页面提示“当前数据已修改，尚未导出”时，点击“导出当前数据”保存为 JSON 文件。

导入成功后，页面会把数据写入浏览器 `localStorage`，刷新页面仍可恢复。导出才会生成可备份、可迁移的 JSON 文件。

## 顶层结构

```json
{
  "schemaVersion": 4,
  "wishData": {
    "standard": {},
    "limitedCharacter": {},
    "limitedWeapon": {}
  }
}
```

导入时必须满足：

- JSON 根节点必须是对象。
- `schemaVersion` 必须等于 `4`。
- `wishData` 必须存在。
- `wishData.standard`、`wishData.limitedCharacter`、`wishData.limitedWeapon` 三个池子必须全部存在。

## 池子字段

三个池子使用相同的数据结构：

```json
{
  "totalPulls": 0,
  "fiveStarHistory": [],
  "fourStarPullIndices": {
    "character": [],
    "weapon": []
  }
}
```

字段说明：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `totalPulls` | number | 当前池子的总抽数。页面会用它计算当前垫抽和 5 星出率。 |
| `fiveStarHistory` | array | 5 星记录列表。导入后会按 `pullIndex` 从小到大排序。 |
| `fourStarPullIndices.character` | number[] | 4 星角色出现的抽位列表。 |
| `fourStarPullIndices.weapon` | number[] | 4 星武器出现的抽位列表。 |

池子含义：

| 池子 key | 页面名称 | 对应 UIGF `gacha_type` |
| --- | --- | --- |
| `standard` | 常驻池 | `200` |
| `limitedCharacter` | 限定角色池 | `301` |
| `limitedWeapon` | 限定武器池 | `302` |

## 5 星记录字段

```json
{
  "id": "limitedCharacter-77-1",
  "pullIndex": 77,
  "time": "2025-08-11 08:14:37",
  "itemName": "示例角色",
  "itemType": "角色",
  "resultType": "up",
  "capturingRadiance": false,
  "pullVersion": {
    "label": "5.6",
    "group": "5.6.0"
  },
  "source": "manual"
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | string | 否 | 记录唯一标识。缺失时页面会按池子和抽位生成兜底值。 |
| `pullIndex` | number | 是 | 该 5 星在当前池子中的抽位，必须大于 0。 |
| `time` | string/null | 否 | 抽取时间。UIGF 导入校验会用已有 5 星的时间做匹配。 |
| `itemName` | string | 是 | 物品名称，缺失时归一化为“未命名”。 |
| `itemType` | string | 否 | 通常为 `角色` 或 `武器`。 |
| `resultType` | string | 否 | 限定池可用 `up`、`off-banner`、`unknown`；常驻池固定视为 `off-banner`。 |
| `capturingRadiance` | boolean/null | 否 | 仅限定角色池展示捕获明光标记。 |
| `pullVersion` | object/null | 否 | 限定池版本信息。常驻池编辑时不使用。 |
| `source` | string | 否 | 来源标记，常见值为 `manual` 或 `auto`。 |

`pullVersion` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `label` | string | 页面展示用版本标签，如 `5.6`、`月之一`。 |
| `group` | string/null | 排序和阶段判断用版本组，如 `5.6.0`、`5.6.5`。 |

## 完整示例

```json
{
  "schemaVersion": 4,
  "wishData": {
    "standard": {
      "totalPulls": 80,
      "fiveStarHistory": [
        {
          "id": "standard-80-1",
          "pullIndex": 80,
          "time": "2025-07-01 12:00:00",
          "itemName": "天空之刃",
          "itemType": "武器",
          "resultType": "off-banner",
          "capturingRadiance": null,
          "pullVersion": null,
          "source": "manual"
        }
      ],
      "fourStarPullIndices": {
        "character": [10, 30],
        "weapon": [20, 40]
      }
    },
    "limitedCharacter": {
      "totalPulls": 160,
      "fiveStarHistory": [
        {
          "id": "limitedCharacter-77-1",
          "pullIndex": 77,
          "time": "2025-08-11 08:14:37",
          "itemName": "示例常驻角色",
          "itemType": "角色",
          "resultType": "off-banner",
          "capturingRadiance": null,
          "pullVersion": {
            "label": "5.6",
            "group": "5.6.0"
          },
          "source": "manual"
        },
        {
          "id": "limitedCharacter-150-1",
          "pullIndex": 150,
          "time": "2025-08-20 20:00:00",
          "itemName": "示例限定角色",
          "itemType": "角色",
          "resultType": "up",
          "capturingRadiance": false,
          "pullVersion": {
            "label": "5.6",
            "group": "5.6.0"
          },
          "source": "manual"
        }
      ],
      "fourStarPullIndices": {
        "character": [9, 19],
        "weapon": [29, 39]
      }
    },
    "limitedWeapon": {
      "totalPulls": 70,
      "fiveStarHistory": [
        {
          "id": "limitedWeapon-65-1",
          "pullIndex": 65,
          "time": "2025-08-18 21:30:00",
          "itemName": "示例限定武器",
          "itemType": "武器",
          "resultType": "up",
          "capturingRadiance": null,
          "pullVersion": {
            "label": "5.6",
            "group": "5.6.0"
          },
          "source": "manual"
        }
      ],
      "fourStarPullIndices": {
        "character": [],
        "weapon": [10, 20, 30]
      }
    }
  }
}
```

## 导入归一化规则

页面导入 JSON 后会做以下归一化：

- `totalPulls` 会转换为数字，缺失时为 `0`。
- `fiveStarHistory` 非数组时按空数组处理。
- 5 星记录缺失 `id` 时会生成兜底 `id`。
- 5 星记录缺失 `itemName` 时显示为“未命名”。
- 5 星记录缺失 `itemType` 时默认为 `角色`。
- 5 星记录缺失 `resultType` 时，常驻池默认为 `off-banner`，其他池默认为 `unknown`。
- `fourStarPullIndices.character` 和 `fourStarPullIndices.weapon` 会转换为数字数组，并过滤非数字值。
- 5 星记录会按 `pullIndex` 升序排序。

## 注意事项

- 页面编辑只会更新浏览器中的当前数据，不会自动写回原 JSON 文件。
- 要保留编辑结果，必须点击“导出当前数据”。
- `totalPulls` 应不小于该池子最大 5 星 `pullIndex`。页面内编辑 5 星记录时会自动抬高总抽数，但直接导入 JSON 时建议提前整理正确。
- `fourStarPullIndices` 只记录抽位和类型，不记录 4 星物品名称。若需要从 UIGF 补充 4 星索引，请参考 `wish-uigf-import.md`。
