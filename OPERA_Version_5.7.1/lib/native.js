/**
 * @file Native messaging manager.
 * @author CheckMyHTTPS's team
 * @license GPL-3.0
 */

CMH.native = {
  appName: 'checkmyhttps',
}

/**
 * @type {object}
 * Connection to native application.
 */
CMH.native.port = null

/**
 * @type {object}
 * Connection to native application for testing.
 */
CMH.native.portTesting = null

/**
 * @type {object}
 * Information about native application.
 */
CMH.native.nativeAppInfo = {
  connected: false,
  version: null,
  filepath: null
}

/**
 * @type {string}
 * Minimum required version of native application.
 */
CMH.native.minimumAppVersion = '1.2.0'

/**
 * @name connect
 * @function
 * Connect to the native application.
 */
CMH.native.connect = () => {
  CMH.native.port = chrome.runtime.connectNative(CMH.native.appName)

  const listener_ping = CMH.native.port.onMessage.addListener((response) => {
    if (response.action === 'PONG') {
      CMH.native.port.onMessage.removeListener(listener_ping)
      CMH.native.nativeAppInfo.connected = true
      CMH.native.nativeAppInfo.version = response.version
      CMH.native.nativeAppInfo.filepath = response.filepath

      // Check native application version
      if (CMH.common.compareVersion(CMH.native.nativeAppInfo.version, CMH.native.minimumAppVersion) < 0) {
        CMH.native.nativeAppInfo.connected = false
        CMH.native.port.disconnect()
        CMH.native.port = null
        return
      }
    }
  })

  CMH.native.port.postMessage({
    action: 'PING',
  })

  CMH.native.port.onDisconnect.addListener((p) => {
    CMH.native.nativeAppInfo.connected = false
    CMH.native.port = null
    let reason = ''
    if (chrome.runtime.lastError !== null) {
      reason += ' (' + chrome.runtime.lastError.message + ')'
    }
    console.log('Native disconnected' + reason)
    CMH.native.port = null
  })
}

/**
 * @name testConnection
 * @function
 * @returns {Promise}
 * Test connection to the native application.
 */
CMH.native.testConnection = () => {
  return new Promise((resolve, reject) => {
    if (CMH.native.portTesting !== null) {
      return resolve(null)
    }

    CMH.native.portTesting = chrome.runtime.connectNative(CMH.native.appName)
    CMH.native.portTesting.onDisconnect.addListener((p) => {
      let reason = ''
      if (chrome.runtime.lastError !== null) {
        reason += ' (' + chrome.runtime.lastError.message + ')'
      }
      console.log('Native (testing) disconnected' + reason)

      CMH.native.portTesting = null
      if (typeof timeout !== 'undefined') {
        clearTimeout(timeout)
      }
      return resolve({ res: false })
    })

    if (CMH.native.portTesting === null) {
      return resolve({ res: false })
    }

    const listener = (response) => {
      if (response.action === 'PONG') {
        clearTimeout(timeout)
        CMH.native.portTesting.onMessage.removeListener(listener)
        CMH.native.portTesting.disconnect()
        CMH.native.portTesting = null

        return resolve({ res: true, response })
      }
    }

    CMH.native.portTesting.onMessage.addListener(listener)

    CMH.native.portTesting.postMessage({ action: 'PING' })

    const timeout = setTimeout(() => {
      CMH.native.portTesting = null
      return resolve({ res: false })
    }, 5000)
  })
}

/**
 * @name postMessageAndWaitResponse
 * @function
 * @param {object} request        - Request request
 * @returns {Promise}
 * .
 */
CMH.native.postMessageAndWaitResponse = async (request) => {
  let response = null;
  const controller = new AbortController()

  await chrome.runtime.sendNativeMessage(CMH.native.appName, request, (res) => {
    response = res;
    controller.abort();
  });

  await CMH.common.delay(5000, controller.signal).then(() => {
    console.log('Finished sleeping');
  }, err => {
    if (!controller.signal.aborted) throw err;
    if (err.name != "AbortError") throw err;
  });

  return response;
}

if (!CMH.common.isWebExtTlsApiSupported()) {
  try {
    CMH.native.connect();
  } catch (err) {
    console.error(err)
  }
}
