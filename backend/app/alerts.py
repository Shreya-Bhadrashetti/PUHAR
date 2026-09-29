import asyncio
from fastapi import WebSocket


class AlertHub:
    def __init__(self): self.clients: set[WebSocket] = set()
    async def connect(self, socket: WebSocket):
        await socket.accept(); self.clients.add(socket)
    def disconnect(self, socket: WebSocket): self.clients.discard(socket)
    async def broadcast(self, alert: dict):
        for client in list(self.clients):
            try: await client.send_json(alert)
            except Exception: self.disconnect(client)


alert_hub = AlertHub()
