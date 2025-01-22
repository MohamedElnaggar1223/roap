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

export async function getPlaceId(name: string): Promise<string | null> {
    try {
        console.log('Fetching place ID for:', encodeURIComponent(name))
        const encodedName = name.replace(/\s+/g, '-');
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(encodedName)}&key=${GOOGLE_API_KEY}`,
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
            console.log(data.results)
            if (data.results.length === 1) {
                return data.results[0].place_id;
            }

            const uaeLocation = data.results.find(place =>
                place.formatted_address.includes('United Arab Emirates') ||
                place.formatted_address.includes('UAE') ||
                place.formatted_address.includes('Dubai') ||
                place.formatted_address.includes('Abu Dhabi')
            );

            console.log("Uae Location: ", uaeLocation)
            console.log(data.results)

            return uaeLocation ? uaeLocation.place_id : data.results[0].place_id;
        }

        return null
    } catch (error) {
        console.error('Error fetching place ID:', error)
        throw error
    }
}

export async function getPlaceDetails(placeId: string): Promise<{ rating: number; reviews: any[], latitude: number, longitude: number } | null> {
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
                latitude: data.result.geometry.location.lat,
                longitude: data.result.geometry.location.lng,
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