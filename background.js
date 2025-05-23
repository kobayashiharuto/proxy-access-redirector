// デフォルトのルールを設定
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['rules', 'autoRedirect'], (result) => {
    if (!result.rules) {
      const defaultRules = [
        {
          originalHost: 'dl.acm.org',
          proxyHost: 'dl-acm-org.waseda.idm.oclc.org',
          enabled: true
        },
        {
          originalHost: 'ieeexplore.ieee.org',
          proxyHost: 'ieeexplore-ieee-org.waseda.idm.oclc.org',
          enabled: true
        }
      ];
      chrome.storage.sync.set({ rules: defaultRules });
    }
    if (result.autoRedirect === undefined) {
      chrome.storage.sync.set({ autoRedirect: true });
    }
  });

  // コンテキストメニューを作成
  chrome.contextMenus.create({
    id: 'redirectToProxy',
    title: 'プロキシ経由でアクセス',
    contexts: ['link', 'page']
  });
});

// コンテキストメニューがクリックされたときの処理
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'redirectToProxy') {
    const url = info.linkUrl || info.pageUrl;
    if (url) {
      convertUrl(url).then(proxyUrl => {
        if (proxyUrl) {
          chrome.tabs.update(tab.id, { url: proxyUrl });
        } else {
          // 変換できない場合のアラート
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            chrome.scripting.executeScript({
              target: { tabId: activeTab.id },
              func: (message) => {
                alert(message);
              },
              args: ['このURL用の有効な変換ルールが見つかりませんでした。']
            }).catch(() => {
              // スクリプトの実行に失敗した場合（例：chrome:// ページなど）
              console.error('アラートを表示できませんでした。');
            });
          });
        }
      });
    }
  }
});

// URLを変換する関数
async function convertUrl(url) {
  try {
    const urlObj = new URL(url);
    const result = await chrome.storage.sync.get('rules');
    const rules = result.rules || [];
    
    const rule = rules.find(r => 
      r.enabled && 
      urlObj.hostname === r.originalHost
    );

    if (rule) {
      const proxyUrl = new URL(url);
      proxyUrl.hostname = rule.proxyHost;
      return proxyUrl.toString();
    }
  } catch (error) {
    console.error('URL変換エラー:', error);
  }
  return null;
}

// 自動リダイレクトの処理
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // メインフレームのナビゲーションのみを処理
  if (details.frameId !== 0) return;

  // 自動リダイレクトが有効かチェック
  const result = await chrome.storage.sync.get('autoRedirect');
  if (!result.autoRedirect) return;

  // リダイレクトループを防ぐため、すでにプロキシ経由のURLかチェック
  const url = details.url;
  const result2 = await chrome.storage.sync.get('rules');
  const rules = result2.rules || [];
  const isAlreadyProxy = rules.some(rule => url.includes(rule.proxyHost));
  if (isAlreadyProxy) return;

  // URLを変換
  const proxyUrl = await convertUrl(url);
  if (proxyUrl) {
    chrome.tabs.update(details.tabId, { url: proxyUrl });
  }
}, { url: [{ schemes: ['http', 'https'] }] });

// 拡張機能のアイコンがクリックされた時の処理
chrome.action.onClicked.addListener((tab) => {
  chrome.runtime.openOptionsPage();
}); 