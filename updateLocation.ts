'use server'
import { db } from '@/db'
import { branches, reviews } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { fetchPlaceInformation, getPlaceId } from './lib/actions/reviews.actions'

export async function updateLocationGoogleData(branchId: number, customGoogleMapName: string) {
    try {
        // Fetch new Google data using the provided custom name
        const ratesAndReviews = await fetchPlaceInformation(customGoogleMapName)
        const placeId = await getPlaceId(customGoogleMapName)

        if (!ratesAndReviews) {
            return {
                error: 'Could not fetch information from Google for this name',
                field: 'customGoogleMapName'
            }
        }

        // Get the branch to make sure it exists and to get academic ID for revalidation
        const branch = await db.query.branches.findFirst({
            where: (branches, { eq }) => eq(branches.id, branchId),
            columns: {
                academicId: true,
            }
        })

        if (!branch) {
            return { error: 'Location not found', field: 'branchId' }
        }

        return await db.transaction(async (tx) => {
            // Update branch with new Google data
            await tx.update(branches)
                .set({
                    latitude: ratesAndReviews?.latitude?.toString() ?? '',
                    longitude: ratesAndReviews?.longitude?.toString() ?? '',
                    rate: ratesAndReviews?.rating ?? null,
                    reviews: ratesAndReviews?.reviews?.length ?? null,
                    placeId: placeId ?? null,
                    updatedAt: sql`now()`
                })
                .where(eq(branches.id, branchId))

            // If we have new reviews and a place ID, update the reviews
            if (ratesAndReviews?.reviews && placeId) {
                // First, delete existing reviews for this branch
                await tx.delete(reviews)
                    .where(eq(reviews.branchId, branchId))

                // Then insert new reviews
                await tx.insert(reviews).values(
                    ratesAndReviews.reviews.map((review: any) => ({
                        branchId: branchId,
                        placeId: placeId,
                        authorName: review.author_name,
                        authorUrl: review.author_url || null,
                        language: review.language || 'en',
                        originalLanguage: review.original_language || review.language || 'en',
                        profilePhotoUrl: review.profile_photo_url || null,
                        rating: review.rating,
                        relativeTimeDescription: review.relative_time_description,
                        text: review.text,
                        time: review.time,
                        translated: review.translated || false,
                        createdAt: sql`now()`,
                        updatedAt: sql`now()`
                    }))
                )
            }

            return {
                success: true,
                data: {
                    placeId,
                    reviewCount: ratesAndReviews?.reviews?.length ?? 0,
                    rating: ratesAndReviews?.rating,
                    latitude: ratesAndReviews?.latitude,
                    longitude: ratesAndReviews?.longitude
                }
            }
        })
    } catch (error) {
        console.error('Error updating location Google data:', error)
        return { error: 'Failed to update location data from Google' }
    }
}

updateLocationGoogleData(1193, "Flying+Roses+(Rhythmic+Gymnastics+&+Taekwondo)+AL+Khan")