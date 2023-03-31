/**
 * @file Common file.
 * @author CheckMyHTTPS's team
 * @license GPL-3.0
 */

const title_nativeApp = document.querySelector('.settings-nativeapp > h2')
const btn_testNativeConnection = document.getElementById('test-native-connection')
const nativeAppSisconnectedInstructions = document.getElementById('native-app-disconnected-instructions')
const div_nativeApp = document.querySelector('.settings-nativeapp')
const box_checkLinks = document.querySelector('input[name="checkAllLinks"]')
const lbl_checkLinks = document.querySelector('label[for="checkAllLinks"]')
const div_nativeAppCon = document.querySelector('div.native-app-connected')
const div_nativeAppDiscon = document.querySelector('div.native-app-disconnected')
const div_messageNativeAppCon = document.querySelector('p.message-nativeappcon')
const div_messageNativeAppDiscon = document.querySelector('p.message-nativeappdiscon')
const lbl_nativeAppInstallNote1 = document.querySelector('.native-app-disconnected > ol > li:nth-of-type(1)')
const lbl_nativeAppInstallNote2 = document.querySelector('.native-app-disconnected > ol > li:nth-of-type(2)')
const lbl_nativeAppInstallNote3 = document.querySelector('.native-app-disconnected > ol > li:nth-of-type(3)')
const lbl_nativeAppInstallNote4 = document.querySelector('.native-app-disconnected > ol > li:nth-of-type(4)')
const page_title = document.querySelector('body > h1')
const title_general = document.querySelector('div.form > h2:nth-of-type(1)')
const title_checkServer = document.querySelector('div.form > h2:nth-of-type(2)')
const box_pageLoad = document.querySelector('input[name="checkOnPageLoad"]')
const lbl_pageLoad = document.querySelector('label[for="checkOnPageLoad"]')
const box_alertIDNDomains = document.querySelector('input[name="alertOnUnicodeIDNDomainNames"]')
const lbl_alertIDNDomains = document.querySelector('label[for="alertOnUnicodeIDNDomainNames"]')
const box_notifications = document.querySelector('input[name="disableNotifications"]')
const lbl_notifications = document.querySelector('label[for="disableNotifications"]')
const txt_server = document.querySelector('input[name="api_server"]')
const lbl_server = document.querySelector('label[for="api_server"]')
const txt_publicKey = document.querySelector('textarea[name="api_publicKey"]')
const lbl_publicKey = document.querySelector('label[for="api_publicKey"]')
const btn_save = document.getElementById('form-submit')
const btn_restoreDefault = document.getElementById('restore-default')
const btn_getPublicKey = document.getElementById('get-publicKey')
const div_messageCheckServer = document.querySelector('p.message-checkserver')

