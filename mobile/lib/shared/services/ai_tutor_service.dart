import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'api_config.dart';

class AiTutorResponse {
  final String content;
  final String sessionId;
  final int? tokensUsed;

  const AiTutorResponse({
    required this.content,
    required this.sessionId,
    this.tokensUsed,
  });

  factory AiTutorResponse.fromJson(Map<String, dynamic> json) {
    return AiTutorResponse(
      content: json['message']?['content'] ?? json['content'] ?? '',
      sessionId: json['sessionId'] ?? '',
      tokensUsed: json['tokensUsed'] as int?,
    );
  }
}

class AiTutorService {
  final String baseUrl;
  final Duration timeout;
  String? _token;
  String? _sessionId;

  AiTutorService({
    this.baseUrl = ApiConfig.baseUrl,
    this.timeout = const Duration(seconds: 30),
  });

  set token(String? newToken) {
    _token = newToken;
  }

  String? get sessionId => _sessionId;

  void setSessionId(String? id) {
    _sessionId = id;
  }

  Future<AiTutorResponse> chat({
    required String message,
    String? subjectId,
    String? topicId,
  }) async {
    final uri = Uri.parse('$baseUrl/ai/tutor');

    final messages = [
      {
        'role': 'user',
        'content': message,
      }
    ];

    final body = jsonEncode({
      'messages': messages,
      if (subjectId != null) 'subjectId': subjectId,
      if (topicId != null) 'topicId': topicId,
      if (_sessionId != null && _sessionId!.isNotEmpty) 'sessionId': _sessionId,
    });

    final request = http.Request('POST', uri)
      ..headers.addAll({
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      })
      ..body = body;

    final response = await request.timeout(timeout).send();
    final responseBody = await response.stream.bytesToString();

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final json = jsonDecode(responseBody) as Map<String, dynamic>;
      final data = json['data'] as Map<String, dynamic>? ?? json;
      return AiTutorResponse.fromJson(data);
    } else {
      Map<String, dynamic>? errorJson;
      try {
        errorJson = jsonDecode(responseBody) as Map<String, dynamic>;
      } catch (_) {}
      throw AiTutorException(
        statusCode: response.statusCode,
        message: errorJson?['error']?['message'] ?? 'Request failed',
        data: errorJson,
      );
    }
  }

  Future<List<AiTutorResponse>> chatStreaming({
    required String message,
    String? subjectId,
    String? topicId,
    void Function(String chunk)? onChunk,
    Future<void> Function()? onComplete,
  }) async {
    final uri = Uri.parse('$baseUrl/ai/tutor');

    final messages = [{'role': 'user', 'content': message}];

    final body = jsonEncode({
      'messages': messages,
      if (subjectId != null) 'subjectId': subjectId,
      if (topicId != null) 'topicId': topicId,
      if (_sessionId != null && _sessionId!.isNotEmpty) 'sessionId': _sessionId,
      'stream': true,
    });

    final request = http.Request('POST', uri)
      ..headers.addAll({
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      })
      ..body = body;

    final response = await request.timeout(timeout).send();
    final responseBody = await response.stream.bytesToString();

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final json = jsonDecode(responseBody) as Map<String, dynamic>;
      final data = json['data'] as Map<String, dynamic>? ?? json;
      if (onComplete != null) await onComplete();
      return [AiTutorResponse.fromJson(data)];
    } else {
      Map<String, dynamic>? errorJson;
      try {
        errorJson = jsonDecode(responseBody) as Map<String, dynamic>;
      } catch (_) {}
      throw AiTutorException(
        statusCode: response.statusCode,
        message: errorJson?['error']?['message'] ?? 'Streaming failed',
        data: errorJson,
      );
    }
  }

  Future<Map<String, dynamic>> getUsageStats() async {
    final uri = Uri.parse('$baseUrl/ai/usage');
    final response = await http.get(
      uri,
      headers: {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      },
    ).timeout(timeout);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final json = jsonDecode(response.body) as Map<String, dynamic>;
      return json['data'] as Map<String, dynamic>? ?? {};
    }
    return {};
  }

  void clearSession() {
    _sessionId = null;
  }
}

class AiTutorException implements Exception {
  final int? statusCode;
  final String message;
  final Map<String, dynamic>? data;

  const AiTutorException({
    this.statusCode,
    required this.message,
    this.data,
  });

  @override
  String toString() => 'AiTutorException: $message (Status: $statusCode)';
}
