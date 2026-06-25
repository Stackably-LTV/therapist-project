import { redirect } from 'next/navigation';
export default async function CourseLearnPage({ params, }) {
    const { courseId } = await params;
    redirect(`/seeker/courses/${courseId}`);
}
