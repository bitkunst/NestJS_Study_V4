import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Socket } from 'socket.io';

@WebSocketGateway()
export class ChatGateway {
    constructor(private readonly chatService: ChatService) {}

    // @SubscribeMessage() 파라미터로 이벤트명 전달
    @SubscribeMessage('receiveMessage')
    async receiveMessage(@MessageBody() data: { message: string }, @ConnectedSocket() client: Socket) {
        // @MessageBody(): 클라이언트에서 전송한 데이터
        // @ConnectedSocket(): 연결된 클라이언트의 정보 (일종의 request context)
        console.log('receiveMessage');
        console.log(data);
        console.log(client);
    }

    @SubscribeMessage('sendMessage')
    async sendMessage(@MessageBody() data: { message: string }, @ConnectedSocket() client: Socket) {
        // client.emit(): 클라이언트에 메시지 전송
        // client.emit() 첫번째 파라미터 -> 클라이언트가 리스닝 하고 있는 이벤트명 전달
        client.emit('sendMessage', {
            ...data,
            from: 'server',
        });
    }
}