try {
  const backgroundPage = chrome.extension.getBackgroundPage();

  const CMH = backgroundPage.CMH

  let lastDomainSaved = ''


  div_nativeApp.style.display = ''

  setTimeout(() => {
    if (CMH.native.nativeAppInfo.connected) {
      div_messageNativeAppCon.dataset.type = 'success'
      div_messageNativeAppCon.textContent = chrome.i18n.getMessage('__nativeAppInstallAt__', [CMH.native.nativeAppInfo.filepath, CMH.native.nativeAppInfo.version])

      div_nativeAppDiscon.style.display = 'none'
      div_nativeAppCon.style.display = ''
    } else if ((CMH.native.nativeAppInfo.version !== null) && (CMH.common.compareVersion(CMH.native.nativeAppInfo.version, CMH.native.minimumAppVersion) < 0)) {
      div_messageNativeAppDiscon.dataset.type = 'error'
      div_messageNativeAppDiscon.innerHTML = chrome.i18n.getMessage('__nativeAppNeedToBeUpdated__')

      div_nativeAppCon.style.display = 'none'
      div_nativeAppDiscon.style.display = ''
    } else {
      div_messageNativeAppDiscon.dataset.type = 'error'
      div_messageNativeAppDiscon.innerHTML = chrome.i18n.getMessage('__nativeAppNotFoundSeeInstall__')

      div_nativeAppCon.style.display = 'none'
      div_nativeAppDiscon.style.display = ''
    }
  }, 500)

  document.title = chrome.i18n.getMessage('__checkMyHttpsSettings__')
  page_title.textContent = chrome.i18n.getMessage('__checkMyHttpsSettings__')
  title_general.textContent = chrome.i18n.getMessage('__general__')
  title_nativeApp.textContent = chrome.i18n.getMessage('__nativeAppSettings__')
  title_checkServer.textContent = chrome.i18n.getMessage('__checkServerSettings__')
  lbl_checkLinks.textContent = chrome.i18n.getMessage('__checkAllLinks__')
  lbl_pageLoad.textContent = chrome.i18n.getMessage('__checkOnPageLoad__')
  lbl_alertIDNDomains.textContent = chrome.i18n.getMessage('__alertOnUnicodeIDNDomainNames__')
  lbl_notifications.textContent = chrome.i18n.getMessage('__disableNotifications__')
  lbl_server.textContent = chrome.i18n.getMessage('__checkServerAddress__')
  lbl_publicKey.textContent = chrome.i18n.getMessage('__checkServerPublicKey__')
  btn_save.textContent = chrome.i18n.getMessage('__save__')
  btn_restoreDefault.textContent = chrome.i18n.getMessage('__restoreDefault__')
  btn_getPublicKey.textContent = chrome.i18n.getMessage('__getPublicKey__')
  btn_testNativeConnection.textContent = chrome.i18n.getMessage('__testNativeConnection__')
  lbl_nativeAppInstallNote1.innerHTML = chrome.i18n.getMessage('__nativeAppInstallPython__')
  lbl_nativeAppInstallNote2.innerHTML = chrome.i18n.getMessage('__nativeAppInstallDownloadScript__')
  lbl_nativeAppInstallNote3.innerHTML = chrome.i18n.getMessage('__nativeAppInstallInstallScript__')
  lbl_nativeAppInstallNote4.innerHTML = chrome.i18n.getMessage('__nativeAppInstallReload__')

  const lnk_nativeDownload = document.querySelector('a[data-download]')
  const lnk_reloadExtension = document.getElementById('extension-reload')

  box_pageLoad.checked = CMH.options.settings.checkOnPageLoad
  box_checkLinks.checked = CMH.options.settings.checkAllLinks
  box_alertIDNDomains.checked = CMH.options.settings.alertOnUnicodeIDNDomainNames
  box_notifications.checked = CMH.options.settings.disableNotifications
  lastDomainSaved = CMH.options.settings.checkServerUrl.match(/^https:\/\/([^:\/\s]+)/)[1]
  txt_server.value = CMH.options.settings.checkServerUrl
  txt_publicKey.value = CMH.options.settings.publicKey

  box_pageLoad.addEventListener('input', (e) => {
    try {
      chrome.storage.local.set({
        checkOnPageLoad: box_pageLoad.checked,
      }, () => {
        div_messageCheckServer.dataset.type = 'success'
        div_messageCheckServer.textContent = chrome.i18n.getMessage('__settingsSaved__')
      })
    } catch {
      div_messageCheckServer.dataset.type = 'error'
      div_messageCheckServer.textContent = 'Error!'
    }
  })

  box_checkLinks.addEventListener('input', (e) => {
    chrome.storage.local.set({
      checkAllLinks: box_checkLinks.checked,
    }).then(() => {
      div_messageCheckServer.dataset.type = 'success'
      div_messageCheckServer.textContent = browser.i18n.getMessage('__settingsSaved__')
    }, (error) => {
      div_messageCheckServer.dataset.type = 'error'
      div_messageCheckServer.textContent = 'Error!'
    })
  })

  box_alertIDNDomains.addEventListener('input', (e) => {
    try {
      chrome.storage.local.set({
        alertOnUnicodeIDNDomainNames: box_alertIDNDomains.checked,
      }, () => {
        div_messageCheckServer.dataset.type = 'success'
        div_messageCheckServer.textContent = chrome.i18n.getMessage('__settingsSaved__')
      })
    } catch {
      div_messageCheckServer.dataset.type = 'error'
      div_messageCheckServer.textContent = 'Error!'
    }
  })

  box_notifications.addEventListener('input', (e) => {
    try {
      chrome.storage.local.set({
        disableNotifications: box_notifications.checked,
      }, () => {
        div_messageCheckServer.dataset.type = 'success'
        div_messageCheckServer.textContent = chrome.i18n.getMessage('__settingsSaved__')
      })
    } catch {
      div_messageCheckServer.dataset.type = 'error'
      div_messageCheckServer.textContent = 'Error!'
    }
  })

  btn_save.addEventListener('click', async (event) => {
    btn_save.disabled = true
    div_messageCheckServer.textContent = ''
    if (txt_server.value.slice(-1) !== '/') {
      txt_server.value += '/'
    }

    const saveSettingsTochrome = () => {
      try {
        chrome.storage.local.set({
          checkServerUrl: txt_server.value,
          publicKey: txt_publicKey.value
        }, () => {
          btn_save.disabled = false
          div_messageCheckServer.dataset.type = 'success'
          div_messageCheckServer.textContent = chrome.i18n.getMessage('__settingsSaved__')
        })
      } catch {
        btn_save.disabled = false
        div_messageCheckServer.dataset.type = 'error'
        div_messageCheckServer.textContent = 'Error!'
      }
    }

    CMH.native.postMessageAndWaitResponse({
      action: 'setOptions',
      params: {
        checkServerUrl: txt_server.value,
        checkServerPublicKey: txt_publicKey.value.replace(/:/g, '').toUpperCase()
      }
    }, 'setOptionsRes').then((data) => {
      saveSettingsTochrome()
    }, (error) => {
      div_messageCheckServer.dataset.type = 'error'
      div_messageCheckServer.textContent = 'Error (' + error + ')!'
    })
  }, true)

  btn_restoreDefault.addEventListener('click', (event) => {
    const defaultCheckServer = CMH.options.defaultCheckServer
    if (defaultCheckServer !== null) {
      txt_server.value = defaultCheckServer.url
      txt_publicKey.value = defaultCheckServer.publicKey
      btn_getPublicKey.style.display = 'none'
    }
  }, true)

  btn_getPublicKey.addEventListener('click', (event) => {
    btn_getPublicKey.disabled = true
    div_messageCheckServer.textContent = ''
    if (txt_server.value.slice(-1) !== '/') {
      txt_server.value += '/'
    }

    CMH.certificatesManager.getCertUrl(txt_server.value + 'download/public_key').then((response) => {
      btn_getPublicKey.disabled = false
      if (response.data !== null) {
        txt_publicKey.value = response.data
        btn_getPublicKey.style.display = 'none'
      } else {
        div_messageCheckServer.dataset.type = 'error'
        div_messageCheckServer.textContent = chrome.i18n.getMessage('__publicKeyUnreachable__')
      }
    })
  }, true)

  btn_testNativeConnection.addEventListener('click', (event) => {
    div_messageNativeAppDiscon.dataset.type = ''
    div_messageNativeAppDiscon.innerHTML = ''
    CMH.native.testConnection().then((data) => {
      if (data.res === true) {
        if (CMH.common.compareVersion(data.response.version, CMH.native.minimumAppVersion) < 0) {
          div_messageNativeAppDiscon.dataset.type = 'error'
          div_messageNativeAppDiscon.innerHTML = chrome.i18n.getMessage('__nativeAppNeedToBeUpdated__')
        } else {
          div_messageNativeAppDiscon.dataset.type = 'success'
          div_messageNativeAppDiscon.textContent = chrome.i18n.getMessage('__nativeAppInstallAt__', [data.response.filepath, data.response.version])
          nativeAppSisconnectedInstructions.style.display = 'none'
          btn_testNativeConnection.style.display = 'none'
          chrome.runtime.reload()
        }
      } else if (data.res === false) {
        div_messageNativeAppDiscon.dataset.type = 'error'
        div_messageNativeAppDiscon.innerHTML = chrome.i18n.getMessage('__nativeAppNotFoundSeeInstall__')
      }
    })
  }, true)

  lnk_nativeDownload.addEventListener('click', (event) => {
    const link = event.target.href
    chrome.downloads.download({
      url: link,
      saveAs: true
    })
    event.preventDefault()
  }, true)

  lnk_reloadExtension.addEventListener('click', (event) => {
    chrome.runtime.reload()
    event.preventDefault()
  }, true)

  txt_publicKey.addEventListener('blur', () => {
    txt_publicKey.value = txt_publicKey.value.replace(/:/g, '').toUpperCase()
  }, true)

  const onPublicKeyChange = () => {
    if (txt_publicKey.value.length === 0) {
      btn_getPublicKey.style.display = ''
    } else {
      btn_getPublicKey.style.display = 'none'
    }
  }

  txt_publicKey.addEventListener('keyup', onPublicKeyChange, true)

  txt_server.addEventListener('keyup', () => {
    const domainMatch = txt_server.value.match(/^https:\/\/([^:\/\s]+)/)
    if (domainMatch && (domainMatch[1] !== lastDomainSaved)) {
      txt_publicKey.value = ''
      btn_getPublicKey.style.display = ''
    }
  }, true)

  onPublicKeyChange()
  btn_save.disabled = false

  document.body.style.display = '';
}
catch (error) {
  console.error(error)
}
