'use server'

import { db } from "@/db" // Assuming this is your Drizzle database instance
import { branches, reviews } from "@/db/schema" // Import your schema
import { eq } from "drizzle-orm"
import { fetchPlaceInformation, getPlaceDetails, getPlaceId } from "./reviews.actions" // The code you provided above

type Branch = {
    id: number;
    nameInGoogleMap: string | null;
    rate: number | null;
    reviews: number | null;
}

export async function updateBranchesWithGoogleData() {
    try {
        // 1. Fetch all branches that have a nameInGoogleMap
        const branchesData = await db.query.branches.findMany({
            where: (branches, { isNotNull }) => isNotNull(branches.nameInGoogleMap)
        }) as Branch[]

        console.log(`Found ${1} branches to process`)

        // 2. Process each branch
        for (const branch of branchesData) {
            if (!branch.nameInGoogleMap) continue

            console.log(`Processing branch: ${branch.nameInGoogleMap}`)

            try {
                // 3. Fetch Google Places data
                const placeId = await getPlaceId(branch.nameInGoogleMap)

                if (!placeId) {
                    console.log(`No place ID found for ${branch.nameInGoogleMap}`)
                    continue
                }

                // Then get the details using that place_id
                const placeInfo = await getPlaceDetails(placeId)

                if (!placeInfo) {
                    console.log(`No place information found for ${branch.nameInGoogleMap}`)
                    continue
                }

                const { rating, reviews: googleReviews } = placeInfo

                // Update branch with place_id, rating and review count
                await db.update(branches)
                    .set({
                        placeId: placeId, // Add this line to store the place_id
                        rate: rating,
                        reviews: googleReviews?.length ?? 0,
                        updatedAt: new Date().toISOString()
                    })
                    .where(eq(branches.id, branch.id))

                if (!googleReviews?.length) continue
                // Process reviews
                for (const review of googleReviews) {
                    // Check if review already exists
                    const existingReview = await db.query.reviews.findFirst({
                        where: (reviews, { and, eq }) => and(
                            eq(reviews.branchId, branch.id),
                            eq(reviews.time, review.time)
                        )
                    })

                    if (!existingReview) {
                        // Insert new review using the place_id we got earlier
                        await db.insert(reviews).values({
                            branchId: branch.id,
                            placeId: placeId, // Use the place_id we got from the search
                            authorName: review.author_name,
                            authorUrl: review.author_url || null, // Handle potential nulls
                            language: review.language || 'en', // Default to 'en' if not provided
                            originalLanguage: review.original_language || review.language || 'en',
                            profilePhotoUrl: review.profile_photo_url || null,
                            rating: review.rating,
                            relativeTimeDescription: review.relative_time_description,
                            text: review.text,
                            time: review.time,
                            translated: review.translated || false,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        })
                    }
                }

                console.log(`Successfully updated branch ${branch.nameInGoogleMap}`)

                // Add delay to respect API rate limits
                await new Promise(resolve => setTimeout(resolve, 1000))

            } catch (error) {
                console.error(`Error processing branch ${branch.nameInGoogleMap}:`, error)
                // Continue with next branch even if one fails
                continue
            }
        }

        console.log('Finished updating all branches')
        return { success: true }

    } catch (error) {
        console.error('Error in updateBranchesWithGoogleData:', error)
        throw error
    }
}