import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

// ---------------------------------------------------------------------------
// Mock store data — replace with an API call in production
// ---------------------------------------------------------------------------
const List<Map<String, String>> kStores = [
  {
    'id': 'store-1',
    'name': 'Lotsitems — City Centre',
    'address': '14 Market Street, London, EC2V 8DY',
    'distance': '0.4 mi',
    'hours': 'Mon–Sat 9am–6pm',
  },
  {
    'id': 'store-2',
    'name': 'Lotsitems — East End',
    'address': '82 Whitechapel Rd, London, E1 1JX',
    'distance': '1.2 mi',
    'hours': 'Mon–Sat 10am–7pm',
  },
  {
    'id': 'store-3',
    'name': 'Lotsitems — South Bank',
    'address': '5 Bankside Walk, London, SE1 9PP',
    'distance': '1.9 mi',
    'hours': 'Mon–Sun 10am–6pm',
  },
  {
    'id': 'store-4',
    'name': 'Lotsitems — West End',
    'address': '201 Oxford Street, London, W1D 2LJ',
    'distance': '2.3 mi',
    'hours': 'Mon–Sat 9am–8pm',
  },
];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
class SubmissionState {
  final int currentStep;
  final String? brand;
  final String? model;
  final String? storage;
  final String? condition;
  final bool isAnalyzing;
  final double? estimatedValue;
  // Evaluation method: 'home-visit' | 'store'
  final String evaluationMethod;
  final String? selectedStoreId;
  final String? address;
  final bool acceptFee;
  final String? ticketId;
  final String? errorMessage;

  const SubmissionState({
    this.currentStep = 0,
    this.brand,
    this.model,
    this.storage,
    this.condition,
    this.isAnalyzing = false,
    this.estimatedValue,
    this.evaluationMethod = '',
    this.selectedStoreId,
    this.address,
    this.acceptFee = false,
    this.ticketId,
    this.errorMessage,
  });

  bool get needsEvaluation =>
      condition == 'Poor' || condition == 'Broken';

  Map<String, String>? get selectedStore =>
      selectedStoreId == null
          ? null
          : kStores.firstWhere(
              (s) => s['id'] == selectedStoreId,
              orElse: () => {},
            );

