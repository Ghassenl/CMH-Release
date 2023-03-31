import "dart:async";
import "dart:io";

import "package:flutter/material.dart";

import "package:checkmyhttps/assets/assets.dart";
import "package:checkmyhttps/l10n/l10n.dart";
import "package:checkmyhttps/utils/utils.dart";
import "package:checkmyhttps/widgets/widgets.dart";
import "package:checkmyhttps/services/services.dart";

import "package:receive_sharing_intent/receive_sharing_intent.dart";

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final storageService = SharedPrefsStorageService();

  late TextEditingController defaultUrl;
  StreamSubscription? _intentDataStreamSubscription;

  bool loading = false;

  @override
  void initState() {
    super.initState();

    defaultUrl = TextEditingController(
      text: storageService.getAppDefaultUrl(),
    );

    if (Platform.isAndroid) {
      _intentDataStreamSubscription =
          ReceiveSharingIntent.getTextStream().listen((value) {
        if (value.isNotEmpty) {
          defaultUrl.value = defaultUrl.value.copyWith(
            text: value,
          );
        }
      });

      ReceiveSharingIntent.getInitialText().then((value) {
        if (value != null && value.isNotEmpty) {
          defaultUrl.value = defaultUrl.value.copyWith(
            text: value,
          );
        }
      });
    }
  }

  void handleUrlCheck([String? url]) async {
    closeKeyboard();

    var checkUrl = url ?? defaultUrl.value.text;

    if (checkUrl.isNotEmpty &&
        RegExp(r"(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@\-\/]))?")
            .allMatches(checkUrl)
            .isNotEmpty) {
      try {
        setState(() {
          loading = true;
        });

        var isValidUrl = await isCheckableUrl(checkUrl);
        if (isValidUrl) {
          Fingerprints? dataCert;
          VerificationException? dataCertException;
          CheckServerFingerprints? checkServerData;

          try {
            dataCert = await VerificationService.getFingerprints(
              Uri.parse(checkUrl),
            );
          } on VerificationException catch (err) {
            dataCertException = err;
            debugPrint("ERROR(dataCertException): $dataCertException");
          } catch (err) {
            debugPrint("ERROR(dataCert): $err");
          }

          try {
            checkServerData =
                await VerificationService.getFingerprintsFromCheckServer(
              apiBaseUrl:
                  Uri.parse(storageService.getAppCheckServerAddress()!).host,
              host: Uri.parse(checkUrl).host,
              port: Uri.parse(checkUrl).port.toString(),
              ip: dataCert?.ip,
            );
          } catch (err) {
            debugPrint("ERROR(checkServerData): $err");
          }

          if (dataCertException?.cause == VerificationExceptionCause.danger &&
              checkServerData?.apiInfo["error"] == "HOST_UNREACHABLE") {
            dataCertException = const VerificationException(
              type: VerificationExceptionType.warning,
              cause: VerificationExceptionCause.serverUnreachable,
            );
          } else if (dataCert == null &&
              checkServerData?.apiInfo["error"] == "HOST_UNREACHABLE") {
            dataCertException = const VerificationException(
              type: VerificationExceptionType.warning,
              cause: VerificationExceptionCause.serverUnreachable,
            );
          } else if (dataCert == null &&
              checkServerData?.apiInfo["error"] == "UNKNOWN_HOST") {
            dataCertException = const VerificationException(
              type: VerificationExceptionType.warning,
              cause: VerificationExceptionCause.serverUnknown,
            );
          } else if (checkServerData == null) {
            dataCertException = const VerificationException(
              type: VerificationExceptionType.warning,
              cause: VerificationExceptionCause.serverUnreachable,
            );
          }

          if (checkServerData?.sha256 !=
              storageService.getAppCheckServerFingerprint()) {
            dataCertException = const VerificationException(
              type: VerificationExceptionType.invalid,
              cause: VerificationExceptionCause.sslPinning,
            );
          }

          if (dataCert?.sha256 != checkServerData?.sha256 &&
              checkServerData?.apiInfo?["issuer"] == null) {
            dataCertException = const VerificationException(
              type: VerificationExceptionType.invalid,
              cause: VerificationExceptionCause.danger,
            );
          }

          if (context.mounted) {
            if (dataCertException != null) {
              showVerificationExceptionAlert(
                dataCertException,
                context,
              );
            } else {
              showAlert(
                context: context,
                alert: Alert(
                  image: const AssetImage(CmhAssets.validLogo),
                  subtitle: AppLocalizations.of(context).secureConnection,
                ),
              );
            }
          }
        }
      } finally {
        setState(() {
          loading = false;
        });
      }
    } else {
      if (context.mounted) {
        showVerificationExceptionAlert(
          const VerificationException(
            type: VerificationExceptionType.warning,
            cause: VerificationExceptionCause.notURL,
          ),
          context,
        );
      }
    }
  }

  void handleDefaultUrl() async {
    closeKeyboard();

    defaultUrl.value = defaultUrl.value.copyWith(
      text: storageService.getAppDefaultUrl(),
    );
  }

  Future<bool> isCheckableUrl(String urlString) async {
    var url = Uri.parse(urlString);

    if (url.scheme != "https") {
      if (context.mounted) {
        await showAlert(
          context: context,
          alert: Alert(
            image: const AssetImage(CmhAssets.unknownLogo),
            subtitle: AppLocalizations.of(context).noHttps,
          ),
        );

        return false;
      }
    }

    if (RegExp(
            r"((127\.)|(10\.)|(172\.1[6-9]\.)|(172\.2[0-9]\.)|(172\.3[0-1]\.)|(192\.168\.))+[0-9\.]+")
        .allMatches(url.host)
        .isNotEmpty) {
      if (context.mounted) {
        await showAlert(
          context: context,
          alert: Alert(
            image: const AssetImage(CmhAssets.unknownLogo),
            subtitle: AppLocalizations.of(context).privateIp,
          ),
        );

        return false;
      }
    }

    return true;
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Column(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: [
        Wrap(
          crossAxisAlignment: WrapCrossAlignment.center,
          alignment: WrapAlignment.center,
          spacing: 50,
          runSpacing: 10,
          children: [
            ColorFiltered(
              colorFilter: ColorFilter.mode(
                Theme.of(context).brightness == Brightness.dark
                    ? Colors.white
                    : Colors.black,
                BlendMode.srcATop,
              ),
              child: Image(
                image: const AssetImage(CmhAssets.logoEsiea),
                width: size.width / 3,
                height: size.height / 6,
                fit: BoxFit.contain,
              ),
            ),
            ColorFiltered(
              colorFilter: ColorFilter.mode(
                Theme.of(context).brightness == Brightness.dark
                    ? Colors.white
                    : Colors.black,
                BlendMode.srcATop,
              ),
              child: Image(
                image: const AssetImage(CmhAssets.logoCns),
                width: size.width / 3,
                height: size.height / 6,
                fit: BoxFit.contain,
              ),
            ),
          ],
        ),
        Image(
          image: const AssetImage(CmhAssets.logo),
          width: size.width / 4,
          fit: BoxFit.contain,
        ),
        SettingsItem(
          title: AppLocalizations.of(context).websiteUrl,
          trailingSubtitle: true,
          trailing: Padding(
            padding: const EdgeInsets.only(
              top: 8,
              bottom: 20,
            ),
            child: InputField(
              disabled: loading,
              maxHeight: 60,
              keyboardType: TextInputType.url,
              withSuffix: false,
              onSubmit: handleUrlCheck,
              controller: defaultUrl,
            ),
          ),
        ),
        Wrap(
          crossAxisAlignment: WrapCrossAlignment.center,
          alignment: WrapAlignment.center,
          spacing: 50,
          runSpacing: 10,
          children: [
            ActionButton(
              text: AppLocalizations.of(context).defaultUrl,
              onPressed: handleDefaultUrl,
              backgroundColor: lighten(
                color: Theme.of(context).primaryColor,
                percentage: 30,
              ),
              textColor: Colors.black,
              disabled: loading,
            ),
            ActionButton(
              text: AppLocalizations.of(context).check,
              onPressed: handleUrlCheck,
              loading: loading,
            ),
          ],
        ),
      ],
    );
  }

  @override
  void dispose() {
    _intentDataStreamSubscription?.cancel();
    super.dispose();
  }
}
