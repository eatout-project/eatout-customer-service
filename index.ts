import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import knex from 'knex';
import {createAccount, login, verifyAccount} from "./controllers/account-controller";
import bodyParser from "body-parser";
import cors from 'cors';

dotenv.config();

const app: Express = express();
app.use(bodyParser.json());
app.use(cors());
const port = process.env.PORT;

const db = knex({
    client: 'mysql2',
    connection: {
        host: `${process.env.CUSTOMER_LOGIN_DB_HOST}`,
        port: parseInt(`${process.env.CUSTOMER_LOGIN_DB_PORT}`),
        user: `${process.env.CUSTOMER_LOGIN_DB_USER}`,
        database: `${process.env.CUSTOMER_LOGIN_DB}`
    }
});


app.post('/create-account', (req: Request, res: Response) => createAccount(req, res, db));

app.post('/login', (req: Request, res: Response) => login(req, res, db));

app.post('/verifyAccount', (req: Request, res: Response) => verifyAccount(req, res, db));

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});