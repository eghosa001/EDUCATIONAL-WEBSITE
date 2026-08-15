import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'en.dart';

class AppLocalization {
  static const Locale defaultLocale = Locale('en');
  static const List<Locale> supportedLocales = [
    Locale('en'),
    Locale('ha'),
    Locale('yo'),
  ];

  static final Map<String, Map<String, String>> _localizedStrings = {
    'en': EnLocalizations().strings,
    'ha': HaLocalizations().strings,
    'yo': YoLocalizations().strings,
  };

  static AppLocalization of(BuildContext context) {
    return Localizations.of<AppLocalization>(context, AppLocalization)!;
  }

  String translate(String key) {
    final locale = Localizations.localeOf(context).languageCode;
    return _localizedStrings[locale]?[key] ??
        _localizedStrings['en']?[key] ??
        key;
  }

  static const LocalizationsDelegate<AppLocalization> delegate =
      _AppLocalizationDelegate();
}

class _AppLocalizationDelegate extends LocalizationsDelegate<AppLocalization> {
  const _AppLocalizationDelegate();

  @override
  Future<AppLocalization> load(Locale locale) async {
    return AppLocalization();
  }

  @override
  bool isSupported(Locale locale) =>
      ['en', 'ha', 'yo'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationDelegate old) => false;
}

extension AppLocalizationExtension on BuildContext {
  AppLocalization get l10n => AppLocalization.of(this);
  String t(String key) => AppLocalization.of(this).translate(key);
}
