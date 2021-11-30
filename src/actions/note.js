
import moment from 'moment'
import { v4 as uuidv4 } from 'uuid'
import { addData } from '../components/search/index.js'

import { kwExtraction } from '../components/kw-extraction/index.js'

/**
 * 笔记相关
 * @param {*} msg 消息
 * @param {*} intent 意图
 */
export async function actionSaveNote(msg, intent) {
    const path = `wechaty/${intent.contactId}`
    const name =  path + '/' + moment().format('YYYY-MM-DD_HH:mm:ss') + '_笔记.txt'
    const meta = {
        name,
        fileType: 'note',
        contactId: intent.contactId.toString(),
        path,
        title: '',
        content: '',
        tags: null,
        date: '',
        user: msg.talker().payload,
        room: !!intent.room,
        url: '',
        filesize: 0,
        createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
        fileid: uuidv4(),
    }
    if (intent.intent === 'inline-note') {
        meta.content = intent.text
        meta.tags = await kwExtraction(intent.text)
        await addData(meta)
        await msg.say('单条笔记已经保存，文件名为：' + name)
    } else if (intent.intent === 'end-note') {
        meta.content = intent.notes.join('\n')
        meta.tags = await kwExtraction(meta.content)

        while (intent.notes.length) {
            intent.notes.shift(1)
        }
        await addData(meta)
        await msg.say('笔记已经停止记录，保存文件名为：' + name)
    }
}

/**
 * 提示开始记录
 * @param {*} msg 消息
 * @param {*} intent 意图
 */
export async function actionBeginNote(msg, intent) {
    if (intent.begin) {
        return await msg.say('我要开始记录模式了，如果要结束，请跟我说：“结束记录”')
    }
}

