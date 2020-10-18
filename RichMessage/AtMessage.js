const TextMessage = require('./TextMessage');

class AtMessage {
    constructor(data) {
        this.type = 'at';
        this.data = data;
    }

    _getRenderText() {
        let str = '';
        const data = this.data;
        if (data && data.name) {
            str = ` @${data.name} `;
        }
        return str;
    }

    transformToTextMsg() {
        return new TextMessage(this.render());
    }

    render() {
        return this._getRenderText();
    }
}


module.exports = AtMessage;
