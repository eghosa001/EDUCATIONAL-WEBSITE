import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

class EduButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final Color? color;
  final Color? textColor;
  final double? width;
  final double? height;
  final bool isLoading;
  final IconData? icon;
  final bool isOutlined;
  final bool isDisabled;

  const EduButton({
    super.key,
    required this.label,
    this.onPressed,
    this.color,
    this.textColor,
    this.width,
    this.height,
    this.isLoading = false,
    this.icon,
    this.isOutlined = false,
    this.isDisabled = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isEnabled = onPressed != null && !isLoading && !isDisabled;

    return SizedBox(
      width: width ?? double.infinity,
      height: height ?? 52,
      child: isOutlined
          ? OutlinedButton(
              onPressed: isEnabled ? onPressed : null,
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: color ?? theme.colorScheme.primary),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _buildChild(theme),
            )
          : ElevatedButton(
              onPressed: isEnabled ? onPressed : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: isDisabled
                    ? theme.colorScheme.onSurface.withOpacity(0.3)
                    : color ?? theme.colorScheme.primary,
                foregroundColor: isDisabled
                    ? Colors.white.withOpacity(0.5)
                    : textColor ?? Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _buildChild(theme),
            ),
    );
  }

  Widget _buildChild(ThemeData theme) {
    if (isLoading) {
      return SizedBox(
        height: 20,
        width: 20,
        child: CircularProgressIndicator(
          strokeWidth: 2,
          valueColor: AlwaysStoppedAnimation(
            textColor ?? Colors.white,
          ),
        ),
      );
    }
    if (icon != null) {
      return Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 20),
          const SizedBox(width: 8),
          Text(
            label,
            style: theme.textTheme.titleMedium?.copyWith(
              color: isDisabled
                  ? Colors.white.withOpacity(0.5)
                  : textColor ?? Colors.white,
            ),
          ),
        ],
      );
    }
    return Text(
      label,
      style: theme.textTheme.titleMedium?.copyWith(
        color: isDisabled
            ? Colors.white.withOpacity(0.5)
            : textColor ?? Colors.white,
      ),
    );
  }
}

class EduTextFormField extends StatefulWidget {
  final String labelText;
  final String? hintText;
  final String? initialValue;
  final IconData? prefixIcon;
  final IconData? suffixIcon;
  final VoidCallback? onSuffixIconPressed;
  final bool obscureText;
  final bool enabled;
  final int? maxLength;
  final int? maxLines;
  final int? minLines;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;
  final ValueChanged<String>? onChanged;
  final TextInputAction? textInputAction;
  final FocusNode? focusNode;
  final AutovalidateMode autovalidateMode;
  final Color? fillColor;
  final Color? borderColor;
  final Color? focusedBorderColor;

  const EduTextFormField({
    super.key,
    required this.labelText,
    this.hintText,
    this.initialValue,
    this.prefixIcon,
    this.suffixIcon,
    this.onSuffixIconPressed,
    this.obscureText = false,
    this.enabled = true,
    this.maxLength,
    this.maxLines = 1,
    this.minLines,
    this.keyboardType,
    this.validator,
    this.onChanged,
    this.textInputAction,
    this.focusNode,
    this.autovalidateMode = AutovalidateMode.onUserInteraction,
    this.fillColor,
    this.borderColor,
    this.focusedBorderColor,
  });

  @override
  State<EduTextFormField> createState() => _EduTextFormFieldState();
}

class _EduTextFormFieldState extends State<EduTextFormField> {
  late TextEditingController _controller;
  late FocusNode _focusNode;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialValue);
    _focusNode = widget.focusNode ?? FocusNode();
  }

  @override
  void dispose() {
    if (widget.focusNode == null) {
      _focusNode.dispose();
    }
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return TextFormField(
      controller: _controller,
      focusNode: _focusNode,
      obscureText: widget.obscureText,
      enabled: widget.enabled,
      maxLength: widget.maxLength,
      maxLines: widget.maxLines,
      minLines: widget.minLines,
      keyboardType: widget.keyboardType,
      textInputAction: widget.textInputAction,
      validator: widget.validator,
      onChanged: widget.onChanged,
      autovalidateMode: widget.autovalidateMode,
      decoration: InputDecoration(
        labelText: widget.labelText,
        hintText: widget.hintText,
        prefixIcon: widget.prefixIcon != null
            ? Icon(widget.prefixIcon, color: theme.colorScheme.onSurfaceVariant)
            : null,
        suffixIcon: widget.suffixIcon != null
            ? IconButton(
                icon: Icon(widget.suffixIcon, color: theme.colorScheme.onSurfaceVariant),
                onPressed: widget.onSuffixIconPressed,
              )
            : null,
        filled: widget.fillColor != null,
        fillColor: widget.fillColor,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: widget.borderColor ?? Colors.grey.shade300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: widget.borderColor ?? Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(
            color: widget.focusedBorderColor ?? theme.colorScheme.primary,
            width: 2,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Colors.red),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Colors.red, width: 2),
        ),
      ),
    );
  }
}

class EduCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final VoidCallback? onTap;
  final Color? color;
  final double? elevation;
  final BorderRadius? borderRadius;

  const EduCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.onTap,
    this.color,
    this.elevation,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      color: color ?? theme.colorScheme.surface,
      elevation: elevation ?? theme.cardTheme.elevation,
      shape: RoundedRectangleBorder(
        borderRadius: borderRadius ?? theme.cardTheme.shape ?? BorderRadius.circular(12),
      ),
      margin: margin ?? theme.cardTheme.margin ?? const EdgeInsets.all(0),
      child: InkWell(
        onTap: onTap,
        borderRadius: borderRadius ?? theme.cardTheme.shape?.borderRadius as BorderRadius?,
        child: Padding(
          padding: padding ?? const EdgeInsets.all(16),
          child: child,
        ),
      ),
    );
  }
}

class EduShimmer extends StatelessWidget {
  final Widget child;
  final Color? baseColor;
  final Color? highlightColor;

  const EduShimmer({
    super.key,
    required this.child,
    this.baseColor,
    this.highlightColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Shimmer.fromColors(
      baseColor: baseColor ?? theme.colorScheme.onSurface.withOpacity(0.1),
      highlightColor: highlightColor ?? theme.colorScheme.onSurface.withOpacity(0.2),
      child: child,
    );
  }
}

class EduShimmerLine extends StatelessWidget {
  final double? width;
  final double height;
  final double borderRadius;
  final EdgeInsetsGeometry? margin;

  const EduShimmerLine({
    super.key,
    this.width,
    this.height = 16,
    this.borderRadius = 8,
    this.margin,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      margin: margin,
      decoration: BoxDecoration(
        color: Colors.grey.shade300,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    );
  }
}

class EduShimmerCircle extends StatelessWidget {
  final double size;
  final double borderRadius;

  const EduShimmerCircle({
    super.key,
    this.size = 40,
    this.borderRadius = 20,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: Colors.grey.shade300,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    );
  }
}

class EduEmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;

  const EduEmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 64,
              color: theme.colorScheme.onSurface.withOpacity(0.3),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: theme.textTheme.titleMedium?.copyWith(
                color: theme.colorScheme.onSurface,
              ),
              textAlign: TextAlign.center,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
              Text(
                subtitle!,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
            ],
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 16),
              EduButton(
                label: actionLabel!,
                onPressed: onAction,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class EduLoadingOverlay extends StatelessWidget {
  final String message;

  const EduLoadingOverlay({
    super.key,
    this.message = 'Loading...',
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black.withOpacity(0.5),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            Text(
              message,
              style: const TextStyle(color: Colors.white, fontSize: 16),
            ),
          ],
        ),
      ),
    );
  }
}

class EduChip extends StatelessWidget {
  final String label;
  final IconData? icon;
  final Color? backgroundColor;
  final Color? textColor;
  final VoidCallback? onTap;
  final bool isSelected;

  const EduChip({
    super.key,
    required this.label,
    this.icon,
    this.backgroundColor,
    this.textColor,
    this.onTap,
    this.isSelected = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? (backgroundColor ?? theme.colorScheme.primary)
              : (backgroundColor ?? theme.colorScheme.surfaceContainerHighest),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 16, color: textColor ?? theme.colorScheme.onSurface),
              const SizedBox(width: 4),
            ],
            Text(
              label,
              style: theme.textTheme.labelLarge?.copyWith(
                color: textColor ?? theme.colorScheme.onSurface,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class EduBadge extends StatelessWidget {
  final String label;
  final Color? backgroundColor;
  final Color? textColor;
  final IconData? icon;

  const EduBadge({
    super.key,
    required this.label,
    this.backgroundColor,
    this.textColor,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor ?? theme.colorScheme.primaryContainer,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: textColor ?? theme.colorScheme.onPrimaryContainer),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: theme.textTheme.labelSmall?.copyWith(
              color: textColor ?? theme.colorScheme.onPrimaryContainer,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class EduProgressBar extends StatelessWidget {
  final double progress;
  final double height;
  final Color? color;
  final Color? backgroundColor;
  final BorderRadius? borderRadius;

  const EduProgressBar({
    super.key,
    required this.progress,
    this.height = 8,
    this.color,
    this.backgroundColor,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ClipRRect(
      borderRadius: borderRadius ?? BorderRadius.circular(4),
      child: LinearProgressIndicator(
        value: progress.clamp(0.0, 1.0),
        minHeight: height,
        backgroundColor: backgroundColor ?? theme.colorScheme.surfaceContainerHighest,
        valueColor: AlwaysStoppedAnimation(color ?? theme.colorScheme.primary),
      ),
    );
  }
}

class EduDivider extends StatelessWidget {
  final double thickness;
  final Color? color;
  final double indent;
  final double endIndent;

  const EduDivider({
    super.key,
    this.thickness = 1,
    this.color,
    this.indent = 0,
    this.endIndent = 0,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Divider(
      thickness: thickness,
      color: color ?? theme.dividerTheme.color ?? Colors.grey.shade200,
      indent: indent,
      endIndent: endIndent,
    );
  }
}
