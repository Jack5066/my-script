/*
 * 常用JS变量:
 * agentEvent = 代理模式下自动点击模块
 * acEvent= 无障碍模式下自动点击模块
 * device = 设备信息模块
 * file = 文件处理模块
 * http = HTTP网络请求模块
 * shell = shell命令模块
 * thread= 多线程模块
 * image = 图色查找模块
 * utils= 工具类模块
 * global = 全局快捷方式模块
 * 常用java变量：
 *  context : Android的Context对象
 *  javaLoader : java的类加载器对象
 * 导入Java类或者包：
 *  importClass(类名) = 导入java类
 *      例如: importClass(java.io.File) 导入java的 File 类
 *  importPackage(包名) =导入java包名下的所有类
 *      例如: importPackage(java.util) 导入java.util下的类
 *
 */

/**
 * 抖音上滑切换视频 固定坐标 流畅版
 */
function douyinSwipeUp() {
    try {
        swipeToPoint(540, 1536, 540, 384, 150);
        sleep(500);
        return true;
    } catch (e) {
        loge("抖音上滑失败：" + e);
        return false;
    }
}
/**
 * 主业务流程 恢复原始点击逻辑 修复不点击问题
 */
function main() {
    // 预热页面 让无障碍节点提前加载
    sleep(800);

    // 1. 点击分享按钮 恢复每次重新查找 确保能点到
    let shareClickSuccess = false;
    for (var i = 0; i < 10; i++) {
        // 移除缓存逻辑 每次重新查找节点（核心修复）
        var fenx = id("com.ss.android.ugc.aweme:id/zh0");
        // 先判断节点存在再点击
        if(has(fenx)){
            click(fenx);
            sleep(1000);
            // 判断是否进入分享页面
            var hasShareText = has(text("分享给"));
            if (hasShareText) {
                shareClickSuccess = true;
                break;
            }
        }
        logi("分享失败,正在重试");
            sleep(500);
        }
        if(!shareClickSuccess){
            loge("多次点击分享失败，跳过当前作品");
            return;
        }

        // 2. 点击复制链接 恢复原始逻辑 确保稳定性
        let copySuccess = false;
        for (var i = 0; i < 10; i++) {
            var nodes = id("com.ss.android.ugc.aweme:id/zei").getNodeInfo(3000);
            if (nodes && nodes.length >= 6) {
                var targetClz = nodes[5].clz;
                var b = nodes[5].bounds;
                var selector = clz(targetClz).bounds(b.left, b.top, b.right, b.bottom);
                click(selector);
            }
            sleep(1000);
            if (has(text("链接已复制成功，去粘贴分享："))) {
                logi("获取链接成功");
                back();
                copySuccess = true;
                break;
            }
            logi("获取链接失败,正在重试");
            sleep(500);
        }
    if(!copySuccess) return;

    // 3. 读取剪贴板 修复赋值判断BUG
    const r = utils.getClipboardText();
    logi("读取结果:" + r);
    // 修复BUG = 改为 ===
    if(r === null || r === ""){
        logi("剪贴板无内容，请配置输入法后再试");
        return;
    }else {
        logi("链接获取成功");
        const link = extractDouyinLink(r);
        if(link){
            getsnid(link);
        }else{
            loge("未匹配到抖音链接");
        }
    }
}
/**
 * 自动循环任务 移除无限递归 改用while循环 解决内存泄漏
 */
function work(){
    // 最大循环次数 防止无限跑死
    const maxLoop = 9999;
    let loopCount = 0;
    while (loopCount < maxLoop) {
        loopCount++;
        // 校验是否是作品页面
        let isWorkPage = false;
        for (var i = 0; i < 10; i++) {
            let pageCheck = id("com.ss.android.ugc.aweme:id/zh0");
            if(has(pageCheck)){
                isWorkPage = true;
                break;
            }else{
                douyinSwipeUp();
                sleep(500);
            }
        }
        if(!isWorkPage) continue;
        // 执行主业务

        // 2. 调用函数，拿到返回值
        let isFound = checkCommentHasKeyWord(commentKeyWords);

        if (isFound) {
            logi("找到关键词，执行业务");
            toast("找到关键词，执行业务");
            main();
        } else {
            logi("未找到关键词，跳过");
        }

        sleep(2000);
        // 切换下一个视频
        douyinSwipeUp();
    }
}
/**
 * 网络请求 增加URL编码 防参数错乱
 */