  SubmissionState copyWith({
    int? currentStep,
    String? brand,
    String? model,
    String? storage,
    String? condition,
    bool? isAnalyzing,
    double? estimatedValue,
    String? evaluationMethod,
    String? selectedStoreId,
    String? address,
    bool? acceptFee,
    String? ticketId,
    String? errorMessage,
  }) {
    return SubmissionState(
      currentStep: currentStep ?? this.currentStep,
      brand: brand ?? this.brand,
      model: model ?? this.model,
      storage: storage ?? this.storage,
      condition: condition ?? this.condition,
      isAnalyzing: isAnalyzing ?? this.isAnalyzing,
      estimatedValue: estimatedValue ?? this.estimatedValue,
      evaluationMethod: evaluationMethod ?? this.evaluationMethod,
      selectedStoreId: selectedStoreId ?? this.selectedStoreId,
      address: address ?? this.address,
      acceptFee: acceptFee ?? this.acceptFee,
      ticketId: ticketId ?? this.ticketId,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------
class SubmissionNotifier extends StateNotifier<SubmissionState> {
  SubmissionNotifier() : super(const SubmissionState());

  static const String _apiBase = 'http://localhost:4000/api';

  // Total wizard steps (0-indexed): 0=Device, 1=Condition, 2=Evaluation, 3=Summary
  static const int _totalSteps = 3;

  void nextStep() {
    if (state.currentStep < _totalSteps) {
      state = state.copyWith(currentStep: state.currentStep + 1);
    } else {
      _submitDevice();
    }
  }

  void previousStep() {
    if (state.currentStep > 0) {
      state = state.copyWith(currentStep: state.currentStep - 1);
    }
  }

  void updateDetails({String? brand, String? model, String? storage}) {
    state = state.copyWith(
      brand: brand ?? state.brand,
      model: model ?? state.model,
      storage: storage ?? state.storage,
    );
  }

  void updateCondition(String condition) {
    // Reset evaluation method when condition changes
    state = state.copyWith(condition: condition, evaluationMethod: '');
  }

  void setEvaluationMethod(String method) {
    state = state.copyWith(
      evaluationMethod: method,
      selectedStoreId: method == 'home-visit' ? null : state.selectedStoreId,
      address: method == 'store' ? null : state.address,
    );
  }

  void selectStore(String storeId) {
    state = state.copyWith(selectedStoreId: storeId);
  }

  void updateAddress(String address) {
    state = state.copyWith(address: address);
  }

  void toggleAcceptFee(bool value) {
    state = state.copyWith(acceptFee: value);
  }

  Future<void> _submitDevice() async {
    state = state.copyWith(isAnalyzing: true, errorMessage: null);
    try {
      final store = state.selectedStore;
      final body = {
        'brand': state.brand ?? '',
        'model': '${state.model ?? ''} (${state.storage ?? ''})',
        'specs': {
          'storage': state.storage ?? '',
          'evaluationMethod': state.evaluationMethod.isEmpty
              ? 'home-visit'
              : state.evaluationMethod,
          'storeName': store?['name'],
          'storeAddress': store?['address'],
          'address': state.evaluationMethod == 'home-visit' ? state.address : null,
          'acceptFee': state.acceptFee,
        },
        'condition': state.condition ?? 'Good',
        'userEmail': 'customer@app.com', // Replace with real auth
        'userName': 'App User',
      };

      final res = await http.post(
        Uri.parse('$_apiBase/devices/submit'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      );

      if (res.statusCode == 200) {
        final json = jsonDecode(res.body);
        final ticketId = json['ticket']?['id'] as String?;
        state = state.copyWith(
          isAnalyzing: false,
          ticketId: ticketId,
          currentStep: 4, // Success step
        );
      } else {
        state = state.copyWith(
          isAnalyzing: false,
          errorMessage: 'Submission failed. Please try again.',
        );
      }
    } catch (e) {
      state = state.copyWith(
        isAnalyzing: false,
        errorMessage: 'Network error: $e',
      );
    }
  }
}

final submissionProvider =
    StateNotifierProvider<SubmissionNotifier, SubmissionState>((ref) {
  return SubmissionNotifier();
});

// ---------------------------------------------------------------------------
// Wizard Widget
// ---------------------------------------------------------------------------
class ProductSubmissionWizard extends ConsumerWidget {
  const ProductSubmissionWizard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(submissionProvider);
    final notifier = ref.read(submissionProvider.notifier);
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    // Can proceed to next step?
    bool canProceed() {
      switch (state.currentStep) {
        case 0:
          return (state.brand?.isNotEmpty ?? false) &&
              (state.model?.isNotEmpty ?? false) &&
              (state.storage?.isNotEmpty ?? false);
        case 1:
          return state.condition?.isNotEmpty ?? false;
        case 2:
          if (!state.needsEvaluation) return true; // non-poor skips method choice
          if (state.evaluationMethod.isEmpty) return false;
          if (state.evaluationMethod == 'store') {
            return state.selectedStoreId?.isNotEmpty ?? false;
          }
          if (state.evaluationMethod == 'home-visit') {
            return (state.address?.isNotEmpty ?? false) &&
                state.acceptFee;
          }
          return false;
        case 3:
          return true; // Summary — always can submit
        default:
          return false;
      }
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'Sell Your Device',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        leading: state.currentStep > 0 && state.currentStep < 4
            ? IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: notifier.previousStep,
              )
            : null,
      ),
      body: Column(
        children: [
          // Progress bar
          if (state.currentStep < 4) _ProgressBar(state.currentStep, 4),

          // Page content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                child: _buildStep(context, state, notifier, cs),
              ),
            ),
          ),

          // Bottom action
          if (state.currentStep < 4) _BottomBar(state, notifier, canProceed()),
        ],
      ),
    );
  }

  Widget _buildStep(
    BuildContext context,
    SubmissionState state,
    SubmissionNotifier notifier,
    ColorScheme cs,
  ) {
    switch (state.currentStep) {
      case 0:
        return _StepDevice(state: state, notifier: notifier, key: const ValueKey(0));
      case 1:
        return _StepCondition(state: state, notifier: notifier, key: const ValueKey(1));
      case 2:
        return _StepEvaluation(state: state, notifier: notifier, key: const ValueKey(2));
      case 3:
        return _StepSummary(state: state, key: const ValueKey(3));
      case 4:
        return _StepSuccess(state: state, key: const ValueKey(4));
      default:
        return const SizedBox.shrink();
    }
  }
}

