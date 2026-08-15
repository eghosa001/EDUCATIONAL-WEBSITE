import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class LiveClassesPage extends StatelessWidget {
  const LiveClassesPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Live Classes')),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.videocam, size: 80, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              'Live Classes Coming Soon',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Text(
              'Real-time video classes with teachers will be available soon.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}
