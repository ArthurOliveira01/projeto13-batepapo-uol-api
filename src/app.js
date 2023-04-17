import cors from 'cors';
import express from 'express';
import Joi from 'joi';

const app = express();
app.use(cors());
app.use(express.json());


const participants = Joi.object({
    name: Joi.string
})


console.log('vamo nessa, testando uol backend');

app.post('/participants', (req, res) =>{
    const name = req.body;
    if(name.length === 0){
        res.status(422);
    }
})


app.listen(5000, () => {

});