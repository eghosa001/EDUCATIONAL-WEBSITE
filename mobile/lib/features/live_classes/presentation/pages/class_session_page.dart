import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../shared/widgets/index.dart';
import '../../../../shared/repositories/index.dart';
import '../../../../shared/models/live_class/live_class_model.dart';

class ClassSessionPage extends ConsumerStatefulWidget {
  final String classId;

  const ClassSessionPage({super.key, required this.classId});

  @override
  ConsumerState<ClassSessionPage> createState() => _ClassSessionPageState();
}

class _ClassSessionPageState extends ConsumerState<ClassSessionPage>
    with TickerProviderStateMixin {
  late TabController _tabController;
  bool _isJoined = false;
  bool _isLoading = true;
  LiveClass? _classData;
  List<ChatMessage> _chatMessages = [];
  final TextEditingController _messageController = TextEditingController();
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadClass();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _loadClass() async {
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(liveClassRepositoryProvider);
      final classData = await repo.getClass(widget.classId);
      if (mounted) {
        setState(() {
          _classData = classData;
          _isJoined = classData.attendanceStatus == AttendanceStatus.joined;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load class: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _joinClass() async {
    try {
      final repo = ref.read(liveClassRepositoryProvider);
      await repo.joinClass(widget.classId);
      if (mounted) {
        setState(() => _isJoined = true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Joined the class')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to join: $e')),
        );
      }
    }
  }

  Future<void> _leaveClass() async {
    try {
      final repo = ref.read(liveClassRepositoryProvider);
      await repo.leaveClass(widget.classId);
      if (mounted) {
        setState(() => _isJoined = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Left the class')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to leave: $e')),
        );
      }
    }
  }

  void _sendChatMessage() {
    final text = _messageController.text.trim();
    if (text.isEmpty || _isSending) return;

    setState(() => _isSending = true);

    final message = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      userId: 'current_user',
      userName: 'You',
      content: text,
      sentAt: DateTime.now(),
    );

    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        setState(() {
          _chatMessages.add(message);
          _isSending = false;
        });
        _messageController.clear();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Class Session')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(_classData?.title ?? 'Class Session'),
        actions: [
          if (_classData?.isLive ?? false)
            Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: theme.colorScheme.error.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'LIVE',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: theme.colorScheme.error,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert),
            itemBuilder: (_) => [
              const PopupMenuItem(value: 'share', child: Text('Share Link')),
              const PopupMenuItem(value: 'report', child: Text('Report Issue')),
            ],
            onSelected: (value) {},
          ),
        ],
      ),
      body: Column(
        children: [
          TabBar(
            controller: _tabController,
            indicatorColor: theme.colorScheme.primary,
            labelColor: theme.colorScheme.primary,
            unselectedLabelColor: theme.colorScheme.onSurfaceVariant,
            tabs: const [
              Tab(text: 'Video', icon: Icon(Icons.videocam)),
              Tab(text: 'Chat', icon: Icon(Icons.chat)),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildVideoTab(theme),
                _buildChatTab(theme),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBottomBar(theme),
    );
  }

  Widget _buildVideoTab(ThemeData theme) {
    if (_classData == null) {
      return const Center(child: Text('No class data'));
    }

    return Column(
      children: [
        Expanded(
          child: _classData!.isLive || _isJoined
              ? _buildVideoPlayer(theme)
              : _buildJoinPrompt(theme),
        ),
        if (_classData != null) ...[
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(Icons.person, size: 16, color: theme.colorScheme.onSurfaceVariant),
                const SizedBox(width: 4),
                Text(
                  'Teacher: ${_classData!.teacherName ?? "Unknown"}',
                  style: theme.textTheme.bodySmall,
                ),
                const Spacer(),
                Icon(Icons.schedule, size: 16, color: theme.colorScheme.onSurfaceVariant),
                const SizedBox(width: 4),
                Text(
                  _classData!.formattedDuration,
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildVideoPlayer(ThemeData theme) {
    return Container(
      color: Colors.black,
      child: Stack(
        children: [
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.videocam_rounded,
                  size: 80,
                  color: Colors.white.withOpacity(0.3),
                ),
                const SizedBox(height: 16),
                Text(
                  'Connecting to live stream...',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Colors.white.withOpacity(0.5),
                  ),
                ),
              ],
            ),
          ),
          Positioned(
            bottom: 16,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _VideoControlButton(
                  icon: Icons.mic,
                  label: 'Mic',
                  onTap: () {},
                ),
                const SizedBox(width: 16),
                _VideoControlButton(
                  icon: Icons.videocam,
                  label: 'Camera',
                  onTap: () {},
                ),
                const SizedBox(width: 16),
                _VideoControlButton(
                  icon: Icons.screen_share,
                  label: 'Share',
                  onTap: () {},
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildJoinPrompt(ThemeData theme) {
    return Center(
      child: Padding(
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
                _classData!.isScheduled ? Icons.schedule : Icons.videocam_off,
                size: 64,
                color: theme.colorScheme.onPrimaryContainer,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              _classData!.isScheduled ? 'Class Has Not Started' : 'Class Not Joined',
              style: theme.textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              _classData!.isScheduled
                  ? 'The class will start at ${_classData!.formattedTime}. You will be notified when it begins.'
                  : 'Join the class to participate in the live session.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            EduButton(
              label: _classData!.isScheduled ? 'Set Reminder' : 'Join Class',
              onPressed: _classData!.isScheduled ? null : _joinClass,
              width: 200,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChatTab(ThemeData theme) {
    return Column(
      children: [
        Expanded(
          child: _chatMessages.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.chat_bubble_outline,
                        size: 64,
                        color: theme.colorScheme.onSurface.withOpacity(0.2),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No messages yet',
                        style: theme.textTheme.titleSmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Start the conversation!',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _chatMessages.length,
                  itemBuilder: (context, index) {
                    final msg = _chatMessages[index];
                    return _ChatBubble(message: msg, isMe: msg.isMe);
                  },
                ),
        ),
        _buildChatInput(theme),
      ],
    );
  }

  Widget _buildChatInput(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _messageController,
              decoration: InputDecoration(
                hintText: 'Type a message...',
                filled: true,
                fillColor: theme.colorScheme.surfaceContainerHighest,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
              ),
              maxLines: null,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => _sendChatMessage(),
            ),
          ),
          const SizedBox(width: 8),
          CircleAvatar(
            radius: 20,
            backgroundColor: theme.colorScheme.primary,
            child: IconButton(
              icon: Icon(
                _isSending ? Icons.hourglass_empty : Icons.send,
                size: 20,
                color: theme.colorScheme.onPrimary,
              ),
              onPressed: _isSending ? null : _sendChatMessage,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomBar(ThemeData theme) {
    if (_classData == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border(top: BorderSide(color: theme.colorScheme.outline)),
      ),
      child: Row(
        children: [
          if (_isJoined) ...[
            Expanded(
              child: EduButton(
                label: 'Leave Class',
                onPressed: _leaveClass,
                isOutlined: true,
                textColor: theme.colorScheme.error,
              ),
            ),
          ] else ...[
            Expanded(
              child: EduButton(
                label: _classData!.isLive ? 'Join Now' : 'Join Class',
                onPressed: _classData!.isLive ? _joinClass : null,
              ),
            ),
          ],
          const SizedBox(width: 12),
          IconButton(
            icon: const Icon(Icons.info_outline),
            onPressed: () => _showClassInfo(context),
            style: IconButton.styleFrom(
              backgroundColor: theme.colorScheme.surfaceContainerHighest,
            ),
          ),
        ],
      ),
    );
  }

  void _showClassInfo(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => _ClassInfoBottomSheet(classData: _classData!),
    );
  }
}

class _ClassInfoBottomSheet extends StatelessWidget {
  final LiveClass classData;

  const _ClassInfoBottomSheet({required this.classData});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: EdgeInsets.fromLTRB(
        24,
        16,
        24,
        MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Class Details',
            style: theme.textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          _InfoRow(
            icon: Icons.person,
            label: 'Teacher',
            value: classData.teacherName ?? 'Unknown',
          ),
          _InfoRow(
            icon: Icons.calendar_today,
            label: 'Date',
            value: classData.formattedDate,
          ),
          _InfoRow(
            icon: Icons.schedule,
            label: 'Time',
            value: classData.formattedTime,
          ),
          _InfoRow(
            icon: Icons.timer,
            label: 'Duration',
            value: classData.formattedDuration,
          ),
          if (classData.subjectTitle != null)
            _InfoRow(
              icon: Icons.book,
              label: 'Subject',
              value: classData.subjectTitle!,
            ),
          if (classData.topicTitle != null)
            _InfoRow(
              icon: Icons.label,
              label: 'Topic',
              value: classData.topicTitle!,
            ),
          if (classData.description != null) ...[
            const SizedBox(height: 8),
            Text(
              'Description',
              style: theme.textTheme.labelLarge,
            ),
            const SizedBox(height: 4),
            Text(
              classData.description!,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoRow({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: theme.colorScheme.onSurfaceVariant),
          const SizedBox(width: 12),
          Text(
            '$label:',
            style: theme.textTheme.labelMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value,
              style: theme.textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }
}

class _VideoControlButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _VideoControlButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(24),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.white, size: 24),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: theme.textTheme.labelSmall?.copyWith(color: Colors.white),
        ),
      ],
    );
  }
}

class _ChatBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isMe;

  const _ChatBubble({required this.message, required this.isMe});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.only(
          bottom: 8,
          right: isMe ? 64 : 8,
          left: isMe ? 8 : 64,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isMe
              ? theme.colorScheme.primary
              : theme.colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!isMe) ...[
              Text(
                message.userName,
                style: theme.textTheme.labelSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.primary,
                ),
              ),
              const SizedBox(height: 2),
            ],
            Text(
              message.content,
              style: theme.textTheme.bodyMedium,
            ),
            const SizedBox(height: 4),
            Text(
              _formatTime(message.sentAt),
              style: theme.textTheme.labelSmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
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
