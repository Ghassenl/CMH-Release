abstract class IStorageService {
  bool getAppFirstRun();
  String? getAppDefaultUrl();
  String? getAppCheckServerAddress();
  String? getAppCheckServerFingerprint();
  bool isDarkTheme();
  String? getAppLanguage();

  Future<bool>? setAppFirstRun(bool value);
  Future<bool>? setAppDefaultUrl(String value);
  Future<bool>? setAppCheckServerAddress(String value);
  Future<bool>? setAppCheckServerFingerprint(String value);
  Future<bool>? setAppLanguage(String value);
  Future<bool>? setDarkTheme(bool isDarkTheme);

  Future<bool>? deleteAppFirstRun();
  Future<bool>? deleteAppDefaultUrl();
  Future<bool>? deleteAppCheckServerAddress();
  Future<bool>? deleteAppCheckServerFingerprint();
  Future<bool>? deleteAppLanguage();
  Future<bool>? deleteAppTheme();
  Future<bool>? deleteAppSettings();
}
