import { RateLimiterMemory } from "rate-limiter-flexible";

const httpLimiter = new RateLimiterMemory({
    points: 50,
    duration: 10
});

function isSearchEngineBot(userAgent = "") {
    const bots = [
        "googlebot",
        "bingbot",
        "slurp",
        "duckduckbot",
        "baiduspider",
        "yandexbot"
    ];

    const ua = userAgent.toLowerCase();

    return bots.some(bot => ua.includes(bot));
}

export async function rateLimitMiddleware(req,res,next){
    try{
        await httpLimiter.consume(req.ip);

        // console.log("Allowed:", req.ip);

        next();
    }
    catch{
        // console.log("Blocked:", req.ip);

        res.status(429).json({
            error:"Too many requests"
        });
    }
}