/**
 * @file Certificates checker.
 * @author CheckMyHTTPS's team
 * @license GPL-3.0
 */

CMH.certificatesChecker = {}

/**
 * @name isCheckableUrl
 * @function
 * @param {string}  urlTested         - URL to check
 * @param {boolean} showNotifications - Show notifications
 * @returns {boolean}
 * Check if an URL is checkable.
 */
CMH.certificatesChecker.isCheckableUrl = (urlTested, showNotifications) => {
  let protocol, host
  try {
    const url = new URL(urlTested)
    protocol = url.protocol.slice(0, -1)
    host = url.hostname
  } catch (e) {
    if (e instanceof TypeError) {
      return false
    }
  }

  if (protocol !== 'https') {
    if (showNotifications) {
      CMH.ui.showNotification(browser.i18n.getMessage('__noHttps__'))
    }
    return false
  }

  if (host.match(/^((127\.)|(10\.)|(172\.1[6-9]\.)|(172\.2[0-9]\.)|(172\.3[0-1]\.)|(192\.168\.))+[0-9\.]+$/)) { // Check private IP
    if (showNotifications) {
      CMH.ui.showNotification(browser.i18n.getMessage('__privateHost__'))
    }
    return false
  }

  return true
}

/**
 * @name getTabExternalLinks
 * @function
 * @param {object}  tab               - Tab to check
 * Get Links from DOM of a tab.
 */
getTabExternalLinks = async (tab) => {
  const externalLinks = [];
  let doc = "";
  const controller = new AbortController();

  await browser.tabs.executeScript(tab.id, {
    code: 'new XMLSerializer().serializeToString(document)'
  }, (docRes) => {
    doc = docRes[0];
    controller.abort();
  });

  await CMH.common.delay(5000, controller.signal).then(() => {
    console.log('Finished sleeping');
  }, err => {
    if (!controller.signal.aborted) throw err;
    if (err.name != "AbortError") throw err;
  });


  const matchs = (
    doc.match(/"https:\/\/[-a-zA-Z0-9.]+\.[a-zA-Z]{2,3}(?:\/(?:[^"<=]|=)*)?"/g)
    ??
    []
  )
    .map((match) => match.slice(1, match.length - 1));

  for (let match of matchs) {
    try {
      let matchURL = new URL(match);
      if (matchURL.host === new URL(tab.url).host) continue;
      externalLinks.push(matchURL.origin);
    } catch (err) {
      console.error(err);
      continue;
    }
  }

  return externalLinks.filter((link, index) => {
    return externalLinks.indexOf(link) === index;
  }).map((link) => {
    if (link[link.length - 1] !== "/") {
      link += "/";
    }
    return link;
  });
}

/**
 * @name checkTab
 * @function
 * @param {object}  tab               - Tab to check
 * @param {boolean} showNotifications - Show notifications
 * Check a tab.
 */
