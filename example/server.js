const express = require('express');
const app = express();
const port = 999;

const http = require('http');
const server = http.createServer(app);  // express 앱을 http 서버에 올림

// 정적 파일 제공
app.use(express.static(__dirname + "/public"));

// 기본 라우트
app.get('/', (req, res) => {
    res.sendFile(__dirname + "/public/room.html");
});


let room = {};
let host;
let player_name;
let enter_ID;
let enter_password;


const players = {};   // 실제 플레이어
let host_color;
const spectators = []; // 3인 이상 접속자 → 관전자

// JSON 요청 파싱 설정
app.use(express.json());  // req.body를 사용할 수 있게 함

// POST 요청 처리 예시
app.post('/', (req, res) => {
    const data = req.body;      // 클라이언트가 보낸 JSON 데이터
    console.log("클라이언트 데이터:", data);
    host = data.host;
    player_name = data.name;
    if (host === true){  // 호스트 정보
        room[data.ID] = data.password;

        if(data.color === 'random'){
            if ( Math.random() < 0.5){
                players['green'] = 'host';
                host_color = 'green'
            }else{
                players['red'] = 'host';
                host_color = 'red'
            }
        } else if(data.color === 'green'){
            players['green'] = 'host';
            host_color = 'green'
        } else if(data.color === 'red'){
            players['red'] = 'host';
            host_color = 'red'
        }
        
    } else if(host === false){   // 게스트 정보
        enter_ID = data.ID;
        enter_password = data.password;

        if (players['green'] !== undefined && players['red'] !== undefined){
            spectators.push(true);
            
    } else {
            if (players['green'] === 'host'){
                players['red'] = 'guest'
            } else if(players['red'] === 'host'){
                players['green'] = 'guest'
            }
    }
}



    res.json({ success: true, message: "방 생성 완료" });
});


app.get('/:room_id', (req, res) => {
    const roomId = req.params.room_id;  // 클라이언트가 요청한 방 ID
    //console.log(roomId);
    //res.send(`방 ${roomId} 접속`);
    if (Object.keys(room).includes(roomId)){
        if(host){
            res.sendFile(__dirname + "/public/board6.html");
        } else if (!host){
            if(room[enter_ID] == enter_password){
                res.sendFile(__dirname + "/public/board6.html");
            } else{
                console.log('비밀번호가 틀렸습니다.');
            }
        } 
    } else {
        console.log('방이 존재하지 않습니다.');
    }

});






// 서버 시작
server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});

















// WebSocket 서버 생성
const ws = require('ws')
const webSocketServer = new ws.Server({server});






// 게임 플레이어 관리
const game_players = {};
const game_spectators = [];
let player_total = 0;

// WebSocket 이벤트 처리
webSocketServer.on("connection", (socket) => {
    let playerId;


    player_total += 1;  // 실제 접속자 수

    if (player_total === Object.keys(players).length + spectators.length){
        if (Object.keys(players).length === 1){ // host 방생성 후 입장
            playerId = host_color;
            game_players[playerId] = socket;

            socket.send(JSON.stringify({ type : 'player', player : players}));

            console.log(1);
            console.log(players);
            //console.log(game_players);

        } else if (Object.keys(players).length === 2 && spectators.length === 0){ // guest 선착순 입장
            if (host_color === 'green'){
                playerId = 'red'
            }else if (host_color === 'red')
                playerId = 'green'
            game_players[playerId] = socket;
            

            socket.send(JSON.stringify({ type : 'player', player : players}));

            game_players['green'].send(JSON.stringify({ type : 'start', turn : 'green'})); // 게임 시작

            console.log(2);
            console.log(players);
            //console.log(game_players);
        } else {
            playerId = 0;
            //socket.playerId = playerId;
            game_spectators.push(socket);

            socket.send(JSON.stringify({ type : 'spectators', player : spectators}));
            console.log(3);
            console.log(spectators);
            //console.log(game_spectators);
        }
    }else {
        console.log('부적절한 접근 감지');
        player_total -= 1;
        console.log(spectators);
        socket.send(JSON.stringify({ type: 'kick', reason: '인증 실패' }));
        return socket.close();
    }


    console.log(`접속: 플레이어ID=${playerId}, 총 인원수=${Object.keys(players).length + spectators.length}`);




    socket.on("message", (msg) => {
    const data = JSON.parse(msg);

        if (socket.playerId === 1) {
            console.log("흑이 보낸 메시지:", data);
        } else if (socket.playerId === 2) {
            console.log("백이 보낸 메시지:", data);
        } else {
            console.log("관전자가 보낸 메시지:", data);
        }
    });









    socket.on("error", (error) => {
    console.log(`에러 발생 : ${error} [${ip}]`);
    });

    socket.on("close", () => {
    console.log(`[${ip}] 연결 종료`);
    });
});

