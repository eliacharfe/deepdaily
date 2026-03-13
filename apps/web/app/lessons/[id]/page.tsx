

import LearnPageClient from "@/components/learn-page-client";

type Props = {
    params: Promise<{
        id: string;
    }>;
};

export default async function LessonPage({ params }: Props) {
    const { id } = await params;

    return <LearnPageClient lessonId={id} />;
}