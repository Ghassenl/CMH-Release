import "package:flutter/material.dart";
import "package:flutter/cupertino.dart";

import "package:checkmyhttps/utils/utils.dart";
import "package:checkmyhttps/services/services.dart";
import "package:checkmyhttps/config/config.dart";
import "package:checkmyhttps/l10n/l10n.dart";
import "package:checkmyhttps/settings/settings.dart";
import "package:checkmyhttps/themes/themes.dart";
import "package:checkmyhttps/widgets/widgets.dart";

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final storageService = SharedPrefsStorageService();

  late TextEditingController defaultUrl;
  late TextEditingController checkServerAddress;
  late TextEditingController checkServerFingerprint;

  bool loading = false;

  @override
  void initState() {
    super.initState();

    defaultUrl = TextEditingController(
      text: storageService.getAppDefaultUrl(),
    );
    checkServerAddress = TextEditingController(
      text: storageService.getAppCheckServerAddress(),
    );
    checkServerFingerprint = TextEditingController(
      text: storageService.getAppCheckServerFingerprint(),
    );
  }

  void handleChangeTheme(bool isDark) async {
    await storageService.setDarkTheme(isDark);

    CmhAppSettings.instance.changeTheme();
  }

  void handleLanguageChange(String? language) async {
    if (language != null) {
      await storageService.setAppLanguage(language);
      CmhAppSettings.instance.changeLanguage(language);
    }
  }

  void handleDefaultUrlChange(String value) async {
    if (value.isNotEmpty) {
      closeKeyboard();

      await storageService.setAppDefaultUrl(value);
      defaultUrl.value = defaultUrl.value.copyWith(
        text: value,
      );
    }
  }

  void handleCheckServerAddressChange(String value) async {
    if (value.isNotEmpty) {
      await storageService.setAppCheckServerAddress(value);
      checkServerAddress.value = checkServerAddress.value.copyWith(
        text: value,
      );
    }
  }

  void handleCheckServerSignatureChange(String value) async {
    if (value.isNotEmpty) {
      await storageService.setAppCheckServerFingerprint(value);
      checkServerFingerprint.value = checkServerFingerprint.value.copyWith(
        text: value,
      );
    }
  }

  void handleFingerprints() async {
    try {
      closeKeyboard();

      setState(() {
        loading = true;
      });

      final fingerprints = await VerificationService.getFingerprints(
        Uri.parse(checkServerAddress.value.text),
      );

      handleCheckServerSignatureChange(fingerprints.sha256);
      handleCheckServerAddressChange(checkServerAddress.value.text);

      if (context.mounted) {
        showSnackBar(
          AppLocalizations.of(context).newCheckServer,
          context,
        );
      }
    } on VerificationException catch (err) {
      if (context.mounted) {
        await showVerificationExceptionAlert(
          err,
          context,
        );
      }
    }

    setState(() {
      loading = false;
    });
  }

  void resetDefault() async {
    handleDefaultUrlChange(CmhConfig.defaultUrl);
    handleCheckServerAddressChange(CmhConfig.checkServerAddress);
    handleCheckServerSignatureChange(CmhConfig.checkServerFingerprint);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SettingsGroup(
          items: [
            SettingsItem(
              icon: Theme.of(context).brightness == Brightness.light
                  ? Icons.light_mode_rounded
                  : Icons.dark_mode_rounded,
              iconColor: CmhDarkTheme().data.colorScheme.background,
              iconBackgroundColor: CmhLightTheme().data.colorScheme.background,
              title: Theme.of(context).brightness == Brightness.light
                  ? CmhAppSettings.instance.l10n.lightTheme
                  : CmhAppSettings.instance.l10n.darkTheme,
              subtitle: AppLocalizations.of(context).switchTheme,
              trailing: Switch.adaptive(
                activeColor: Theme.of(context).primaryColor,
                value: Theme.of(context).brightness == Brightness.dark,
                onChanged: handleChangeTheme,
              ),
            ),
            SettingsItem(
              icon: Icons.language,
              iconColor: CmhDarkTheme().data.colorScheme.background,
              iconBackgroundColor: CmhLightTheme().data.colorScheme.background,
              title: AppLocalizations.of(context).language,
              subtitle: AppLocalizations.of(context).changeLanguage,
              trailing: DropdownButton(
                dropdownColor: Theme.of(context).colorScheme.background,
                isDense: true,
                value: CmhAppSettings.instance.getLanguageName(),
                icon: Icon(
                  Icons.arrow_forward_ios_rounded,
                  color: Theme.of(context).primaryColor,
                ),
                elevation: 16,
                style: TextStyle(
                  color: Theme.of(context).primaryColor,
                ),
                underline: const SizedBox.shrink(),
                onChanged: handleLanguageChange,
                items:
                    CmhAppSettings.instance.languages.keys.map((String value) {
                  return DropdownMenuItem(
                    value: value,
                    child: Text(
                      value,
                    ),
                  );
                }).toList(),
              ),
            ),
            SettingsItem(
              padding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 8,
              ),
              icon: Icons.link_rounded,
              iconColor: CmhDarkTheme().data.colorScheme.background,
              iconBackgroundColor: CmhLightTheme().data.colorScheme.background,
              title: AppLocalizations.of(context).defaultUrl,
              trailingSubtitle: true,
              trailing: Padding(
                padding: const EdgeInsets.only(top: 4),
                child: InputField(
                  keyboardType: TextInputType.url,
                  onSubmit: handleDefaultUrlChange,
                  controller: defaultUrl,
                ),
              ),
            ),
          ],
        ),
        SettingsGroup(
          title: AppLocalizations.of(context).checkServer,
          items: [
            SettingsItem(
              padding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 4,
              ),
              icon: CupertinoIcons.link,
              iconColor: CmhDarkTheme().data.colorScheme.background,
              iconBackgroundColor: CmhLightTheme().data.colorScheme.background,
              title: AppLocalizations.of(context).checkServerAddress,
              trailingSubtitle: true,
              trailing: Padding(
                padding: const EdgeInsets.only(top: 4),
                child: InputField(
                  withSuffix: false,
                  keyboardType: TextInputType.url,
                  controller: checkServerAddress,
                  disabled: loading,
                ),
              ),
            ),
            SettingsItem(
              padding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 4,
              ),
              icon: Icons.fingerprint,
              iconColor: CmhDarkTheme().data.colorScheme.background,
              iconBackgroundColor: CmhLightTheme().data.colorScheme.background,
              title: AppLocalizations.of(context).checkServerHash,
              trailingSubtitle: true,
              trailing: Padding(
                padding: const EdgeInsets.only(top: 4),
                child: InputField(
                  withSuffix: false,
                  keyboardType: TextInputType.text,
                  controller: checkServerFingerprint,
                  disabled: true,
                ),
              ),
            ),
          ],
        ),
        Wrap(
          crossAxisAlignment: WrapCrossAlignment.center,
          alignment: WrapAlignment.center,
          spacing: 50,
          runSpacing: 10,
          children: [
            ActionButton(
              text: AppLocalizations.of(context).getFingerprints,
              onPressed: handleFingerprints,
              loading: loading,
            ),
            ActionButton(
              text: AppLocalizations.of(context).resetDefault,
              onPressed: resetDefault,
              disabled: loading,
            ),
          ],
        ),
      ],
    );
  }
}
