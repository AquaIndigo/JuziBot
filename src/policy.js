/**
 * 决策模块
 * 结合意图与上下文历史，判断需要执行什么action，并且准备好action所需的参数，传输给对应的action
 */

import { actionSaveFile } from './actions/save-file.js'
import { actionSaveUrl } from './actions/save-url.js'
import { actionFileManage } from './actions/file-manage.js'
import { actionAddTodo, actionListTodo, actionMarkTodo } from './actions/todo.js'
import { actionReboot } from './actions/reboot.js'
import { actionBye } from './actions/bye.js'
import { actionGreet } from './actions/greet.js'
import { actionAnswerQuestion } from './actions/answerQuestion.js'
import { actionSaveNote, actionBeginNote } from './actions/note.js'
import { actionIntentManage } from './actions/custom-intent.js'
import { actionPlainText } from './actions/plainText.js'

/**
 * 处理意图，根据意图去调用actions
 * @param msg 消息
 * @param intent 意图
 * file: 文件保存意图
 * url: 链接意图
 * search-file
 * get-search-file
 * remove-search-file
 * list-file
 * get-file
 * remove-file
 */
export async function policy(msg, intent) {
    // 文本语义标签识别/文本标签功能
    if ('plain-text' === intent.intent) {
        return await actionPlainText(msg, intent) 
    }

    // 意图管理
    if ('intent-manage' === intent.intent) {
        return await actionIntentManage(msg, intent)
    }

    // 行内的笔记
    if ('inline-note' === intent.intent) {
        return await actionSaveNote(msg, intent)
    }

    // 多行笔记结束
    if ('end-note' === intent.intent) {
        return await actionSaveNote(msg, intent)
    }

    // 正在记录笔记
    if ('noting' === intent.intent) {
        return await actionBeginNote(msg, intent)
    }

    // 用户自定义的问答对
    if ('user-custom' === intent.intent) {
        return await msg.say(intent.answer)
    }

    // 问答api（外部）
    if ('qa' === intent.intent) {
        return await actionAnswerQuestion(msg, intent)
    }

    // 问候与自我介绍
    if ('greet' === intent.intent) {
        return await actionGreet(msg, intent)
    }

    // 再见与挽留
    if ('bye' === intent.intent) {
        return await actionBye(msg, intent)
    }

    // 自动重启
    if ('reboot' === intent.intent) {
        return await actionReboot(msg, intent)
    }

    // 文件存储
    if ('file' === intent.intent) {
        return await actionSaveFile(msg, intent.contactId, intent.room, intent.file)
    }

    // url存储
    if ('url' === intent.intent) {
        return await actionSaveUrl(msg, intent)
    }

    // 文件管理相关
    const fileManageIntent = [
        'search-file',
        'get-search-file',
        'remove-search-file',
        'list-file',
        'get-file',
        'remove-file'
    ]
    if (fileManageIntent.includes(intent.intent)
    ) {
        return await actionFileManage(msg, intent)
    }

    // todo事项相关
    // * list-todo
    // * add-todo
    // * mark-todo
    if ('list-todo' === intent.intent) {
        return await actionListTodo(msg, intent)
    }
    if ('add-todo' === intent.intent) {
        return await actionAddTodo(msg, intent)
    }
    if ('mark-todo' === intent.intent) {
        return await actionMarkTodo(msg, intent)
    }

}
