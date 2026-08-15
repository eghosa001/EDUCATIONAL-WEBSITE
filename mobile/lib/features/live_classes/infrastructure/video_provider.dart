import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'jitsi_provider.dart';
import 'twilio_provider.dart';

class LiveVideoProvider extends StateNotifier<LiveVideoState> {
  final String classId;
  final String meetingUrl;
  final String? displayName;

  JitsiMeetProvider? _jitsiProvider;
  TwilioClient? _twilioClient;

  LiveVideoProvider({
    required this.classId,
    required this.meetingUrl,
    this.displayName,
  }) : super(const LiveVideoState.initial());

  Future<void> join() async {
    state = const LiveVideoState.loading();

    try {
      if (meetingUrl.contains('meet.jit.si')) {
        await _joinJitsi();
      } else if (meetingUrl.contains('twilio.com')) {
        await _joinTwilio();
      } else {
        await _openExternal(meetingUrl);
      }
    } catch (e) {
      state = LiveVideoState.error(e.toString());
    }
  }

  Future<void> _joinJitsi() async {
    _jitsiProvider = JitsiMeetProvider(
      roomName: classId,
      displayName: displayName,
    );
    _jitsiProvider?.join();
    state = const LiveVideoState.joined();
  }

  Future<void> _joinTwilio() async {
    _twilioClient = TwilioClient(
      accountSid: '',
      authToken: '',
      roomName: classId,
      userName: displayName ?? 'student',
    );
    await _twilioClient?.joinRoom();
    state = const LiveVideoState.joined();
  }

  Future<void> _openExternal(String url) async {
    state = LiveVideoState.external(url);
  }

  void leave() {
    _jitsiProvider?.leave();
    _twilioClient?.leaveRoom();
    state = const LiveVideoState.initial();
  }

  @override
  void dispose() {
    _jitsiProvider?.leave();
    _twilioClient?.dispose();
    super.dispose();
  }
}

class LiveVideoState {
  final bool isLoading;
  final bool isJoined;
  final String? error;
  final String? externalUrl;

  const LiveVideoState({
    this.isLoading = false,
    this.isJoined = false,
    this.error,
    this.externalUrl,
  });

  const LiveVideoState.initial() : this();
  const LiveVideoState.loading() : this(isLoading: true);
  const LiveVideoState.joined() : this(isJoined: true);
  const LiveVideoState.error(String message) : this(error: message);
  const LiveVideoState.external(String url) : this(externalUrl: url);

  LiveVideoState copyWith({
    bool? isLoading,
    bool? isJoined,
    String? error,
    String? externalUrl,
  }) {
    return LiveVideoState(
      isLoading: isLoading ?? this.isLoading,
      isJoined: isJoined ?? this.isJoined,
      error: error ?? this.error,
      externalUrl: externalUrl ?? this.externalUrl,
    );
  }
}

final liveVideoProvider =
    StateNotifierProvider<LiveVideoProvider, LiveVideoState>((ref) {
  throw UnimplementedError();
});
