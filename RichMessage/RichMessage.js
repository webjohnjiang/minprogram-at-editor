
// RichMessage 类。维护了一个与input输入框文本一致的，但结构更丰富的数据结构，RichMessage可以通过 renderRichMessage 转换出普通文本字符串。
const MessageBox = require('./MessageBox');

class RichMessage {
    constructor(options) {
        options = options || {};
        this._msgBox = new MessageBox();
    }

    doInput(inputInfo) {
        const { keyCode } = inputInfo;
        // 做下判断，防止鼠标或手机键盘移开时触发的input事件(keyCode是undefined)
        if (isNaN(keyCode)) return Promise.resolve(inputInfo);
        if (keyCode == 8) {
            return this.removeOneCharactor(inputInfo);
        }
        else {
            return this.typeOneCharactor(inputInfo);
        }
    }

    // 新增字符(可能是删除并新增)
    typeOneCharactor({ value, cursor }) {
        // 若是新增一个字符，则直接在该位置添加字符；若是选中了一些文字再输入，则先删除再新增。
        const nowCharPos = cursor - 1;
        let nowCharactor = value.substr(nowCharPos, 1);
        const lastInputLength = this._msgBox.print().length;
        const deleteLength = lastInputLength - value.length + 1; // 看看新增字符时是否有删除字符
        const multiAddLength = value.length - lastInputLength; // 看看新增字符时是否是多个一起添加

        if (multiAddLength > 0){
            // 一次性输入了多个字符，此时要重置 nowCharactor
            nowCharactor = value.substr(cursor - multiAddLength, multiAddLength);
        }
        else if (deleteLength > 0) {
            const deleteStartPos = nowCharPos;
            const deleteEndPos = nowCharPos + deleteLength - 1;
            this._msgBox.deleteCharactor(deleteStartPos, deleteEndPos);
        }
        return this._msgBox.addCharactor(nowCharPos, nowCharactor); // 返回 promise，resolve msgBox的print结果
    }

    // 删除字符
    removeOneCharactor({ value, cursor, keyCode }) {
        return new Promise(resolve => {
            const startDeletePos = cursor;
            const lastInputLength = this._msgBox.print().length;
            const endDeletePos = startDeletePos + (lastInputLength - value.length) - 1;
            this._msgBox.deleteCharactor(startDeletePos, endDeletePos); // 左包含右包含
            resolve(this._msgBox.print());
        });
    }

    // 转成后台pb结构
    transformToProto() {
        return this._msgBox.toProto();
    }

}

module.exports = RichMessage;
