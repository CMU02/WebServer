const path = require('path');
// Express 모듈을 불러옵니다.
const express = require('express');
// Express 애플리케이션을 생성합니다.
const session = require('express-session');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { User, sequelize } = require('./src/db_manager');
const { users_data } = require('./src/db_manager/make_dummy');

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
  .get(async(req, res) => {
    const { id } = req.query;

    if(!id) {
      await User.findAll().then((users) => {
        res.json(users);
      });
    } else {
      await User.findOne({where: {id}}).then((user) => {
        if(user) {
          res.json(user);
        } else {
          res.status(404).send('사용자를 찾을 수 없습니다.');
        }
      });
    }
  })
  .post(async(req, res) => {
    const {id, username, password, age} = req.body;
    const findUser = await User.findOne({where: {id}});

    if(findUser.id === id) {
      res.status(400).send('이미 존재하는 사용자입니다.');
    } else {
      await User.create({id, username, password, age});
      res.send('사용자가 생성되었습니다.');
    }
  })
  .put(async(req, res) => {
    const { id, username, password, age } = req.body;
    const findUser = await User.findOne({where: {id}});

    if(findUser.id !== id) {
      res.status(400).send('해당 사용자가 없습니다.');
    } else {
      await User.update({username, password, age}, {where: {id}});
      res.send('사용자 정보가 수정되었습니다.');
    }
  })
  .delete(async(req, res) => {
    const {id} = req.body;
    const findUser = await User.findOne({where: {id}});
    if(findUser.id !== id) {
      res.status(400).send('해당 사용자가 없습니다.');
    } else {
      User.destroy({ where: { id } }).then(() => {
        res.send("사용자 정보가 삭제되었습니다.");
      });
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
app.listen(PORT, async() => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    await User.sync({ force: true });

    for (const user of users_data) {
      await User.create(user);
    }
  } catch (error) {
    console.log("Unable to connect to the database: ", error);
  }
  console.log(`Server is running in port ${PORT}`);
});


