const fs = require('fs');
const JSZip = require('jszip');

fs.readFile('./public/mandateform/Digital DD Form.docx', function(err, data) {
    if (err) throw err;
    JSZip.loadAsync(data).then(function(zip) {
        return zip.file("word/document.xml").async("string");
    }).then(function (text) {
        // Strip out XML tags to just see the text
        const cleanText = text.replace(/<[^>]+>/g, '');
        console.log(cleanText);
    });
});