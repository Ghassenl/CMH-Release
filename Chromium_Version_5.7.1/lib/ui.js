/**
 * @file UI manager.
 * @author CheckMyHTTPS's team
 * @license GPL-3.0
 */

CMH.ui = {}

/**
 * @name init
 * @function
 * Initialize user interface.
 */
CMH.ui.init = () => {
  chrome.browserAction.setTitle({ title: chrome.i18n.getMessage('__clickToCheck__') })

  CMH.ui.setStatus(CMH.common.status.UNKNOWN)

  chrome.browserAction.onClicked.addListener((tab) => {
    CMH.certificatesChecker.checkTab(tab, !CMH.options.settings.disableNotifications)
  })
}

/**
 * @name setStatus
 * @function
 * @param {number} status - Tab check status
 * @param {number} tabId  - Tab ID
 * Set status of the action button.
 */
CMH.ui.setStatus = (status, tabId) => {
  if (CMH.common.isDesktopPlatform()) {
    let details = { path: `./images/${CMH.common.statusCode[status]}.png` }
    if ((typeof tabId !== 'undefined') && (tabId !== null)) {
      details.tabId = tabId
    }
    chrome.browserAction.setIcon(details)
    chrome.browserAction.setTitle({title: chrome.i18n.getMessage(`__${CMH.common.statusCode[status]}__`)})
  } else {
    let details = { title: 'CheckMyHTTPS (' + chrome.i18n.getMessage(`__${CMH.common.statusCode[status]}__`) + ')' }
    if ((typeof tabId !== 'undefined') && (tabId !== null)) {
      details.tabId = tabId
    }
    chrome.browserAction.setTitle(details)
  }
}

/**
 * @name openOptionsPageListener
 * @function
 * Open the options page if the user clicks on a notification concerned with it.
 * For now, only the "Invalid Public Key" notification redirects to this page.
 */
CMH.ui.openOptionsPageListener = () => {
  if (CMH.ui.openOptionsPage === 1) {
    chrome.runtime.openOptionsPage()
  }
}

/**
 * @name showNotification
 * @function
 * @param {string} message - Message
 * @param {object} options - Options
 * Show a notification.
 */
CMH.ui.showNotification = (message, options) => {
  CMH.ui.openOptionsPage = 0
  let notificationOptions = {
    type:     'basic',
    iconUrl:  chrome.runtime.getURL('./images/icon.png'),
    title:    chrome.i18n.getMessage('__alertTitle__'),
    message:  message,
    priority: 1
  }
  if (typeof options !== 'undefined') {
    for (option of ['title', 'message', 'priority']) {
      if (options.hasOwnProperty(option)) {
        notificationOptions[option] = options[option]
      }
    }
    if (options.hasOwnProperty('openOptionsPage') && options['openOptionsPage'] === 1)
      CMH.ui.openOptionsPage = 1
  }

  chrome.notifications.create(new Date().getTime().toString(), notificationOptions)

  // Listener to open the options page, if the user clicks on a corresponding notification (Ex: "Invalid Public Key")
  chrome.notifications.onClicked.addListener(CMH.ui.openOptionsPageListener)
}

// Initialize UI when the current platform is detected
(() => {
  interval = setInterval(() => {
    if (typeof CMH.common.isDesktopPlatform() !== 'undefined') {
      clearInterval(interval)

      CMH.ui.init()
    }
  }, 10)
})()
