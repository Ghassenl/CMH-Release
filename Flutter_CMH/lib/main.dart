import "package:flutter/services.dart";
import "package:flutter/widgets.dart";

import "package:provider/provider.dart";

import "package:checkmyhttps/settings/settings.dart";
import "package:checkmyhttps/cmh_app.dart";

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  IAppSettings settings = await CmhAppSettings.init();

  runApp(
    ChangeNotifierProvider<IAppSettings>(
      create: (context) => settings,
      child: const CmhApp(),
    ),
  );
}
