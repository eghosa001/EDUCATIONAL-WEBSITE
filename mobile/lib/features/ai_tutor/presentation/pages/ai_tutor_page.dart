import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';

class AiTutorPage extends StatefulWidget {
  const AiTutorPage({super.key});

  @override
  State<AiTutorPage> createState() => _AiTutorPageState();
}

class _AiTutorPageState extends State<AiTutorPage> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<_Message> _messages = [];
  bool _isLoading = false;

  void _sendMessage() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.add(_Message(text: text, isUser: true));
      _isLoading = true;
    });
    _controller.clear();
    _scrollToBottom();

    // Simulate AI response
    Future.delayed(const Duration(seconds: 1), () {
      setState(() {
        _messages.add(_Message(
          text: _getAIResponse(text),
          isUser: false,
        ));
        _isLoading = false;
      });
      _scrollToBottom();
    });
  }

  String _getAIResponse(String question) {
    final responses = [
      'That\'s a great question! Let me explain this concept in detail...',
      'Based on the curriculum, here\'s what you need to know about this topic...',
      'Here\'s a simple explanation: The key concept here is...',
      'Excellent question! This is commonly tested in exams. Here\'s how to approach it...',
    ];
    return responses[(question.length + DateTime.now().second) % responses.length];
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Tutor'),
        actions: [
          IconButton(
            icon: const Icon(Icons.clear_all),
            onPressed: () => setState(() => _messages.clear()),
          ),
        ],
      ),
      body: Column(
        children: [
          // Chat messages
          Expanded(
            child: _messages.isEmpty
                ? _EmptyState()
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final message = _messages[index];
                      return _MessageBubble(
                        message: message.text,
                        isUser: message.isUser,
                        timestamp: message.timestamp,
                      );
                    },
                  ),
          ),

          // Loading indicator
          if (_isLoading)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
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
                        const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        const SizedBox(width: 8),
                        Text('AI is thinking...', style: theme.textTheme.labelSmall),
                      ],
                    ),
                  ),
                ],
              ),
            ),

          // Input area
          Container(
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
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                    maxLines: 3,
                    minLines: 1,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                CircularButton(
                  icon: Icons.send,
                  onPressed: _isLoading ? null : _sendMessage,
                ),
              ],
            ),
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
              style: theme.textTheme.bodyMedium?.copyWith(color: isUser ? Colors.white : null),
            ),
            const SizedBox(height: 4),
            Text(
              _formatTime(timestamp),
              style: theme.textTheme.labelSmall?.copyWith(
                color: isUser ? Colors.white70 : theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.psychology,
            size: 80,
            color: theme.colorScheme.primary.withOpacity(0.3),
          ),
          const SizedBox(height: 16),
          Text(
            'AI Tutor',
            style: theme.textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            'Ask me anything about your lessons!\nI can explain concepts, help with homework, and generate practice questions.',
            style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _SuggestionChip(text: 'Explain photosynthesis'),
              _SuggestionChip(text: 'Help with math problems'),
              _SuggestionChip(text: 'Generate quiz questions'),
              _SuggestionChip(text: 'Summarize this lesson'),
            ],
          ),
        ],
      ),
    );
  }
}

class _SuggestionChip extends StatelessWidget {
  final String text;

  const _SuggestionChip({required this.text});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Theme.of(context).colorScheme.primaryContainer,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: () {},
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
    return Material(
      shape: const CircleBorder(),
      clipBehavior: Clip.antiAlias,
      color: Theme.of(context).colorScheme.primary,
      child: InkWell(
        onTap: onPressed,
        child: SizedBox(
          width: 48,
          height: 48,
          child: Icon(icon, color: Colors.white),
        ),
      ),
    );
  }
}
