import { WebSocket, WebSocketServer} from 'ws'
import { RateLimiterMemory } from "rate-limiter-flexible";

const matchSubscribers=new Map();

function subscribe(matchId,socket){
    if(!matchSubscribers.has(matchId)){
        matchSubscribers.set(matchId,new Set());
    }
    matchSubscribers.get(matchId).add(socket);
}

function unsubscribe(matchId,socket){
    const subscribers=matchSubscribers.get(matchId);
    if(!subscribers){
        return;
    }
    subscribers.delete(socket);
    if(subscribers.size===0){
        matchSubscribers.delete(matchId);
    }
}

function cleanupSubscriptions(socket){
    if(!socket.subscriptions) return;

    for(const matchId of socket.subscriptions){
        unsubscribe(matchId,socket);
    }
}

const wsLimiter = new RateLimiterMemory({
    points: 5,
    duration: 2
});
function sendJson(socket,payload){
    if(socket.readyState!==WebSocket.OPEN) return;
    
    socket.send(JSON.stringify(payload));
}

function broadcastToAll(wss,payload){
    for(const client of wss.clients){
        if(client.readyState!==WebSocket.OPEN) continue;

        client.send(JSON.stringify(payload));
    }
}

function handleMessage(socket, data){
    let message;

    try{
        message = JSON.parse(data.toString());
    }
    catch(e){
        sendJson(socket,{
            type:'error',
            details:'Invalid JSON'
        });
        return;
    }

    const matchId = Number(message.matchId);

    if(message?.type === 'subscribe' && Number.isInteger(matchId)){
        subscribe(matchId, socket);

        socket.subscriptions.add(matchId);

        sendJson(socket,{
            type:'subscribed',
            details: matchId
        });

        return;
    }

    if(message?.type === 'unsubscribe' && Number.isInteger(matchId)){
        unsubscribe(matchId, socket);

        socket.subscriptions.delete(matchId);

        sendJson(socket,{
            type:'unsubscribed',
            details: matchId
        });

        return;
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

        socket.subscriptions=new Set();
        
        sendJson(socket,{
            type:'Welcome!'
        });

        socket.on('message',(data)=>{
            handleMessage(socket,data);
        })

        socket.on('error',()=>{
            socket.terminate();
        })

        socket.on('close',()=>{
            cleanupSubscriptions(socket);
        })

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
        broadcastToAll(wss,{
            type:'match-created',
            data:match
        });
    }

    function broadcastCommentary(matchId,comment){
        broadcastToMatch(matchId,{type:'commentary',details:comment});
    }

    return {
        broadcastMatchCreated,
        broadcastCommentary
    };
}

function broadcastToMatch(matchId,payload){
    const subscribers=matchSubscribers.get(matchId);
    if(!subscribers || subscribers.size===0){
        return;
    }
    const message=JSON.stringify(payload);
     
    for(const client of subscribers){
        if(client.readyState===WebSocket.OPEN){
            client.send(message);
        }
    }
}