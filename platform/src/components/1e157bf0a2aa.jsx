import { redirect } from 'next/navigation';
export default async function CourseDetailPage({ params, }) {
    const { courseId } = await params;
    redirect(`/seeker/courses/${courseId}`);
}
