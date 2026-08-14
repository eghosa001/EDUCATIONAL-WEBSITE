import 'package:hive_flutter/hive_flutter.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';

class StorageService {
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;
  StorageService._internal();

  late Box _authBox;
  late Box _settingsBox;
  late Box _cacheBox;
  final _secureStorage = const FlutterSecureStorage();

  String? get token => _authBox.get('token');
  set token(String? value) => _authBox.put('token', value);

  String? get refreshToken => _authBox.get('refreshToken');
  set refreshToken(String? value) => _authBox.put('refreshToken', value);

  Map<String, dynamic>? get user => _authBox.get('user') as Map<String, dynamic>?;
  set user(Map<String, dynamic>? value) => _authBox.put('user', value);

  bool get isAuthenticated => token != null && token!.isNotEmpty;

  Future<void> clearAuth() async {
    _authBox.clear();
    await _secureStorage.deleteAll();
  }

  String? getSetting(String key) => _settingsBox.get(key) as String?;
  void setSetting(String key, String value) => _settingsBox.put(key, value);

  Future<String?> getCache(String key) async {
    final data = _cacheBox.get(key);
    if (data == null) return null;
    final cache = data as Map<String, dynamic>;
    final expiresAt = DateTime.tryParse(cache['expiresAt'] ?? '');
    if (expiresAt != null && expiresAt.isBefore(DateTime.now())) {
      _cacheBox.delete(key);
      return null;
    }
    return cache['value'] as String?;
  }

  Future<void> setCache(String key, String value, {Duration ttl = const Duration(hours: 1)}) async {
    _cacheBox.put(key, {
      'value': value,
      'expiresAt': DateTime.now().add(ttl).toIso8601String(),
    });
  }

  Future<void> removeCache(String key) => _cacheBox.delete(key);

  Future<String> getDownloadPath(String filename) async {
    final dir = await getExternalStorageDirectory();
    return '${dir?.path ?? ''}/downloads/$filename';
  }

  Future<File> getFile(String path) async {
    return File(path);
  }

  Future<void> init() async {
    final appDocDir = await getApplicationDocumentsDirectory();
    await Hive.initFlutter(appDocDir.path);

    _authBox = await Hive.openBox('auth_box');
    _settingsBox = await Hive.openBox('settings_box');
    _cacheBox = await Hive.openBox('cache_box');
  }
}
