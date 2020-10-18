const TextMessage = require('./TextMessage');
const AtMessage = require('./AtMessage');
const apiAdapter = require('../../utils/apiAdpter');

class MessageBox {
    constructor() {
        this._msgs = [];
    }

    // 向pos位置增加普通文本字符
    addCharactor(pos, char) {
        // 准备要add的消息
        const getNewMsg = this._getNewMsg(char);
        return getNewMsg.then(newMsg => {
            // 找到要放置的位置
            let countPos = 0;
            let findedMsg = null;
            let findedMsgIndex = -1;
            for (let i = 0, len = this._msgs.length; i < len; i++) {
                const msg = this._msgs[i];
                const msgRenderLen = msg.render().length;
                if ((pos >= countPos) && (pos <= (countPos + msgRenderLen - 1))) {
                    // 要操作的位置正好处于该消息结构中
                    findedMsg = msg;
                    findedMsgIndex = i;
                    break;
                }
                countPos += msgRenderLen;
            }

            if (findedMsg) {
                // 找到了消息msg，则把新msg塞到该msg结构里
                this._mergeMsg(findedMsgIndex, newMsg, pos - countPos);
            }
            else {
                // 没找到消息块，那就是放到box末尾新增
                this._msgs.push(newMsg);
            }
            // 消息碎片整理--即把同类型消息合并(例如两个挨着的textmessage则用一个表示即可)
            this._defragmentation();
            return this.print();
        });
    }

    // 删除start到end间的字符(包含end自身)
    deleteCharactor(start, end) {
        const findedMsgIndex = [];
        const findedMsgPos = [];

        let countPosStart = 0;
        for (let i = 0, len = this._msgs.length; i < len; i++) {
            const msg = this._msgs[i];
            const msgRenderLen = msg.render().length;
            const countPosEnd = (countPosStart + msgRenderLen) - 1;
            if (end >= countPosStart && start <= countPosEnd) {
                findedMsgIndex.push(i);
                // 找出此msg里的交集坐标
                const msgPosStart = Math.max(countPosStart, start);
                const msgPosEnd = Math.min(countPosEnd, end);
                findedMsgPos.push({
                    startPos: msgPosStart - countPosStart,
                    endPos: msgPosEnd - countPosStart
                });
            }
            countPosStart += msgRenderLen;
        }
        // 对找到的msg依次进行删除的操作 (若是at信息，则整个都删掉；若是普通字符，则只删对应坐标的字符；若删除后整个msg变空了，则在碎片整理时移除)
        if (findedMsgIndex && findedMsgIndex.length > 0) {
            findedMsgIndex.forEach((findedIndex, index) => {
                const msg = this._msgs[findedIndex];
                if (msg.type === 'text') {
                    const deletePos = findedMsgPos[index];
                    msg.removeChars(deletePos.startPos, deletePos.endPos);
                }
                if (msg.type === 'at') {
                    this._msgs.splice(findedIndex, 1);
                }
            });
        }
        this._defragmentation();
    }

    // 输出当前所有 msg 结构转为可视字符串后的完整字符串
    print() {
        let str = '';
        str = this._msgs.reduce((last, cur) => {
            return last += cur.render();
        }, '');
        return str;
    }

    _getNewMsg(str) {
        return new Promise(resolve => {
            if (str === '@') {
                // 选人
                setTimeout(() => {
                    const newAtMessage = new AtMessage({
                        name: 'sheldon',
                        vid: 123456789
                    });
                    resolve(newAtMessage)
   ;             }, 2000);
            }
            else {
                resolve(new TextMessage(str));
            }
        });
    }

    // 把 sourceMsg 放进 targetMsg
    // 1、当sourceMsg是文本，那么----> 则target强制转成文本类型，然后直接塞进去。
    // 2、若sourceMsg是at消息，那么------>target必然要强制转成文本，且必然要把target拆成左右2部分，然后把at作为第三部分放在中间。
    _mergeMsg(targetMsgIndex, sourceMsg, pos) {
        const targetMsg = this._msgs[targetMsgIndex];
        let resultMsg = null;
        if (sourceMsg.type === 'at') {
            resultMsg = this._mixAtMessage(targetMsg, sourceMsg, pos);
        }
        else {
            resultMsg = this._mixTextMessage(targetMsg, sourceMsg, pos);
        }
        if (resultMsg && resultMsg.length > 0) {
            this._msgs.splice(targetMsgIndex, 1, ...resultMsg);
        }
    }

    _mixAtMessage(targetMsg, sourceMsg, pos) {
        targetMsg = targetMsg.transformToTextMsg();
        const leftPart = targetMsg.render().slice(0, pos);
        const rightPart = targetMsg.render().slice(pos);
        const res = [];
        if (leftPart) res.push(new TextMessage(leftPart));
        res.push(sourceMsg);
        if (rightPart) res.push(new TextMessage(rightPart));
        return res;
    }

    _mixTextMessage(targetMsg, sourceMsg, pos) {
        targetMsg = targetMsg.transformToTextMsg();
        targetMsg.mergeMsg(sourceMsg, pos);
        return [targetMsg];
    }

    // 碎片整理。一个是把相同的text消息合并，另一个是清除内容为空的msg
    _defragmentation() {
        const newMsgs = [];
        this._msgs.forEach(msg => {
            const last = newMsgs[newMsgs.length - 1];
            if (last && last.type && last.type === 'text' && msg.type === 'text') {
                last.concatMsg(msg);
            }
            else {
                if (msg && msg.type === 'text' && msg.renderLength == 0) return;
                newMsgs.push(msg);
            }
        });
        this._msgs = newMsgs;
    }

    toProto() {
        const msgs = this._msgs.map(item => {
            if (item.type === 'at') {
                return {
                    type: 5,
                    content: {
                        at: {
                            vid: item.data.vid,
                            name: item.data.name
                        }
                    }
                };
            }
            else {
                return {
                    type: 1,
                    content: {
                        text: {
                            content: item.data
                        }
                    }
                };
            }
        });
        return {
            msg: msgs
        };
    }
}


module.exports = MessageBox;
