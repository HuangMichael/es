onmessage = function(message) {
    var _arguments = message.data; 
    var xhr = new XMLHttpRequest();
    xhr.open("GET", _arguments.url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) { // 4 = "loaded"
            if (xhr.status == 200) { // 200 = OK
                var windData = decodeData(xhr.response);
                postMessage({result: windData, idf: _arguments.idf});
            }else{
                postMessage({result: null, idf: _arguments.idf});
                console.log(_arguments.url+' not find');
            }
        }
    };
    xhr.send(null);
}


function decodeUTF8(bytes) {
    var charCodes = [];
    for (var i = 0; i < bytes.length;) {
        var b = bytes[i++];
        switch (b >> 4) {
            case 0xc:
            case 0xd:
                b = (b & 0x1f) << 6 | bytes[i++] & 0x3f;
                break;
            case 0xe:
                b = (b & 0x0f) << 12 | (bytes[i++] & 0x3f) << 6 | bytes[i++] & 0x3f;
                break;
            default:
                // use value as-is
        }
        charCodes.push(b);
    }
    return String.fromCharCode.apply(null, charCodes);
}

function decodeData(buffer, options) {
    var headerOnly = !!(options || {}).headerOnly;
    var i = 0;
    var view = new DataView(buffer);

    var head = decodeUTF8(new Uint8Array(buffer, i, 4)); //0-4
    i += 4; //4
    if (head !== "head") {
        throw new Error("expected 'head' but found '" + head + "'");
    }
    var length = view.getInt32(i);
    i += 4;
    var header = JSON.parse(decodeUTF8(new Uint8Array(buffer, i, length)));
    i += length;

    var block;
    var blocks = [];
    var type;
    while ((type = decodeUTF8(new Uint8Array(buffer, i, 4))) !== "tail" && !headerOnly) {
        i += 4;
        length = view.getInt32(i);
        i += 4;
        switch (type) {
            case "data":
                block = decodeDataBlock(buffer, i, length);
                break;
            default:
                throw new Error("unknown block type: " + type);
        }
        blocks.push(block);
        i += length;
    }

    return {
        header: header,
        blocks: blocks
    };
}

function decodeDataBlock(buffer, offset, length) {
    var headcodes = new Uint8Array(buffer, offset - 4, 4);
    var view = new DataView(buffer, offset, length);
    return decodePpak(new Uint8Array(buffer, offset + 16, length - 16),
        view.getInt32(0), // cols
        view.getInt32(4), // rows
        view.getInt32(8), // grids
        view.getInt32(12)); // scaleFactor
};

function decodePpak(bytes, cols, rows, grids, scaleFactor) {
    var values = new Float32Array(cols * rows * grids);
    varpackDecode(values, bytes, scaleFactor);
    return values;
};

function varpackDecode(values, bytes, scaleFactor) {
    var m = Math.pow(10, scaleFactor);
    var i = 0,
        j = 0;
    while (i < bytes.length) {
        var b = bytes[i++];
        switch (b >> 4) {
            case 0x8: // 1000
            case 0x9: // 1001
                b = b << 28 >> 28;
                break;
            case 0xa: // 1010
                b = b << 28 >> 20 | bytes[i++];
                break;
            case 0xb: // 1011
                b = b << 28 >> 12 | bytes[i++] << 8 | bytes[i++];
                break;
            case 0xc: // 1100
                b = b << 28 >> 4 | bytes[i++] << 16 | bytes[i++] << 8 | bytes[i++];
                break;
        }

        b = b === b ? b / m : 0;
        if (b == -999) {
            b = 0;
        }
        values[j++] = b;
    }
    return values;
};
