'use client';

import { useEffect, useState } from 'react';
import { Award, Download, Calendar, User } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';

export default function CertificatesPage() {
  const { token } = useAuthStore();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch('/api/certificates/my', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setCertificates(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
        <p className="text-gray-500 mt-1">Your earned certificates and achievements</p>
      </div>

      {certificates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No certificates yet</h3>
          <p className="text-gray-500 text-sm">Complete courses to earn certificates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certificates.map(cert => (
            <div key={cert.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-100 to-amber-200 flex items-center justify-center">
                  <Award className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{cert.courseTitle || 'Course'}</h3>
                  <p className="text-sm text-gray-500 mt-1">Certificate ID: {cert.certificateId || cert.certificate_id || 'N/A'}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(cert.issuedAt || cert.issued_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {cert.studentName || 'Student'}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                  <Download className="w-4 h-4" /> Download
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  Share
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
