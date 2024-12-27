'use server'

type PlaceSearchResponse = {
    status: string;
    results: Array<{
        place_id: string;
        [key: string]: any;
    }>;
}

type PlaceDetailsResponse = {
    status: string;
    result: {
        rating: number;
        reviews: Array<any>;
        [key: string]: any;
    };
}

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY

if (!GOOGLE_API_KEY) {
    throw new Error('Missing GOOGLE_MAPS_API_KEY environment variable')
}

async function getPlaceId(name: string): Promise<string | null> {
    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(name)}&key=${GOOGLE_API_KEY}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = (await response.json()) as PlaceSearchResponse

        if (data.status === 'OK' && data.results.length > 0) {
            return data.results[0].place_id
        }

        return null
    } catch (error) {
        console.error('Error fetching place ID:', error)
        throw error
    }
}

async function getPlaceDetails(placeId: string): Promise<{ rating: number; reviews: any[] } | null> {
    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = (await response.json()) as PlaceDetailsResponse

        if (data.status === 'OK') {
            return {
                rating: data.result.rating,
                reviews: data.result.reviews,
            }
        }

        return null
    } catch (error) {
        console.error('Error fetching place details:', error)
        throw error
    }
}

export async function fetchPlaceInformation(placeName: string) {
    try {
        const placeId = await getPlaceId(placeName)

        console.log('Place ID:', placeId)

        if (!placeId) {
            return null
        }

        const details = await getPlaceDetails(placeId)
        return details
    } catch (error) {
        console.error('Error fetching place information:', error)
        throw error
    }
}