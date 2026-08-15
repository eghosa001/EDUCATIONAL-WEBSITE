import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/widgets/index.dart';
import '../../shared/repositories/index.dart';
import '../../shared/models/library/resource_model.dart';

class LibraryPage extends ConsumerStatefulWidget {
  const LibraryPage({super.key});

  @override
  ConsumerState<LibraryPage> createState() => _LibraryPageState();
}

class _LibraryPageState extends ConsumerState<LibraryPage> {
  List<LibraryItem> _resources = [];
  bool _loading = true;
  String _error = '';
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadResources();
  }

  Future<void> _loadResources() async {
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final repo = ref.read(libraryRepositoryProvider);
      final resources = await repo.getResources(limit: 20);
      if (mounted) {
        setState(() {
          _resources = resources;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  Future<void> _search(String query) async {
    if (query.isEmpty) {
      _loadResources();
      return;
    }
    try {
      final repo = ref.read(libraryRepositoryProvider);
      final results = await repo.searchResources(query);
      setState(() {
        _resources = results;
        _searchQuery = query;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Library'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadResources,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error.isNotEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: Colors.red),
                      const SizedBox(height: 16),
                      Text(_error, style: theme.textTheme.bodyMedium),
                      const SizedBox(height: 16),
                      EduButton(
                        label: 'Retry',
                        onPressed: _loadResources,
                      ),
                    ],
                  ),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Search bar
                      TextField(
                        onChanged: _search,
                        decoration: InputDecoration(
                          hintText: 'Search textbooks, notes, past questions...',
                          prefixIcon: const Icon(Icons.search),
                          suffixIcon: _searchQuery.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.clear),
                                  onPressed: () => _search(''),
                                )
                              : null,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          filled: true,
                          fillColor: theme.colorScheme.surfaceContainerHighest,
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Categories
                      _CategoryGrid(),
                      const SizedBox(height: 24),

                      // Resources list
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Resources', style: theme.textTheme.titleMedium),
                          if (_searchQuery.isNotEmpty)
                            TextButton(
                              onPressed: () => _search(''),
                              child: const Text('Clear'),
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      _ResourceList(resources: _resources),
                    ],
                  ),
                ),
    );
  }
}

class _CategoryGrid extends StatelessWidget {
  final List<Map<String, dynamic>> categories = [
    {'icon': Icons.menu_book, 'label': 'Textbooks', 'color': Colors.blue},
    {'icon': Icons.note, 'label': 'Study Notes', 'color': Colors.green},
    {'icon': Icons.assessment, 'label': 'Past Questions', 'color': Colors.orange},
    {'icon': Icons.video_library, 'label': 'Videos', 'color': Colors.purple},
    {'icon': Icons.picture_as_pdf, 'label': 'PDFs', 'color': Colors.red},
    {'icon': Icons.article, 'label': 'Articles', 'color': Colors.teal},
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 3,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 0.85,
      children: categories.map((c) {
        return EduCard(
          onTap: () {},
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(c['icon'] as IconData, color: c['color'] as Color, size: 32),
              const SizedBox(height: 8),
              Text(c['label'] as String, style: theme.textTheme.labelMedium),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _ResourceList extends StatelessWidget {
  final List<LibraryItem> resources;

  const _ResourceList({required this.resources});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (resources.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.library_books,
              size: 48,
              color: theme.colorScheme.onSurfaceVariant.withOpacity(0.5),
            ),
            const SizedBox(height: 12),
            Text(
              'No resources found',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      );
    }
    return Column(
      children: resources.map((r) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: EduCard(
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    _iconForType(r.resourceType),
                    color: theme.colorScheme.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(r.title, style: theme.textTheme.titleSmall),
                      Text(
                        '${r.resourceType.toUpperCase()}${r.subjectName != null ? ' · ${r.subjectName}' : ''}${r.isFree ? ' · Free' : ''}',
                        style: theme.textTheme.labelSmall,
                      ),
                    ],
                  ),
                ),
                if (r.url != null)
                  IconButton(
                    icon: const Icon(Icons.download),
                    onPressed: () {},
                  ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  IconData _iconForType(String type) {
    switch (type.toLowerCase()) {
      case 'video':
        return Icons.video_library;
      case 'pdf':
        return Icons.picture_as_pdf;
      case 'past_question':
        return Icons.assessment;
      default:
        return Icons.description;
    }
  }
}
