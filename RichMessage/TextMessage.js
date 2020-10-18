class TextMessage {
    constructor(str) {
        this.type = 'text';
        this.data = str;
    }

    // 在特定的位置放入一个 msg 对象
    mergeMsg(msg, pos) {
        if (!msg) return;
        if (!msg.data) return;
        this.data = this.data.slice(0, pos) + msg.data + this.data.slice(pos);
    }

    // 连接一个msg
    concatMsg(msg) {
        this.data = this.data + msg.data;
    }

    removeChars(start, end) {
        this.data = this.data.slice(0, start) + this.data.slice(end + 1);
    }

    transformToTextMsg() {
        return this;
    }

    render() {
        return this.data;
    }

}


module.exports = TextMessage;
