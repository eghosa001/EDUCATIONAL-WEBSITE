import 'package:intl/intl.dart';
import 'dart:math';

class DateFormatter {
  static final _instance = DateFormatter._internal();
  factory DateFormatter() => _instance;
  DateFormatter._internal();

  static const List<String> _days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  static const List<String> _months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  String fullDate(DateTime dateTime) {
    return DateFormat('EEEE, MMMM d, yyyy').format(dateTime);
  }

  String shortDate(DateTime dateTime) {
    return DateFormat('MMM d, yyyy').format(dateTime);
  }

  String timeOnly(DateTime dateTime) {
    return DateFormat('h:mm a').format(dateTime);
  }

  String dateTimeCombined(DateTime dateTime) {
    return DateFormat('MMM d, yyyy h:mm a').format(dateTime);
  }

  String relativeTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inSeconds < 60) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      final minutes = difference.inMinutes;
      return '$minutes ${minutes == 1 ? 'minute' : 'minutes'} ago';
    } else if (difference.inHours < 24) {
      final hours = difference.inHours;
      return '$hours ${hours == 1 ? 'hour' : 'hours'} ago';
    } else if (difference.inDays < 7) {
      final days = difference.inDays;
      return '$days ${days == 1 ? 'day' : 'days'} ago';
    } else if (difference.inDays < 30) {
      final weeks = (difference.inDays / 7).floor();
      return '$weeks ${weeks == 1 ? 'week' : 'weeks'} ago';
    } else if (difference.inDays < 365) {
      final months = (difference.inDays / 30).floor();
      return '$months ${months == 1 ? 'month' : 'months'} ago';
    } else {
      final years = (difference.inDays / 365).floor();
      return '$years ${years == 1 ? 'year' : 'years'} ago';
    }
  }

  String dayName(DateTime dateTime) {
    return _days[dateTime.weekday - 1];
  }

  String monthName(DateTime dateTime) {
    return _months[dateTime.month - 1];
  }

  String formatStudyTime(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);

    if (hours > 0 && minutes > 0) {
      return '${hours}h ${minutes}m';
    } else if (hours > 0) {
      return '${hours}h';
    } else {
      return '${minutes}m';
    }
  }

  String formatExamDuration(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);

    if (hours > 0) {
      return '${hours}h ${minutes.toString().padLeft(2, '0')}m';
    } else {
      return '${minutes}m';
    }
  }
}