function autoServiceStart(time) {
    for (var i = 0; i < time; i++) {
        if (isServiceOk()) {
            return true;
        }
        var started = startEnv();
        if (isServiceOk()) {
            return true;
        }
    }
    return isServiceOk();
}
function closeApp(appName) {
    utils.openActivity({
        "action": "android.settings.APPLICATION_DETAILS_SETTINGS",
        "uri": "package:" + appName
    });
    sleep(1500);
    click(textMatch(".*强.*|.*停.*|.*结.*|.*行.*"));
    sleep(1500);
    clickText("强制停止")
    clickText("强行停止")
    sleep(1500);
    home2()
}
function extractDouyinLink(aaa) {
    const urlRegex = /https?:\/\/v\.douyin\.com\/[a-zA-Z0-9_-]+/;
    const match = aaa.match(urlRegex);
    return match ? match[0] : null;
}
function isInDouyin() {
    try {
        // 查找抖音多个特征节点（提高准确性）
        let hasDouyinNode1 = has(id("com.ss.android.ugc.aweme:id/zh0")); // 分享按钮节点
        let hasDouyinNode2 = has(text("推荐")); // 推荐页文字节点
        let hasDouyinNode3 = has(text("首页")); // 首页文字节点

        // 只要有一个特征节点存在，就判定为在抖音页面
        let isDouyin = hasDouyinNode1 || hasDouyinNode2 || hasDouyinNode3;
        return isDouyin;
    } catch (e) {
        loge("节点检测异常，默认判定为不在抖音：" + e);
        return false;
    }
}
function clearSpace(str) {
    if (!str) return "";
    return str.replace(/\s+/g, "");
}
function hasAnyWord(text, wordArray) {
    if (!text || !wordArray || wordArray.length === 0) {
        return false;
    }

    // 清理评论文本所有空白（你要的功能）
    let t = clearSpace(text);

    // 直接遍历数组判断
    for (let i = 0; i < wordArray.length; i++) {
        let word = wordArray[i].trim();
        if (word && t.indexOf(word) !== -1) {
            return true;
        }
    }
    return false;
}
function checkCommentHasKeyWord(wordArray) {
    if (!wordArray || wordArray.length === 0) {
        loge("关键词数组为空");
        return false;
    }

    // 优先检测：如果有"评论"文字，说明当前作品无评论，符合条件直接返回
    if (has(text("评论"))) {
        logi("作品无评论，跳过");
        return false;
    }

    let commentBtn = id("com.ss.android.ugc.aweme:id/eqr");
    if (!has(commentBtn)) {
        logi("未找到评论按钮");
        return false;
    }
    click(commentBtn);
    sleep(1000);

    let totalChecked = 0;
    const maxCheck = 10;  // 最多检测10条评论
    let checkedTexts = new Set();  // 去重集合

    while (totalChecked < maxCheck) {
        let commentNodes = id("com.ss.android.ugc.aweme:id/content").getNodeInfo(2000);
        if (!commentNodes || commentNodes.length === 0) {
            logi("未获取到评论");
            break;
        }

        // 遍历检测当前页评论
        for (let node of commentNodes) {
            // 达到最大检测数，退出
            if (totalChecked >= maxCheck) break;

            let txt = (node.text || "").trim();
            if (!txt) continue;

            // 去重：跳过已检测过的评论
            if (checkedTexts.has(txt)) continue;
            checkedTexts.add(txt);

            totalChecked++;


            if (hasAnyWord(txt, wordArray)) {
                logi("✅ 找到匹配关键词！");
                back();
                sleep(500);
                return true;
            }
        }

        // 检测是否滑到底（优先判断"暂时没有更多了"）
        if (has(text("暂时没有更多了"))) {
            logi("已滑到底部（检测到'暂时没有更多了'）");
            break;
        }

        // 如果还没到10条且没滑到底，继续翻页
        if (totalChecked < maxCheck) {
            logi("已检测 " + totalChecked + " 条，继续翻页");
            swipeToPoint(300, 1500, 300, 100, 800);
            sleep(800);
        }
    }

    logi("❌ 共检测 " + totalChecked + " 条评论，未找到关键词，跳过此视频");
    back();
    sleep(500);
    return false;
}

function getKeyWordsFromApi() {
    try {
        // 你的新关键词接口
        let fullUrl = "http://1.13.193.209/getgjc";

        // POST 表单参数 id=user
        let params = {
            id: user
        };

        // ✅ EasyClick 官方正确 httpPost 格式（5个参数，缺一不可）
        let res = http.httpPost(
            fullUrl,    // 1 地址
            params,     // 2 参数
            null,       // 3 文件（必传）
            5000,       // 4 超时
            null        // 5 请求头（必传）
        );

        logi("【关键词】返回结果：" + res);

        // 异常直接停止
        if (!res || res.includes("下单成功") || res.startsWith("{")) {
            toast("关键词获取失败");
            exit();
        }

        return res.trim();
    } catch (e) {
        loge("关键词异常：" + e);
        toast("关键词异常");
        exit();
    }
}

