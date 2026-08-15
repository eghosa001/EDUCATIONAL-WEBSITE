import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';

class ExamTakenPage extends StatefulWidget {
  final String examId;

  const ExamTakenPage({super.key, required this.examId});

  @override
  State<ExamTakenPage> createState() => _ExamTakenPageState();
}

class _ExamTakenPageState extends State<ExamTakenPage> {
  int _currentQuestion = 0;
  int _timeRemaining = 2700; // 45 minutes in seconds
  final Map<int, String> _answers = {};
  bool _isSubmitted = false;

  final List<String> _questions = [
    'What is the basic unit of life?',
    'Which organelle is responsible for protein synthesis?',
    'What is the function of the cell membrane?',
    'Which part of the cell contains DNA?',
    'What process do plants use to make food?',
    'Which organelle is known as the powerhouse of the cell?',
    'What is the difference between mitosis and meiosis?',
    'Which type of transport requires energy?',
    'What is osmosis?',
    'Which cell type lacks a nucleus?',
  ];

  final List<List<String>> _options = [
    ['Cell', 'Tissue', 'Organ', 'System'],
    ['Ribosome', 'Mitochondria', 'Golgi body', 'Lysosome'],
    ['Protection', 'Energy production', 'Protein synthesis', 'Cell division'],
    ['Cytoplasm', 'Nucleus', 'Membrane', 'Wall'],
    ['Respiration', 'Photosynthesis', 'Digestion', 'Excretion'],
    ['Ribosome', 'Nucleus', 'Mitochondria', 'Vacuole'],
    ['Number of divisions', 'Type of cells', 'Purpose', 'All of the above'],
    ['Diffusion', 'Osmosis', 'Active transport', 'Facilitated diffusion'],
    ['Movement of water', 'Movement of solutes', 'Cell division', 'Protein synthesis'],
    ['Plant cell', 'Animal cell', 'Bacterial cell', 'Fungal cell'],
  ];

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted && _timeRemaining > 0 && !_isSubmitted) {
        setState(() => _timeRemaining--);
        _startTimer();
      }
    });
  }

  String _formatTime(int seconds) {
    final minutes = seconds ~/ 60;
    final secs = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  void _submitExam() {
    setState(() => _isSubmitted = true);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (_isSubmitted) {
      return _ResultPage(
        examId: widget.examId,
        answers: _answers,
        totalQuestions: _questions.length,
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Exam'),
        actions: [
          Container(
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
          const SizedBox(width: 16),
        ],
      ),
      body: Column(
        children: [
          // Progress
          LinearProgressIndicator(
            value: (_currentQuestion + 1) / _questions.length,
            backgroundColor: theme.colorScheme.surfaceContainerHighest,
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Question ${_currentQuestion + 1} of ${_questions.length}',
                  style: theme.textTheme.bodyMedium,
                ),
                EduBadge(
                  label: '${_answers.length} answered',
                  backgroundColor: theme.colorScheme.success,
                  textColor: Colors.white,
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Question
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              _questions[_currentQuestion],
              style: theme.textTheme.titleLarge,
            ),
          ),
          const SizedBox(height: 24),

          // Options
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _options[_currentQuestion].length,
              itemBuilder: (context, index) {
                final option = _options[_currentQuestion][index];
                final selectedAnswer = _answers[_currentQuestion];
                final isSelected = selectedAnswer == option;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: EduCard(
                    onTap: () {
                      setState(() {
                        _answers[_currentQuestion] = option;
                      });
                    },
                    child: Row(
                      children: [
                        Container(
                          width: 32,
                          height: 32,
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
                        Expanded(
                          child: Text(
                            option,
                            style: theme.textTheme.bodyLarge,
                          ),
                        ),
                        if (isSelected)
                          Icon(Icons.check_circle, color: theme.colorScheme.primary),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Navigation buttons
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
                      onPressed: () {
                        setState(() => _currentQuestion--);
                      },
                    ),
                  ),
                if (_currentQuestion > 0) const SizedBox(width: 12),
                if (_currentQuestion < _questions.length - 1)
                  Expanded(
                    child: EduButton(
                      label: 'Next',
                      onPressed: () {
                        setState(() => _currentQuestion++);
                      },
                    ),
                  ),
                if (_currentQuestion == _questions.length - 1)
                  Expanded(
                    child: EduButton(
                      label: 'Submit Exam',
                      color: theme.colorScheme.success,
                      onPressed: _submitExam,
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

class _ResultPage extends StatelessWidget {
  final String examId;
  final Map<int, String> answers;
  final int totalQuestions;

  const _ResultPage({
    required this.examId,
    required this.answers,
    required this.totalQuestions,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Exam Results'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Score circle
              Container(
                width: 150,
                height: 150,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: theme.colorScheme.primaryContainer,
                ),
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '${((answers.length / totalQuestions) * 100).toInt()}%',
                        style: theme.textTheme.displaySmall?.copyWith(
                          color: theme.colorScheme.primary,
                        ),
                      ),
                      Text(
                        '${answers.length}/$totalQuestions',
                        style: theme.textTheme.titleMedium,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                answers.length >= totalQuestions * 0.5 ? 'Congratulations!' : 'Keep Practicing!',
                style: theme.textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              Text(
                answers.length >= totalQuestions * 0.5
                    ? 'You passed the exam!'
                    : 'You need to study more. Try again!',
                style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 32),
              EduButton(
                label: 'View Details',
                onPressed: () => context.push('/exams/$examId/results'),
              ),
              const SizedBox(height: 12),
              EduButton(
                label: 'Back to Exams',
                isOutlined: true,
                textColor: theme.colorScheme.primary,
                onPressed: () => context.pop(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
