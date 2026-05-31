import { WebSocket, WebSocketServer} from 'ws'
import { RateLimiterMemory } from "rate-limiter-flexible";

const wsLimiter = new RateLimiterMemory({
    points: 5,
    duration: 2
});
function sendJson(socket,payload){
    if(socket.readyState!==WebSocket.OPEN) return;
    
    socket.send(JSON.stringify(payload));
}

function broadcast(wss,payload){
    for(const client of wss.clients){
        if(client.readyState!==WebSocket.OPEN) continue;

        client.send(JSON.stringify(payload));
    }
}

export function attachWebSocketServer(server){
    const wss=new WebSocketServer({
        server,
        path:'/ws',
        maxPayload:1024*1024,
    })
    wss.on('connection', async (socket, req) => {
        const ip = req.headers['x-forwarded-for']?.split(',')[0] ||  req.socket.remoteAddress;
        try{
            await wsLimiter.consume(ip);
        }
        catch{
            socket.close(
                1008,
                "Rate limit exceeded"
            );
            return;
        }
        socket.isAlive = true;

        socket.on('pong',()=>{
            socket.isAlive = true;
        });

        sendJson(socket,{
            type:'Welcome!'
        });

        socket.on('error', console.error);

        socket.on('close', (code, reason) => {
            console.log(`Socket closed: ${code} ${reason}`);
        });
    });

    const interval=setInterval(()=>{
        wss.clients.forEach((ws)=>{
            if(ws.isAlive===false) return ws.terminate();
            ws.isAlive=false;
            ws.ping();
        })
    },30000);
    
    wss.on('close',()=>clearInterval(interval));

    function broadcastMatchCreated(match){
        broadcast(wss,{
            type:'match-created',
            data:match
        });
    }
    return {
        broadcastMatchCreated
    };
}

