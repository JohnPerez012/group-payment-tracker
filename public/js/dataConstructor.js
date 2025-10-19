// /C:/Users/Acer/Desktop/gptracker/group-payment-tracker/public/js/dataConstructor.js
// JSON file constructor utility (works in browser and Node)
// Usage:
//   const jc = new JSONFileConstructor({ app: 'GroupPayment' });
//   jc.addRecord({ user: 'Alice', amount: 10 });
//   jc.download('payments.json'); // browser
//   // or in Node: jc.saveToFile('./out/payments.json');

class JSONFileConstructor {
    constructor(initialMeta = {}, initialRecords = []) {
        this.data = {
            meta: Object.assign({}, initialMeta),
            records: Array.isArray(initialRecords) ? initialRecords.slice() : []
        };
    }

    // meta manipulation
    setMeta(keyOrObj, value) {
        if (typeof keyOrObj === 'object') {
            Object.assign(this.data.meta, keyOrObj);
        } else {
            this.data.meta[keyOrObj] = value;
        }
        return this;
    }

    getMeta(key) {
        return key ? this.data.meta[key] : Object.assign({}, this.data.meta);
    }

    // records manipulation
    addRecord(record) {
        if (record && typeof record === 'object' && !Array.isArray(record)) {
            this.data.records.push(Object.assign({}, record));
        } else {
            throw new TypeError('record must be a plain object');
        }
        return this;
    }

    updateRecord(index, patch) {
        if (index < 0 || index >= this.data.records.length) throw new RangeError('index out of range');
        if (typeof patch !== 'object' || Array.isArray(patch)) throw new TypeError('patch must be an object');
        Object.assign(this.data.records[index], patch);
        return this;
    }

    removeRecord(index) {
        if (index < 0 || index >= this.data.records.length) throw new RangeError('index out of range');
        this.data.records.splice(index, 1);
        return this;
    }

    clearRecords() {
        this.data.records = [];
        return this;
    }

    getRecords() {
        return this.data.records.slice();
    }

    // export as JSON string
    toJSON(pretty = true) {
        return pretty ? JSON.stringify(this.data, null, 2) : JSON.stringify(this.data);
    }

    // simple schema validator: schema example { fieldName: 'string' | 'number' | 'boolean' | 'object' | 'array' }
    validateRecord(record, schema = {}) {
        if (!record || typeof record !== 'object') return false;
        for (const key in schema) {
            const expected = schema[key];
            const val = record[key];
            if (expected === 'array') {
                if (!Array.isArray(val)) return false;
            } else if (expected === 'null') {
                if (val !== null) return false;
            } else if (typeof val !== expected) {
                return false;
            }
        }
        return true;
    }

    // browser download
    download(filename = 'data.json') {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            throw new Error('download() is only available in a browser environment');
        }
        const blob = new Blob([this.toJSON(true)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return this;
    }

    // Node.js file save
    async saveToFile(path, pretty = true) {
        // attempt dynamic require to avoid bundlers choking
        let fs;
        try {
            fs = typeof require === 'function' ? require('fs') : null;
        } catch (e) {
            fs = null;
        }
        if (!fs) {
            throw new Error('saveToFile() requires Node.js (fs module)');
        }
        const data = this.toJSON(pretty);
        return new Promise((resolve, reject) => {
            fs.mkdir(require('path').dirname(path), { recursive: true }, (mkErr) => {
                if (mkErr) return reject(mkErr);
                fs.writeFile(path, data, 'utf8', (err) => {
                    if (err) return reject(err);
                    resolve(path);
                });
            });
        });
    }
}

// export for both browser and Node
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JSONFileConstructor;
} else {
    window.JSONFileConstructor = JSONFileConstructor;
}