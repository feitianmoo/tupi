// reddit_adblock.js
let body = $response.body;
try {
    let obj = JSON.parse(body);

    function processNode(node) {
        if (Array.isArray(node)) {
            // 过滤数组中的广告节点 (对应 JQ 中的 empty 逻辑)
            return node.map(processNode).filter(item => {
                if (item && typeof item === 'object') {
                    // 过滤 adPayload
                    if (item.node && typeof item.node.adPayload === 'object') return false;
                    // 过滤 AdPost
                    if (item.__typename === "AdPost") return false;
                    // 过滤 AdMetadataCell / isAdPost
                    if (item.node && Array.isArray(item.node.cells)) {
                        let hasAd = item.node.cells.some(cell => cell.__typename === "AdMetadataCell" || cell.isAdPost === true);
                        if (hasAd) return false;
                    }
                }
                return true;
            });
        } else if (node !== null && typeof node === 'object') {
            // 替换 NSFW 提示状态与广告数组 (对应 JQ 中的 boolean 替换逻辑)
            if (node.isNsfw === true) node.isNsfw = false;
            if (node.isNsfwMediaBlocked === true) node.isNsfwMediaBlocked = false;
            if (node.isNsfwContentShown === false) node.isNsfwContentShown = true;
            if (Array.isArray(node.commentsPageAds)) node.commentsPageAds = [];

            // 递归遍历对象的所有属性
            for (let key in node) {
                node[key] = processNode(node[key]);
            }
        }
        return node;
    }

    let newObj = processNode(obj);
    $done({ body: JSON.stringify(newObj) });
} catch (e) {
    // 解析失败直接返回原 body，防止白屏
    $done({});
}
