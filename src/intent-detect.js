/**
 * 意图识别模块
 * 意图识别是指识别一条信息的意图，只记录上下文历史，但是不根据上下文历史判断意图
 * 结合上下文历史（例如历史意图，上一轮意图）的去做判断留给下一个policy环节
 */

// import { Message } from 'wechaty'
import { bot } from './bot.js'
import { queryIntent } from './intent-query-detect.js'

const HISTORY = {}
const NOTES = {}

/**
 * 消息意图识别，识别后的意图会提交给policy
 * @param msg 消息
 * @returns 意图
 * file: 文件保存意图
 * url: 链接意图
 * search-file
 * get-search-file
 * remove-search-file
 * list-file
 * get-file
 * remove-file
 * list-todo
 * add-todo
 * mark-todo
 * greet : 介绍自己
 * bye : 再见
 */
export async function intentDetect(msg) {

    const contact = msg.talker()
    // for wechaty 1.x
    // const bot = msg.wechaty.currentUser()
    const bot = msg.wechaty.userSelf()
    if (contact === bot) {
        return {
            intent: null
        }
    }
    const room = msg.room()

    let payload = {
        roomTopic: null,
        isRoom: false,
        text: msg.text()
    }
    if (room) {
        const topic = await room.topic()
        payload.roomTopic = topic
        payload.isRoom = true
        payload.contactId = room.id
        payload.mentionSelf = await msg.mentionSelf()
        payload.room = room
        payload.contactName = contact.name()
    } else {
        payload.contactId = contact.id
        payload.contactName = contact.name()
    }

    // 读取历史
    if (HISTORY[payload.contactId] && HISTORY[payload.contactId].length) {
        payload.history = HISTORY[payload.contactId]
        payload.lastIntent = HISTORY[payload.contactId][
            HISTORY[payload.contactId].length - 1
        ]
    }
    if (!Object.prototype.hasOwnProperty.call(NOTES, payload.contactId)) {
        NOTES[payload.contactId] = []
    }
    payload.notes = NOTES[payload.contactId]

    const intent = await msgIntentDetect(msg, payload)

    // 记录历史
    if (!HISTORY[payload.contactId] || !HISTORY[payload.contactId].length) {
        HISTORY[payload.contactId] = []
    }
    HISTORY[payload.contactId].push(intent)

    return intent
}

/**
 * 处理不同的message类型
 * @param msg 消息
 * @param payload 一些上下文
 * @returns 一个包含意图的结构体
 */
export async function msgIntentDetect(msg, payload) {

    // https://wechaty.js.org/docs/api/message/#messagetype--messagetype

    // 文件意图保存
    if ([
        bot.Message.Type.Attachment,  // 包括文档
    ].includes(msg.type())) {
        const fileBox = await msg.toFileBox()
        return {
            ...payload,
            intent: 'file',
            file: fileBox,
        }
    }

    // 图片意图保存
    if ([
        bot.Message.Type.Image,
    ].includes(msg.type())) {
        const fileBox = await msg.toFileBox()
        return {
            ...payload,
            intent: 'file',
            file: fileBox,
        }
    }

    // 链接保存
    if ([
        bot.Message.Type.Url
    ].includes(msg.type())) {
        // https://github.com/wechaty/wechaty/blob/b979b0162ce57d2f9aeb7683a504faa75514196b/src/user/url-link.ts
        const urlLink = await msg.toUrlLink()
        return {
            ...payload,
            intent: 'url',
            url: urlLink.url(),
            title: urlLink.title(),
            thumbnailUrl: urlLink.thumbnailUrl(),
            description: urlLink.description(),
        }
    }
    // TODO: 语音
    // if ([
    //     bot.Message.Type.Audio
    // ].includes(msg.type())) {
    //     console.log(msg.text);
    //     const fileBox = await msg.toFileBox()
    //     return {
    //         ...payload,
    //         intent: null,
    //         file: fileBox,
    //     }
    // }
    if ([
        bot.Message.Type.Text,
    ].includes(msg.type())) {
        return await textIntentDetect(msg, payload)
    }

    // TODO: 这些暂不处理
    // MessageType.Unknown
    // MessageType.Contact
    // MessageType.Emoticon
    // MessageType.Video
    return {
        ...payload,
        intent: null,
    }
}

/**
 * 文本意图的识别
 * @param msg 消息
 * @param payload 一些附加状态
 * @returns 意图
 */
