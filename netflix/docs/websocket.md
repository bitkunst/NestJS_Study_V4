## Websocket

### Websocket이란?

-   TCP 연결 하나로 완전한 리얼타임 양방향 통신이 가능하다
-   요청 응답마다 단발적인 연결이 생성되는 HTTP와 다르게 Websocket은 지속적인 연결을 유지한다
-   레이턴시(Latency)가 낮다
-   Hand Shake 이후 최소한의 데이터만 서로 전송하기 때문에 데이터 전송량을 최소화 할 수 있다
-   양방향 통신이 가능하기 때문에 클라이언트와 서버 사이드 그 어디든 먼저 통신을 주도할 수 있다

### Socket IO

-   Socket IO는 `Websocket 프로토콜을 사용해서 만든` low-latency(낮은 지연시간), bidirectional(양방향 소통), event based(이벤트 기반)으로 클라이언트와 서버가 통신할 수 있게 해주는 기능
-   Websocket 프로토콜을 사용했고, 조금 더 효율적으로 잘 쓸 수 있게 패키징된 게 Socket IO

```sh
$ npm i @nestjs/websockets socket.io @nestjs/platform-socket.io
```

<br/>

## Socket IO의 주요 기능

### 폴백 메커니즘

-   Websocket이 지원되지 않거나 문제가 생긴 상황에서도 통신이 유지되도록 다양한 프로토콜을 같이 사용한다

### 이벤트 기반 아키텍처

-   특정 메시지를 listening 하고 있는 이벤트 기반의 아키텍처를 사용한다

### Room & Namespace

-   Namespace를 이용해서 효율적으로 연결을 나누고 Room을 이용해서 Broadcasting을 조율한다

<br />

## Namespace & Room

### Namespace

-   Socket IO에서 리소스를 나누는 방법이다
-   REST API URL처럼 정의하며 비즈니스 로직과 이벤트를 격리하는데 사용된다

```js
const io = require('socket.io')(3000);

const chatNamespace = io.of('/chat');
chatNamespace.on('connection', (socket) => {
    console.log('User connected to chat namespace');
    socket.on('message', (msg) => {
        console.log('Chat message:', msg);
    });
});

const newsNamespace = io.of('/news');
newsNamespace.on('connection', (socket) => {
    console.log('User connected to news namespace');
    socket.on('update', (news) => {
        console.log('News update:', news);
    });
});
```

### Room

-   Namespace에서 한번 더 그룹으로 나눌 수 있게 해준다
-   하나의 연결은 여러 개의 Room에 동시에 들어갈 수 있으며 Broadcasting에 유용하다

```js
const io = require('socket.io')(3000);

io.on('connection', (socket) => {
    console.log('User connected');

    // Room 입장하기
    socket.join('room1');

    // 'room1'에 브로드캐스팅
    socket.to('room1').emit('message', 'Hello, room1!');

    // Room 나오기
    socket.leave('room1');
});
```
