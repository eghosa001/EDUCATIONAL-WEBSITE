import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/widgets/index.dart';
import '../../../shared/repositories/index.dart';

class ExamTakenPage extends ConsumerStatefulWidget {
  final String examId;
  const ExamTakenPage({super.key, required this.examId});

  @override
  ConsumerState<ExamTakenPage> createState() => _ExamTakenPageState();
}

class _ExamTakenPageState extends ConsumerState<ExamTakenPage> {
  List<Map<String, dynamic>> _questions = [];
  int _currentQuestion = 0;
  int _timeRemaining = 2700;
  final Map<int, String> _answers = {};
  bool _isLoading = true;
  bool _isSubmitting = false;
  bool _isSubmitted = false;
  String? _error;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _loadExam();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _loadExam() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final repo = ref.read(examRepositoryProvider);
      final examData = await repo.startExam(widget.examId);
      final questions = (examData['questions'] as List?)
              ?.map((q) => Map<String, dynamic>.from(q))
              .toList() ??
          [];
      final durationMinutes = (examData['durationMinutes'] as num?)?.toInt() ?? 45;

      if (mounted) {
        setState(() {
          _questions = questions;
          _timeRemaining = durationMinutes * 60;
          _isLoading = false;
        });
        _startTimer();
      }
    } catch (e) {
      if (mounted) {
        setState(() { _error = e.toString(); _isLoading = false; });
      }
    }
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted && _timeRemaining > 0 && !_isSubmitted) {
        setState(() => _timeRemaining--);
      } else {
        timer.cancel();
        if (_timeRemaining <= 0 && !_isSubmitted) _submitExam();
      }
    });
  }

  String _formatTime(int seconds) {
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  Future<void> _submitExam() async {
    _timer?.cancel();
    setState(() => _isSubmitting = true);
    try {
      final repo = ref.read(examRepositoryProvider);
      final answersPayload = _answers.map((k, v) => MapEntry('q$k', v));
      final result = await repo.submitExam(widget.examId, answersPayload);
      if (mounted) {
        setState(() {
          _isSubmitted = true;
          _isSubmitting = false;
        });
        _showResults(result);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Submit failed: $e')),
        );
      }
    }
  }

  void _showResults(Map<String, dynamic> result) {
    final score = (result['score'] as num?)?.toDouble() ?? 0.0;
    final totalQuestions = (result['totalQuestions'] as num?)?.toInt() ?? _questions.length;
    final correctAnswers = (result['correctAnswers'] as num?)?.toInt() ?? 0;
    final passed = result['passed'] as bool? ?? score >= 50;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: passed
                    ? Theme.of(context).colorScheme.primaryContainer
                    : Theme.of(context).colorScheme.errorContainer,
              ),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('${score.toInt()}%',
                        style: Theme.of(context).textTheme.displaySmall?.copyWith(
                            color: passed
                                ? Theme.of(context).colorScheme.primary
                                : Theme.of(context).colorScheme.error)),
                    Text('$correctAnswers/$totalQuestions',
                        style: Theme.of(context).textTheme.titleMedium),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              passed ? 'Congratulations!' : 'Keep Practicing!',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              passed ? 'You passed the exam!' : 'You need to study more.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.pop();
            },
            child: const Text('Back to Exams'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Exam')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Exam')),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text(_error!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              EduButton(label: 'Retry', onPressed: _loadExam),
            ],
          ),
        ),
      );
    }

    if (_questions.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Exam')),
        body: const EduEmptyState(
          icon: Icons.quiz,
          title: 'No questions available',
          subtitle: 'This exam has no questions yet',
        ),
      );
    }

    final question = _questions[_currentQuestion];
    final questionText = question['questionText'] as String? ?? question['text'] as String? ?? '';
    final options = (question['options'] as List?)
            ?.map((o) => o is String ? o : (o['optionText'] as String? ?? o['text'] as String? ?? ''))
            .toList() ??
        [];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Exam'),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: _timeRemaining < 300 ? theme.colorScheme.error : theme.colorScheme.primary,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              _formatTime(_timeRemaining),
              style: theme.textTheme.labelLarge?.copyWith(color: Colors.white),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          LinearProgressIndicator(
            value: (_currentQuestion + 1) / _questions.length,
            backgroundColor: theme.colorScheme.surfaceContainerHighest,
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Question ${_currentQuestion + 1} of ${_questions.length}'),
                EduBadge(
                  label: '${_answers.length} answered',
                  backgroundColor: theme.colorScheme.tertiary,
                  textColor: Colors.white,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(questionText, style: theme.textTheme.titleLarge),
          ),
          const SizedBox(height: 24),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: options.length,
              itemBuilder: (context, index) {
                final option = options[index];
                final selectedAnswer = _answers[_currentQuestion];
                final isSelected = selectedAnswer == option;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: EduCard(
                    onTap: () => setState(() => _answers[_currentQuestion] = option),
                    child: Row(
                      children: [
                        Container(
                          width: 32, height: 32,
                          decoration: BoxDecoration(
                            color: isSelected ? theme.colorScheme.primary : theme.colorScheme.surfaceContainerHighest,
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(
                              String.fromCharCode(65 + index),
                              style: theme.textTheme.labelLarge?.copyWith(
                                color: isSelected ? Colors.white : null,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(child: Text(option, style: theme.textTheme.bodyLarge)),
                        if (isSelected) Icon(Icons.check_circle, color: theme.colorScheme.primary),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                if (_currentQuestion > 0)
                  Expanded(
                    child: EduButton(
                      label: 'Previous',
                      isOutlined: true,
                      textColor: theme.colorScheme.primary,
                      onPressed: () => setState(() => _currentQuestion--),
                    ),
                  ),
                if (_currentQuestion > 0) const SizedBox(width: 12),
                if (_currentQuestion < _questions.length - 1)
                  Expanded(
                    child: EduButton(
                      label: 'Next',
                      onPressed: () => setState(() => _currentQuestion++),
                    ),
                  ),
                if (_currentQuestion == _questions.length - 1)
                  Expanded(
                    child: EduButton(
                      label: _isSubmitting ? 'Submitting...' : 'Submit Exam',
                      isLoading: _isSubmitting,
                      color: theme.colorScheme.tertiary,
                      onPressed: _isSubmitting ? null : _submitExam,
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
