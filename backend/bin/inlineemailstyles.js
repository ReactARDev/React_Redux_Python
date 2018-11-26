var Styliner;
try {
    Styliner = require('styliner');
} catch(e) {
    console.error('Please run "npm install styliner"');
    process.exit(1);
}
var fs = require('fs');
var basedir = '.';
var opts = {
};

var html_in;

var css = fs.readFileSync('./templates/email/complianceai.css');
var files = ['./templates/email/invite', './templates/email/confirm', './templates/email/reset', './templates/email/feedback','./templates/email/agency-summary', './templates/email/shared-folder', './templates/email/confirm-change'];

var promises = [];

var styliner = new Styliner(basedir, opts);

files.forEach(function(file) {
    try {
        html_in_raw = fs.readFileSync(file + '.html');
    } catch(e) {
        console.error('Please run the script from the jurispect_api root', e);
        process.exit(1);
    }

    html_in = html_in_raw.toString().replace('____CSS____', css);

    promises.push(
        styliner.processHTML(html_in)
        .then(function(source) {
            fs.writeFileSync(file + '-inline.html', source);
            console.log('Wrote ' + file + '-inline.html');
        })
    );

});

Promise.all(promises)
.then(function() {
    console.log('Completed');
});
