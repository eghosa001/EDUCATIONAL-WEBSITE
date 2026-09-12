// Backwards-compatible import surface. The canonical implementation lives in
// core/storage so every repository, network interceptor, and app bootstrap uses
// the same singleton and the same secure token store.
export '../../../core/storage/storage_service.dart';
