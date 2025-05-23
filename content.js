// バックグラウンドスクリプトからのメッセージをリッスン
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'showAlert') {
    alert(message.message);
  }
}); 