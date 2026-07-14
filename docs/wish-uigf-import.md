# 抽卡记录 UIGF 导入说明

本文档说明抽卡记录页的“导入 UIGF”功能。UIGF 导入不是独立的数据格式导入，而是在已有抽卡记录 JSON 基础上的增量修补。

## 适用页面

- 页面文件：`index-wish.html`
- 脚本目录：`assets/js/wish/`（UIGF 逻辑位于 `import-export.js`）
- 入口按钮：“导入 UIGF”
- 前置数据：必须先加载 `schemaVersion: 4` 的抽卡记录主 JSON

## 支持范围

当前实现只处理以下 UIGF 池子：

| UIGF `gacha_type` | 页面池子 | 说明 |
| --- | --- | --- |
| `200` | `standard` | 常驻池 |
| `301` | `limitedCharacter` | 限定角色池 |
| `302` | `limitedWeapon` | 限定武器池 |

当前实现主要读取 UIGF `list` 数组中的以下字段：

| UIGF 字段 | 用途 |
| --- | --- |
| `gacha_type` | 判断所属池子。 |
| `rank_type` | 判断 4 星或 5 星。当前只处理 `4` 和 `5`。 |
| `name` | 5 星名称修补、新增 5 星名称、冲突展示。 |
| `item_type` | 判断角色或武器。 |
| `time` | 5 星 offset 校验和已有 5 星修补。 |

其他 UIGF 元信息不会写入页面主 JSON。

## 使用流程

1. 先点击“上传 JSON”，导入一份 `schemaVersion: 4` 的抽卡记录主 JSON。
2. 点击“导入 UIGF”，选择 UIGF JSON 文件。
3. 页面会分析 UIGF `list`，弹出“UIGF 导入结果”确认窗口。
4. 检查“偏移校验”和“变更详情”。
5. 只有所有池子的 offset 校验通过时，“确认应用”按钮才可用。
6. 应用后，页面当前数据会被修改，并显示“当前数据已修改，尚未导出”。
7. 点击“导出当前数据”，保存合并后的 `wish-data.schema-v4.export.json`。

## UIGF 文件要求

UIGF JSON 根节点必须包含非空 `list` 数组：

```json
{
  "list": [
    {
      "gacha_type": "301",
      "rank_type": "5",
      "name": "示例限定角色",
      "item_type": "角色",
      "time": "2025-08-20 20:00:00"
    }
  ]
}
```

如果缺少 `list`，或 `list` 不是数组、数组为空，导入会失败。

## 抽位映射规则

页面不会直接使用 UIGF 原始序号，而是按每个池子的 UIGF 记录数量和固定 offset 计算页面内抽位：

```text
pullIndex = 当前池子 UIGF 记录数 - 该记录在当前池子中的文件顺序索引 + offset
```

文件顺序索引从 `0` 开始。代码中的固定 offset 为：

| `gacha_type` | offset |
| --- | ---: |
| `200` | `581` |
| `301` | `2574` |
| `302` | `769` |

这意味着 UIGF 文件中同一池子的记录顺序会影响计算出的 `pullIndex`。导入前应确保 UIGF 导出顺序与当前页面数据使用的 offset 体系一致。

## Offset 校验

为避免把 UIGF 记录合并到错误抽位，页面会对每个支持池子做 offset 校验：

1. 从当前主 JSON 中取出带 `time` 的 5 星记录。
2. 从 UIGF 中取出同池子的 5 星记录。
3. 使用 `time`、`name`、`item_type` 精确匹配同一个 5 星。
4. 计算 `当前主 JSON pullIndex - UIGF 反向局部序号`。
5. 只有计算出的唯一 offset 等于代码中的固定 offset 时，该池子校验通过。

如果存在以下情况，校验会失败或出现歧义：

- 当前主 JSON 中没有可用于匹配的带时间 5 星记录。
- UIGF 中找不到同时间、同名称、同类型的 5 星。
- 同一时间匹配到多条候选记录。
- 计算出的 offset 与固定 offset 不一致。

存在任一池子 offset 校验失败时，页面会禁用“确认应用”。

## 应用后的变更

确认应用后，页面会在当前主 JSON 上做增量合并：

### 总抽数

每个池子的 `totalPulls` 会提升到以下两者的较大值：

- 当前主 JSON 中的 `totalPulls`
- UIGF 映射后该池子的最大 `pullIndex`

### 新增 4 星索引

当 UIGF 中 `rank_type` 为 `4` 时：

- `item_type` 为 `角色` 时写入 `fourStarPullIndices.character`
- `item_type` 为 `武器` 时写入 `fourStarPullIndices.weapon`

页面只保存 4 星抽位和类型，不保存 4 星名称。

如果同一抽位当前已记录为另一种 4 星类型，导入结果会显示为冲突。当前实现应用时会优先采用 UIGF 判定类型，并把该抽位从旧类型列表移到新类型列表。

代码中对历史误判做了两条例外，不计为冲突：

- 当前为角色、UIGF 为武器且名称为 `昭心`
- 当前为武器、UIGF 为角色且名称为 `砂糖`

### 新增 5 星记录

当 UIGF 中 `rank_type` 为 `5`，且当前主 JSON 同池同抽位不存在 5 星记录时，会新增：

```json
{
  "id": "自动生成",
  "pullIndex": 0,
  "time": "来自 UIGF",
  "itemName": "来自 UIGF name",
  "itemType": "来自 UIGF item_type",
  "resultType": "up/off-banner/unknown",
  "capturingRadiance": null,
  "pullVersion": {
    "label": "导入弹窗内补充",
    "group": "导入弹窗内补充"
  },
  "source": "auto"
}
```

常驻池新增 5 星的 `resultType` 会设为 `off-banner`。限定池新增 5 星会先根据常驻 5 星名单自动判定 `up` 或 `off-banner`，并在导入弹窗的“待补充信息”区域允许手动修改结果、版本标签、版本分组；限定角色池还可以补充 `capturingRadiance`。

### 修补已有 5 星记录

当当前主 JSON 同池同抽位已有 5 星记录时，页面会比较并修补：

- `time`
- `itemName`
- `itemType`

如果字段不同，会以 UIGF 内容为准。`resultType`、`capturingRadiance`、`pullVersion` 不会由 UIGF 自动判断。

## 导入前需要人工检查的内容

UIGF 应用前建议在“待补充信息”区域检查：

- 限定池新增 5 星的 `resultType` 自动判定是否正确。
- 限定角色池是否需要补充 `capturingRadiance`。
- 限定池新增 5 星的 `pullVersion` 是否完整。
- 4 星冲突是否符合预期。
- `totalPulls` 是否符合实际账号记录。

## 常见失败原因

| 提示或现象 | 可能原因 | 处理方式 |
| --- | --- | --- |
| 请先上传主 JSON | 尚未导入 `schemaVersion: 4` 抽卡记录 JSON | 先上传或加载主 JSON。 |
| UIGF 文件缺少 `list` 数组 | 文件不是 UIGF JSON，或结构不完整 | 换用包含 `list` 的 UIGF 文件。 |
| offset 校验失败 | 主 JSON 与 UIGF 不是同一账号、顺序不匹配、offset 不匹配或缺少时间锚点 | 检查主 JSON 中已有 5 星记录的 `time`、名称和类型。 |
| 确认应用按钮不可用 | 至少一个池子 offset 校验失败 | 修正数据后重新导入。 |
