import {
    recognizeDateTime,
    Culture
} from "@microsoft/recognizers-text-suite";
import moment from 'moment'
import { v4 as uuidv4 } from 'uuid'
import { addData } from "../search/index.js";

export async function plainText(msg, intent) {
    const text = intent.text
    const m = text.match(/(.*)#([\S]+?)[#| ](.*)/)
    if (m) {
        const path = `wechaty/${intent.contactId}`
        const name =  path + '/' + moment().format('YYYY-MM-DD_HH:mm:ss') + `_${m[2]}.txt`
        const meta = {
            name,
            fileType: `${m[2]}`,
            contactId: intent.contactId.toString(),
            path,
            title: '',
            content: m[1] + m[3],
            tags: ["text", m[2]],
            date: '',
            user: msg.talker().payload,
            room: !!intent.room,
            url: '',
            filesize: 0,
            createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
            fileid: uuidv4(),
        }
        await addData(meta)
        return m[2]
    }
    const path = `wechaty/${intent.contactId}`
    // const name =  path + '/' + moment().format('YYYY-MM-DD_HH:mm:ss') + `_${m[2]}.txt`
    const meta = {
        name: '',
        fileType: '',
        contactId: intent.contactId.toString(),
        path,
        title: '',
        content: '',
        tags: ["text"],
        date: '',
        user: msg.talker().payload,
        room: !!intent.room,
        url: '',
        filesize: 0,
        createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
        fileid: uuidv4(),
    }
    let rec
    rec = recognizeDateTime(text, Culture.Chinese)
    if (rec.length) {
        meta.fileType = '备忘'
        // const name =  path + '/' + moment().format('YYYY-MM-DD_HH:mm:ss') + `_备忘.txt`

        return '备忘'
    }
    return ''
}