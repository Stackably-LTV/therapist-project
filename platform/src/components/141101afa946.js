import { create } from 'zustand';
function moduleOrderKey(mods) {
    return mods
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((m) => m.id)
        .join(',');
}
function lessonOrderKey(lessons) {
    return lessons
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((l) => l.id)
        .join(',');
}
function defaultLessonData() {
    return {
        blocks: [],
        blocksLoading: false,
        blocksLoadedAt: null,
        blocksOrderDirty: false,
        assessments: [],
        assessmentsLoading: false,
        assessmentsLoadedAt: null,
    };
}
export const useCourseEditorStore = create((set, get) => ({
    courseId: null,
    title: '',
    description: '',
    isPublished: false,
    thumbnailPath: null,
    modules: [],
    collapsedByModuleId: {},
    selectedLessonId: null,
    patients: [],
    patientsLoading: false,
    courseAssignments: [],
    assignmentsLoading: false,
    lessonDataByLessonId: {},
    saving: false,
    error: null,
    baselineModuleOrderKey: '',
    baselineLessonOrderKeyByModuleId: {},
    getFirstLessonId() {
        const mods = get().modules;
        for (const m of mods) {
            if (m.lessons.length > 0)
                return m.lessons[0].id;
        }
        return null;
    },
    getSelected() {
        const lessonId = get().selectedLessonId;
        if (!lessonId)
            return null;
        for (const m of get().modules) {
            const lesson = m.lessons.find((l) => l.id === lessonId);
            if (lesson)
                return { module: m, lesson };
        }
        return null;
    },
    hydrate(courseId, course) {
        const selectedLessonId = get().selectedLessonId;
        const first = (() => {
            for (const m of course.modules ?? []) {
                if (m.lessons.length > 0)
                    return m.lessons[0].id;
            }
            return null;
        })();
        const baselineLessonOrderKeyByModuleId = {};
        for (const m of course.modules ?? []) {
            baselineLessonOrderKeyByModuleId[m.id] = lessonOrderKey(m.lessons);
        }
        set({
            courseId,
            title: course.title,
            description: course.description || '',
            isPublished: course.isPublished,
            thumbnailPath: course.thumbnailPath,
            modules: (course.modules ?? []).slice().sort((a, b) => a.position - b.position),
            baselineModuleOrderKey: moduleOrderKey(course.modules ?? []),
            baselineLessonOrderKeyByModuleId,
            selectedLessonId: selectedLessonId ?? first,
            error: null,
        });
    },
    setTitle(title) {
        set({ title });
    },
    setDescription(description) {
        set({ description });
    },
    setIsPublished(value) {
        set({ isPublished: value });
    },
    setThumbnailPath(value) {
        set({ thumbnailPath: value });
    },
    setSaving(value) {
        set({ saving: value });
    },
    setError(value) {
        set({ error: value });
    },
    setSelectedLessonId(lessonId) {
        set({ selectedLessonId: lessonId });
    },
    toggleModuleCollapsed(moduleId) {
        set((state) => ({
            collapsedByModuleId: {
                ...state.collapsedByModuleId,
                [moduleId]: !state.collapsedByModuleId[moduleId],
            },
        }));
    },
    setModules(modules) {
        set({ modules });
    },
    addModule(module) {
        set((state) => ({
            modules: [...state.modules, module].sort((a, b) => a.position - b.position),
            collapsedByModuleId: { ...state.collapsedByModuleId, [module.id]: false },
        }));
    },
    addLesson(moduleId, lesson) {
        set((state) => ({
            modules: state.modules.map((m) => {
                if (m.id !== moduleId)
                    return m;
                return { ...m, lessons: [...m.lessons, lesson].sort((a, b) => a.position - b.position) };
            }),
            collapsedByModuleId: { ...state.collapsedByModuleId, [moduleId]: false },
            selectedLessonId: lesson.id,
        }));
    },
    updateLesson(lessonId, updates) {
        set((state) => ({
            modules: state.modules.map((m) => ({
                ...m,
                lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, ...updates } : l)),
            })),
        }));
    },
    updateLessonVideoPath(lessonId, videoPath) {
        get().updateLesson(lessonId, { videoPath });
    },
    setBaselineAfterSavingModuleOrder() {
        const mods = get().modules;
        set({ baselineModuleOrderKey: moduleOrderKey(mods) });
    },
    setBaselineAfterSavingLessonOrder(moduleId) {
        const mod = get().modules.find((m) => m.id === moduleId);
        if (!mod)
            return;
        set((state) => ({
            baselineLessonOrderKeyByModuleId: {
                ...state.baselineLessonOrderKeyByModuleId,
                [moduleId]: lessonOrderKey(mod.lessons),
            },
        }));
    },
    ensureLessonData(lessonId) {
        set((state) => {
            if (state.lessonDataByLessonId[lessonId])
                return state;
            return {
                lessonDataByLessonId: {
                    ...state.lessonDataByLessonId,
                    [lessonId]: defaultLessonData(),
                },
            };
        });
    },
    setBlocksLoading(lessonId, value) {
        get().ensureLessonData(lessonId);
        set((state) => ({
            lessonDataByLessonId: {
                ...state.lessonDataByLessonId,
                [lessonId]: {
                    ...state.lessonDataByLessonId[lessonId],
                    blocksLoading: value,
                },
            },
        }));
    },
    setAssessmentsLoading(lessonId, value) {
        get().ensureLessonData(lessonId);
        set((state) => ({
            lessonDataByLessonId: {
                ...state.lessonDataByLessonId,
                [lessonId]: {
                    ...state.lessonDataByLessonId[lessonId],
                    assessmentsLoading: value,
                },
            },
        }));
    },
    setBlocks(lessonId, blocks) {
        get().ensureLessonData(lessonId);
        set((state) => ({
            lessonDataByLessonId: {
                ...state.lessonDataByLessonId,
                [lessonId]: {
                    ...state.lessonDataByLessonId[lessonId],
                    blocks,
                    blocksLoadedAt: Date.now(),
                    blocksOrderDirty: false,
                },
            },
        }));
    },
    setAssessments(lessonId, assessments) {
        get().ensureLessonData(lessonId);
        set((state) => ({
            lessonDataByLessonId: {
                ...state.lessonDataByLessonId,
                [lessonId]: {
                    ...state.lessonDataByLessonId[lessonId],
                    assessments,
                    assessmentsLoadedAt: Date.now(),
                },
            },
        }));
    },
    setBlocksOrderDirty(lessonId, value) {
        get().ensureLessonData(lessonId);
        set((state) => ({
            lessonDataByLessonId: {
                ...state.lessonDataByLessonId,
                [lessonId]: {
                    ...state.lessonDataByLessonId[lessonId],
                    blocksOrderDirty: value,
                },
            },
        }));
    },
    reorderBlocksLocal(lessonId, blocks) {
        get().ensureLessonData(lessonId);
        set((state) => ({
            lessonDataByLessonId: {
                ...state.lessonDataByLessonId,
                [lessonId]: {
                    ...state.lessonDataByLessonId[lessonId],
                    blocks,
                    blocksOrderDirty: true,
                },
            },
        }));
    },
    updateBlockMarkdownLocal(lessonId, blockId, markdown) {
        get().ensureLessonData(lessonId);
        set((state) => {
            const cur = state.lessonDataByLessonId[lessonId];
            const nextBlocks = (cur.blocks ?? []).map((b) => b.id === blockId ? { ...b, payload: { ...(b.payload ?? {}), markdown } } : b);
            return {
                lessonDataByLessonId: {
                    ...state.lessonDataByLessonId,
                    [lessonId]: { ...cur, blocks: nextBlocks },
                },
            };
        });
    },
    addBlockLocal(lessonId, block) {
        get().ensureLessonData(lessonId);
        set((state) => {
            const cur = state.lessonDataByLessonId[lessonId];
            return {
                lessonDataByLessonId: {
                    ...state.lessonDataByLessonId,
                    [lessonId]: { ...cur, blocks: [...(cur.blocks ?? []), block] },
                },
            };
        });
    },
    deleteBlockLocal(lessonId, blockId) {
        get().ensureLessonData(lessonId);
        set((state) => {
            const cur = state.lessonDataByLessonId[lessonId];
            return {
                lessonDataByLessonId: {
                    ...state.lessonDataByLessonId,
                    [lessonId]: { ...cur, blocks: (cur.blocks ?? []).filter((b) => b.id !== blockId) },
                },
            };
        });
    },
    setPatientsLoading(value) {
        set({ patientsLoading: value });
    },
    setAssignmentsLoading(value) {
        set({ assignmentsLoading: value });
    },
    setPatients(patients) {
        set({ patients });
    },
    setCourseAssignments(assignments) {
        set({ courseAssignments: assignments });
    },
}));
