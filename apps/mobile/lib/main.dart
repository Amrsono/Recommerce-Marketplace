import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'features/product_submission/presentation/product_submission_wizard.dart';
import 'core/theme/theme.dart';

void main() {
  runApp(
    const ProviderScope(
      child: LotsitemsApp(),
    ),
  );
}

class LotsitemsApp extends StatelessWidget {
  const LotsitemsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Lotsitems',
      theme: LotsitemsTheme.lightTheme,
      darkTheme: LotsitemsTheme.darkTheme,
      themeMode: ThemeMode.system,
      home: const ProductSubmissionWizard(),
    );
  }
}