// ---------------------------------------------------------------------------
// Progress Bar
// ---------------------------------------------------------------------------
class _ProgressBar extends StatelessWidget {
  final int current;
  final int total;
  const _ProgressBar(this.current, this.total);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Row(
        children: List.generate(total, (i) {
          return Expanded(
            child: Container(
              height: 4,
              margin: const EdgeInsets.symmetric(horizontal: 2),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(2),
                color: i < current
                    ? const Color(0xFF2563EB)
                    : i == current
                        ? const Color(0xFF2563EB).withOpacity(0.4)
                        : Colors.white12,
              ),
            ),
          );
        }),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Bottom Action Bar
// ---------------------------------------------------------------------------
class _BottomBar extends StatelessWidget {
  final SubmissionState state;
  final SubmissionNotifier notifier;
  final bool canProceed;

  const _BottomBar(this.state, this.notifier, this.canProceed);

  @override
  Widget build(BuildContext context) {
    final isLast = state.currentStep == 3;

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
      decoration: BoxDecoration(
        color: const Color(0xFF0F0F0F),
        border: Border(top: BorderSide(color: Colors.white.withOpacity(0.07))),
      ),
      child: SizedBox(
        width: double.infinity,
        height: 52,
        child: ElevatedButton(
          onPressed: state.isAnalyzing || !canProceed ? null : notifier.nextStep,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF2563EB),
            disabledBackgroundColor: const Color(0xFF2563EB).withOpacity(0.3),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            elevation: 0,
          ),
          child: state.isAnalyzing
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2.5,
                  ),
                )
              : Text(
                  isLast ? 'Submit Request' : 'Next Step →',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Step 0 — Device Details
// ---------------------------------------------------------------------------
class _StepDevice extends StatelessWidget {
  final SubmissionState state;
  final SubmissionNotifier notifier;
  const _StepDevice({required this.state, required this.notifier, super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _StepHeader(
          icon: Icons.phone_android_rounded,
          iconColor: const Color(0xFF3B82F6),
          title: 'What are you selling?',
          subtitle: 'Tell us the make, model, and storage of your device.',
        ),
        const SizedBox(height: 24),
        _DarkDropdown(
          label: 'Make (Brand)',
          value: state.brand,
          items: const ['Apple', 'Samsung', 'Google', 'Sony', 'Other'],
          onChanged: (v) => notifier.updateDetails(brand: v),
        ),
        const SizedBox(height: 16),
        _DarkTextField(
          label: 'Exact Model',
          hint: 'e.g. iPhone 15 Pro Max',
          initialValue: state.model,
          onChanged: (v) => notifier.updateDetails(model: v),
        ),
        const SizedBox(height: 16),
        _DarkDropdown(
          label: 'Storage',
          value: state.storage,
          items: const ['64GB', '128GB', '256GB', '512GB', '1TB+'],
          onChanged: (v) => notifier.updateDetails(storage: v),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Step 1 — Condition
// ---------------------------------------------------------------------------
class _StepCondition extends StatelessWidget {
  final SubmissionState state;
  final SubmissionNotifier notifier;
  const _StepCondition({required this.state, required this.notifier, super.key});

  static const _conditions = [
    {'value': 'Mint', 'desc': 'Flawless screen & body, fully functional'},
    {'value': 'Good', 'desc': 'Light scratches, completely functional'},
    {'value': 'Poor', 'desc': 'Heavy wear or deep scratches, functional'},
    {'value': 'Broken', 'desc': 'Cracked screen, battery issues, won\'t turn on'},
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _StepHeader(
          icon: Icons.star_half_rounded,
          iconColor: const Color(0xFFA855F7),
          title: 'Device Condition',
          subtitle: 'Be honest to get the most accurate quote.',
        ),
        const SizedBox(height: 24),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.6,
          children: _conditions.map((c) {
            final selected = state.condition == c['value'];
            return GestureDetector(
              onTap: () => notifier.updateCondition(c['value']!),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: selected
                      ? const Color(0xFF2563EB).withOpacity(0.1)
                      : const Color(0xFF0F172A),
                  border: Border.all(
                    color: selected
                        ? const Color(0xFF2563EB)
                        : Colors.white.withOpacity(0.08),
                    width: selected ? 1.5 : 1,
                  ),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      c['value']!,
                      style: TextStyle(
                        color: selected ? const Color(0xFF60A5FA) : Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      c['desc']!,
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.45),
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
        if (state.needsEvaluation) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF59E0B).withOpacity(0.08),
              border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.25)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.warning_amber_rounded,
                    color: Color(0xFFFBBF24), size: 18),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'This condition requires a physical evaluation — choose how in the next step.',
                    style: TextStyle(
                      color: const Color(0xFFFDE68A).withOpacity(0.9),
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Step 2 — Evaluation Method
// ---------------------------------------------------------------------------
class _StepEvaluation extends StatelessWidget {
  final SubmissionState state;
  final SubmissionNotifier notifier;
  const _StepEvaluation({required this.state, required this.notifier, super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _StepHeader(
          icon: Icons.location_on_rounded,
          iconColor: const Color(0xFF10B981),
          title: state.needsEvaluation ? 'Evaluation Method' : 'Pickup Location',
          subtitle: state.needsEvaluation
              ? 'Choose how you\'d like your device assessed.'
              : 'Where should we collect the device from?',
        ),
        const SizedBox(height: 24),

        // For Poor/Broken: show method picker first
        if (state.needsEvaluation) ...[
          _EvalMethodCard(
            icon: Icons.home_rounded,
            title: 'Engineer Home Visit',
            subtitle: 'An expert visits your home within 24 hours. A £150 dispatch fee applies.',
            value: 'home-visit',
            selectedValue: state.evaluationMethod,
            selectedColor: const Color(0xFF2563EB),
            onTap: () => notifier.setEvaluationMethod('home-visit'),
          ),
          const SizedBox(height: 12),
          _EvalMethodCard(
            icon: Icons.storefront_rounded,
            title: 'Visit Nearest Store',
            subtitle: 'Drop your device at one of our stores. No dispatch fee — walk in anytime.',
            value: 'store',
            selectedValue: state.evaluationMethod,
            selectedColor: const Color(0xFF10B981),
            onTap: () => notifier.setEvaluationMethod('store'),
          ),
          const SizedBox(height: 24),
        ],

        // Home visit: address input + fee acceptance
        if (state.evaluationMethod == 'home-visit' || !state.needsEvaluation) ...[
          _DarkTextField(
            label: state.needsEvaluation ? 'Your Home Address' : 'Full Pickup Address',
            hint: '123 Example Street, London, EC1A 1BB',
            initialValue: state.address,
            onChanged: notifier.updateAddress,
            maxLines: 3,
          ),
          if (state.needsEvaluation) ...[
            const SizedBox(height: 16),
            _FeeAcceptance(
              accepted: state.acceptFee,
              onChanged: notifier.toggleAcceptFee,
            ),
          ],
        ],

        // Store visit: store picker
        if (state.evaluationMethod == 'store') ...[
          Text(
            'Select Your Nearest Store',
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          ...kStores.map((store) {
            final selected = state.selectedStoreId == store['id'];
            return GestureDetector(
              onTap: () => notifier.selectStore(store['id']!),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: selected
                      ? const Color(0xFF10B981).withOpacity(0.07)
                      : const Color(0xFF0F172A),
                  border: Border.all(
                    color: selected
                        ? const Color(0xFF10B981)
                        : Colors.white.withOpacity(0.07),
                    width: selected ? 1.5 : 1,
                  ),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.storefront_rounded,
                      color: selected
                          ? const Color(0xFF34D399)
                          : Colors.white.withOpacity(0.35),
                      size: 22,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            store['name']!,
                            style: TextStyle(
                              color: selected ? const Color(0xFF34D399) : Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            store['address']!,
                            style: TextStyle(
                                color: Colors.white.withOpacity(0.4), fontSize: 11),
                          ),
                          Text(
                            store['hours']!,
                            style: TextStyle(
                                color: Colors.white.withOpacity(0.3), fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: selected
                            ? const Color(0xFF10B981).withOpacity(0.15)
                            : Colors.white.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        store['distance']!,
                        style: TextStyle(
                          color: selected ? const Color(0xFF34D399) : Colors.white54,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              'Distances are approximate. No appointment needed — just walk in.',
              style: TextStyle(
                  color: Colors.white.withOpacity(0.3), fontSize: 11),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Step 3 — Summary
// ---------------------------------------------------------------------------
class _StepSummary extends StatelessWidget {
  final SubmissionState state;
  const _StepSummary({required this.state, super.key});

  @override
  Widget build(BuildContext context) {
    final store = state.selectedStore;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _StepHeader(
          icon: Icons.check_circle_outline_rounded,
          iconColor: const Color(0xFF2563EB),
          title: 'Almost Done',
          subtitle: 'Review your submission before sending.',
        ),
        const SizedBox(height: 24),
        _SummaryCard(rows: [
          ('Device', '${state.brand ?? ''} ${state.model ?? ''} (${state.storage ?? ''})'),
          ('Condition', state.condition ?? ''),
          if (state.needsEvaluation)
            ('Evaluation',
                state.evaluationMethod == 'store' ? '🏪 Store Visit' : '🏠 Home Visit'),
          if (state.evaluationMethod == 'store' && store != null)
            ('Store', store['name'] ?? ''),
          if (state.evaluationMethod == 'home-visit' &&
              (state.address?.isNotEmpty ?? false))
            ('Address', state.address ?? ''),
        ]),
        if (state.needsEvaluation && state.evaluationMethod == 'store' && store != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withOpacity(0.07),
              border: Border.all(color: const Color(0xFF10B981).withOpacity(0.25)),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.storefront_rounded,
                    color: Color(0xFF34D399), size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'In-Store Evaluation — No Fee',
                        style: TextStyle(
                          color: Color(0xFF34D399),
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Visit ${store['name']} during opening hours: ${store['hours']}. Our team will evaluate your device on the spot.',
                        style: TextStyle(
                            color: Colors.white.withOpacity(0.6), fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
        if (state.needsEvaluation && state.evaluationMethod == 'home-visit') ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF59E0B).withOpacity(0.07),
              border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.25)),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.warning_amber_rounded,
                    color: Color(0xFFFBBF24), size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'An engineer will visit within 24 hours. A £150 dispatch fee will be deducted from your final payout.',
                    style: TextStyle(
                        color: Colors.white.withOpacity(0.6), fontSize: 12),
                  ),
                ),
              ],
            ),
          ),
        ],
        if (state.errorMessage != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.red.withOpacity(0.08),
              border: Border.all(color: Colors.red.withOpacity(0.3)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              state.errorMessage!,
              style: const TextStyle(color: Colors.redAccent, fontSize: 13),
            ),
          ),
        ],
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Step 4 — Success
// ---------------------------------------------------------------------------
class _StepSuccess extends StatelessWidget {
  final SubmissionState state;
  const _StepSuccess({required this.state, super.key});

  @override
  Widget build(BuildContext context) {
    final store = state.selectedStore;
    final isStore = state.evaluationMethod == 'store';

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: 40),
          Container(
            width: 88,
            height: 88,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF10B981).withOpacity(0.1),
              border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3), width: 2),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF10B981).withOpacity(0.25),
                  blurRadius: 40,
                  spreadRadius: 5,
                ),
              ],
            ),
            child: const Icon(Icons.check_circle_outline_rounded,
                color: Color(0xFF10B981), size: 44),
          ),
          const SizedBox(height: 24),
          const Text(
            'Ticket Created!',
            style: TextStyle(
              color: Colors.white,
              fontSize: 28,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          if (state.ticketId != null)
            Text(
              '#${state.ticketId}',
              style: TextStyle(
                color: Colors.white.withOpacity(0.4),
                fontSize: 13,
                fontFamily: 'monospace',
              ),
            ),
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              isStore && store != null
                  ? 'Visit ${store['name']} at your convenience to complete the evaluation.'
                  : state.needsEvaluation
                      ? 'Our engineer dispatch team has been notified and will contact you to arrange a visit.'
                      : 'Expect an email shortly with collection details.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white.withOpacity(0.55),
                fontSize: 14,
                height: 1.5,
              ),
            ),
          ),
          if (isStore && store != null) ...[
            const SizedBox(height: 20),
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 24),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                border: Border.all(color: Colors.white.withOpacity(0.08)),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                children: [
                  Text(
                    store['name']!,
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    store['address']!,
                    style: TextStyle(
                        color: Colors.white.withOpacity(0.45), fontSize: 12),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    store['hours']!,
                    style: const TextStyle(
                        color: Color(0xFF34D399),
                        fontSize: 12,
                        fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Shared Widgets
// ---------------------------------------------------------------------------
class _StepHeader extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;

  const _StepHeader({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: iconColor.withOpacity(0.1),
            border: Border.all(color: iconColor.withOpacity(0.2)),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Icon(icon, color: iconColor, size: 24),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold)),
              const SizedBox(height: 2),
              Text(subtitle,
                  style: TextStyle(
                      color: Colors.white.withOpacity(0.45), fontSize: 13)),
            ],
          ),
        ),
      ],
    );
  }
}

class _DarkTextField extends StatelessWidget {
  final String label;
  final String hint;
  final String? initialValue;
  final ValueChanged<String> onChanged;
  final int maxLines;

  const _DarkTextField({
    required this.label,
    required this.hint,
    this.initialValue,
    required this.onChanged,
    this.maxLines = 1,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: TextStyle(
                color: Colors.white.withOpacity(0.65),
                fontSize: 13,
                fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        TextFormField(
          initialValue: initialValue,
          maxLines: maxLines,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          onChanged: onChanged,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.white.withOpacity(0.25)),
            filled: true,
            fillColor: const Color(0xFF0F172A),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFF2563EB), width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}

class _DarkDropdown extends StatelessWidget {
  final String label;
  final String? value;
  final List<String> items;
  final ValueChanged<String?> onChanged;

  const _DarkDropdown({
    required this.label,
    this.value,
    required this.items,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: TextStyle(
                color: Colors.white.withOpacity(0.65),
                fontSize: 13,
                fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          value: value,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          dropdownColor: const Color(0xFF1E293B),
          decoration: InputDecoration(
            filled: true,
            fillColor: const Color(0xFF0F172A),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFF2563EB), width: 1.5),
            ),
          ),
          hint: Text('Select...',
              style: TextStyle(color: Colors.white.withOpacity(0.25))),
          items: items
              .map((e) => DropdownMenuItem(
                    value: e,
                    child: Text(e, style: const TextStyle(color: Colors.white)),
                  ))
              .toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }
}

class _EvalMethodCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final String value;
  final String selectedValue;
  final Color selectedColor;
  final VoidCallback onTap;

  const _EvalMethodCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.selectedValue,
    required this.selectedColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final selected = selectedValue == value;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: selected ? selectedColor.withOpacity(0.07) : const Color(0xFF0F172A),
          border: Border.all(
            color: selected ? selectedColor : Colors.white.withOpacity(0.07),
            width: selected ? 1.5 : 1,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: selected
                    ? selectedColor.withOpacity(0.15)
                    : Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon,
                  color: selected ? selectedColor : Colors.white38, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: TextStyle(
                        color: selected ? Colors.white : Colors.white70,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      )),
                  const SizedBox(height: 3),
                  Text(subtitle,
                      style: TextStyle(
                          color: Colors.white.withOpacity(0.38), fontSize: 12)),
                ],
              ),
            ),
            if (selected)
              Icon(Icons.check_circle_rounded, color: selectedColor, size: 20),
          ],
        ),
      ),
    );
  }
}

