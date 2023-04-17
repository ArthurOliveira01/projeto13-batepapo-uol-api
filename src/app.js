import cors from 'cors';
import express from 'express';
import dotenv from 'dotenv';
import Joi from 'joi';
import {MongoClient} from 'mongodb';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const client = new MongoClient(process.env.DATABASE_URL);
let db;

const nameSchema = Joi.object({
    name: Joi.string().min(1)
});

const messageSchema = Joi.object({
    to: Joi.string().required().not().empty(),
    text: Joi.string().required().not().empty(),
    type: Joi.string().required().valid('message', 'private_message')
});

const limitSchema = Joi.object({
	limit: Joi.number().min(1).integer()
});

const pstmessageSchema = Joi.object({
	from: Joi.string().required(), 
	to: Joi.string().required().min(1).max(20),
	text: Joi.string().required().min(1).max(90),
	type: Joi.string().required().valid("message", "private_message"),
	time: Joi.string()
});


client.connect().then(() => {
	db = client.db();
    console.log('teste');
}).catch((err) => console.log(err.message))



console.log('vamo nessa, testando uol backend');

app.post('/participants', async (req, res) =>{
    const {name} = req.body;
    const validation = nameSchema.validate(req.body);

    try{
        if(validation.error){
            console.log('foi errado')
            return res.sendStatus(422);
        }
        const exists = await db.collection("participants").findOne({name: name});
        if(exists){
            console.log('já tem alguem assim ai')
            return res.sendStatus(409);
        }
        const userReady = {
            name: name,
            lastStatus: Date.now()
        };
        const sent = await db.collection('participants').insertOne(userReady);
        const text = {
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: `${new Date(userReady.lastStatus).toLocaleTimeString('pt-br')}`
        }
        await db.collection('messages').insertOne(text);
        res.sendStatus(201);
    } catch(err){
        res.sendStatus(500);
    }
});

app.get('/participants', async (req, res) => {
    try{
        const online = await db.collection("participants").find().toArray();
        if(online.length === 0){
            res.send([]);
        } else{
            res.send(online);
        }
    } catch(err){
        return res.sendStatus(500);
    }
});

app.post('/messages', async (req, res) => {
    const {to, text, type} = req.body;
    const {user} = req.headers;
    const time = Date.now();
    
	
    try{
	   const information = {from: user, to, text, type, new Date(time).toLocaleTimeString('pt-br')}
	   const validation = pstmessageSchema.validate(information, {abortEarly: false});
	   if(validation.error){
	   	return res.sendStatus(422);
	   }
	   await db.collection("messages").insertOne(information);
	   res.sendStatus(200);
								   
	} catch{
		res.sendStatus(500);    
	}

});

app.get('/messages', async (req, res) => {
	const {limit} = req.query;
	const {user} = req.headers;
	
	const validation = limitSchema.validate({limit});
	if(validation.error){
		return res.sendStatus(422);
	}
	
	try{
		const messages = await db.collection("messages").find({$or: [{to: 'Todos}, {to: user}, {from: user}]}).toArray();
		res.send(messages.splice(messages.length - limit, limit));
	}catch{
		res.sendStatus(500);
	}
});


app.listen(5000);
