var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-87975985-1']);

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.from == 'content_script') {
    chrome.tabs.captureVisibleTab(null, {}, function (image) {
      sendResponse({screenshot: image});
    });
  }
  return true;
});

chrome.browserAction.onClicked.addListener(function(tab) {
    _gaq.push(['_trackEvent', 'draw', 'clicked']);
    chrome.tabs.executeScript(tab.id, {
        file: "jquery.min.js"
    }, function() {
        if (chrome.runtime.lastError) {
            alert("Wu's Ruler does not support new tab pages or the Chrome Web Store because they are reserved by Chrome. Please try again on a different website.");
        } else {
          chrome.tabs.executeScript(null, { file: "marker.js" }, function() {})
        }
    });
    chrome.tabs.insertCSS(null, {
      file: "main.css"
    }, function() {
      if (chrome.runtime.lastError) {
        //Do nothing because error already sent, but catch error
      }
    });
});