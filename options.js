document.addEventListener('DOMContentLoaded', () => {
  const ruleForm = document.getElementById('ruleForm');
  const originalHostInput = document.getElementById('originalHost');
  const proxyHostInput = document.getElementById('proxyHost');
  const ruleIndexInput = document.getElementById('ruleIndex');
  const rulesTable = document.getElementById('rulesTable');
  const saveButton = document.getElementById('saveButton');
  const cancelEditButton = document.getElementById('cancelEditButton');
  const autoRedirectCheckbox = document.getElementById('autoRedirect');

  let rules = [];

  // 設定の読み込み
  function loadSettings() {
    chrome.storage.sync.get(['rules', 'autoRedirect'], (result) => {
      // 自動リダイレクトの設定を読み込む
      if (autoRedirectCheckbox) {
        autoRedirectCheckbox.checked = result.autoRedirect !== false;
      }

      // ルールの表示
      renderRules(result.rules || []);
    });
  }

  // ルールをテーブルに描画
  function renderRules(rules) {
    const tbody = rulesTable.querySelector('tbody');
    tbody.innerHTML = '';

    rules.forEach((rule, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="checkbox" class="rule-enabled" ${rule.enabled ? 'checked' : ''}></td>
        <td>${rule.originalHost}</td>
        <td>${rule.proxyHost}</td>
        <td>
          <button class="edit-button">編集</button>
          <button class="delete-button">削除</button>
        </td>
      `;

      // 有効/無効の切り替え
      const enabledCheckbox = tr.querySelector('.rule-enabled');
      enabledCheckbox.addEventListener('change', () => {
        rules[index].enabled = enabledCheckbox.checked;
        chrome.storage.sync.set({ rules });
      });

      // 編集ボタン
      const editButton = tr.querySelector('.edit-button');
      editButton.addEventListener('click', () => {
        originalHostInput.value = rule.originalHost;
        proxyHostInput.value = rule.proxyHost;
        ruleIndexInput.value = index;
        saveButton.textContent = '更新';
        cancelEditButton.style.display = 'inline-block';
      });

      // 削除ボタン
      const deleteButton = tr.querySelector('.delete-button');
      deleteButton.addEventListener('click', () => {
        if (confirm('このルールを削除してもよろしいですか？')) {
          rules.splice(index, 1);
          chrome.storage.sync.set({ rules }, () => {
            renderRules(rules);
          });
        }
      });

      tbody.appendChild(tr);
    });
  }

  // フォームの送信処理
  ruleForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const originalHost = originalHostInput.value.trim();
    const proxyHost = proxyHostInput.value.trim();
    const ruleIndex = ruleIndexInput.value;

    // ホスト名の検証
    if (!isValidHostname(originalHost) || !isValidHostname(proxyHost)) {
      alert('有効なホスト名を入力してください。');
      return;
    }

    chrome.storage.sync.get('rules', (result) => {
      const rules = result.rules || [];
      
      if (ruleIndex === '') {
        // 新規ルールの追加
        rules.push({
          originalHost,
          proxyHost,
          enabled: true
        });
      } else {
        // 既存ルールの更新
        rules[ruleIndex] = {
          originalHost,
          proxyHost,
          enabled: rules[ruleIndex].enabled
        };
      }

      chrome.storage.sync.set({ rules }, () => {
        renderRules(rules);
        resetForm();
      });
    });
  });

  // キャンセルボタンの処理
  cancelEditButton.addEventListener('click', resetForm);

  // フォームのリセット
  function resetForm() {
    ruleForm.reset();
    ruleIndexInput.value = '';
    saveButton.textContent = 'ルールを保存';
    cancelEditButton.style.display = 'none';
  }

  // ホスト名の検証
  function isValidHostname(hostname) {
    const pattern = /^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]$/;
    return pattern.test(hostname);
  }

  // 自動リダイレクトの設定を保存
  if (autoRedirectCheckbox) {
    autoRedirectCheckbox.addEventListener('change', () => {
      chrome.storage.sync.set({ autoRedirect: autoRedirectCheckbox.checked });
    });
  }

  // 初期設定の読み込み
  loadSettings();
});

// 設定を保存する関数
function saveSettings() {
  const rules = [];
  document.querySelectorAll('.rule-item').forEach(item => {
    const originalHost = item.querySelector('.original-host').value;
    const proxyHost = item.querySelector('.proxy-host').value;
    const enabled = item.querySelector('.enabled').checked;
    if (originalHost && proxyHost) {
      rules.push({ originalHost, proxyHost, enabled });
    }
  });

  const autoRedirect = document.getElementById('autoRedirect').checked;

  chrome.storage.sync.set({ rules, autoRedirect }, () => {
    showMessage('設定を保存しました');
  });
}

// メッセージを表示する関数
function showMessage(message) {
  const messageDiv = document.createElement('div');
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #28a745;
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
    z-index: 1000;
  `;
  document.body.appendChild(messageDiv);
  setTimeout(() => messageDiv.remove(), 3000);
}

// ルールを表示する関数
function displayRules(rules) {
  const ruleList = document.getElementById('ruleList');
  ruleList.innerHTML = '';
  
  rules.forEach((rule, index) => {
    const ruleItem = document.createElement('div');
    ruleItem.className = 'rule-item';
    ruleItem.innerHTML = `
      <input type="text" class="original-host" placeholder="オリジナルドメイン" value="${rule.originalHost}">
      <input type="text" class="proxy-host" placeholder="プロキシドメイン" value="${rule.proxyHost}">
      <label>
        <input type="checkbox" class="enabled" ${rule.enabled ? 'checked' : ''}>
        有効
      </label>
      <button class="delete-rule">削除</button>
    `;
    ruleList.appendChild(ruleItem);
  });

  // 削除ボタンのイベントリスナーを設定
  document.querySelectorAll('.delete-rule').forEach((button, index) => {
    button.addEventListener('click', () => {
      rules.splice(index, 1);
      displayRules(rules);
      saveSettings();
    });
  });

  // 入力フィールドの変更を監視
  document.querySelectorAll('.rule-item input').forEach(input => {
    input.addEventListener('change', saveSettings);
  });
}

// 新しいルールを追加する関数
function addNewRule() {
  const rules = [];
  document.querySelectorAll('.rule-item').forEach(item => {
    const originalHost = item.querySelector('.original-host').value;
    const proxyHost = item.querySelector('.proxy-host').value;
    const enabled = item.querySelector('.enabled').checked;
    if (originalHost && proxyHost) {
      rules.push({ originalHost, proxyHost, enabled });
    }
  });

  rules.push({
    originalHost: '',
    proxyHost: '',
    enabled: true
  });

  displayRules(rules);
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  // 設定を読み込む
  chrome.storage.sync.get(['rules', 'autoRedirect'], (result) => {
    const rules = result.rules || [];
    displayRules(rules);
    
    const autoRedirectCheckbox = document.getElementById('autoRedirect');
    autoRedirectCheckbox.checked = result.autoRedirect !== false;
    autoRedirectCheckbox.addEventListener('change', saveSettings);
  });

  // 新しいルール追加ボタンのイベントリスナー
  document.getElementById('addRule').addEventListener('click', addNewRule);
}); 