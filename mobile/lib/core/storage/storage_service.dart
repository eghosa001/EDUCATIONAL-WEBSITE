import 'package:hive_flutter/hive_flutter.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import '../config/app_config.dart';

class StorageService {
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;
  StorageService._internal();

  late Box _authBox;
  late Box _settingsBox;
  late Box _cacheBox;
  final _secureStorage = const FlutterSecureStorage();
  bool _initialized = false;

  bool get isInitialized => _initialized;

  // User/profile metadata may remain in Hive. Access and refresh tokens are
  // secrets and are stored only in platform secure storage.
  Map<String, dynamic>? get user {
    final value = _authBox.get(AppConfig.userKey);
    if (value == null) return null;
    return Map<String, dynamic>.from(value as Map);
  }

  set user(Map<String, dynamic>? value) {
    if (value == null) {
      _authBox.delete(AppConfig.userKey);
    } else {
      _authBox.put(AppConfig.userKey, value);
    }
  }

  Future<void> saveUser(Map<String, dynamic>? value) async {
    user = value;
  }

  Future<String?> readToken() => _secureStorage.read(key: AppConfig.tokenKey);
  Future<String?> readRefreshToken() => _secureStorage.read(key: AppConfig.refreshTokenKey);

  Future<void> saveToken(String? value) async {
    if (value == null || value.isEmpty) {
      await _secureStorage.delete(key: AppConfig.tokenKey);
    } else {
      await _secureStorage.write(key: AppConfig.tokenKey, value: value);
    }
  }

  Future<void> saveRefreshToken(String? value) async {
    if (value == null || value.isEmpty) {
      await _secureStorage.delete(key: AppConfig.refreshTokenKey);
    } else {
      await _secureStorage.write(key: AppConfig.refreshTokenKey, value: value);
    }
  }

  Future<bool> get isAuthenticated async {
    final value = await readToken();
    return value != null && value.isNotEmpty;
  }

  Future<void> clearAuth() async {
    if (_initialized) {
      await _authBox.delete(AppConfig.userKey);
    }
    await _secureStorage.delete(key: AppConfig.tokenKey);
    await _secureStorage.delete(key: AppConfig.refreshTokenKey);
  }

  String? getSetting(String key) => _settingsBox.get(key) as String?;
  void setSetting(String key, String value) => _settingsBox.put(key, value);

  Future<String?> getCache(String key) async {
    final data = _cacheBox.get(key);
    if (data == null) return null;
    final cache = Map<String, dynamic>.from(data as Map);
    final expiresAt = DateTime.tryParse(cache['expiresAt']?.toString() ?? '');
    if (expiresAt != null && expiresAt.isBefore(DateTime.now())) {
      await _cacheBox.delete(key);
      return null;
    }
    return cache['value'] as String?;
  }

  Future<void> setCache(String key, String value, {Duration ttl = const Duration(hours: 1)}) async {
    await _cacheBox.put(key, {
      'value': value,
      'expiresAt': DateTime.now().add(ttl).toIso8601String(),
    });
  }

  Future<void> removeCache(String key) => _cacheBox.delete(key);

  Future<String> getDownloadPath(String filename) async {
    final dir = await getExternalStorageDirectory();
    return '${dir?.path ?? ''}/downloads/$filename';
  }

  Future<File> getFile(String path) async => File(path);

  Future<void> init() async {
    if (_initialized) return;
    final appDocDir = await getApplicationDocumentsDirectory();
    await Hive.initFlutter(appDocDir.path);
    _authBox = await Hive.openBox(AppConfig.authBoxName);
    _settingsBox = await Hive.openBox(AppConfig.settingsBoxName);
    _cacheBox = await Hive.openBox(AppConfig.cacheBoxName);

    // Migrate any legacy Hive-stored tokens into secure storage once, then
    // delete the plaintext copies from Hive.
    final legacyToken = _authBox.get(AppConfig.tokenKey)?.toString();
    final legacyRefresh = _authBox.get(AppConfig.refreshTokenKey)?.toString();
    if (legacyToken != null && legacyToken.isNotEmpty && await readToken() == null) {
      await saveToken(legacyToken);
    }
    if (legacyRefresh != null && legacyRefresh.isNotEmpty && await readRefreshToken() == null) {
      await saveRefreshToken(legacyRefresh);
    }
    await _authBox.delete(AppConfig.tokenKey);
    await _authBox.delete(AppConfig.refreshTokenKey);
    _initialized = true;
  }
}
