# Redis Caching Setup Guide

## Overview
We've implemented a Redis caching layer using Upstash Redis for your application to improve performance. This guide will help you configure the environment variables for the caching implementation.

## Upstash Redis Configuration

Since you already have Upstash Redis instances set up, you just need to configure the environment variables to connect to your Upstash Redis database.

## Environment Variables

Add these variables to your `.env.local` file:

```env
# Upstash Redis Configuration
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
```

You can find these values in your Upstash dashboard:
1. Go to https://console.upstash.com/
2. Select your Redis database
3. Copy the REST URL and REST Token from the connection details

## Production Configuration

For production deployment, make sure to add the same environment variables to your hosting platform:

- **Vercel**: Add them in your project settings under Environment Variables
- **Netlify**: Add them in your site settings under Environment Variables
- **Railway**: Add them in your project's Variables section
- **Other platforms**: Follow their specific documentation for environment variables

## Caching Implementation Status

### ✅ Phase 1 - Static Data (Completed)
- Sports data with translations
- Facilities, Countries, States, Cities
- Genders and Spoken Languages
- Basic academy information

### 🔄 Phase 2 - Academy-Specific Data (In Progress)
- Academy programs and packages
- Coach information
- Location/branch details
- Discounts and promotional data

### ⏳ Phase 3 - Real-time Data (Planned)
- Real-time booking data
- Live session information
- Dynamic calendar data

## Testing the Implementation

Once you've added the environment variables, you can test the Redis connection by:

1. Starting your development server: `npm run dev`
2. Check the console for any Redis connection errors
3. Test any cached endpoints (sports data is already cached)

## Cache Invalidation

The system automatically handles cache invalidation when data is modified:
- Creating, updating, or deleting sports invalidates sports cache
- Academy-specific operations invalidate related academy data
- Bulk operations properly invalidate dependent data

## Monitoring

You can monitor your Redis usage in the Upstash dashboard:
- Connection metrics
- Memory usage
- Request statistics
- Error rates

## Troubleshooting

If you encounter issues:

1. **Connection Errors**: Verify your UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
2. **Cache Miss**: Check if the data is being properly set in the cache
3. **Performance Issues**: Monitor cache hit rates in your Upstash dashboard

## Next Steps

After confirming the basic setup works:
1. Monitor cache hit rates for sports data
2. Gradually enable caching for more action files
3. Optimize cache TTL values based on usage patterns 