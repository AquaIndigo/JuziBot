
// import process from "process"
import fetch from 'node-fetch'

const apikey = 'Vgv9AkE84aKhU4nrtQKA8ZK6skasLNQGcCYSJ/TVM5HkXj0IP+nJqg=='
const apisecret = 'pbfgv2vjBIswRvWz3SDdNz0K4qpSxBlRSyLLZJa6se8OZLqeRaa2BQ=='

/**
 * 问答功能
ret = requests.post(
    'https://pretrain.aminer.cn/api/v1/poem',
    json={
        "key":"queue1",
        "topic": "干饭人",
        "author":"李白",
        "speed": "fast",
        "apikey": apikey, 
        "apisecret": apisecret
    }
)
 */
export async function actionAnswerQuestion(msg, intent) {
    if (!intent.question) {
        return await msg.say('给我个问题吧，例如告诉我：回答，关公和秦琼谁厉害？')
    }
    await msg.say('我需要思考个两三分钟，请耐心等待')
    try {
        const result = await answerQuestion(intent.question)
        if (result) {
            await msg.say(result)
        } else {
            await msg.say('哎呀我想不出来这个问题的答案了')
        }
    } catch (e) {
        console.error(e)
        await msg.say('哎呦，出了点小问题，回答不出来了，得联系联系我的主人修理修理我')
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function answerQuestion(question) {
    try {
        let ret = await fetch('https://pretrain.aminer.cn/api/v1/qa', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "key":"queue1",
                "apikey": apikey, 
                "apisecret": apisecret,
                "question": question,
                "desc": ""
            }),
        })
        ret = await ret.json()
        const taskId = ret['result']['task_id']
        console.log(taskId)
        for (let i = 0; i < 400; i++) {
            let ret2 = await fetch('https://pretrain.aminer.cn/api/v1/status?task_id=' + taskId)
            ret2 = await ret2.json()
            if (ret2.result && ret2.result.output) {
                return ret2.result.output.text
            }
            // 等待一秒，所以总共等待300秒
            await sleep(1000)
        }
        return null
    } catch (e) {
        console.error(e)
    }
}

// console.log(await answerQuestion('关公和秦琼谁厉害'))