CMH.certificatesChecker.checkTab = async (tab, showNotifications) => {
  if (!CMH.certificatesChecker.isCheckableUrl(tab.url, showNotifications)) {
    return
  }

  const externalLinks = await getTabExternalLinks(tab);

  CMH.tabsManager.setTabStatus(tab.id, CMH.common.status.WORKING)

  if (CMH.common.isWebExtTlsApiSupported()) {
    let cert = await CMH.certificatesManager.getCertTab(tab)

    const certs = [];

    if (CMH.options.settings.checkAllLinks) {
      await Promise.all(
        externalLinks.map((externalLink) => CMH.certificatesManager.getCertUrl(externalLink, true))
      ).then((requestUrls) =>
        requestUrls.forEach((requestUrl, idx) => {
          if (requestUrl.isRedirect) {
            externalLinks.splice(idx, 1);
          } else {
            certs.push(requestUrl.cert);
          }
        })
      );
    }

    if ((cert === null) || ((CMH.options.settings.checkAllLinks) && (certs.some((cert) => cert == null)))) {
      CMH.tabsManager.setTabStatus(tab.id, CMH.common.status.UNKNOWN)
      return
    }

    let ip = CMH.tabsManager.getTabIp(tab.id)
    datas_api = await CMH.api.requestFromUrl(tab.url, ip)
    const externalLinks_datas_apis = CMH.options.settings.checkAllLinks ?
      await Promise.all(externalLinks.map((externalLink) => CMH.api.requestFromUrl(externalLink)))
      : [];

    if (datas_api.error) {
      if (datas_api.error === 'SSL') {
        CMH.tabsManager.setTabStatus(tab.id, CMH.common.status.INVALID)
        if (showNotifications) {
          CMH.ui.showNotification(browser.i18n.getMessage('__danger__'), { priority: 2 })
        }
      } else if (datas_api.error === 'PUBLIC_KEY') {
        CMH.tabsManager.setTabStatus(tab.id, CMH.common.status.UNKNOWN)
        if (showNotifications) {
          CMH.ui.showNotification(browser.i18n.getMessage('__invalidPublicKey__'), { openOptionsPage: 1 })
        }
      } else {
        CMH.tabsManager.setTabStatus(tab.id, CMH.common.status.UNKNOWN)
        if (showNotifications) {
          CMH.ui.showNotification(browser.i18n.getMessage('__serverUnreachable__'))
        }
      }
      return
    }

    if (CMH.options.settings.checkAllLinks) {
      if (externalLinks_datas_apis.some((link_datas_api) => link_datas_api.error)) {
        if (externalLinks_datas_apis.some((link_datas_api) => link_datas_api.error === 'SSL')) {
          CMH.tabsManager.setTabStatus(tab.id, CMH.common.status.INVALID)
          if (showNotifications) {
            CMH.ui.showNotification(browser.i18n.getMessage('__danger__'), { priority: 2 })
          }
        } else if (externalLinks_datas_apis.some((link_datas_api) => link_datas_api.error === 'PUBLIC_KEY')) {
          CMH.tabsManager.setTabStatus(tab.id, CMH.common.status.UNKNOWN)
          if (showNotifications) {
            CMH.ui.showNotification(browser.i18n.getMessage('__invalidPublic__'), { openOptionsPage: 1 })
          }
        } else {
          CMH.tabsManager.setTabStatus(tab.id, CMH.common.status.UNKNOWN)
          if (showNotifications) {
            CMH.ui.showNotification(browser.i18n.getMessage('__serverUnreachable__'))
          }
        }
        return
      }
    }

    const verificationRes = CMH.certificatesChecker.verifyCertificate(cert, datas_api.data)
    const externalLinksVerificationRes = CMH.options.settings.checkAllLinks ?
      certs.map((externalLinkCert, idx) =>
        CMH.certificatesChecker.verifyCertificate(externalLinkCert, externalLinks_datas_apis[idx].data)
      )
      : null;

    CMH.certificatesChecker.handleVerificationResult(verificationRes, tab.url, tab.id, showNotifications, externalLinksVerificationRes)
  }
  else
    return
}

/**
 * @name checkUrl
 * @function
 * @param {string}  urlTested         - URL to check
 * @param {boolean} showNotifications - Show notifications
 * Check an URL.
 */
CMH.certificatesChecker.checkUrl = async (urlTested, showNotifications) => {
  if (!CMH.certificatesChecker.isCheckableUrl(urlTested, showNotifications)) {
    return
  }

  if (CMH.common.isWebExtTlsApiSupported()) {
    const requestUrl = await CMH.certificatesManager.getCertUrl(urlTested, true)
    cert = requestUrl.cert
    if (cert === null) {
      return
    }

    let ip = ""
    datas_api = await CMH.api.requestFromUrl(urlTested, ip)
    if (datas_api.error) {
      if (datas_api.error === 'SSL') {
        if (showNotifications) {
          CMH.ui.showNotification(browser.i18n.getMessage('__danger__'), { priority: 2 })
        }
      }
      return
    }

    const verificationRes = CMH.certificatesChecker.verifyCertificate(cert, datas_api.data)
    CMH.certificatesChecker.handleVerificationResult(verificationRes, tab.url, tab.id, showNotifications)
  }
}

/**
 * @name verifyCertificate
 * @function
 * @param {object}  userCertificate - Certificate from the user
 * @param {object}  cmhCertificate  - Certificate from the CheckMyHTTPS server
 * @returns {string} - verification result
 * Check if the user's certificate is valid.
 */