class _FeeAcceptance extends StatelessWidget {
  final bool accepted;
  final ValueChanged<bool> onChanged;
  const _FeeAcceptance({required this.accepted, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF59E0B).withOpacity(0.07),
        border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.25)),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Checkbox(
            value: accepted,
            onChanged: (v) => onChanged(v ?? false),
            activeColor: const Color(0xFFF59E0B),
            checkColor: Colors.black,
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: GestureDetector(
              onTap: () => onChanged(!accepted),
              child: RichText(
                text: TextSpan(
                  style: TextStyle(
                      color: Colors.white.withOpacity(0.65), fontSize: 13),
                  children: const [
                    TextSpan(
                      text: 'I acknowledge and accept ',
                    ),
                    TextSpan(
                      text: 'the £150 operational dispatch fee',
                      style: TextStyle(
                          color: Color(0xFFFBBF24), fontWeight: FontWeight.bold),
                    ),
                    TextSpan(
                        text:
                            ' which will be deducted from my final payout.'),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final List<(String, String)> rows;
  const _SummaryCard({required this.rows});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: rows.asMap().entries.map((e) {
          final i = e.key;
          final row = e.value;
          return Container(
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(
              border: i < rows.length - 1
                  ? Border(
                      bottom: BorderSide(color: Colors.white.withOpacity(0.06)))
                  : null,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(row.$1,
                    style: TextStyle(
                        color: Colors.white.withOpacity(0.45), fontSize: 13)),
                Flexible(
                  child: Text(
                    row.$2,
                    textAlign: TextAlign.right,
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 13),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}
