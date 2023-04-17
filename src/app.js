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



client.connect().then(() => {
	db = client.db();
    console.log('teste');
}).catch((err) => console.log(err.message))



console.log('vamo nessa, testando uol backend');

app.post('/participants', async (req, res) =>{
    const {name} = req.body;
    const validation = nameSchema.validate(name);
    if(validation.error){
        return res.sendStatus(422);
    }

    try{
        const exists = await db.collection("participants").findOne({name: name});
        if(exists){
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
            time: `${new Date(userReady.lastStatus).toLocaleTimeString()}`
        }
        await db.collection('messages').insertOne(text);
    } catch(err){
        res.sendStatus(500);
    }
})


app.listen(5000, () => {

});