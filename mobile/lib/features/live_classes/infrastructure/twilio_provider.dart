import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

class TwilioClient implements Disposable {
  final String accountSid;
  final String authToken;
  final String roomName;
  final String userName;
  final Dio _dio = Dio();
  Timer? _heartbeatTimer;

  String? _accessToken;
  bool _isJoined = false;

  TwilioClient({
    required this.accountSid,
    required this.authToken,
    required this.roomName,
    required this.userName,
  });

  Future<void> joinRoom() async {
    try {
      final response = await _dio.post(
        'https://api.twilio.com/Video/V1/Signaling/Token',
        data: {
          'AccountSid': accountSid,
          'AuthToken': authToken,
          'Identity': userName,
          'Room': roomName,
          'Grant': {'video': {'room': roomName}},
        },
      );

      if (response.data != null) {
        _accessToken = response.data['token'] as String?;
        _isJoined = true;
      }
    } catch (e) {
      if (kDebugMode) print('Twilio join error: $e');
      rethrow;
    }
  }

  Future<void> leaveRoom() async {
    _isJoined = false;
    _accessToken = null;
    _heartbeatTimer?.cancel();
  }

  bool get isConnected => _isJoined;
  String? get accessToken => _accessToken;

  @override
  void dispose() {
    _heartbeatTimer?.cancel();
    _dio.close();
  }
}

mixin Disposable {
  void dispose() {}
}
