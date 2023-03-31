#!/usr/bin/env python

###################################
# CheckMyHTTPS native application #
###################################

import sys
import os
import platform
import json
import traceback
import struct
import socket
import ssl
import hashlib
import re
if sys.version_info.major >= 3: # Python 3
    import http.client as httplib
    import urllib.request as urllib2
    from urllib.parse import urlparse
else:                           # Python 2
    import httplib
    import urllib2
    from urlparse import urlparse

VERSION = '1.2.0'

ADDON_IDS = {
    'firefox': 'info@checkmyhttps.net',
    'chrome':  'chrome-extension://jbnodnfpdcegpnflleanllmiihkinkio/',
    'opera':   'chrome-extension://fmbmhajicpidghmjmgkafenlmjeoogje/'
}

# Check that OpenSSL version support TLSv1.2
if (ssl.OPENSSL_VERSION_INFO <= (1, 0, 1)):
    print('You need to update your OpenSSL version.')
    sys.exit(1)

# Check that OpenSSL version support SNI
if not ssl.HAS_SNI:
    print('Your OpenSSL does not support SNI.')
    sys.exit(1)

def install():
    """ Install agent to browsers """
    system = platform.system()

    if system == 'Windows':
        if sys.version_info.major >= 3: # Python 3
            import winreg
        else:                           # Python 2
            import _winreg as winreg

    currentFile = os.path.realpath(__file__)
    currentDir  = os.path.dirname(currentFile)


    manifest = {
        'name': 'checkmyhttps',
        'description': 'CheckMyHTTPS',
        'path': currentFile,
        'type': 'stdio',
    }

    if system == 'Windows':
        manifest['path'] = filename = os.path.join(currentDir, 'checkmyhttps_win.bat')

        try:
            with open(filename, 'w') as file:
                file.write('@echo off\r\ncall "%s" "%s" %%*\r\n' % (sys.executable, currentFile))
        except Exception as e:
            print('Cannot create file "%s"' % filename)
            print('  ' + str(e))

        locations = {
            'firefox': os.path.join('Software', 'Mozilla', 'NativeMessagingHosts'),         # Firefox
            'chrome':  os.path.join('Software', 'Google', 'Chrome', 'NativeMessagingHosts') # Chrome/Opera
        }
    else:
        homePath = os.getenv('HOME')
        os.chmod(currentFile, 0o755) # Set execute permission
        if system == 'Linux':
            locations = {
                'chrome':   os.path.join(homePath, '.config', 'google-chrome', 'NativeMessagingHosts'),
                'chromium': os.path.join(homePath, '.config', 'chromium', 'NativeMessagingHosts'),
                'firefox':  os.path.join(homePath, '.mozilla', 'native-messaging-hosts'),
            }
        else: # macos
            locations = {
                'chrome':   os.path.join(homePath, 'Library', 'Application Support', 'Google', 'Chrome', 'NativeMessagingHosts'),
                'chromium': os.path.join(homePath, 'Library', 'Application Support', 'Chromium', 'NativeMessagingHosts'),
                'firefox':  os.path.join(homePath, 'Library', 'Application Support', 'Mozilla', 'NativeMessagingHosts'),
            }

    for browser, location in locations.items():
        if system != 'Windows':
            if not os.path.exists(os.path.dirname(location)):
                continue
            if not os.path.exists(location):
                os.mkdir(location)

        browser_manifest = manifest.copy()
        if browser == 'firefox':
            browser_manifest['allowed_extensions'] = [ ADDON_IDS['firefox'] ]
        elif browser == 'chrome':
            browser_manifest['allowed_origins']    = [ ADDON_IDS['chrome'], ADDON_IDS['opera'] ]
        else:
            browser_manifest['allowed_origins']    = [ ADDON_IDS['chrome'] ]

        try:
            if system == 'Windows':
                filename = os.path.join(currentDir, 'checkmyhttps_%s.json' % browser)
            else:
                filename = os.path.join(location, 'checkmyhttps.json')
            with open(filename, 'w') as file:
                file.write(
                    json.dumps(browser_manifest, indent=2, separators=(',', ': '), sort_keys=True).replace('  ', '\t') + '\n'
                )
        except Exception as e:
            print('Cannot create file "%s"' % filename)
            print('  ' + str(e))

        if system == 'Windows':
            try:
                key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, location)
                winreg.SetValue(key, 'checkmyhttps', winreg.REG_SZ, filename)
            except Exception as e:
                print('Cannot create registry key "%s"' % location)
                print('  ' + str(e))