function getsnid(url) {
    try {
        let encodeUrl = encodeURIComponent(url);
        let reqUrl = url_ + "SN?url=" + encodeUrl + "&id="+user+"&uid="+uid+"&t="+Date.now();
        let Str = http.httpGetDefault(reqUrl, 5000);
        if (Str == null) {
            logi("【上报】服务器链接失败");
            return;
        }
        logi("【上报】返回：" + Str);
        toast(Str);
    } catch (e) {
        loge("【上报】异常："+e);
    }
}
/* ========== 暂时屏蔽 OCR 代码（留作备用）==========
let ncnnOcr = null
//脚本停止回调
setStopCallback(function () {
    //释放所有资源,一般不需要调用,或者放到setStopCallback中
    logi("释放 ncnnOcr 对象")
    ncnnOcr && ncnnOcr.releaseAll()
})
//初始化自动化环境
function initEnv() {
    if (!startEnv()) {
        loge("自动化启动失败,结束脚本")
        exit()
    }
    if (!image.requestScreenCapture(10000, 0)) {
        loge("申请截图权限失败,检查是否开启后台弹出,悬浮框等权限")
        exit()
    }
    //申请完权限至少等1s(垃圾设备多加点)再截图,否则会截不到图
    sleep(1000)
}
//初始化
function initOcrpaddle() {
    // type= paddleOcrNcnnV5
    let config = {"type": "paddleOcrNcnnV5","modelsDir":"","numThread":0,"padding":32,"maxSideLen":640}
    //创建ocr对象,仅脚本开头一次即可
    ncnnOcr = ocr.newOcr()
    //初始化ocr,仅脚本开头一次即可
    if (!ncnnOcr.initOcr(config)) {
        loge("OCR初始化失败 : " + ncnnOcr.getErrorMsg())
        exit()
    }
}
function ocrFunc() {
    // 先截取全屏
    let fullImg = image.captureFullScreenEx()
    if (!fullImg) {
        loge("截图失败")
        return
    }

    // 固定裁剪范围
    let clipX = 0;
    let clipY = 379;
    let clipWidth = 1199;
    let clipHeight = 2178;

    logi(`裁剪区域: x=${clipX}, y=${clipY}, width=${clipWidth}, height=${clipHeight}`);

    // 裁剪出视频区域
    let img = image.clip(fullImg, clipX, clipY, clipWidth, clipHeight);
    image.recycle(fullImg);  // 释放全屏图片

    if (!img) {
        loge("裁剪失败")
        return
    }

    // 对图片进行识别
    let result = ncnnOcr.ocrImage(img, 20 * 1000, {"padding":32})
    if (result && result.length > 0) {
        // 按照 Y 坐标从小到大排序（从上到下）
        result.sort(function(a, b) {
            return (a.y || 0) - (b.y || 0);
        });

        // 组合所有文字到一起
        let allText = "";
        let detailInfo = "";

        for (let i = 0; i < result.length; i++) {
            let value = result[i];
            let text = value.label || "";

            // 跳过空文字
            if (!text) continue;

            // 组合纯文字（用于整体显示）
            allText += text + " ";

            // 详细信息（包含置信度和位置）
            detailInfo += `[${text}] 置信度:${value.confidence.toFixed(2)} 位置:(${value.x},${value.y}) `;
        }

        // 整体输出
        logi("📝 识别到的文字: " + allText.trim());
        logi("📊 详细信息: " + detailInfo.trim());

        // 如果需要也可以 toast 显示
        toast("识别结果: " + allText.trim());

    } else {
        logw("未识别到结果")
    }
    //回收图片
    image.recycle(img)
}
function amain() {
    //初始化环境
    initEnv()
    //初始化ocr
    initOcrpaddle()
    //多次识别
    ocrFunc()
}
amain()
exit()
========== OCR 代码结束（取消注释即可恢复）========== */

if (!isInDouyin()) {
    logd("当前未在抖音页面，脚本直接退出");
    toast("请在抖音内运行脚本，即将退出");
    sleep(1000);
    exit(); // 直接关闭脚本
}
const url_ = "http://1.13.193.209/"
const user = readConfigString("user");
const uid = readConfigString("uid");
let autoMode = readConfigString("autoMode");
autoMode = autoMode === true || autoMode === "true";
let commentKeyWords = []; // 数组


//自动化服务校验
if (!autoServiceStart(3)) {
    logd("自动化服务启动失败，无法执行脚本")
    exit();
}

// 模式区分运行
if (autoMode) {
    // ===================== 核心修改：先查推荐，找不到再点首页 =====================
    let isInRecommendPage = false;
    for (var i = 0; i < 10; i++) {
        // 第一步：先检测是否已经在推荐页
        if(has(text("推荐"))){
            isInRecommendPage = true;
            logd("已检测到推荐页，无需点击首页");
            break;
        }else{
            logd("未检测到推荐页，点击首页后重试");
            // 第二步：检测不到推荐页时，才点击首页
            let homeBtn = text("首页");
            if(has(homeBtn)){ // 先判断首页按钮存在再点击
                click(homeBtn);
            }
            sleep(500); // 点击后等待页面切换
            // 第三步：点击首页后再次检测推荐页
            if(has(text("推荐"))){
                isInRecommendPage = true;
                break;
            }
            // 仍未找到推荐页，继续循环重试，不直接退出
            toast("未找到推荐页，正在重试...");
        }
    }
    // 循环结束后仍未找到推荐页，才提示并退出
    if(!isInRecommendPage){
        toast("脚本已停止，请在抖音推荐页打开");
        exit();
    }
    // ============================================================================

    let keyStr = getKeyWordsFromApi();
    commentKeyWords = keyStr.split("，");
    logi("自动模式已启动 → 获取评论关键词");
    toast("关键词数组：" + commentKeyWords)

    work();
}else {
    logd("进入手动单次执行模式");
    main();
}
