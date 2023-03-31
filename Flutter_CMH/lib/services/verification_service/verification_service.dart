import "dart:convert";
import "dart:io";

import "package:flutter/foundation.dart";
import "package:convert/convert.dart";
import "package:crypto/crypto.dart";

class Fingerprints {
  final String? ip;
  final String sha256;
  final dynamic response;

  const Fingerprints({
    required this.ip,
    required this.sha256,
    required this.response,
  });

  @override
  String toString() {
    return "\n{sha256: $sha256,\nip: $ip,\nresponse: $response,\n}\n";
  }
}

class CheckServerFingerprints {
  final String? sha256;
  final dynamic apiInfo;

  const CheckServerFingerprints({
    required this.sha256,
    required this.apiInfo,
  });

  @override
  String toString() {
    return "\n{sha256: $sha256,\napiInfo: $apiInfo,\n}\n";
  }
}

enum VerificationExceptionType {
  invalid,
  unknown,
  warning,
}

enum VerificationExceptionCause {
  platformNotSupported,
  noHttps,
  serverUnreachable,
  danger,
  alertOnUnicodeIdnDomainNames,
  sslPeerUnverified,
  unknown,
  serverUnknown,
  sslPinning,
  notURL,
}

class VerificationException implements Exception {
  final VerificationExceptionType type;
  final VerificationExceptionCause cause;

  const VerificationException({
    required this.type,
    required this.cause,
  });

  @override
  String toString() {
    return "\n{type: ${type.name},\ncause: ${cause.name}\n,}\n";
  }
}

class VerificationService {
  static Future<Fingerprints> _getFingerprints(
    Uri url, {
    bool? withResponse,
  }) async {
    try {
      if (kIsWeb == true) {
        throw const VerificationException(
          type: VerificationExceptionType.warning,
          cause: VerificationExceptionCause.platformNotSupported,
        );
      }

      if (url.scheme.toUpperCase() != "HTTPS") {
        throw const VerificationException(
          type: VerificationExceptionType.warning,
          cause: VerificationExceptionCause.noHttps,
        );
      }

      HttpClient client = HttpClient();
      dynamic response;
      String? ip;

      HttpClientRequest httpsConnectionRequest = await (withResponse == true
          ? client.getUrl(url)
          : client.openUrl(
              "HEAD",
              url,
            ));

      HttpClientResponse httpsConnection =
          await httpsConnectionRequest.done.timeout(
        const Duration(milliseconds: 5000),
        onTimeout: () {
          return httpsConnectionRequest.close();
        },
      );

      if (withResponse == true) {
        final contents = StringBuffer();
        await for (var data in httpsConnection.transform(utf8.decoder)) {
          contents.write(data);
        }
        response = json.decode(contents.toString());
      }

      List<int>? cert = httpsConnection.certificate?.der.toList();
      Digest? mdSHA256 = cert != null ? sha256.convert(cert) : null;

      await InternetAddress.lookup(url.host).then(
        (addressList) {
          ip = addressList
              .firstWhere(
                (address) => address.type == InternetAddressType.IPv4,
              )
              .address;
        },
      );

      client.close();

      if (mdSHA256 == null) {
        throw const VerificationException(
          type: VerificationExceptionType.warning,
          cause: VerificationExceptionCause.noHttps,
        );
      }

      return Fingerprints(
        sha256: hex.encode(mdSHA256.bytes).toUpperCase(),
        ip: ip,
        response: response,
      );
    } on HandshakeException catch (e) {
      if (e.message.toUpperCase().contains("HANDSHAKE ERROR")) {
        throw const VerificationException(
          type: VerificationExceptionType.warning,
          cause: VerificationExceptionCause.serverUnreachable,
        );
      } else {
        throw const VerificationException(
          type: VerificationExceptionType.invalid,
          cause: VerificationExceptionCause.danger,
        );
      }
    } on FormatException catch (err) {
      debugPrint("$err");
      throw const VerificationException(
        type: VerificationExceptionType.warning,
        cause: VerificationExceptionCause.alertOnUnicodeIdnDomainNames,
      );
    } on SocketException catch (e) {
      if (e.message.toUpperCase().contains("FAILED HOST LOOKUP")) {
        throw const VerificationException(
          type: VerificationExceptionType.warning,
          cause: VerificationExceptionCause.serverUnreachable,
        );
      }

      rethrow;
    } on CertificateException {
      throw const VerificationException(
        type: VerificationExceptionType.unknown,
        cause: VerificationExceptionCause.sslPeerUnverified,
      );
    } catch (e) {
      throw const VerificationException(
        type: VerificationExceptionType.unknown,
        cause: VerificationExceptionCause.unknown,
      );
    }
  }

  static Future<Fingerprints> getFingerprints(Uri url) {
    return _getFingerprints(url);
  }

  static Future<CheckServerFingerprints> getFingerprintsFromCheckServer({
    required String apiBaseUrl,
    required String host,
    required String port,
    required String? ip,
  }) async {
    final requestFingerprints = await _getFingerprints(
      Uri(
        scheme: "https",
        host: apiBaseUrl,
        path: "api.php",
        queryParameters: {
          "host": host,
          "port": port,
          "ip": ip,
        },
      ),
      withResponse: true,
    );

    return CheckServerFingerprints(
      sha256: requestFingerprints.sha256,
      apiInfo: requestFingerprints.response,
    );
  }
}
