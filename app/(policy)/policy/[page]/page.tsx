import { notFound } from 'next/navigation'
import { db } from '@/db/index'
import { pages, pageTranslations } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import Image from 'next/image'

interface PolicyPageProps {
    params: Promise<{ page: string }>;
}

export async function generateStaticParams() {
    const allPages = await db.select({ orderBy: pages.orderBy }).from(pages);
    return allPages.map((page) => ({
        page: page.orderBy,
    }));
}

export default async function PolicyPage({ params }: PolicyPageProps) {
    const { page } = await params;

    const locale = 'en';

    const pageData = await db
        .select({
            id: pages.id,
            orderBy: pages.orderBy,
            title: pageTranslations.title,
            content: pageTranslations.content,
            createdAt: pages.createdAt,
            updatedAt: pages.updatedAt,
        })
        .from(pages)
        .leftJoin(pageTranslations, eq(pages.id, pageTranslations.pageId))
        .where(
            and(
                eq(pages.orderBy, page),
                eq(pageTranslations.locale, locale)
            )
        )
        .limit(1);

    if (pageData.length === 0) {
        notFound();
    }

    const { title, content } = pageData[0];

    return (
        <article className="max-w-2xl mx-auto py-8">
            <h1 className="text-3xl font-bold mb-4">{title}</h1>
            <div dangerouslySetInnerHTML={{ __html: content || '' }} />
        </article>
    );
}

export const revalidate = 3600;

