import documentModel from '../models/document.model.js';
import { storageService } from '../../storage/services/storage.service.js';
import { supabaseAdmin } from '../../common/supabase/index.js';

export const documentService = {
  async listDocuments(params) {
    return documentModel.list(params);
  },

  async getDocument(id) {
    const doc = await documentModel.findById(id);
    if (!doc) return null;
    await documentModel.incrementView(id);
    return doc;
  },

  async getDocumentUrl(id) {
    const doc = await documentModel.findById(id);
    if (!doc) return null;

    let url = doc.file_url;
    if (supabaseAdmin) {
      const signedUrl = await storageService.getSupabaseSignedUrl(
        doc.bucket,
        doc.file_name,
        3600
      );
      if (signedUrl) url = signedUrl;
    }

    await documentModel.incrementDownload(id);
    return { ...doc, download_url: url };
  },

  async getBuckets() {
    return documentModel.getBuckets();
  },

  async getSubjects(bucket) {
    return documentModel.getSubjects(bucket);
  },

  async getYears(bucket) {
    return documentModel.getYears(bucket);
  },

  async searchDocuments(queryText, filters = {}) {
    return documentModel.list({ search: queryText, ...filters });
  },
};

export default documentService;
