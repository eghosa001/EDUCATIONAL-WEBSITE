class CurrencyFormatter {
  static final CurrencyFormatter _instance = CurrencyFormatter._internal();
  factory CurrencyFormatter() => _instance;
  CurrencyFormatter._internal();

  static const String _currencySymbol = '₦';

  String format(double amount, {bool withSymbol = true}) {
    final formatted = NumberFormat('#,##0.00').format(amount);
    if (withSymbol) {
      return '${_currencySymbol}$formatted';
    }
    return formatted;
  }

  String formatCompact(double amount) {
    if (amount >= 1000000) {
      return '${_currencySymbol}${(amount / 1000000).toStringAsFixed(1)}M';
    } else if (amount >= 1000) {
      return '${_currencySymbol}${(amount / 1000).toStringAsFixed(1)}K';
    } else {
      return format(amount);
    }
  }

  String formatPercentage(double value, {int decimals = 0}) {
    return '${value.toStringAsFixed(decimals)}%';
  }
}
