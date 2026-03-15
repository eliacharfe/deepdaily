// apps/web/app/curriculum/[id]/page.tsx

import CurriculumPageClient from "@/components/curriculum-page-client";

type Props = {
    params: Promise<{
        id: string;
    }>;
};

export default async function CurriculumPage({ params }: Props) {
    const { id } = await params;

    return <CurriculumPageClient curriculumId={id} />;
}