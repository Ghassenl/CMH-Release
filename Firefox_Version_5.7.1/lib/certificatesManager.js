/**
 * @file Certificates manager.
 * @author CheckMyHTTPS's team
 * @license GPL-3.0
 */

CMH.certificatesManager = {}

/**
 * @name getCertUrl
 * @function
 * @param {string}  urlTested              - URL to check
 * @param {boolean} [httpHeadMethod=false] - Use HTTP HEAD method
 * Get the certificate of an URL.
 */
CMH.certificatesManager.getCertUrl = async (urlTested, httpHeadMethod = false) => {
  let response = null
  let response_data = null
  let cert = null
  let retry = null
  const controller = new AbortController();

  const listener = async (details) => {
    browser.webRequest.onHeadersReceived.removeListener(listener)

    const securityInfo = await browser.webRequest.getSecurityInfo(details.requestId, { certificateChain: true })
    if (securityInfo.state === 'secure' || securityInfo.state === 'weak') {
      cert = CMH.certificatesManager.formatCertificate(securityInfo.certificates)
    }

    controller.abort();
  }

  browser.webRequest.onHeadersReceived.addListener(listener,
    { urls: [urlTested], types: ['xmlhttprequest'] },
    ['blocking']
  )

  try {
    if (httpHeadMethod) {
      fetchInit = { method: 'HEAD', mode: 'no-cors' }
    } else {
      fetchInit = {}
    }
    try {
      response = await fetch(urlTested, fetchInit)
      if (response.type === "opaque" || response.type === "opaqueredirect") {
        return { isRedirect: true };
      }
    } catch (err) {
      if (!retry) {
        retry = true;
        response = await fetch(urlTested, { ...fetchInit, mode: 'cors' });
      }
    }

    await CMH.common.delay(5000, controller.signal).then(() => {
      console.log('Finished sleeping');
    }, err => {
      if (!controller.signal.aborted) throw err;
      if (err.name != "AbortError") throw err;
    });

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      response_data = await response.json()
    } else {
      response_data = await response.text()
    }
  } catch (e) {
    console.error(e)
  }

  return { data: response_data, cert: cert, response: response }
}

/**
 * @name getCertTab
 * @function
 * @param {object} tab - Tab to check
 * Get the certificate of a tab.
 */
CMH.certificatesManager.getCertTab = async (tab) => {
  let cert = CMH.tabsManager.getTabCertificate(tab.id)
  if ((cert === null) && (true /* Allow check from an independant request */)) {
    // Get certificate from a new request
    const requestUrl = await CMH.certificatesManager.getCertUrl(tab.url, true)
    cert = requestUrl.cert
  }
  return cert
}

/**
 * @name formatCertificate
 * @function
 * @param {object} certificateChain - Certificate chain unformatted
 * @param {number} [iteration]      - Certificate chain unformatted
 * @returns {object} - certificate chain formatted
 * Format a certificate.
 */
CMH.certificatesManager.formatCertificate = (certificateChain, iteration) => {
  if (certificateChain.length === 0) {
    return null
  }
  if (typeof iteration === 'undefined') {
    iteration = 0
  }

  let certificateFormatted = {
    fingerprints: {
      sha256: certificateChain[iteration].fingerprint.sha256.replace(/:/g, '').toUpperCase()
    }
  }

  if ((certificateChain.length - 1) > iteration) {
    certificateFormatted.issuer = CMH.certificatesManager.formatCertificate(certificateChain, iteration + 1)
  }

  return certificateFormatted
}