import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';
import '../../shared/repositories/index.dart';
import '../../shared/services/ai_tutor_service.dart';
import '../../core/storage/storage_service.dart';

class AiTutorPage extends ConsumerStatefulWidget {
  const AiTutorPage({super.key});

  @override
  ConsumerState<AiTutorPage> createState() => _AiTutorPageState();
}

class _AiTutorPageState extends ConsumerState<AiTutorPage> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<_Message> _messages = [];
  bool _isLoading = false;
  bool _hasError = false;
  String _errorMessage = '';
  String _subjectId = '';
  String _topicId = '';
  String _studentLevel = '';

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  @override
  void dispose() {
    _saveHistory();
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadHistory() async {
    final storage = ref.read(storageServiceProvider);
    final saved = storage.getSetting('ai_tutor_history');
    if (saved != null) {
      try {
        final List<dynamic> decoded = jsonDecode(saved) as List<dynamic>;
        setState(() {
          for (final item in decoded) {
            final map = item as Map<String, dynamic>;
            _messages.add(_Message(
              text: map['text'] as String,
              isUser: map['isUser'] as bool,
              timestamp: map.containsKey('timestamp')
                  ? DateTime.parse(map['timestamp'] as String)
                  : DateTime.now(),
            ));
          }
        });
        _scrollToBottom();
      } catch (_) {}
    }
    // Restore context from previous session
    final subject = storage.getSetting('ai_tutor_subject');
    final topic = storage.getSetting('ai_tutor_topic');
    final level = storage.getSetting('ai_tutor_level');
    if (subject != null) setState(() => _subjectId = subject);
    if (topic != null) setState(() => _topicId = topic);
    if (level != null) setState(() => _studentLevel = level);
  }

  void _saveHistory() {
    final storage = ref.read(storageServiceProvider);
    storage.setSetting(
      'ai_tutor_history',
      jsonEncode(_messages.map((m) => {
        'text': m.text,
        'isUser': m.isUser,
        'timestamp': m.timestamp.toIso8601String(),
      }).toList()),
    );
    storage.setSetting('ai_tutor_subject', _subjectId);
    storage.setSetting('ai_tutor_topic', _topicId);
    storage.setSetting('ai_tutor_level', _studentLevel);
  }

  void _sendMessage() {
    final text = _controller.text.trim();
    if (text.isEmpty || _isLoading) return;

    setState(() {
      _messages.add(_Message(text: text, isUser: true));
      _isLoading = true;
      _hasError = false;
    });
    _controller.clear();
    _scrollToBottom();

    final repo = ref.read(aiTutorRepositoryProvider);
    repo.sendMessage(
      message: text,
      subjectId: _subjectId.isEmpty ? null : _subjectId,
      topicId: _topicId.isEmpty ? null : _topicId,
      studentLevel: _studentLevel.isEmpty ? null : _studentLevel,
    ).then((response) {
      if (mounted) {
        setState(() {
          _messages.add(_Message(
            text: response.content,
            isUser: false,
          ));
          _isLoading = false;
        });
        _scrollToBottom();
        _saveHistory();
      }
    }).catchError((error) {
      if (mounted) {
        setState(() {
          _hasError = true;
          _errorMessage = error is AiTutorException
              ? error.message
              : 'Failed to get response. Please try again.';
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_errorMessage),
            backgroundColor: Theme.of(context).colorScheme.error,
            action: SnackBarAction(
              label: 'Retry',
              textColor: Colors.white,
              onPressed: _sendMessage,
            ),
          ),
        );
      }
    });
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _clearChat() {
    setState(() {
      _messages.clear();
      _hasError = false;
    });
    ref.read(aiTutorRepositoryProvider).clearSession();
    _saveHistory();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Tutor'),
        actions: [
          if (_messages.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.clear_all),
              onPressed: () => _showClearDialog(context),
            ),
        ],
      ),
      body: Column(
        children: [
          // Context bar
          if (_subjectId.isNotEmpty || _topicId.isNotEmpty || _studentLevel.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: theme.colorScheme.primaryContainer,
              child: Row(
                children: [
                  const Icon(Icons.psychology, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Context: ${[_studentLevel, _subjectId, _topicId].where((s) => s.isNotEmpty).join(' · ')}',
                      style: theme.textTheme.labelSmall,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 16),
                    onPressed: () {
                      setState(() {
                        _subjectId = '';
                        _topicId = '';
                        _studentLevel = '';
                      });
                    },
                  ),
                ],
              ),
            ),
          Expanded(
            child: _messages.isEmpty && !_hasError
                ? _EmptyState(onTap: _handleSuggestionTap)
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length + (_hasError ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (_hasError && index == _messages.length) {
                        return _ErrorBubble(
                          message: _errorMessage,
                          onRetry: _sendMessage,
                        );
                      }
                      final message = _messages[index];
                      return _MessageBubble(
                        message: message.text,
                        isUser: message.isUser,
                        timestamp: message.timestamp,
                      );
                    },
                  ),
          ),
          if (_isLoading)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation(
                              theme.colorScheme.onPrimaryContainer,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'AI is thinking...',
                          style: theme.textTheme.labelSmall,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          _buildInputArea(theme),
        ],
      ),
      bottomSheet: _buildContextSheet(theme),
    );
  }

  Widget _buildContextSheet(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border(top: BorderSide(color: theme.colorScheme.outline)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Learning Context',
            style: theme.textTheme.titleSmall,
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Subject (e.g. biology)',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  onChanged: (v) => setState(() => _subjectId = v),
                  valueTransformer: (v) => v,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Topic (optional)',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  onChanged: (v) => setState(() => _topicId = v),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: _studentLevel.isEmpty ? null : _studentLevel,
            decoration: InputDecoration(
              labelText: 'Your Level',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            items: [
              'Primary School',
              'JSS',
              'SSS',
              'JAMB',
              'WAEC',
              'NECO',
              'University',
              'Professional',
            ].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
            onChanged: (v) => setState(() => _studentLevel = v ?? ''),
          ),
        ],
      ),
    );
  }

  Widget _buildInputArea(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _controller,
              decoration: InputDecoration(
                hintText: 'Ask me anything about your lessons...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide(color: theme.colorScheme.outline),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide(color: theme.colorScheme.outline),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide(color: theme.colorScheme.primary, width: 2),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
              ),
              maxLines: 3,
              minLines: 1,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => _sendMessage(),
            ),
          ),
          const SizedBox(width: 8),
          CircularButton(
            icon: _isLoading ? Icons.hourglass_empty : Icons.send,
            onPressed: _isLoading ? null : _sendMessage,
          ),
        ],
      ),
    );
  }

  void _handleSuggestionTap(String text) {
    _controller.text = text;
    _sendMessage();
  }

  void _showClearDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Conversation'),
        content: const Text('Are you sure you want to clear all messages?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              _clearChat();
            },
            child: const Text('Clear'),
          ),
        ],
      ),
    );
  }
}