def uninstall():
    """ Uninstall agent to browsers """
    system = platform.system()

    if system == 'Windows':
        if sys.version_info.major >= 3: # Python 3
            import winreg
        else:                           # Python 2
            import _winreg as winreg

    currentFile = os.path.realpath(__file__)
    currentDir  = os.path.dirname(currentFile)


    manifest = {
        'name': 'checkmyhttps',
        'description': 'CheckMyHTTPS',
        'path': currentFile,
        'type': 'stdio',
    }

    if system == 'Windows':
        manifest['path'] = filename = os.path.join(currentDir, 'checkmyhttps_win.bat')

        try:
            if os.path.exists(filename):
                os.remove(filename)
        except Exception as e:
            print('Cannot delete file "%s"' % filename)
            print('  ' + str(e))

        locations = {
            'firefox': os.path.join('Software', 'Mozilla', 'NativeMessagingHosts', 'checkmyhttps'),         # Firefox
            'chrome':  os.path.join('Software', 'Google', 'Chrome', 'NativeMessagingHosts', 'checkmyhttps') # Chrome/Opera
        }
    elif system == 'Linux':
        homePath = os.getenv('HOME')
        locations = {
            'firefox':  os.path.join(homePath, '.mozilla', 'native-messaging-hosts'),
            'chrome':   os.path.join(homePath, '.config', 'google-chrome', 'NativeMessagingHosts'),
            'chromium': os.path.join(homePath, '.config', 'chromium', 'NativeMessagingHosts')
        }
    else:
        homePath = os.getenv('HOME')
        locations = {
            'firefox':  os.path.join(homePath, 'Library', 'Application Support', 'Mozilla', 'NativeMessagingHosts'),
            'chrome':   os.path.join(homePath, 'Library', 'Application Support', 'Google', 'Chrome', 'NativeMessagingHosts'),
            'chromium': os.path.join(homePath, 'Library', 'Application Support', 'Chromium', 'NativeMessagingHosts')
        }

    for browser, location in locations.items():
        if system != 'Windows':
            if not os.path.exists(os.path.dirname(location)):
                continue

        try:
            if system == 'Windows':
                filename = os.path.join(currentDir, 'checkmyhttps_%s.json' % browser)
            else:
                filename = os.path.join(location, 'checkmyhttps.json')
            if os.path.exists(filename):
                os.remove(filename)
        except Exception as e:
            print('Cannot delete file "%s"' % filename)
            print('  ' + str(e))

        if system == 'Windows':
            try:
                key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, '', 0, winreg.KEY_ALL_ACCESS)
                winreg.DeleteKey(key, location)
            except Exception as e:
                print('Cannot delete registry key "%s"' % os.path.join('HKEY_CURRENT_USER', location))
                print('  ' + str(e))

def getMessage():
    """ Receive (and decode) message from the browser """
    if sys.version_info.major >= 3: # Python 3
        stdin = sys.stdin.buffer
    else:                           # Python 2
        stdin = sys.stdin
    rawLength = stdin.read(4)
    if len(rawLength) == 0:
        sys.exit(0)
    messageLength = struct.unpack('@I', rawLength)[0]
    message = stdin.read(messageLength)
    if sys.version_info.major >= 3: # Python 3
        message = message.decode('utf-8')
    return json.loads(message)

def sendMessage(messageContent):
    """ Send (and encode) message to the browser """
    if sys.version_info.major >= 3: # Python 3
        stdout = sys.stdout.buffer
    else:                           # Python 2
        stdout = sys.stdout
    encodedContent = json.dumps(messageContent)
    if sys.version_info.major >= 3: # Python 3
        encodedContent = encodedContent.encode('utf-8')
    encodedLength  = struct.pack('@I', len(encodedContent))
    encodedMessage = {
        'length':  encodedLength,
        'content': encodedContent
    }

    stdout.write(encodedMessage['length'])
    stdout.write(encodedMessage['content'])
    stdout.flush()

def printUsage():
    print('Usage: '+sys.argv[0]+' [install|uninstall|version|check <url>]')

def get_certificate(host, port=443, timeout=10):
    context = ssl.create_default_context()
    conn = socket.create_connection((host, port), timeout)
    sock = context.wrap_socket(conn, server_hostname=host)
    sock.settimeout(timeout)
    try:
        der_cert = sock.getpeercert(True)
    finally:
        sock.close()
    return hashlib.sha256(der_cert).hexdigest().upper()

if __name__ == '__main__':
    if len(sys.argv) == 1:
        printUsage()
    elif (ADDON_IDS['firefox'] in sys.argv) or (ADDON_IDS['chrome'] in sys.argv) or (ADDON_IDS['opera'] in sys.argv) or (sys.argv[1].endswith('/checkmyhttps.json')):
        while True:
            try:
                receivedMessage = getMessage()
                if receivedMessage['action'] == 'CHECK':
                    certificateSha256 = get_certificate(receivedMessage['host'])
                    sendMessage({ 'sha256': certificateSha256, 'tabId': receivedMessage['tabId'] })
                elif receivedMessage['action'] == 'PING':
                    sendMessage({ 'action': 'PONG', 'version': VERSION, 'filepath': os.path.realpath(__file__) })
            except Exception as e:
                sendMessage({ 'action': 'error', 'error': str(e) })
    else:
        if len(sys.argv) >= 2:
            try:
                if sys.argv[1] == 'install':
                    install()
                elif sys.argv[1] == 'uninstall':
                    uninstall()
                elif sys.argv[1] == 'version':
                    print(VERSION)
            except Exception as e:
                print('Error: ' + str(e))