async function textIntentDetect(msg, payload) {
    let text = msg.text()

    // 去掉可能的 @xxx
    if (payload.isRoom && payload.mentionSelf) {
        text = text.replace(/@[^\s]+\s+/g, '').trim()
    }

    const urlExists = text.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/)
    if (urlExists) {
        const url = urlExists[0]
        return {
            ...payload,
            intent: 'url',
            url,
        }
    }

    /**
     * 这里这里具有顺序性，笔记优先级高
     */
    if (text !== '结束记录' && payload.lastIntent && payload.lastIntent.intent === 'noting') {
        if (payload.isRoom) {
            payload.notes.push(`${payload.contactName}：${text}`)
        } else {
            payload.notes.push(`${text}`)
        }
        return {
            ...payload,
            intent: 'noting',
            begin: false,
        }
    }

    let m
    const tagFlag = text.startsWith("#")
    // 群里，如果不是用“/”、“\” "#" "小橘" "小橘子" "橘子" "桔子" "小桔子"开头，或者没有at机器人，则作为纯文本
    if (payload.isRoom && !payload.mentionSelf && !text.match(/^\/|\\|#|小橘|小橘子|橘子|桔子|小桔子/)) {
        return {
            ...payload,
            intent: 'plain-text',
            text: text
        }
    }
    // 去掉群里可能的强制操作字符“/”或者“\”开头
    if (payload.isRoom) {
        text = text.replace(/^\/|\\|#|小橘|小橘子|橘子|桔子|小桔子/, '')
    }

    if (text.match(/^结束记录$/)) {
        return {
            ...payload,
            intent: 'end-note',
        }
    }

    if (text.match(/^开始记录$/)) {
        return {
            ...payload,
            intent: 'noting',
            begin: true,
        }
    }

    // 这个正则表达式包括记录多行信息
    m = text.match(/^记录((.|[\r\n])+)/)
    if (m) {
        return {
            ...payload,
            intent: 'inline-note',
            text: m[1].trim(),
        }
    }

    if (text.match(/^意图管理$/)) {
        return {
            ...payload,
            intent: 'intent-manage',
        }
    }

    if (text.match(/成熟的机器人/) && text.match(/更新重启/)) {
        return {
            ...payload,
            intent: 'reboot',
        }
    }

    m = text.match(/^(搜索)(群文件|文件)?(.+)$/)
    if (m) {
        return {
            ...payload,
            intent: 'search-file',
            keywords: m[3].trim(),
        }
    }

    m = text.match(/^文件\s*(\d+)\s*(搜索)(文件|群文件)(.+)/)
    if (m) {
        return {
            ...payload,
            intent: 'get-search-file',
            number: Number.parseInt(m[1]),
            keywords: m[4],
        }
    }

    m = text.match(/^删除文件\s*(\d+)\s*(搜索文件|搜索群文件)(.+)/)
    if (m) {
        return {
            ...payload,
            intent: 'remove-search-file',
            number: Number.parseInt(m[1]),
            keywords: m[3],
        }
    }

    m = text.match(/^(我的文件|列出文件|群文件)$/)
    if (m) {
        return {
            ...payload,
            intent: 'list-file',
        }
    }

    m = text.match(/^文件\s*(\d+)$/)
    if (m) {
        return {
            ...payload,
            intent: 'get-file',
            number: Number.parseInt(m[1]),
        }
    }

    m = text.match(/^删除文件\s*(\d+)$/)
    if (m) {
        return {
            ...payload,
            intent: 'remove-file',
            number: Number.parseInt(m[1]),
        }
    }

    m = text.match(/^(我的待办事项|我的提醒|我的待办|我的todo|待办事项|提醒|待办|todo)$/i)
    if (m) {
        return {
            ...payload,
            intent: 'list-todo',
            status: 'pending',
        }
    }

    m = text.match(/^(所有|全部)(我的待办事项|我的提醒|我的待办|我的todo|待办事项|提醒|待办|todo)$/i)
    if (m) {
        return {
            ...payload,
            intent: 'list-todo',
            status: null,
        }
    }

    m = text.match(/^(待办事项|提醒事项|待办|提醒|todo)[\s,-](.+)/i)
    if (m) {
        return {
            ...payload,
            intent: 'add-todo',
            todo: m[2],
        }
    }

    m = text.match(/^(完成|关闭|check)[\s,，-]*(待办事项|提醒事项|待办|提醒|todo)[\s,，-]*(\d+)$/i)
    if (m) {
        return {
            ...payload,
            intent: 'mark-todo',
            number: Number.parseInt(m[3]),
        }
    }

    m = text.match(/^(回答|问答)/i)
    if (m) {
        const m2 = text.match(/^(回答|问答)[\s,，-]*(.+)$/i)
        return {
            ...payload,
            intent: 'qa',
            question: m2 ? m2[2] : null,
        }
    }

    const intentFromQuerySelf = await queryIntent(text, payload.contactId)
    if (intentFromQuerySelf) {
        return {
            ...payload,
            intent: 'user-custom',
            answer: intentFromQuerySelf,
        }
    }

    const intentFromQuery = await queryIntent(text)
    if (intentFromQuery) {
        return {
            ...payload,
            intent: intentFromQuery,
        }
    }

    // 若没有匹配以上命令，则作为纯文本
    return {
        ...payload,
        intent: 'plain-text',
        text: (tagFlag ? "#" : " ") + text,
    }
}
