import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../di/index.dart';
import '../../../shared/widgets/index.dart';
import '../../../shared/repositories/index.dart';
import '../../../shared/services/analytics/analytics_service.dart';

class FlashcardsPage extends ConsumerStatefulWidget {
  const FlashcardsPage({super.key});

  @override
  ConsumerState<FlashcardsPage> createState() => _FlashcardsPageState();
}

class _FlashcardsPageState extends ConsumerState<FlashcardsPage> {
  List<Map<String, dynamic>> _flashcards = [];
  bool _isLoading = true;
  String? _error;
  int _currentIndex = 0;
  bool _isFlipped = false;
  String _subjectId = '';

  @override
  void initState() {
    super.initState();
    _loadFlashcards();
  }

  Future<void> _loadFlashcards() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final repo = ref.read(flashcardRepositoryProvider);
      final cards = await repo.getMyFlashcards(limit: 50);
      if (mounted) {
        setState(() {
          _flashcards = cards;
          _isLoading = false;
        });
      }
      // Track analytics event
      ref.read(analyticsServiceProvider).trackScreenView('flashcards');
    } catch (e) {
      if (mounted) {
        setState(() { _error = e.toString(); _isLoading = false; });
      }
    }
  }

  void _nextCard() {
    if (_currentIndex < _flashcards.length - 1) {
      setState(() { _currentIndex++; _isFlipped = false; });
    }
  }

  void _prevCard() {
    if (_currentIndex > 0) {
      setState(() { _currentIndex--; _isFlipped = false; });
    }
  }

  void _flipCard() {
    setState(() => _isFlipped = !_isFlipped);
  }

  void _rateCard(String rating) {
    if (_currentIndex < _flashcards.length - 1) {
      _nextCard();
    }
    // Track analytics
    ref.read(analyticsServiceProvider).trackEvent(
      eventName: 'flashcard_rate',
      parameters: {'rating': rating, 'cardIndex': _currentIndex},
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Flashcards')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text('Error: $_error'))
              : _flashcards.isEmpty
                  ? _EmptyState(onGenerate: () => context.push('/flashcards/generate'))
                  : _FlashcardViewer(
                      cards: _flashcards,
                      currentIndex: _currentIndex,
                      isFlipped: _isFlipped,
                      onFlip: _flipCard,
                      onNext: _nextCard,
                      onPrev: _prevCard,
                      onRate: _rateCard,
                    ),
    );
  }
}

class _FlashcardViewer extends StatelessWidget {
  final List<Map<String, dynamic>> cards;
  final int currentIndex;
  final bool isFlipped;
  final VoidCallback onFlip;
  final VoidCallback onNext;
  final VoidCallback onPrev;
  final Function(String) onRate;

  const _FlashcardViewer({
    required this.cards,
    required this.currentIndex,
    required this.isFlipped,
    required this.onFlip,
    required this.onNext,
    required this.onPrev,
    required this.onRate,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final card = cards[currentIndex];
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Progress
          LinearProgressIndicator(value: (currentIndex + 1) / cards.length, minHeight: 4),
          const SizedBox(height: 8),
          Text('${currentIndex + 1} / ${cards.length}', style: theme.textTheme.bodySmall),
          const SizedBox(height: 24),
          // Card
          GestureDetector(
            onTap: onFlip,
            child: Container(
              height: 280,
              decoration: BoxDecoration(
                color: isFlipped ? theme.colorScheme.primaryContainer : theme.colorScheme.secondaryContainer,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: theme.colorScheme.outline),
              ),
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(
                    isFlipped ? (card['back'] as String?) ?? '' : (card['front'] as String?) ?? '',
                    style: theme.textTheme.titleLarge,
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),
          // Navigation
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              IconButton(icon: const Icon(Icons.arrow_back), onPressed: onPrev),
              ElevatedButton(icon: const Icon(Icons.flip), onPressed: onFlip),
              IconButton(icon: const Icon(Icons.arrow_forward), onPressed: onNext),
            ],
          ),
          const SizedBox(height: 16),
          // Rating buttons
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _RateButton(label: 'Hard', color: Colors.red, onTap: () => onRate('hard')),
              _RateButton(label: 'Good', color: Colors.orange, onTap: () => onRate('good')),
              _RateButton(label: 'Easy', color: Colors.green, onTap: () => onRate('easy')),
            ],
          ),
        ],
      ),
    );
  }
}

class _RateButton extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _RateButton({required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      style: ElevatedButton.styleFrom backgroundColor: color.withOpacity(0.1),
      onPressed: onTap,
      child: Text(label, style: TextStyle(color: color)),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final VoidCallback onGenerate;
  const _EmptyState({required this.onGenerate});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.flash_on, size: 64, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          const Text('No flashcards yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          const Text('Generate AI flashcards from your courses', style: TextStyle(color: Colors.grey)),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            icon: const Icon(Icons.auto_awesome),
            label: const Text('Generate Flashcards'),
            onPressed: onGenerate,
          ),
        ],
      ),
    );
  }
}
