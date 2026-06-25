import { createClient } from '@/components/9a6b39502e62';
import { redirect } from 'next/navigation';
import { FileText, Download, Calendar, User, File, Image as ImageIcon, Video, FileCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/c0ebd3fbafc6';
import { Button } from '@/components/2795b661f080';
import { Badge } from '@/components/30348591d689';
export default async function ClientDocumentsPage() {
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }
    // Fetch documents owned by the client or shared with them
    const { data: rawDocuments, error: documentsError } = await supabase
        .from('file_uploads')
        .select('*')
        .or(`owner_id.eq.${user.id},shared_with.cs.{${user.id}}`)
        .order('created_at', { ascending: false });
    const docOwnerIds = Array.from(new Set((rawDocuments ?? []).map((d) => d.owner_id).filter(Boolean)));
    const { data: docOwnerProfiles } = docOwnerIds.length
        ? await supabase.from('user_profiles').select('user_id, full_name').in('user_id', docOwnerIds)
        : { data: [] };
    const ownerNameById = new Map();
    docOwnerProfiles?.forEach((p) => ownerNameById.set(p.user_id, p.full_name));
    const documents = (rawDocuments ?? []).map((d) => ({
        ...d,
        owner: { id: d.owner_id, name: ownerNameById.get(d.owner_id) ?? '' },
    }));
    // Fetch worksheets from storage (if any exist)
    const { data: worksheets } = await supabase.storage
        .from('worksheets')
        .list(user.id, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
    });
    // Fetch recordings from sessions the client participated in
    const { data: rawSessionsForDocs } = await supabase
        .from('appointments')
        .select('id, scheduled_at, therapist_id')
        .eq('seeker_id', user.id)
        .eq('status', 'completed');
    const sessionTherapistIds = Array.from(new Set((rawSessionsForDocs ?? []).map((s) => s.therapist_id).filter(Boolean)));
    const { data: sessionTherapistProfiles } = sessionTherapistIds.length
        ? await supabase.from('user_profiles').select('user_id, full_name').in('user_id', sessionTherapistIds)
        : { data: [] };
    const sessionTherapistName = new Map();
    sessionTherapistProfiles?.forEach((p) => sessionTherapistName.set(p.user_id, p.full_name));
    const sessions = (rawSessionsForDocs ?? []).map((s) => ({
        ...s,
        therapist: { id: s.therapist_id, name: sessionTherapistName.get(s.therapist_id) ?? '' },
    }));
    const sessionIds = sessions?.map(s => s.id) || [];
    // Try to fetch recordings (if any exist)
    let recordings = [];
    if (sessionIds.length > 0) {
        const { data: recordingsData } = await supabase.storage
            .from('recordings')
            .list('', {
            limit: 100,
            sortBy: { column: 'created_at', order: 'desc' },
        });
        // Filter recordings that belong to client's sessions
        recordings = recordingsData?.filter(rec => {
            const sessionId = rec.name.split('/')[0];
            return sessionIds.includes(sessionId);
        }) || [];
    }
    // Group documents by type
    const documentsByType = {
        worksheet: documents?.filter(d => d.type === 'worksheet') || [],
        recording: documents?.filter(d => d.type === 'recording') || [],
        assessment: documents?.filter(d => d.type === 'assessment') || [],
        other: documents?.filter(d => !['worksheet', 'recording', 'assessment'].includes(d.type)) || [],
    };
    const totalDocuments = documents?.length || 0;
    const sharedDocuments = documents?.filter(d => d.owner_id !== user.id) || [];
    const getFileIcon = (mimeType, type) => {
        if (type === 'recording' || mimeType?.startsWith('video/')) {
            return <Video className="h-5 w-5"/>;
        }
        if (mimeType?.startsWith('image/')) {
            return <ImageIcon className="h-5 w-5"/>;
        }
        if (mimeType === 'application/pdf') {
            return <FileText className="h-5 w-5"/>;
        }
        return <File className="h-5 w-5"/>;
    };
    const formatFileSize = (bytes) => {
        if (bytes < 1024)
            return `${bytes} B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };
    const getDownloadUrl = async (document) => {
        // For documents table entries
        if (document.file_url) {
            // Check if it's a storage path or full URL
            if (document.file_url.startsWith('http')) {
                return document.file_url;
            }
            // Extract bucket and path from file_url
            const parts = document.file_url.split('/');
            if (parts.length >= 2) {
                const bucket = parts[0];
                const path = parts.slice(1).join('/');
                const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
                return data?.signedUrl || document.file_url;
            }
        }
        return null;
    };
    return (<div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
        <p className="text-gray-600 mt-2">
          Access your worksheets, recordings, and shared documents
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              All your documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shared with Me</CardTitle>
            <User className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sharedDocuments.length}</div>
            <p className="text-xs text-muted-foreground">
              Documents from therapists
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Worksheets</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentsByType.worksheet.length}</div>
            <p className="text-xs text-muted-foreground">
              Therapy worksheets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      {totalDocuments === 0 ? (<Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-gray-400 mb-4"/>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-600 text-center max-w-md">
              Your therapist will share documents, worksheets, and recordings here. 
              Check back after your sessions!
            </p>
          </CardContent>
        </Card>) : (<div className="space-y-6">
          {/* Worksheets */}
          {documentsByType.worksheet.length > 0 && (<div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5"/>
                Worksheets
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documentsByType.worksheet.map((doc) => {
                    const owner = doc.owner;
                    return (<Card key={doc.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                              {getFileIcon(doc.mime_type, doc.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm font-semibold truncate">
                                {doc.file_name}
                              </CardTitle>
                              <CardDescription className="text-xs mt-1">
                                {formatFileSize(doc.file_size_bytes)}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3"/>
                              <span>
                                {new Date(doc.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {doc.owner_id !== user.id && owner && (<div className="flex items-center gap-1">
                                <User className="h-3 w-3"/>
                                <span className="truncate max-w-[100px]">{owner.name}</span>
                              </div>)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {doc.type}
                            </Badge>
                            {doc.owner_id !== user.id && (<Badge variant="outline" className="text-xs">
                                Shared
                              </Badge>)}
                          </div>
                          <form action={`/api/documents/${doc.id}/download`} method="GET">
                            <Button type="submit" variant="outline" size="sm" className="w-full">
                              <Download className="h-4 w-4 mr-2"/>
                              Download
                            </Button>
                          </form>
                        </div>
                      </CardContent>
                    </Card>);
                })}
              </div>
            </div>)}

          {/* Recordings */}
          {documentsByType.recording.length > 0 && (<div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Video className="h-5 w-5"/>
                Session Recordings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documentsByType.recording.map((doc) => {
                    const owner = doc.owner;
                    const session = sessions?.find(s => s.id === doc.related_id);
                    return (<Card key={doc.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Video className="h-5 w-5 text-purple-600"/>
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm font-semibold truncate">
                                {doc.file_name}
                              </CardTitle>
                              <CardDescription className="text-xs mt-1">
                                {formatFileSize(doc.file_size_bytes)}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {session && (<div className="text-xs text-gray-600">
                              Session: {new Date(session.scheduled_at).toLocaleDateString()}
                            </div>)}
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3"/>
                              <span>
                                {new Date(doc.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {owner && (<div className="flex items-center gap-1">
                                <User className="h-3 w-3"/>
                                <span className="truncate max-w-[100px]">{owner.name}</span>
                              </div>)}
                          </div>
                          <form action={`/api/documents/${doc.id}/download`} method="GET">
                            <Button type="submit" variant="outline" size="sm" className="w-full">
                              <Download className="h-4 w-4 mr-2"/>
                              Download
                            </Button>
                          </form>
                        </div>
                      </CardContent>
                    </Card>);
                })}
              </div>
            </div>)}

          {/* Assessments */}
          {documentsByType.assessment.length > 0 && (<div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileCheck className="h-5 w-5"/>
                Assessments
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documentsByType.assessment.map((doc) => {
                    const owner = doc.owner;
                    return (<Card key={doc.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              {getFileIcon(doc.mime_type, doc.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm font-semibold truncate">
                                {doc.file_name}
                              </CardTitle>
                              <CardDescription className="text-xs mt-1">
                                {formatFileSize(doc.file_size_bytes)}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3"/>
                              <span>
                                {new Date(doc.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {owner && doc.owner_id !== user.id && (<div className="flex items-center gap-1">
                                <User className="h-3 w-3"/>
                                <span className="truncate max-w-[100px]">{owner.name}</span>
                              </div>)}
                          </div>
                          <form action={`/api/documents/${doc.id}/download`} method="GET">
                            <Button type="submit" variant="outline" size="sm" className="w-full">
                              <Download className="h-4 w-4 mr-2"/>
                              Download
                            </Button>
                          </form>
                        </div>
                      </CardContent>
                    </Card>);
                })}
              </div>
            </div>)}

          {/* Other Documents */}
          {documentsByType.other.length > 0 && (<div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <File className="h-5 w-5"/>
                Other Documents
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documentsByType.other.map((doc) => {
                    const owner = doc.owner;
                    return (<Card key={doc.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              {getFileIcon(doc.mime_type, doc.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm font-semibold truncate">
                                {doc.file_name}
                              </CardTitle>
                              <CardDescription className="text-xs mt-1">
                                {formatFileSize(doc.file_size_bytes)}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3"/>
                              <span>
                                {new Date(doc.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {owner && doc.owner_id !== user.id && (<div className="flex items-center gap-1">
                                <User className="h-3 w-3"/>
                                <span className="truncate max-w-[100px]">{owner.name}</span>
                              </div>)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {doc.type}
                            </Badge>
                            {doc.owner_id !== user.id && (<Badge variant="outline" className="text-xs">
                                Shared
                              </Badge>)}
                          </div>
                          <form action={`/api/documents/${doc.id}/download`} method="GET">
                            <Button type="submit" variant="outline" size="sm" className="w-full">
                              <Download className="h-4 w-4 mr-2"/>
                              Download
                            </Button>
                          </form>
                        </div>
                      </CardContent>
                    </Card>);
                })}
              </div>
            </div>)}
        </div>)}
    </div>);
}
