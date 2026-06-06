import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'features/home/presentation/main_selection_screen.dart';
import 'core/theme/theme.dart';
import 'core/localization/translations.dart';

void main() {
  runApp(
    const ProviderScope(
      child: LotsitemsApp(),
    ),
  );
}

class LotsitemsApp extends ConsumerWidget {
  const LotsitemsApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeLocale = ref.watch(localeProvider);

    Locale flutterLocale;
    switch (activeLocale) {
      case AppLocale.en:
        flutterLocale = const Locale('en', 'US');
        break;
      case AppLocale.fr:
        flutterLocale = const Locale('fr', 'FR');
        break;
      case AppLocale.es:
        flutterLocale = const Locale('es', 'ES');
        break;
      case AppLocale.pt:
        flutterLocale = const Locale('pt', 'BR');
        break;
      case AppLocale.ar:
        flutterLocale = const Locale('ar', 'AE');
        break;
    }

    return MaterialApp(
      title: 'Lotsitems',
      theme: LotsitemsTheme.lightTheme,
      darkTheme: LotsitemsTheme.darkTheme,
      themeMode: ThemeMode.system,
      locale: flutterLocale,
      supportedLocales: const [
        Locale('en', 'US'),
        Locale('fr', 'FR'),
        Locale('es', 'ES'),
        Locale('pt', 'BR'),
        Locale('ar', 'AE'),
      ],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: const MainSelectionScreen(),
    );
  }
}
