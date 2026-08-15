import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';

class FlashcardsPage extends StatefulWidget {
  const FlashcardsPage({super.key});

  @override
  State<FlashcardsPage> createState() => _FlashcardsPageState();
}

class _FlashcardsPageState extends State<FlashcardsPage> {
  int _currentIndex = 0;
  bool _isFlipped = false;

  final List<Map<String, dynamic>> _flashcards = [
    {'front': 'What is Mitosis?', 'back': 'Cell division that results in two daughter cells each having the same number and kind of chromosomes as the parent nucleus.', 'difficulty': 'medium'},
    {'front': 'Define Osmosis', 'back': 'The movement of water molecules from a region of higher concentration to a region of lower concentration through a semi-permeable membrane.', 'difficulty': 'easy'},
    {'front': 'What is the function of Ribosomes?', 'back': 'Ribosomes are responsible for protein synthesis in the cell.', 'difficulty': 'easy'},
    {'front': 'Explain the Cell Theory', 'back': '1. All living organisms are composed of one or more cells.\n2. The cell is the basic unit of structure and organization in organisms.\n3. All cells come from pre-existing cells.', 'difficulty': 'medium'},
    {'front': 'What is Meiosis?', 'back': 'A type of cell division that reduces the number of chromosomes in the parent cell by half and produces four gamete cells.', 'difficulty': 'hard'},
  ];

  void _flipCard() {
    setState(() => _isFlipped = !_isFlipped);
  }

  void _nextCard() {
    if (_currentIndex < _flashcards.length - 1) {
      setState(() {
        _currentIndex++;
        _isFlipped = false;
      });
    }
  }

  void _prevCard() {
    if (_currentIndex > 0) {
      setState(() {
        _currentIndex--;
        _isFlipped = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Flashcards'),
        actions: [
          IconButton(
            icon: const Icon(Icons.shuffle),
            onPressed: () => setState(() => _currentIndex = DateTime.now().millisecond % _flashcards.length),
          ),
        ],
      ),
      body: Column(
        children: [
          // Progress
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('${_currentIndex + 1}/${_flashcards.length}', style: theme.textTheme.bodyMedium),
                EduBadge(
                  label: _flashcards[_currentIndex]['difficulty'],
                  backgroundColor: theme.colorScheme.primary,
                  textColor: Colors.white,
                ),
              ],
            ),
          ),
          LinearProgressIndicator(value: (_currentIndex + 1) / _flashcards.length),
          const SizedBox(height: 16),

          // Flashcard
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: GestureDetector(
                onTap: _flipCard,
                child: _FlashcardWidget(
                  card: _flashcards[_currentIndex],
                  isFlipped: _isFlipped,
                ),
              ),
            ),
          ),

          // Rating buttons
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _RatingButton(
                  icon: Icons.close,
                  label: 'Still Learning',
                  color: theme.colorScheme.error,
                  onTap: _nextCard,
                ),
                _RatingButton(
                  icon: Icons.sentiment_dissatisfied,
                  label: 'Getting There',
                  color: theme.colorScheme.warning,
                  onTap: _nextCard,
                ),
                _RatingButton(
                  icon: Icons.check,
                  label: 'Know It',
                  color: theme.colorScheme.success,
                  onTap: _nextCard,
                ),
              ],
            ),
          ),

          // Navigation
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
            child: Row(
              children: [
                Expanded(
                  child: EduButton(
                    label: 'Previous',
                    isOutlined: true,
                    textColor: theme.colorScheme.primary,
                    onPressed: _prevCard,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: EduButton(
                    label: 'Next',
                    onPressed: _nextCard,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FlashcardWidget extends StatelessWidget {
  final Map<String, dynamic> card;
  final bool isFlipped;

  const _FlashcardWidget({required this.card, required this.isFlipped});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
      transform: isFlipped ? Matrix4.rotationY(3.14159) : Matrix4.identity(),
      child: Stack(
        children: [
          // Front
          _CardFace(
            content: card['front'],
            theme: theme,
          ),
          // Back
          Positioned.fill(
            child: Transform(
              alignment: Alignment.center,
              transform: Matrix4.identity()..setEntry(3, 2, 0.001),
              child: _CardFace(
                content: card['back'],
                theme: theme,
                isBack: true,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CardFace extends StatelessWidget {
  final String content;
  final ThemeData theme;
  final bool isBack;

  const _CardFace({required this.content, required this.theme, this.isBack = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: isBack ? theme.colorScheme.primary : theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Text(
          content,
          style: theme.textTheme.titleLarge?.copyWith(
            color: isBack ? Colors.white : theme.colorScheme.onSurface,
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

class _RatingButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _RatingButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: 4),
          Text(label, style: Theme.of(context).textTheme.labelSmall),
        ],
      ),
    );
  }
}
