

import SavedLessonPageClient from "@/components/saved-lesson-page-client";

type Props = {
    params: Promise<{
        id: string;
    }>;
};

export default async function SavedLessonPage({ params }: Props) {
    const { id } = await params;
    return <SavedLessonPageClient lessonId={id} />;
}