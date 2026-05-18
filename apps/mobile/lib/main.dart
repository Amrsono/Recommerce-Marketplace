import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'features/product_submission/presentation/product_submission_wizard.dart';
import 'core/theme/theme.dart';

void main() {
  runApp(
    const ProviderScope(
      child: Used4CashApp(),
    ),
  );
}

class Used4CashApp extends StatelessWidget {
  const Used4CashApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'used4cash',
      theme: Used4CashTheme.lightTheme,
      darkTheme: Used4CashTheme.darkTheme,
      themeMode: ThemeMode.system,
      home: const ProductSubmissionWizard(),
    );
  }
}
