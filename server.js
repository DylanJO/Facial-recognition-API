const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const knex = require('knex');
const register = require('./Controllers/register')
const image = require('./Controllers/image')


const database = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      port : 5432,
      user : 'postgres',
      password : 'test',
      database : 'smartbrain'
    }
  });

// database.select('*').from('users').then(data => {
//     console.log(data, "- data log");
// }); // Check if DB working

const app = express();
//middleware so json and body reqs work
app.use(express.urlencoded({extended: false}));
app.use(express.json());

//disables cors policy so app works
app.use(cors());

// index page, currently returns all users
// app.get('/', (req, res)=> {
//     res.json(database.users);
// })

app.post('/signIn', (req, res)=> {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json('invalid form submission');
    }
    database.select('email', 'hash').from('login')
    .where('email', '=', email)
    .then(data => {
        const isValid = bcrypt.compareSync(password, data[0].hash);
        if (isValid) {
            return database.select('*').from('users')
            .where('email', '=', email)
            .then(user => {
                res.json(user[0])
            })
            .catch(err => res.status(400).json('unable to get user'))
        } else {
            res.status(400).json('incorrect credentials');
        }
    })
    .catch(err => res.status(400).json('incorrect credentials'))
})

// register a new user
app.post('/register', (req, res) => { register.handleRegister(req, res, bcrypt, database) })


// go to profile of user by ID, loops over database at the moment
app.get('/profile/:id', (req, res)=> {
    const { id } = req.params;
    database.select('*').from('users').where({id}).then(user => {
        if (user.length) {
            res.json(user[0])
        } else {
            res.status(400).json('Not found') // responds with an empty array not an error which is why we do this instead of the catch
        }
    })
    .catch(err => res.status(400).json('error getting user'))

})

// increases entries count
app.put('/image', (req, res)=> {image.handleImage(req, res, database)})
app.post('/imageurl', (req, res)=> {image.handleApiCall(req, res)})

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log('app running');
})
