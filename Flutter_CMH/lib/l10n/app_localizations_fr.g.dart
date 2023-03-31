import 'app_localizations.g.dart';

/// The translations for French (`fr`).
class AppLocalizationsFr extends AppLocalizations {
  AppLocalizationsFr([String locale = 'fr']) : super(locale);

  @override
  String get title => 'CheckMyHTTPS';

  @override
  String get menu => 'Menu';

  @override
  String get noInternet => 'Pas de connection Internet!';

  @override
  String get lightTheme => 'Thème Clair';

  @override
  String get darkTheme => 'Thème Sombre';

  @override
  String get home => 'Accueil';

  @override
  String get intro => 'Intro';

  @override
  String get how => 'Comment';

  @override
  String get about => 'À propos';

  @override
  String get settings => 'Paramètres';

  @override
  String get switchTheme => 'Changer le Theme';

  @override
  String get language => 'Langue';

  @override
  String get changeLanguage => 'Changer la langue';

  @override
  String get defaultUrl => 'URL par défaut';

  @override
  String get checkServer => 'Vérifier le serveur';

  @override
  String get checkServerAddress => 'Vérifier l\'adresse du serveur';

  @override
  String get checkServerHash => 'Vérifier le serveur Sha256';

  @override
  String get getFingerprints => 'Obtenir des empreintes digitales';

  @override
  String get resetDefault => 'Réinitialiser par défaut';

  @override
  String get websiteUrl => 'URL de site web';

  @override
  String get check => 'Vérifier';

  @override
  String get version => 'Version';

  @override
  String get titleAbout => 'Vérifiez si votre trafic Web crypté (HTTPS) est en cours d\'interception';

  @override
  String get descriptionAbout => 'Cette application mobile vous permet de vérifier si votre trafic Web chiffré (SSL / TLS) vers des serveurs Internet sécurisés (HTTP) est en cours d\'interception.';

  @override
  String get versionApp => 'Version de l\'application';

  @override
  String get originalIdea => 'Idée originale et supervision';

  @override
  String get designDevProject => 'Conception et développement du projet CheckMyHTTPS';

  @override
  String get designDevApp => 'Conception et développement de l\'application mobile';

  @override
  String get explanation => 'Explication';

  @override
  String get howText => 'Normalement, un site Web sécurisé doit prouver son identité à votre navigateur en envoyant un certificat validé par une autorité de certificat reconnue.\nLes techniques d\'interception génèrent des certificats forgés dynamiquement afin de tromper l\'utilisateur à croire que sa connexion est sécurisée.\nCette application mobile vérifie que le certificat reçu est le bon.\nCette application comparera que le certificat reçu par le client (1) d\'un site Web HTTPS visité correspond au certificat vu par un serveur de contrôle distant * (2), garantissant qu\'aucune interception n\'a lieu.\nS\'ils sont différents, votre connexion pourrait être écoutée!Cela nous permet de prouver l\'interception.';

  @override
  String defaultServer(String defaultServerAddress) {
    return 'Ce serveur est par défaut « $defaultServerAddress ». Vous pouvez installer votre propre serveur (voir la documentation sur CheckMyHTTPS Github).';
  }

  @override
  String get howImageTitle => 'Voici comment fonctionne CheckMyhttps:';

  @override
  String get howImageLegend => 'Voici ce qui se passe lorsque CheckMyHTTPS vérifie votre connexion HTTPS (https://facebook.com)';

  @override
  String get next => 'Suivant';

  @override
  String get previous => 'Précédent';

  @override
  String get close => 'Fermer';

  @override
  String get introTitle1 => 'introduction';

  @override
  String get intro1 => 'Cette application vérifie si votre connexion est sécurisée lorsque vous fournissez l\'URL d\'un site Web';

  @override
  String get introTitle2 => 'Partager';

  @override
  String get intro2 => 'Vous pouvez également lancer l\'application à partir de votre navigateur Web (Chrome, Firefox) en cliquant sur Partager ...';

  @override
  String get introTitle3 => 'Les paramètres du serveur';

  @override
  String get intro3 => 'Si vous souhaitez modifier le serveur de vérification, veuillez consulter la documentation dans le github de CheckMyhttps';

  @override
  String get noHttps => 'Ce n\'est pas un site HTTPS (vérifiez l\'URL)';

  @override
  String get serverUnreachable => 'Serveur injoignable...';

  @override
  String get danger => 'Votre connexion est peut-être sur-écoute...';

  @override
  String get alertOnUnicodeIdnDomainNames => 'Le nom de domaine est internationalisé et votre navigateur l\'affiche en Unicode';

  @override
  String get sslPeerUnverified => 'Le nom du domaine n\'est pas le même que sur le certificat.';

  @override
  String get platformNotSupported => 'Applications basées sur le navigateur non prises en charge';

  @override
  String get newCheckServer => 'Le nouveau serveur de vérification a été enregistré';

  @override
  String get privateIp => 'Nous ne pouvons pas joindre cette IP via notre serveur de test (IP privée).';

  @override
  String get serverUnknown => 'Serveur inconnu ...';

  @override
  String get sslPinning => 'Le serveur de vérification requêté est différent. Votre connexion est peut-être sur-écoute ...';

  @override
  String get secureConnection => 'Votre connexion HTTPS est sécurisée.';

  @override
  String get notURL => 'Ce n\'est pas un URL.';
}
