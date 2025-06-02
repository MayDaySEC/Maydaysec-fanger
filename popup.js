document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const urlInput = document.getElementById('urlInput');
  const outputUrl = document.getElementById('outputUrl');
  const defangButton = document.getElementById('defangButton');
  const fangButton = document.getElementById('fangButton');
  const copyButton = document.getElementById('copyButton');
  const clearButton = document.getElementById('clearButton');
  const statusMessage = document.getElementById('statusMessage');
  const singleMode = document.getElementById('singleMode');
  const batchMode = document.getElementById('batchMode');
  const singleUrlSection = document.getElementById('singleUrlSection');
  const batchUrlSection = document.getElementById('batchUrlSection');
  const batchInput = document.getElementById('batchInput');
  const batchOutput = document.getElementById('batchOutput');
  const batchDefangButton = document.getElementById('batchDefangButton');
  const batchFangButton = document.getElementById('batchFangButton');

  // Theme handling
  function updateTheme() {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.classList.toggle('dark-mode', isDarkMode);
  }

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme);
  
  // Initial theme setup
  updateTheme();

  // Mode switching
  function switchMode(mode) {
    singleMode.classList.toggle('active', mode === 'single');
    batchMode.classList.toggle('active', mode === 'batch');
    singleUrlSection.style.display = mode === 'single' ? 'block' : 'none';
    batchUrlSection.style.display = mode === 'batch' ? 'block' : 'none';
  }

  singleMode.addEventListener('click', () => switchMode('single'));
  batchMode.addEventListener('click', () => switchMode('batch'));

  function showStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message ' + (isError ? 'error' : 'success');
    setTimeout(() => {
      statusMessage.className = 'status-message';
    }, 3000);
  }

  function setLoading(button, isLoading) {
    button.classList.toggle('loading', isLoading);
    button.disabled = isLoading;
  }

  function isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  function defangUrl(url) {
    return url
      .replace(/\./g, '[.]')
      .replace(/:/g, '[:]')
      .replace(/\/\//g, ':\\u200B/')
      .replace(/@/g, '[at]');
  }

  function fangUrl(url) {
    return url
      .replace(/\[\.\]/g, '.')
      .replace(/\[:\]/g, ':')
      .replace(/\\u200B/g, '')
      .replace(/\[at\]/g, '@');
  }

  async function processUrl(action, url) {
    if (!url) {
      showStatus('Please enter a URL', true);
      return null;
    }
    if (!isValidUrl(url)) {
      showStatus('Invalid URL format', true);
      return null;
    }

    try {
      return action === 'defang' ? defangUrl(url) : fangUrl(url);
    } catch (error) {
      showStatus(`Error: ${error.message}`, true);
      return null;
    }
  }

  async function processBatch(action) {
    const urls = batchInput.value.trim().split('\n').filter(url => url.trim());
    if (urls.length === 0) {
      showStatus('Please enter at least one URL', true);
      return;
    }

    setLoading(action === 'defang' ? batchDefangButton : batchFangButton, true);
    
    try {
      const results = [];
      for (const url of urls) {
        const result = await processUrl(action, url.trim());
        if (result) {
          results.push(result);
        }
      }
      batchOutput.value = results.join('\n');
      showStatus(`Processed ${results.length} URLs successfully!`);
    } finally {
      setLoading(action === 'defang' ? batchDefangButton : batchFangButton, false);
    }
  }

  // Single URL processing
  async function handleSingleUrl(action) {
    const url = urlInput.value.trim();
    setLoading(action === 'defang' ? defangButton : fangButton, true);
    
    try {
      const result = await processUrl(action, url);
      if (result) {
        outputUrl.value = result;
        showStatus(`URL ${action}ed successfully!`);
      }
    } finally {
      setLoading(action === 'defang' ? defangButton : fangButton, false);
    }
  }

  defangButton.addEventListener('click', () => handleSingleUrl('defang'));
  fangButton.addEventListener('click', () => handleSingleUrl('fang'));
  batchDefangButton.addEventListener('click', () => processBatch('defang'));
  batchFangButton.addEventListener('click', () => processBatch('fang'));

  // Copy functionality
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showStatus('Copied to clipboard!');
    } catch (error) {
      showStatus('Failed to copy to clipboard', true);
    }
  }

  copyButton.addEventListener('click', async function() {
    const isBatchMode = batchMode.classList.contains('active');
    const text = isBatchMode ? batchOutput.value : outputUrl.value;
    
    if (!text) {
      showStatus('No content to copy', true);
      return;
    }
    
    setLoading(copyButton, true);
    await copyToClipboard(text);
    setLoading(copyButton, false);
  });

  // Clear functionality
  clearButton.addEventListener('click', function() {
    const isBatchMode = batchMode.classList.contains('active');
    if (isBatchMode) {
      batchInput.value = '';
      batchOutput.value = '';
    } else {
      urlInput.value = '';
      outputUrl.value = '';
    }
    showStatus('Cleared all fields');
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const isBatchMode = batchMode.classList.contains('active');
        if (isBatchMode) {
          processBatch('defang');
        } else {
          handleSingleUrl('defang');
        }
      }
    }
  });
});
