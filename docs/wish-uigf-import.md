# 抽卡记录 UIGF 导入说明

本文档说明抽卡记录页的“导入 UIGF”功能。UIGF 可用于初始化尚无数据的页面，也可在已有抽卡记录 JSON 基础上增量修补。

## 适用页面

- 页面文件：`index-wish.html`
- 脚本目录：`assets/js/wish/`（UIGF 逻辑位于 `import-export.js`）
- 入口按钮：“导入 UIGF”
- 前置数据：无；页面无数据时会使用空白 `schemaVersion: 4` 数据初始化

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

1. 点击“导入 UIGF”，选择 UIGF JSON 文件。若页面已有 `schemaVersion: 4` 主数据，将执行增量导入；若页面无数据，将直接初始化。
2. 页面会分析 UIGF `list`，弹出“UIGF 导入结果”确认窗口。
3. 检查“偏移校验”和“变更详情”。空池初始化时 offset 为 `0`；增量导入会从已有重合记录动态推算 offset。
4. 增量导入只有在所有池子的 offset 校验通过时，“确认应用”按钮才可用。
5. 应用后，页面当前数据会被修改，并显示“当前数据已修改，尚未导出”。
6. 点击“导出当前数据”，保存合并后的 `wish-data.schema-v4.export.json`。

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

页面不会直接使用 UIGF 原始序号，而是按每个池子的 UIGF 记录数量和导入时确定的 offset 计算页面内抽位：

```text
pullIndex = 当前池子 UIGF 记录数 - 该记录在当前池子中的文件顺序索引 + offset
```

文件顺序索引从 `0` 开始。空白页面或空池初始化时 offset 为 `0`，因此 N 条记录会映射为第 `1～N` 抽，不会凭空补入文件中不存在的历史抽数。已有池子增量导入时，offset 会根据主数据与 UIGF 中重合的 5 星记录动态推算。

UIGF 文件中同一池子的记录顺序会影响计算出的 `pullIndex`。导入前应确保记录按最新到最旧排列。

## Offset 校验

为避免把 UIGF 记录合并到错误抽位，页面在增量导入时会对每个支持池子推算 offset。页面无数据或对应池子为空时没有旧记录需要对齐，因此使用 offset `0` 初始化。

1. 从当前主 JSON 中取出带 `time` 的 5 星记录。
2. 从 UIGF 中取出同池子的 5 星记录。
3. 时间、名称和类型相同的记录组合仅用于提出可能的 offset，即 `当前主 JSON pullIndex - UIGF 反向局部序号`。
4. 对所有候选 offset 按支持它的位置关系数量计票；支持数唯一最高的非负整数成为该池子的 offset。
5. 使用 `UIGF 反向局部序号 + offset` 得到权威 `pullIndex`，并按抽位合并记录。时间、名称和类型不是记录身份，不会产生所谓的“歧义匹配”。

如果存在以下情况，将无法确定唯一 offset：

- 当前主 JSON 中没有可用于提出 offset 的带时间 5 星记录。
- UIGF 中找不到任何可用于提出 offset 的同时间、同名称、同类型记录。
- 支持数最高的候选 offset 出现并列，无法确定唯一平移量。

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
    "label": "根据 UIGF 时间和内置版本自动推断",
    "group": "根据 UIGF 时间和内置版本自动推断"
  },
  "source": "auto"
}
```

常驻池新增 5 星的 `resultType` 会设为 `off-banner`。限定池新增 5 星会先根据常驻 5 星名单自动判定 `up` 或 `off-banner`，并根据 UIGF `time` 自动匹配内置版本及上下半期。导入弹窗的“待补充信息”区域使用“版本阶段”下拉框复核或调整，不再允许分别手填版本标签和版本分组；限定角色池还可以补充 `capturingRadiance`。

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
- 限定池新增 5 星自动匹配的“版本阶段”是否正确；超出内置版本日期范围时必须从下拉框选择。
- 4 星冲突是否符合预期。
- `totalPulls` 是否符合实际账号记录。

## 常见失败原因

| 提示或现象 | 可能原因 | 处理方式 |
| --- | --- | --- |
| UIGF 文件缺少 `list` 数组 | 文件不是 UIGF JSON，或结构不完整 | 换用包含 `list` 的 UIGF 文件。 |
| offset 校验失败 | 主 JSON 与 UIGF 不是同一账号、顺序不匹配、offset 不匹配或缺少时间锚点 | 检查主 JSON 中已有 5 星记录的 `time`、名称和类型。 |
| 确认应用按钮不可用 | 至少一个池子 offset 校验失败 | 修正数据后重新导入。 |
