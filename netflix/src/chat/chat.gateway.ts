import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { UseInterceptors } from '@nestjs/common';
import { WsTransactionInterceptor } from 'src/common/interceptor/ws-transaction.interceptor';
import { WsQueryRunner } from 'src/common/decorator/ws-query-runner.decorator';
import { QueryRunner } from 'typeorm';
import { CreateChatDto } from './dto/create-chat.dto';

// Websocket 인증
// -> 처음에 연결할 때에만 인증된 사용자인지 확인
// -> 메시지를 보낼 때마다 인증할 필요 X
@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private readonly chatService: ChatService,
        private readonly authService: AuthService,
    ) {}

    handleDisconnect(client: Socket) {
        const user = client.data.user;
        if (user) {
            this.chatService.removeClient(user.sub);
        }
        return;
    }

    // 해당 게이트웨이에 연결시 handleConnection 메소드 호출
    async handleConnection(client: Socket) {
        // 인증 프로세스 구현 (토큰 검증)
        try {
            const rawToken = client.handshake.headers.authorization;

            const payload = await this.authService.parseBearerToken(rawToken ?? '', false);

            if (payload) {
                client.data.user = payload;
                this.chatService.registerClient(payload.sub, client);
                await this.chatService.joinUserRooms(payload, client);
            } else {
                client.disconnect();
            }
        } catch (error) {
            console.error(error);
            client.disconnect();
        }
    }

    @SubscribeMessage('sendMessage')
    @UseInterceptors(WsTransactionInterceptor)
    async handleMessage(
        @MessageBody() body: CreateChatDto,
        @ConnectedSocket() client: Socket,
        @WsQueryRunner() qr: QueryRunner,
    ) {
        const payload = client.data.user;
        await this.chatService.createMessage(payload, body, qr);
    }

    // @SubscribeMessage() 파라미터로 이벤트명 전달
    @SubscribeMessage('receiveMessageTest')
    async receiveMessage(@MessageBody() data: { message: string }, @ConnectedSocket() client: Socket) {
        // @MessageBody(): 클라이언트에서 전송한 데이터
        // @ConnectedSocket(): 연결된 클라이언트의 정보 (일종의 request context)
        console.log('receiveMessage');
        console.log(data);
        console.log(client);
    }

    @SubscribeMessage('sendMessageTest')
    async sendMessage(@MessageBody() data: { message: string }, @ConnectedSocket() client: Socket) {
        // client.emit(): 클라이언트에 메시지 전송
        // client.emit() 첫번째 파라미터 -> 클라이언트가 리스닝 하고 있는 이벤트명 전달
        client.emit('sendMessage', {
            ...data,
            from: 'server',
        });
    }
}
