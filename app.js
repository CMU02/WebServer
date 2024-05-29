const path = require('path');
// Express 모듈을 불러옵니다.
const express = require('express');
// Express 애플리케이션을 생성합니다.
const session = require('express-session');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const JWT_SECRET_KEY = "helloworld";
const PORT = process.env.PORT || 3000;

const app = express();
// 기본 포트를 설정하거나 3000포트를 사용합니다.
app.use(session({
  secret: 'helloworld1234',
  resave: false,
  saveUninitialized: true
}));
app.use(bodyParser.json());
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header("Access-Control-Allow-Methods", 'GET, POST, PUT, DELETE');
  res.header("Access-Control-Allow-Headers", 'Content-Type, Authorization, Origin, X-Requested-With, Accept');

  if(req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

const loggingMiddleware = (req, res, next) => {
  console.log(`${req.method}, ${req.url}`)
  next();
}
const sessionAuthMiddleware = (req, res, next) => {
  if(req.session.user) {
    next();
  } else {
    res.status(401).send('인증되지 않은 사용자입니다.');
  }
}
const tokenAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader.split(' ')[1];

  if(!authHeader || !token) {
    return res.status(403).send('비정상 접근입니다.')
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    req.user = decoded;
  } catch (err) {
    console.log(err);
    return res.status(401).send('정상적이지 않은 토큰 입니다.')
  }
  next();
}


const users = [
  {id: "hong", name: "홍길동", pwd: '1234'},
  {id: "kim", name: "김길동", pwd: '1234'},
  {id: "so", name: "소길동", pwd: '1234'},
  {id: "na", name: "나길동", pwd: '1234'},
]
// 루트 경로 ('/')에 대한 GET 요청을 처리합니다.
app.get('/', tokenAuthMiddleware,(req, res) => {
    res.send(`Hello, ${req.user.name}`);
})
app.post('/', (req, res) => {
    res.send('Got a POST request');
})
app.put('/', (req, res) => {
    res.send('Got a PUT request');
})
app.delete('/', (req, res) => {
    res.send('Got a DELETE request');
})

app.post('/session/login', loggingMiddleware, (req, res) => {
  const {id, pwd} = req.body;
  const user = users.find(user => user.id === id && user.pwd === pwd);
  if (user) {
    req.session.user = {id : user.id, name : user.name};
    res.send('로그인 성공');
  } else {
    res.status(401).send('로그인 실패');
  }
});
app.get('/session/logout', (req, res) => {
  req.session.destroy();
  res.send('로그아웃 성공');
})


app.route('/user')
  .get(tokenAuthMiddleware,(req, res) => {
    const { id } = req.query;
    if(id) {
      const resultUser = users.find((userData) => userData.id === id);
      if(resultUser) {
        res.send(resultUser);
      } else {
        res.status(400).send("해당 사용자를 찾을 수 없습니다.")
      }
    } else {
      // id queryParam가 없는 경우, 모든 사용자 정보 반환
      return res.send(users);
    }
  })
  .post((req, res) => {
    const {id, name, pwd} = req.body;
    const findUser = users.find((user) => user.id === id); // 이미 존재하는 users 찾기
    const password = req.body.pwd; // password

    if (!findUser) { // 신규 유저일 경우
      if (password.length >= 8) {
        users.push({id : id, name : name, pwd : pwd}); // users 데이터 저장
        res.status(200).send(users)
      } else {
        res.status(400).send("비밀번호는 8자리 이상으로 설정 해주세요.");
      }
    } else {
      res.status(400).send("이미 존재하는 사용자입니다.");
    }
  })
  .put((req, res) => {
    const { id, name, pwd } = req.body;
    const findUser = users.find((user) => user.id === id);
    const password = req.body.pwd; // password

    if (!findUser) {
      res.status(400).send("해당 유저는 없는 유저 입니다.");
    } else {
      if (password.length >= 8) {
        findUser.name = name; // 이름 변경
        findUser.pwd = pwd; // 비밀번호 변경

        let updateJsonArray = JSON.stringify(users); // Obejct -> JSON 배열 생성

        res.send(updateJsonArray);
      } else {
        res.status(400).send("비밀번호는 8자리 이상으로 설정 해주세요.");
      }
    }
  })
  .delete((req, res) => {
    const {id} = req.body;
    const findUser = users.find((user) => user.id === id);

    if(!findUser) {
      res.status(400).send("해당 유저는 없는 유저 입니다.");
    } else {
      const index = users.indexOf(findUser); // 찾은 유저 JSON 배열 인덱스
      users.splice(index, 1); // 찾은 유저 데이터 삭제

      res.send(users);
    }
  })

app.post('/token/login', (req, res) => {
  const {id, pwd} = req.body;
  const user = users.find(user => user.id === id && user.pwd === pwd);
  if(user) {
    const token = jwt.sign(
      {id: user.id, name: user.name}, 
      JWT_SECRET_KEY, 
      {expiresIn:'1h'}
    );
    res.json({token, username:user.name});
  } else {
    res.status(401).send('로그인 실패')
  }
});



// 서버를 설정한 포트에서 실행합니다.
app.listen(PORT, () => {
    console.log(`Server is running in port ${PORT}`);
})