class _Message {
  final String text;
  final bool isUser;
  final DateTime timestamp;

  _Message({required this.text, required this.isUser, DateTime? timestamp})
      : timestamp = timestamp ?? DateTime.now();
}

class _MessageBubble extends StatelessWidget {
  final String message;
  final bool isUser;
  final DateTime timestamp;

  const _MessageBubble({
    required this.message,
    required this.isUser,
    required this.timestamp,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isUser ? theme.colorScheme.primary : theme.colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Text(
              message,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: isUser ? Colors.white : null,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '${timestamp.hour.toString().padLeft(2, '0')}:${timestamp.minute.toString().padLeft(2, '0')}',
              style: theme.textTheme.labelSmall?.copyWith(
                color: isUser ? Colors.white70 : theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorBubble extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorBubble({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.error.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.colorScheme.error.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline, color: theme.colorScheme.error, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.error,
              ),
            ),
          ),
          TextButton(
            onPressed: onRetry,
            child: Text(
              'Retry',
              style: theme.textTheme.labelMedium?.copyWith(
                color: theme.colorScheme.error,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final ValueChanged<String> onTap;

  const _EmptyState({required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.psychology,
              size: 64,
              color: theme.colorScheme.onPrimaryContainer,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'AI Tutor',
            style: theme.textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            'Ask me anything about your lessons!\nI can explain concepts, help with homework, and generate practice questions.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _SuggestionChip(
                text: 'Explain photosynthesis',
                onTap: () => onTap('Explain photosynthesis'),
              ),
              _SuggestionChip(
                text: 'Help with math problems',
                onTap: () => onTap('Help me solve this math problem: 2x + 5 = 15'),
              ),
              _SuggestionChip(
                text: 'Generate quiz questions',
                onTap: () => onTap('Generate 5 quiz questions on Nigerian history'),
              ),
              _SuggestionChip(
                text: 'Summarize a lesson',
                onTap: () => onTap('Summarize the lesson on cell structure'),
              ),
              _SuggestionChip(
                text: 'WAEC biology tips',
                onTap: () => onTap('Give me tips for WAEC Biology exam'),
              ),
              _SuggestionChip(
                text: 'JAMB physics formulas',
                onTap: () => onTap('List all important JAMB physics formulas'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SuggestionChip extends StatelessWidget {
  final String text;
  final VoidCallback onTap;

  const _SuggestionChip({required this.text, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Theme.of(context).colorScheme.primaryContainer,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Text(
            text,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: Theme.of(context).colorScheme.onPrimaryContainer,
            ),
          ),
        ),
      ),
    );
  }
}

class CircularButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onPressed;

  const CircularButton({super.key, required this.icon, this.onPressed});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
      shape: const CircleBorder(),
      clipBehavior: Clip.antiAlias,
      color: onPressed == null
          ? theme.colorScheme.onSurface.withOpacity(0.2)
          : theme.colorScheme.primary,
      child: InkWell(
        onTap: onPressed,
        child: SizedBox(
          width: 48,
          height: 48,
          child: Icon(
            icon,
            color: onPressed == null
                ? theme.colorScheme.onSurface.withOpacity(0.5)
                : theme.colorScheme.onPrimary,
          ),
        ),
      ),
    );
  }
}
