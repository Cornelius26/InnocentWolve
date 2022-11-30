import mongoose from 'mongoose';

import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);


dotenv.config(__dirname);

process.env.TZ = 'Europe/Berlin';


const MONGO_URI = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@innocentwolvedata.5rhmcnq.mongodb.net/${process.env.ENVIROMENT}?retryWrites=true&w=majority`;
console.log(MONGO_URI);

mongoose.connect(
	MONGO_URI,
	{ useNewUrlParser: true, useUnifiedTopology: true },
);
export default mongoose;
