class SizeFormatter {
  static String formatBytes(int bytes) {
    if (bytes <= 0) return '0 B';
    const suffixes = ['B', 'KB', 'MB', 'GB', 'TB'];
    var i = (bytes.log10() / 3).floor();
    if (i >= suffixes.length) i = suffixes.length - 1;
    var size = bytes / pow(1024, i);
    return '${size.toStringAsFixed(2)} ${suffixes[i]}';
  }

  static String formatFileSize(double bytes) {
    if (bytes <= 0) return '0 B';
    const suffixes = ['B', 'KB', 'MB', 'GB'];
    var i = (bytes.log10() / 3).floor();
    if (i >= suffixes.length) i = suffixes.length - 1;
    var size = bytes / pow(1024, i);
    return '${size.toStringAsFixed(1)} ${suffixes[i]}';
  }
}

extension NumExtension on num {
  double get log10 => log(10);
}
