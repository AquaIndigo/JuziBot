import { plainText } from "../components/plainText/index.js";

export async function actionPlainText(msg, intent) {
    const type = await plainText(msg, intent)
    if (type !== '') {
        await msg.say(`${type} 保存成功！`)        
    } else {
        await msg.say("未识别命令")
    }
}