CMH.certificatesChecker.verifyCertificate = (userCertificate, cmhCertificate) => {
  if (CMH.certificatesChecker.compareCertificateFingerprints(userCertificate, cmhCertificate)) {
    if (CMH.options.settings.alertOnUnicodeIDNDomainNames) {
      // Check if the domain name is an IDN
      const domainName = cmhCertificate.host.split(':')[0]
      const names = domainName.split('.')
      for (let name of names) {
        if (name.startsWith('xn--')) {
          return 'IDN'
        }
      }
    }
    return 'OK'
  }
  else if ((userCertificate.issuer) && (cmhCertificate.issuer) && (CMH.certificatesChecker.compareCertificateFingerprints(userCertificate.issuer, cmhCertificate.issuer))) { // Compare issuer certificate
    return 'SC'
  } else {
    return 'KO'
  }
}

/**
 * @name handleVerificationResult
 * @function
 * @param {string}  result            - Verification result
 * @param {object}  url               - URL to check
 * @param {object}  [tabId]           - Tab to check
 * @param {boolean} showNotifications - Show notifications
 * @param {string[]} externalLinksResults - Verification results of external links
 * Check if the user's certificate is valid.
 */
CMH.certificatesChecker.handleVerificationResult = (result, url, tabId, showNotifications, externalLinksResults) => {
  let resultsOfLinks = externalLinksResults ?? [result];

  if (result === 'OK' && resultsOfLinks.every((linkResult) => linkResult === 'OK')) {
    if (tabId !== null) {
      CMH.tabsManager.setTabStatus(tabId, CMH.common.status.VALID)
    }
  } else if (result === 'IDN' && resultsOfLinks.every((linkResult) => linkResult === 'IDN')) {
    if (tabId !== null) {
      CMH.tabsManager.setTabStatus(tabId, CMH.common.status.WARNING)
    }
    if (CMH.options.settings.alertOnUnicodeIDNDomainNames) {
      if (showNotifications) {
        CMH.ui.showNotification(browser.i18n.getMessage('__IDNwarning__', url))
      }
    }
  }
  else if (result === 'SC' && resultsOfLinks.every((linkResult) => linkResult === 'SC')) {
    if (tabId !== null) {
      CMH.tabsManager.setTabStatus(tabId, CMH.common.status.WARNING)
    }
    if (showNotifications) {
      CMH.ui.showNotification(browser.i18n.getMessage('__severalCertificats__'))
    }
  }
  else if (result === 'ERR' && resultsOfLinks.every((linkResult) => linkResult === 'ERR')) {
    if (tabId !== null) {
      CMH.tabsManager.setTabStatus(tabId, CMH.common.status.UNKNOWN)
    }
    if (showNotifications) {
      CMH.ui.showNotification(browser.i18n.getMessage('__serverUnreachable__'))
    }
  } else if (result === 'SSLP' && resultsOfLinks.every((linkResult) => linkResult === 'SSLP')) {
    if (tabId !== null) {
      CMH.tabsManager.setTabStatus(tabId, CMH.common.status.INVALID)
    }
    if (showNotifications) {
      CMH.ui.showNotification(browser.i18n.getMessage('__danger__'), { priority: 2 })
    }
  } else if (result === 'KO' && resultsOfLinks.every((linkResult) => linkResult === 'KO')) {
    if (tabId !== null) {
      CMH.tabsManager.setTabStatus(tabId, CMH.common.status.INVALID)
    }
    if (showNotifications) {
      CMH.ui.showNotification(browser.i18n.getMessage('__danger__'), { priority: 2 })
    }
  } else {
    if (tabId !== null) {
      CMH.tabsManager.setTabStatus(tabId, CMH.common.status.UNKNOWN)
    }
    if (showNotifications) {
      CMH.ui.showNotification(browser.i18n.getMessage('__serverUnreachable__'))
    }
  }
}

/**
 * @name compareCertificateFingerprints
 * @function
 * @param {object} userCertificate - Certificate from the user
 * @param {object} cmhCertificate  - Certificate from the server
 * @returns {boolean}
 * Compare fingerprints of two certificates.
 */
CMH.certificatesChecker.compareCertificateFingerprints = (userCertificate, cmhCertificate) => {
  return (userCertificate.fingerprints.sha256 === cmhCertificate.fingerprints.sha256)
}