import "package:checkmyhttps/assets/assets.dart";
import "package:checkmyhttps/l10n/l10n.dart";
import "package:flutter/cupertino.dart";

import "package:checkmyhttps/services/services.dart";
import "package:checkmyhttps/widgets/widgets.dart";

Future<T?> showAlert<T>({
  required BuildContext context,
  required Alert alert,
}) async {
  return showCupertinoDialog<T>(
    context: context,
    barrierDismissible: true,
    builder: (buildContext) => alert,
  );
}

Future<T?> showVerificationExceptionAlert<T>(
  VerificationException exception,
  BuildContext context,
) async {
  return showAlert(
    context: context,
    alert: Alert(
      image: () {
        switch (exception.type) {
          case VerificationExceptionType.warning:
            return const AssetImage(CmhAssets.warningLogo);
          case VerificationExceptionType.invalid:
            return const AssetImage(CmhAssets.invalidLogo);
          case VerificationExceptionType.unknown:
            return const AssetImage(CmhAssets.unknownLogo);
          default:
            return const AssetImage(CmhAssets.unknownLogo);
        }
      }(),
      subtitle: () {
        switch (exception.cause) {
          case VerificationExceptionCause.danger:
            return AppLocalizations.of(context).danger;
          case VerificationExceptionCause.alertOnUnicodeIdnDomainNames:
            return AppLocalizations.of(context).alertOnUnicodeIdnDomainNames;
          case VerificationExceptionCause.noHttps:
            return AppLocalizations.of(context).noHttps;
          case VerificationExceptionCause.platformNotSupported:
            return AppLocalizations.of(context).platformNotSupported;
          case VerificationExceptionCause.serverUnreachable:
            return AppLocalizations.of(context).serverUnreachable;
          case VerificationExceptionCause.sslPeerUnverified:
            return AppLocalizations.of(context).sslPeerUnverified;
          case VerificationExceptionCause.serverUnknown:
            return AppLocalizations.of(context).serverUnknown;
          case VerificationExceptionCause.sslPinning:
            return AppLocalizations.of(context).sslPinning;
          case VerificationExceptionCause.notURL:
            return AppLocalizations.of(context).notURL;
          default:
            return null;
        }
      }(),
    ),
  );
}

void hideAlert() {
  if (NavigationService.navigatorKey.currentContext != null) {
    return NavigationService().pop();
  }
}
