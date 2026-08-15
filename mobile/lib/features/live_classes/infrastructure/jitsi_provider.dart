import 'package:flutter/material.dart';
import 'package:jitsi_meet_flutter_sdk/jitsi_meet_flutter_sdk.dart';

class JitsiMeetProvider implements IV JMMeetinDelegate {
  final String roomName;
  final String? displayName;
  final Map<String, dynamic>? config;

  JitsiMeetProvider({
    required this.roomName,
    this.displayName,
    this.config,
  });

  void join() {
    final options = JitsiMeetConferenceOptions(
      serverURL: Uri.parse('https://meet.jit.si'),
      room: roomName,
      subject: displayName,
      config: {
        'startWithAudioMuted': true,
        'disableDeepLinking': true,
        ...?config,
      },
      featureFlags: {
        'unidentified-call-supported': true,
        'whiteboard.enabled': false,
      },
    );

    JitsiMeet.joinConference(options);
  }

  void leave() {
    JitsiMeet.removeAllListeners();
  }

  @override
  void onConferenceWillJoin(JitsiMeetConferenceJoined data) {}

  @override
  void onConferenceJoined(JitsiMeetConferenceJoined data) {}

  @override
  void onConferenceTerminated(JitsiMeetConferenceTerminated data) {}

  @override
  void onAudioLevelChanged(JitsiMeetAudioLevel data) {}

  @override
  void onParticipantJoined(JitsiMeetParticipantJoined data) {}

  @override
  void onParticipantLeft(JitsiMeetParticipantLeft data) {}

  @override
  void onReadyToClose() {}
}
