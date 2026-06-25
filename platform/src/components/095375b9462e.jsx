'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Reorder } from 'framer-motion';
import { ChevronDown, ChevronRight, FileText, GripVertical, Plus, Settings, Video } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/2795b661f080';
import { Input } from '@/components/c2f62fb0cb5e';
import { Textarea } from '@/components/e1d2ad49fd73';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/93bde5168d2a';
import { ScrollArea } from '@/components/272a16f1043e';
import { MarkdownRichEditor } from '@/components/2c2fbfd94c04';
import { FileDropzone } from '@/components/c845945df973';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/1712d8a01fd3';
import { cn } from '@/components/98e56006aa84';
import { Switch } from '@/components/395ec797588e';
import { toast } from 'sonner';
import { createClient } from '@/components/e7335a071b71';
import { getInitialCourseEditorTab, normalizeAssignmentRow, normalizeCourseEditorPatient, toImageBlockPayload, } from '@/components/e53799cc4cba';
import { useCourseEditorStore, } from '@/components/141101afa946';
export function CourseEditor({ courseId, initialCourse, }) {
    const saving = useCourseEditorStore((s) => s.saving);
    const err = useCourseEditorStore((s) => s.error);
    const title = useCourseEditorStore((s) => s.title);
    const description = useCourseEditorStore((s) => s.description);
    const isPublished = useCourseEditorStore((s) => s.isPublished);
    const thumbnailPath = useCourseEditorStore((s) => s.thumbnailPath);
    const modules = useCourseEditorStore((s) => s.modules);
    const collapsed = useCourseEditorStore((s) => s.collapsedByModuleId);
    const selectedLessonId = useCourseEditorStore((s) => s.selectedLessonId);
    const selected = useMemo(() => {
        if (!selectedLessonId)
            return null;
        for (const m of modules) {
            const lesson = m.lessons.find((l) => l.id === selectedLessonId);
            if (lesson)
                return { module: m, lesson };
        }
        return null;
    }, [modules, selectedLessonId]);
    const lessonData = useCourseEditorStore((s) => selectedLessonId ? s.lessonDataByLessonId[selectedLessonId] : undefined);
    const blocks = lessonData?.blocks ?? [];
    const blocksLoading = lessonData?.blocksLoading ?? false;
    // Use `lessonData?.blocksOrderDirty` directly where needed (avoids unused var lint)
    const assessments = lessonData?.assessments ?? [];
    const assessmentsLoading = lessonData?.assessmentsLoading ?? false;
    const patients = useCourseEditorStore((s) => s.patients);
    const patientsLoading = useCourseEditorStore((s) => s.patientsLoading);
    const courseAssignments = useCourseEditorStore((s) => s.courseAssignments);
    const assignmentsLoading = useCourseEditorStore((s) => s.assignmentsLoading);
    const setSaving = useCourseEditorStore((s) => s.setSaving);
    const setErr = useCourseEditorStore((s) => s.setError);
    const setTitle = useCourseEditorStore((s) => s.setTitle);
    const setDescription = useCourseEditorStore((s) => s.setDescription);
    const setIsPublished = useCourseEditorStore((s) => s.setIsPublished);
    const setThumbnailPath = useCourseEditorStore((s) => s.setThumbnailPath);
    const setModules = useCourseEditorStore((s) => s.setModules);
    const toggleModuleCollapsed = useCourseEditorStore((s) => s.toggleModuleCollapsed);
    const setSelectedLessonId = useCourseEditorStore((s) => s.setSelectedLessonId);
    const addModuleLocal = useCourseEditorStore((s) => s.addModule);
    const addLessonLocal = useCourseEditorStore((s) => s.addLesson);
    const updateLessonVideoPath = useCourseEditorStore((s) => s.updateLessonVideoPath);
    const ensureLessonData = useCourseEditorStore((s) => s.ensureLessonData);
    const setBlocksLoading = useCourseEditorStore((s) => s.setBlocksLoading);
    const setAssessmentsLoading = useCourseEditorStore((s) => s.setAssessmentsLoading);
    const setBlocks = useCourseEditorStore((s) => s.setBlocks);
    const setAssessments = useCourseEditorStore((s) => s.setAssessments);
    const reorderBlocksLocal = useCourseEditorStore((s) => s.reorderBlocksLocal);
    const setBlocksOrderDirty = useCourseEditorStore((s) => s.setBlocksOrderDirty);
    const updateBlockMarkdownLocal = useCourseEditorStore((s) => s.updateBlockMarkdownLocal);
    const addBlockLocal = useCourseEditorStore((s) => s.addBlockLocal);
    const deleteBlockLocal = useCourseEditorStore((s) => s.deleteBlockLocal);
    const setPatients = useCourseEditorStore((s) => s.setPatients);
    const setPatientsLoading = useCourseEditorStore((s) => s.setPatientsLoading);
    const setCourseAssignments = useCourseEditorStore((s) => s.setCourseAssignments);
    const setAssignmentsLoading = useCourseEditorStore((s) => s.setAssignmentsLoading);
    const setBaselineAfterSavingModuleOrder = useCourseEditorStore((s) => s.setBaselineAfterSavingModuleOrder);
    const setBaselineAfterSavingLessonOrder = useCourseEditorStore((s) => s.setBaselineAfterSavingLessonOrder);
    const baselineModuleOrderKey = useCourseEditorStore((s) => s.baselineModuleOrderKey);
    // baseline lesson order is stored in Zustand; currently only used for persistence decisions
    const [assignClientId, setAssignClientId] = useState('');
    const [activeTab, setActiveTab] = useState('content');
    useEffect(() => {
        useCourseEditorStore.getState().hydrate(courseId, initialCourse);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId]);
    useEffect(() => {
        setActiveTab(getInitialCourseEditorTab(window.location.hash));
    }, []);
    const modulesDirty = useMemo(() => {
        const ids = modules
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((m) => m.id)
            .join(',');
        return ids !== baselineModuleOrderKey;
    }, [modules, baselineModuleOrderKey]);
    // Tracks whether user changed block order via drag (UI hint only)
    const blocksDirtyRef = useRef(false);
    // Debounced markdown autosave (per block)
    const markdownSaveTimersRef = useRef({});
    const [markdownSavingByBlockId, setMarkdownSavingByBlockId] = useState({});
    const [markdownSavedAtByBlockId, setMarkdownSavedAtByBlockId] = useState({});
    const uploadToSignedUrl = async (upload, file) => {
        const supabase = createClient();
        const { error } = await supabase.storage
            .from(upload.bucket)
            .uploadToSignedUrl(upload.path, upload.token, file, {
            contentType: file.type || undefined,
        });
        if (error)
            throw new Error(error.message || 'Storage upload failed');
    };
    const loadLessonData = async (lessonId) => {
        setErr(null);
        ensureLessonData(lessonId);
        setBlocksLoading(lessonId, true);
        setAssessmentsLoading(lessonId, true);
        try {
            const blocksController = new AbortController();
            const assessmentsController = new AbortController();
            const blocksTimeout = window.setTimeout(() => blocksController.abort(), 12_000);
            const assessmentsTimeout = window.setTimeout(() => assessmentsController.abort(), 12_000);
            const [blocksRes, assessmentsRes] = await Promise.all([
                fetch(`/api/therapist/courses/${courseId}/lessons/${lessonId}/blocks`, {
                    cache: 'no-store',
                    signal: blocksController.signal,
                }).finally(() => window.clearTimeout(blocksTimeout)),
                fetch(`/api/therapist/courses/${courseId}/lessons/${lessonId}/assessments`, {
                    cache: 'no-store',
                    signal: assessmentsController.signal,
                }).finally(() => window.clearTimeout(assessmentsTimeout)),
            ]);
            const blocksJson = await blocksRes.json();
            if (!blocksRes.ok)
                throw new Error(blocksJson?.error || 'Failed to load blocks');
            setBlocks(lessonId, (blocksJson?.blocks ?? []));
            const assessJson = await assessmentsRes.json();
            if (!assessmentsRes.ok)
                throw new Error(assessJson?.error || 'Failed to load assessments');
            setAssessments(lessonId, (assessJson?.assessments ?? []));
        }
        catch (e) {
            if (e instanceof DOMException && e.name === 'AbortError') {
                setErr('Loading timed out. Please try again.');
            }
            else {
                setErr(e instanceof Error ? e.message : 'Failed to load lesson data');
            }
        }
        finally {
            setBlocksLoading(lessonId, false);
            setAssessmentsLoading(lessonId, false);
            blocksDirtyRef.current = false;
        }
    };
    const loadAssignmentData = async () => {
        setPatientsLoading(true);
        setAssignmentsLoading(true);
        try {
            const [patientsRes, assignmentsRes] = await Promise.all([
                fetch('/api/therapist/patients', { cache: 'no-store' }),
                fetch(`/api/therapist/courses/${courseId}/assignments`, { cache: 'no-store' }),
            ]);
            const patientsJson = await patientsRes.json();
            if (patientsRes.ok) {
                const rows = (patientsJson?.patients ?? []);
                setPatients(rows
                    .map(normalizeCourseEditorPatient)
                    .filter((p) => p.id && p.name));
            }
            const assignmentsJson = await assignmentsRes.json();
            if (assignmentsRes.ok) {
                setCourseAssignments((assignmentsJson?.assignments ?? []).map(normalizeAssignmentRow));
            }
        }
        finally {
            setPatientsLoading(false);
            setAssignmentsLoading(false);
        }
    };
    useEffect(() => {
        void loadAssignmentData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId]);
    useEffect(() => {
        if (!selectedLessonId)
            return;
        // cache: if we already loaded blocks+assessments for this lesson, don't refetch automatically
        const existing = useCourseEditorStore.getState().lessonDataByLessonId[selectedLessonId];
        if (existing?.blocksLoadedAt && existing?.assessmentsLoadedAt)
            return;
        void loadLessonData(selectedLessonId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLessonId]);
    const saveCourse = async () => {
        setErr(null);
        const t = title.trim();
        if (!t) {
            setErr('Title is required');
            return;
        }
        try {
            setSaving(true);
            const res = await fetch(`/api/therapist/courses/${courseId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: t,
                    description: description.trim() || null,
                }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.error || 'Failed to save');
            toast.success('Saved.');
        }
        catch (e) {
            setErr(e instanceof Error ? e.message : 'Failed to save');
        }
        finally {
            setSaving(false);
        }
    };
    const togglePublish = async () => {
        setErr(null);
        try {
            setSaving(true);
            const next = !isPublished;
            setIsPublished(next);
            const res = await fetch(`/api/therapist/courses/${courseId}/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPublished: next }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.error || 'Failed to update publish status');
            toast.success(next ? 'Published.' : 'Unpublished.');
        }
        catch (e) {
            // revert optimistic toggle
            setIsPublished(!isPublished);
            setErr(e instanceof Error ? e.message : 'Failed to publish');
        }
        finally {
            setSaving(false);
        }
    };
    const addModule = async (moduleTitle) => {
        setErr(null);
        const t = moduleTitle.trim();
        if (!t)
            return;
        try {
            setSaving(true);
            const res = await fetch(`/api/therapist/courses/${courseId}/modules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: t }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.error || 'Failed to create module');
            const created = data?.module;
            if (created?.id) {
                addModuleLocal({
                    id: created.id,
                    title: created.title || t,
                    position: typeof created.position === 'number' ? created.position : modules.length,
                    status: 'draft',
                    publishedAt: null,
                    lessons: [],
                });
                toast.success('Module added.');
            }
            else {
                toast.success('Module added.');
            }
        }
        catch (e) {
            setErr(e instanceof Error ? e.message : 'Failed to create module');
        }
        finally {
            setSaving(false);
        }
    };
    const addLesson = async (moduleId, lessonTitle, isPreview) => {
        setErr(null);
        const t = lessonTitle.trim();
        if (!t)
            return;
        try {
            setSaving(true);
            const res = await fetch(`/api/therapist/courses/${courseId}/lessons`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ moduleId, title: t, isPreview }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.error || 'Failed to create lesson');
            const created = (data?.lesson ?? null);
            if (created?.id) {
                const nextLesson = {
                    id: String(created.id),
                    title: String(created.title || t),
                    position: Number.isFinite(created.position) ? Number(created.position) : 0,
                    isPreview: Boolean(created.isPreview ?? created.is_preview ?? isPreview),
                    videoPath: (created.videoPath ?? created.video_path ?? null),
                    status: (created.status ?? 'draft'),
                    publishedAt: (created.publishedAt ?? created.published_at ?? null),
                };
                addLessonLocal(moduleId, nextLesson);
                toast.success('Lesson added.');
            }
            else {
                toast.success('Lesson added.');
            }
        }
        catch (e) {
            setErr(e instanceof Error ? e.message : 'Failed to create lesson');
        }
        finally {
            setSaving(false);
        }
    };
    const saveModuleOrder = async () => {
        setErr(null);
        try {
            setSaving(true);
            // two-pass to avoid unique(course_id, position) conflicts
            await Promise.all(modules.map((m, idx) => fetch(`/api/therapist/courses/${courseId}/modules/${m.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ position: 1000 + idx }),
            })));
            await Promise.all(modules.map((m, idx) => fetch(`/api/therapist/courses/${courseId}/modules/${m.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ position: idx }),
            })));
            setModules(modules.map((m, idx) => ({ ...m, position: idx })).slice().sort((a, b) => a.position - b.position));
            setBaselineAfterSavingModuleOrder();
            toast.success('Module order saved.');
        }
        catch (e) {
            setErr(e instanceof Error ? e.message : 'Failed to reorder modules');
        }
        finally {
            setSaving(false);
        }
    };
    const saveLessonOrder = async (moduleId, nextLessons) => {
        setErr(null);
        try {
            setSaving(true);
            await Promise.all(nextLessons.map((l, idx) => fetch(`/api/therapist/courses/${courseId}/lessons/${l.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ position: 1000 + idx }),
            })));
            await Promise.all(nextLessons.map((l, idx) => fetch(`/api/therapist/courses/${courseId}/lessons/${l.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ position: idx }),
            })));
            setModules(modules.map((m) => m.id === moduleId ? { ...m, lessons: nextLessons.map((l, idx) => ({ ...l, position: idx })) } : m));
            setBaselineAfterSavingLessonOrder(moduleId);
            toast.success('Lesson order saved.');
        }
        catch (e) {
            setErr(e instanceof Error ? e.message : 'Failed to reorder lessons');
        }
        finally {
            setSaving(false);
        }
    };
    const uploadVideo = async (lessonId, file) => {
        setErr(null);
        try {
            setSaving(true);
            const res = await fetch(`/api/therapist/courses/${courseId}/lessons/${lessonId}/upload-video`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: file.name,
                    fileSize: file.size,
                    mimeType: file.type,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || `Server error: ${res.status}`);
            const upload = data?.upload;
            if (!upload?.bucket || !upload.path || !upload.token || !upload.storagePath) {
                throw new Error('Upload did not return signed storage details');
            }
            await uploadToSignedUrl(upload, file);
            const saveRes = await fetch(`/api/therapist/courses/${courseId}/lessons/${lessonId}/upload-video`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storagePath: upload.storagePath }),
            });
            const saveData = await saveRes.json().catch(() => ({}));
            if (!saveRes.ok)
                throw new Error(saveData?.error || `Server error: ${saveRes.status}`);
            const lesson = (saveData?.lesson ?? null);
            const nextVideoPath = (lesson?.videoPath ?? lesson?.video_path ?? null);
            updateLessonVideoPath(lessonId, nextVideoPath);
            toast.success('Video uploaded.');
        }
        catch (e) {
            setErr(e instanceof Error ? e.message : 'Failed to upload');
        }
        finally {
            setSaving(false);
        }
    };
    const uploadThumbnail = async (file) => {
        setErr(null);
        try {
            setSaving(true);
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch(`/api/therapist/courses/${courseId}/thumbnail`, {
                method: 'POST',
                body: fd,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || `Server error: ${res.status}`);
            setThumbnailPath(data?.thumbnailPath ?? null);
            toast.success('Featured image updated.');
        }
        catch (e) {
            setErr(e instanceof Error ? e.message : 'Failed to upload featured image');
        }
        finally {
            setSaving(false);
        }
    };
    const removeThumbnail = async () => {
        setErr(null);
        try {
            setSaving(true);
            const res = await fetch(`/api/therapist/courses/${courseId}/thumbnail`, { method: 'DELETE' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || `Server error: ${res.status}`);
            setThumbnailPath(null);
            toast.success('Featured image removed.');
        }
        catch (e) {
            setErr(e instanceof Error ? e.message : 'Failed to remove featured image');
        }
        finally {
            setSaving(false);
        }
    };
    const createMarkdownBlock = async () => {
        if (!selectedLessonId)
            return;
        setErr(null);
        try {
            setSaving(true);
            const res = await fetch(`/api/therapist/courses/${courseId}/lessons/${selectedLessonId}/blocks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'markdown', payload: { markdown: '' }, position: blocks.length }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || `Server error: ${res.status}`);
            addBlockLocal(selectedLessonId, data.block);
            toast.success('Block added.');
        }
        catch (e) {
            setErr(e instanceof Error ? e.message : 'Failed to create block');
        }
        finally {
            setSaving(false);
        }
    };
    const persistBlocksOrder = async (ordered) => {
        if (!selectedLessonId)
            return;
        setErr(null);
        try {
            setSaving(true);
            await Promise.all(ordered.map((b, idx) => fetch(`/api/therapist/courses/${courseId}/lessons/${selectedLessonId}/blocks/${b.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ position: 1000 + idx }),
            })));
            await Promise.all(ordered.map((b, idx) => fetch(`/api/therapist/courses/${courseId}/lessons/${selectedLessonId}/blocks/${b.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ position: idx }),
            })));
            blocksDirtyRef.current = false;
            setBlocksOrderDirty(selectedLessonId, false);
            toast.success('Block order saved.');
        }
        catch (e) {
            setErr(e instanceof Error ? e.message : 'Failed to reorder blocks');
        }
        finally {
            setSaving(false);
        }
    };
    const updateBlockMarkdown = async (blockId, markdown) => {
        if (!selectedLessonId)
            return;
        updateBlockMarkdownLocal(selectedLessonId, blockId, markdown);
        blocksDirtyRef.current = true;
        const existingTimer = markdownSaveTimersRef.current[blockId];
        if (typeof existingTimer === 'number')
            window.clearTimeout(existingTimer);
        setMarkdownSavingByBlockId((prev) => ({ ...prev, [blockId]: true }));
        markdownSaveTimersRef.current[blockId] = window.setTimeout(async () => {
            try {
                const res = await fetch(`/api/therapist/courses/${courseId}/lessons/${selectedLessonId}/blocks/${blockId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ payload: { markdown } }),
                });
                const data = await res.json();
                if (!res.ok)
                    throw new Error(data?.error || 'Failed to save');
                // keep optimistic content; server response may include other fields (status, updated payload)
                if (data?.block?.id) {
                    setBlocks(selectedLessonId, blocks.map((b) => (b.id === blockId ? data.block : b)));
                }
                setMarkdownSavedAtByBlockId((prev) => ({ ...prev, [blockId]: Date.now() }));
            }
            catch (e) {
                setErr(e instanceof Error ? e.message : 'Failed to save block');
            }
            finally {
                setMarkdownSavingByBlockId((prev) => ({ ...prev, [blockId]: false }));
            }
        }, 700);
    };
    const updateImageBlockPayload = async (blockId, payload) => {
        if (!selectedLessonId)
            return;
        setErr(null);
        try {
            setSaving(true);
            const res = await fetch(`/api/therapist/courses/${courseId}/lessons/${selectedLessonId}/blocks/${blockId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payload }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.error || 'Failed to save image block');
            if (data?.block?.id) {
                setBlocks(selectedLessonId, blocks.map((b) => (b.id === blockId ? data.block : b)));
            }
            toast.success('Image block saved.');
        }
        catch (e) {
            setErr(e instanceof Error ? e.message : 'Failed to save image block');
        }
        finally {
            setSaving(false);
        }
    };
    const uploadAssetAndInsert = async (blockId, kind, file) => {
        if (!selectedLessonId)
            return;
        setErr(null);
        try {
            setSaving(true);
            const res = await fetch(`/api/therapist/courses/${courseId}/lessons/${selectedLessonId}/upload-asset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: file.name,
                    fileSize: file.size,
                    mimeType: file.type,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data?.error || `Server error: ${res.status}`);
            const asset = data?.upload;
            if (!asset?.bucket || !asset.path || !asset.token || !asset.storagePath) {
                throw new Error('Upload did not return signed storage details');
            }
            await uploadToSignedUrl(asset, file);
            const url = `/api/courses/${courseId}/lessons/${selectedLessonId}/asset?path=${encodeURIComponent(asset.storagePath)}`;
            const snippet = kind === 'image'
                ? `\n\n![${asset.fileName}](${url})\n`
                : `\n\n[${asset.fileName}](${url})\n`;
            const current = String(blocks.find((b) => b.id === blockId)?.payload?.markdown ?? '');
            await updateBlockMarkdown(blockId, `${current}${snippet}`);
        }
        catch (e) {
            setErr(e instanceof Error ? e.message : 'Failed to upload asset');
        }
        finally {
            setSaving(false);
        }
    };
    const deleteBlock = async (blockId) => {
        if (!selectedLessonId)
            return;
        setErr(null);
        try {
            setSaving(true);
            const res = await fetch(`/api/therapist/courses/${courseId}/lessons/${selectedLessonId}/blocks/${blockId}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.error || 'Failed to delete');
            deleteBlockLocal(selectedLessonId, blockId);
            toast.success('Block deleted.');
        }
        catch (e) {
            setErr(e instanceof Error ? e.message : 'Failed to delete block');
        }
        finally {
            setSaving(false);
        }
    };
    return (<div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="rounded-2xl border bg-white">
        <div className="border-b p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-medium text-gray-500">Course</div>
              <div className="mt-1 line-clamp-2 text-lg font-semibold text-gray-900">{title || 'Untitled course'}</div>
              <div className="mt-2 text-xs text-gray-600">{isPublished ? 'Published' : 'Draft'}</div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={saveCourse} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button size="sm" onClick={togglePublish} disabled={saving}>
                {isPublished ? 'Unpublish' : 'Publish'}
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <div>
              <label htmlFor="course-title" className="text-sm font-medium text-gray-900">
                Title
              </label>
              <Input id="course-title" value={title} onChange={(e) => setTitle(e.target.value)}/>
            </div>
            <div>
              <label htmlFor="course-description" className="text-sm font-medium text-gray-900">
                Description
              </label>
              <Textarea id="course-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3}/>
            </div>
            <div>
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-gray-900">Featured image</label>
                {thumbnailPath ? (<Button variant="outline" size="sm" disabled={saving} onClick={removeThumbnail}>
                    Remove
                  </Button>) : null}
              </div>
              {thumbnailPath ? (<div className="mt-2 overflow-hidden rounded-lg border">
                  <div className="relative h-36 w-full">
                    <Image src={`/api/therapist/courses/${courseId}/thumbnail`} alt="Course featured" fill unoptimized className="object-cover" sizes="(max-width: 1024px) 100vw, 380px"/>
                  </div>
                </div>) : (<div className="mt-2 rounded-lg border border-dashed bg-gray-50 px-4 py-6 text-center text-xs text-gray-500">
                  Upload a landscape image (recommended 1600×900).
                </div>)}
              <div className="mt-3">
                <FileDropzone accept="image/*" disabled={saving} hint="PNG or JPG up to 10MB." className="py-5" onFile={uploadThumbnail}/>
              </div>
            </div>
            {err ? (<div className="text-sm text-red-600" role="alert" aria-live="polite">
                {err}
              </div>) : null}
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">Outline</div>
              <div className="mt-1 text-xs text-gray-600">Drag to reorder modules and lessons.</div>
            </div>
            <div className="flex items-center gap-2">
              {modulesDirty ? (<Button variant="outline" size="sm" onClick={saveModuleOrder} disabled={saving}>
                  Save order
                </Button>) : null}
            </div>
          </div>

          <div className="mt-4 rounded-xl border">
            <ScrollArea className="h-[540px]">
              <div className="p-2">
                <AddModuleRow onAdd={addModule} disabled={saving}/>

                {modules.length === 0 ? (<div className="p-4 text-sm text-gray-600">No modules yet.</div>) : (<Reorder.Group axis="y" values={modules} onReorder={setModules} className="space-y-2">
                    {modules.map((m) => (<Reorder.Item key={m.id} value={m} className="rounded-lg border bg-white">
                        <div className="flex items-center gap-2 p-2">
                          <button type="button" className="rounded p-1 text-gray-600 hover:bg-gray-100" onClick={() => toggleModuleCollapsed(m.id)} aria-label={`Toggle module ${m.title}`} aria-expanded={!collapsed[m.id]}>
                            {collapsed[m.id] ? <ChevronRight className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                          </button>
                          <span className="inline-flex" aria-hidden="true">
                            <GripVertical className="h-4 w-4 text-gray-400"/>
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-gray-900">{m.title}</div>
                            <div className="mt-0.5 text-xs text-gray-500">
                              {m.lessons.length} lesson{m.lessons.length === 1 ? '' : 's'}
                            </div>
                          </div>
                        </div>

                        {collapsed[m.id] ? null : (<div className="border-t bg-gray-50 p-2">
                            <AddLessonRow moduleId={m.id} onAdd={addLesson} disabled={saving}/>
                            <LessonList module={m} selectedLessonId={selectedLessonId} onSelectLesson={setSelectedLessonId} disabled={saving} onReorder={(next) => {
                        setModules(modules.map((x) => (x.id === m.id ? { ...x, lessons: next } : x)));
                    }} onSaveOrder={(next) => saveLessonOrder(m.id, next)}/>
                          </div>)}
                      </Reorder.Item>))}
                  </Reorder.Group>)}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white">
        <div className="border-b p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-medium text-gray-500">Lesson</div>
              <div className="mt-1 truncate text-lg font-semibold text-gray-900">{selected?.lesson.title ?? 'Select a lesson'}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                {selected?.lesson.isPreview ? (<span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">Preview</span>) : (<span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">Paid</span>)}
                {selected?.lesson.status ? (<span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{selected.lesson.status}</span>) : null}
              </div>
            </div>
            <Button variant="outline" size="sm" disabled={!selectedLessonId || saving} onClick={() => selectedLessonId && void loadLessonData(selectedLessonId)}>
              Refresh
            </Button>
          </div>
        </div>

        {!selectedLessonId ? (<div className="p-10 text-center text-sm text-gray-600">Pick a lesson from the outline to start editing.</div>) : (<Tabs value={activeTab} onValueChange={setActiveTab} className="p-5">
            <TabsList>
              <TabsTrigger value="content" className="gap-2">
                <FileText className="h-4 w-4"/>
                Content
              </TabsTrigger>
              <TabsTrigger value="video" className="gap-2">
                <Video className="h-4 w-4"/>
                Video
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4"/>
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Lesson content</div>
                  <div className="mt-1 text-xs text-gray-600">Markdown blocks render for learners. Other block types are enabled after uploads are configured.</div>
                </div>
                <Button size="sm" disabled={saving} onClick={() => void createMarkdownBlock()}>
                  <Plus className="mr-2 h-4 w-4"/>
                  Add markdown
                </Button>
              </div>

              <div className="mt-4">
                {blocksLoading ? (<div className="rounded-xl border bg-gray-50 p-6 text-sm text-gray-600" role="status" aria-live="polite">
                    Loading blocks…
                  </div>) : err ? (<div className="rounded-xl border bg-rose-50 p-6 text-sm text-rose-800" role="alert" aria-live="polite">
                    <div className="font-medium">Couldn’t load lesson content.</div>
                    <div className="mt-1 text-rose-700">{err}</div>
                    <div className="mt-4">
                      <Button variant="outline" size="sm" disabled={saving} onClick={() => void loadLessonData(selectedLessonId)}>
                        Retry
                      </Button>
                    </div>
                  </div>) : blocks.length === 0 ? (<div className="rounded-xl border bg-gray-50 p-6 text-sm text-gray-600" aria-live="polite">
                    No blocks yet.
                  </div>) : (<Reorder.Group axis="y" values={blocks} onReorder={(next) => {
                    if (selectedLessonId)
                        reorderBlocksLocal(selectedLessonId, next);
                    blocksDirtyRef.current = true;
                }} className="space-y-3">
                    {blocks.map((b) => (<Reorder.Item key={b.id} value={b} className="rounded-xl border">
                        <div className="flex items-center justify-between gap-3 border-b bg-white p-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex" aria-hidden="true">
                              <GripVertical className="h-4 w-4 text-gray-400"/>
                            </span>
                            <div className="text-sm font-semibold text-gray-900">{b.type}</div>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{b.status}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {b.type === 'markdown' ? (<div className="text-xs text-gray-500">
                                {markdownSavingByBlockId[b.id]
                            ? 'Saving…'
                            : markdownSavedAtByBlockId[b.id]
                                ? 'Saved'
                                : ''}
                              </div>) : null}
                            <Button variant="outline" size="sm" disabled={saving} onClick={() => void deleteBlock(b.id)}>
                              Delete
                            </Button>
                          </div>
                        </div>
                        <div className="p-3">
                          {b.type === 'markdown' ? (<div className="space-y-3">
                              <div className="flex flex-wrap gap-2">
                                <label className="inline-flex">
                                  <input type="file" accept="image/*" className="hidden" disabled={saving} onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file)
                                return;
                            void uploadAssetAndInsert(b.id, 'image', file);
                            e.currentTarget.value = '';
                        }}/>
                                  <Button variant="outline" size="sm" disabled={saving} aria-label="Upload image and insert into markdown" onClick={(e) => e.currentTarget.parentElement?.querySelector('input')?.click()}>
                                    Upload image
                                  </Button>
                                </label>
                                <label className="inline-flex">
                                  <input type="file" className="hidden" disabled={saving} onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file)
                                return;
                            void uploadAssetAndInsert(b.id, 'file', file);
                            e.currentTarget.value = '';
                        }}/>
                                  <Button variant="outline" size="sm" disabled={saving} aria-label="Upload file and insert into markdown" onClick={(e) => e.currentTarget.parentElement?.querySelector('input')?.click()}>
                                    Upload file
                                  </Button>
                                </label>
                              </div>

                              <MarkdownRichEditor value={String(b.payload?.markdown ?? '')} disabled={saving} onChange={(next) => void updateBlockMarkdown(b.id, next)}/>
                            </div>) : b.type === 'image' ? (<ImageBlockEditor payload={b.payload ?? {}} disabled={saving} onSave={(payload) => void updateImageBlockPayload(b.id, payload)}/>) : (<div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                              This block type is not editable in the builder yet. Current payload:{' '}
                              <span className="font-mono">{JSON.stringify(b.payload ?? {})}</span>
                            </div>)}
                        </div>
                      </Reorder.Item>))}
                  </Reorder.Group>)}

                {blocks.length > 1 && blocksDirtyRef.current ? (<div className="mt-4 flex justify-end">
                    <Button variant="outline" disabled={saving} onClick={() => void persistBlocksOrder(blocks)}>
                      Save block order
                    </Button>
                  </div>) : null}
              </div>
            </TabsContent>

            <TabsContent value="video" className="mt-5">
              <div className="rounded-xl border bg-white p-4">
                <div className="text-sm font-semibold text-gray-900">Video upload</div>
                <div className="mt-1 text-xs text-gray-600">Uploads to the private Supabase Storage bucket `course-media`.</div>
                <div className="mt-4">
                  <div className="mb-3 text-sm text-gray-700">
                    {selected?.lesson.videoPath ? (<span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">Video uploaded</span>) : (<span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">No video</span>)}
                  </div>
                  <FileDropzone accept="video/*" disabled={saving} hint="MP4/WebM recommended. Max 1GB." onFile={(file) => uploadVideo(selectedLessonId, file)}/>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <div className="text-sm font-semibold text-gray-900">Preview access</div>
                  <div className="mt-1 text-xs text-gray-600">Preview lessons show to non-purchasers.</div>
                  <div className="mt-3">
                    <Button variant="outline" size="sm" disabled={saving} onClick={async () => {
                setErr(null);
                try {
                    setSaving(true);
                    const res = await fetch(`/api/therapist/courses/${courseId}/lessons/${selectedLessonId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isPreview: !selected?.lesson.isPreview }),
                    });
                    const data = await res.json();
                    if (!res.ok)
                        throw new Error(data?.error || 'Failed to update lesson');
                    useCourseEditorStore.getState().updateLesson(selectedLessonId, { isPreview: !selected?.lesson.isPreview });
                    toast.success('Lesson updated.');
                }
                catch (e) {
                    setErr(e instanceof Error ? e.message : 'Failed to update lesson');
                }
                finally {
                    setSaving(false);
                }
            }}>
                      {selected?.lesson.isPreview ? 'Make paid-only' : 'Make preview'}
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border p-4">
                  <div className="text-sm font-semibold text-gray-900">Publish state</div>
                  <div className="mt-1 text-xs text-gray-600">Only published lessons render to clients.</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {['draft', 'published', 'archived'].map((s) => (<Button key={s} size="sm" variant={selected?.lesson.status === s ? 'default' : 'outline'} disabled={saving} onClick={async () => {
                    setErr(null);
                    try {
                        setSaving(true);
                        const res = await fetch(`/api/therapist/courses/${courseId}/lessons/${selectedLessonId}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: s }),
                        });
                        const data = await res.json();
                        if (!res.ok)
                            throw new Error(data?.error || 'Failed to update lesson');
                        useCourseEditorStore.getState().updateLesson(selectedLessonId, { status: s });
                        toast.success('Lesson updated.');
                    }
                    catch (e) {
                        setErr(e instanceof Error ? e.message : 'Failed to update lesson');
                    }
                    finally {
                        setSaving(false);
                    }
                }}>
                        {s}
                      </Button>))}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl border p-4">
                <div className="text-sm font-semibold text-gray-900">Assessments</div>
                <div className="mt-1 text-xs text-gray-600">MCQ assessments are managed via the lesson assessment endpoints.</div>
                <div className="mt-4">
                  {assessmentsLoading ? (<div className="text-sm text-gray-600">Loading assessments…</div>) : assessments.length === 0 ? (<div className="text-sm text-gray-600">No assessments yet.</div>) : (<div className="space-y-3">
                      {assessments.map((a) => (<div key={a.id} className="rounded-lg border bg-gray-50 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-gray-900">{a.title}</div>
                              <div className="mt-1 text-xs text-gray-600">
                                {a.status} · Passing {a.passing_score ?? '—'}%
                              </div>
                            </div>
                            <Button size="sm" variant="outline" disabled={saving} onClick={async () => {
                        setErr(null);
                        try {
                            setSaving(true);
                            const res = await fetch(`/api/therapist/courses/${courseId}/lessons/${selectedLessonId}/assessments/${a.id}`, { method: 'DELETE' });
                            const data = await res.json();
                            if (!res.ok)
                                throw new Error(data?.error || 'Failed to delete assessment');
                            await loadLessonData(selectedLessonId);
                        }
                        catch (e) {
                            setErr(e instanceof Error ? e.message : 'Failed to delete assessment');
                        }
                        finally {
                            setSaving(false);
                        }
                    }}>
                              Delete
                            </Button>
                          </div>
                        </div>))}
                    </div>)}
                </div>

                <div className="mt-4">
                  <Button size="sm" disabled={saving} onClick={async () => {
                setErr(null);
                try {
                    setSaving(true);
                    const res = await fetch(`/api/therapist/courses/${courseId}/lessons/${selectedLessonId}/assessments`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: 'Quiz', passingScore: 70 }),
                    });
                    const data = await res.json();
                    if (!res.ok)
                        throw new Error(data?.error || 'Failed to create assessment');
                    await loadLessonData(selectedLessonId);
                }
                catch (e) {
                    setErr(e instanceof Error ? e.message : 'Failed to create assessment');
                }
                finally {
                    setSaving(false);
                }
            }}>
                    <Plus className="mr-2 h-4 w-4"/>
                    Add assessment
                  </Button>
                </div>
              </div>

              <div id="assignments" className="mt-6 scroll-mt-24 rounded-xl border p-4">
                <div className="text-sm font-semibold text-gray-900">Assign course to a client</div>
                <div className="mt-1 text-xs text-gray-600">
                  Assignments grant access without purchase. You can only assign to clients you&apos;ve had sessions with.
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="sm:w-[360px]">
                    <Select value={assignClientId} onValueChange={setAssignClientId} disabled={saving || patientsLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder={patientsLoading ? 'Loading clients…' : 'Select a client'}/>
                      </SelectTrigger>
                      <SelectContent>
                        {patients.length === 0 ? (<SelectItem value="__none" disabled>
                            No clients found
                          </SelectItem>) : (patients.map((p) => (<SelectItem key={p.id} value={p.id}>
                              {p.name} {p.email ? `(${p.email})` : ''}
                            </SelectItem>)))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button disabled={saving || !assignClientId || assignClientId === '__none'} onClick={async () => {
                if (!assignClientId || assignClientId === '__none')
                    return;
                setErr(null);
                try {
                    setSaving(true);
                    const res = await fetch(`/api/therapist/courses/${courseId}/assignments`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ clientId: assignClientId }),
                    });
                    const data = await res.json();
                    if (!res.ok)
                        throw new Error(data?.error || 'Failed to assign');
                    setAssignClientId('');
                    await loadAssignmentData();
                }
                catch (e) {
                    setErr(e instanceof Error ? e.message : 'Failed to assign course');
                }
                finally {
                    setSaving(false);
                }
            }}>
                    Assign
                  </Button>
                </div>

                <div className="mt-5">
                  <div className="text-xs font-medium text-gray-600">Current assignments</div>
                  {assignmentsLoading ? (<div className="mt-2 text-sm text-gray-600">Loading assignments…</div>) : courseAssignments.length === 0 ? (<div className="mt-2 text-sm text-gray-600">No assignments yet.</div>) : (<div className="mt-3 space-y-2">
                      {courseAssignments.map((a) => {
                    const row = a;
                    const id = String(row.id ?? '');
                    const name = String(row.clientName ?? row.clientId ?? '');
                    const status = String(row.status ?? '');
                    const assignedAt = row.assigned_at;
                    const assignedText = typeof assignedAt === 'string' && assignedAt
                        ? new Date(assignedAt).toLocaleDateString()
                        : '—';
                    return (<div key={id} className="flex flex-col gap-2 rounded-lg border bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-gray-900">{name}</div>
                              <div className="mt-1 text-xs text-gray-600">
                                {status} · assigned {assignedText}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" disabled={saving || !id} onClick={async () => {
                            if (!id)
                                return;
                            setErr(null);
                            try {
                                setSaving(true);
                                const res = await fetch(`/api/therapist/courses/${courseId}/assignments/${id}`, {
                                    method: 'DELETE',
                                });
                                const data = await res.json();
                                if (!res.ok)
                                    throw new Error(data?.error || 'Failed to remove assignment');
                                await loadAssignmentData();
                            }
                            catch (e) {
                                setErr(e instanceof Error ? e.message : 'Failed to remove assignment');
                            }
                            finally {
                                setSaving(false);
                            }
                        }}>
                                Remove
                              </Button>
                            </div>
                          </div>);
                })}
                    </div>)}
                </div>
              </div>
            </TabsContent>
          </Tabs>)}
      </div>
    </div>);
}
function ImageBlockEditor({ payload, disabled, onSave, }) {
    const imageUrl = String(payload.url ?? payload.src ?? '');
    const [alt, setAlt] = useState(String(payload.alt ?? ''));
    const [caption, setCaption] = useState(String(payload.caption ?? ''));
    return (<div className="space-y-3 rounded-lg border bg-gray-50 p-4">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={alt || 'Course lesson image'} className="max-h-72 w-full rounded-md border bg-white object-contain"/>) : (<div className="rounded-md border border-dashed bg-white p-6 text-center text-sm text-gray-500">
          This image block has no URL.
        </div>)}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Alt text</label>
          <Input value={alt} onChange={(e) => setAlt(e.target.value)} disabled={disabled}/>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Caption</label>
          <Input value={caption} onChange={(e) => setCaption(e.target.value)} disabled={disabled}/>
        </div>
      </div>
      <div className="flex justify-end">
        <Button size="sm" variant="outline" disabled={disabled} onClick={() => onSave(toImageBlockPayload(payload, { alt, caption }))}>
          Save image details
        </Button>
      </div>
    </div>);
}
function AddModuleRow({ onAdd, disabled }) {
    const [newTitle, setNewTitle] = useState('');
    return (<div className="mb-2 rounded-lg border bg-gray-50 p-2">
      <div className="flex items-center gap-2">
        <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="New module…" disabled={disabled} className="h-9" aria-label="New module title"/>
        <Button size="sm" disabled={disabled} onClick={() => {
            const t = newTitle.trim();
            if (!t)
                return;
            void onAdd(t).then(() => setNewTitle(''));
        }}>
          <Plus className="mr-2 h-4 w-4"/>
          Add
        </Button>
      </div>
    </div>);
}
function AddLessonRow({ moduleId, onAdd, disabled, }) {
    const [title, setTitle] = useState('');
    const [isPreview, setIsPreview] = useState(false);
    return (<div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => {
            if (e.key !== 'Enter')
                return;
            const t = title.trim();
            if (!t)
                return;
            e.preventDefault();
            void onAdd(moduleId, t, isPreview).then(() => {
                setTitle('');
                setIsPreview(false);
            });
        }} placeholder="New lesson…" disabled={disabled} className="h-9 sm:flex-1" aria-label="New lesson title"/>
      <div className="flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 sm:py-0 sm:h-9">
        <span className="text-xs font-medium text-gray-700">{isPreview ? 'Preview' : 'Paid'}</span>
        <Switch checked={isPreview} onCheckedChange={setIsPreview} disabled={disabled} aria-label="Toggle preview access for new lesson"/>
      </div>
      <Button size="sm" disabled={disabled} onClick={() => {
            const t = title.trim();
            if (!t)
                return;
            void onAdd(moduleId, t, isPreview).then(() => {
                setTitle('');
                setIsPreview(false);
            });
        }}>
        Add
      </Button>
    </div>);
}
function LessonList({ module, selectedLessonId, onSelectLesson, disabled, onReorder, onSaveOrder, }) {
    const [dirty, setDirty] = useState(false);
    return (<div className="space-y-2">
      <Reorder.Group axis="y" values={module.lessons} onReorder={(next) => {
            onReorder(next);
            setDirty(true);
        }} className="space-y-2">
        {module.lessons.map((l) => (<Reorder.Item key={l.id} value={l} className={cn('group flex items-center gap-2 rounded-lg border bg-white p-2', selectedLessonId === l.id ? 'border-blue-200 bg-blue-50' : 'hover:bg-gray-50')}>
            <span className="inline-flex" aria-hidden="true">
              <GripVertical className="h-4 w-4 text-gray-300 group-hover:text-gray-400"/>
            </span>
            <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onSelectLesson(l.id)} disabled={disabled}>
              <div className="truncate text-sm font-medium text-gray-900">{l.title}</div>
              <div className="mt-0.5 text-xs text-gray-600">
                {l.isPreview ? 'Preview' : 'Paid'} · {l.status ?? 'draft'}
              </div>
            </button>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">{l.videoPath ? 'Video' : '—'}</span>
            <div className="ml-1 flex flex-col gap-1">
              <Button type="button" variant="outline" size="icon" className="h-7 w-7" disabled={disabled} aria-label={`Move lesson ${l.title} up`} onClick={() => {
                const idx = module.lessons.findIndex((x) => x.id === l.id);
                if (idx <= 0)
                    return;
                const next = module.lessons.slice();
                const [item] = next.splice(idx, 1);
                next.splice(idx - 1, 0, item);
                onReorder(next.map((x, i) => ({ ...x, position: i })));
                setDirty(true);
            }}>
                <span aria-hidden="true">↑</span>
              </Button>
              <Button type="button" variant="outline" size="icon" className="h-7 w-7" disabled={disabled} aria-label={`Move lesson ${l.title} down`} onClick={() => {
                const idx = module.lessons.findIndex((x) => x.id === l.id);
                if (idx < 0 || idx >= module.lessons.length - 1)
                    return;
                const next = module.lessons.slice();
                const [item] = next.splice(idx, 1);
                next.splice(idx + 1, 0, item);
                onReorder(next.map((x, i) => ({ ...x, position: i })));
                setDirty(true);
            }}>
                <span aria-hidden="true">↓</span>
              </Button>
            </div>
          </Reorder.Item>))}
      </Reorder.Group>

      {dirty && module.lessons.length > 1 ? (<div className="flex justify-end">
          <Button variant="outline" size="sm" disabled={disabled} onClick={() => void onSaveOrder(module.lessons).then(() => setDirty(false))}>
            Save lesson order
          </Button>
        </div>) : null}
    </div>);
}
