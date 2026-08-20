/// Offline caching layer using Hive local database
/// Provides caching for frequently accessed data when network is unavailable

import 'package:hive/hive.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class OfflineCache {
  static const String _cacheBoxName = 'offline_cache';
  static const Duration _defaultTTL = Duration(hours: 1);

  Future<T?> getOrLoad<T>({
    required String key,
    required Future<T> Function() loader,
    Duration ttl = _defaultTTL,
  }) async {
    try {
      final box = await Hive.openBox<Map<dynamic, dynamic>>(_cacheBoxName);
      final cached = box.get(key);

      if (cached != null) {
        final timestamp = cached['timestamp'] as int?;
        final now = DateTime.now().millisecondsSinceEpoch;
        if (timestamp != null && (now - timestamp) < ttl.inMilliseconds) {
          return cached['data'] as T?;
        }
        // Expired — remove and reload
        await box.delete(key);
      }

      final data = await loader();
      await box.put(key, {
        'timestamp': DateTime.now().millisecondsSinceEpoch,
        'data': data,
        'ttl': ttl.inMilliseconds,
      });
      return data;
    } catch (e) {
      // Fall back to network load
      return loader();
    }
  }

  Future<void> invalidate(String key) async {
    try {
      final box = await Hive.openBox<Map<dynamic, dynamic>>(_cacheBoxName);
      await box.delete(key);
    } catch (_) {}
  }

  Future<void> clearAll() async {
    try {
      await Hive.deleteBoxFromDisk(_cacheBoxName);
    } catch (_) {}
  }

  Future<int> get cachedItemCount() async {
    try {
      final box = await Hive.openBox<Map<dynamic, dynamic>>(_cacheBoxName);
      return box.length;
    } catch (_) {
      return 0;
    }
  }
}

final offlineCacheProvider = Provider<OfflineCache>((ref) => OfflineCache());
