import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';

class LibraryPage extends StatelessWidget {
  const LibraryPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Library'),
        actions: [
          IconButton(icon: const Icon(Icons.search), onPressed: () {}),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Categories
            _CategoryGrid(),
            const SizedBox(height: 24),

            // Featured Resources
            Text('Featured Resources', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            _ResourceList(),
            const SizedBox(height: 24),

            // Recent Downloads
            Text('Recent Downloads', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            _DownloadsList(),
          ],
        ),
      ),
    );
  }
}

class _CategoryGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final categories = [
      {'icon': Icons.menu_book, 'label': 'Textbooks', 'color': theme.colorScheme.primary},
      {'icon': Icons.note, 'label': 'Study Notes', 'color': theme.colorScheme.success},
      {'icon': Icons.assessment, 'label': 'Past Questions', 'color': theme.colorScheme.warning},
      {'icon': Icons.video_library, 'label': 'Videos', 'color': theme.colorScheme.secondary},
      {'icon': Icons.picture_as_pdf, 'label': 'PDFs', 'color': Colors.red},
      {'icon': Icons.article, 'label': 'Articles', 'color': Colors.teal},
    ];

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
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final resources = [
      {'title': 'SS2 Biology Notes', 'type': 'PDF', 'size': '2.4 MB', 'downloads': 342},
      {'title': 'JAMB Mathematics Past Questions', 'type': 'PDF', 'size': '1.8 MB', 'downloads': 567},
      {'title': 'Physics Video Tutorial', 'type': 'Video', 'size': '45 MB', 'downloads': 123},
      {'title': 'Chemistry Study Guide', 'type': 'PDF', 'size': '3.1 MB', 'downloads': 234},
    ];

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
                    r['type'] == 'Video' ? Icons.video_library : Icons.picture_as_pdf,
                    color: theme.colorScheme.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(r['title']!, style: theme.textTheme.titleSmall),
                      Text('${r['type']} · ${r['size']} · ${r['downloads']} downloads', style: theme.textTheme.labelSmall),
                    ],
                  ),
                ),
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
}

class _DownloadsList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final downloads = [
      {'title': 'Cell Structure Diagram', 'size': '1.2 MB', 'date': 'Today'},
      {'title': 'Math Formula Sheet', 'size': '540 KB', 'date': 'Yesterday'},
      {'title': 'English Grammar Notes', 'size': '890 KB', 'date': '2 days ago'},
    ];

    return Column(
      children: downloads.map((d) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: EduCard(
            child: Row(
              children: [
                const Icon(Icons.file_download, color: Colors.blue),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(d['title']!, style: theme.textTheme.titleSmall),
                      Text('${d['size']} · ${d['date']}', style: theme.textTheme.labelSmall),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.open_in_new),
                  onPressed: () {},
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}
