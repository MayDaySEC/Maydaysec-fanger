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
      statusMessage.textContent = '';
    }, 3000);
  }

  function setLoading(button, isLoading) {
    button.classList.toggle('loading', isLoading);
    button.disabled = isLoading;
  }

  // --- Detection helpers ---

  // IPv4: 4 groups of 1-3 digits separated by dots
  const IPV4_REGEX = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

  // IPv6: simplified check — contains colons and hex groups
  const IPV6_REGEX = /^[0-9a-fA-F:]+:[0-9a-fA-F:]+$/;

  // Defanged IPv4 with [.] separators
  const DEFANGED_IPV4_REGEX = /^(\d{1,3})\[\.\](\d{1,3})\[\.\](\d{1,3})\[\.\](\d{1,3})$/;

  function isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  function isValidIpv4(ip) {
    const m = IPV4_REGEX.exec(ip);
    if (!m) return false;
    return m.slice(1).every(octet => parseInt(octet, 10) <= 255);
  }

  function isValidIpv6(ip) {
    return IPV6_REGEX.test(ip);
  }

  function isDefangedIpv4(str) {
    const m = DEFANGED_IPV4_REGEX.exec(str);
    if (!m) return false;
    return m.slice(1).every(octet => parseInt(octet, 10) <= 255);
  }

  function looksDefanged(str) {
    return str.includes('[.]') || str.includes('[:]') || str.includes('[at]') || str.includes('[://]');
  }

  // --- Core defang/fang logic ---

  function defangUrl(url) {
    return url
      .replace(/\./g, '[.]')        // dots → [.]
      .replace(/:\/\//g, '[://]')   // :// → [://]  (must come before : replacement)
      .replace(/@/g, '[at]');       // @ → [at]
  }

  function fangUrl(url) {
    return url
      .replace(/\[at\]/g, '@')      // [at] → @
      .replace(/\[:\/\/\]/g, '://') // [://] → ://
      .replace(/\[\.\]/g, '.')      // [.] → .
      .replace(/\[:\]/g, ':');      // [:] → :  (legacy compat)
  }

  function defangIp(ip) {
    // For IPv4 and IPv6, replace dots/colons
    return ip
      .replace(/\./g, '[.]')
      .replace(/:/g, '[:]');
  }

  function fangIp(defangedIp) {
    return defangedIp
      .replace(/\[\.\]/g, '.')
      .replace(/\[:\]/g, ':');
  }

  // --- processUrl: handles URLs, raw IPs, and already-defanged strings ---

  function processUrl(action, input) {
    if (!input) {
      showStatus('Please enter a URL or IP address', true);
      return null;
    }

    try {
      if (action === 'defang') {
        // Already defanged? skip
        if (looksDefanged(input)) {
          showStatus('Input appears already defanged', true);
          return null;
        }
        // Raw IPv4?
        if (isValidIpv4(input)) return defangIp(input);
        // Raw IPv6?
        if (isValidIpv6(input)) return defangIp(input);
        // Full URL?
        if (isValidUrl(input)) return defangUrl(input);
        showStatus('Invalid URL or IP format', true);
        return null;
      } else {
        // Fang mode — accept defanged strings without strict validation
        if (looksDefanged(input) || isDefangedIpv4(input)) {
          return fangUrl(input); // fangUrl also handles [.] and [:]
        }
        // If it's already a valid URL or IP, nothing to fang
        if (isValidUrl(input) || isValidIpv4(input) || isValidIpv6(input)) {
          showStatus('Input does not appear defanged', true);
          return null;
        }
        // Try fanging anyway (loose mode for partial defanged strings)
        const fanged = fangUrl(input);
        if (fanged !== input) return fanged;
        showStatus('Nothing to fang — no defang patterns found', true);
        return null;
      }
    } catch (error) {
      showStatus(`Error: ${error.message}`, true);
      return null;
    }
  }

  async function processBatch(action) {
    const lines = batchInput.value.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) {
      showStatus('Please enter at least one URL or IP', true);
      return;
    }

    const btn = action === 'defang' ? batchDefangButton : batchFangButton;
    setLoading(btn, true);

    try {
      const results = [];
      let skipped = 0;
      for (const line of lines) {
        const result = processUrl(action, line.trim());
        if (result !== null) {
          results.push(result);
        } else {
          // Keep original line with a comment so user knows it was skipped
          results.push(`# SKIPPED: ${line.trim()}`);
          skipped++;
        }
      }
      batchOutput.value = results.join('\n');
      const successCount = lines.length - skipped;
      showStatus(`Processed ${successCount} of ${lines.length} items.${skipped > 0 ? ` ${skipped} skipped.` : ''}`);
    } finally {
      setLoading(btn, false);
    }
  }

  // Single URL/IP processing
  async function handleSingleUrl(action) {
    const input = urlInput.value.trim();
    const btn = action === 'defang' ? defangButton : fangButton;
    setLoading(btn, true);

    try {
      const result = processUrl(action, input);
      if (result !== null) {
        outputUrl.value = result;
        showStatus(`${action === 'defang' ? 'Defanged' : 'Fanged'} successfully!`);
      }
    } finally {
      setLoading(btn, false);
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
      // Fallback for environments where clipboard API is restricted
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showStatus('Copied to clipboard!');
      } catch {
        showStatus('Failed to copy to clipboard', true);
      }
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
